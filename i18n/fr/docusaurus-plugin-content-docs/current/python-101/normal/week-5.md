---
title: "Semaine 5 : Travailler avec des fichiers CSV"
sidebar_position: 5
section: python-101
track: normal
week: 5
description: "Lisez et écrivez des fichiers CSV en Python et construisez un mini-projet final avec le module csv."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';
import BonusContent from '@site/src/components/BonusContent';

# Semaine 5 : Lire et écrire des fichiers CSV

<span className="gamified-flourish">📊 Tout ce que tu as appris ce mois-ci menait vers une seule chose : les données réelles vivent dans des fichiers, pas dans du code que tu as tapé à la main.</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine, tu seras capable de :
- Ouvrir et fermer un fichier en toute sécurité avec `with`, et expliquer pourquoi cela compte.
- Lire les lignes d'un fichier CSV en Python avec le module intégré `csv`, aussi bien sous forme de listes que de dictionnaires.
- Écrire des lignes simples et des lignes sous forme de dictionnaires dans un nouveau fichier CSV.
- Combiner listes, dictionnaires, boucles et fonctions pour résumer un jeu de données réel.
- Écrire un petit mini-projet de bout en bout, sans aide, en utilisant uniquement ce que tu as appris aux semaines 1 à 4.

## Leçon

### Ouvrir des fichiers en toute sécurité avec `with`

Avant d'aborder les CSV spécifiquement, une nouvelle syntaxe : `with open(...) as f:` ouvre un fichier, te donne accès à un handle vers celui-ci sous le nom `f`, et le referme automatiquement une fois le bloc indenté terminé — même si une erreur survient en cours de route. Cela compte parce qu'un fichier non fermé peut perdre des écritures mises en mémoire tampon ou verrouiller le fichier pour d'autres programmes. L'alternative, `f = open(...)` suivi d'un `f.close()` manuel à la fin, est facile à oublier (surtout si une erreur provoque une sortie prématurée) ; `with` fait de « toujours le fermer » le comportement par défaut, que tu n'as pas besoin de te rappeler.

### CSV : des lignes de valeurs séparées par des virgules

