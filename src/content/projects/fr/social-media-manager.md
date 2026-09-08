---
title: "Gestionnaire de Réseaux Sociaux"
description: "Planifiez des publications sur les plateformes avec analytiques, suggestions de hashtags et calendrier de contenu."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["pandas", "data-viz", "productivity"]
learningObjectives:
  - "Charger et explorer des données d'engagement avec pandas"
  - "Classer la meilleure heure de publication par plateforme à partir de distributions réelles"
  - "Construire un moteur de suggestions de hashtags avec notation"
  - "Générer un calendrier de contenu sur une semaine à partir des heures gagnantes"
  - "Produire un rapport analytique partageable avec matplotlib"
prerequisites:
  - "Les bases de Python (fonctions, boucles, dictionnaires)"
  - "Le regroupement et l'agrégation avec pandas"
  - "L'installation de paquets avec uv"
---

# 🛠️ 📱 Construire un Gestionnaire de Réseaux Sociaux

Publier quand ton audience est réellement réveillée, avec des hashtags que les gens cherchent pour de vrai, c'est l'essentiel du marketing social. Ce projet construit un petit gestionnaire qui étudie les données d'engagement passées avec pandas, apprend la meilleure heure de publication pour chaque plateforme, suggère des hashtags par thème grâce à un petit moteur de notation, planifie une semaine de publications dans un calendrier de contenu, et finit par un rapport analytique matplotlib que tu pourrais injecter directement dans la routine d'une vraie marque.

Cela suppose le Python 101 et une aisance avec le `groupby` de pandas — rien de plus d'Analyse de Données n'est requis. C'est optionnel et non noté ; vois [Projets du monde réel](/fr/projets) pour la liste complète et grandissante.

## 🎯 Ce que tu vas faire

1. Générer un jeu de données d'engagement réaliste et le charger avec pandas.
2. Agréger les engagements par plateforme et par heure pour trouver la fenêtre de publication la plus performante de chaque plateforme.
3. Construire un moteur de suggestions de hashtags qui note les hashtags contre un thème.
4. Générer un calendrier de contenu sur 7 jours à partir du classement des meilleurs horaires.
5. Dessiner un graphique de rapport analytique hebdomadaire de la performance des plateformes.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal. `pandas` et `matplotlib` s'installent proprement, le backend non interactif `Agg` de matplotlib (utilisé à l'Étape 5) rend les graphiques même sur une machine sans écran, et les fichiers CSV et le rapport PNG atterrissent réellement dans ton dossier de projet.

**Google Colab, les Notebooks Kaggle et Binder** sont des moyens raisonnables d'*essayer* la construction complète — pandas et matplotlib y tournent tous deux d'emblée. La limite honnête est que le système de fichiers éphémère d'un notebook ne conserve pas ton `posts.csv` ni ton rapport sauvegardé d'une session à l'autre, donc traite-les comme des chemins d'essai et passe au `uv` local quand tu veux que le calendrier et les artefacts du rapport persistent.

