---
title: "Studio Code QR"
description: "Générez, personnalisez et traitez des codes QR en lot avec logos, couleurs et niveaux de correction d'erreurs."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "images", "csv", "utility"]
learningObjectives:
  - "Générer un code QR à partir d'une chaîne et l'enregistrer en PNG"
  - "Recolorer les codes et intégrer un logo central avec Pillow"
  - "Comprendre les niveaux de correction d'erreurs et leur compromis de densité de données"
  - "Générer des codes en lot depuis un CSV et valider tout le dossier"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/functions"]
---

# 🔳 Construire un Studio Code QR

Un code QR est le logiciel le moins glamour que tu feras jamais vivre, et le plus durable : imprimé sur une affiche ou un billet, il doit survivre au flou, à la saleté, et à un téléphone tenu sous un angle peu flatteur. Un vrai outillage QR doit jongler avec trois choses à la fois — la quantité de données qu'il empaquette, les dommages qu'il survit, et s'il ressemble à une marque plutôt qu'à un carré noir. Ce projet construit un petit studio qui fait les trois : générer un code à partir de texte, le recolorer, tamponner un logo en son centre, et produire en lot tout un dossier à partir d'une ligne de feuille de calcul par code — puis valider le lot en relisant chaque matrice depuis le disque et en vérifiant qu'elle correspond à ce que tu as demandé.

Cela suppose le Python 101 — entrées-sorties de fichiers, chaînes, et fonctions. Rien au-delà de cela : pas de web, pas de caméra, pas d'API. C'est optionnel et non noté ; vois [Projets du monde réel](/docs/projects) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Générer ton premier code QR à partir d'une chaîne et l'enregistrer en PNG que tu peux réellement scanner.
2. Recolorer un code et intégrer un logo central avec Pillow — le « studio » du studio QR.
3. Comparer les quatre niveaux de correction d'erreurs et regarder le budget de données rétrécir à mesure que la protection grandit.
4. Générer des codes en lot depuis un CSV, un par ligne, dans un dossier.
5. Valider le lot en relisant chaque image sauvegardée et en la comparant, matrice par matrice, à une référence fraîchement générée.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal — la récompense, ce sont de vrais fichiers `.png` sur disque (scanne-en un avec ton téléphone), et la boucle de lot CSV-vers-dossier est réellement un workflow de système de fichiers. Les deux dépendances (`qrcode`, `pillow`) s'installent proprement avec `uv add`.

**GitHub Codespaces** est la même expérience : ouvre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et les commandes exactes s'exécutent dans un onglet de navigateur, avec les PNG générés dans l'arborescence de fichiers pour téléchargement.

**Google Colab, les notebooks Kaggle et Binder exécutent honnêtement tout le pipeline** — génération de code, recoloration, tampon de logo, et validation de lot sont toutes des mathématiques d'image locales sans clés ni GPU — et le notebook peut même afficher le PNG généré intégré pour que tu *voies* la matrice avant de jamais l'enregistrer. La seule chose qui ne peut pas arriver dans un notebook, c'est toi tenant ton téléphone contre l'écran — ce qui est exactement la vérification de scan que tu voudras faire en local dès que les fichiers atterrissent.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/qr-code-studio/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/qr-code-studio/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fqr-code-studio%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant que le premier carré noir ne s'affiche : `uv`, les deux bibliothèques, et une minuscule image de logo à intégrer.

### Installe `uv` et les dépendances

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis :

```bash
uv --version
mkdir qr-code-studio && cd qr-code-studio
uv init --bare
uv add qrcode pillow
```

### Crée un minuscule logo

L'arithmétique d'image de Pillow aura plus tard besoin d'une vraie image à tamponner. Génère un logo PNG 60×60 point-sur-blanc avec Python lui-même — aucun outil de design requis :

```python
# make_logo.py
from PIL import Image

img = Image.new("RGB", (60, 60), "white")
for y in range(15, 45):
    for x in range(15, 45):
        if abs(x - 30) + abs(y - 30) < 16:
            img.putpixel((x, y), (30, 144, 255))
img.save("logo.png")
print("logo.png written")
```