Un fichier CSV (comma-separated values, valeurs séparées par des virgules) est un tableau en texte brut — une ligne par enregistrement, les valeurs séparées par des virgules. Le jeu de données de cette semaine, [`students-normal.csv`](pathname:///datasets/students-normal.csv), a une ligne d'en-tête (`name,quiz1,quiz2,quiz3`) suivie d'une ligne par étudiant.

:::tip[Utiliser ce fichier dans le bac à sable Trinket]
Le bac à sable Trinket du bouton flottant (FAB) est un éditeur tiers isolé — il ne peut pas accéder directement aux fichiers de ce site. Ouvre le lien du jeu de données ci-dessus, copie son contenu, puis dans Trinket crée un nouveau fichier nommé `students.csv` (utilise le bouton « + » de l'arborescence de fichiers) et colle le contenu dedans. Tes appels `open("students.csv")` le trouveront alors.
:::

```python
import csv

with open("students.csv", newline="") as f:
    reader = csv.reader(f)
    header = next(reader)          # first row: column names
    for row in reader:
        print(row)                  # each row is a list of strings
```

Chaque valeur lue de cette manière est un `str` — un nombre comme `"87"` dans le fichier arrive sous forme de chaîne `"87"`, pas de l'entier `87`. Tu dois la convertir toi-même, exactement comme `input()` à la semaine 1. `next(reader)` extrait uniquement la première ligne (l'en-tête) du lecteur avant que la boucle `for` ne commence, de sorte que la boucle elle-même ne voit que les lignes de données réelles. L'argument `newline=""` empêche la gestion propre des fins de ligne du module `csv` d'entrer en conflit avec celle de Python — c'est du code standard que tu devrais toujours inclure lorsque tu ouvres un fichier pour `csv.reader`/`csv.writer`, même si en expliquer précisément la raison dépasse le cadre de cette semaine.

### `csv.DictReader` : des lignes sous forme de dictionnaires

Plutôt que de suivre les positions des colonnes par index, `csv.DictReader` te donne chaque ligne sous forme de `dict` indexé par les noms d'en-tête — c'est généralement l'option la plus lisible, et elle lit automatiquement la ligne d'en-tête pour toi (pas besoin de `next(reader)` manuel) :

```python
with open("students.csv", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row["name"]
        score = int(row["quiz1"])   # still a str until you convert it
        print(name, score)
```

Compare ceci à `csv.reader` : avec `csv.reader`, `row[1]` signifie « ce qui se trouve dans la colonne 1 » — fragile si l'ordre des colonnes change un jour. Avec `csv.DictReader`, `row["quiz1"]` dit exactement ce que tu veux dire, quel que soit l'ordre des colonnes, au petit coût d'une recherche dans un dictionnaire plutôt que d'un index de liste.

### Écrire des fichiers CSV

`csv.writer` et `csv.DictWriter` sont l'image miroir de `csv.reader`/`csv.DictReader` — utiles pour enregistrer dans un fichier un résumé que tu as calculé :

```python
with open("summary.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["name", "average"])
    writer.writerow(["Amina", 91.5])
```

Le `"w"` (mode écriture) est important — `open("summary.csv", "w")` crée le fichier s'il n'existe pas, et **écrase complètement son contenu** s'il existe déjà. `csv.DictWriter` reflète `DictReader` : tu écris des dictionnaires au lieu de simples listes, et il a besoin de connaître les noms de colonnes (`fieldnames`) à l'avance pour savoir dans quel ordre les écrire et pouvoir produire une ligne d'en-tête correspondante :

```python
with open("summary.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "average"])
    writer.writeheader()                              # writes the header row
    writer.writerow({"name": "Amina", "average": 91.5})
    writer.writerow({"name": "Youssef", "average": 74.3})
```

`DictWriter` est le pendant naturel si tu as construit ton résumé sous forme de liste de dictionnaires (la forme « imbrication de collections » de la semaine 3) plutôt que sous forme d'un simple dictionnaire nom → moyenne.

### Mettre le tout ensemble : un mini-projet

Le projet de cette semaine combine tout ce qui vient des semaines 1 à 4 : lire un CSV de notes d'étudiants, calculer la moyenne de chacun avec une fonction, la stocker dans un `dict`, et afficher un résumé trié du plus haut au plus bas — en utilisant `sorted()` avec une fonction `key`, qui elle-même prend une fonction en argument, exactement comme `compose` dans la question socratique de la semaine dernière :

```python
def average(scores):
    return sum(scores) / len(scores)

averages = {}   # name -> average
with open("students.csv", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row["name"]
        scores = [int(row["quiz1"]), int(row["quiz2"]), int(row["quiz3"])]
        averages[name] = average(scores)

for name in sorted(averages, key=lambda n: averages[n], reverse=True):
    print(name, round(averages[name], 1))
```

`lambda n: averages[n]` est une petite fonction sans nom — lis-la comme « la règle qui associe un nom à sa moyenne », utilisée uniquement pour indiquer à `sorted()` selon quoi trier. Une `lambda` est exactement équivalente à un petit `def` (`lambda n: averages[n]` se comporte comme la fonction d'une ligne `def key_fn(n): return averages[n]`) ; elle existe uniquement pour que tu n'aies pas besoin de nommer et de définir une fonction séparée juste pour donner à `sorted()` une règle simple et jetable.

## ⚠️ Pièges courants

- **Oublier `newline=""`.** Sans cela, `csv.writer` peut insérer des lignes vides supplémentaires entre les enregistrements sur certains systèmes (notamment Windows) — inclus-le toujours lors de la lecture ou de l'écriture de fichiers CSV.
- **Ouvrir en mode `"w"` par accident alors que tu voulais ajouter des données.** `open("summary.csv", "w")` efface d'abord le contenu existant du fichier. Si tu veux ajouter des lignes à un fichier existant à la place, utilise le mode `"a"` (append, ajout).
- **Supposer un ordre de colonnes fixe avec `csv.reader`.** `row[0]` n'est « le nom » que si la colonne nom est réellement en premier *et le reste* — un `DictReader` évite toute cette catégorie de bug.
- **Ne pas convertir les colonnes numériques avant de faire des calculs dessus.** `row["quiz1"] + row["quiz2"]` avec `DictReader` concatène deux chaînes (`"88" + "92"` → `"8892"`), ça n'additionne pas deux nombres — un écho direct du piège de `input()` à la semaine 1.

## 🧩 Défis

<Challenge id="python101-normal-w5-c1" answer={<>Ouvre le fichier avec <code>csv.DictReader</code>, boucle sur les lignes, convertis la colonne des notes avec <code>int(...)</code>, et garde un <code>total</code> et un <code>count</code> courants (ou utilise une liste et <code>sum()</code>/<code>len()</code>) pour calculer la moyenne de la classe.</>}>

Étant donné un CSV avec les colonnes `name,score`, écris un programme qui calcule et affiche la moyenne des notes sur *tous* les étudiants du fichier.

</Challenge>

<Challenge id="python101-normal-w5-c2" answer={<>Boucle sur les lignes du DictReader, garde une paire <code>best_name</code>/<code>best_score</code> courante, et mets-la à jour chaque fois que tu vois une note plus élevée — le même schéma « suivre le maximum courant » que pour trouver le max d'une liste.</>}>

Étends le programme précédent pour qu'il affiche aussi le nom de l'étudiant qui a la note *la plus élevée*.

</Challenge>

<Challenge id="python101-normal-w5-c3" answer={<>Utilise <code>csv.writer</code>, écris une ligne d'en-tête, puis boucle sur ton dictionnaire de moyennes en écrivant une ligne par étudiant — reflétant le côté lecture mais avec <code>writerow</code> au lieu d'itérer sur un lecteur.</>}>

Écris les moyennes par étudiant que tu as calculées ci-dessus dans un nouveau fichier `summary.csv` avec les colonnes `name,average`.

</Challenge>

<Challenge id="python101-normal-w5-c4" answer={<>Encadre la conversion int(...) de sorte qu'une valeur manquante/vide soit ignorée ou remplacée par une valeur par défaut (par exemple traitée comme 0, ou ce quiz exclu de la moyenne) plutôt que de faire planter tout le programme — c'est exactement le genre de situation pour laquelle try/except (le bonus de cette semaine) est conçu.</>}>

Que se passerait-il si une ligne du CSV avait une note manquante (une chaîne vide au lieu d'un nombre) ? Modifie ton programme pour qu'il ne plante pas sur cette ligne.

</Challenge>

<Challenge id="python101-normal-w5-c5" answer={<>Réécris l'étape d'écriture avec <code>csv.DictWriter</code> et <code>fieldnames=["name", "average"]</code>, appelle <code>writer.writeheader()</code> une seule fois, puis <code>writer.writerow(...)</code> avec un dictionnaire par étudiant à l'intérieur de la boucle, au lieu des lignes simples de <code>csv.writer</code>.</>}>

Refais le défi 3 en utilisant `csv.DictWriter` au lieu de `csv.writer`. Quelle version trouves-tu plus facile à lire, et pourquoi ?

</Challenge>

<Challenge id="python101-normal-w5-c6" answer={<>Utilise le mode "a" (ajout) au lieu de "w" : with open("summary.csv", "a", newline="") as f — cela ajoute de nouvelles lignes après tout ce que le fichier contient déjà, au lieu de l'effacer d'abord. Note que tu n'appellerais writer.writeheader() que la première fois que le fichier est créé, pas à chaque ajout.</>}>

Si tu voulais ajouter la ligne d'un étudiant supplémentaire à `summary.csv` *sans* effacer ce qui s'y trouve déjà, quel mode de fichier utiliserais-tu à la place de `"w"` ? Essaie-le.

</Challenge>

## 🤔 Questions socratiques

- Pourquoi tout ce qui est lu depuis un CSV arrive-t-il comme un `str`, même les colonnes qui semblent numériques ? Où ailleurs dans ce cours as-tu déjà vu ce même schéma « texte en entrée, conversion nécessaire » ?
- `sorted(averages, key=lambda n: averages[n], reverse=True)` — que changerait le retrait de `reverse=True` ? Que changerait le retrait de `key=...` entièrement en écrivant simplement `sorted(averages)` ?
- Tu as maintenant construit un petit pipeline : lire → transformer → résumer → écrire. De quels concepts des semaines 1 à 4 chaque étape dépendait-elle réellement ? Sans le contenu de quelle semaine ce projet aurait-il été impossible ?
- `with open(...) as f:` ferme automatiquement le fichier même si une erreur survient dans le bloc. Peux-tu imaginer une raison pour laquelle un programme qui ouvre de nombreux fichiers au cours de sa vie, sans jamais les fermer correctement, pourrait finir par échouer de manière étrange ?
- `csv.DictWriter` a besoin de `fieldnames` spécifié à l'avance, avant d'écrire quoi que ce soit. Pourquoi penses-tu qu'il l'exige, plutôt que de simplement déduire les colonnes à partir du premier dictionnaire que tu lui passes via `writerow` ?

## ✅ Quiz de la semaine

<WeeklyQuiz
  weekId="python-101-normal-week-5"
  questions={[
    {
      id: 'q1',
      prompt: 'Quel est le type de chaque valeur lue depuis un fichier CSV avec le module csv, avant que tu ne la convertisses ?',
      options: ['int', 'float', 'str', 'Ça dépend de la colonne'],
      correctOptionIndex: 2,
    },
    {
      id: 'q2',
      prompt: 'Que te donne csv.DictReader pour chaque ligne, comparé à csv.reader ?',
      options: [
        'Une liste de chaînes, comme csv.reader',
        'Un dict indexé par les noms de colonnes de l’en-tête',
        'Un tuple d’entiers',
        'Une seule chaîne pour toute la ligne',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'Dans sorted(names, key=lambda n: averages[n]), à quoi sert l’argument key ?',
      options: [
        'Il filtre certains noms',
        'Il indique à sorted() selon quelle valeur trier chaque élément',
        'Il convertit les noms en nombres de façon permanente',
        'Il inverse l’ordre',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: "Quel module de la bibliothèque standard de Python a été utilisé cette semaine pour lire/écrire des fichiers CSV ?",
      options: ['json', 'os', 'csv', 'io'],
      correctOptionIndex: 2,
    },
    {
      id: 'q5',
      prompt: 'Ouvrir un fichier avec open("data.csv", "w") alors que le fichier existe déjà va :',
      options: [
        'Refuser de s’ouvrir, en levant une erreur',
        'Ajouter le nouveau contenu à la fin',
        'Écraser complètement le contenu existant',
        'L’ouvrir en lecture seule',
      ],
      correctOptionIndex: 2,
    },
  ]}
/>

## 🎁 Bonus : un premier aperçu des classes

<BonusContent weekId="python-101-normal-week-5">

Cette semaine, chaque étudiant était une collection éparse de valeurs séparées — un nom dans un dictionnaire, une liste de notes dans un autre. Une `class` te permet de regrouper données et comportement liés en un seul objet :

```python
class Student:
    def __init__(self, name, scores):
        self.name = name
        self.scores = scores

    def average(self):
        return sum(self.scores) / len(self.scores)

amina = Student("Amina", [88, 92, 79])
print(amina.average())   # 86.33...
```

`__init__` s'exécute quand tu crées un `Student(...)` ; `self` fait référence à *cet* objet étudiant en particulier. Cela ne fait pas partie du programme principal — tout, aux semaines 1 à 5, était délibérément résoluble avec seulement des fonctions, des listes et des dictionnaires — mais les classes deviennent réellement utiles dès qu'un programme a de nombreux éléments d'état et de comportement liés qui voyagent ensemble, ce que tu commenceras à ressentir dans les projets plus vastes de la section **Analyse de données**. Essaie de réécrire le mini-projet de cette semaine de sorte que chaque étudiant soit un objet `Student` plutôt qu'un dictionnaire indexé par nom.

</BonusContent>

<ProgressCheckbox weekId="python-101-normal-week-5" />
