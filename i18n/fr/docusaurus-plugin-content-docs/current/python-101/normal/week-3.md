---
title: "Semaine 3 : Structures de données"
sidebar_position: 3
section: python-101
track: normal
week: 3
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semaine 3 : Listes, dictionnaires, tuples et ensembles

<span className="gamified-flourish">📦 Une variable contient une valeur. Cette semaine, une variable contient toute une collection.</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine, vous serez capable de :
- Stocker des collections ordonnées et modifiables dans une `list`, et les indexer/découper/modifier.
- Stocker des associations clé-valeur dans un `dict`, l'équivalent en Python d'une table de correspondance d'une fonction.
- Expliquer quand un `tuple` (immuable) ou un `set` (non ordonné, sans doublons) convient mieux qu'une `list`.
- Écrire des compréhensions de liste et de dictionnaire pour construire de nouvelles collections en une seule ligne.
- Manipuler les chaînes de caractères comme des séquences, et imbriquer des collections les unes dans les autres.

## Cours

### Les listes : des séquences ordonnées

Une `list` est une séquence ordonnée et modifiable — pensez-y comme à une suite finie $(a_0, a_1, \dots, a_{n-1})$ :

```python
scores = [88, 92, 74, 95]
scores[0]        # 88 — l'indexation commence à 0
scores[-1]       # 95 — les indices négatifs comptent depuis la fin
scores[1:3]      # [92, 74] — découpage (slicing) : [début, fin)
scores.append(100)   # ajoute à la fin
len(scores)       # 5
```

Le découpage `scores[1:3]` suit la même convention semi-ouverte que `range` — c'est la même idée de "début inclus, fin exclue" que vous avez déjà utilisée la semaine dernière. Le découpage accepte aussi un pas, `scores[start:stop:step]`, et omettre une borne signifie "depuis le début" ou "jusqu'à la fin" :

```python
scores[:2]     # [88, 92]         — tout ce qui précède l'indice 2
scores[2:]     # [74, 95, 100]    — tout à partir de l'indice 2
scores[::2]    # [88, 74, 100]    — un élément sur deux
scores[::-1]   # [100, 95, 74, 92, 88]  — la liste entière, inversée
```

Les listes sont **modifiables (mutables)** — vous pouvez les changer en place, pas seulement en construire de nouvelles :

```python
scores[0] = 90          # remplace un élément
scores.insert(1, 100)   # insère 100 à l'indice 1, en décalant le reste vers la droite
scores.remove(74)        # supprime la première occurrence de 74 trouvée (par valeur, pas par indice)
last = scores.pop()       # supprime et renvoie le dernier élément
scores.sort()              # trie en place, par ordre croissant
scores.sort(reverse=True)  # décroissant
```

`.sort()` modifie la liste elle-même et renvoie `None` ; la fonction native `sorted(scores)` renvoie au contraire une *nouvelle* liste triée et laisse l'originale intacte — utilisez `sorted()` quand vous avez besoin de conserver l'ordre original aussi.

Les **compréhensions de liste** sont l'écriture Python de la notation ensembliste en compréhension. Comparez $\{x^2 : x \in \{1,\dots,5\}\}$ à :

```python
squares = [x**2 for x in range(1, 6)]   # [1, 4, 9, 16, 25]
```

Ajouter une condition reflète $\{x \in S : P(x)\}$ :

```python
evens = [x for x in range(20) if x % 2 == 0]
```

Une compréhension peut transformer *et* filtrer à la fois — l'expression avant `for` n'a pas à être la variable de boucle inchangée :

```python
passing_doubled = [s * 2 for s in scores if s >= 60]
```

### Les chaînes de caractères comme séquences

Un `str` se comporte lui aussi comme une séquence — l'indexation, le découpage et `len()` fonctionnent de la même manière que sur une `list`, car une chaîne est en réalité une séquence fixe de caractères :

```python
name = "Amina"
name[0]      # "A"
name[-1]     # "a"
name[1:3]    # "mi"
len(name)    # 5
```

La seule différence : les chaînes sont **immuables** — `name[0] = "B"` lève une `TypeError`. Pour "changer" une chaîne, on en construit une nouvelle, souvent avec une méthode : `name.upper()`, `name.lower()`, `name.strip()` (supprime les espaces en début/fin), `name.replace("A", "B")`, ou `name.split(",")` (découpe en une `list` de morceaux — l'outil que la Semaine 5 du parcours Normal utilisera pour analyser manuellement les lignes d'un fichier CSV). Aucune de ces méthodes ne modifie `name` lui-même ; chacune renvoie une nouvelle chaîne (ou liste).

### Les dictionnaires : des associations clé-valeur

Un `dict` associe des clés à des valeurs, comme une fonction $f: K \to V$ définie seulement sur un domaine fini :

```python
ages = {"amina": 21, "youssef": 23}
ages["amina"]          # 21
ages["sara"] = 19       # ajoute une nouvelle clé
"sara" in ages          # True — test d'appartenance
for name, age in ages.items():
    print(name, "is", age)
```

