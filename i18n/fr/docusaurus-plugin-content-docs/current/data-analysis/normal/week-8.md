---
title: "Semaine 8 : Nettoyer les données"
sidebar_position: 3
section: data-analysis
track: normal
week: 8
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semaine 8 : Nettoyer les données

<span className="gamified-flourish">🧹 Les vrais jeux de données sont désordonnés. Cette semaine, il s'agit de rendre un jeu de données fiable avant de l'analyser.</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine vous serez capable de :
- Détecter et gérer les valeurs manquantes avec `.isna()`, `.dropna()`, et `.fillna()`.
- Trouver et supprimer les lignes en double.
- Convertir explicitement le dtype d'une colonne avec `.astype()` et `pd.to_numeric()`.
- Utiliser les méthodes de l'accesseur `.str` pour nettoyer des colonnes de texte.
- Appliquer une fonction personnalisée à une colonne avec `.apply()` quand aucune méthode intégrée ne convient.

## Leçon

### Valeurs manquantes

Pandas représente « aucune valeur » par `NaN` (Not a Number) pour les colonnes numériques. `.isna()` retourne un masque booléen indiquant où les valeurs sont manquantes — la même idée de masque booléen que la semaine dernière, appliquée à une question différente :

```python
df.isna()             # True/False per cell
df.isna().sum()        # count of missing values per column
```

Deux stratégies pour les gérer :

```python
df.dropna()                     # remove any row with at least one missing value
df.dropna(subset=["quiz1"])      # only drop rows missing quiz1 specifically
df.fillna(0)                     # replace all NaN with 0
df["quiz1"].fillna(df["quiz1"].mean())   # replace with the column's mean — a common default
```

Il n'y a pas de choix universellement « correct » — supprimer une ligne fait perdre entièrement les autres données de cet étudiant, tandis que remplir avec une moyenne peut fausser les statistiques s'il manque beaucoup de données. Lequel est approprié dépend de *pourquoi* les données manquent et de la quantité manquante, une décision de jugement que vous pratiquerez tout au long du cadre d'analyse exploratoire du parcours difficile.

### Lignes en double

Les vrais jeux de données contiennent parfois le même enregistrement plus d'une fois — une erreur de saisie, ou un fichier qui a été fusionné avec lui-même par accident :

```python
df.duplicated()             # True/False per row — is this an exact repeat of an earlier row?
df.duplicated().sum()        # how many duplicate rows exist
df = df.drop_duplicates()     # keep only the first occurrence of each duplicate group
```

`.duplicated(subset=["name"])` restreint la vérification à des colonnes spécifiques — utile quand deux lignes ne devraient pas exister toutes les deux pour le même *étudiant*, même si une autre colonne (comme un horodatage) diffère entre elles.

### Convertir les dtypes

`pd.read_csv` déduit parfois le mauvais dtype — une colonne de nombres stockée comme du texte si ne serait-ce qu'une ligne a un caractère parasite, par exemple. `.astype()` convertit explicitement :

```python
df["quiz1"] = df["quiz1"].astype(int)
df["quiz1"] = pd.to_numeric(df["quiz1"], errors="coerce")   # invalid values become NaN instead of crashing
```

`pd.to_numeric(..., errors="coerce")` est généralement plus sûr que `.astype(int)` pour des données réelles désordonnées : au lieu de lever une erreur dès qu'elle rencontre quelque chose de non convertible, elle transforme silencieusement cette valeur en `NaN`, que vous pouvez ensuite gérer avec les outils ci-dessus.

### Nettoyer le texte avec `.str`

Les colonnes de chaînes ont leur propre accesseur, `.str`, exposant des versions vectorisées de méthodes de chaînes familières — l'équivalent pandas de `.lower()`/`.strip()` de Python 101, appliqué à une colonne entière d'un coup :

```python
df["name"] = df["name"].str.strip()          # remove leading/trailing whitespace
df["name"] = df["name"].str.lower()           # lowercase, same reason as Python 101 tokenize()
df["name"].str.contains("amina")               # boolean mask: does each name contain "amina"?
df["name"] = df["name"].str.replace("amina", "Amina")   # find-and-replace within each value
df["first_name"] = df["name"].str.split(" ").str[0]      # split each name, keep the first piece
```

