---
title: "Constructeur de Rapports"
description: "Transformez un CSV de ventes en un rapport soigné : nettoyez-le avec pandas, dessinez des graphiques à barres, en lignes, en secteurs et en dispersion avec matplotlib, formatez des tableaux récapitulatifs, et assemblez le tout dans un seul fichier de rapport."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["data-visualization", "matplotlib", "pandas", "reporting"]
learningObjectives:
  - Charger et préparer des données avec pandas pour la génération de rapports
  - "Construire quatre types de graphiques : barres, lignes, secteurs, dispersion"
  - Formater des données en tableaux de texte prêts pour la publication
  - Assembler graphiques et résumés en un seul rapport
prerequisites:
  - "Bases de Python (fonctions, boucles, dictionnaires)"
  - "Compréhension des listes et de l'arithmétique de base"
  - "Installer des paquets avec uv"
---

# 🛠️ 📊 Construire un Constructeur de Rapports

Le reporting d'entreprise est une boucle qui ne change jamais de forme : prends des données brutes, résume-les, montre-les, et partage-les. Ce projet construit cette boucle avec pandas et matplotlib — charge un CSV de ventes, calcule les totaux qu'un manager demande vraiment, dessine un graphique à barres, en lignes, en secteurs et en dispersion, formate le tout dans un tableau propre, et assemble le tout dans un seul fichier de rapport.

Cela suppose le Python 101 et l'aisance avec les fonctions et les listes de base — rien au-delà n'est requis. C'est optionnel et non noté ; vois [Projets du monde réel](/docs/projects) pour la liste complète, et grandissante.

## 🎯 Ce que tu vas faire

1. Générer un CSV de ventes réaliste et le charger dans un DataFrame pandas.
2. Agréger le revenu par catégorie avec `groupby` pour les totaux principaux.
3. Dessiner quatre types de graphiques et enregistrer chacun comme un PNG haute résolution.
4. Formater un tableau récapitulatif qui s'aligne dans n'importe quel terminal.
5. Assembler graphiques + résumé + métadonnées dans un dossier de rapport.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal. `pandas` et `matplotlib` s'installent proprement, le backend non interactif `Agg` de matplotlib (utilisé à l'Étape 2) signifie que les graphiques se rendent même sur une machine sans écran, et les fichiers de rapport atterrissent réellement dans ton dossier de projet.

**Google Colab et les exécutions notebook Binder** fonctionnent de la même manière — installe la paire avec une ligne `!pip install pandas matplotlib`, et le notebook reflète chaque étape avec des graphiques enregistrés dans l'environnement du notebook. **JupyterLite** peut exécuter les portions pandas dans le navigateur, mais c'est le plus faible des trois pour ce projet : matplotlib y tourne, pourtant enregistrer des *fichiers* PNG de graphiques sur un vrai disque est maladroit, donc traite-le comme un chemin « essaie-le » et utilise les badges de notebook ou `uv` local quand tu veux que les artefacts du rapport persistent.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/report-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/report-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Freport-builder%2Fnotebook.ipynb)

## Configuration

Crée le projet et installe les deux bibliothèques sur lesquelles tout le projet repose.

```bash
uv init report-builder
cd report-builder
uv add pandas matplotlib
```

```bash
uv run python -c "import pandas, matplotlib; print('ok')"
```

`pandas` est la couche de données — charger, agréger, filtrer — et `matplotlib` est la couche de dessin qui transforme les agrégats en graphiques. Commencer avec les deux installés signifie que chaque étape ci-dessous parle des *idées de reporting* plutôt que de se battre avec les dépendances.

**✅ Liste de vérification**

- ✅ `uv add pandas matplotlib` a terminé et `uv run python -c "import pandas, matplotlib"` imprime `ok`.
- ✅ Un projet frais `report-builder/` existe avec un `pyproject.toml`.

## Étape 1 : Charge et prépare les données

Chaque rapport commence par des données qui peuvent ou non exister encore. Cette étape construit un chargeur qui génère un CSV de ventes réaliste quand aucun n'est présent — pour que le projet tourne dès la sortie de la boîte — et parse les dates pour que le reporting basé sur le temps fonctionne plus tard.

### 1.1 Écris le générateur de données et le chargeur

