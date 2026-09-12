---
title: "Explorateur de Visualisation de Données"
description: "Créez des graphiques interactifs et des tableaux de bord avec matplotlib, seaborn et plotly."
difficulty: "beginner"
estimatedMinutes: 50
xpReward: 50
tags: ["matplotlib", "seaborn", "plotly", "data-visualization", "pandas"]
prerequisites:
  - "Les bases de Python (variables, boucles, fonctions)"
  - "pandas de base (DataFrames, groupby)"
  - "matplotlib de base"
learningObjectives:
  - "Créer des diagrammes en barres, des courbes et des nuages de points avec matplotlib"
  - "Construire des visualisations statistiques avec seaborn"
  - "Créer des graphiques interactifs avec plotly"
  - "Personnaliser les styles de graphiques et les thèmes de couleurs"
  - "Combiner plusieurs graphiques dans des tableaux de bord"
---

# 📊 Explorateur de Visualisation de Données

Les nombres enfouis dans des tableaux sont difficiles à exploiter. Les graphiques font ressortir immédiatement les motifs, les valeurs aberrantes et les tendances. Ce projet vous mène des graphiques de base avec matplotlib aux visuels statistiques de seaborn, puis aux tableaux de bord interactifs de plotly, en bâtissant une boîte à outils réutilisable sur n'importe quel jeu de données rencontré.

C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète.

- **Exécutez-le dans le navigateur.** Un compagnon notebook interactif est prêt, ouvrez-le dans Colab, Kaggle ou Binder et suivez les étapes dans l'ordre.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-visualization/notebook.fr.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-visualization/notebook.fr.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-visualization%2Fnotebook.fr.ipynb)

## Ce que vous ferez

1. Créer des diagrammes en barres, des courbes et des nuages de points avec matplotlib
2. Construire des visualisations statistiques avec seaborn (diagrammes en boîte, cartes de chaleur, diagrammes en paires)
3. Créer des graphiques HTML interactifs avec plotly
4. Personnaliser les styles de graphiques, les thèmes de couleurs et la typographie
5. Combiner plusieurs graphiques dans des tableaux de bord multi-panneaux
6. Exporter les graphiques en fichiers PNG et HTML interactifs

## Où l'exécuter

- **Localement avec `uv` (recommandé).** Ce projet utilise `matplotlib`, `seaborn` et `plotly`, donc une installation locale est le chemin le plus simple. La section Configuration ci-dessous vous guide étape par étape.
- **Playground JupyterLite.** Collez les cellules de code directement dans un notebook, cela fonctionne bien pour explorer les étapes d'analyse (1–5), même si la mise en page du tableau de bord (Étape 5) profite d'un vrai terminal pour enregistrer les fichiers.
- **Google Colab.** Ouvrez un nouveau notebook et collez les cellules. Même réserve qu'avec JupyterLite : la sauvegarde de fichiers fonctionne mieux dans un vrai terminal.

## Configuration

`uv` est un outil unique qui remplace la chaîne habituelle « installer Python, puis pip, puis un environnement virtuel », il peut installer et gérer des versions de Python en plus des dépendances de votre projet.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Fermez puis rouvrez votre terminal, puis confirmez l'installation :

```bash
uv --version
```

Ensuite, configurez le projet :

```bash
uv init data-viz
cd data-viz
uv add matplotlib seaborn plotly pandas
```

`pandas` charge et transforme vos données. `matplotlib` est la fondation sur laquelle seaborn et d'autres s'appuient. `seaborn` ajoute des graphiques statistiques par-dessus matplotlib. `plotly` crée des graphiques HTML interactifs que vous pouvez ouvrir dans un navigateur.

## Étape 1 : Créer des données d'exemple et les charger

Construisez un CSV avec des données de ventes multi-catégories, puis chargez-le dans un DataFrame. Chaque étape suivante utilise ce même jeu de données, assez varié pour montrer différents types de graphiques, assez petit pour le lire à la main.

### 1.1 Écrire le CSV et le charger

**👟 Indice de démarrage :** Définissez une chaîne multiligne avec les colonnes `month`, `category`, `region`, `units`, `revenue` et `cost`. Écrivez-la sur le disque, puis relisez-la avec `pd.read_csv`. Affichez la forme et les premières lignes pour confirmer le chargement.

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px

csv_data = """month,category,region,units,revenue,cost
2026-01,Electronics,North,120,54000,32000
2026-01,Clothing,South,95,14250,8500
2026-01,Electronics,South,80,36000,21000
2026-02,Electronics,North,135,60750,36000
2026-02,Clothing,North,110,16500,9900
2026-02,Home,South,70,21000,13000
2026-03,Electronics,North,150,67500,40000
2026-03,Clothing,South,125,18750,11250
2026-03,Home,North,95,28500,17000
2026-04,Electronics,South,140,63000,37000
2026-04,Clothing,North,160,24000,14400
2026-04,Home,South,100,30000,18000
2026-05,Electronics,North,170,76500,45000
2026-05,Clothing,South,130,19500,11700
2026-05,Home,North,115,34500,20000
2026-06,Electronics,South,155,69750,41000
2026-06,Clothing,North,145,21750,13050
2026-06,Home,South,120,36000,21600"""

with open("sales.csv", "w") as f:
    f.write(csv_data.strip())

df = pd.read_csv("sales.csv")
print(f"Shape: {df.shape}")
print(f"\nColumn types:\n{df.dtypes}")
print(f"\nFirst 5 rows:\n{df.head()}")
print(f"\nBasic stats:\n{df.describe()}")
```

**🎯 Sortie attendue :**

```
Shape: (18, 6)

Column types:
month      object
category   object
region     object
units       int64
revenue     int64
cost        int64

First 5 rows:
    month     category region  units  revenue   cost
0  2026-01  Electronics  North    120    54000  32000
1  2026-01    Clothing   South     95    14250   8500
2  2026-01  Electronics  South     80    36000  21000
3  2026-02  Electronics  North    135    60750  36000
4  2026-02    Clothing   North    110    16500   9900