`.str.split(" ")` produit une Series où chaque valeur est elle-même une *liste* de morceaux ; un second `.str[0]` accède ensuite à chacune de ces listes et en extrait le premier élément — chaîner des opérations `.str` de cette façon est un motif courant lorsqu'une seule méthode de chaîne ne suffit pas tout à fait.

### Quand aucune méthode intégrée ne convient : `.apply()`

Pour une transformation qui n'a pas de méthode `.str`/numérique toute prête, `.apply()` exécute n'importe quelle fonction de votre choix sur chaque valeur d'une colonne :

```python
def grade_letter(score):
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    else:
        return "F"

df["quiz1_grade"] = df["quiz1"].apply(grade_letter)
```

C'est réellement à nouveau les fonctions de Python 101 — `grade_letter` est une fonction ordinaire, et `.apply()` est ce qui l'exécute une fois par valeur, l'équivalent d'aspect vectorisé de boucler vous-même sur la colonne et d'appeler `grade_letter` sur chaque valeur à la main.

## ⚠️ Erreurs courantes

- **Appeler `.fillna()`/`.dropna()` sans réaffecter.** Comme la plupart des opérations pandas, celles-ci retournent par défaut une *nouvelle* Series/DataFrame — `df.fillna(0)` seul ne change pas `df` ; il vous faut `df = df.fillna(0)` (ou `inplace=True`).
- **Remplir les valeurs manquantes avant de comprendre pourquoi elles manquent.** Un `df.fillna(0)` aveugle sur une colonne de scores pourrait silencieusement transformer « cet étudiant était absent » en « cet étudiant a obtenu zéro », qui sont des faits très différents.
- **Oublier que les doublons peuvent être *partiels*, pas seulement exacts.** `.duplicated()` sans `subset` ne signale que les lignes qui correspondent exactement sur *toutes* les colonnes — deux lignes pour le même étudiant avec une faute de frappe dans une colonne ne seront pas détectées sans restreindre la vérification.
- **Utiliser `.apply()` quand une méthode vectorisée existe déjà.** `.apply()` exécute votre fonction Python une fois par ligne, ce qui est plus lent qu'une méthode vectorisée intégrée comme `.str.lower()` faisant le même travail en code optimisé — ne recourez à `.apply()` que quand rien d'intégré ne convient.

## 🧩 Défis

<Challenge id="dataanalysis-normal-w8-c1" answer={<><code>df.isna().sum()</code> — un nombre par colonne, le compte des valeurs manquantes (NaN) dans cette colonne.</>}>

Chargez `students-normal.csv` et affichez combien de valeurs manquantes chaque colonne possède.

</Challenge>