**👟 Indice de départ :** Crée un jeu de données d'échantillon déterministe (aléatoire ensemencé), enregistre-le en CSV, puis recharge-le avec `parse_dates=["date"]` pour que la colonne de date soit un vrai datetime.

```python
# report.py
import os
import random
import pandas as pd

def create_sample_data(filepath: str = "sales_data.csv"):
    """Generate sample sales data for the report."""
    data = {
        "date": pd.date_range("2024-01-01", periods=100, freq="D"),
        "category": ["Electronics", "Clothing", "Food", "Books"] * 25,
        "revenue": [120.50, 89.99, 45.00, 23.50] * 25,
        "units_sold": [3, 5, 12, 8] * 25,
    }
    random.seed(42)
    data["revenue"] = [r * random.uniform(0.7, 1.3) for r in data["revenue"]]
    data["units_sold"] = [max(1, int(u * random.uniform(0.5, 1.5))) for u in data["units_sold"]]

    df = pd.DataFrame(data)
    df.to_csv(filepath, index=False)
    print(f"Sample data saved to {filepath} ({len(df)} rows)")
    return df

def load_data(filepath: str = "sales_data.csv") -> pd.DataFrame:
    """Load sales data from CSV, creating sample data if the file is missing."""
    if not os.path.exists(filepath):
        print("No data file found. Generating sample data...")
        return create_sample_data(filepath)

    df = pd.read_csv(filepath, parse_dates=["date"])
    print(f"Loaded {len(df)} rows from {filepath}")
    return df

df = load_data()
print(df.head(10).to_string(index=False))
```

`random.seed(42)` est ce qui rend les données d'échantillon *reproductibles* : la même graine donne la même variation « aléatoire » à chaque exécution, donc les graphiques et totaux que tu produis sont les graphiques et totaux des résultats attendus, pas un rapport différent à chaque fois. `parse_dates=["date"]` dit à pandas de décoder la colonne de date en vrais objets `datetime` au chargement — c'est ce qui rend « le revenu quotidien moyen » et la plage de dates du rapport de l'Étape 5 calculables plutôt que triés comme des chaînes. `index=False` sur `to_csv` garde une colonne d'index parasite hors du fichier, donc le rechargement produit à nouveau un DataFrame propre.

**🎯 Résultat attendu :** `Sample data saved to sales_data.csv (100 rows)` — ou, à une seconde exécution avec le fichier présent, `Loaded 100 rows from sales_data.csv`. Puis un aperçu de 10 lignes avec les colonnes `date`, `category`, `revenue`, `units_sold`.

**🩹 Si ça ne marche pas :** Si le fichier est régénéré à chaque exécution, `os.path.exists` vérifie un chemin différent de celui utilisé par le générateur — passe le même défaut `filepath` aux deux. Si `df["date"]` s'imprime sous forme de chaînes comme `2024-01-01` sans `T`, ce n'est pas réellement parsé — confirme avec `df.dtypes` (`date` devrait être `datetime64[ns]`). Si chaque valeur de revenu est identique, la multiplication `random.seed(42)` n'a pas été appliquée à la liste.

### 1.2 Vérifie ce avec quoi tu travailles

**👟 Indice de départ :** Demande à pandas la forme et les comptages de lignes par catégorie, pour connaître l'échelle et l'équilibre du jeu de données avant de dessiner quoi que ce soit.

```python
# report.py (suite)
print(f"Rows: {len(df)}, Columns: {list(df.columns)}")
print(df.groupby("category")["revenue"].count())
```

`df.groupby("category")["revenue"].count()` est ton premier réel agrégat : `groupby("category")` divise le cadre en un groupe par catégorie, le `["revenue"]` choisit une colonne à mesurer, et `.count()` totalise les entrées non nulles par groupe. C'est la même forme d'expression que tu utiliseras à l'Étape 2 pour *sommer* le revenu par catégorie — la seule différence est la méthode finale.

**🎯 Résultat attendu :** `Rows: 100, Columns: ['date', 'category', 'revenue', 'units_sold']`, puis un compte par catégorie de `25` pour chacune des quatre catégories.

**🩹 Si ça ne marche pas :** Si un compte n'est pas 25, le motif en tuiles `* 25` dans le générateur n'a pas produit un jeu de données équilibré — vérifie la longueur de la liste d'origine. Si `groupby` fait une erreur, le nom de colonne `category` est mal orthographié ou manquant dans le CSV.

