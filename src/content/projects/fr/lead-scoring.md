---
title: "Moteur de Scoring de Leads"
description: "Classez et priorisez les leads commerciaux selon l'engagement, la démographie et les signaux de comportement."
---

# 🎯 Construire un Moteur de Scoring de Leads

Les équipes commerciales sont submergées par les leads. Un moteur de scoring de leads les classe selon la probabilité que chacun se convertisse, pour que l'équipe appelle d'abord les plus chauds. Ce projet construit un modèle de scoring qui combine les signaux d'engagement, de démographie et de comportement, puis priorise le pipeline et teste en A/B différents schémas de scoring.

Cela suppose Python 101 et l'aisance avec pandas issu de Analyse de Données. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Mettre en place un projet avec `uv` et installer les dépendances d'analyse.
2. Construire un modèle de scoring de leads multifactoriel à partir des données d'engagement et démographiques.
3. Prioriser le pipeline commercial par palier de score.
4. Tester en A/B deux modèles de scoring et comparer les résultats de conversion.
5. Résumer la santé du pipeline avec les analytiques pandas.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/lead-scoring/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/lead-scoring/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Flead-scoring%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant de construire : un environnement Python et pandas.

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
uv init lead-scoring
cd lead-scoring
uv add pandas numpy click
```

`pandas` pilote l'analyse. `numpy` fournit les mathématiques. `click` donne le CLI.

### Crée la structure du projet

```bash
mkdir -p scoring
touch scoring/__init__.py scoring/leads.py scoring/model.py scoring/abtest.py scoring/analytics.py scoring/cli.py
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `lead-scoring/` existe avec `pyproject.toml` et toutes les dépendances installées.
- ✅ Le répertoire `scoring/` a tous les fichiers de modules requis.

## Étape 1 : Crée des données d'exemple de leads

Tu as besoin d'un jeu de données de leads réaliste à noter. Construis une fonction qui génère des leads avec des champs d'engagement, de démographie et de comportement.

### 1.1 Génère le jeu de données

**👟 Indice de départ :** Crée `scoring/leads.py`.

```python
# scoring/leads.py
import random, pandas as pd

random.seed(42)

def generate_leads(n=1000) -> pd.DataFrame:
    rows = []
    for i in range(n):
        visited = random.randint(0, 40)
        opened = random.randint(0, 15)
        downloaded = random.randint(0, 5)
        company_size = random.choice(["small", "mid", "enterprise"])
        source = random.choice(["organic", "ads", "referral"])
        rows.append({
            "lead_id": i,
            "visits": visited,
            "emails_opened": opened,
            "assets_downloaded": downloaded,
            "company_size": company_size,
            "source": source,
            "converted": random.random() < 0.3,
        })
    return pd.DataFrame(rows)
```

**🎯 Résultat attendu :** `generate_leads()` retourne un DataFrame de 1000 lignes avec des colonnes d'engagement et de démographie.

**🩹 Si ça ne marche pas :** Si les noms de colonnes ne correspondent pas au code ultérieur, corrige-les ici d'abord.

### 1.2 Vérifie les données de leads

**✅ Liste de vérification**

- ✅ `generate_leads()` retourne un DataFrame avec toutes les colonnes attendues.
- ✅ Les valeurs sont dans les plages prévues.
- ✅ Une colonne booléenne `converted` existe.

**🤔 Question(s) socratique(s)**

- Quel signal du monde réel manque dans ce jeu de données qu'un CRM aurait en réalité (par exemple, le délai de contact, le budget) ?

## Étape 2 : Construis le modèle de scoring

Le score combine des signaux pondérés. L'engagement (visites, ouvertures, téléchargements) prédit généralement le mieux la conversion, donc il reçoit le poids le plus élevé.

### 2.1 Définis le modèle

**👟 Indice de départ :** Crée `scoring/model.py`.

```python
# scoring/model.py
import pandas as pd


def score_lead(row) -> float:
    engagement = row["visits"] * 1.0 + row["emails_opened"] * 2.0 + row["assets_downloaded"] * 5.0
    if row["company_size"] == "enterprise":
        engagement += 20
    elif row["company_size"] == "mid":
        engagement += 10
    if row["source"] == "referral":
        engagement += 15
    elif row["source"] == "organic":
        engagement += 5
    return engagement


def apply_score(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["score"] = df.apply(score_lead, axis=1)
    df["tier"] = pd.cut(df["score"],
                        bins=[-1, 20, 45, float("inf")],
                        labels=["cold", "warm", "hot"])
    return df
```