<Challenge id="dataanalysis-normal-w8-c2" answer={<>Introduisez d'abord un NaN manuellement (par ex. <code>df.loc[0, "quiz1"] = None</code>), puis comparez <code>df.dropna(subset=["quiz1"])</code> (moins de lignes) à <code>df["quiz1"].fillna(df["quiz1"].mean())</code> (même nombre de lignes, valeur manquante remplacée) pour voir directement la différence de nombre de lignes.</>}>

Définissez manuellement une valeur `quiz1` comme manquante (par ex. `df.loc[0, "quiz1"] = None`), puis comparez le nombre de lignes résultant après `.dropna(subset=["quiz1"])` à celui après `.fillna(df["quiz1"].mean())`.

</Challenge>

<Challenge id="dataanalysis-normal-w8-c3" answer={<><code>df["name"].str.lower()</code> convertit toute la colonne en minuscules en un seul appel, vectorisé — équivalent à boucler et appeler <code>.lower()</code> sur chaque nom individuellement, mais sans écrire la boucle.</>}>

Mettez chaque valeur de la colonne `name` en minuscules en utilisant `.str`, sans écrire de boucle manuelle.

</Challenge>

<Challenge id="dataanalysis-normal-w8-c4" answer={<><code>df["name"].str.contains("a")</code> retourne un masque booléen ; enveloppez-le dans <code>df[...]</code> pour obtenir seulement les lignes correspondantes, ou appelez <code>.sum()</code> sur le masque pour simplement les compter.</>}>

En utilisant `.str.contains(...)`, trouvez combien d'étudiants ont la lettre « a » n'importe où dans leur nom.

</Challenge>

<Challenge id="dataanalysis-normal-w8-c5" answer={<>Dupliquez d'abord une ligne (par ex. pd.concat([df, df.iloc[[0]]])), puis exécutez .duplicated().sum() pour confirmer qu'au moins un doublon est détecté, et .drop_duplicates() pour le supprimer, en vérifiant df.shape avant et après pour confirmer que le nombre de lignes a diminué d'une unité.</>}>

Dupliquez manuellement une ligne du DataFrame (ajoutez une copie d'une ligne existante), confirmez que `.duplicated()` la détecte, puis supprimez-la avec `.drop_duplicates()`.

</Challenge>

<Challenge id="dataanalysis-normal-w8-c6" answer={<>Écrivez une fonction comme grade_letter qui retourne "Pass" si le score est &gt;= 60 et "Fail" sinon, puis appliquez-la : df["quiz1_result"] = df["quiz1"].apply(pass_fail).</>}>

Écrivez votre propre fonction qui prend un score et retourne `"Pass"` ou `"Fail"` selon un seuil de 60%, puis utilisez `.apply()` pour ajouter une nouvelle colonne `quiz1_result` construite à partir d'elle.

</Challenge>

## 🤔 Questions socratiques

- `.dropna()` et `.fillna(mean)` donnent des nombres de lignes finaux et des statistiques finales différents. Pour un jeu de données où 40% des valeurs d'une colonne manquent, quel choix pensez-vous le plus susceptible d'induire en erreur quelqu'un lisant vos statistiques descriptives, et pourquoi ?
- `pd.to_numeric(col, errors="coerce")` transforme silencieusement les mauvaises valeurs en `NaN` plutôt que de planter. Le « silencieux » est-il réellement une bonne chose ici ? Qu'irait-il de travers si vous exécutiez cela sur une colonne et ne vérifiiez jamais `.isna().sum()` après coup ?
- Pourquoi les colonnes de chaînes ont-elles besoin d'un accesseur `.str` séparé (`df["name"].str.lower()`) plutôt que simplement `df["name"].lower()` ? Que signifierait même `.lower()` si elle était appelée directement sur une Series entière plutôt que sur une seule chaîne ?
- `.duplicated()` sans argument `subset` ne détecte que les lignes qui correspondent sur *toutes* les colonnes. Pouvez-vous imaginer un scénario réaliste dans ce jeu de données où deux lignes représentent le même étudiant réel mais ne seraient pas détectées par une vérification de doublon à correspondance exacte ?
- `.apply()` peut exécuter *n'importe quelle* fonction Python, y compris celles avec des effets de bord (comme afficher, ou écrire dans un fichier) — pas seulement celles qui retournent une valeur transformée. Pourquoi exécuter du code avec des effets de bord à l'intérieur de `.apply()` pourrait-il être une mauvaise idée, étant donné que vous ne contrôlez pas exactement combien de fois ni dans quel ordre pandas pourrait appeler votre fonction en interne ?

## ✅ Quiz de la semaine

<WeeklyQuiz
  weekId="data-analysis-normal-week-8"
  questions={[
    {
      id: 'q1',
      prompt: 'Quelle méthode compte les valeurs manquantes par colonne ?',
      options: ['df.count()', 'df.isna().sum()', 'df.dropna()', 'df.fillna()'],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Que fait pd.to_numeric(col, errors="coerce") avec une valeur qu\'elle ne peut pas convertir ?',
      options: [
        'Lève immédiatement une exception',
        'La transforme en NaN',
        'La laisse comme la chaîne d\'origine',
        'Supprime cette ligne',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'Pourquoi utiliser df["col"].str.lower() plutôt que df["col"].lower() ?',
      options: [
        'Ils sont identiques, c\'est juste une question de style',
        '.str est requis pour appliquer des méthodes de chaîne élément par élément sur une Series',
        '.lower() ne fonctionne que sur les DataFrame, pas les Series',
        '.str.lower() est plus rapide pour les colonnes numériques',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'df.dropna(subset=["quiz1"]) supprime les lignes où :',
      options: [
        'N\'importe quelle colonne manque une valeur',
        'Spécifiquement quiz1 manque une valeur',
        'quiz1 est inférieur à 60',
        'L\'index de ligne est manquant',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: '.apply() sur une Series est le mieux utilisé quand :',
      options: [
        'Vous voulez toujours la performance maximale',
        'Aucune méthode vectorisée intégrée ne fait déjà ce dont vous avez besoin',
        'Vous travaillez avec un DataFrame, jamais une Series',
        'La colonne ne contient que des nombres',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-normal-week-8" />