Rechercher une clé absente avec `ages["missing"]` lève une `KeyError` — utilisez `.get("missing", default)` quand une clé pourrait ne pas exister. Quelques autres opérations sur les dictionnaires que vous utiliserez constamment :

```python
ages.keys()      # une vue de toutes les clés : dict_keys(['amina', 'youssef', 'sara'])
ages.values()     # une vue de toutes les valeurs : dict_values([21, 23, 19])
del ages["sara"]   # supprime complètement une clé
ages.update({"karim": 25, "amina": 22})   # ajoute/écrase plusieurs clés à la fois
```

Les **compréhensions de dictionnaire** reflètent les compréhensions de liste, mais construisent un `dict` au lieu d'une `list` :

```python
name_lengths = {name: len(name) for name in ages}
# {'amina': 5, 'youssef': 7, 'karim': 5}
```

### Les tuples : des séquences immuables, de forme fixe

Un `tuple` ressemble à une liste mais ne peut pas être modifié après sa création — utile pour des valeurs qui forment naturellement un groupe fixe, comme une paire de coordonnées :

```python
point = (3, 4)
x, y = point            # déballage (unpacking)
```

Comme les tuples sont immuables, ils peuvent être utilisés comme clés de dictionnaire ; les listes ne le peuvent pas. Cela fait d'un `dict` à clés de type tuple un moyen naturel de représenter une association *depuis des paires d'éléments*, comme une coordonnée de grille vers une valeur :

```python
grid = {(0, 0): "start", (2, 3): "treasure"}
grid[(0, 0)]   # "start"
```

Le déballage de tuples apparaît aussi constamment lors du parcours d'un `.items()` de dictionnaire, comme vous l'avez déjà vu ci-dessus : `for name, age in ages.items():` déballe chaque tuple `(name, age)` en deux variables sur une seule ligne.

### Les ensembles : des collections uniques et non ordonnées

Un `set` est l'équivalent direct en Python de l'ensemble mathématique — pas d'ordre, pas de doublons :

```python
a = {1, 2, 3}
b = {2, 3, 4}
a | b   # union : {1, 2, 3, 4}
a & b   # intersection : {2, 3}
a - b   # différence : {1}
```

Un `{}` vide est en réalité un `dict`, pas un `set` (une bizarrerie historique de la syntaxe) — utilisez `set()` pour créer un ensemble vide. Convertir une `list` en `set` puis revenir en liste est l'astuce classique pour éliminer les doublons tout en préservant (à peu près) l'idée de "seulement les valeurs uniques" :

```python
names = ["amina", "youssef", "amina", "sara"]
unique_names = list(set(names))   # l'ordre n'est pas garanti identique à l'original
```

### Imbriquer des collections

Les collections peuvent contenir d'autres collections — une liste de dictionnaires, un dictionnaire de listes, et ainsi de suite — c'est ainsi que l'on représente des données véritablement structurées, comme plusieurs étudiants ayant chacun plusieurs notes :

```python
students = [
    {"name": "Amina", "scores": [88, 92, 79]},
    {"name": "Youssef", "scores": [74, 68, 81]},
]

for student in students:
    average = sum(student["scores"]) / len(student["scores"])
    print(student["name"], round(average, 1))
```

Cette forme précise — une liste de dictionnaires, un dictionnaire par enregistrement — est très proche de ce que vous obtiendrez en lisant un fichier CSV en Semaine 5, et constitue essentiellement une version miniature et construite à la main de ce que représente un `DataFrame` pandas dans la Section 2.

## ⚠️ Pièges courants

- **Confondre `.sort()` et `sorted()`.** `scores.sort()` modifie la liste et renvoie `None` — `x = scores.sort()` laisse donc `x` à `None`, une source de confusion fréquente. Utilisez `sorted(scores)` si vous avez besoin du résultat comme valeur.
- **Modifier une liste en la parcourant.** Supprimer des éléments d'une liste à l'intérieur d'une boucle `for item in my_list:` saute des éléments, car les indices se décalent sous vos pieds en cours d'itération. Parcourez une copie (`for item in my_list[:]:`) ou construisez une nouvelle liste à la place.
- **Oublier que les clés d'un `dict` doivent être immuables.** `grid[[0, 0]] = "x"` lève une `TypeError: unhashable type: 'list'` — utilisez plutôt un tuple `(0, 0)`.
- **Supposer que `set`/`dict` préservent l'ordre d'insertion comme on pourrait s'y attendre en mathématiques.** Les dictionnaires Python modernes *préservent* effectivement l'ordre d'insertion, comme détail d'implémentation, mais les ensembles ne garantissent aucun ordre particulier — ne comptez jamais sur l'ordre que vous obtenez d'un `set`.

## 🧩 Défis

<Challenge id="python101-normal-w3-c1" answer={<>[grade for grade in grades if grade &gt;= 60] — une compréhension de liste filtrant avec une condition, la forme code de {'{'}g ∈ grades : g ≥ 60{'}'}.</>}>

Étant donné `grades = [55, 72, 88, 40, 91, 60]`, écrivez une compréhension de liste sur une seule ligne produisant uniquement les notes admises (≥ 60).