### 1.3 Vérifie la couche de données

**✅ Liste de vérification**

- ✅ Une exécution crée `sales_data.csv` ; la suivante le charge au lieu de le régénérer.
- ✅ `df.dtypes` montre `date` comme un type datetime.
- ✅ `groupby("category")["revenue"].count()` retourne 25 par catégorie.

**🤔 Question(s) socratique(s)**

- Les données d'échantillon utilisent un `random.seed(42)` fixe. Que *sacrifierais-tu* si tu retirais la graine — et dans quel workflow réel (une démo, une piste d'audit, un tableau de bord en direct) voudrais-tu réellement une variation non ensemencée ?
- Les dates sont parsées avec `parse_dates=["date"]`. Quel genre de bug un rapport rencontrerait-il si la colonne de date restait en chaînes — choisis une opération concrète (tri, trouver la date min, tracer une série temporelle) et dis comment elle casse.

## Étape 2 : Dessine ton premier graphique

Un graphique est un résumé que tu peux voir. Cette étape dessine la première des quatre figures — un graphique à barres horizontales du revenu par catégorie — et établit le motif que suit chaque graphique ultérieur : construire une `figure` et des `axes`, tracer, étiqueter, enregistrer, fermer.

### 2.1 Enregistre un graphique à barres revenu-par-catégorie

**👟 Indice de départ :** Bascule matplotlib sur le backend `Agg` (sûr sans écran), groupe et somme le revenu par catégorie, et trace avec une paire figure + axe pour contrôler le dimensionnement.

```python
# report.py (suite)
import matplotlib
matplotlib.use("Agg")  # backend non interactif : rendre vers des fichiers, pas des fenêtres
import matplotlib.pyplot as plt

def chart_revenue_by_category(df: pd.DataFrame, output: str = "chart_bar.png"):
    """Bar chart of total revenue by category."""
    summary = df.groupby("category")["revenue"].sum().sort_values(ascending=True)

    fig, ax = plt.subplots(figsize=(8, 4))
    colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
    summary.plot(kind="barh", ax=ax, color=colors[:len(summary)])
    ax.set_title("Revenue by Category", fontsize=14, fontweight="bold")
    ax.set_xlabel("Total Revenue ($)")
    ax.set_ylabel("")
    plt.tight_layout()
    plt.savefig(output, dpi=150)
    plt.close()
    print(f"Bar chart saved to {output}")

chart_revenue_by_category(df)
```

L'appel `matplotlib.use("Agg")`, placé **avant** l'import de `pyplot`, est ce qui fait tourner ce projet sur un serveur ou dans la CI sans affichage : `Agg` est le backend purement raster qui rend directement vers des fichiers. `groupby("category")["revenue"].sum().sort_values()` combine l'agrégation et l'ordre, donc le graphique à barres se rend *trié* — le plus petit en bas avec `barh`, ce qui se lit naturellement. `plt.savefig(output, dpi=150)` écrit un fichier plutôt que de faire apparaître une fenêtre, et le `plt.close()` discipliné libère la mémoire de la figure pour qu'une boucle longue de graphiques ne fuie pas.

**🎯 Résultat attendu :** Un fichier `chart_bar.png`, plus l'impression `Bar chart saved to chart_bar.png`. Ouvre l'image : quatre barres horizontales, une par catégorie, triées en ordre croissant.

**🩹 Si ça ne marche pas :** Si tu obtiens `UserWarning: Starting a Matplotlib GUI outside of the main thread` ou un `TclError` à propos de l'absence d'affichage, `matplotlib.use("Agg")` s'exécute *après* que `pyplot` est déjà importé — le `use` doit précéder chaque import de pyplot. Si le fichier est vide, `savefig` a été appelé avant que quoi que ce soit ne soit tracé. Si les couleurs ne correspondent pas aux catégories, la tranche `colors[:len(summary)]` et la série triée doivent avoir la même longueur et le même ordre.

### 2.2 Vérifie le motif de graphique répétable

**👟 Indice de départ :** Ré-exécute la fonction et confirme que le fichier est reconstruit à l'identique — une sortie idempotente (même entrée → même PNG) est ce qui rend le reporting par lots digne de confiance.