```bash
uv run python make_logo.py
uv run python -c "import qrcode; print('qrcode ready')"
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version ; `qrcode` et `pillow` installés via `uv add`.
- ✅ `logo.png` existe (60×60, un diamant bleu sur blanc).
- ✅ `uv run python -c "import qrcode"` réussit.

## Étape 1 : Génère et enregistre ton premier QR

Tout le studio repose sur un objet : `qrcode.QRCode`. Tu lui donnes des données, `.make_image()` rend la matrice, et Pillow retourne une vraie image que tu peux `.save()`. La sensation instantanée « j'ai écrit un code qu'une caméra de téléphone lit » est toute la motivation de cette étape.

### 1.1 Fabrique un code scannable

```python
# studio.py
import qrcode

def make_qr(data: str, out_path: str, **kwargs) -> None:
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M,
                       box_size=10, border=4, **kwargs)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(out_path)
    print(f"saved {out_path} ({img.size[0]}x{img.size[1]}px)")

if __name__ == "__main__":
    make_qr("https://example.com/course/lesson-1", "lesson1.png")
```

`version=1` avec `fit=True` est la négociation « plus petit code qui convient » : la bibliothèque *démarre* à la version 1 (modules 21×21) et ne grandit que lorsque les données l'exigent, donc une URL courte obtient un code compact et scannable plutôt qu'un code rembourré. `box_size` est le nombre de pixels par module, `border` est la largeur de la zone de silence en modules — les deux contrôlent directement la lisibilité à distance, et tu entendras le téléphone se plaindre bruyamment si `border` tombe à 0.

**👟 Indice de départ :** Exécute le générateur, puis *scanne réellement* `lesson1.png` avec la caméra de ton téléphone — le lien devrait s'ouvrir dans un navigateur. La boucle se ferme dans un téléphone, pas dans une console.

**🎯 Résultat attendu :** `saved lesson1.png (290x290px)` — `(21 + 2×4) × 10` pixels pour un code version 1 plus sa bordure — et le fichier scanne vers l'URL exacte.

**🩹 Si ça ne marche pas :** Si le fichier enregistré est noir-sur-blanc mais que ton téléphone ne peut pas le lire, la bordure est trop petite ou la vignette trop minuscule pour ton écran — `border=4` est le minimum de la spec ; réessaie 8. Si un `ValueError` dit « données trop longues pour la version 1 », `fit=True` est ignoré ou retiré — avec `fit=True` la bibliothèque fait grandir la version ; sans lui, les données surdimensionnées font une erreur.

### 1.2 Vérifie la génération

**✅ Liste de vérification**

- ✅ `lesson1.png` existe, fait `290×290` px, et une caméra de téléphone le décode vers l'URL exacte.
- ✅ Fond blanc `uint8`, modules noirs — un code propre à contraste élevé.
- ✅ Faire deux fois les mêmes données produit des fichiers de taille égale dont les grilles de pixels correspondent (l'Étape 5 automatisera exactement cela).

**🤔 Question(s) socratique(s)**

- `fit=True` fait grandir le code par la bibliothèque jusqu'à ce que les données rentrent. Quel est le *coût* d'un code qui a grandi jusqu'à la version 40 par rapport à celui qui est resté à la version 1 — au-delà des pixels, pense à la distance de scan (les modules deviennent plus petits) et pourquoi « version minimale » est le bon défaut ?
- La `border` de zone de silence est *mandatée par la spec*, pourtant les outils débutants la mettent régulièrement à 0. Prédis ce qu'un scanner fait quand la bordure a disparu — et lequel des deux (données ou blanc) est autorisé à échouer dans un résultat décodé.

## Étape 2 : Recolore et tamponne un logo

La partie « studio ». Les codes QR tolèrent le re-style grâce à la correction d'erreurs : les *motifs de détection* (les trois grands carrés d'angle) doivent rester à contraste élevé, mais les modules de données au milieu ont de la redondance, et Pillow a exactement les primitives pour l'exploiter — recolorer via `fill_color`/`back_color`, puis coller un logo dans la région centrale sûre.

### 2.1 Recolore et intègre

```python
# studio.py (suite)
from PIL import Image