[![Ouvrir dans Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/social-media-manager/notebook.ipynb)
[![Ouvrir dans Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/social-media-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsocial-media-manager%2Fnotebook.ipynb)

## Configuration

Crée le projet et installe les deux bibliothèques sur lesquelles tout le gestionnaire est construit.

```bash
uv init social-media-manager
cd social-media-manager
uv add pandas matplotlib
```

```bash
uv run python -c "import pandas, matplotlib; print('ok')"
```

`pandas` est la couche de données — charger, grouper et classer les engagements — et `matplotlib` est la couche de dessin pour le rapport final. Les installer d'emblée signifie que chaque étape ci-dessous porte sur les idées *marketing* plutôt que sur des batailles de dépendances.

**✅ Liste de vérification**

- ✅ `uv add pandas matplotlib` s'est terminé et `uv run python -c "import pandas, matplotlib"` affiche `ok`.
- ✅ Un nouveau projet `social-media-manager/` existe avec un `pyproject.toml`.

## Étape 1 : Construis le jeu de données d'engagement

Chaque décision de contenu de ce projet — meilleur moment, meilleurs hashtags, meilleure plateforme — est un calcul sur des engagements passés. Cette étape construit une table d'engagement réaliste et reproductible pour que les étapes suivantes aient quelque chose de réel à classer.

### 1.1 Génère un jeu de données reproductible

**👟 Indice de départ :** Utilise `random.seed` pour que chaque exécution produise le *même* jeu de données, puis construis un DataFrame pandas avec une ligne par publication passée et sauvegarde-le en CSV.

```python
# smm.py
import random
import pandas as pd

PLATFORMS = ["Instagram", "X", "LinkedIn", "TikTok"]
DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
TOPICS = ["python", "data", "career", "product"]

def build_dataset(rows: int = 120, seed: int = 7) -> pd.DataFrame:
    random.seed(seed)
    df = pd.DataFrame({
        "platform": [random.choice(PLATFORMS) for _ in range(rows)],
        "topic": [random.choice(TOPICS) for _ in range(rows)],
        "day": [random.choice(DAYS) for _ in range(rows)],
        "hour": [random.randint(7, 23) for _ in range(rows)],
        "engagements": [random.randint(4, 240) for _ in range(rows)],
    })
    return df

df = build_dataset()
df.to_csv("posts.csv", index=False)

print(df.head(3).to_string(index=False))
print(df.groupby("platform")["engagements"].mean().round(1))
```

`random.seed(seed)` est ce qui rend ce jeu de données *reproductible* : la même graine produit la même heure et le même engagement « aléatoires » à chaque exécution, donc le classement des meilleurs horaires que tu obtiens à l'Étape 2 est le classement du résultat attendu plutôt qu'une nouvelle réponse à chaque fois. Épingler la `seed` à l'intérieur de la fonction — pas en haut du module — garde la table stable même si tu appelles `build_dataset` plus d'une fois. `index=False` sur `to_csv` empêche une colonne d'index parasite de se glisser dans le fichier pour que le rechargement produise un DataFrame propre.

**🎯 Résultat attendu :** Les colonnes `platform`, `topic`, `day`, `hour`, `engagements` dans l'aperçu, puis une ligne d'engagement moyen par plateforme — par ex. `Instagram` quelque part entre 100 et 140.

**🩹 Si ça ne marche pas :** Si les colonnes diffèrent, vérifie que les clés du dictionnaire dans le constructeur DataFrame orthographient chaque colonne. Si une deuxième exécution produit des nombres différents, `random.seed` manque ou est appelé avec une *autre* graine que celle de la signature. Si `to_csv` écrit une colonne `Unnamed: 0` au rechargement, `index=False` manque.

### 1.2 Vérifie le jeu de données

**✅ Liste de vérification**

- ✅ `smm.py` s'exécute et affiche un aperçu de 3 lignes plus une table de moyenne par plateforme.
- ✅ Un fichier `posts.csv` existe avec 120 lignes et les cinq colonnes.
- ✅ Exécuter le script deux fois affiche des nombres identiques (données reproductibles).

**🤔 Question(s) socratique(s)**

- Si tu changes `random.seed(7)` en `random.seed(8)`, le *fichier* change — pourquoi cela compte-t-il pour un classement de l'Étape 2 que tu veux comparer avec des amis, et que cela t'apprend-il sur le moment où une graine est une fonctionnalité plutôt qu'un accident ?
- Le jeu de données n'a pas de colonne `date`, seulement `day` et `hour`. Quelle question au niveau de la semaine peux-tu répondre, et quelle question au niveau de la semaine devient impossible ?

## Étape 2 : Trouve la meilleure heure de publication par plateforme

Un calendrier de contenu ne vaut que par les horaires qu'il planifie. Cette étape transforme la table d'engagement en LE nombre que les marketeurs veulent réellement : l'engagement moyen pour publier à chaque heure sur chaque plateforme.

### 2.1 Groupe, moyenne et classe

**👟 Indice de départ :** `groupby(["platform", "hour"])` sur les engagements, prends la moyenne, et inspecte les meilleures heures — c'est tout le classement, sans boucle requise.

```python
# smm.py (suite)
def best_times(df: pd.DataFrame, top_n: int = 3) -> pd.DataFrame:
    hourly = (
        df.groupby(["platform", "hour"])["engagements"]
        .mean()
        .round(1)
    )
    ranking = (
        hourly.reset_index()
        .sort_values(["platform", "engagements"], ascending=[True, False])
        .groupby("platform", sort=False)
        .head(top_n)
        .reset_index(drop=True)
    )
    return ranking

ranking = best_times(df)
print(ranking.to_string(index=False))
```

Lis la chaîne de bas en haut : `groupby(["platform", "hour"])` crée un groupe par paire plateforme-heure, `["engagements"].mean()` réduit chaque groupe à sa moyenne, `.round(1)` garde le rapport ordonné, et `sort_values(["platform", "engagements"], ascending=[True, False])` trie d'abord par plateforme puis par engagement *décroissant* pour que la meilleure heure de chaque plateforme flotte en haut de son bloc. Le dernier `.groupby("platform", sort=False).head(top_n)` ne conserve que les `top_n` premières lignes *à l'intérieur* de chaque plateforme — c'est le « top 3 des heures par plateforme » que tu remettras au calendrier.

**🎯 Résultat attendu :** Un tableau avec `platform`, `hour`, `engagements`, où chaque plateforme apparaît exactement 3 fois et où ses 3 lignes sont ordonnées de la plus haute à la plus basse.

**🩹 Si ça ne marche pas :** Si tu obtiens un seul bloc de 3 lignes au lieu de quatre, l'étape interne `sort_values` manque donc `head(3)` a attrapé les premiers groupes plutôt que les meilleurs. Si les moyennes horaires semblent identiques entre plateformes, tu as groupé sur une seule colonne. Si l'ordre des lignes semble brouillé, la liste à deux colonnes de `sort_values` est dans le mauvais ordre.

### 2.2 Vérifie le classement

**✅ Liste de vérification**

- ✅ `ranking` a exactement `top_n` lignes par plateforme, triées de la plus haute à la plus basse dans chacune.
- ✅ La meilleure heure d'au moins une plateforme est une heure de fin de soirée (18–23), une fenêtre d'engagement élevé classique dans les données ensemencées.
- ✅ Tu peux pointer les deux lignes qui font le regroupement et le classement.

**🤔 Question(s) socratique(s)**

- Le classement moyenne les engagements bruts par heure, donc une plateforme avec trois publications chanceuses sur une heure semble « la meilleure » là. Que changerait à la recommandation l'usage de la *médiane* plutôt que de la *moyenne* ?
- Un tableau heure-de-semaine a 7 × 17 cellules. Quelle nouvelle statistique ajouterais-tu si une marque ne publiait jamais que le matin — et comment distinguerais-tu « le matin est leur meilleur moment » de « ils n'ont jamais publié le soir » ?

## Étape 3 : Construis le moteur de suggestions de hashtags

Les hashtags sont l'index de recherche de la plupart des plateformes : les bons font remonter une publication aux gens qui cherchaient déjà. Cette étape construit un minuscule moteur de notation qui mappe un thème à des hashtags classés, la même forme qu'une vraie API de suggestions renvoie.

### 3.1 Note et classe les hashtags

**👟 Indice de départ :** Stocke chaque hashtag avec un score de pertinence dans un dictionnaire de thèmes, trie par score, et tronque à `n` — le « moteur » n'est que des données plus `sorted`.

```python
# smm.py (suite)
HASHTAG_POOL = {
    "python": [("#Python", 95), ("#100DaysOfCode", 88), ("#CodeNewbie", 81),
               ("#DataScience", 79), ("#PythonTips", 70)],
    "data":   [("#DataScience", 97), ("#Analytics", 90), ("#DataViz", 84),
               ("#BigData", 80), ("#DataStorytelling", 72)],
    "career": [("#CareerGrowth", 91), ("#TechCareers", 85), ("#JobSearchTips", 78)],
    "product":[("#ProductManagement", 92), ("#BuildInPublic", 84), ("#PM", 77)],
}

def suggest_hashtags(topic: str, n: int = 4) -> list[str]:
    pool = HASHTAG_POOL.get(topic.lower(), [("#ContentTips", 60)])
    pool = sorted(pool, key=lambda item: item[1], reverse=True)
    return [tag for tag, _score in pool[:n]]

print(suggest_hashtags("python"))
print(suggest_hashtags("analytics"))
```

Tout le « moteur » est un `sorted` sur des tuples notés et une tranche. Modéliser chaque hashtag comme `("#Tag", 95)` plutôt que comme une simple chaîne fait du classement une question de données plutôt qu'un choix codé en dur — `reverse=True` met le score le plus élevé en premier, et `pool[:n]` tronque à la taille de bucket demandée. Le défaut `.get(topic.lower(), ...)` signifie qu'un thème inconnu dégénère en un repli générique au lieu de faire planter le calendrier que tu construirás à l'Étape 4.

**🎯 Résultat attendu :** `['#Python', '#100DaysOfCode', '#CodeNewbie', '#DataScience']` pour `"python"`, et les hashtags du pool `data` pour `"analytics"` grâce à `.lower()`.

**🩹 Si ça ne marche pas :** Si l'ordre semble arbitraire, la clé de notation `key=lambda item: item[1]` manque donc `sorted` compare des tuples entiers. Si `"analytics"` renvoie le repli générique, les clés du dictionnaire — `data`, pas `analytics` — ne correspondent pas ; le défaut `.get` le cache silencieusement. Si une longueur erronée revient, la tranche `[:n]` utilise un `n` différent de celui demandé.

### 3.2 Vérifie le moteur de hashtags

**✅ Liste de vérification**

- ✅ `suggest_hashtags("python")` renvoie 4 hashtags, le score le plus élevé en premier.
- ✅ Un thème inconnu renvoie le repli `#ContentTips` au lieu de lever une `KeyError`.
- ✅ Tu peux expliquer pourquoi les hashtags, et leur ordre, sont des *données* plutôt que de la logique.

**🤔 Question(s) socratique(s)**

- Les scores (95, 88, …) sont écrits à la main. À partir de quoi un vrai gestionnaire les calculerait-il pour que le classement se mette à jour automatiquement à mesure qu'un hashtag devient obsolète ?
- `sorted` ici est stable pour des scores égaux. Quand deux hashtags au même score auraient-ils besoin d'un critère de départage, et quel serait-il ?

## Étape 4 : Génère un vrai calendrier de contenu

Un calendrier est là où les décisions deviennent un emploi du temps. Cette étape fusionne le classement des meilleurs horaires de l'Étape 2 avec le moteur de hashtags de l'Étape 3 pour planifier sept publications concrètes — jour, plateforme, heure, thème et hashtags — prêtes à coller dans n'importe quel planificateur.

### 4.1 Planifie la semaine à partir du classement

**👟 Indice de départ :** Boucle sur les sept jours, choisis la plateforme du jour à partir du seul meilleur résultat et un thème tournant, et réutilise les deux fonctions que tu as déjà écrites au lieu de dupliquer leur logique.

```python
# smm.py (suite)
def build_calendar(ranking: pd.DataFrame, topics: list[str], days: int = 7) -> list[dict]:
    best_time = (
        ranking.groupby("platform", sort=False)
        .head(1)
        .set_index("platform")["hour"]
        .to_dict()
    )
    calendar = []
    for day_offset in range(days):
        day = DAYS[day_offset % 7]
        platform = list(best_time.keys())[day_offset % len(best_time)]
        topic = topics[day_offset % len(topics)]
        calendar.append({
            "day": day,
            "platform": platform,
            "hour": best_time[platform],
            "topic": topic,
            "hashtags": ", ".join(suggest_hashtags(topic)),
        })
    return calendar

for post in build_calendar(ranking, TOPICS):
    print(f"{post['day']:>3} {post['platform']:<10} {post['hour']:>2}:00  "
          f"{post['topic']:<10} {post['hashtags']}")
```

`best_time` réduit le classement à l'unique heure gagnante par plateforme via `.groupby(...).head(1)` et le transforme en un dict `{platform: hour}` avec `set_index` + `to_dict` — ce dict est la petite table de recherche que la boucle consulte. Faire tourner les plateformes avec le modulo (`% len(best_time)`) et les thèmes de la même façon signifie qu'un plan de 7 jours se répartit sur les quatre plateformes et les quatre thèmes sans que les répétitions ne s'empilent. Réutiliser `suggest_hashtags` ici est le gain de l'Étape 3 : les hashtags du calendrier *proviennent* du moteur de notation, donc améliorer les scores améliore chaque publication planifiée.

**🎯 Résultat attendu :** Sept lignes imprimables, une par jour, chacune avec un nom de jour, une plateforme, une heure gagnante, un thème et quatre hashtags joints par des virgules, sans deux lignes consécutives partageant une plateforme.

**🩹 Si ça ne marche pas :** Si une `KeyError` sur `best_time[platform]` apparaît, une plateforme de la boucle n'est pas dans le dict — vérifie que `ranking` contient bien les quatre plateformes de l'Étape 2. Si chaque ligne a la même plateforme, la rotation modulo utilise `len(best_time)` mais indexe avec la mauvaise valeur. Si les hashtags s'affichent comme une liste Python, `", ".join(...)` manque.

### 4.2 Vérifie le calendrier

**✅ Liste de vérification**

- ✅ Le calendrier a exactement 7 lignes avec jour, plateforme, heure, thème, hashtags.
- ✅ Chaque heure planifiée correspond à la meilleure heure d'une plateforme du classement de l'Étape 2.
- ✅ Aucune plateforme n'apparaît deux fois sur des jours consécutifs.

**🤔 Question(s) socratique(s)**

- Le calendrier fait tourner les plateformes de façon uniforme, ignorant que certaines ont surperformé d'autres. Comment biaiserais-tu la rotation vers les plateformes performantes sans abandonner entièrement les faibles ?
- Planifier exactement une publication par jour est arbitraire. Quelles données — du classement de l'Étape 2 — justifieraient de publier *deux* fois sur certaines plateformes et *zéro* sur d'autres ?

## Étape 5 : Construis le rapport analytique hebdomadaire

Le dernier artefact est celui que tu partagerais réellement : un rapport visuel de quelle plateforme a livré, généré comme PNG que tu peux joindre à une invitation de réunion. Cette étape dessine le graphique de gros titre et imprime une table de synthèse à côté.

### 5.1 Dessine le graphique de performance des plateformes

**👟 Indice de départ :** Règle matplotlib sur le backend `Agg` sans écran, calcule les engagements totaux par plateforme, et sauvegarde le graphique en barres dans un fichier — puis imprime les mêmes nombres sous forme de texte pour que le rapport fonctionne même quand personne ne peut voir le PNG.

```python
# smm.py (suite)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

def weekly_report(df: pd.DataFrame, out: str = "weekly_report.png") -> None:
    totals = df.groupby("platform")["engagements"].sum().sort_values(ascending=False)

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.bar(totals.index, totals.values, color="#4C86C6")
    ax.set_title("Engagements per platform (last week)")
    ax.set_ylabel("Total engagements")
    ax.tick_params(axis="x", rotation=20)
    fig.tight_layout()
    fig.savefig(out, dpi=100)
    plt.close(fig)

    print("Total engagements per platform:")
    print(totals.to_string())

weekly_report(df)
```

`matplotlib.use("Agg")` doit s'exécuter *avant* l'import de `pyplot` — il échange la fenêtre interactive contre un backend sans affichage, ce qui permet à ce graphique de se rendre sur un serveur, dans un notebook, ou sur une machine sans écran du tout. `fig.savefig(out, dpi=100)` est la ligne qui compte : elle écrit un vrai fichier PNG, et le `plt.close(fig)` qui suit libère la figure pour qu'une boucle appelant `weekly_report` de façon répétée n'accumule pas de mémoire. Imprimer les mêmes totaux sous forme de tableau garde le rapport utile à quiconque lit la sortie de terminal plutôt que l'image.

**🎯 Résultat attendu :** Un fichier `weekly_report.png` apparaît dans le dossier du projet (visible dans ton explorateur de fichiers), et le terminal imprime les quatre totaux de plateforme dans l'ordre décroissant.

**🩹 Si ça ne marche pas :** Si une trace d'erreur de backend mentionne `Agg`, `matplotlib.use("Agg")` vient *après* la ligne `import matplotlib.pyplot` — déplace-le au-dessus. Si aucun PNG n'apparaît, vérifie le chemin de `savefig` : il sauvegarde relativement au répertoire de travail courant. Si le graphique est par ailleurs vide, `plt.close(fig)` s'est exécuté avant que `savefig` ait fini — échange l'ordre.

### 5.2 Vérifie de bout en bout

**✅ Liste de vérification**

- ✅ `weekly_report.py` s'exécute proprement et écrit `weekly_report.png` sur le disque.
- ✅ Les totaux imprimés correspondent aux hauteurs de barres visuelles.
- ✅ Tout le pipeline — données → classement → hashtags → calendrier → rapport — s'exécute depuis un seul `smm.py` sans éditions copiées-collées entre les étapes.

**🤔 Question(s) socratique(s)**

- Le rapport somme les engagements bruts, donc une plateforme avec une publication virale semble dominante. Quelle métrique tracerais-tu à la place pour montrer la performance *soutenue* plutôt qu'un seul jour de chance ?
- `savefig` a écrit dans le répertoire depuis lequel tu as exécuté le script. Comment rendrais-tu le chemin du rapport explicite et portable si ton dossier de projet vivait sous `content/` ?

## ⚠️ Pièges courants

- **Oublier la graine, donc chaque exécution reclasse différemment.** Les nombres d'engagement sont aléatoires ; sans `random.seed(seed)` en haut de `build_dataset`, la « meilleure heure » de l'Étape 2 change entre les exécutions et tes amis ne peuvent pas comparer les résultats. Correctif : garde la graine comme paramètre avec un défaut fixe.
- **Confirmer les victoires avec des sommes brutes plutôt que des moyennes.** Sommer les engagements récompense les plateformes qui ont simplement publié plus. Le rapport n'est honnête que lorsqu'il utilise l'engagement *moyen* (l'Étape 2 et la table de l'Étape 5) à côté des totaux.
- **Ne pas gérer les thèmes inconnus.** Un thème mal orthographié dans le calendrier fait planter le moteur avec une `KeyError`. Le repli `.get(topic, [("#ContentTips", 60)])` transforme ce plantage en un défaut raisonnable.
- **Un calendrier codé en dur plutôt que généré.** Écrire lundi–dimanche à la main ignore à la fois le classement de l'Étape 2 et les scores de hashtags de l'Étape 3. Correctif : garde le calendrier comme fonction des données pour qu'améliorer les données améliore l'emploi du temps.
- **Tracer avec un affichage connecté.** Les backends matplotlib interactifs cassent sur les machines sans écran (CI, certains notebooks). Règle `matplotlib.use("Agg")` *avant* `import pyplot`, comme à l'Étape 5.

## Ce que tu viens de construire

Un gestionnaire de réseaux sociaux fonctionnel : il apprend la fenêtre de publication la plus performante de chaque plateforme à partir de distributions d'engagement réelles, suggère des hashtags notés par thème, planifie une semaine complète de publications, et rend un graphique analytique partageable — une version complète de la boucle recherche-puis-publie qu'une équipe sociale exécute à la main. La compétence transférable est *laisser les données prendre les décisions d'emploi du temps* : toute question « quand devrait-on faire ça » de ton futur, des envois d'emails aux séances d'étude, est le même motif groupby-et-classe que tu as utilisé ici.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/social-media-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/social-media-manager) dans le dépôt du cours est une version plus complète du code ci-dessus, avec le moteur de hashtags et le calendrier déjà câblés dans un unique CLI. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le à partir de là.
:::

## Où aller à partir d'ici

- Nourris-le avec de vraies données : exporte l'historique de publications de ta propre plateforme, dépose-le dans `posts.csv`, et regarde le classement des meilleurs horaires se recalculer à partir d'engagements réels plutôt qu'ensemencés.
- Ajoute un facteur jour-de-semaine en regroupant sur `(day, hour)` ensemble, pour qu'une fenêtre du lundi 9:00 qui marche pour un créneau du mardi 20:00 ne prétende plus qu'elles sont identiques.
- Persiste le calendrier avec une vraie colonne `datetime` (jour de semaine + heure + date) et écris-la en CSV pour qu'elle s'importe directement dans Buffer, Hootsuite ou le planificateur de Meta.
- Note les hashtags à partir de la performance réelle — en recoupant les hashtags de chaque publication avec son engagement — plutôt que les scores écrits à la main de l'Étape 3.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README contient un parcours complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