**🎯 Résultat attendu :** Re-exécuter le bloc écrase `chart_bar.png` avec le même graphique et imprime à nouveau `Bar chart saved to chart_bar.png` — aucune erreur, aucune fenêtre qui apparaît.

**🩹 Si ça ne marche pas :** Si la deuxième exécution fait apparaître une fenêtre ou fait une erreur à propos d'un affichage, la ligne du backend `Agg` a dérivé sous l'import de pyplot lors d'un re-collage. Si `FileNotFoundError` apparaît à l'enregistrement, le répertoire de sortie n'existe pas — `savefig` ne crée pas de dossiers, donc `os.makedirs` (ou l'étape de rapport) doit le faire.

**✅ Liste de vérification**

- ✅ `chart_bar.png` existe et s'ouvre comme un graphique horizontal à quatre barres trié en ordre croissant.
- ✅ Le backend `Agg` est actif avant que `pyplot` soit importé.
- ✅ Exécuter la fonction deux fois reconstruit le même fichier sans erreurs.

**🤔 Question(s) socratique(s)**

- Le graphique trie en ordre croissant et utilise `barh`. Qu'est-ce qui change dans la lecture d'un spectateur des mêmes données si tu traçais la série *non triée* en barres verticales à la place — y a-t-il un cas où le « mauvais » ordre est l'honnête ?
- `plt.close()` termine cette fonction, mais les initiales `fig, ax = plt.subplots(...)` relient une paire d'objets. Que se passerait-il si tu oubliais la fermeture dans une boucle construisant 200 graphiques — et pourquoi cet échec apparaît-il généralement tard, pas immédiatement ?

## Étape 3 : Ajoute les trois autres types de graphiques

Un graphique montre un classement ; un rapport a généralement besoin aussi de la tendance, de la part et de la relation. Cette étape ajoute les graphiques en lignes (revenu dans le temps), en secteurs (part par catégorie), et en dispersion (revenu contre unités), chacun suivant le motif figure/tracer/enregistrer/fermer de l'Étape 2.

### 3.1 Dessine la tendance de revenu comme un graphique en lignes

**👟 Indice de départ :** Ré-échantillonne le revenu quotidien en sommant par date, puis trace avec un remplissage sous la courbe.

```python
# report.py (suite)
def chart_revenue_trend(df: pd.DataFrame, output: str = "chart_line.png"):
    """Line chart of daily revenue trend."""
    daily = df.groupby("date")["revenue"].sum()

    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(daily.index, daily.values, color="#3b82f6", linewidth=1.5)
    ax.fill_between(daily.index, daily.values, alpha=0.1, color="#3b82f6")
    ax.set_title("Daily Revenue Trend", fontsize=14, fontweight="bold")
    ax.set_xlabel("Date")
    ax.set_ylabel("Revenue ($)")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig(output, dpi=150)
    plt.close()
    print(f"Line chart saved to {output}")

chart_revenue_trend(df)
```

`daily = df.groupby("date")["revenue"].sum()` réduit le cadre à un point par date — parce que `groupby` groupe les *valeurs de date uniques*, et que chaque date apparaît dans les données exactement une fois, c'est effectivement une série temporelle pleine résolution. `ax.plot(daily.index, daily.values, ...)` est la façon non-nativement-pandas de tracer (nous avons extrait le résumé du DataFrame), ce qui te permet de passer l'index de dates directement à matplotlib. `fill_between` avec un faible `alpha=0.1` teinte la zone sous la ligne — un gain de lisibilité bon marché qui transforme une ligne en une forme.

**🎯 Résultat attendu :** Un `chart_line.png` montrant une ligne de revenu quotidien sur la plage de 100 jours, avec un remplissage bleu clair en dessous et des étiquettes de dates pivotées le long de l'axe des abscisses.

**🩹 Si ça ne marche pas :** Si les étiquettes de l'axe des abscisses se chevauchent en une traînée, `rotation=45, ha="right"` a été laissé de côté. Si matplotlib trace un index d'entiers bruts au lieu de dates, le `parse_dates` de l'Étape 1 n'a pas été appliqué. Si la ligne est complètement plate, `groupby("date")` peut ne pas sommer — vérifie `daily.describe()` pour la variance.

