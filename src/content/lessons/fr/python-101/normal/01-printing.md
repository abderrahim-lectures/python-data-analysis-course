---
title: "Impression et sortie"
description: "Affichez des résultats avec print(), formatez le texte avec les f-strings et contrôlez ce qui apparaît à l'écran."
module: "python-basics"
order: 1
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Utiliser print() pour afficher des valeurs et des messages"
  - "Formater la sortie avec les f-strings et les spécificateurs de format"
  - "Combiner plusieurs valeurs dans un seul appel à print()"
prerequisites: []
tags: ["sortie", "print", "f-strings", "formatage"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Une réponse enfermée dans la machine

Essayez de calculer

$$
\frac{17 \cdot 3 + 4^2}{5}.
$$

À la main, vous écririez les étapes et la réponse sur le papier :

$$
17 \cdot 3 + 4^2 = 51 + 16 = 67, \qquad \frac{67}{5} = 13{,}4.
$$

Obtenir la réponse n'est que la moitié d'un problème — l'autre moitié consiste à **la communiquer**. Confiez maintenant cette même expression à un ordinateur. Il calcule $13{,}4$ en un clin d'œil — puis oublie aussitôt de vous le dire. La valeur demeure silencieusement enfermée dans la machine, et à moins que vous n'exigiez qu'elle en sorte, vous ne la verrez jamais.

Ce calcul invisible est le problème fondamental que cette leçon résout. Un programme a besoin d'une façon d'*écrire ses résultats là où un être humain peut les lire* — en Python, cette instruction s'appelle `print()`.

## `print()` — révéler une valeur

`print()` prend une valeur et l'envoie à l'écran. N'importe quelle valeur convient : Python la convertit d'abord en texte.

```python
print(13.4)        # 13.4
print(42)          # 42
print("hello")     # hello
```

Inutile d'imprimer un nombre fini — `print()` accepte n'importe quelle expression et l'évalue d'abord :

```python
print((17 * 3 + 4**2) / 5)    # 13.4
```

Le schéma à retenir : **calculez quelque chose, puis confiez-le à `print()`. Une valeur n'a aucun moyen de sortir d'un programme par elle-même ; l'impression est la sortie.**

## Un nombre, et son étiquette

Un nombre nu a rarement du sens. Sur le papier, vous n'écririez pas $13{,}4$ tout seul — vous écririez « Score : 13,4 ». Donnez plusieurs arguments à `print()` et il insère un espace entre eux :

```python
print("Score:", 87)    # Score: 87
```

Le premier argument est l'étiquette ; le second, la valeur. Vous pouvez en empiler autant que vous voulez, et `print()` les sépare pour vous.

## Afficher exactement les chiffres que vous voulez

C'est là que les difficultés commencent : la valeur

$$
\pi = 3.14159\ldots
$$

porte tous ses chiffres avec elle en permanence. Mais un tableau a besoin de $\pi \approx 3.14$, une ligne météo de `23.8°C`, pas de `23.7891°C`. Le nombre de chiffres affichés est *un choix de présentation* du nombre — il ne doit pas modifier la valeur stockée, sinon vous perdez la précision pour toujours.

L'arrondi doit donc vivre dans l'impression, pas dans le calcul. Une **f-string** vous permet de décider au moment d'imprimer : écrivez `f"..."`, placez l'expression entre `{...}` et ajoutez un spécificateur de format après les deux points :

```python
price = 19.999
print(f"Total: ${price:.2f}")        # Total: $20.00   (affiché arrondi)
print(price)                          # 19.999          (valeur intacte)
print(f"Double: {price * 2}")         # 39.998          (toute expression fonctionne)
```

Il vaut la peine de disséquer ce qui se passe dans `{price:.2f}` :

- `{price}` signifie *mets la valeur ici* — la f-string fait la conversion en texte pour vous.
- `:.2f` signifie *affiche-la en virgule fixe avec 2 chiffres après la décimale* — l'arrondi ne se produit que dans la forme affichée.

Les spécificateurs font plus qu'arrondir : ils alignent aussi. Une colonne de `7.5`, `8.5`, `87.5` paraît irrégulière ; donnez à chaque entrée la même largeur et la colonne s'aligne :

```python
print(f"{7.5:>6}")     # "    7.5"   aligné à droite sur une largeur de 6
print(f"{87.5:>6}")    # "   87.5"
```

## Un exemple travaillé : la colonne des prix

Un reçu de magasin veut les étiquettes à gauche et les nombres alignés sur leurs décimales. Deux directions de format font les deux choses :

```python
print(f"{'item':<10}{'price':>7}")
print(f"{'coffee':<10}{3.5:>7.2f}")
print(f"{'croissant':<10}{2.95:>7.2f}")

# item       price
# coffee      3.50
# croissant   2.95
```

`<10` aligne l'étiquette à gauche sur dix colonnes ; `>7.2f` aligne le nombre à droite sur sept, en gardant deux décimales. L'alignement n'est que du format dans l'autre direction — le même `{valeur:spécification}` que vous connaissez déjà, la flèche disant de quel côté penche le texte. C'est la graine de tout tableau que le cours construira : étiquettes d'un côté, nombres de l'autre.

## Pièges courants

- **`print()` n'a pas de valeur de retour.** `print("hi")` affiche du texte mais vaut `None` — vous ne pouvez pas récupérer ce qu'il imprime dans une variable. L'impression est la *fin* d'une opération, jamais une étape à l'intérieur.
- **Mélanger les types avec `+`.** `print("Score: " + 87)` lève une `TypeError`, car une chaîne et un nombre ne peuvent pas être additionnés. Les f-strings existent précisément pour associer une étiquette à une valeur : `print(f"Score: {87}")`.
- **Une `{` littérale dans un f-string demande `{{`.** `f"{{x}}"` affiche `{x}` ; une `{` seule se lit comme le début d'une expression. Doubler est l'échappatoire.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Calculez $\dfrac{2^5 + 9}{5}$ sur le papier, puis imprimez-la *sans* taper vous-même la réponse — laissez l'ordinateur calculer et imprimer en une seule étape.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>print((2**5 + 9) / 5)</code> → <code>8.2</code>. Une seule expression, confiée directement à <code>print()</code> : la machine l'évalue et écrit le résultat.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Avec `temperature = 23.7891`, imprimez `"Today: 23.8°C"` (une décimale) sans toucher à la valeur stockée.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>print(f"Today: {temperature:.1f}°C")</code> → <code>Today: 23.8°C</code>. Le spécificateur <code>:.1f</code> arrondit <em>uniquement à l'affichage</em> ; <code>temperature</code> reste égal à <code>23.7891</code>.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi Python utilise-t-il `print()` comme fonction (avec des parenthèses) plutôt que comme instruction ? Quel avantage cela vous donne-t-il ?
- `print("A", "B", "C")` affiche `A B C` avec des espaces. Comment les imprimer sans espace ? Avec des virgules entre eux ?
- Si `x = 3.14`, que produit `f"{x}"` ? Et `f"{x:.0f}"` ? Expliquez la différence en termes de valeur et de représentation.

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-printing">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Votre formule est calculée, mais le programme n'affiche rien. Pourquoi ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">La valeur a été mal calculée.</button>
      <button class="quiz-q__opt" data-idx="1">Le résultat n'a jamais été confié à print().</button>
      <button class="quiz-q__opt" data-idx="2">Python jette les valeurs dont il n'a plus besoin.</button>
      <button class="quiz-q__opt" data-idx="3">print() exige au moins deux arguments.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Comment imprimer 3.14159 en affichant deux décimales, sans arrondir la valeur stockée ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">f"{x:2f}"</button>
      <button class="quiz-q__opt" data-idx="1">f"{x:.2f}"</button>
      <button class="quiz-q__opt" data-idx="2">f"{x:.2d}"</button>
      <button class="quiz-q__opt" data-idx="3">print(x, 2)</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>