Basic stats:
            units        revenue          cost
count   18.000000      18.000000     18.000000
mean   123.888889   41083.333333  24227.777778
...
```

**🩹 Si ça ne va pas :** Si vous obtenez `FileNotFoundError`, votre répertoire de travail est incorrect, exécutez `pwd` pour vérifier. Si la forme affiche `(0, 6)`, la chaîne CSV a un problème de guillemets, assurez-vous qu'il n'y a pas de guillemets parasites dans les lignes de données. Si `units` affiche `float64` au lieu de `int64`, l'une de vos valeurs pourrait avoir un point décimal.

### 1.2 Vérifier que les données se sont bien chargées

**✅ Liste de contrôle**

- ✅ `df.shape` est `(18, 6)`, 18 lignes, 6 colonnes.
- ✅ Les six noms de colonnes apparaissent : `month`, `category`, `region`, `units`, `revenue`, `cost`.
- ✅ `df.dtypes` affiche trois colonnes object (texte) et trois colonnes int64 (nombres).
- ✅ `df.describe()` produit des statistiques pour les colonnes numériques sans erreur.

**🤔 Questions socratiques**

Pourquoi stocker `month` comme chaîne (`"2026-01"`) plutôt que comme objet datetime ? Quel avantage la forme de chaîne offre-t-elle pour les opérations groupby, et quel inconvénient pour le tracé de séries temporelles ?

---

## Étape 2 : Graphiques de base avec matplotlib

Matplotlib est la fondation, toute autre bibliothèque de visualisation Python l'enveloppe ou imite son API. Maîtrisez ici les quatre types de graphiques essentiels : barres, courbes, nuages de points et camembert.

### 2.1 Diagramme en barres : revenus par catégorie

**👟 Indice de démarrage :** Regroupez par `category`, sommez `revenue` et tracez avec `ax.bar()`. Ajoutez des étiquettes de valeur au-dessus de chaque barre avec `ax.text()`. Supprimez les bordures supérieure et droite pour un rendu plus propre.

```python
category_revenue = df.groupby("category")["revenue"].sum()

fig, ax = plt.subplots(figsize=(8, 5))
colors = ["#2196F3", "#FF9800", "#4CAF50"]
bars = ax.bar(category_revenue.index, category_revenue.values, color=colors, edgecolor="white")

for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width() / 2.0, height, f"${height:,.0f}",
            ha="center", va="bottom", fontweight="bold")

