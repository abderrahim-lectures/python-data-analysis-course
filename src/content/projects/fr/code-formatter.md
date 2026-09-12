---
title: "Formatteur de Code"
description: "Formatteur de code qui impose un style cohérent avec zéro configuration."
difficulty: "beginner"
estimatedMinutes: 60
xpReward: 100
tags: ["Developer Tools", "CLI Tools", "Utility"]
prerequisites:
  - "Lire et écrire des fichiers texte"
  - "Méthodes de chaînes : partition, rstrip, lstrip, join"
  - "Exécuter des scripts depuis le terminal avec des arguments"
learningObjectives:
  - "Inspecter un fichier source ligne par ligne et repérer ses zones « sales »"
  - "Appliquer des normalisations sûres d'espacement et de commentaires avec de pures méthodes de chaînes"
  - "Réduire les suites de lignes vides et imposer un saut de ligne final"
  - "Diagnostiquer une indentation qui n'est pas un multiple de 4"
  - "Rapporter des statistiques avant/après et envelopper l'outil dans un CLI sys.argv"
---

# 🛠️ 🧹 Construire un Formatteur de Code

Le vrai code arrive en désordre : des espaces de fin en bout de ligne, des `#comment` sans espace, deux lignes vides là où une seule convient, et une indentation qui a sauté la règle des 4 espaces. Ce projet construit un **formatteur de code**, un petit outil de terminal qui lit un fichier Python, n'applique que des normalisations *sûres* d'espacement et de commentaires, réduit les suites de lignes vides, vérifie l'indentation, affiche un rapport de ce qui a changé exactement, et écrit la copie nettoyée dans `formatted.py`. Il se limite délibérément à l'espacement et à l'espacement des commentaires (il ne renomme ni ne réordonne jamais le code), donc l'exécuter ne peut pas casser le programme. Bibliothèque standard pure, déterministe, et il devient une vraie commande : `python3 code_formatter.py messy.py`.

Cela suppose que tu sais lire et écrire des fichiers et utiliser les méthodes de chaînes de base. C'est un projet optionnel et non noté, vois [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Lire un échantillon volontairement sale et afficher ses « marques de saleté ».
2. Retirer les espaces de fin et normaliser `#comment` → `# comment`.
3. Réduire les suites de lignes vides et imposer un saut de ligne final.
4. Vérifier l'indentation en pas de 4 espaces et afficher des avertissements.
5. Le brancher comme `code_formatter.py <fichier>` avec un rapport avant/après.

## Où exécuter ceci

**En local** est le cadre naturel, l'outil tape sur un fichier de ton propre dossier.

```bash
mkdir code-formatter && cd code-formatter
touch code_formatter.py
```

**Google Colab, Kaggle Notebooks et Binder** exécutent aussi chaque bloc ; dans un notebook tu appellerais les fonctions directement (`format_source(...)`) au lieu du chemin sys.argv. Les constantes sont identiques partout.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/code-formatter/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/code-formatter/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcode-formatter%2Fnotebook.fr.ipynb)

## Configuration

Zéro dépendance ; un seul fichier source à attaquer.

### Crée l'échantillon volontairement sale

```bash
mkdir code-formatter && cd code-formatter
touch code_formatter.py
```

Copie ce fichier comme `messy.py`. Les espaces de fin existent exprès, ne laisse pas ton éditeur les supprimer avant l'expérience :

```python
#sum module
def add(a,b):  #add two numbers
    """Add a and b."""

        return a + b   

def greet(name):
  msg = "hello " + name
   return msg   #too much indent
```

**✅ Liste de vérification**

