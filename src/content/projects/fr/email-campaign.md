---
title: "Gestionnaire de Campagnes Email"
description: "Creer et envoyer des campagnes email avec modeles, suivi et tests A/B."
difficulty: "beginner"
estimatedMinutes: 55
tags: ["cli", "json", "csv", "templates"]
prerequisites:
  - "Les bases de Python (listes, dictionnaires, boucles, fonctions)"
  - "La lecture de fichiers CSV et JSON"
learningObjectives:
  - "Rendre les modèles {{placeholder}} avec une substitution par regex"
  - "Importer et dédupliquer une liste d'abonnés avec validation d'email"
  - "Rendre toute une campagne dans une boîte d'envoi append-only (JSONL)"
  - "Calculer les taux d'ouverture et de clics à partir d'un journal d'engagement"
  - "Diviser une liste entre deux lignes d'objet et rapporter le gagnant"
---

# ✉️ Construis un Gestionnaire de Campagnes Email

Envoyer une vraie newsletter signifie gérer un fouillis de petits flux de travail : un modèle avec `{{first_name}}` qui se remplit réellement, une liste d'abonnés avec une ligne poubelle qui ne doit pas faire planter l'envoi, un enregistrement de boîte d'envoi sur *ce qui* est parti, des taux d'ouverture et de clics calculés à partir d'un journal de suivi, et, la partie que tout marketeur demande en premier, laquelle de deux lignes d'objet les gens ont réellement ouverte. Ce projet construit tout le pipeline en pur Python. Aucun envoi, aucun serveur, aucun SMTP : la « livraison » consiste à écrire un journal de boîte d'envoi, et les nombres sont tout aussi réels que ceux d'un outil hébergé.

Ce projet suppose que tu maîtrises Python 101, listes, dictionnaires, boucles, fonctions, plus une aisance avec `csv`/`json`. Rien du module Data Analysis n'est requis. Il est facultatif et non noté ; consulte [Real-World Projects](/fr/projets) pour la liste complète, qui ne cesse de s'allonger.

## 🎯 Ce que tu vas faire

1. Rendre les modèles `{{placeholder}}` pour un abonné et voir une variable manquante devenir un trou visible.
2. Importer `subscribers.csv`, en sautant silencieusement une ligne d'email invalide.
3. Rendre toute la campagne dans un enregistrement `outbox.jsonl` de ce qui a été envoyé à qui.
4. Calculer les taux d'ouverture et de clics à partir d'un journal d'engagement.
5. Diviser la liste entre deux lignes d'objet et couronner le gagnant par taux d'ouverture.

## Où exécuter ceci

**Localement avec `uv`** est le chemin recommandé, un gestionnaire de campagnes est un outil de persistance de fichiers (CSV d'abonnés en entrée, JSONL de boîte d'envoi en sortie), et les fichiers appartiennent à une CLI locale.

**GitHub Codespaces** est une alternative sans configuration : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node et Python sont déjà installés) et exécute les mêmes commandes depuis un terminal de navigateur.