### 3.2 Ajoute le secteur et la dispersion

**👟 Indice de départ :** Pour le secteur, somme les unités par catégorie et laisse matplotlib rendre les pourcentages ; pour la dispersion, dessine une série colorée par catégorie et compte sur le fichier enregistré de la figure pour l'inspection.

```python
# report.py (suite)
def chart_category_distribution(df: pd.DataFrame, output: str = "chart_pie.png"):
    """Pie chart of units sold by category."""
    units = df.groupby("category")["units_sold"].sum()

    fig, ax = plt.subplots(figsize=(6, 6))
    colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
    ax.pie(units, labels=units.index, autopct="%1.1f%%", colors=colors, startangle=90)
    ax.set_title("Units Sold by Category", fontsize=14, fontweight="bold")
    plt.tight_layout()
    plt.savefig(output, dpi=150)
    plt.close()
    print(f"Pie chart saved to {output}")

def chart_price_vs_units(df: pd.DataFrame, output: str = "chart_scatter.png"):
    """Scatter chart of price vs units sold."""
    fig, ax = plt.subplots(figsize=(8, 5))
    categories = df["category"].unique()
    colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]

    for cat, color in zip(categories, colors):
        subset = df[df["category"] == cat]
        ax.scatter(subset["revenue"], subset["units_sold"], label=cat, alpha=0.6, color=color, s=50)

    ax.set_title("Revenue vs Units Sold", fontsize=14, fontweight="bold")
    ax.set_xlabel("Revenue ($)")
    ax.set_ylabel("Units Sold")
    ax.legend()
    plt.tight_layout()
    plt.savefig(output, dpi=150)
    plt.close()
    print(f"Scatter chart saved to {output}")

chart_category_distribution(df)
chart_price_vs_units(df)
```

L'`autopct="%1.1f%%"` du secteur est un mini spécificateur de format — matplotlib appelle cette chaîne avec le pourcentage de chaque tranche et elle rend une décimale plus un `%` littéral, donc une tranche de `0.27` devient `27.0%` (le `%%` doublé échappe le `%` unique). La boucle `for cat, color in zip(...)` de la dispersion divise le cadre par catégorie et dessine chacune comme sa propre série colorée, donc une légende peut distinguer quatre groupes — et `alpha=0.6` rend les points qui se chevauchent visibles plutôt que des pâtés solides. Les deux fonctions gardent la discipline de l'Étape 2 : entrée idempotente, un PNG en sortie.

**🎯 Résultat attendu :** `chart_pie.png` montrant les parts d'unités des quatre catégories avec des étiquettes de pourcentage, et `chart_scatter.png` avec quatre séries colorées, des étiquettes d'axes et une légende.

**🩹 Si ça ne marche pas :** Si les étiquettes du secteur se chevauchent ou disparaissent, il y a trop de tranches ou des tranches trop similaires pour une étiquette propre — `autopct` ne retire pas les petites tranches, il les étiquette juste. Si la dispersion montre une seule couleur ou une légende vide, l'appairage `zip(categories, colors)` a mal correspondi — les deux séquences doivent avoir le même ordre. Si `%1.1f%%` imprime un `1.1f` littéral, il manque à la chaîne de format l'échappement de l'opérateur `%`.

### 3.3 Vérifie les quatre graphiques

**✅ Liste de vérification**

- ✅ Quatre PNG existent : `chart_bar.png`, `chart_line.png`, `chart_pie.png`, `chart_scatter.png`.
- ✅ Chacun s'ouvre pour révéler le type de graphique que son nom promet.
- ✅ Le backend `Agg` et la discipline `plt.close()` ont tenu à travers les quatre fonctions.

**🤔 Question(s) socratique(s)**