def make_branded(data: str, out_path: str, logo_path: str = "logo.png",
                 fill=(20, 90, 220), back=(255, 255, 255)) -> None:
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H,
                       box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color=fill, back_color=back).convert("RGB")
    logo = Image.open(logo_path).resize((img.size[0] // 5, img.size[1] // 5))
    cx, cy = img.size[0] // 2, img.size[1] // 2
    img.paste(logo, (cx - logo.width // 2, cy - logo.height // 2))
    img.save(out_path)

if __name__ == "__main__":
    make_branded("https://example.com/landing", "landing-branded.png")
```

Deux décisions de design rendent le code avec marque scannable plutôt que décoratif : `error_correction=H` (le plus élevé — 30 % des modules peuvent être endommagés et le code se décode encore, ce qui est le budget que le logo dépense), et la taille du logo plafonnée à 1/5 de l'image (`img.size[0] // 5`), gardant le tampon dans le centre redondant et loin des trois motifs de détection dans les coins. `img.paste(logo, ...)` est toute la marque-dans-la-boîte — centrée en soustrayant la moitié des dimensions du logo au point médian.

**👟 Indice de départ :** Exécute-le, ouvre `landing-branded.png`, et scanne avec ton téléphone *avant* de modifier les couleurs — un diamant bleu sur blanc devrait se décoder proprement. Puis pousse `fill` de `(20, 90, 220)` vers `(250, 250, 250)` (presque blanc sur blanc) et regarde le téléphone échouer ; cette expérience enseigne mieux le contraste que n'importe quel paragraphe.

**🎯 Résultat attendu :** Un code 290×290 à correction `H` avec un logo bleu d'≈58×58 en plein centre, toujours décodable par une caméra de téléphone vers l'URL d'atterrissage.

**🩹 Si ça ne marche pas :** Si le logo casse le scan, tu es à un niveau de correction plus bas ou le logo est plus grand que 1/5 — les deux dépensent le budget de correction d'erreurs au-delà de ce que H peut couvrir ; `ERROR_CORRECT_H` plus le plafond `// 5` est la paire sûre. Si le bleu audacieux est lu comme à faible contraste par ton téléphone, garde `fill` sombre et `back` clair — les couleurs quasi égales sont la panne classique de caméra de téléphone.

### 2.2 Vérifie la marque

**✅ Liste de vérification**

- ✅ `landing-branded.png` scanne vers l'URL d'atterrissage avec le logo présent.
- ✅ Les trois motifs de détection d'angle sont intacts — le logo est centré et assez petit pour les éviter.
- ✅ Recolorer en sombre-sur-clair garde le décodage ; recolorer en blanc-sur-blanc le casse (et tu sais *pourquoi* — contraste de modules).
- ✅ La correction `H` est délibérée : sans le budget de redondance, le même logo serait une bouillie non scannable.

**🤔 Question(s) socratique(s)**

- Le coût du logo est le budget de redondance — `H` couvre 30 % de dommages. Si un designer demandait un logo couvrant 1/3 de l'image au lieu de 1/5, qu'arrive-t-il réellement — quels *modules spécifiques* sont détruits, et est-ce qu'un coin est sûr ? (Indice : pense aux *motifs de détection*.)
- La correction `L` (7 %) fait un code plus dense pour les mêmes données. Quand choisirais-tu *délibérément* `L` et accepterais la fragilité — nomme un scénario réel d'affiche ou de billet où la petitesse bat la robustesse ?

## Étape 3 : Compare les niveaux de correction d'erreurs

« Correction d'erreurs » semble binaire, mais c'est un cadran à quatre positions — `L`, `M`, `Q`, `H` — qui fait le compromis entre la *capacité de données* et la *survie aux dommages*. Cette étape génère la même charge utile aux quatre niveaux et *imprime l'écart* : moins de modules par unité de données, ou nettement plus, dans une seule expérience reproductible.

### 3.1 Balaye les niveaux

```python
# studio.py (suite)
import qrcode.constants as C

LEVELS = {"L": C.ERROR_CORRECT_L, "M": C.ERROR_CORRECT_M,
          "Q": C.ERROR_CORRECT_Q, "H": C.ERROR_CORRECT_H}

def sweep(data: str) -> None:
    for name, code in LEVELS.items():
        qr = qrcode.QRCode(version=None, error_correction=code, box_size=4, border=4)
        qr.add_data(data)
        qr.make(fit=True)
        print(f"{name}: version {qr.version}  matrix {qr.modules_count}x{qr.modules_count}")

if __name__ == "__main__":
    sweep("https://example.com/course/lesson-1")
```

`version=None` diffère le choix de taille à `fit=True`, donc le balayage répond à une seule question par niveau : *quelle taille de matrice est nécessaire pour cette charge utile exacte à cette protection ?*. Une URL courte reste à la version 1 à `L`, `M`, et `Q`, et seul `H` augmente — le punch de l'expérience, c'est que des données modérées paient à peine la montée, tandis qu'une charge utile de 1000 caractères séparerait dramatiquement les niveaux.

**👟 Indice de départ :** Exécute le balayage, puis ré-exécute-le avec une chaîne de données *longue* (`"x" * 400`) — la colonne de version saute visiblement. Les deux exécutions dos à dos sont toute la leçon.

**🎯 Résultat attendu :** Quatre lignes — pour l'URL courte, des versions comme `1 / 1 / 1 / 2` (x2 à `H`) ; pour 400 caractères, des versions nettement plus grandes et différentes par niveau, avec `L` le moins cher et `H` le plus cher en modules.

**🩹 Si ça ne marche pas :** Si les quatre lignes montrent la même taille, `version=None` + `fit=True` ne fait pas grandir — vérifie que tu as bien passé `version=None` *et* gardé `fit=True` (la bibliothèque doit dimensionner elle-même le code). Si une charge utile très longue fait une erreur, la chaîne dépasse même la capacité de la version 40 — ce n'est pas un bug, c'est le plafond dur de la spec QR, et 3 ko est là où il vit.

### 3.2 Vérifie le balayage

**✅ Liste de vérification**

- ✅ L'URL courte donne ≤2 lignes presque identiques ; 400 caractères donnent 4 tailles distinctes.
- ✅ `L` est toujours le plus petit-ou-égal et `H` le plus grand-ou-égal en dimensions de matrice.
- ✅ Tu peux reformuler le compromis en une phrase : plus de protection = moins de modules de données par zone = codes plus grands / moins de charge utile par version.

**🤔 Question(s) socratique(s)**

- Nous avons *mesuré* la différence. Maintenant prédis-la : à quelle taille de charge utile `L` et `H` *cessent-ils* de différer d'une version entière, et que coûte « le même code, mieux blindé » en distance de scan, exactement ?
- Si une étiquette postale a 5 mm disponibles pour le code et doit survivre à une averse, quel niveau choisis-tu — et qu'est-ce qui te forcerait *en dessous* de ce choix même si tu préfères ne pas ?

## Étape 4 : Produis en lot depuis un CSV

Un à la fois est une démo ; un CSV est une ligne de production. Chaque ligne est la charge utile d'un code, et le travail du studio est de transformer `codes.csv` en un dossier de fichiers `.png` uniques en une passe — la même discipline « le fichier de données pilote l'outil » qui transforme n'importe quel script ponctuel en workflow.

### 4.1 Génère un dossier à partir d'une feuille de calcul

Crée `codes.csv` :

```csv
label,payload
course1,https://example.com/course/lesson-1
course2,https://example.com/course/lesson-2
course3,https://example.com/course/lesson-3
ticket-A1,https://example.com/tickets/A1
```

```python
# studio.py (suite)
import csv
from pathlib import Path

def batch(csv_path: str, out_dir: str = "out") -> None:
    out = Path(out_dir)
    out.mkdir(exist_ok=True)
    with open(csv_path, newline="") as f:
        for row in csv.DictReader(f):
            make_qr(row["payload"], str(out / f"{row['label']}.png"))
    print(f"batch done -> {len(list(out.glob('*.png')))} pngs in {out}/")

if __name__ == "__main__":
    batch("codes.csv")
```

`csv.DictReader` rend chaque ligne sous forme de dict indexé par son en-tête — donc `row["payload"]` se lit proprement et une colonne manquante lève un `KeyError` *bruyant* avec le nom de la colonne, plutôt qu'une charge utile `None` qui générerait quatre carrés noirs. L'étiquette devient le nom de fichier, ce qui est tout le contrat du lot : une ligne CSV par sortie, zéro nommage manuel.

**👟 Indice de départ :** Exécute le lot et `ls out/` — quatre fichiers `course1.png` ... `ticket-A1.png`. Puis casse délibérément une ligne CSV (supprime la colonne payload) et regarde le `KeyError` nommer la colonne — cet échec bruyant est une fonctionnalité.

**🎯 Résultat attendu :** `batch done -> 4 pngs in out/`, chaque fichier nommé exactement comme son étiquette CSV, chacun scannant vers sa propre charge utile.

**🩹 Si ça ne marche pas :** Si les noms de fichiers gagnent un espace de fin (`course1 .png`), la colonne d'étiquette du CSV a du blanc — `csv.DictReader` passe le texte brut ; nettoie dans `batch` (`row["label"].strip()`) à la source. Si des étiquettes dupliquées entrent en collision, la deuxième ligne écrase silencieusement la première — décide entre une vérification bruyante de style `KeyError` ou un avertissement d'écrasement ; une perte de données silencieuse n'est jamais le but.

### 4.2 Vérifie le lot

**✅ Liste de vérification**

- ✅ Quatre PNG, un par ligne, tous scannant vers leurs charges utiles distinctes.
- ✅ Retirer une ligne CSV retire son PNG à l'exécution suivante — le lot est dérivé du fichier, pas maintenu à la main.
- ✅ Une colonne manquante lève un `KeyError` nommant la colonne, non un carré de charge utile `None` silencieux.

**🤔 Question(s) socratique(s)**

- L'étiquette est le nom de fichier. Quel est le risque de concurrence ou d'écrasement si un CSV contient deux lignes avec la *même* étiquette — et « la dernière ligne gagne » est-il acceptable pour une série d'autocollants, ou l'outil doit-il échouer bruyamment ? Choisis un camp avec une raison.
- Les étiquettes de noms de fichiers viennent d'une feuille de calcul, donc `ticket-A1` est très bien mais `../ticket-A1` écrirait *à l'extérieur* du dossier de sortie. Quelle vérification d'une seule chaîne (`in Path(...).name`) protège le dossier — et son utilisation te fait-elle te sentir mieux face aux chemins pilotés par CSV en général ?

## Étape 5 : Valide le lot

Un studio qui imprime dans un fichier et s'en va ne vaut que la moitié d'un outil ; l'autre moitié, c'est la *vérification*. De vraies lignes de production scannent chaque étiquette en retour. La nôtre n'a pas de scanner, mais elle a la meilleure chose suivante : régénérer chaque charge utile de zéro comme une matrice de référence et la diffuser, module par module, contre l'image archivée — si les deux concordent, le fichier sur disque est exactement le code que nous avons commandé.

### 5.1 Re-vérifie chaque code sauvegardé

```python
# studio.py (suite)

def matrix_of(data: str, box: int = 10) -> list[list[int]]:
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M,
                       box_size=box, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    return qr.modules

def pixels_as_modules(img: Image.Image) -> list[list[int]]:
    g = img.convert("L")
    w, h = g.size
    # 10px par module pour box_size=10 (plus la bordure de 4 modules, qu'on garde sombre/claire)
    return [[0 if g.getpixel((x, y)) < 128 else 1 for x in range(w)] for y in range(h)]

def verify(data: str, saved_path: str) -> bool:
    expected = matrix_of(data)
    actual = pixels_as_modules(Image.open(saved_path))
    expected_small = [[expected[y][x] for x in range(len(expected))] for y in range(len(expected))]
    ok = True
    for y in range(min(len(expected_small), len(actual))):
        for x in range(min(len(expected_small[y]), len(actual[y]))):
            if expected_small[y][x] != actual[y][x]:
                ok = False
    print(f"{'OK ' if ok else 'BAD'} {saved_path}")
    return ok

if __name__ == "__main__":
    verdicts = [
        verify("https://example.com/course/lesson-1", "out/course1.png"),
        verify("https://example.com/tickets/A1", "out/ticket-A1.png"),
    ]
    print("all verified" if all(verdicts) else "some failed")
```

`qr.modules` est la matrice brute — une liste de listes de booléens, module 0-ou-1 pour tout le code — et `verify` la régénère de zéro à partir de la *charge utile*, la seule entrée de confiance. `pixels_as_modules` convertit chaque pixel sauvegardé en 0/1 et compare cellule par cellule : une correspondance exacte signifie que le fichier archivé encode exactement ce que le CSV a demandé. Le compromis de design est explicite — un filigrane, une recoloration, ou un logo feront *déclencher* ce diff strict, donc vérifier-avec-modifications est ta première décision « quand est-ce qu'une non-correspondance est OK ? » enregistrée dans le code.

**👟 Indice de départ :** Vérifie d'abord les deux codes simples (tous deux `OK`), puis pointe `verify` sur `landing-branded.png` et regarde-le échouer exprès — le logo est un dommage attendu, et le diff strict mesure le fait que tu *remarques* la différence, ce qui est la vraie compétence.

**🎯 Résultat attendu :** `OK .../out/course1.png`, `OK .../out/ticket-A1.png`, et `all verified` — avec `verify("https://example.com/landing", "landing-branded.png")` qui bascule en `BAD` parce que le logo altère les modules centraux.

**🩹 Si ça ne marche pas :** Si tout revient `BAD`, le chemin d'import ou les hypothèses de `box_size` sont faux — `matrix_of` doit utiliser le *même* `box_size` et la même bordure que ceux avec lesquels les fichiers ont été générés, sinon la grille de pixels se désaligne silencieusement. Si `verify` lève `OSError`, le fichier sauvegardé n'est pas une image lisible — le lot l'a écrit sous un nom différent ; affiche la liste de `out/`.

### 5.2 Vérifie le vérificateur

**✅ Liste de vérification**

- ✅ Deux codes de lot simples se vérifient `OK` contre des matrices fraîchement régénérées.
- ✅ Le code avec marque rapporte délibérément `BAD` — le diff strict détecte le logo, par design.
- ✅ Re-générer un fichier depuis le même CSV et re-vérifier donne `OK` — la déterminisme tient.
- ✅ Tu peux articuler ce que `verify` *ne peut pas* vérifier (il ne décode pas le texte ; il compare des modules visuels) — et pourquoi c'est à la fois une limite et une fonctionnalité.

**🤔 Question(s) socratique(s)**

- Le vérificateur prouve « l'image correspond au code fraîchement généré pour cette charge utile » — mais fraîchement généré et *correct* ne sont la même chose que si la bibliothèque est digne de confiance. Qu'apporterait une seconde vérification complètement indépendante (une passe de décodage réelle via une bibliothèque de décodage, ou un second générateur QR) au-delà de ce que ton diff peut affirmer ?
- Notre diff strict de pixels signale le logo de marque comme un échec. Réécris la règle d'acceptation en une phrase — « OK si seule la région intérieure X-par-Y diffère, sinon BAD » — et nomme ce qui change dans le pipeline quand c'est la politique à la place.

## ⚠️ Pièges courants

- **Bordure zéro, code illisible.** La zone de silence `border=4` fait partie de la spec QR, pas de la décoration — un code sauvegardé avec `border=0` tue souvent le scan-par-téléphone. Garde-la ≥4 modules et souviens-toi que la bordure gonfle la taille en pixels (`(modules+2·border)·box_size`).
- **Faible correction d'erreurs + un logo.** `L` laisse un budget de 7 % de dommages ; un logo qui brûle le centre le dépasse instantanément. La combinaison avisée du logo est `H` + un tampon ≤1/5 de la taille de l'image — se tromper sur l'un ou l'autre fait un joli QR qui ne scanne jamais.
- **Collisions de noms de fichiers en lot qui écrasent silencieusement.** Deux lignes CSV avec la même étiquette produisent un fichier survivant et l'autre disparaît sans un mot. Les étiquettes dupliquées sont soit une erreur de données valant un `ValueError` bruyant, soit une politique délibérée ; l'écrasement silencieux est la seule option qui n'est jamais la bonne.
- **Le blanc du CSV empoisonne les noms de fichiers.** `label ` (un espace avant la nouvelle ligne) produit `file .png` et une vérification qui « marche » pendant que le produit semble faux. Nettoie chaque champ au moment de la lecture, à un seul endroit, et ne laisse jamais une cellule brute posséder un chemin.
- **Faire confiance au diff par-dessus le décodeur.** Un diff strict de matrice prouve l'*auto-cohérence avec une bibliothèque* — il n'attrapera pas un bug de bibliothèque, une différence d'encodage subtile, ou un choix de couleur hostile au scanner. La pile de validation honnête est ton diff cellule-par-cellule (rapide, hors ligne) plus au moins un scan réel de caméra de téléphone avant qu'un lot ne parte.

## Ce que tu viens de construire

Un studio QR fonctionnel : génération de code unique, recoloration et tampon de logo, un balayage de correction d'erreurs à quatre niveaux, une production en lot pilotée par CSV, et un vérificateur hors ligne qui diff chaque code archivé contre une référence fraîchement générée. Ta caméra de téléphone est le test d'acceptation pour chaque fichier qu'il produit, et l'astuce « régénère la référence, diff l'archive » est une véritable habitude de validation transférable — la même idée derrière les vérifications de builds reproductibles et les suites de tests d'images dorées. Le studio est assez petit pour être lu en entier, et assez grand pour souffler : *voilà à quoi ressemble la livraison d'un utilitaire*.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/qr-code-studio/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/qr-code-studio) dans le dépôt du cours regroupe le module studio, `codes.csv`, `logo.png`, et un notebook qui génère, recolore, marque, traite par lot, et vérifie en intégré. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et regarde les PNG s'afficher directement dans le notebook.
:::

## Où aller à partir d'ici

- **Support de décodage (optionnel) :** `pip install opencv-python-headless` et utilise `cv2.QRCodeDetector().detectAndDecode` pour un vrai aller-retour — ton vérificateur obtient d'honnêtes réponses « est-ce que le texte survit », pas seulement l'égalité de pixels.
- **Un drapeau `--style` :** `--fill "#1f4fa3" --logo mark.png --level H`, pour que ton lot soit reproductible depuis une configuration en ligne de commande au lieu d'être retapé à chaque exécution.
- **Charges utiles Wi-Fi et vCard :** génère des chaînes `WIFI:T:WPA;S:net;P:key;;` et `MECARD` pour que le studio frappe des autocollants scannables « rejoins le wifi » ou « sauvegarde le contact » depuis le même pipeline.
- **Une vérification de fusion :** étends le vérificateur pour accepter un diff uniquement-région-intérieure, pour que les codes avec marque se valident aussi — l'accroche socratique de l'Étape 5 devenue code.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier — un lot de codes qu'un lecteur de codes-barres a réellement lu, une série d'autocollants avec marque qui a survécu à ton téléphone ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README t'accompagne dans l'ajout du tien via une **pull request** de bout en bout : forker, créer une branche, commiter, et ouvrir la PR. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