**🎯 Résultat attendu :** `apply_score(df)` ajoute les colonnes `score` et `tier`, où les téléchargements et la source de référencement boostent le plus le score.

**🩹 Si ça ne marche pas :** Si aucun lead n'est « hot », le seuil dans `pd.cut` est peut-être trop élevé pour les données.

### 2.2 Vérifie le modèle

**✅ Liste de vérification**

- ✅ Une colonne `score` est ajoutée.
- ✅ Une colonne `tier` catégorise les leads en `cold`, `warm` ou `hot`.
- ✅ Chaque lead reçoit un score numérique.

**🤔 Question(s) socratique(s)**

- Les poids sont choisis à la main. Qu'est-ce qui pourrait mal tourner si un poids est faux, et comment le découvrirais-tu ?

## Étape 3 : Priorise le pipeline

La vente devrait attaquer les leads chauds en premier. Trie le pipeline par palier et score, et mesure le taux de conversion par palier.

### 3.1 Trie et mesure la conversion

**👟 Indice de départ :** Ajoute une aide à la priorisation.

```python
# scoring/model.py (continued)
def prioritize(df: pd.DataFrame) -> pd.DataFrame:
    tier_order = {"hot": 0, "warm": 1, "cold": 2}
    return (df.assign(tier_rank=df["tier"].map(tier_order))
              .sort_values(["tier_rank", "score"], ascending=[True, False])
              .drop(columns="tier_rank"))


def conversion_by_tier(df: pd.DataFrame) -> pd.DataFrame:
    return (df.groupby("tier", observed=True)["converted"]
              .agg(["count", "mean"])
              .rename(columns={"count": "leads", "mean": "conversion_rate"})
              .round(3))
```

**🎯 Résultat attendu :** `prioritize(df)` ordonne les leads chauds en premier ; `conversion_by_tier` montre que les leads chauds se convertissent à un taux plus élevé.

**🩹 Si ça ne marche pas :** Si les taux de conversion sont plats à travers les paliers, les poids de scoring ne discriminent pas — resserre-les.

### 3.2 Vérifie la priorisation

**✅ Liste de vérification**

- ✅ `prioritize` trie par palier puis score décroissant.
- ✅ `conversion_by_tier` rapporte les nombres de leads et les taux de conversion.
- ✅ Le palier chaud a un taux de conversion plus élevé que le palier froid (pour des données bien séparées).

**🤔 Question(s) socratique(s)**

- Comment utiliserais-tu le taux de conversion par palier pour décider combien de leads confier à l'équipe commerciale chaque jour ?

## Étape 4 : Teste en A/B deux modèles de scoring

Au lieu de faire confiance à des poids choisis à la main, compare deux modèles sur les mêmes données et vois lequel sépare le mieux les convertisseurs des non-convertisseurs.

### 4.1 Implémente le test A/B

**👟 Indice de départ :** Crée `scoring/abtest.py`.

```python
# scoring/abtest.py
import pandas as pd
from numpy import mean


def model_a(row):
    return row["visits"] + 2 * row["emails_opened"] + 5 * row["assets_downloaded"]


def model_b(row):
    return row["visits"] ** 1.5 + row["emails_opened"] * 3 + row["assets_downloaded"] * 8


def compare_models(df: pd.DataFrame) -> pd.DataFrame:
    results = {}
    for name, fn in [("model_a", model_a), ("model_b", model_b)]:
        df2 = df.copy()
        df2["score"] = df2.apply(fn, axis=1)
        df2["tier"] = pd.cut(df2["score"], bins=[-1, 20, 45, float("inf")], labels=["cold", "warm", "hot"])
        top = df2.sort_values("score", ascending=False).head(300)
        results[name] = {
            "top300_conversion": mean(top["converted"]),
            "hot_count": (df2["tier"] == "hot").sum(),
        }
    return pd.DataFrame(results).T
```

**🎯 Résultat attendu :** `compare_models(df)` rapporte quel modèle obtient la conversion la plus élevée sur ses 300 meilleurs leads.

**🩹 Si ça ne marche pas :** Si les deux modèles sont à égalité, la différenciation entre eux est trop faible pour avoir de l'importance.