</Challenge>

<Challenge id="python101-normal-w3-c2" answer={<>Parcourez les mots, et pour chacun exécutez <code>counts[word] = counts.get(word, 0) + 1</code> — c'est une table de fréquences, la même structure sur laquelle s'appuie le parcours Difficile en Semaine 2.</>}>

Étant donné une liste de mots, construisez un `dict` associant chaque mot unique au nombre de fois où il apparaît (un "comptage de fréquence des mots").

</Challenge>

<Challenge id="python101-normal-w3-c3" answer={<>Convertissez les deux listes en ensembles et utilisez la différence d'ensembles : <code>set(roster_a) - set(roster_b)</code> donne les étudiants dans A mais pas dans B.</>}>

Vous avez deux listes de noms d'étudiants, `roster_a` et `roster_b`. Trouvez les étudiants qui sont dans `roster_a` mais *pas* dans `roster_b`, sans écrire de boucle manuelle.

</Challenge>

<Challenge id="python101-normal-w3-c4" answer={<>Les tuples sont le bon choix : une paire de coordonnées ne devrait pas être modifiée en place, et sa forme fixe à deux éléments correspond mieux à la nature de forme fixe d'un tuple qu'à une list, qui sous-entend "une séquence extensible".</>}>

Stockeriez-vous une coordonnée 2D `(x, y)` sous forme de `list` ou de `tuple` ? Justifiez votre choix en vous appuyant sur ce qui distingue chaque type.

</Challenge>

<Challenge id="python101-normal-w3-c5" answer={<>{"{name: len(name) for name in ['Amina', 'Karim', 'Sara']}"} — une compréhension de dictionnaire associant chaque nom à sa propre longueur, par exemple {"{'Amina': 5, 'Karim': 5, 'Sara': 4}"}.</>}>

Étant donné une liste de noms, écrivez une compréhension de dictionnaire associant chaque nom à la longueur de ce nom.

</Challenge>

<Challenge id="python101-normal-w3-c6" answer={<>Parcourez la liste de dictionnaires d'étudiants, et pour chacun calculez <code>sum(student["scores"]) / len(student["scores"])</code>, puis utilisez <code>max(...)</code> avec une fonction <code>key</code> (ou suivez manuellement le meilleur résultat courant) pour trouver l'étudiant dont la moyenne est la plus élevée.</>}>

En utilisant la liste de dictionnaires `students` de l'exemple travaillé, trouvez le nom de l'étudiant ayant la moyenne *la plus élevée*, sans coder en dur lequel c'est.

</Challenge>

## 🤔 Questions socratiques

- `list1 = [1, 2, 3]; list2 = list1; list2.append(4)`. Que vaut `list1` maintenant ? Pourquoi cela diffère-t-il de ce que vous pourriez attendre de la discussion de la Semaine 1 sur "les noms pointent vers des valeurs" avec de simples nombres ?
- Pourquoi une `list` ne peut-elle pas être utilisée comme clé de dictionnaire, alors qu'un `tuple` le peut ? Quelle propriété un `dict` exige-t-il réellement de la clé ?
- `{1, 2, 2, 3}` — que donne cette évaluation, et pourquoi cela fait-il d'un `set` un outil naturel pour "supprimer les doublons de cette liste" ?
- Une `list` de `dict` (comme `students` ci-dessus) et un `dict` de `list` (par ex. `{"Amina": [88, 92, 79], "Youssef": [74, 68, 81]}`) peuvent représenter une information très similaire. Quelle est une question à laquelle vous pourriez répondre facilement avec une forme mais maladroitement avec l'autre ?
- Les chaînes de caractères sont immuables mais les listes sont modifiables, alors que les deux prennent en charge l'indexation et le découpage de la même manière. Quelle différence pratique cela fait-il la première fois que vous essayez de "modifier" une chaîne en place plutôt qu'une liste ?

## ✅ Quiz hebdomadaire

<WeeklyQuiz
  weekId="python-101-normal-week-3"
  questions={[
    {
      id: 'q1',
      prompt: 'Que renvoie scores[1:3] pour scores = [10, 20, 30, 40, 50] ?',
      options: ['[10, 20]', '[20, 30]', '[20, 30, 40]', '[10, 20, 30]'],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Quel type de collection ne peut pas contenir de valeurs dupliquées ?',
      options: ['list', 'tuple', 'set', 'dict values'],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: "Quelle est la manière la plus sûre de rechercher une clé qui pourrait ne pas exister dans un dict ?",
      options: ['d[key]', 'd.get(key, default)', 'd.find(key)', 'key in d[...]'],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'Quel type est immuable (ne peut pas être modifié après sa création) ?',
      options: ['list', 'dict', 'set', 'tuple'],
      correctOptionIndex: 3,
    },
    {
      id: 'q5',
      prompt: 'Que renvoie scores.sort() ?',
      options: ['La liste triée', 'None (elle trie en place)', 'Une nouvelle liste triée, l\'originale inchangée', 'Le nombre d\'éléments triés'],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-normal-week-3" />