- Le secteur et la barre montrent tous deux des résumés par catégorie, depuis les mêmes données. Quand un graphique en secteurs est-il réellement le mauvais choix pour une comparaison de catégories, même s'il s'affiche très bien — et que *perd* un lecteur qu'une barre transmet ?
- Chaque fonction de graphique code en dur son propre titre. Si un rapport avait besoin de thème sur chaque graphique (même police, même format d'en-tête), qu'est-ce qui changerait structurellement — et pourquoi le motif `fig, ax = plt.subplots(...)` rend-il cela plus facile que de tracer sur une figure implicite globale ?

## Étape 4 : Formate un tableau récapitulatif

Les graphiques répondent « que disent les nombres d'un coup d'œil » ; un tableau répond « que sont-ils exactement ». Cette étape construit un tableau texte avec des colonnes alignées, des totaux et un formatage de dollars — une sortie prête à glisser dans un rapport, un email ou un terminal.

### 4.1 Agrége et aligne le tableau

**👟 Indice de départ :** Utilise un seul `groupby().agg()` pour calculer les quatre colonnes récapitulatives en une fois, puis dispose-les avec des largeurs de champ f-string pour que les colonnes s'alignent au caractère près.

```python
# report.py (suite)
def format_summary_table(df: pd.DataFrame) -> str:
    """Create a formatted summary table of sales by category."""
    summary = df.groupby("category").agg(
        total_revenue=("revenue", "sum"),
        avg_revenue=("revenue", "mean"),
        total_units=("units_sold", "sum"),
        num_transactions=("revenue", "count"),
    ).round(2)

    lines = []
    header = f"{'Category':<15} {'Revenue':>12} {'Avg Sale':>10} {'Units':>8} {'Sales':>8}"
    lines.append(header)
    lines.append("-" * len(header))

    for cat, row in summary.iterrows():
        line = f"{cat:<15} ${row['total_revenue']:>10,.2f} ${row['avg_revenue']:>8,.2f} {int(row['total_units']):>8} {int(row['num_transactions']):>8}"
        lines.append(line)

    lines.append("-" * len(header))
    total_rev = summary["total_revenue"].sum()
    total_units = int(summary["total_units"].sum())
    total_sales = int(summary["num_transactions"].sum())
    lines.append(f"{'TOTAL':<15} ${total_rev:>10,.2f} {'':>10} {total_units:>8} {total_sales:>8}")

    return "\n".join(lines)

table = format_summary_table(df)
print(table)
```

`df.groupby("category").agg(...)` exécute *quatre* agrégations en une passe — chaque entrée nomme une colonne de sortie et la paire `(colonne_source, opération)` pour la produire, ce qui est nettement plus prêt que quatre appels `groupby` séparés. Les largeurs de f-string font un vrai travail de disposition : `:>12` aligne à droite le revenu sur 12 caractères et le `,` dans `:>10,.2f` ajoute des séparateurs de milliers, donc `2984.5` devient `  $2,984.50` et chaque ligne s'aligne à la même colonne. La ligne finale `TOTAL` réutilise les mêmes spécificateurs de largeur avec une chaîne de remplissage vide pour que le pied de page s'aligne avec les lignes de données au-dessus.

**🎯 Résultat attendu :** Un en-tête de cinq lignes, puis quatre lignes de données (une par catégorie) se terminant par une ligne `TOTAL` — chaque colonne alignée verticalement et les valeurs en dollars formatées avec des virgules.

**🩹 Si ça ne marche pas :** Si les colonnes se désalignent visiblement, les nombres de largeur dans l'en-tête et les lignes du corps sont en désaccord — les deux doivent utiliser les mêmes spécificateurs. Si `TOTAL` dérive à droite, son champ de remplissage vide a une largeur différente de la colonne `Avg Sale`. Si les valeurs apparaissent comme `2984.5` sans virgules, il manque le drapeau `,` au format `.2f`.

### 4.2 Vérifie le tableau

**✅ Liste de vérification**

- ✅ Le tableau a une ligne par catégorie plus une ligne `TOTAL` en gras.
- ✅ Les colonnes de revenu sont alignées à droite, groupées par virgules, et à deux décimales.
- ✅ Re-exécuter la fonction produit une chaîne identique pour les mêmes données.

**🤔 Question(s) socratique(s)**

- Le tableau est construit avec des f-strings à largeur fixe, ce qui fonctionne parce que les *noms* de colonnes tiennent dans ces largeurs. Qu'est-ce qui brise l'alignement si un nom de catégorie fait 30 caractères — et quelles sont les deux ou trois options (tronquer, largeur dynamique, une bibliothèque) quand de vraies données dépassent tes colonnes ?
- `int(row['total_units'])` arrondit délibérément vers le bas les comptages fractionnaires d'unités. Le `.round(2)` ci-dessus arrondit d'abord les moyennes. Pourquoi arrondir indépendamment les valeurs *d'affichage*, plutôt que l'agrégat sous-jacent, est-il généralement le choix de reporting le plus sûr ?

## Étape 5 : Assemble le rapport

L'étape finale est le gain : exécuter les quatre graphiques et le tableau dans un seul fichier de rapport — complet avec un horodatage généré et la plage de dates couverte — pour qu'un manager puisse ouvrir un dossier et voir toute l'histoire.

### 5.1 Génère le dossier de rapport

**👟 Indice de départ :** Fais en sorte que l'assembleur crée son propre répertoire de sortie, régénère chaque artefact dedans, et écrive un rapport texte qui référence chaque graphique par son nom.

```python
# report.py (suite)
from datetime import datetime

def generate_report(df: pd.DataFrame, output_dir: str = "report"):
    """Generate a complete report with charts and tables."""
    os.makedirs(output_dir, exist_ok=True)

    chart_revenue_by_category(df, f"{output_dir}/chart_bar.png")
    chart_revenue_trend(df, f"{output_dir}/chart_line.png")
    chart_category_distribution(df, f"{output_dir}/chart_pie.png")
    chart_price_vs_units(df, f"{output_dir}/chart_scatter.png")

    table = format_summary_table(df)

    report_lines = [
        "=" * 65,
        "  SALES REPORT",
        f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"  Period: {df['date'].min().strftime('%Y-%m-%d')} to {df['date'].max().strftime('%Y-%m-%d')}",
        "=" * 65,
        "",
        "  SUMMARY",
        "  " + "-" * 40,
        f"  Total Revenue:     ${df['revenue'].sum():>12,.2f}",
        f"  Average Sale:      ${df['revenue'].mean():>12,.2f}",
        f"  Total Units Sold:  {df['units_sold'].sum():>12,}",
        f"  Transactions:      {len(df):>12,}",
        "",
        "  REVENUE BY CATEGORY",
        "  " + "-" * 40,
        table,
        "",
        "  CHARTS",
        "  " + "-" * 40,
        "  chart_bar.png     - Revenue by category (bar chart)",
        "  chart_line.png    - Daily revenue trend (line chart)",
        "  chart_pie.png     - Units distribution (pie chart)",
        "  chart_scatter.png - Revenue vs units (scatter chart)",
        "",
        "=" * 65,
    ]

    report_text = "\n".join(report_lines)
    report_path = f"{output_dir}/report.txt"
    with open(report_path, "w") as f:
        f.write(report_text)

    print(f"\nReport generated in {output_dir}/")
    print(report_text)

generate_report(df)
```

Deux choix de design font de ceci un véritable outil de rapport plutôt qu'une démo. Il est *régénérable* : l'assembleur recrée chaque artefact dans son propre répertoire, donc la même commande sur des données mises à jour produit un rapport mis à jour, et le répertoire contient toujours exactement l'ensemble courant. Il porte *des métadonnées* : `datetime.now()` tamponne quand il a tourné et `df['date'].min() ... max()` enregistre la période couverte, pour qu'un lecteur (ou un destinataire d'email) puisse dire d'un coup d'œil si le rapport est actuel ou périmé. Chaque fonction que ce projet a construite est maintenant assemblée à un seul endroit — tout le pipeline de l'Étape 1 → 4, invoqué par un seul appel.

**🎯 Résultat attendu :** Un dossier `report/` contenant `report.txt` et les quatre PNG de graphiques. Le rapport texte s'ouvre avec l'en-tête horodaté, les statistiques récapitulatives, le tableau de catégories aligné et un manifeste des graphiques.

**🩹 Si ça ne marche pas :** Si l'en-tête imprime `Period: NaT to NaT`, les dates n'ont pas été parsées au chargement (le `parse_dates` de l'Étape 1 manque). Si des graphiques manquent dans le dossier, une des quatre fonctions de graphiques a échoué avant l'enregistrement — exécute le « si ça ne marche pas » de chaque fonction indépendamment. Si `report.txt` est rejeté par un système d'email pour des caractères bizarres, vérifie si les f-strings ont inséré un champ parasite ; une ré-exécution devrait être atomique.

### 5.2 Vérifie le rapport assemblé

**✅ Liste de vérification**

- ✅ `report/` contient `report.txt` et les quatre PNG de graphiques.
- ✅ La ligne `Period:` du rapport correspond à la vraie plage de dates dans `df`.
- ✅ Re-exécuter `generate_report(df)` écrase proprement le dossier avec les artefacts courants.

**🤔 Question(s) socratique(s)**

- Le rapport écrit graphiques et texte *ensemble* à chaque exécution. Que laisse-t-elle sur disque une exécution cassée — disons, une exception à mi-chemin de la section des graphiques — et quels deux petits changements (répertoire temporaire + renommage, ou try/finally) rendraient la régénération atomique ?
- L'horodatage est le signal de fraîcheur du rapport. Si le rapport tournait selon un calendrier chaque lundi, `Generated:` seul dirait-il à un lecteur si les *données* étaient actuelles ? Quel second champ ajouterais-tu pour séparer « quand le rapport a été fait » de « l'âge des données » ?

## ⚠️ Pièges courants

- **Ordre d'import `Agg`.** `matplotlib.use("Agg")` doit s'exécuter *avant* `import matplotlib.pyplot as plt`, sinon le backend GUI gagne et les exécutions sans écran plantent avec une erreur « no display ». Correction : garde la ligne `use` physiquement au-dessus de l'import de pyplot — le bloc d'import du fichier le fait délibérément.
- **Dates non parsées.** Sans `parse_dates=["date"]`, la colonne de date reste en chaînes, donc `df['date'].min()` trie textuellement et les graphiques en lignes mettent d'étranges graduations sur l'axe. Correction : parse au chargement (Étape 1) et confirme avec `df.dtypes`.
- **Exécuter des graphiques sans affichage.** Le backend `Agg` rend vers des fichiers — c'est toute la raison pour laquelle il est activé ici. Correction : ne retire jamais la ligne `use` pour ce projet ; les graphiques sont enregistrés, non affichés.
- **Tableaux désalignés.** Mélanger les largeurs d'en-tête et les largeurs de corps casse silencieusement l'alignement des colonnes. Correction : garde les chaînes de format identiques pour l'en-tête et les lignes de données, et laisse la ligne `TOTAL` les réutiliser.
- **Colonnes supplémentaires venant d'un index.** `df.to_csv(...)` sans `index=False` écrit une colonne d'index sans nom qui se recharge comme du bruit. Correction : passe toujours `index=False`, comme le fait le générateur.

## Ce que tu viens de construire

Un générateur de rapports qui prend un CSV de ventes brut et produit un paquet complet : un DataFrame nettoyé, quatre types de graphiques intentionnels, un tableau récapitulatif prêt pour la publication, et un fichier de rapport horodaté qui nomme chaque artefact. La compétence transférable est la *boucle donnée-vers-livrable* — charger, agréger, visualiser, assembler — qui est le squelette identique derrière les tableaux de bord, les résumés exécutifs et toute automatisation « envoie-moi les chiffres de la semaine » que tu rencontreras dans un emploi.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/report-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/report-builder) dans le dépôt du cours livre l'assembleur complet plus un export PDF basé sur `reportlab` et un filtrage par plage de dates. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute un **export PDF** avec `reportlab` — le résumé sur la première page et un graphique par page. Le petit indice : `uv add reportlab` et `from reportlab.platypus import SimpleDocTemplate, Paragraph, Image` couvre ~90 % de ce dont tu as besoin.
- Donne à `generate_report` un **filtrage par dates** — accepte `start_date`/`end_date` et découpe `df` avant de tracer, pour qu'une seule fonction produise des rapports hebdomadaires, mensuels ou trimestriels depuis la même source.
- Ajoute une **section trimestre-sur-trimestre** : agrège le revenu en deux trimestres et imprime le pourcentage de croissance plus une flèche haut/bas — un ajout de six lignes au jumeau de `format_summary_table`.
- Programme-la avec le paquet `schedule` pour que le `generate_report(df)` du lundi s'exécute tout seul — puis déplace le chemin du rapport texte dans un email via `smtplib` et tu as construit le pipeline classique « rapport auto-envoyé aux parties prenantes ».

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README contient un parcours complet, adapté aux débutants, pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, étape par étape. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans la transformation des feuilles de calcul en histoires. 🎓
