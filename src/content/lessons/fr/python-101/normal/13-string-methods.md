---
title: "Méthodes de chaînes"
description: "Divisez, joignez, remplacez et transformez du texte avec la boîte à outils de chaînes de Python."
module: "strings"
order: 13
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Utiliser split() et join() pour convertir entre chaînes et listes"
  - "Appliquer strip(), replace(), find(), startswith(), endswith()"
  - "Formater des chaînes avec la syntaxe f-string avancée"
  - "Comprendre l'immuabilité — les méthodes de chaîne renvoient de nouvelles chaînes"
prerequisites: ["12-scope-and-lambdas"]
tags: ["chaînes", "méthodes", "split", "join", "strip", "replace"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## La chaîne immuable

Une chaîne est finie à l'instant où elle est créée. Chaque méthode qui semble la modifier renvoie en réalité une **nouvelle** chaîne, laissant l'originale intacte :

```python
name = "alice"
upper = name.upper()
print(name)    # alice  (inchangée)
print(upper)   # ALICE
```

Mérite d'être intériorisé comme une loi : les méthodes de chaîne ne mutent jamais ; elles remettent des copies fraîchement construites. Une fois que vous attendez de nouvelles chaînes, la boîte à outils devient prévisible — et l'occasionnelle boucle `while` qui semble ne rien faire s'effondre en une réassignation.

## Décomposer et regrouper

Les deux opérations les plus transportables sont des inverses exactes. Décomposer scinde une chaîne sur un délimiteur ; regrouper recolle une séquence avec un délimiteur :

```python
sentence = "hello world python"
words = sentence.split()       # ['hello', 'world', 'python']
back = " ".join(words)         # 'hello world python'

csv_line = "apple,banana,cherry"
fruits = csv_line.split(",")   # ['apple', 'banana', 'cherry']
```

Écrites comme des équations, elles se défont mutuellement :

$$
\text{split}(s, \text{sep}) = [w_1, w_2, \ldots, w_n] \qquad \text{join}(\text{sep}, [w_1, \ldots, w_n]) = w_1 + \text{sep} + w_2 + \cdots + w_n.
$$

Notez l'asymétrie : `split()` sans argument scinde sur des paquets d'espaces — plusieurs espaces s'écroulent —, tandis qu'un espace est votre délimiteur dans `" ".join(words)`. Le délimiteur de join est ce que vous voulez *entre* les morceaux ; d'où `","`, et non `""`.

## Chercher et tester

```python
text = "Hello, World!"

text.startswith("Hello")   # True
text.endswith("!")         # True
text.find("World")         # 7  (indice de la première correspondance, -1 si absente)
text.count("l")            # 3
text.replace("World", "Python")  # 'Hello, Python!'
```

`startswith` et `endswith` sont des questions oui/non sur les bords de la chaîne — des gardes bon marché qui remplacent les tranches. `find` répond *où*, renvoyant l'indice où commence la sous-chaîne, ou $-1$ quand la recherche échoue. `count` dénombre les occurrences sans chevauchement ; `replace` échange chaque correspondance contre un substitut.

## Casse et espaces

```python
"hello".upper()        # 'HELLO'
"HELLO".lower()        # 'hello'
"  hi  ".strip()       # 'hi'  (retire les espaces de tête et de fin)
"  hi  ".lstrip()      # 'hi ' (à gauche seulement)
"  hi  ".rstrip()      # '  hi' (à droite seulement)
"hello world".title()  # 'Hello World'
```

`strip` coupe le rembourrage que la pollution ajoute — les espaces égarés autour d'un texte collé. `title` met en majuscule la première lettre de chaque mot, le déguisement suburbain de la négligence de saisie. Chacune est une transformation à un seul but, qu'on rejoint par son nom plutôt que par mémorisation.

## Formatage avancé des f-strings

La f-string est une fonction de mise en page : des colonnes déclaratives et une précision. Alignement avec une largeur, et formatage des nombres avec une spécification :

```python
price = 19.999
name = "Widget"

# Largeur et alignement
print(f"|{name:<15}|")   # |Widget          |  (alignement gauche, largeur 15)
print(f"|{name:>15}|")   # |          Widget|  (alignement droit)
print(f"|{name:^15}|")   # |     Widget     |  (centrage)

# Formatage des nombres
print(f"{price:.2f}")     # 20.00
print(f"{42:05d}")        # 00042  (rembourrage par zéros)
print(f"{0.857:.1%}")     # 85.7%  (pourcentage)
```

La spécification `%` est une petite multiplication par $100$ avec un signe : $\{0.857 \mapsto 85.7\%\}$. `.2f` arrondit à deux décimales à l'affichage pendant que le nombre sous-jacent reste entier. L'alignement transforme une colonne irrégulière de valeurs en une table nommée — de la présentation sans arithmétique dans le corps.

## Un exemple travaillé : nettoyer la ligne collée

Les outils s'assemblent en un circuit pour la saisie la plus sale du monde réel — une ligne collée depuis un tableau :

```python
raw = "  apple, banana, cherry  "
cleaned = raw.strip()
fruits = cleaned.split(", ")
print(fruits)          # ['apple', 'banana', 'cherry']
back = ", ".join(fruits)
print(back)            # 'apple, banana, cherry'
```

Trois gestes, un circuit : `strip` pèle le rembourrage apporté par le collage, `split` découpe en morceaux, `join` recolle avec le séparateur choisi. La paire inverse `split`/`join` est le pont entre texte et liste — la même relation que l'équation de l'ouverture.

## Pièges courants

- **Oublier ce qu'est `split()` sans argument.** Il scinde sur des paquets d'espaces ; lui demander de scinder sur la chaîne vide n'est pas un choix qu'il offre.
- **Attendre que `find()` lève une erreur sur une sous-chaîne absente.** Il renvoie $-1$. Vérifiez avant de trancher dessus.
- **Tenter de modifier une chaîne en place.** Il n'existe pas d'édition en place ; réassignez le résultat.
- **`join` se tient sur le séparateur, `split` sur la chaîne.** `" ".join(words)`, pas `words.join(" ")` — le séparateur possède la méthode, et oublier qui fait quoi donne une `AttributeError`.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Écrivez `title_case(s)` qui met en majuscule la première lettre de chaque mot : `title_case("hello world")` → `"Hello World"`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>return s.title()</code> — la méthode intégrée de Python fait exactement cela ; parfois une ligne est toute la solution.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Étant donné `"one,two,,three"`, scindez sur les virgules et retirez les chaînes vides.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>[x for x in s.split(",") if x]</code> ou <code>list(filter(None, s.split(",")))</code> — la chaîne vide est falsy, donc le filtre de véracité l'élimine sans vérifier la longueur.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi `find()` renvoie-t-il $-1$ au lieu de lever une erreur ? Que coûte chaque choix ?
- Comment inversez-vous une chaîne ? Existe-t-il une méthode pour cela, ou la réponse vit-elle ailleurs ?
- Quand `str.replace()` est-elle le mauvais outil — qu'est-ce qui convient à une substitution plus délicate ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-string-methods">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Que renvoie <code>"a,b,c".split(",")</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">['abc']</button>
      <button class="quiz-q__opt" data-idx="1">['a', 'b', 'c']</button>
      <button class="quiz-q__opt" data-idx="2">'abc'</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Que renvoie <code>"hello".find("xyz")</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0</button>
      <button class="quiz-q__opt" data-idx="1">None</button>
      <button class="quiz-q__opt" data-idx="2">-1</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>