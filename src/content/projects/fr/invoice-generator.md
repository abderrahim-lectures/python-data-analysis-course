---
title: "Générateur de Factures"
description: "Générez des factures professionnelles à partir de modèles avec export PDF et suivi des paiements."
difficulty: "intermediate"
estimatedMinutes: 50
tags: ["cli", "pdf", "data-pipeline"]
learningObjectives:
  - "Modéliser les données de facture comme des dataclasses Python avec lignes et totaux"
  - "Générer des factures PDF professionnelles avec ReportLab"
  - "Calculer automatiquement les sous-totaux, les taxes et les totaux"
  - "Suivre le statut de paiement et les dates d'échéance des factures générées"
prerequisites: ["Python 101"]
---

# 🧾 Construire un Générateur de Factures

Chaque indépendant et chaque petite entreprise finit par faire face à la même tâche : transformer une feuille de calcul du travail effectué en une facture professionnelle. Ce projet construit un outil Python qui prend des données de facture structurées — informations client, lignes avec quantités et tarifs, pourcentages de taxe — et génère un PDF soigné avec des totaux calculés, des numéros de facture et des dates d'échéance. Tu modéliseras les données, construirás le rendu PDF et suivraás le statut de paiement, tout depuis la ligne de commande.

Cela suppose Python 101 — rien de Analyse de Données n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Mettre en place un projet avec `uv` et installer les dépendances dont tu auras besoin.
2. Modéliser les données de facture comme des dataclasses Python avec les informations client, les lignes et les règles de taxe.
3. Construire un rendu PDF qui produit des factures professionnelles avec des totaux calculés.
4. Ajouter le suivi des paiements avec statut, dates d'échéance et détection de retard.
5. Câbler le tout dans un CLI qui crée des factures, les liste et vérifie leur statut.
6. Générer un rapport de synthèse des factures impayées et payées.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal — cet outil écrit des fichiers PDF sur le disque, ce qui nécessite un système de fichiers local.

**Google Colab, Kaggle Notebooks et Binder** fonctionnent pour essayer l'outil. Le notebook installe les mêmes packages et génère des factures d'exemple dans la session.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/invoice-generator/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/invoice-generator/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Finvoice-generator%2Fnotebook.fr.ipynb)

## Configuration

Tout ce dont tu as besoin avant de construire : un environnement Python, une bibliothèque PDF et un répertoire de projet.

### Installe `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Ferme et rouvre ton terminal, puis confirme :

```bash
uv --version
```

### Met en place le projet

```bash
uv init invoice-generator
cd invoice-generator
uv add click reportlab
```

`reportlab` est la bibliothèque Python standard pour générer des PDF de façon programmatique. `click` construit le CLI.

### Crée la structure du projet

```bash
mkdir -p invoicer
touch invoicer/__init__.py invoicer/models.py invoicer/pdf.py invoicer/tracker.py invoicer/cli.py
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `invoice-generator/` existe avec un `pyproject.toml`, et `click` et `reportlab` sont installés.
- ✅ Le répertoire `invoicer/` a tous les fichiers de modules requis.

## Étape 1 : Modélise les données de facture

Une facture a un en-tête (numéro, date, date d'échéance, statut), une section client (nom, adresse, email) et une liste de lignes (description, quantité, tarif). Modéliser cela en dataclasses garde les données propres et rend les méthodes de calcul naturelles.

### 1.1 Définis les modèles de données

**👟 Indice de départ :** Crée `invoicer/models.py` avec les classes `LineItem`, `Client` et `Invoice`.

```python
# invoicer/models.py
from dataclasses import dataclass, field
from datetime import date, timedelta
from enum import Enum