- ✅ `messy.py` a **10 lignes**, et les espaces de fin après `#sum module`, `#add two numbers` et `return a + b` sont encore visibles dans un éditeur de texte.
- ✅ `python3 code_formatter.py` s'exécute et n'affiche encore rien (c'est un fichier vide).

**🤔 Question(s) socratique(s)**

- Certaines transformations sont *sûres* (retirer les espaces de fin ne change jamais ce que fait un programme) et d'autres non (réordonner le code). Pourquoi « sûr uniquement » est-il un bon premier formatteur, et que casserait un fichier plein de commentaires *entre* les fonctions si tu réordonnais les lignes ?
- La ligne `   return msg   #too much indent` de l'échantillon est coupable de trois crimes à la fois. Avant d'écrire du code, nomme-les tous les trois de mémoire.

## Étape 1 : Lis et inspecte le fichier

Il faut d'abord *voir* le désordre. L'Étape 1 lit `messy.py` et rapporte là où il est sale.

### 1.1 Lis toutes les lignes

**👟 Indice de départ :** `open(...).read().splitlines()`, les lignes sans le `\n` final, donc chaque entrée est du contenu pur.

```python
# code_formatter.py
import sys

def read_lines(path):
    with open(path) as f:
        return f.read().splitlines()

lines = read_lines("messy.py")
print("lines:", len(lines))
for i, ln in enumerate(lines, 1):
    print(f"{i:>2} |{ln}|")
```

`splitlines()` garde le *contenu* de chaque ligne mais abandonne le saut de ligne, donc le rapport peut montrer les caractères exacts d'une ligne, les espaces de fin deviennent visibles dans les enveloppes `|…|`. Les barres `|` comptent : elles rendent l'espace blanc invisible lisible.

**🎯 Résultat attendu :**

```
lines: 10
 1 |#sum module   |
 2 |def add(a,b):  #add two numbers   |
 3 |    """Add a and b."""|
 4 ||
 5 |        return a + b   |
 6 ||
 7 |   |
 8 |def greet(name):|
 9 |  msg = "hello " + name|
10 |   return msg   #too much indent|
```

**🩹 Si ça ne marche pas :** Si la ligne 1 affiche `#sum module` sans espaces de fin, ton éditeur les a auto-supprimés, recrée `messy.py` avec un simple `echo`/collage. Si la ligne 7 n'affiche rien dans `|   |`, la ligne uniquement composée d'espaces a survécu, bien.

### 1.2 Trouve les marques de saleté

**👟 Indice de départ :** Trois scans : espaces de fin, commentaires collés au texte, et indentation non multiple de 4.

```python
# code_formatter.py (continued)
trailing = [i for i, ln in enumerate(lines, 1) if ln != ln.rstrip()]
print("trailing whitespace on:", trailing)

comment_lines = [i for i, ln in enumerate(lines, 1)
                 if "#" in ln and not ln.lstrip().startswith("#!")]
print("comment lines:", comment_lines)

indent_bad = []
for i, ln in enumerate(lines, 1):
    body = ln.lstrip(" ")
    if body and not body.startswith("#"):
        lead = len(ln) - len(ln.lstrip(" "))
        if lead % 4 != 0:
            indent_bad.append((i, lead))
print("indent warnings:", indent_bad)
```

`ln != ln.rstrip()` est le test d'espace de fin, `rstrip` retire les espaces *uniquement* de la fin, donc toute différence est du superflu en fin de ligne. L'indentation se mesure en *comptant* les espaces de tête : le `lstrip(" ")` donne le corps, et `len(ln) - len(body)` est l'avance, signalée quand elle n'est pas un multiple de 4.

**🎯 Résultat attendu :**

```
trailing whitespace on: [1, 2, 5, 7]
comment lines: [1, 2, 10]
indent warnings: [(9, 2), (10, 3)]
```

**🩹 Si ça ne marche pas :** Si une des listes d'espaces de fin a des indices différents, ta copie de `messy.py` a perdu ses espaces (vois 1.1). Si `comment lines` affiche des entrées différentes, vérifie le test du `#` dans la ligne contre le fichier réel.

### 1.3 Vérifie

**✅ Liste de vérification**

- ✅ 10 lignes lues ; espaces de fin sur 1, 2, 5, 7 (la ligne 7 ne contient que des espaces).
- ✅ Des commentaires existent sur 1, 2, 10, tous les trois collés au texte sans espace après `#`.
- ✅ Avertissements d'indentation à (9, 2) et (10, 3), émettre un avertissement *sans* réécrire silencieusement garde l'outil honnête.

**🤔 Question(s) socratique(s)**

- La ligne 7 contient trois espaces et rien d'autre. `isspace()` est-il un meilleur détecteur de « vide » que `== ""` ? Où une ligne pleine de tabulations semblerait-elle « vide » sous `== ""` mais pas sous `isspace()` ?
- `indent_bad` ignore les lignes exclusivement composées de commentaires (`startswith("#")`). Pourquoi un *commentaire* à la colonne 3 devrait-il être légal alors qu'une *instruction* à la colonne 3 ne l'est pas ?

## Étape 2 : Coupe et corrige les commentaires

Le nettoyage sûr : retirer les espaces de fin, puis mettre un espace après chaque `#`.

### 2.1 Les normalisateurs par ligne

**👟 Indice de départ :** Un `fix_line` qui fait un `rstrip` puis répare la partie commentaire avec `partition("#")`.

```python
# code_formatter.py (continued)
def fix_line(ln):
    fixed = ln.rstrip()
    if "#" not in fixed or fixed.startswith("#!"):
        return fixed
    pre, _, comment = fixed.partition("#")
    comment = comment.strip()
    if comment == "":
        return pre.rstrip()
    if pre.strip() == "":
        return "# " + comment
    return pre.rstrip() + "  # " + comment
```

La division `partition("#")` garde le côté gauche (le code) séparé du commentaire, donc chaque côté se normalise indépendamment. Commentaire à la colonne 0 → `# sum module` ; commentaire en ligne → code, deux espaces, `# comment`. `#!` (un en-tête de script shebang) est laissé individuellement tranquille, il a sa propre convention.

**🎯 Résultat attendu :** Une fonction, pas encore de sortie, mais raisonne sur ce qu'elle fait à la ligne 10 : `   return msg   #too much indent` → `   return msg  # too much indent`.

### 2.2 Applique-le à tout le fichier

**👟 Indice de départ :** Applique `fix_line` sur toutes les lignes et affiche le résultat.

```python
# code_formatter.py (continued)
fixed = [fix_line(ln) for ln in lines]
for i, ln in enumerate(fixed, 1):
    print(f"{i:>2} |{ln}|")
```

**🎯 Résultat attendu :**

```
 1 |# sum module|
 2 |def add(a,b):  # add two numbers|
 3 |    """Add a and b."""|
 4 ||
 5 |        return a + b|
 6 ||
 7 ||
 8 |def greet(name):|
 9 |  msg = "hello " + name|
10 |   return msg  # too much indent|
```

**🩹 Si ça ne marche pas :** Si la ligne 1 est devenue `  # sum module`, la branche de colonne 0 (`pre.strip() == ""`) n'a pas tourné, vérifie que tu as bien fait le `partition` avant d'inspecter `pre`. Si `#` touche encore le texte, `comment.strip()` a été sauté et l'espace n'a jamais été inséré.

### 2.3 Vérifie

**✅ Liste de vérification**

- ✅ Les espaces de fin ont disparu de 1, 2, 5, 7.
- ✅ `#sum module` → `# sum module` ; `#add two numbers` → `# add two numbers` ; `#too much indent` → `# too much indent`.
- ✅ Le code et le commentaire gardent exactement deux espaces entre eux, le contrat `pre.rstrip() + "  # "`.

**🤔 Question(s) socratique(s)**

- `fix_line` traite le côté *gauche* comme du code. Que se passerait-il avec une *chaîne* Python contenant `#` (`s = "color #ff00aa"`) ? Un formatteur conscient des chaînes vaut-il même la complexité pour un premier outil, et qu'est-ce que cela dit sur la frontière du « sous-ensemble sûr » ?
- `#!` est exclu par un cas spécial. Les commentaires de lignes bash (`#!`, `##`), les docstrings (`"""`) et les chaînes en ligne surchargent tous `#`. Quelle règle empirique unique empêche un formatteur débutant de corrompre des fichiers valides ?

## Étape 3 : Réduis les lignes vides répétées et impose un saut de ligne final

Les lignes uniquement composées d'espaces et les vides répétés sont du bruit de mise en page. L'Étape 3 les resserre.

### 3.1 Une ligne vide à la fois

**👟 Indice de départ :** Parcours les lignes corrigées, en abandonnant toute ligne vide (`""` ou uniquement des espaces) qui suit directement une autre ligne vide.

```python
# code_formatter.py (continued)
def collapse_blanks(lines):
    out = []
    for ln in lines:
        blank = ln.strip() == ""
        if blank and out and out[-1].strip() == "":
            continue
        out.append(ln)
    return out

collapsed = collapse_blanks(fixed)
print("lines after collapse:", len(collapsed))
for i, ln in enumerate(collapsed, 1):
    print(f"{i:>2} |{ln}|")
```

`strip() == ""` appelle une ligne « vide » *que* ce soit une ligne vraiment vide ou une ligne uniquement composée d'espaces (`   `), les deux sont de la mise en page, aucun des deux ne porte de contenu. La garde `out and out[-1].strip() == ""` ne garde que la *première* d'une suite, donc 2+ vides se réduisent à 1 partout en une seule passe.

**🎯 Résultat attendu :**

```
lines after collapse: 9
 1 |# sum module|
 2 |def add(a,b):  # add two numbers|
 3 |    """Add a and b."""|
 4 ||
 5 |        return a + b|
 6 ||
 7 |def greet(name):|
 8 |  msg = "hello " + name|
 9 |   return msg  # too much indent|
```

**🩹 Si ça ne marche pas :** Si la ligne 7 s'affiche encore comme vide, la ligne uniquement composée d'espaces n'a pas été vidée par `strip() == ""`, elle l'a été, sauf si la ligne contient des caractères invisibles non-espaces. Si une *suite de trois* laisse deux vides, la garde a vérifié le `ln` brut au lieu de la dernière ligne ajoutée.

### 3.2 Le saut de ligne final

**👟 Indice de départ :** Rejoins avec `"\n"` et termine toujours le texte par `"\n"`.

```python
# code_formatter.py (continued)
def build_text(lines):
    return "\n".join(lines) + "\n"

text = build_text(collapsed)
print("ends with newline:", text.endswith("\n"))
print("input bytes:", len(open("messy.py").read().encode()),
      "output bytes:", len(text.encode()))
```

La dernière ligne d'un fichier devrait se terminer par un saut de ligne, la convention POSIX, et la chose que `join + "\n"` garantit même quand la source l'a oublié. Les comptes d'octets sont une vérification de santé rapide : le nettoyage *réduit* le fichier (177 → 166 octets) parce que l'espace blanc superflu est de vrais octets.

**🎯 Résultat attendu :**

```
ends with newline: True
input bytes: 177 output bytes: 166
```

**🩹 Si ça ne marche pas :** Si `ends with newline: False`, le `+ "\n"` a atterri avant le `join`. Si les octets de sortie sont *plus grands*, la normalisation des commentaires a ajouté des espaces plus vite que le retrait des fins de ligne ne les enlevait, mesure honnêtement, c'est le verdict de l'outil.

### 3.3 Vérifie

**✅ Liste de vérification**

- ✅ 10 lignes → 9 : la ligne `   ` uniquement composée d'espaces s'est réduite avec la ligne vide au-dessus d'elle.
- ✅ Exactement une ligne vide reste entre les corps de fonctions.
- ✅ `text` se termine par un saut de ligne ; la sortie (166 octets) est plus petite que l'entrée (177).

**🤔 Question(s) socratique(s)**

- `build_text` ajoute un `\n` pour tout le fichier. Pourquoi est-ce le *seul* saut de ligne dont le compte a besoin, et que ferait `"\n".join(lines)` *sans* le saut de ligne final à `splitlines()` à la lecture suivante ?
- La réduction des lignes vides est idempotente (l'exécuter deux fois ne change rien la deuxième fois). Pourquoi l'idempotence est-elle une *bonne propriété* pour un formatteur, et quelle transformation de ce projet *n'est pas* idempotente ?

## Étape 4 : Diagnostic de l'indentation

L'indentation est de la sémantique en Python, donc le formatteur *diagnostique* au lieu de deviner.

### 4.1 Émets des avertissements

**👟 Indice de départ :** Relance le scan de comptage des avances et affiche chaque ligne non multiple de 4 avec son nombre d'espaces actuel.

```python
# code_formatter.py (continued)
print("INDENT WARNINGS")
for i, ln in enumerate(collapsed, 1):
    body = ln.lstrip(" ")
    if body and not body.startswith("#"):
        lead = len(ln) - len(ln.lstrip(" "))
        if lead % 4 != 0:
            print(f"  line {i}: {lead} spaces (should be a multiple of 4)")
```

Le formatteur refuse de *deviner* la correction, `2` espaces sur la ligne 8 et `3` sur la ligne 9 sont ambigus (`2` se place sous le `def`, mais l'outil ne peut pas connaître le contexte), donc il les remonte à l'œil du développeur.

**🎯 Résultat attendu :**

```
INDENT WARNINGS
  line 8: 2 spaces (should be a multiple of 4)
  line 9: 3 spaces (should be a multiple of 4)
```

**🩹 Si ça ne marche pas :** Si les avertissements nomment d'autres lignes, la liste réduite a des positions différentes de `messy.py`, le rapport porte sur le texte *actuel*. Si rien ne s'affiche, `lstrip(" ")` sur une ligne indentée par tabulation cache l'avance (vois le socratique ci-dessous).

### 4.2 Le contrat des tabulations

**👟 Indice de départ :** Convertis toute suite de tabulations existante en blocs de 4 espaces et enregistre si une existait.

```python
# code_formatter.py (continued)
has_tabs = any("\t" in ln for ln in collapsed)
print("tabs found in source:", has_tabs)
```

`\t` est interdit dans l'échantillon (et généralement dans le code source Python d'après PEP 8). La vérification est un seul `any(...)` sur les lignes ; si trouvé, `.expandtabs(4)` les réécrirait, mais comme `messy.py` n'en a pas, la réponse affichée est `False`, et l'histoire des tabulations reste un contrat documenté plutôt qu'une mutation cachée.

**🎯 Résultat attendu :** `tabs found in source: False`

**🩹 Si ça ne marche pas :** Si `True` s'affiche, ta copie a gagné une tabulation quelque part, décide : garde-le diagnostique (rapporte la ligne) ou étends-la avec `.expandtabs(4)`, en remplaçant ensuite la comptabilité d'espaces.

### 4.3 Vérifie

**✅ Liste de vérification**

- ✅ Les avertissements nomment les lignes 8 (2 espaces) et 9 (3 espaces), les deux sont des instructions, pas des commentaires.
- ✅ `tabs found in source: False`.
- ✅ Rien n'a été *écrit* dans cette étape, le diagnostic est en lecture seule par conception.

**🤔 Question(s) socratique(s)**

- Une ligne indentée avec une *tabulation* échoue silencieusement `lstrip(" ")` (son avance est invisible). Quel changement unique fait aussi attraper les tabulations par le diagnostic, et quelle largeur de tabulation (4 vs 8) la règle `% 4` supposerait-elle ?
- `def` est à la colonne 0, son corps à 4, les corps imbriqués à 8. Étant donné ces trois faits, existe-t-il *une* règle non ambiguë pour « corriger » les espaces de tête d'une ligne indentée, ou l'avertissement est-il le bon produit ici ?

## Étape 5 : Sauvegarde le résultat et transforme-le en CLI

L'outil a besoin d'une sortie fichier et d'une porte d'entrée en ligne de commande.

### 5.1 Écris formatted.py

**👟 Indice de départ :** Récris `build_text(...)` via `open(..., "w")` et relis-le pour prouver l'aller-retour.

```python
# code_formatter.py (continued)
with open("formatted.py", "w") as f:
    f.write(text)

again = open("formatted.py").read()
print("formatted.py lines:", len(again.splitlines()))
print("round-trip identical:", again == text)
```

Persister le résultat rend l'outil *utile*, `messy.py` reste le spécimen, `formatted.py` est la copie propre. Relire et comparer `== text` est la même discipline d'aller-retour sans perte que tu utiliserais dans n'importe quel pipeline : écrire, relire, affirmer l'égalité.

**🎯 Résultat attendu :**

```
formatted.py lines: 9
round-trip identical: True
```

**🩹 Si ça ne marche pas :** Si l'aller-retour dit `False`, la gestion du `"\n"` supplémentaire ou des espaces de fin a changé, compare avec `repr(text)` vs `repr(again)`.

### 5.2 Le répartiteur

**👟 Indice de départ :** Lis `sys.argv[1]` comme nom de fichier, formate-le, et affiche le résumé avant/après.

```python
# code_formatter.py (continued)
def format_file(path):
    lines = open(path).read().splitlines()
    fixed = [fix_line(ln) for ln in lines]
    collapsed = collapse_blanks(fixed)
    text = build_text(collapsed)
    with open("formatted.py", "w") as f:
        f.write(text)
    trailing = [i for i, ln in enumerate(lines, 1) if ln != ln.rstrip()]
    print(f"{path}: {len(lines)} -> {len(collapsed)} lines; "
          f"{len(trailing)} trailing-whitespace fixes; "
          f"see formatted.py")

if __name__ == "__main__":
    format_file(sys.argv[1])
```

Tout le pipeline, lire, corriger, réduire, joindre, écrire, résumer, est maintenant *une* fonction d'un chemin de fichier. `sys.argv[1]` en fait un CLI : tape `python3 code_formatter.py messy.py` et l'outil édite depuis la ligne de commande.

**🎯 Lançons-le :**

```bash
python3 code_formatter.py messy.py
```

**🎯 Résultat attendu :**

```
messy.py: 10 -> 9 lines; 4 trailing-whitespace fixes; see formatted.py
```

**🩹 Si ça ne marche pas :** Si une `IndexError` apparaît, `sys.argv[1]` manquait (exécute-le *avec* le nom du fichier). Si les comptes diffèrent de 10→9 et 4, `format_file` a relu un `formatted.py` qui existait déjà, opère toujours sur le fichier spécimen.

### 5.3 Vérifie

**✅ Liste de vérification**

- ✅ `python3 code_formatter.py messy.py` écrit `formatted.py` (9 lignes) et affiche le résumé.
- ✅ Les nombres du résumé concordent avec les étapes précédentes : 10→9 lignes, 4 corrections d'espaces de fin.
- ✅ `messy.py` est intact (entrée en lecture seule), l'outil ne réécrit jamais la source.

**🤔 Question(s) socratique(s)**

- `format_file` écrit vers un nom *fixe* `formatted.py`. Un deuxième passage écrase la première sortie. Préférerais-tu `f"formatted_{path}"` ou un drapeau `--out`, et quel est l'argument pour *ne pas* écraser le fichier source directement ?
- Ce formatteur n'est aujourd'hui qu'espacement. Si tu ajoutais une transformation de plus (ex. une ligne vide après chaque `def` de fonction), quel test prouverait qu'elle *ne casse jamais* le sens de `messy.py`, et qu'est-ce que « ne change jamais le sens » signifie même pour du Python critique pour l'indentation ?

## ⚠️ Pièges courants

- **`splitlines` vs `read().split("\n")`.** `splitlines()` ignore le dernier élément vide qu'un `"\n"` de division naïf produit, pour finir avec une fausse dernière ligne vide.
- **`lstrip()` retire aussi les tabulations.** Compter l'indentation avec `len(ln) - len(ln.lstrip())` compte les espaces *et* les tabulations comme un caractère chacun ; utilise `lstrip(" ")` ou une passe consciente des tabulations. (Ce projet vérifie les tabulations séparément.)
- **La réduction des vides sur la mauvaise liste.** Réduire avant de couper signifie qu'une ligne uniquement composée d'espaces (`   `) se comporte comme du *contenu* et ne fusionne jamais avec la ligne vide au-dessus d'elle. Ordre : couper → corriger → réduire.
- **`partition` vs `split`.** `partition("#")` garde les trois morceaux (pré, "#", post) ; `split("#")` mal gérerait un commentaire contenant `#` ou détruirait la limite sur le premier séparateur.
- **Espacement des commentaires sur les chaînes.** `s = "#ff00aa"` contient un `#` *à l'intérieur d'un littéral de chaîne*, un formatteur uniquement espacement le réécrit joyeusement. La frontière du « sous-ensemble sûr » est ton bouclier ; documente-la.
- **Écraser le spécimen.** Réécrire `messy.py` détruit la chose que tu mesures. Écris dans `formatted.py` ; garde l'entrée en lecture seule.

## Ce que tu viens de construire

Un formatteur de code fonctionnel avec un vrai CLI : inspection de lignes avec des barres `|…|` visibles, retrait des espaces de fin et espacement des commentaires `#` via les méthodes intégrées de chaînes, réduction des suites de vides avec une passe idempotente unique, garantie de saut de ligne final avec preuve en comptes d'octets, diagnostics d'indentation en lecture seule en pas de 4 espaces, une vérification du contrat des tabulations, et un écrivain de `formatted.py` qui fait un aller-retour à l'octet près. En dessous, les patterns sont réutilisables partout : **mesure les zones sales avant de normaliser**, **n'applique que des transformations sûres et réversibles**, **rends la détection des vides consciente de l'espace blanc (`strip() == ""`)**, **diagnostique plutôt que deviner quand une correction est ambiguë**, et **garde l'entrée en lecture seule tout en livrant la sortie séparément**.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/code-formatter/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/code-formatter) dans le dépôt du cours contient le formatteur complet comme notebook, inspection, corrections, réduction, diagnostics et CLI, exécutable dans Colab/Kaggle/Binder. Clone le dépôt ou [ouvre-le dans un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Exécute-le sur un vrai fichier *à toi* : `python3 code_formatter.py some_script.py` et lis ce qu'il rapporte.
- Ajoute la gestion `.expandtabs(4)` pour que les fichiers indentés par tabulations soient convertis dans le même passage, avec une ligne `Tabs converted: N`.
- Rends le nommage de sortie intelligent : `formatted_<basename>` au lieu d'un nom fixe, ou un drapeau `--check` qui affiche uniquement le rapport sans écrire de fichier (adapté à la CI).
- Compare avec le vrai : exécute Black (`pip install black`) sur le même spécimen et diff `formatted.py` vs la sortie de Black, une leçon d'humilité sur à quel point le *vrai* formatteur va plus loin.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