**Google Colab, Kaggle Notebooks ou Binder** fonctionnent pour chaque étape, le notebook à [`examples/email-campaign/notebook.fr.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-campaign/notebook.fr.ipynb) exécute le même pipeline sur la liste d'échantillon fournie en mémoire.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-campaign/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-campaign/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Femail-campaign%2Fnotebook.fr.ipynb)

## Configuration

`uv` est un outil unique qui remplace la chaîne « installer Python, puis pip, puis un outil d'environnement virtuel », et ce projet est du pur standard library.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme l'installation :

```bash
uv --version
```

Puis configure le projet :

```bash
uv init email-campaign
cd email-campaign
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `email-campaign/` existe avec un `pyproject.toml`.
- ✅ `python -c "import csv, json, re"` réussit, aucun paquet tiers.

## Étape 1 : Rends un modèle

Le cœur d'un outil de campagne est une idée de fonction unique : remplacer chaque `{{name}}` d'un modèle par une valeur issue d'un dictionnaire de contexte. `re.sub` avec une *fonction* te donne le remplissage gratuitement, et une variable manquante qui renvoie une chaîne vide est un comportement délibéré et impossible à manquer, tu veux *voir* un trou dans l'email, pas que le moteur de rendu devine et en invente un.

### 1.1 Écris le moteur de rendu et le chargeur de campagne

**👟 Indice de départ :** Une regex pour les espaces réservés, `VAR_RE.sub(...)` avec une fonction `replace(match)`, et un `campaign.json` qui garde les modèles d'objet et de corps ensemble :

```bash
cat > campaign.json <<'EOF'
{
  "subject_template": "Your {{product}} is ready",
  "body_template": "Hello {{first_name}}, your {{product}} is waiting for you.",
  "product": "dashboard"
}
EOF
```

```python
# templates.py
import json
import re

VAR_RE = re.compile(r"\{\{\s*(\w+)\s*\}\}")

def render(text: str, context: dict) -> str:
    def replace(match):
        return str(context.get(match.group(1), ""))
    return VAR_RE.sub(replace, text)

def load_campaign(path: str = "campaign.json") -> dict:
    with open(path) as f:
        return json.load(f)

if __name__ == "__main__":
    print(render("Hello {{ first_name }}, your {{product}} is waiting for you.",
                 {"first_name": "Ada", "product": "dashboard"}))
    print(render("Hello {{ first_name }}, your {{product}} is waiting for you.",
                 {"first_name": "Ada"}))
```

La regex `\{\{\s*(\w+)\s*\}\}` correspond à `{{ name }}` *quels que soient les espaces*, ce qui est la tolérance dont un modèle copié-collé a besoin. `render` met toute la substitution dans une seule expression, et le dictionnaire de contexte est la *seule* source de vérité pour les noms, `{{product}}` sans clé `product` ne rend rien. C'est le pari de conception : échouer visiblement, ne jamais fabriquer.

**🎯 Résultat attendu :**

```
Hello Ada, your dashboard is waiting for you.
Hello Ada, your  is waiting for you.
```

**🩹 Si ça ne marche pas :** Si `{{ first_name }}` se rend littéralement, le `\s*` autour du nom manque dans la regex (elle a correspondu à `{{first_name}}` dans ta tête mais pas à la version espacée). Si un `product` manquant garde l'ancien texte `{{product}}`, `context.get(match.group(1), "")` a renvoyé l'espace réservé, il doit renvoyer `""` par défaut.

### 1.2 Vérifie le moteur de rendu

**✅ Liste de vérification**

- ✅ `render("Hi {{name}}", {"name": "Ada"}) == "Hi Ada"`, et avec des espaces `"Hi {{ name }}"` aussi, tolérant aux espaces blancs.
- ✅ Une variable manquante laisse un vide visible au lieu de lever une erreur ou de deviner.
- ✅ Le repli ne plante jamais sur des valeurs étranges : `context.get(..., "")` chaîne les nombres et les booléens avec élégance.

**🤔 Question(s) socratique(s)**

- Une valeur manquante se rend comme une chaîne vide, un trou silencieux dans l'email. Quelle est l'alternative (lever une exception / garder l'espace réservé / laisser en blanc) et *quand* chacune devient-elle le bon défaut pour un expéditeur de production ?
- Le modèle a une variable, le fichier de campagne a trois clés. Que se passe-t-il quand un modèle référence `{{ plan }}` alors que le seul contexte du fichier de campagne est `product`, d'où devrait venir une valeur *par abonné* comme `plan` à l'étape suivante ?

## Étape 2 : Importe la liste d'abonnés

Une liste de vrais clients a exactement une garantie : elle est désordonnée. Quelque part entre le formulaire d'inscription et ta campagne, il y a une ligne qui n'est pas un email. Le travail de l'importation est de charger ce qui est valide, de sauter ce qui ne l'est pas et de *rapporter ce qu'elle a sauté*, manger des mauvaises lignes en silence masque des trous dans les données, et faire confiance aux mauvaises lignes empoisonne tout l'envoi.

### 2.1 Écris le chargeur d'abonnés

**👟 Indice de départ :** Un `EMAIL_RE` pragmatique, une boucle qui ne garde que les lignes qui lui correspondent, et une démo qui compte ce qui a été sauté :

```bash
cat > subscribers.csv <<'EOF'
email,first_name,last_name,plan
ada@example.com,Ada,Lovelace,free
grace@example.com,Grace,Hopper,pro
not-an-email,Bad,Row,free
alan@example.com,Alan,Turing,free
EOF
```

```python
# subscribers.py
import csv
import re

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def load_subscribers(path: str = "subscribers.csv") -> list[dict]:
    subscribers = []
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            if EMAIL_RE.match(row["email"]):
                subscribers.append(row)
    return subscribers

if __name__ == "__main__":
    subs = load_subscribers()
    print(f"valid: {len(subs)} (1 invalid row skipped)")
    for s in subs:
        print(f"{s['email']:<26} {s['first_name']} {s['last_name']} ({s['plan']})")
```

`EMAIL_RE` est une vérification de *forme*, pas une autorité : `^[^@\s]+@[^@\s]+\.[^@\s]+$` exige exactement un `@`, une partie locale imprimable, un point dans le domaine, pas d'espaces, assez pour attraper `not-an-email` à vue. Sauter est la signature ici : une ligne CSV qui n'est pas un abonné est un problème de *données* détecté à la porte, signalé une fois dans la ligne de comptage, et jamais autorisé à fuir dans les calculs de la `outbox` en aval.

**🎯 Résultat attendu :**

```
valid: 3 (1 invalid row skipped)
ada@example.com            Ada Lovelace (free)
grace@example.com          Grace Hopper (pro)
alan@example.com           Alan Turing (free)
```

**🩹 Si ça ne marche pas :** Si la mauvaise ligne apparaît dans la sortie, la garde `if EMAIL_RE.match(row["email"])` manque ou correspond à `not-an-email` (la regex a-t-elle une partie de domaine `\.[^@\s]+` obligatoire ?). Si chaque étape suivante compte 4 abonnés, tu as importé depuis `subscribers.csv` sans le filtre, relis ce que ton `load_subscribers` renvoie réellement.

### 2.2 Vérifie l'importation

**✅ Liste de vérification**

- ✅ Exactement 3 des 4 lignes s'importent ; `not-an-email` est signalé comme sauté.
- ✅ Les champs `email` vides ou uniquement des espaces blancs seraient aussi sautés par la même regex.
- ✅ Les lignes importées préservent toutes les colonnes (`email`, `first_name`, `last_name`, `plan`), chaque étape ultérieure lit l'enregistrement complet.

**🤔 Question(s) socratique(s)**

- Le compteur de sauts est *imprimé* mais pas *stocké*. Que ferait un importateur de production de `not-an-email`, le mettre en file d'attente pour re-validation, le journaliser dans un fichier d'erreurs, ou bloquer toute la campagne, et quel choix est le « échouer bruyamment » honnête ici ?
- La regex accepte `grace@example.com` mais accepterait aussi `a@b.c`. Où se situe la ligne « ceci est plausiblement une adresse », et qu'est-ce que cela coûte de la pousser plus loin (vérification DNS, délivrabilité), pour une petite campagne réelle ?

## Étape 3 : Rends la boîte d'envoi complète

Un email rendu est un test unitaire ; toute une boîte d'envoi est le produit. Pour chaque abonné, fusionne les valeurs par défaut de la campagne avec les propres champs de l'abonné, rends l'objet et le corps, et écris un objet JSON par email dans `outbox.jsonl`, un journal append-only qui enregistre *exactement ce qui a été envoyé à qui*. Aucun SMTP nécessaire pour comprendre la forme du travail.

### 3.1 Écris `outbox.py`

**👟 Indice de départ :** `context.update({k: sub[k] ...})` superpose les champs par abonné au-dessus du fichier de campagne, puis un passage d'aperçu imprime les trois emails rendus comme ils partiraient vraiment :

```python
# outbox.py
import csv
import json

from subscribers import load_subscribers
from templates import load_campaign, render

def render_campaign(campaign: dict, subscribers: list[dict]) -> list[dict]:
    outbox = []
    for sub in subscribers:
        context = dict(campaign)
        context.update({k: sub[k] for k in ("email", "first_name", "last_name", "plan")})
        outbox.append({
            "to": sub["email"],
            "subject": render(campaign["subject_template"], context),
            "body": render(campaign["body_template"], context),
        })
    return outbox

if __name__ == "__main__":
    campaign = load_campaign()
    outbox = render_campaign(campaign, load_subscribers())
    with open("outbox.jsonl", "w") as f:
        for email in outbox:
            f.write(json.dumps(email) + "\n")
    print(f"wrote {len(outbox)} emails")
    for email in outbox:
        print(f"  to {email['to']:<26} {email['subject']} | {email['body']}")
```

`context = dict(campaign)` *copie* le dictionnaire de campagne, donc les fusions par abonné ne mutent jamais la source partagée, la mise à jour de `first_name` d'`Ada` ne peut pas fuir dans le rendu de `Grace` (le bug classique de dictionnaire partagé que cette copie empêche). Le moteur de rendu existe déjà depuis l'étape 1 ; `render_campaign` est de la pure composition, boucle, fusion, rendu, enregistrement. JSONL (un objet JSON par ligne) est le format *d'audit* de ce projet : compatible avec l'ajout, compatible avec grep, et chaque étape suivante le relit ligne par ligne.

**🎯 Résultat attendu :**

```
wrote 3 emails
  to ada@example.com            Your dashboard is ready | Hello Ada, your dashboard is waiting for you.
  to grace@example.com          Your dashboard is ready | Hello Grace, your dashboard is waiting for you.
  to alan@example.com           Your dashboard is ready | Hello Alan, your dashboard is waiting for you.
```

**🩹 Si ça ne marche pas :** Si un email dit « Hello Grace » pour Ada aussi, `render_campaign` *mute* `campaign` en place, `context = dict(campaign)` doit venir en premier ; `.update` va sur la copie. Si `outbox.jsonl` est vide après une exécution, tu l'as ouvert avant de fermer le *write*, vérifie que `with open("outbox.jsonl", "w")` n'est pas tronqué par une seconde ouverture du même chemin en cours d'exécution.

### 3.2 Vérifie la boîte d'envoi

**✅ Liste de vérification**

- ✅ `outbox.jsonl` a exactement 3 lignes, un objet JSON chacune (`to`, `subject`, `body`).
- ✅ Les corps rendus d'Ada et d'Alan ne diffèrent de *rien* ici, même produit, même modèle, mais les champs `first_name`/`last_name` sont disponibles par abonné.
- ✅ Le journal imprimé correspond à `outbox.jsonl` ligne pour ligne (même contexte, même moteur de rendu).

**🤔 Question(s) socratique(s)**

- La boîte d'envoi enregistre `to/subject/body` mais *pas* les choix de fusion (quel `product` était dans le contexte). Quelle est la différence entre une boîte d'envoi et un *journal d'audit*, et lequel veux-tu quand un abonné se plaint d'avoir reçu le mauvais email ?
- `subject_template` et `body_template` viennent tous deux de `campaign.json`, pourtant `context` porte aussi ces deux clés. Pourquoi ce surcoût +1 clé à chaque fusion, et le coût à l'étape 4 (taux d'engagement) est-il plus que cosmétique ?

## Étape 4 : Mesure les ouvertures et les clics

Chaque entreprise se soucie d'un nombre derrière une campagne : l'ont-ils *lu* ? Le journal d'engagement est un second fichier JSONL, un événement `{"type": "open"|"click", "email": ...}` par abonné, et les taux sont `emails uniques ouverts/envoyés` et `cliqués/envoyés`. La déduplication par ensemble est la correction ici : un abonné qui ouvre deux fois ne compte qu'une fois, et un clic sans ouverture reste un clic.

### 4.1 Écris le calculateur de taux

**👟 Indice de départ :** Charge le journal d'événements, construis les *ensembles* `opened` et `clicked` des emails uniques, puis divise par le nombre envoyé :

```bash
cat > events.jsonl <<'EOF'
{"type": "open", "email": "ada@example.com"}
{"type": "open", "email": "grace@example.com"}
{"type": "click", "email": "grace@example.com"}
EOF
```

```python
# tracking.py
import json

from subscribers import load_subscribers

def load_events(path: str = "events.jsonl") -> list[dict]:
    return [json.loads(line) for line in open(path) if line.strip()]

def engagement_rates(sent_count: int, events: list[dict]) -> dict:
    opened = {e["email"] for e in events if e["type"] == "open"}
    clicked = {e["email"] for e in events if e["type"] == "click"}
    return {"sent": sent_count,
            "opened": len(opened) / sent_count,
            "clicked": len(clicked) / sent_count}

if __name__ == "__main__":
    sent = load_subscribers()
    events = load_events()
    rates = engagement_rates(len(sent), events)
    print(f"sent:     {rates['sent']}")
    print(f"opened:   {rates['opened']*rates['sent']:.0f}/{rates['sent']}  ({rates['opened']:.1%})")
    print(f"clicked:  {rates['clicked']*rates['sent']:.0f}/{rates['sent']}  ({rates['clicked']:.1%})")
```

Tout l'astuce est `{e["email"] for e in events ...}`, une compréhension d'ensemble qui transforme des *événements* en *emails uniques* en une seule expression. `ada@example.com` ouvrant deux fois resterait un seul élément d'ensemble, donc `opened` ne peut jamais dépasser `sent` par double comptage. Les taux viennent d'un *dénominateur que tu possèdes déjà* (`sent_count` depuis la liste d'abonnés), pas de l'hypothèse « événements == qui a été écrit », le journal est le numérateur, l'importation est le dénominateur.

**🎯 Résultat attendu :**

```
sent:     3
opened:   2/3  (66.7%)
clicked:  1/3  (33.3%)
```

**🩹 Si ça ne marche pas :** Si `opened: 2/3` se lit comme `3/3`, tu comptes des *événements* et pas des *emails*, la compréhension manque : `{e["email"] for e in events}` effondre les doublons ; `len(events)` ne le fait pas. Si le dénominateur est faux, `sent_count` vient de `len(events)` au lieu de `load_subscribers()`, le journal ne peut pas te dire combien d'emails *sont partis*.

### 4.2 Vérifie les taux

**✅ Liste de vérification**

- ✅ `opened` = 2 expéditeurs uniques sur 3 envoyés (66,7 %) ; `clicked` = 1 sur 3 (33,3 %).
- ✅ Un événement `open` en double pour le même email ne change rien, décimation par ensemble, pas comptage d'événements.
- ✅ `engagement_rates()` prend le nombre envoyé comme argument, restant honnête que « sent » est défini par l'importateur, pas par le journal.

**🤔 Question(s) socratique(s)**

- Le suivi d'ouverture est notoirement approximatif (vignettes d'aperçu, blocs d'images, outils de confidentialité). Où « opened = 66.7% » survend-il la réalité, et quel mot (« read », « opened », « loaded ») un tableau de bord soigneux utiliserait-il pour ce nombre exact ?
- Les taux divisent par *envoyé*, pas par *délivré*. Les rebonds (l'email n'est jamais arrivé) gonflent les deux taux. Où dans ce pipeline soustrairais-tu un compte `bounced` pour que les taux décrivent ce que les gens ont réellement reçu ?

## Étape 5 : Lance le test A/B et choisis le gagnant

Les lignes d'objet font bouger les taux d'ouverture, et les marketeurs se disputent à leur sujet pour toujours, c'est précisément pourquoi tu *mesures* à la place. « Split A/B » signifie ici : diviser la liste d'abonnés en deux moitiés par index alterné, donner à chaque moitié une ligne d'objet différente (même corps), et laisser le journal d'engagement décider. La condition de victoire est le taux d'ouverture par variante, et toute la décision est trois lignes d'arithmétique.

### 5.1 Écris le séparateur et le rapporteur

**👟 Indice de départ :** `i % 2 == 0` alterne les abonnés entre les variantes ; un dict de stats par variante accumule envoyé/ouvert depuis le fichier de résultats :

```bash
cat > effectiveness.jsonl <<'EOF'
{"variant": "A", "email": "ada@example.com", "opened": true}
{"variant": "B", "email": "grace@example.com", "opened": true}
{"variant": "A", "email": "alan@example.com", "opened": false}
EOF
```

```python
# abtest.py
import csv
import json
from collections import defaultdict

def ab_split(subscribers: list[dict], variant_a: str, variant_b: str) -> list[dict]:
    plan = []
    for i, sub in enumerate(subscribers):
        record = dict(sub)
        record["variant"] = "A" if i % 2 == 0 else "B"
        record["subject"] = variant_a if record["variant"] == "A" else variant_b
        plan.append(record)
    return plan

def load_outcomes(path: str = "effectiveness.jsonl") -> dict:
    outcomes = {}
    for line in open(path):
        if line.strip():
            record = json.loads(line)
            outcomes[record["email"]] = record
    return outcomes

if __name__ == "__main__":
    subscribers = [s for s in csv.DictReader(open("subscribers.csv", newline=""))
                   if "@" in s["email"]]
    outcomes = load_outcomes()
    plan = ab_split(subscribers,
                    "Your dashboard is ready",
                    "Start tracking with your dashboard")

    stats = defaultdict(lambda: {"sent": 0, "opened": 0})
    for row in plan:
        stats[row["variant"]]["sent"] += 1
        if outcomes[row["email"]]["opened"]:
            stats[row["variant"]]["opened"] += 1

    for variant in sorted(stats):
        s = stats[variant]
        print(f"variant {variant}: opened {s['opened']}/{s['sent']} = {s['opened']/s['sent']:.0%}")

    winner = max(stats, key=lambda v: stats[v]["opened"] / stats[v]["sent"])
    print(f"winner: variant {winner}")
```

`i % 2 == 0` est une affectation alternée, Ada, Alan → A ; Grace → B, une simplicité délibérée qui garde *qui reçoit quel objet* évident à vue. `defaultdict` avec une fabrique `lambda` fait fonctionner `stats["A"]["sent"] += 1` du premier coup (`0` → `1`) sans pré-initialisation, les zéros deviennent des premiers incréments gratuitement. Le verdict est un `max(...)` honnête sur les taux d'ouverture : le 1/1 de la variante B bat le 1/2 de A *indépendamment du fait que le split soit inégal*, ce qui est exactement le « petite liste, gros avertissement » que tu signalerais à tout vrai marketeur.

**🎯 Résultat attendu :**

```
variant A: opened 1/2 = 50%
variant B: opened 1/1 = 100%
winner: variant B
```

**🩹 Si ça ne marche pas :** Si chaque enregistrement atterrit dans A, la variante utilise `i % 2 == 1` de façon incohérente entre `ab_split` et la démo, un découpage. Si `winner: variant A` s'affiche, la clé `max` compare dans la mauvaise direction (style `min`), vérifie qu'elle porte sur `opened / sent`, pas sur `opened`.

### 5.2 Vérifie le gagnant A/B

**✅ Liste de vérification**

- ✅ L'ordre des abonnés (Ada, Grace, Alan) produit A:{Ada, Alan}, B:{Grace} ; les résultats attribuent Ada→ouvert, Alan→fermé, Grace→ouvert.
- ✅ Taux : A = 1/2 (50 %), B = 1/1 (100 %) ; gagnant = B par taux d'ouverture.
- ✅ Le même `effectiveness.jsonl` relancé donne le même gagnant, les résultats sont des données, pas un lancer de pièce.

**🤔 Question(s) socratique(s)**

- Le split alterne `i % 2 == 0`, ce qui est *chirurgical* mais pas *aléatoire*. Si la liste se trouve être ordonnée par, disons, cohorte d'inscription, la variante B pourrait être tous les clients payants avec des ouvertures de base plus élevées. Qu'est-ce qu'un *shuffle ensemencé* change (et ne change pas) à l'honnêteté du gagnant ?
- Avec des tailles de variante de 2 et 1, le 100 % est une seule personne. Quelle est la différence entre « statistiquement décisif » et « semble décisif sur trois emails », et quel est le premier nombre seuil (abonnés par variante) qui rend le mot « winner » défendable ?

## ⚠️ Pièges courants

- **Des trous là où les noms devraient être.** Un `{{product}}` manquant se rend comme une chaîne vide, par conception, mais les gens le mettent en production. Décide de la politique de variable manquante (vide / garder brut / lever) et rends-la explicite, car le défaut de trou visible écrit silencieusement un email « Hello Ada, your  is waiting. » en production.
- **Muter le dictionnaire de campagne partagé.** `context = campaign` puis `context.update(subscriber_fields)` fait écraser `first_name` d'Ada par la source partagée pour Grace. `dict(campaign)` d'abord, toujours.
- **Compter les événements comme des personnes.** `len(events)` dit « trois ouvertures ont eu lieu », pas « trois personnes ont ouvert ». Déduplique en ensembles avant de diviser, ou les taux survendent d'exactement le nombre de chevauchements.
- **Sauter sans le dire.** Une importation qui laisse tomber une ligne CSV invalide mais ne le rapporte jamais masque des trous dans les données. Imprime le compteur de sauts, ou tu apprends silencieusement la même mauvaise ligne à chaque exécution future.
- **Faire confiance aux comptages plutôt qu'aux définitions.** `sent` doit venir de l'importation, `opened`/`clicked` du journal, mélanger les deux dénominateurs est ainsi qu'un taux dépasse 100 % sans qu'aucun bug ne soit évident au premier regard.

## Ce que tu viens de construire

La boucle complète de campagne email en bibliothèque standard : moteur de rendu de modèles, importation validée d'abonnés, journal de boîte d'envoi qui enregistre exactement ce qui est parti, taux d'engagement par email unique, et une expérience A/B dont le gagnant vient directement des données. La compétence qui vaut la peine d'être gardée est *la séparation des couches du pipeline*, le modèle, la liste, la boîte d'envoi, le journal et la décision possèdent chacun un fichier et une tâche, donc remplacer l'un d'eux (une nouvelle expérience A/B de ligne d'objet, une soustraction de compte rebondi) ne se répercute jamais sur les autres.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/email-campaign/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/email-campaign) dans le dépôt du cours contient les scripts complets plus l'`subscribers.csv` d'échantillon et les modèles. Ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller ensuite

- Ajoute les **rebonds** : un `bounced_set` soustrait de `sent` avant la division des taux, dénominateur « délivré » au lieu de « envoyé », une amélioration d'une ligne avec un gros gain d'honnêteté.
- Ajoute une **commande d'aperçu** qui rend un email dans le terminal (`send.py ada@example.com`) avec l'objet/corps exact qui partirait, un aperçu d'envoi vit au-dessus de `render_campaign`.
- Persiste **l'historique d'envoi** comme seconde colonne de la boîte d'envoi (horodatages `bounced_at`, `opened_at` par abonné) pour que le journal d'audit gagne la « garantie » évoquée dans la question de l'étape 3.
- Rend le split A/B **aléatoire ensemencé** (`random.Random(seed).shuffle`) avec la graine imprimée dans le rapport, l'expérience devient reproductible, et le marketeur peut pointer le split exact qui a été exécuté.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants, et son README contient un parcours complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