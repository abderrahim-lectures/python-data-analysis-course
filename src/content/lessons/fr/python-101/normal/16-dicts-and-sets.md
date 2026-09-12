---
title: "Dicts et sets"
description: "Mappez des clés vers des valeurs avec les dicts et stockez des éléments uniques avec les sets."
module: "data-structures"
order: 16
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Créer et accéder à des dictionnaires avec [] et .get()"
  - "Itérer sur les clés, les valeurs et les éléments des dicts"
  - "Utiliser les opérations d'ensemble : union, intersection, différence"
  - "Comprendre les exigences de hachage des dicts et des sets"
prerequisites: ["15-lists-and-tuples"]
tags: ["dict", "set", "clés", "valeurs", "items", "union", "intersection"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## La correspondance

Les mathématiciens appellent *fonction* une table qui associe à chaque entrée une unique sortie ; Python l'appelle un **dict**. Les clés pointent vers des valeurs, exactement comme un dictionnaire de mots pointe vers leurs définitions :

```python
scores = {"Alice": 85, "Bob": 92, "Charlie": 78}
print(scores["Alice"])       # 85
print(scores.get("Dave", 0)) # 0 (défaut si la clé manque)
```

Indexer avec `[]` est la recherche impatiente : elle exige que la clé existe. `.get(clé, défaut)` est la variante courtoise : si la clé manque, renvoyez le plan B au lieu de lever `KeyError`. La distinction est la différence entre une revendication et une question.

## La boîte à outils du dict

```python
scores = {"Alice": 85, "Bob": 92}

scores.keys()         # dict_keys(['Alice', 'Bob'])
scores.values()       # dict_values([85, 92])
scores.items()        # dict_items([('Alice', 85), ('Bob', 92)])

scores["Dave"] = 78   # ajoute une nouvelle paire
del scores["Bob"]     # supprime par clé
scores.pop("Alice")   # supprime et renvoie la valeur

scores.update({"Eve": 95, "Frank": 88})  # fusionne
scores.setdefault("Grace", 0)  # n'assigne que si la clé manque
```

`keys`, `values` et `items` sont trois vues de la même relation, le domaine, l'image et le graphe. `update` fusionne un second dict ; `setdefault` n'écrit que lorsque la clé est absente, l'affectation conditionnelle qui n'a pas besoin de `if`.

## Marcher sur la correspondance

L'itération sur un dict parcourt le domaine par défaut ; pour voir les deux moitiés, demandez `items` :

```python
for name in scores:           # clés
    print(name)

for name, score in scores.items():  # paires clé-valeur
    print(f"{name}: {score}")
```

`items` vous tend la paire directement, sans indexation manuelle, car déballer une entrée en `name, score` est la lecture naturelle d'une ligne.

## Sets : l'ensemble mathématique

Un **set** est un ensemble au sens mathématique : une collection sans ordre et sans doublons. La répétition se dissout à l'entrée :

```python
colors = {"red", "blue", "green", "red"}
print(colors)  # {'red', 'blue', 'green'}  (doublons supprimés)
```

L'unicité est appliquée structurellement, il n'y a pas de seconde copie attendant de polluer un test d'appartenance. L'appartenance à un set est exactement $x \in S$ : un élément est dedans ou dehors, sans degrés intermédiaires.

## Opérations d'ensemble

L'algèbre des ensembles est épelée directement. Avec $A = \{1, 2, 3, 4\}$ et $B = \{3, 4, 5, 6\}$ :

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

a | b    # {1, 2, 3, 4, 5, 6}  (union)
a & b    # {3, 4}              (intersection)
a - b    # {1, 2}              (différence)
a ^ b    # {1, 2, 5, 6}       (différence symétrique)
```

$$
A \cup B = \{1, 2, 3, 4, 5, 6\}, \quad A \cap B = \{3, 4\}, \quad A \setminus B = \{1, 2\}, \quad A \mathbin{\triangle} B = \{1, 2, 5, 6\}.
$$

Les opérateurs sont la notation que vous connaissez déjà. Et là où la théorie promet la vitesse, l'implémentation tient parole : tester l'appartenance à un set s'exécute en $O(1)$ contre les $O(n)$ d'une liste, car un set stocke les éléments par une empreinte calculée, non par position.

## L'exigence de hachage

Les empreintes exigent la stabilité. Les clés de dict et les éléments de set doivent être **hashables**, en pratique, immuables, pour que leurs calculs restent reproductibles. Les chaînes, les nombres et les tuples passent ; les listes et les autres dicts non :

```python
{[1, 2]: "bad"}   # TypeError: unhashable type: 'list'
{(1, 2): "good"}  # Fonctionne — le tuple est hashable
```

Une liste ne pourrait pas être une clé fiable même si on le permettait : son hash changerait l'instant où son contenu changerait, transformant la correspondance en champ de mines de recherches périmées.

## Un exemple travaillé : le carnet de notes

La relation, le domaine et l'image, un seul tableau parcouru en trois postures :

```python
scores = {"Alice": 85, "Bob": 92, "Charlie": 78}

for name, score in scores.items():
    print(f"{name}: {score}")

print(scores.get("Dave", "absent"))   # absent — pas de KeyError

roles = {"student", "teacher", "admin"}
print("student" in roles)             # True — appartenance O(1)
```

`items` parcourt le graphe entier, `.get` questionne avec courtoisie quand vous ignorez si la clé existe, et le `in` sur un ensemble est l'appartenance $x \in S$, trois questions que les structures de la leçon répondent directement.

## Pièges courants

- **Accéder à des clés absentes.** `.get()` ou une vérification avec `in` vous épargne un `KeyError`.
- **Se fier à l'ordre du dict.** Python 3.7+ conserve l'ordre d'insertion, mais traitez-le comme une commodité, non comme un contrat.
- **Se fier à l'ordre d'un set.** Un set ne garde aucun ordre ; ne faites jamais de l'ordre d'itération une dépendance.
- **`{}` est un dict vide ; `set()` est l'ensemble vide.** `{}` n'est pas un ensemble. Écrivez `set()` pour le vide et `{"a", "b"}` pour un littéral, un symbole, deux sens.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Comptez la fréquence de chaque caractère de `"hello world"` avec un dict.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>freq = {}; for c in "hello world": freq[c] = freq.get(c, 0) + 1</code>, le repli de <code>.get</code> sur $0$ transforme la première apparition en incrément depuis zéro.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Étant donné deux listes, trouvez les éléments présents dans les deux à l'aide de sets.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>set(a) & set(b)</code> ou <code>set(a).intersection(b)</code>, l'intersection est $A \cap B$, et la machinerie des ensembles fait le travail.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi une liste ne peut-elle pas servir de clé de dict ? Quelle propriété une clé doit-elle porter ?
- Quand un set bat-il une liste, que perdez-vous et que gagnez-vous ?
- En quoi `dict.get(clé, défaut)` diffère-t-il de `dict[clé]`, et quand préférez-vous l'un ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-dicts-sets">
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">1. Que renvoie <code>{"a": 1, "b": 2}.get("c", 0)</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0</button>
      <button class="quiz-q__opt" data-idx="1">None</button>
      <button class="quiz-q__opt" data-idx="2">KeyError</button>
      <button class="quiz-q__opt" data-idx="3">'c'</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Que vaut <code>{1, 2, 3} ^ {2, 3, 4}</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">{2, 3}</button>
      <button class="quiz-q__opt" data-idx="1">{1, 4}</button>
      <button class="quiz-q__opt" data-idx="2">{1, 2, 3, 4}</button>
      <button class="quiz-q__opt" data-idx="3">{1, 2, 3}</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>