class InvoiceStatus(Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"

@dataclass
class LineItem:
    description: str
    quantity: float
    rate: float

    @property
    def total(self) -> float:
        return self.quantity * self.rate

@dataclass
class Client:
    name: str
    address: str = ""
    email: str = ""

@dataclass
class Invoice:
    invoice_number: str
    client: Client
    items: list[LineItem]
    tax_rate: float = 0.0  # as decimal, e.g. 0.1 for 10%
    issue_date: date = field(default_factory=date.today)
    due_days: int = 30
    status: InvoiceStatus = InvoiceStatus.DRAFT

    @property
    def subtotal(self) -> float:
        return sum(item.total for item in self.items)

    @property
    def tax_amount(self) -> float:
        return self.subtotal * self.tax_rate

    @property
    def total(self) -> float:
        return self.subtotal + self.tax_amount

    @property
    def due_date(self) -> date:
        return self.issue_date + timedelta(days=self.due_days)

    @property
    def is_overdue(self) -> bool:
        return self.status == InvoiceStatus.SENT and date.today() > self.due_date
```

Les décorateurs `@property` font ressembler les calculs à des attributs — `invoice.total` au lieu de `invoice.calculate_total()`. La propriété `is_overdue` combine le statut et la date : une facture n'est en retard que si elle a été envoyée et que la date d'échéance est passée. Une facture en brouillon ne peut pas être en retard parce qu'elle n'a pas encore été envoyée.

**🎯 Résultat attendu :** `LineItem("Consulting", 10, 150.0).total` retourne `1500.0`. Une `LineItem` avec une quantité de 0 a un total de 0.

**🩹 Si ça ne marche pas :** Si `total` retourne 0 quand il ne devrait pas, vérifie que `quantity` et `rate` sont des nombres (pas des chaînes). Si `is_overdue` est toujours `False`, le statut n'est peut-être pas `SENT`.

### 1.2 Vérifie les modèles

```python
# Quick test
from invoicer.models import Invoice, LineItem, Client, InvoiceStatus
from datetime import date

client = Client(name="Acme Corp", email="billing@acme.com")
items = [
    LineItem("Web Development", 40, 150.0),
    LineItem("Design Review", 10, 100.0),
]
inv = Invoice(invoice_number="INV-001", client=client, items=items, tax_rate=0.1)
assert inv.subtotal == 7000.0
assert inv.tax_amount == 700.0
assert inv.total == 7700.0
assert inv.status == InvoiceStatus.DRAFT
```

**🎯 Résultat attendu :** Toutes les assertions passent ; le total est la somme des lignes plus 10 % de taxe.

**🩹 Si ça ne marche pas :** Si le total est faux, vérifie que `tax_rate` est `0.1` (décimal), pas `10` (pourcentage).

### 1.3 Vérifie les modèles

**✅ Liste de vérification**

- ✅ `LineItem.total` calcule correctement quantité × tarif.
- ✅ `Invoice.subtotal` additionne tous les totaux des lignes.
- ✅ `Invoice.total` ajoute la taxe au sous-total.
- ✅ `is_overdue` retourne `True` seulement pour les factures envoyées dont la date d'échéance est passée.

**🤔 Question(s) socratique(s)**

- Si un client demande une remise de 5 % pour paiement anticipé, où dans le modèle l'ajouterais-tu ? Affecterait-elle `subtotal`, `tax_amount`, ou les deux ?
- La classe `Invoice` stocke un `tax_rate` plat. Comment supporterais-tu plusieurs taux de taxe (taxe d'État + taxe fédérale) sans changer les propriétés de calcul ?

## Étape 2 : Génère le PDF

ReportLab construit les PDF page par page, élément par élément. Tu créeras une fonction qui prend un objet `Invoice` et le rend comme un PDF d'aspect professionnel avec en-tête, informations client, tableau de lignes, totaux et instructions de paiement.

### 2.1 Construis le rendu PDF

**👟 Indice de départ :** Crée `invoicer/pdf.py` avec une fonction qui rend une `Invoice` dans un fichier PDF.

```python
# invoicer/pdf.py
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from invoicer.models import Invoice

def render_invoice(invoice: Invoice, output_path: str):
    """Render an Invoice object to a PDF file."""
    doc = SimpleDocTemplate(output_path, pagesize=A4,
                            leftMargin=25*mm, rightMargin=25*mm,
                            topMargin=25*mm, bottomMargin=25*mm)
    styles = getSampleStyleSheet()
    elements = []

    # Header
    elements.append(Paragraph(f"INVOICE #{invoice.invoice_number}", styles["Title"]))
    elements.append(Spacer(1, 12))

    # Client info
    elements.append(Paragraph(f"<b>Bill To:</b> {invoice.client.name}", styles["Normal"]))
    if invoice.client.address:
        elements.append(Paragraph(invoice.client.address, styles["Normal"]))
    if invoice.client.email:
        elements.append(Paragraph(invoice.client.email, styles["Normal"]))
    elements.append(Spacer(1, 12))

    # Dates
    elements.append(Paragraph(f"<b>Issue Date:</b> {invoice.issue_date}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Due Date:</b> {invoice.due_date}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Status:</b> {invoice.status.value.upper()}", styles["Normal"]))
    elements.append(Spacer(1, 18))

    # Line items table
    table_data = [["Description", "Qty", "Rate", "Total"]]
    for item in invoice.items:
        table_data.append([
            item.description,
            str(item.quantity),
            f"${item.rate:,.2f}",
            f"${item.total:,.2f}",
        ])

    table = Table(table_data, colWidths=[3*inch, 0.8*inch, 1.2*inch, 1.2*inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#ecf0f1")]),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 18))

    # Totals
    elements.append(Paragraph(f"<b>Subtotal:</b> ${invoice.subtotal:,.2f}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Tax ({invoice.tax_rate*100:.0f}%):</b> ${invoice.tax_amount:,.2f}", styles["Normal"]))
    elements.append(Paragraph(f"<b>TOTAL: ${invoice.total:,.2f}</b>", styles["Heading2"]))
    elements.append(Spacer(1, 24))

    # Footer
    elements.append(Paragraph("Thank you for your business!", styles["Normal"]))

    doc.build(elements)
    print(f"PDF saved to {output_path}")
```

Le `SimpleDocTemplate` gère la mise en page. Le `Table` avec `TableStyle` crée un tableau de lignes professionnel avec des couleurs de rangée alternées, des nombres alignés à droite et un en-tête sombre. Les éléments `Spacer` ajoutent de l'espace entre les sections. `Paragraph` avec des balises HTML (`<b>`) ajoute du texte en gras sans avoir besoin de définitions de styles séparées.

**🎯 Résultat attendu :** `render_invoice(invoice, "INV-001.pdf")` crée un fichier PDF avec le numéro de facture, les informations client, le tableau de lignes et les totaux.

**🩹 Si ça ne marche pas :** Si le PDF est vide, la liste `elements` est peut-être vide quand `doc.build()` est appelée. Si le tableau ne se rend pas, vérifie que `Table` et `TableStyle` sont importés de `reportlab.platypus`.

### 2.2 Vérifie la génération PDF

```python
from invoicer.models import Invoice, LineItem, Client
from invoicer.pdf import render_invoice
import os

client = Client(name="Test Client")
items = [LineItem("Service", 1, 100.0)]
inv = Invoice(invoice_number="T-001", client=client, items=items)
render_invoice(inv, "/tmp/test_invoice.pdf")
assert os.path.exists("/tmp/test_invoice.pdf")
assert os.path.getsize("/tmp/test_invoice.pdf") > 1000  # non-trivial size
```

**🎯 Résultat attendu :** Les deux assertions passent ; le PDF existe et fait plus de 1 Ko.

**🩹 Si ça ne marche pas :** Si le fichier fait 0 octet, `doc.build(elements)` a peut-être échoué silencieusement — vérifie les erreurs d'import.

### 2.3 Vérifie le rendu PDF

**✅ Liste de vérification**

- ✅ `render_invoice` crée un fichier PDF avec le bon numéro de facture.
- ✅ Le PDF inclut les lignes, le sous-total, la taxe et le total.
- ✅ Le PDF est un fichier valide avec une taille non triviale.

**🤔 Question(s) socratique(s)**

- Si tu voulais ajouter le logo de ton entreprise à la facture, où dans le pipeline de rendu le placerais-tu ? Quel élément ReportLab utiliserais-tu ?
- Le PDF est rendu une fois. Si les données de facture changent, tu devrais le régénérer. Comment implémenterais-tu un mode « aperçu » qui affiche la facture dans le terminal avant de l'enregistrer ?

## Étape 3 : Suis le statut de paiement

Les factures traversent un cycle de vie : brouillon → envoyée → payée (ou en retard). Suivre cela signifie stocker les données de facture de façon persistante et mettre à jour le statut à mesure que les paiements arrivent.

### 3.1 Construis le suiveur

**👟 Indice de départ :** Crée `invoicer/tracker.py` avec des fonctions pour enregistrer, charger et mettre à jour les factures.

```python
# invoicer/tracker.py
import json
from pathlib import Path
from datetime import date
from invoicer.models import Invoice, LineItem, Client, InvoiceStatus

INVOICES_DIR = Path("invoices")

def save_invoice(invoice: Invoice):
    """Save an invoice to a JSON file."""
    INVOICES_DIR.mkdir(exist_ok=True)
    data = {
        "invoice_number": invoice.invoice_number,
        "client": {"name": invoice.client.name, "address": invoice.client.address, "email": invoice.client.email},
        "items": [{"description": i.description, "quantity": i.quantity, "rate": i.rate} for i in invoice.items],
        "tax_rate": invoice.tax_rate,
        "issue_date": invoice.issue_date.isoformat(),
        "due_days": invoice.due_days,
        "status": invoice.status.value,
    }
    path = INVOICES_DIR / f"{invoice.invoice_number}.json"
    path.write_text(json.dumps(data, indent=2))
    print(f"Invoice saved to {path}")

def load_invoice(invoice_number: str) -> Invoice:
    """Load an invoice from its JSON file."""
    path = INVOICES_DIR / f"{invoice_number}.json"
    data = json.loads(path.read_text())
    client = Client(**data["client"])
    items = [LineItem(**i) for i in data["items"]]
    return Invoice(
        invoice_number=data["invoice_number"],
        client=client,
        items=items,
        tax_rate=data["tax_rate"],
        issue_date=date.fromisoformat(data["issue_date"]),
        due_days=data["due_days"],
        status=InvoiceStatus(data["status"]),
    )

def update_status(invoice_number: str, status: InvoiceStatus):
    """Update an invoice's status."""
    invoice = load_invoice(invoice_number)
    invoice.status = status
    save_invoice(invoice)
    print(f"Invoice {invoice_number} status: {status.value}")
```

Le stockage JSON est simple mais efficace : chaque facture est un fichier nommé `{invoice_number}.json`. La fonction `save_invoice` convertit la hiérarchie de dataclasses en un dictionnaire plat qui se sérialise proprement. `load_invoice` reconstruit les objets depuis le JSON. Ce motif un-fichier-par-facture est facile à versionner, à sauvegarder et à inspecter à la main.

**🎯 Résultat attendu :** `save_invoice(invoice)` crée `invoices/INV-001.json`. `load_invoice("INV-001")` retourne un objet `Invoice` identique.

**🩹 Si ça ne marche pas :** Si `load_invoice` échoue avec une `KeyError`, la structure JSON ne correspond pas au code de reconstruction — vérifie les noms de champs.

### 3.2 Vérifie le suiveur

```python
from invoicer.models import Invoice, LineItem, Client, InvoiceStatus
from invoicer.tracker import save_invoice, load_invoice, update_status

client = Client(name="Test Co")
items = [LineItem("Work", 5, 100.0)]
inv = Invoice(invoice_number="TR-001", client=client, items=items, tax_rate=0.1)
save_invoice(inv)

loaded = load_invoice("TR-001")
assert loaded.client.name == "Test Co"
assert loaded.total == 550.0

update_status("TR-001", InvoiceStatus.SENT)
reloaded = load_invoice("TR-001")
assert reloaded.status == InvoiceStatus.SENT
```

**🎯 Résultat attendu :** Toutes les assertions passent ; la facture fait l'aller-retour à travers le JSON correctement.

**🩹 Si ça ne marche pas :** Si `loaded.total` est faux, le taux de taxe ou les lignes n'ont pas été préservés pendant la sérialisation.

### 3.3 Vérifie le suivi

**✅ Liste de vérification**

- ✅ `save_invoice` crée un fichier JSON dans le répertoire `invoices/`.
- ✅ `load_invoice` reconstruit un objet Invoice identique.
- ✅ `update_status` change le statut et persiste le changement.

**🤔 Question(s) socratique(s)**

- Si deux factures ont le même numéro, la seconde enregistrée écrase la première. Comment détecterais-tu et empêcherais-tu les numéros de facture en double ?
- Les fichiers JSON fonctionnent pour un utilisateur unique. Comment migrerais-tu vers une base de données (SQLite, PostgreSQL) sans changer le modèle Invoice ?

## Étape 4 : Construis le CLI et le rapport de synthèse

Le CLI relie tout : créer des factures depuis la ligne de commande, lister les factures existantes, vérifier le statut de paiement et générer des rapports de synthèse.

### 4.1 Construis le CLI

**👟 Indice de départ :** Crée `invoicer/cli.py` avec des commandes pour créer, lister et rapporter les factures.

```python
# invoicer/cli.py
import json
import click
from invoicer.models import Invoice, LineItem, Client, InvoiceStatus
from invoicer.pdf import render_invoice
from invoicer.tracker import save_invoice, load_invoice, update_status, INVOICES_DIR

@click.group()
def cli():
    """Invoice Generator — create, track, and report on invoices."""
    pass

@cli.command()
@click.option("--number", required=True, help="Invoice number")
@click.option("--client", required=True, help="Client name")
@click.option("--items", required=True, help='JSON items: [{"desc":"Work","qty":1,"rate":100}]')
@click.option("--tax", default=0.0, help="Tax rate as decimal (e.g. 0.1 for 10%%)")
@click.option("--output", default=None, help="PDF output path")
def create(number, client, items, tax, output):
    """Create an invoice and generate a PDF."""
    items_list = [LineItem(i["desc"], i["qty"], i["rate"]) for i in json.loads(items)]
    inv = Invoice(
        invoice_number=number,
        client=Client(name=client),
        items=items_list,
        tax_rate=tax,
    )
    save_invoice(inv)
    pdf_path = output or f"{number}.pdf"
    render_invoice(inv, pdf_path)

@cli.command()
def list():
    """List all saved invoices."""
    if not INVOICES_DIR.exists():
        click.echo("No invoices found.")
        return
    for path in sorted(INVOICES_DIR.glob("*.json")):
        inv = load_invoice(path.stem)
        status_marker = " *" if inv.is_overdue else ""
        click.echo(f"  {inv.invoice_number} | {inv.client.name} | ${inv.total:,.2f} | {inv.status.value}{status_marker}")

@cli.command()
@click.argument("invoice_number")
@click.argument("status", type=click.Choice(["sent", "paid"]))
def status_cmd(invoice_number, status):
    """Update an invoice's payment status."""
    update_status(invoice_number, InvoiceStatus(status))

@cli.command()
def report():
    """Show a summary of all invoices."""
    if not INVOICES_DIR.exists():
        click.echo("No invoices to report.")
        return
    total_outstanding = 0.0
    total_paid = 0.0
    overdue_count = 0
    for path in sorted(INVOICES_DIR.glob("*.json")):
        inv = load_invoice(path.stem)
        if inv.status == InvoiceStatus.PAID:
            total_paid += inv.total
        else:
            total_outstanding += inv.total
            if inv.is_overdue:
                overdue_count += 1
    click.echo(f"Total outstanding: ${total_outstanding:,.2f}")
    click.echo(f"Total paid: ${total_paid:,.2f}")
    click.echo(f"Overdue invoices: {overdue_count}")

if __name__ == "__main__":
    cli()
```

La commande `create` accepte les lignes comme chaîne JSON — compacte pour la ligne de commande mais flexible pour les factures complexes. La commande `list` affiche un tableau de toutes les factures avec les articles en retard marqués d'un `*`. La commande `report` agrège les totaux par statut.

**🎯 Résultat attendu :** `uv run python -m invoicer.cli create --number INV-001 --client "Acme" --items '[{"desc":"Work","qty":10,"rate":150}]' --tax 0.1` crée un PDF et enregistre les données de facture.

**🩹 Si ça ne marche pas :** Si l'analyse JSON échoue, la chaîne d'articles n'est pas un JSON valide — utilise des guillemets doubles pour les clés et les valeurs.

### 4.2 Test de fumée de bout en bout

```python
from invoicer.models import Invoice, LineItem, Client, InvoiceStatus
from invoicer.pdf import render_invoice
from invoicer.tracker import save_invoice, load_invoice

client = Client(name="Smoke Test Co", email="test@example.com")
items = [LineItem("Consulting", 20, 200.0), LineItem("Travel", 3, 500.0)]
inv = Invoice(invoice_number="SMOKE-001", client=client, items=items, tax_rate=0.08)

# Save and render
save_invoice(inv)
render_invoice(inv, "/tmp/smoke_invoice.pdf")

# Reload
loaded = load_invoice("SMOKE-001")
assert loaded.client.name == "Smoke Test Co"
assert loaded.subtotal == 5500.0
assert loaded.total == 5940.0  # 5500 * 1.08
assert loaded.is_overdue is False  # still a draft
```

**🎯 Résultat attendu :** Toutes les assertions passent ; les données de facture font l'aller-retour correctement et le PDF est généré.

**🩹 Si ça ne marche pas :** Si `loaded.total` ne correspond pas, le `tax_rate` n'a pas été préservé pendant la sérialisation JSON.

### 4.3 Vérifie le pipeline CLI

**✅ Liste de vérification**

- ✅ `create` enregistre les données de facture et génère un fichier PDF.
- ✅ `list` affiche toutes les factures avec statut et total.
- ✅ `report` agrège les totaux impayés, payés et en retard.

**🤔 Question(s) socratique(s)**

- Le CLI stocke les lignes comme chaîne JSON sur la ligne de commande. Comment ajouterais-tu une option `--from-csv` qui lit les lignes depuis une feuille de calcul ?
- Si tu ajoutais l'intégration email, comment enverrais-tu le PDF comme pièce jointe avec `smtplib` de Python ?

## ⚠️ Pièges courants

- **Confusion de taux de taxe entre décimal et pourcentage.** `tax_rate=0.1` signifie 10 %. Une erreur fréquente est de passer `10` au lieu de `0.1`, ce qui applique une taxe de 1000 %. Documente toujours le format attendu et valide la plage (0,0 à 1,0).
- **Oublier de vérifier `is_overdue` contre le statut.** Une facture n'est en retard que si son statut est `SENT`, pas `DRAFT` ou `PAID`. La propriété `is_overdue` gère cela, mais si tu vérifies directement les dates d'échéance, tu signaleras les brouillons comme en retard.
- **Écraser les fichiers de facture silencieusement.** `save_invoice` écrit dans `{invoice_number}.json` sans vérifier si le fichier existe. Ajoute une invite de confirmation ou une numérotation de version pour prévenir les écrasements accidentels.
- **Problèmes d'encodage PDF avec les caractères spéciaux.** Le `Paragraph` de ReportLab gère le HTML basique, mais les caractères spéciaux (noms accentués, symboles de devise) peuvent nécessiter un encodage explicite. Utilise toujours UTF-8.
- **Ne pas valider les quantités des lignes.** Une quantité négative produirait un total négatif, ce qui ressemble à un remboursement au lieu d'une facturation. Valide que `quantity > 0` lors de la création des lignes.

## Ce que tu viens de construire

Un générateur de factures qui modélise les données de facture comme des objets Python validés, rend des PDF professionnels avec des totaux calculés et des tableaux stylisés, suit le statut de paiement à travers un cycle de vie (brouillon → envoyée → payée) et génère des rapports de synthèse du chiffre d'affaires impayé. Le stockage un-fichier-par-facture est simple, auditable et facile à migrer vers une base de données plus tard.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/invoice-generator/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/invoice-generator) dans le dépôt du cours a une version plus riche avec plus d'options de style PDF, des factures d'exemple et le CLI câblé de bout en bout. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute une intégration email qui envoie la facture PDF comme pièce jointe avec `smtplib` de Python.
- Construis un planificateur de factures récurrentes qui génère et envoie des factures sur une base hebdomadaire ou mensuelle.
- Implémente un portail client : une simple interface web où les clients peuvent voir leurs factures et les marquer comme payées.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