ax.set_title("Total Revenue by Category", fontsize=14, fontweight="bold")
ax.set_ylabel("Revenue ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("revenue_by_category.png", dpi=150)
plt.show()
print("Saved: revenue_by_category.png")
```

**🎯 Sortie attendue :** Un diagramme en barres avec trois barres (Clothing, Electronics, Home). Electronics est la plus haute à environ 367 500 $. Les montants en dollars sont placés au-dessus de chaque barre. Un fichier `revenue_by_category.png` est enregistré sur le disque.

**🩹 Si ça ne va pas :** Si les barres semblent écrasées, augmentez `figsize` à `(10, 6)`. Si les étiquettes de dollars chevauchent les barres, vérifiez que `va="bottom"` est défini, cela pousse le texte au-dessus du sommet de la barre. Si `tight_layout()` émet un avertissement, cela signifie que vos sous-graphiques ont des tailles fixes impossibles à ajuster, c'est normal, l'avertissement peut être ignoré sans risque.

### 2.2 Courbe : tendance mensuelle des revenus

**👟 Indice de démarrage :** Regroupez par `month` et sommez `revenue`. Utilisez `ax.plot()` avec `marker="o"` pour afficher les points de données. Ajoutez une région ombrée avec `ax.fill_between()` pour mettre en évidence l'écart entre revenus et coûts.

```python
monthly = df.groupby("month")[["revenue", "cost"]].sum().sort_index()

fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(monthly.index, monthly["revenue"], marker="o", linewidth=2, label="Revenue", color="#4CAF50")
ax.plot(monthly.index, monthly["cost"], marker="s", linewidth=2, label="Cost", color="#F44336")
ax.fill_between(monthly.index, monthly["revenue"], monthly["cost"], alpha=0.1, color="#4CAF50")

ax.set_title("Monthly Revenue vs. Cost", fontsize=14, fontweight="bold")
ax.set_ylabel("Amount ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
ax.legend()
ax.grid(axis="y", alpha=0.3)
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("monthly_trend.png", dpi=150)
plt.show()
print("Saved: monthly_trend.png")
```

**🎯 Sortie attendue :** Deux courbes, verte pour les revenus et rouge pour les coûts, avec l'écart ombré entre elles représentant le profit. Les revenus restent au-dessus des coûts chaque mois. Un fichier `monthly_trend.png` est enregistré.

**🩹 Si ça ne va pas :** Si les courbes semblent saccadées ou désordonnées, votre colonne `month` n'est pas triée, ajoutez `.sort_index()` après le groupby. Si la zone ombrée remplit la mauvaise région, vérifiez que `fill_between` utilise `monthly["revenue"]` en premier et `monthly["cost"]` en second, l'ordre détermine quelle courbe est la limite supérieure.

### 2.3 Nuage de points : revenus vs. coûts

**👟 Indice de démarrage :** Tracez chaque catégorie comme une série distincte avec `ax.scatter()`, en utilisant des couleurs différentes. Ajoutez une ligne diagonale de seuil de rentabilité avec `ax.plot()` là où les revenus égalent les coûts.

```python
cat_colors = {"Electronics": "#2196F3", "Clothing": "#FF9800", "Home": "#4CAF50"}

fig, ax = plt.subplots(figsize=(8, 6))
for category in df["category"].unique():
    subset = df[df["category"] == category]
    ax.scatter(subset["cost"], subset["revenue"], s=100, alpha=0.8,
               label=category, color=cat_colors[category], edgecolors="white")

max_val = max(df["revenue"].max(), df["cost"].max())
ax.plot([0, max_val], [0, max_val], linestyle="--", color="gray", alpha=0.5, label="Break-even")

ax.set_title("Revenue vs. Cost by Category", fontsize=14, fontweight="bold")
ax.set_xlabel("Cost ($)")
ax.set_ylabel("Revenue ($)")
ax.legend()
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("revenue_vs_cost.png", dpi=150)
plt.show()
```

**🎯 Sortie attendue :** Des points colorés regroupés au-dessus de la ligne de seuil de rentabilité en pointillés, signifiant que chaque enregistrement est rentable. Les points d'Electronics sont les plus éloignés de la ligne (marges les plus élevées). Un fichier `revenue_vs_cost.png` est enregistré.

**🩹 Si ça ne va pas :** Si les points se chevauchent beaucoup, augmentez `alpha` à `0.6` pour plus de transparence ou augmentez `s` à `150` pour des points plus grands. Si la ligne de seuil de rentabilité n'apparaît pas en diagonale, vos axes x et y ont des échelles différentes, appelez `ax.set_aspect("equal")` pour corriger, même si cela peut compresser l'un des axes.

### 2.4 Camembert : part par catégorie

**👟 Indice de démarrage :** Regroupez par `category`, sommez `revenue` et utilisez `ax.pie()` avec `autopct` pour les étiquettes de pourcentage et `startangle` pour une rotation propre.

```python
cat_share = df.groupby("category")["revenue"].sum()

fig, ax = plt.subplots(figsize=(7, 7))
wedges, texts, autotexts = ax.pie(
    cat_share, labels=cat_share.index, autopct="%1.1f%%",
    startangle=90, colors=["#2196F3", "#FF9800", "#4CAF50"],
    textprops={"fontsize": 12}
)
for autotext in autotexts:
    autotext.set_fontweight("bold")

ax.set_title("Revenue Share by Category", fontsize=14, fontweight="bold")
plt.tight_layout()
plt.savefig("category_share.png", dpi=150)
plt.show()
```

**🎯 Sortie attendue :** Un camembert divisé en trois parts avec des étiquettes de pourcentage. Electronics domine à environ 56 %, Clothing autour de 19 %, Home autour de 25 %.

**🩹 Si ça ne va pas :** Si les étiquettes du camembert se chevauchent, augmentez `figsize` à `(9, 9)`. Si les pourcentages totalisent plus de 100 %, votre groupby n'a pas sommé correctement, vérifiez que vous avez appelé `.sum()` et non `.count()`.

**✅ Liste de contrôle**

- ✅ Quatre types de graphiques générés : barres, courbes, nuages de points et camembert.
- ✅ Chaque graphique a un titre clair, des étiquettes d'axes (le cas échéant) et une légende (le cas échéant).
- ✅ Les quatre fichiers PNG sont enregistrés sur le disque et non vides.
- ✅ Aucun texte superposé, aucune étiquette coupée, aucun point de données manquant.

**🤔 Questions socratiques**

Quand un diagramme en barres serait-il plus informatif qu'un camembert pour les mêmes données ? Que devient le camembert si vous avez dix catégories au lieu de trois, pouvez-vous toujours lire les parts plus petites ?

---

## Étape 3 : Graphiques statistiques avec seaborn

Seaborn s'appuie sur matplotlib pour vous offrir des visualisations statistiques en une ligne de code. Les diagrammes en boîte montrent les distributions. Les cartes de chaleur révèlent les corrélations. Les diagrammes en paires exposent les relations entre toutes les variables à la fois.

### 3.1 Diagramme en boîte : distribution des revenus par catégorie

**👟 Indice de démarrage :** Utilisez `sns.boxplot()` avec `x="category"` et `y="revenue"`. Configurez d'abord un thème seaborn avec `sns.set_theme()` pour un style cohérent.

```python
sns.set_theme(style="whitegrid")

fig, ax = plt.subplots(figsize=(8, 5))
sns.boxplot(data=df, x="category", y="revenue", palette="Set2", ax=ax)
ax.set_title("Revenue Distribution by Category", fontsize=14, fontweight="bold")
ax.set_xlabel("Category")
ax.set_ylabel("Revenue ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
plt.tight_layout()
plt.savefig("revenue_boxplot.png", dpi=150)
plt.show()
print("Saved: revenue_boxplot.png")
```

**🎯 Sortie attendue :** Trois diagrammes en boîte à moustaches côte à côte. Electronics présente la plus grande étendue (variabilité la plus forte). La ligne médiane dans chaque boîte montre les revenus typiques par enregistrement. Un fichier `revenue_boxplot.png` est enregistré.

**🩹 Si ça ne va pas :** Si les trois boîtes semblent identiques, vos données pourraient contenir des lignes dupliquées, revenez à l'Étape 1 et vérifiez. Si les boîtes sont décentrées, `sns.set_theme(style="whitegrid")` n'a peut-être pas été exécuté avant le tracé, appelez-le de nouveau juste avant la figure.

### 3.2 Carte de chaleur : matrice de corrélation

**👟 Indice de démarrage :** Sélectionnez uniquement les colonnes numériques, calculez `.corr()` et passez le résultat à `sns.heatmap()`. Utilisez `annot=True` pour afficher les valeurs de corrélation dans chaque cellule et `cmap="RdYlGn"` pour une échelle rouge-jaune-vert.

```python
numeric_cols = df[["units", "revenue", "cost"]]
corr = numeric_cols.corr()

fig, ax = plt.subplots(figsize=(6, 5))
sns.heatmap(corr, annot=True, cmap="RdYlGn", vmin=-1, vmax=1,
            center=0, fmt=".2f", linewidths=0.5, ax=ax)
ax.set_title("Correlation Matrix", fontsize=14, fontweight="bold")
plt.tight_layout()
plt.savefig("correlation_heatmap.png", dpi=150)
plt.show()
print("Saved: correlation_heatmap.png")
```

**🎯 Sortie attendue :** Une grille colorée où `revenue` et `cost` montrent une forte corrélation positive (proche de 1,0, un coût plus élevé signifie des revenus plus élevés). `units` est corrélé avec les deux mais moins fortement. Un fichier `correlation_heatmap.png` est enregistré.

**🩹 Si ça ne va pas :** Si la carte de chaleur est d'une seule couleur, la plage `vmin`/`vmax` est trop large pour les valeurs de corrélation réelles, essayez `vmin=corr.values.min() - 0.1` et `vmax=corr.values.max() + 0.1`. Si vous obtenez `ValueError: correlation matrix is not symmetric`, vous avez passé le DataFrame brut au lieu du résultat de `.corr()`.

### 3.3 Diagramme en paires : toutes les relations numériques

**👟 Indice de démarrage :** Utilisez `sns.pairplot()` avec `hue="category"` pour colorer les points par catégorie. Cela crée une matrice de nuages de points pour chaque paire de colonnes numériques, avec des histogrammes sur la diagonale.

```python
pair = sns.pairplot(df, hue="category", palette="Set2", diag_kind="kde",
                    plot_kws={"alpha": 0.7, "s": 80})
pair.figure.suptitle("Pair Plot — All Numeric Relationships", y=1.02, fontsize=14, fontweight="bold")
pair.savefig("pair_plot.png", dpi=150, bbox_inches="tight")
plt.show()
print("Saved: pair_plot.png")
```

**🎯 Sortie attendue :** Une grille 3x3 de graphiques. Les cellules hors diagonale sont des nuages de points montrant comment `units`, `revenue` et `cost` se rapportent les uns aux autres. Les cellules diagonales sont des courbes de densité (KDE) montrant la distribution de chaque variable, colorées par catégorie. Un fichier `pair_plot.png` est enregistré.

**🩹 Si ça ne va pas :** Si le diagramme en paires est énorme et difficile à lire, votre jeu de données a trop de colonnes numériques, limitez à 3–4 avec `df[["units", "revenue", "cost"]]` avant de le passer à `pairplot`. Si les couleurs ne correspondent pas entre les sous-graphiques, assurez-vous que `hue="category"` est défini, sans lui, tous les points sont de la même couleur.

**✅ Liste de contrôle**

- ✅ Le diagramme en boîte montre trois distributions distinctes avec des médianes et des étendues différentes.
- ✅ La carte de chaleur a des cellules annotées avec des valeurs de corrélation entre -1 et 1.
- ✅ Le diagramme en paires montre des nuages de points hors diagonale et des courbes de densité sur la diagonale.
- ✅ Les trois fichiers PNG de seaborn sont enregistrés sur le disque.

**🤔 Questions socratiques**

La matrice de corrélation montre que `revenue` et `cost` sont fortement corrélés. La corrélation implique-t-elle la causalité ici, dépenser plus *cause-t-il* des revenus plus élevés, ou existe-t-il une explication plus simple ?

---

## Étape 4 : Graphiques interactifs avec plotly

Les PNG statiques sont excellents pour les rapports, mais plotly génère des graphiques HTML interactifs que vous pouvez zoomer, survoler et faire défiler dans un navigateur. C'est là que vos visualisations commencent à ressembler à de vrais tableaux de bord.

### 4.1 Diagramme en barres interactif

**👟 Indice de démarrage :** Utilisez `px.bar()` avec les paramètres `x`, `y` et `color`. Configurez `barmode="group"` pour placer les barres côte à côte au lieu de les empiler. Exportez en HTML avec `fig.write_html()`.

```python
monthly_cat = df.groupby(["month", "category"])["revenue"].sum().reset_index()

fig = px.bar(monthly_cat, x="month", y="revenue", color="category",
             barmode="group", title="Monthly Revenue by Category",
             labels={"revenue": "Revenue ($)", "month": "Month"},
             color_discrete_map={"Electronics": "#2196F3", "Clothing": "#FF9800", "Home": "#4CAF50"})
fig.update_layout(yaxis_tickformat="$,.0f", xaxis_title="Month", yaxis_title="Revenue ($)")
fig.show()
fig.write_html("interactive_bar.html")
print("Saved: interactive_bar.html")
```

**🎯 Sortie attendue :** Une fenêtre de navigateur (ou une cellule de notebook) s'ouvre avec un diagramme en barres groupées. Survolez n'importe quelle barre pour voir le mois, la catégorie et le montant de revenus exacts. Zoomez en cliquant et en glissant. Un fichier `interactive_bar.html` est enregistré, ouvrez-le dans n'importe quel navigateur.

**🩹 Si ça ne va pas :** Si les barres s'empilent au lieu de se regrouper, vous avez oublié `barmode="group"`, la valeur par défaut est `"relative"`, qui empile. Si le fichier HTML s'ouvre mais n'affiche rien, votre navigateur peut bloquer le JavaScript des fichiers locaux, essayez de l'ouvrir depuis un serveur local ou utilisez `fig.show()` dans un notebook.

### 4.2 Nuage de points interactif

**👟 Indice de démarrage :** Utilisez `px.scatter()` avec `x`, `y`, `color` et `size` pour encoder quatre dimensions à la fois, coût sur x, revenus sur y, catégorie comme couleur et `units` comme taille du point.

```python
fig = px.scatter(df, x="cost", y="revenue", color="category", size="units",
                 hover_data=["month", "region"],
                 title="Revenue vs. Cost (dot size = units sold)",
                 labels={"cost": "Cost ($)", "revenue": "Revenue ($)", "units": "Units Sold"},
                 color_discrete_map={"Electronics": "#2196F3", "Clothing": "#FF9800", "Home": "#4CAF50"})
fig.update_layout(xaxis_tickformat="$,.0f", yaxis_tickformat="$,.0f")
fig.show()
fig.write_html("interactive_scatter.html")
print("Saved: interactive_scatter.html")
```

**🎯 Sortie attendue :** Des points colorés de tailles variées. Les points plus grands signifient plus d'unités vendues. Survolez n'importe quel point pour voir le mois, la région, le coût, les revenus et les unités. Un fichier `interactive_scatter.html` est enregistré.

**🩹 Si ça ne va pas :** Si tous les points ont la même taille, `size="units"` n'est pas appliqué, vérifiez que `units` est numérique et non une chaîne. Si les données de survol affichent `NaN`, le nom de colonne a une faute de frappe ou la colonne n'existe pas.

### 4.3 Courbe interactive avec curseur de plage

**👟 Indice de démarrage :** Utilisez `px.line()` pour le graphique de base, puis ajoutez `fig.update_xaxes(rangeslider_visible=True)` pour un sélecteur de plage temporelle déplaçable en bas.

```python
monthly_total = df.groupby("month")[["revenue", "cost"]].sum().reset_index()

fig = px.line(monthly_total, x="month", y=["revenue", "cost"],
              title="Revenue vs. Cost Over Time (drag to zoom)",
              labels={"value": "Amount ($)", "month": "Month", "variable": "Metric"})
fig.update_layout(yaxis_tickformat="$,.0f", legend_title_text="")
fig.update_xaxes(rangeslider_visible=True)
fig.show()
fig.write_html("interactive_line.html")
print("Saved: interactive_line.html")
```

**🎯 Sortie attendue :** Deux courbes (revenus et coûts) avec un curseur de plage déplaçable en bas. Attrapez les poignées du curseur pour zoomer sur une période mensuelle précise. Un fichier `interactive_line.html` est enregistré.

**🩹 Si ça ne va pas :** Si le curseur de plage n'apparaît pas, vous utilisez peut-être une ancienne version de plotly, exécutez `uv add --upgrade plotly`. Si la légende affiche `variable` comme titre au lieu d'un espace vide, vérifiez que `legend_title_text=""` est défini.

**✅ Liste de contrôle**

- ✅ Les trois graphiques plotly s'affichent dans le navigateur avec des infobulles au survol.
- ✅ Le diagramme en barres groupe les barres côte à côte, pas empilées.
- ✅ Le nuage de points encode quatre dimensions (x, y, couleur, taille).
- ✅ La courbe a un curseur de plage fonctionnel.
- ✅ Les trois fichiers HTML sont enregistrés et ouvrables dans un navigateur.

**🤔 Questions socratiques**

Quand choisiriez-vous un graphique plotly interactif plutôt qu'un PNG statique de matplotlib ? Et quand choisiriez-vous le PNG statique ? Pensez à votre public, qui voit le graphique et comment le consomme-t-il ?

---

## Étape 5 : Styles personnalisés et thèmes

Les graphiques semblent amateurs avec des couleurs et des polices par défaut. Construisez un thème cohérent et appliquez-le à chaque graphique du projet.

### 5.1 Définir une palette de couleurs personnalisée et des réglages de police

**👟 Indice de démarrage :** Créez un dictionnaire de codes couleur hexadécimaux et une fonction qui applique un style cohérent à n'importe quel axe matplotlib. Utilisez `plt.rcParams` pour définir des tailles de police globales.

```python
THEME = {
    "primary": "#2563EB",
    "secondary": "#F59E0B",
    "accent": "#10B981",
    "danger": "#EF4444",
    "bg": "#F8FAFC",
    "text": "#1E293B",
    "grid": "#E2E8F0",
}

plt.rcParams.update({
    "figure.facecolor": THEME["bg"],
    "axes.facecolor": THEME["bg"],
    "axes.edgecolor": THEME["grid"],
    "axes.labelcolor": THEME["text"],
    "text.color": THEME["text"],
    "xtick.color": THEME["text"],
    "ytick.color": THEME["text"],
    "font.size": 11,
    "axes.titlesize": 14,
    "axes.titleweight": "bold",
    "axes.grid": True,
    "grid.alpha": 0.3,
    "grid.color": THEME["grid"],
})

CATEGORY_COLORS = {
    "Electronics": THEME["primary"],
    "Clothing": THEME["secondary"],
    "Home": THEME["accent"],
}

def style_ax(ax, title: str, xlabel: str = "", ylabel: str = "") -> None:
    ax.set_title(title)
    if xlabel:
        ax.set_xlabel(xlabel)
    if ylabel:
        ax.set_ylabel(ylabel)
    ax.spines[["top", "right"]].set_visible(False)
```

### 5.2 Appliquer le thème à un graphique

**👟 Indice de démarrage :** Utilisez `style_ax()` sur n'importe quel objet d'axes pour appliquer instantanément un style propre. Les changements de `plt.rcParams` s'appliquent globalement à partir de ce point.

```python
category_revenue = df.groupby("category")["revenue"].sum()

fig, ax = plt.subplots(figsize=(8, 5))
colors = [CATEGORY_COLORS[cat] for cat in category_revenue.index]
bars = ax.bar(category_revenue.index, category_revenue.values, color=colors, edgecolor="white", linewidth=0.5)

for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width() / 2.0, height, f"${height:,.0f}",
            ha="center", va="bottom", fontweight="bold", fontsize=10)

style_ax(ax, "Revenue by Category", ylabel="Revenue ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
plt.tight_layout()
plt.savefig("themed_bar.png", dpi=150)
plt.show()
print("Saved: themed_bar.png")
```

**🎯 Sortie attendue :** Le même diagramme en barres de l'Étape 2, mais désormais avec un fond gris clair, sans bordures supérieure/droite, des tailles de police cohérentes et la palette de couleurs personnalisée. Un fichier `themed_bar.png` est enregistré.

**🩹 Si ça ne va pas :** Si le fond reste blanc, `plt.rcParams.update()` n'a pas été appelé dans cette session, relancez tout le bloc 5.1. Si les couleurs ne correspondent pas au thème, vous utilisez des valeurs hexadécimales codées en dur au lieu du dictionnaire `CATEGORY_COLORS`, remplacez-les.

### 5.3 Construire un thème seaborn pour les graphiques statistiques

**👟 Indice de démarrage :** Utilisez `sns.set_theme()` avec `context="talk"` pour des polices plus grandes et `style="whitegrid"` pour une grille propre. Combinez avec `palette` pour un mappage de couleurs cohérent.

```python
sns.set_theme(style="whitegrid", context="talk", palette="Set2")

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

sns.boxplot(data=df, x="category", y="revenue", ax=axes[0])
style_ax(axes[0], "Revenue Distribution", ylabel="Revenue ($)")

sns.violinplot(data=df, x="category", y="units", ax=axes[1])
style_ax(axes[1], "Units Sold Distribution", ylabel="Units")

plt.tight_layout()
plt.savefig("seaborn_styled.png", dpi=150)
plt.show()
print("Saved: seaborn_styled.png")
```

**🎯 Sortie attendue :** Des diagrammes en boîte et en violon côte à côte avec le thème whitegrid de seaborn. Le diagramme en violon montre la forme de densité de la distribution, plus large là où les points de données s'agglutinent. Un fichier `seaborn_styled.png` est enregistré.

**🩹 Si ça ne va pas :** Si le diagramme en violon semble vide ou affaissé, vos données ont peut-être trop peu de points pour l'estimation de densité par noyau, essayez `inner="quartile"` pour afficher les lignes de quartiles à l'intérieur du violon, ce qui rend les petits jeux de données plus lisibles.

**✅ Liste de contrôle**

- ✅ Le dictionnaire `THEME` est défini avec six clés de couleur.
- ✅ Les réglages globaux de `plt.rcParams` produisent un style cohérent sur tous les graphiques suivants.
- ✅ `style_ax()` fonctionne comme un helper réutilisable pour n'importe quel axe matplotlib.
- ✅ Les graphiques statistiques de seaborn correspondent au thème visuel général.

**🤔 Questions socratiques**

Pourquoi la suppression des bordures supérieure et droite (`spines[["top", "right"]].set_visible(False)`) rend-elle les graphiques plus lisibles ? Quelles informations ces bordures transmettaient-elles jamais, et cela valait-il l'encombrement visuel ?

---

## Étape 6 : Tableaux de bord multi-panneaux

Les tableaux de bord du monde réel combinent plusieurs types de graphiques dans une seule figure. Utilisez `plt.subplots()` pour disposer les graphiques dans une grille.

### 6.1 Construire un tableau de bord 2x2

**👟 Indice de démarrage :** Créez une grille de sous-graphiques 2x2 avec `plt.subplots(2, 2, figsize=(14, 10))`. Attribuez un type de graphique à chaque quadrant : barres (en haut à gauche), courbes (en haut à droite), nuage de points (en bas à gauche), camembert (en bas à droite).

```python
category_revenue = df.groupby("category")["revenue"].sum()
monthly = df.groupby("month")[["revenue", "cost"]].sum().sort_index()

fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle("Sales Dashboard — H1 2026", fontsize=16, fontweight="bold", y=1.01)

# Top-left: Bar chart
colors = [CATEGORY_COLORS[cat] for cat in category_revenue.index]
axes[0, 0].bar(category_revenue.index, category_revenue.values, color=colors, edgecolor="white")
style_ax(axes[0, 0], "Revenue by Category", ylabel="Revenue ($)")
axes[0, 0].yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))

# Top-right: Line chart
axes[0, 1].plot(monthly.index, monthly["revenue"], marker="o", linewidth=2, label="Revenue", color=THEME["primary"])
axes[0, 1].plot(monthly.index, monthly["cost"], marker="s", linewidth=2, label="Cost", color=THEME["danger"])
axes[0, 1].fill_between(monthly.index, monthly["revenue"], monthly["cost"], alpha=0.1, color=THEME["primary"])
style_ax(axes[0, 1], "Monthly Trend", ylabel="Amount ($)")
axes[0, 1].yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
axes[0, 1].legend()

# Bottom-left: Scatter plot
for category in df["category"].unique():
    subset = df[df["category"] == category]
    axes[1, 0].scatter(subset["cost"], subset["revenue"], s=80, alpha=0.8,
                        label=category, color=CATEGORY_COLORS[category], edgecolors="white")
max_val = max(df["revenue"].max(), df["cost"].max())
axes[1, 0].plot([0, max_val], [0, max_val], linestyle="--", color="gray", alpha=0.5)
style_ax(axes[1, 0], "Revenue vs. Cost", xlabel="Cost ($)", ylabel="Revenue ($)")
axes[1, 0].legend(fontsize=9)

# Bottom-right: Pie chart
wedges, texts, autotexts = axes[1, 1].pie(
    category_revenue, labels=category_revenue.index, autopct="%1.1f%%",
    startangle=90, colors=[CATEGORY_COLORS[cat] for cat in category_revenue.index]
)
for autotext in autotexts:
    autotext.set_fontweight("bold")
axes[1, 1].set_title("Revenue Share", fontsize=14, fontweight="bold")

plt.tight_layout()
plt.savefig("dashboard.png", dpi=150, bbox_inches="tight")
plt.show()
print("Saved: dashboard.png")
```

**🎯 Sortie attendue :** Une seule grande figure avec quatre graphiques disposés dans une grille 2x2. La rangée supérieure contient un diagramme en barres et une courbe. La rangée inférieure contient un nuage de points et un camembert. Un fichier `dashboard.png` est enregistré.

**🩹 Si ça ne va pas :** Si les graphiques se chevauchent, `tight_layout()` est appelé avant que tous les axes soient configurés, déplacez-le à la toute fin. Si `suptitle` chevauche les graphiques supérieurs, ajustez `y=1.02` pour le pousser plus haut ou utilisez `plt.subplots_adjust(top=0.93)` à la place. Si le camembert est écrasé en ovale, ajoutez `axes[1, 1].set_aspect("equal")`.

### 6.2 Construire un tableau de bord style seaborn avec FacetGrid

**👟 Indice de démarrage :** Utilisez `sns.FacetGrid()` pour créer une grille de petits multiples, un nuage de points par région, partageant les mêmes axes pour une comparaison directe.

```python
g = sns.FacetGrid(df, col="region", hue="category", palette="Set2", height=4, aspect=1.2)
g.map(sns.scatterplot, "cost", "units", alpha=0.8, s=100, edgecolor="white")
g.add_legend(title="Category")
g.set_axis_labels("Cost ($)", "Units Sold")
g.figure.suptitle("Units vs. Cost by Region", fontsize=14, fontweight="bold", y=1.02)
g.savefig("facet_dashboard.png", dpi=150, bbox_inches="tight")
plt.show()
print("Saved: facet_dashboard.png")
```

**🎯 Sortie attendue :** Deux nuages de points côte à côte, un pour North et un pour South, avec la même échelle x/y pour une comparaison facile. Chaque point est coloré par catégorie. Un fichier `facet_dashboard.png` est enregistré.

**🩹 Si ça ne va pas :** Si les colonnes de facettes ont des plages d'axe x différentes, `sharex=True` et `sharey=True` ne sont pas définis, ce sont les valeurs par défaut de `FacetGrid`, mais si vous les avez remplacées, supprimez le remplacement. Si la légende chevauche un panneau de facettes, utilisez `g.add_legend(loc="upper right", bbox_to_anchor=(1, 0))`.

**✅ Liste de contrôle**

- ✅ Le tableau de bord matplotlib 2x2 a quatre types de graphiques distincts dans une seule figure.
- ✅ Le titre principal est lisible et ne chevauche pas le contenu des graphiques.
- ✅ FacetGrid crée des panneaux séparés par région avec des axes partagés.
- ✅ Les deux fichiers PNG du tableau de bord sont enregistrés et non vides.

**🤔 Questions socratiques**

Quand un tableau de bord multi-panneaux serait-il plus utile qu'afficher chaque graphique séparément ? Quel est le compromis entre entasser de nombreux graphiques dans une figure et donner à chaque graphique son propre espace ?

---

## Étape 7 : Exporter et partager

Vos graphiques doivent sortir du terminal. Enregistrez-les en PNG de qualité publication pour les rapports et en fichiers HTML interactifs pour les partager avec quiconque dispose d'un navigateur.

### 7.1 Enregistrer tous les graphiques en PNG haute résolution

**👟 Indice de démarrage :** Utilisez `dpi=300` pour la qualité d'impression et `bbox_inches="tight"` pour éviter le recadrage. Créez un répertoire dédié `exports/` pour rester organisé.

```python
from pathlib import Path

exports = Path("exports")
exports.mkdir(exist_ok=True)

# Regenerate key charts and save to exports/
category_revenue = df.groupby("category")["revenue"].sum()

fig, ax = plt.subplots(figsize=(8, 5))
colors = [CATEGORY_COLORS[cat] for cat in category_revenue.index]
ax.bar(category_revenue.index, category_revenue.values, color=colors, edgecolor="white")
style_ax(ax, "Revenue by Category", ylabel="Revenue ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
plt.tight_layout()
plt.savefig(exports / "revenue_bar.png", dpi=300, bbox_inches="tight")
plt.close()

print(f"Exported to {exports}/")
for f in exports.iterdir():
    print(f"  {f.name} ({f.stat().st_size:,} bytes)")
```

**🎯 Sortie attendue :**

```
Exported to exports/
  revenue_bar.png (45,231 bytes)
```

Chaque fichier fait au moins 30 Ko, des PNG minuscules signifient que quelque chose a mal tourné au rendu.

**🩹 Si ça ne va pas :** Si le PNG fait moins de 5 Ko, la figure était vide au moment où `savefig` s'est exécuté, assurez-vous d'appeler `savefig` avant `plt.close()`. Si le texte est coupé sur les bords, ajoutez `bbox_inches="tight"` à l'appel `savefig`.

### 7.2 Créer un rapport HTML interactif

**👟 Indice de démarrage :** Combinez tous les graphiques plotly dans un seul fichier HTML en les générant en séquence et en utilisant `plotly.io.to_html()` pour les embarquer.

```python
import plotly.io as pio

monthly_cat = df.groupby(["month", "category"])["revenue"].sum().reset_index()

fig1 = px.bar(monthly_cat, x="month", y="revenue", color="category",
              barmode="group", title="Monthly Revenue by Category")
fig1.update_layout(yaxis_tickformat="$,.0f")

fig2 = px.scatter(df, x="cost", y="revenue", color="category", size="units",
                  hover_data=["month", "region"],
                  title="Revenue vs. Cost")
fig2.update_layout(xaxis_tickformat="$,.0f", yaxis_tickformat="$,.0f")

html_parts = [
    "<html><head><title>Sales Dashboard Report</title>",
    "<style>body{font-family:sans-serif;max-width:900px;margin:0 auto;padding:20px;}"
    "h1{color:#1E293B;} h2{color:#475569;margin-top:40px;}</style></head><body>",
    "<h1>Sales Dashboard — H1 2026</h1>",
    "<h2>Monthly Revenue by Category</h2>",
    pio.to_html(fig1, full_html=False),
    "<h2>Revenue vs. Cost</h2>",
    pio.to_html(fig2, full_html=False),
    "</body></html>",
]

with open("dashboard_report.html", "w") as f:
    f.write("".join(html_parts))

print("Saved: dashboard_report.html")
```

**🎯 Sortie attendue :** Un fichier `dashboard_report.html` s'ouvre dans votre navigateur avec une page stylée contenant les deux graphiques interactifs, faites défiler pour les voir, survolez pour inspecter les valeurs, zoomez par cliquer-glisser.

**🩹 Si ça ne va pas :** Si le fichier HTML affiche du code brut au lieu de graphiques, `pio.to_html()` renvoie peut-être une page HTML complète au lieu d'un fragment, vérifiez que `full_html=False` est défini. Si la page semble sans style, le bloc `<style>` a une erreur de syntaxe, vérifiez les accolades ou balises non fermées.

**✅ Liste de contrôle**

- ✅ Le répertoire `exports/` contient au moins un fichier PNG de plus de 30 Ko.
- ✅ `dashboard_report.html` s'ouvre dans un navigateur avec des graphiques interactifs fonctionnels.
- ✅ Les graphiques sont rendus à 300 DPI, adaptés à l'impression sans pixellisation.
- ✅ Aucun texte coupé, aucune étiquette manquante, aucune zone de graphique vide dans les exports.

**🤔 Questions socratiques**

Vous avez désormais deux formats d'export : PNG (statique, haute résolution) et HTML (interactif, résolution inférieure). Si vous présentiez à un conseil d'administration qui imprime des documents, quel format utiliseriez-vous ? Et si vous l'envoyiez à un coéquipier qui veut explorer les données lui-même ?

---

## 🧩 Défis

<details>
<summary><strong>Défi 1 : Course de diagrammes en barres animés</strong></summary>

Utilisez le paramètre `animation_frame` de plotly pour créer un diagramme en barres animé montrant l'évolution des revenus mois par mois. Les barres doivent grandir et rétrécir au fil de la reproduction de la ligne temporelle.

```python
fig = px.bar(monthly_cat, x="category", y="revenue", color="category",
             animation_frame="month", range_y=[0, monthly_cat["revenue"].max() * 1.1],
             title="Revenue by Category — Month by Month",
             color_discrete_map=CATEGORY_COLORS)
fig.show()
```

</details>

<details>
<summary><strong>Défi 2 : Carte de chaleur de la marge bénéficiaire</strong></summary>

Calculez la marge bénéficiaire comme `(revenue - cost) / revenue * 100`. Transformez les données en une matrice avec les catégories en lignes et les mois en colonnes. Utilisez `sns.heatmap()` pour visualiser quelles combinaisons catégorie-mois ont eu les marges les plus élevées.

```python
df["margin"] = ((df["revenue"] - df["cost"]) / df["revenue"] * 100).round(1)
pivot = df.pivot_table(index="category", columns="month", values="margin")

fig, ax = plt.subplots(figsize=(10, 3))
sns.heatmap(pivot, annot=True, fmt=".1f", cmap="RdYlGn", center=50, ax=ax)
ax.set_title("Profit Margin (%) by Category and Month")
plt.tight_layout()
plt.savefig("margin_heatmap.png", dpi=150)
plt.show()
```

</details>

<details>
<summary><strong>Défi 3 : Tableau de bord interactif avec menu déroulant</strong></summary>

Utilisez `updatemenus` de plotly pour ajouter un menu déroulant permettant à l'utilisateur de basculer entre l'affichage des revenus, des coûts et des unités sur l'axe y d'un seul graphique, trois vues dans une figure interactive.

```python
import plotly.graph_objects as go

monthly_all = df.groupby("month")[["revenue", "cost", "units"]].sum().sort_index().reset_index()

fig = go.Figure()
for col, color in [("revenue", "#4CAF50"), ("cost", "#F44336"), ("units", "#2196F3")]:
    fig.add_trace(go.Scatter(x=monthly_all["month"], y=monthly_all[col],
                             name=col.title(), visible=True if col == "revenue" else False,
                             line=dict(color=color, width=3), mode="lines+markers"))

fig.update_layout(
    updatemenus=[dict(
        buttons=[
            dict(label="Revenue", method="update", args=[{"visible": [True, False, False]}, {"yaxis.title": "Revenue ($)"}]),
            dict(label="Cost", method="update", args=[{"visible": [False, True, False]}, {"yaxis.title": "Cost ($)"}]),
            dict(label="Units", method="update", args=[{"visible": [False, False, True]}, {"yaxis.title": "Units Sold"}]),
        ],
        direction="down", showactive=True,
    )],
    title="Monthly Metrics (select one)",
    yaxis_title="Revenue ($)",
)
fig.show()
```

</details>

## Ce que vous avez appris

- Vous avez créé des diagrammes en barres, des courbes, des nuages de points et des camemberts avec matplotlib
- Vous avez construit des diagrammes en boîte, des cartes de chaleur, des diagrammes en paires et des violons avec seaborn
- Vous avez généré des graphiques HTML interactifs avec plotly (barres, nuages de points et courbes avec curseur de plage)
- Vous avez défini un thème de couleurs personnalisé et l'avez appliqué de manière cohérente à tous les types de graphiques
- Vous avez assemblé des tableaux de bord multi-panneaux avec `plt.subplots()` et `sns.FacetGrid()`
- Vous avez exporté des graphiques en PNG haute résolution (300 DPI) et en rapports HTML interactifs
- Vous avez appris quand chaque bibliothèque de visualisation et chaque format est le bon choix

## Où aller ensuite

- **Tableau de bord Streamlit.** Enveloppez les mêmes graphiques dans une application Streamlit avec `st.pyplot()` et `st.plotly_chart()` pour un tableau de bord web en direct qui se met à jour à mesure que les données changent.
- **Animation matplotlib.** Utilisez `matplotlib.animation.FuncAnimation` pour créer des graphiques animés montrant l'évolution des données dans le temps, idéal pour les présentations.
- **Altair ou Vega-Lite.** Explorez la visualisation déclarative où vous décrivez *quoi* tracer plutôt que *comment* le tracer, un paradigme différent de l'approche impérative de matplotlib.
- **Données géographiques.** Utilisez `plotly.express.choropleth()` ou `folium` pour cartographier des données sur des régions géographiques, ventes par pays, météo par ville, etc.
- **Données réelles.** Remplacez le CSV d'exemple par des jeux de données réels de [Kaggle](https://www.kaggle.com/datasets), [data.gov](https://data.gov) ou vos propres feuilles de calcul. Le même code de graphiques fonctionne sur n'importe quelles données tabulaires.

## Partagez votre projet avec la classe

Vous avez construit quelque chose dont vous êtes fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants, et son README contient un guide complet, accessible aux débutants, pour ajouter le vôtre via une **pull request**, même si vous n'avez jamais utilisé git : forker le référentiel, créer une branche, valider vos fichiers et ouvrir la PR, étape par étape. Aucune expérience préalable de git requise.

Bienvenue dans l'écriture de Python hors du navigateur. 🎓