### 4.2 Vérifie le test A/B

**✅ Liste de vérification**

- ✅ Les deux modèles sont notés et leurs 300 meilleurs leads comparés.
- ✅ La sortie inclut le taux de conversion et le nombre de chauds.
- ✅ Le meilleur modèle sur la conversion est identifiable.

**🤔 Question(s) socratique(s)**

- Pourquoi comparer sur les *300 meilleurs leads* plutôt que sur le jeu de données complet ? Que décidons-nous implicitement sur la façon dont fonctionne la vente ?

## Étape 5 : Résume la santé du pipeline

Un tableau de bord de métriques agrégées dit à l'équipe si le pipeline est globalement en bonne santé.

### 5.1 Construis le résumé analytique

**👟 Indice de départ :** Crée `scoring/analytics.py`.

```python
# scoring/analytics.py
import pandas as pd


def summarize(df: pd.DataFrame) -> pd.DataFrame:
    summary = {
        "leads": len(df),
        "hot_leads": (df["tier"] == "hot").sum(),
        "warm_leads": (df["tier"] == "warm").sum(),
        "cold_leads": (df["tier"] == "cold").sum(),
        "avg_score": round(df["score"].mean(), 2),
        "overall_conversion": round(df["converted"].mean(), 3),
    }
    return pd.DataFrame([summary])


def by_source(df: pd.DataFrame) -> pd.DataFrame:
    return (df.groupby("source")["converted"]
              .agg(["count", "mean"])
              .rename(columns={"count": "leads", "mean": "conversion_rate"})
              .round(3))
```

**🎯 Résultat attendu :** `summarize(df)` retourne une ligne de santé du pipeline ; `by_source` montre quelle source d'acquisition convertit le mieux.

**🩹 Si ça ne marche pas :** Si la conversion globale est beaucoup plus haute ou plus basse que prévu, l'attribution aléatoire `converted` peut nécessiter un seuil différent.

### 5.2 Vérifie le résumé

**✅ Liste de vérification**

- ✅ `summarize` retourne les nombres de leads par palier, le score moyen et la conversion globale.
- ✅ `by_source` rapporte la conversion par canal d'acquisition.

**🤔 Question(s) socratique(s)**

- Si « referral » convertit à 40 % mais « ads » à 15 %, quel changement apporterais-tu au budget marketing ?

## ⚠️ Pièges courants

- **Poids choisis à la main surajustés.** Des poids qui semblent bons sur un jeu de données peuvent être faux sur le suivant. Tester en A/B les poids contre des données de conversion réelles protège contre cela.
- **NaN de `pd.cut`.** Si un score dépasse le bord supérieur du bac, il devient un palier `NaN`. Utilise `float("inf")` comme bord final.
- **Copier avant d'ajouter des colonnes.** `df.apply` dans la fonction de scoring peut déclencher `SettingWithCopyWarning`. Appelle `.copy()` d'abord, comme montré dans `apply_score`.
- **Ignorer le coût de la poursuite des conversions.** Un palier « hot » qui convertit à 30 % gaspille quand même 70 % des appels. Associe le score à la valeur attendue, pas seulement à la probabilité.
- **Les données de démo ≠ la production.** Des leads générés aléatoirement ne refléteront pas le comportement réel de conversion. Valide ton modèle sur de vrais leads historiques avant de lui faire confiance.

## Ce que tu viens de construire

Un moteur de scoring de leads : un jeu de données de leads généré, un modèle de scoring multifactoriel pondéré qui classe les leads en paliers cold/warm/hot, un tri priorisé du pipeline, une comparaison A/B de deux schémas de scoring et un résumé de santé du pipeline basé sur pandas. C'est le cœur analytique d'une équipe d'opérations commerciales — décider qui appeler, dans quel ordre et si le modèle actuel fonctionne.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/lead-scoring/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/lead-scoring) dans le dépôt du cours a une version plus riche avec un scoring basé sur le machine learning, le routage automatique des leads et le CLI câblé de bout en bout. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Entraîne un vrai classifieur (régression logistique) sur les leads convertis vs non convertis et compare son classement à ton modèle construit à la main.
- Ajoute l'enrichissement des leads depuis une source de données externe pour alimenter le score avec de nouveaux signaux.
- Construis une règle de routage qui attribue automatiquement les leads chauds au représentant le plus performant.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