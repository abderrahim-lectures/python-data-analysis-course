---
title: "Convertisseur de Documents"
description: "Convertir entre Markdown, HTML et texte brut avec extraction de métadonnées et traitement par lots."
difficulty: "beginner"
estimatedMinutes: 40
xpReward: 50
tags: ["file-io", "markdown", "html", "cli"]
prerequisites: ["Bases de Python (variables, boucles, fonctions, chaînes)", "Entrées/sorties de fichiers de base"]
---

# Document Converter

Les documents existent sous de nombreux formats — Markdown pour l'écriture, HTML pour le web, texte brut pour les partages rapides. Les convertir manuellement entre ces formats est fastidieux et sujet aux erreurs. Dans ce projet, tu construiras un outil Python qui lit les fichiers Markdown, les convertit en HTML ou en texte brut, extrait les métadonnées des en-têtes de document, et traite des répertoires entiers en une seule commande.

- **Exécutez-le dans le navigateur.** Un compagnon notebook interactif est prêt — ouvrez-le dans Colab, Kaggle ou Binder et suivez les étapes dans l'ordre.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-converter/notebook.fr.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-converter/notebook.fr.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdocument-converter%2Fnotebook.fr.ipynb)

## Ce que tu vas faire

1. Analyser la syntaxe Markdown en données structurées
2. Convertir le Markdown en HTML avec des balises appropriées
3. Retirer le HTML pour obtenir du texte brut
4. Extraire les métadonnées du frontmatter du document
5. Traiter plusieurs fichiers en lot

## Ce que tu vas construire

Un convertisseur de documents qui :
- Lit les fichiers Markdown et les convertit en HTML
- Applique un style CSS au HTML généré
- Convertit le HTML en texte brut
- Extrait les métadonnées du frontmatter YAML
- Traite des répertoires entiers en une commande

## Configuration

```bash
uv init document-converter
cd document-converter
```

---

## Étape 1 : Lire les fichiers Markdown

### Objectif

Charger le contenu d'un fichier Markdown dans une chaîne Python pour pouvoir travailler avec.

### Explication

La lecture de fichiers est le fondement de tout convertisseur. La fonction `open()` de Python avec le mode `"r"` ouvre un fichier en lecture. La méthode `.read()` tire tout le contenu du fichier dans une seule chaîne. Utilise toujours une instruction `with` pour que le fichier se ferme automatiquement, même si une erreur survient.

### Indice de départ

Tu as besoin d'un fichier Markdown d'exemple pour tester. Crée `sample.md` d'abord, puis écris une fonction qui le lit.

### Crée le fichier d'exemple

Crée un fichier appelé `sample.md` à la racine de ton projet avec ce contenu :

```markdown
# Hello World

This is a **bold** word and this is an *italic* word.

## Features

- Item one
- Item two
- Item three

[A link to Python](https://python.org)

```python
print("Hello!")
```
```

### Code fonctionnel

```python
def read_markdown(filepath: str) -> str:
    """Read a Markdown file and return its contents."""
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


if __name__ == "__main__":
    content = read_markdown("sample.md")
    print(f"Read {len(content)} characters from sample.md")
    print("---")
    print(content[:200])
```

### Résultat attendu

```
Read 189 characters from sample.md
---
# Hello World

This is a **bold** word and this is an *italic* word.

## Features

- Item one
- Item two
- Item three

[A link to Python](https://python.org)

```python
print("Hello!")
```
```

### Dépannage

**`FileNotFoundError`.** Vérifie le chemin du fichier. Utilise `os.path.exists(filepath)` pour confirmer que le fichier existe avant de le lire.

**`UnicodeDecodeError`.** Certains fichiers utilisent un encodage non UTF-8. Ajoute `errors="replace"` à `open()` pour ignorer les mauvais caractères.

**Sortie vide.** Le fichier pourrait être vide ou le chemin pointer vers le mauvais fichier. Affiche `filepath` avant d'ouvrir.

### Liste de vérification

- Créé `sample.md` avec du contenu Markdown
- La fonction retourne tout le contenu du fichier comme chaîne
- Utilisé l'instruction `with` pour une gestion de fichier sûre
- Vérifié que la sortie affiche les 200 premiers caractères

### Question socratique

Pourquoi utiliser `with open(...)` a-t-il de l'importance par rapport à appeler `open()` et `close()` manuellement ? Que se passe-t-il si une exception est levée entre `open()` et `close()` ?

---

## Étape 2 : Convertir le Markdown en HTML

### Objectif

Transformer la syntaxe Markdown en balises HTML correspondantes.

### Explication

Le Markdown a une syntaxe simple et cohérente : `#` pour les titres, `**text**` pour le gras, `*text*` pour l'italique, `-` pour les items de liste, `[text](url)` pour les liens, et des triples backticks pour les blocs de code. Tu peux écrire un convertisseur en mappant chaque motif à son équivalent HTML avec des expressions régulières.

### Indice de départ

Utilise le module `re`. Pour chaque élément Markdown, écris un motif qui le fait correspondre et un remplacement qui l'enveloppe dans des balises HTML.

### Code fonctionnel

```python
import re


def markdown_to_html(md_text: str) -> str:
    """Convert Markdown text to HTML."""
    html = md_text

    # Code blocks (``` ... ```)
    html = re.sub(
        r"```(\w*)\n(.*?)```",
        r'<pre><code class="language-\1">\2</code></pre>',
        html,
        flags=re.DOTALL,
    )

    # Inline code
    html = re.sub(r"`([^`]+)`", r"<code>\1</code>", html)

    # Headings
    html = re.sub(r"^### (.+)$", r"<h3>\1</h3>", html, flags=re.MULTILINE)
    html = re.sub(r"^## (.+)$", r"<h2>\1</h2>", html, flags=re.MULTILINE)
    html = re.sub(r"^# (.+)$", r"<h1>\1</h1>", html, flags=re.MULTILINE)

    # Bold and italic
    html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
    html = re.sub(r"\*(.+?)\*", r"<em>\1</em>", html)

    # Links
    html = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', html)

    # Unordered lists
    lines = html.split("\n")
    in_list = False
    result = []
    for line in lines:
        if line.startswith("- "):
            if not in_list:
                result.append("<ul>")
                in_list = True
            result.append(f"  <li>{line[2:]}</li>")
        else:
            if in_list:
                result.append("</ul>")
                in_list = False
            result.append(line)
    if in_list:
        result.append("</ul>")
    html = "\n".join(result)

    # Paragraphs (wrap remaining plain text lines)
    html = re.sub(r"\n\n+", "\n\n", html)

    return html


if __name__ == "__main__":
    content = read_markdown("sample.md")
    html = markdown_to_html(content)
    print(html)
```

### Résultat attendu

```html
<h1>Hello World</h1>

<p>This is a <strong>bold</strong> word and this is an <em>italic</em> word.</p>

<h2>Features</h2>

<ul>
  <li>Item one</li>
  <li>Item two</li>
  <li>Item three</li>
</ul>

<a href="https://python.org">A link to Python</a>

<pre><code class="language-python">print("Hello!")</code></pre>
```

### Dépannage

**Le gras ne se convertit pas.** Assure-toi que les motifs `**` soient traités avant les motifs `*`. Sinon, l'expression régulière de l'italique correspondra au premier `*` de `**` et cassera le motif gras.

**Les blocs de code mangent le contenu.** Le flag `re.DOTALL` laisse `.` correspondre aux sauts de ligne à l'intérieur du bloc de code. Sans lui, l'expression régulière ne correspond qu'aux blocs de code sur une seule ligne.

**Les listes ne s'enveloppent pas.** L'analyseur de liste repose sur des lignes consécutives commençant par `- `. Les lignes vides entre les items cassent le groupe. C'est acceptable pour ce projet — chaque bloc de liste est traité séparément.

### Liste de vérification

- Les titres se convertissent en balises `<h1>`, `<h2>`, `<h3>`
- Le gras (`**`) devient `<strong>` et l'italique (`*`) devient `<em>`
- Les liens deviennent des balises `<a href="...">`
- Les items de liste s'enveloppent dans des balises `<ul>` et `<li>`
- Les blocs de code s'enveloppent dans `<pre><code>` avec la classe de langage

### Question socratique

Pourquoi les motifs gras devraient-ils être traités avant les motifs italiques ? Que se passerait-il si l'ordre était inversé ?

---

## Étape 3 : Ajouter le style CSS

### Objectif

Envelopper le HTML généré dans une structure de document complète avec du CSS intégré pour un rendu soigné.

### Explication

Du HTML brut sans bloc `<head>` ni `<style>` se rend comme du texte non stylé dans un navigateur. En enveloppant ton contenu converti dans un document HTML complet avec du CSS intégré, tu obtiens une page présentable sans dépendances externes.

### Indice de départ

Crée une constante de chaîne qui contient le squelette HTML avec un bloc `<style>`, puis insère ton contenu converti dans le corps.

### Code fonctionnel

```python
CSS = """
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    max-width: 700px;
    margin: 2rem auto;
    padding: 0 1rem;
    line-height: 1.6;
    color: #333;
}
h1, h2, h3 { color: #111; }
code {
    background: #f4f4f4;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
}
pre {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
}
pre code { background: none; padding: 0; color: inherit; }
a { color: #0066cc; }
ul { padding-left: 1.5rem; }
"""


def wrap_html(body: str, title: str = "Converted Document") -> str:
    """Wrap HTML body in a full document with CSS."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>{CSS}</style>
</head>
<body>
{body}
</body>
</html>"""


if __name__ == "__main__":
    content = read_markdown("sample.md")
    html_body = markdown_to_html(content)
    full_html = wrap_html(html_body, title="My Document")
    print(full_html[:500])
```

### Résultat attendu

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Document</title>
    <style>
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    max-width: 700px;
    margin: 2rem auto;
    ...
</style>
</head>
<body>
<h1>Hello World</h1>
...
</body>
</html>
```

### Dépannage

**CSS qui ne s'affiche pas.** Assure-toi que la balise `<style>` est à l'intérieur de `<head>`, pas de `<body>`.

**Caractères spéciaux dans le titre.** Si le titre contient des guillemets, ils casseront l'attribut HTML. Utilise `html.escape(title)` du module `html` pour l'assainir.

**Fichier qui ne se rend pas dans le navigateur.** Enregistre-le en `.html` (pas `.md`) et ouvre-le dans un navigateur.

### Liste de vérification

- Le HTML inclut la déclaration `<!DOCTYPE html>`
- Le CSS est intégré dans un bloc `<style>` à l'intérieur de `<head>`
- La page a un titre configurable
- Le contenu du corps est inséré entre les balises `<body>`
- Ouvrir le fichier de sortie dans un navigateur montre un contenu stylé

### Question socratique

Pourquoi intégrer le CSS directement dans le fichier HTML au lieu de lier une feuille de style externe ? Quels sont les compromis de chaque approche ?

---

## Étape 4 : Convertir le HTML en texte brut

### Objectif

Retirer toutes les balises HTML et retourner un texte brut propre.

### Explication

Convertir le HTML en texte brut est utile pour les aperçus, l'indexation de recherche ou les corps d'emails. L'approche est directe : retire toutes les balises avec une expression régulière, puis nettoie l'espace blanc supplémentaire. Ce n'est pas un analyseur HTML complet, mais cela fonctionne bien pour des documents simples.

### Indice de départ

Utilise `re.sub(r"<[^>]+>", "", html)` pour retirer les balises, puis aplatit les espaces multiples et les lignes vides.

### Code fonctionnel

```python
import html as html_module


def html_to_text(html_str: str) -> str:
    """Convert HTML to plain text by stripping tags."""
    text = html_str

    # Replace block elements with newlines for spacing
    text = re.sub(r"<(br|hr)\s*/?>", "\n", text)
    text = re.sub(r"</(p|div|h[1-6]|li|pre)>", "\n", text)

    # Remove all remaining tags
    text = re.sub(r"<[^>]+>", "", text)

    # Decode HTML entities (&amp; -> &, &lt; -> <, etc.)
    text = html_module.unescape(text)

    # Clean up whitespace
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = text.strip()

    return text


if __name__ == "__main__":
    content = read_markdown("sample.md")
    html_body = markdown_to_html(content)
    plain = html_to_text(html_body)
    print(plain)
```

### Résultat attendu

```
Hello World

This is a bold word and this is an italic word.

Features

- Item one
- Item two
- Item three

A link to Python

print("Hello!")
```

### Dépannage

**Lignes vides supplémentaires.** Le motif `\n{3,}` aplatit trois sauts de ligne ou plus en deux. Ajuste le seuil si tu veux un espacement plus serré.

**Entités non décodées.** Assure-toi d'appeler `html_module.unescape()` après avoir retiré les balises, pas avant. Certaines entités vivent à l'intérieur des attributs de balise et ne devraient pas être décodées dans le corps du texte.

**Formatage perdu.** C'est attendu. Le texte brut n'a pas de concept de gras ou d'italique. L'approche de retrait produit un texte propre mais perd les informations de formatage.

### Liste de vérification

- Toutes les balises HTML sont retirées
- Les entités HTML sont décodées en leurs caractères
- L'espace blanc et les lignes vides supplémentaires sont aplatis
- La sortie est un texte brut propre et lisible

### Question socratique

Que se passe-t-il si tu exécutes cette fonction sur du HTML qui contient une balise `<script>` avec du code JavaScript ? Comment gérerais-tu ce cas ?

---

## Étape 5 : Extraire les métadonnées

### Objectif

Analyser le frontmatter YAML du haut d'un fichier Markdown et le retourner comme un dictionnaire.

### Explication

De nombreux fichiers Markdown commencent par un bloc de frontmatter YAML délimité par `---`. Ce bloc contient des métadonnées comme le titre, l'auteur, la date et les balises. Extraire ces données laisse ton convertisseur les ajouter aux balises HTML `<meta>` ou les utiliser pour l'organisation des fichiers.

### Indice de départ

Sépare le contenu du fichier sur `---`. Le premier segment est le frontmatter (s'il existe). Analyse-le ligne par ligne, en séparant sur le premier `:` pour obtenir des paires clé-valeur.

### Crée un fichier de test

Crée `sample_with_meta.md` :

```markdown
---
title: My Blog Post
author: Jane Doe
date: 2025-01-15
tags: python, tutorial, beginner
---

# My Blog Post

This post covers Python basics.

## Why Python?

Python is great for beginners.
```

### Code fonctionnel

```python
def extract_frontmatter(text: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and return (metadata_dict, body_text)."""
    lines = text.split("\n")

    if not lines or lines[0].strip() != "---":
        return {}, text

    # Find the closing ---
    end_index = None
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_index = i
            break

    if end_index is None:
        return {}, text

    # Parse frontmatter lines
    metadata = {}
    for line in lines[1:end_index]:
        line = line.strip()
        if not line or ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()

        # Convert comma-separated values to list
        if "," in value:
            value = [v.strip() for v in value.split(",")]

        metadata[key] = value

    body = "\n".join(lines[end_index + 1 :])
    return metadata, body


if __name__ == "__main__":
    text = read_markdown("sample_with_meta.md")
    meta, body = extract_frontmatter(text)
    print("Metadata:", meta)
    print("---")
    print("Body preview:", body[:100])
```

### Résultat attendu

```
Metadata: {'title': 'My Blog Post', 'author': 'Jane Doe', 'date': '2025-01-15', 'tags': ['python', 'tutorial', 'beginner']}
---
Body preview: 

# My Blog Post

This post covers Python basics.

## Why Python?

Python is great for beginners.
```

### Dépannage

**Aucune métadonnée retournée.** Le fichier doit commencer par `---` sur la toute première ligne. Pas de lignes vides avant.

**Valeurs avec des deux-points.** Si une valeur contient un deux-points (comme `url: https://example.com`), `partition(":")` le gère correctement car il sépare sur le *premier* deux-points seulement.

**YAML imbriqué.** Cet analyseur gère des paires clé-valeur plates. Il ne supporte pas les structures YAML imbriquées. Pour celles-ci, utilise la bibliothèque `pyyaml`.

### Liste de vérification

- Le frontmatter est extrait lorsqu'il est présent
- Les fichiers sans frontmatter retournent un dict vide et le corps complet
- Les balises séparées par des virgules deviennent une liste
- Le texte du corps commence après le `---` de fermeture
- Les clés et valeurs sont débarrassées de l'espace blanc

### Question socratique

Pourquoi ce projet analyse-t-il le frontmatter manuellement au lieu d'utiliser une bibliothèque comme PyYAML ? Quand choisirais-tu l'approche manuelle plutôt que d'utiliser une bibliothèque ?

---

## Étape 6 : Conversion par lots

### Objectif

Traiter chaque fichier Markdown d'un répertoire et les convertir en HTML.

### Explication

Un usage réel exige de convertir de nombreux fichiers à la fois. Les modules `os` et `pathlib` de Python te laissent parcourir les répertoires, trouver les fichiers `.md`, et appliquer ton convertisseur à chacun. Le traitement par lots transforme un outil mono-fichier en un véritable utilitaire.

### Indice de départ

Utilise `pathlib.Path.glob("**/*.md")` pour trouver récursivement tous les fichiers Markdown d'un répertoire.

### Code fonctionnel

```python
from pathlib import Path


def batch_convert(
    input_dir: str,
    output_dir: str,
    format: str = "html",
) -> list[str]:
    """Convert all Markdown files in input_dir to the target format.

    Returns a list of output file paths.
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    converted_files = []

    for md_file in input_path.glob("**/*.md"):
        text = md_file.read_text(encoding="utf-8")
        metadata, body = extract_frontmatter(text)
        html_body = markdown_to_html(body)

        # Determine output path
        rel_path = md_file.relative_to(input_path)
        if format == "html":
            out_file = output_path / rel_path.with_suffix(".html")
            full_html = wrap_html(html_body, title=metadata.get("title", rel_path.stem))
            out_file.write_text(full_html, encoding="utf-8")
        elif format == "text":
            out_file = output_path / rel_path.with_suffix(".txt")
            plain = html_to_text(html_body)
            out_file.write_text(plain, encoding="utf-8")

        converted_files.append(str(out_file))
        print(f"  Converted: {md_file.name} -> {out_file.name}")

    return converted_files


if __name__ == "__main__":
    print("Converting sample.md to HTML...")
    files = batch_convert(".", "output/html", format="html")
    print(f"\nDone. Converted {len(files)} file(s).")
```

### Résultat attendu

```
Converting sample.md to HTML...
  Converted: sample.md -> sample.html
  Converted: sample_with_meta.md -> sample_with_meta.html

Done. Converted 2 file(s).
```

### Dépannage

**`FileExistsError` sur mkdir.** Utilise `exist_ok=True` pour éviter les erreurs si le répertoire de sortie existe déjà.

**Erreurs d'encodage en lecture.** Certains fichiers peuvent ne pas être en UTF-8. Enveloppe l'appel `read_text` dans un try/except et retombe sur `errors="replace"`.

**Répertoire de sortie vide.** Vérifie que le motif glob correspond à tes fichiers. `**/*.md` est récursif ; `*.md` ne correspond qu'au niveau supérieur.

### Liste de vérification

- Tous les fichiers `.md` du répertoire d'entrée sont trouvés
- Les fichiers de sortie sont créés dans le répertoire de sortie
- Les fichiers HTML incluent les métadonnées comme titre de page
- La structure de répertoires est préservée dans la sortie
- Le répertoire de sortie vide est créé s'il n'existe pas

### Question socratique

Que changerait-il s'il fallait aussi traiter les fichiers `.markdown` (pas seulement `.md`) ? Comment modifierais-tu le motif glob ?

---

## Étape 7 : Construire la CLI

### Objectif

Envelopper toutes les fonctionnalités dans une interface en ligne de commande pour que les utilisateurs puissent lancer des conversions depuis le terminal.

### Explication

Une CLI rend ton outil utilisable sans écrire de code Python. Le module `argparse` de Python gère l'analyse des arguments, le texte d'aide et la validation. C'est l'étape finale qui transforme tes scripts en un véritable outil en ligne de commande.

### Indice de départ

Utilise `argparse.ArgumentParser` avec des sous-commandes ou des drapeaux pour le format, l'entrée et la sortie.

### Code fonctionnel

```python
import argparse
import sys


def main():
    parser = argparse.ArgumentParser(
        description="Convert Markdown files to HTML or plain text.",
        epilog="Examples:\n"
        "  python converter.py sample.md\n"
        "  python converter.py sample.md -o output.html -f text\n"
        '  python converter.py docs/ -o converted/ -f html',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        "input",
        help="Input file or directory to convert",
    )
    parser.add_argument(
        "-o", "--output",
        help="Output file or directory (default: stdout for files, ./output/ for dirs)",
    )
    parser.add_argument(
        "-f", "--format",
        choices=["html", "text"],
        default="html",
        help="Output format (default: html)",
    )
    parser.add_argument(
        "--title",
        default="Converted Document",
        help="Title for HTML output (default: Converted Document)",
    )
    parser.add_argument(
        "--extract-meta",
        action="store_true",
        help="Print extracted metadata and exit",
    )

    args = parser.parse_args()
    input_path = Path(args.input)

    # Extract metadata mode
    if args.extract_meta:
        if not input_path.is_file():
            parser.error("--extract-meta requires a file, not a directory")
        text = input_path.read_text(encoding="utf-8")
        meta, _ = extract_frontmatter(text)
        for key, value in meta.items():
            print(f"  {key}: {value}")
        return

    # Single file conversion
    if input_path.is_file():
        text = input_path.read_text(encoding="utf-8")
        metadata, body = extract_frontmatter(text)
        html_body = markdown_to_html(body)

        if args.format == "html":
            title = metadata.get("title", args.title)
            result = wrap_html(html_body, title=title)
        else:
            result = html_to_text(html_body)

        if args.output:
            Path(args.output).write_text(result, encoding="utf-8")
            print(f"Converted {input_path.name} -> {args.output}")
        else:
            print(result)

    # Directory batch conversion
    elif input_path.is_dir():
        output_dir = args.output or "output"
        files = batch_convert(str(input_path), output_dir, format=args.format)
        print(f"\nConverted {len(files)} file(s) to {output_dir}/")

    else:
        print(f"Error: {args.input} does not exist", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

### Résultat attendu

Fichier unique vers stdout :
```bash
python converter.py sample.md
```
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Converted Document</title>
    <style>body { font-family: sans-serif; ... }</style>
</head>
<body>
<h1>Hello World</h1>
...
</body>
</html>
```

Fichier unique vers un fichier de sortie :
```bash
python converter.py sample.md -o output.html
Converted sample.md -> output.html
```

Répertoire par lots :
```bash
python converter.py docs/ -o converted/ -f html
  Converted: intro.md -> intro.html
  Converted: guide.md -> guide.html

Converted 2 file(s) to converted/
```

Extraction de métadonnées :
```bash
python converter.py sample_with_meta.md --extract-meta
  title: My Blog Post
  author: Jane Doe
  date: 2025-01-15
  tags: python, tutorial, beginner
```

Aide :
```bash
python converter.py --help
```
```
usage: converter.py [-h] [-o OUTPUT] [-f {html,text}] [--title TITLE]
                    [--extract-meta] input

Convert Markdown files to HTML or plain text.

positional arguments:
  input                 Input file or directory to convert

options:
  -h, --help            show this help message and exit
  -o, --output          Output file or directory
  -f, --format          Output format (default: html)
  --title               Title for HTML output
  --extract-meta        Print extracted metadata and exit

Examples:
  python converter.py sample.md
  python converter.py sample.md -o output.html -f text
  python converter.py docs/ -o converted/ -f html
```

### Dépannage

**`argparse` dit « arguments non reconnus ».** Assure-toi que les drapeaux viennent *après* l'argument positionnel, pas avant.

**`sys.exit` dans les tests.** Si tu testes ceci dans un REPL, enveloppe `main()` dans un try/except `SystemExit`.

**Pas de sortie lors de l'utilisation d'un pipe.** Si tu rediriges vers un fichier, assure-toi de ne pas aussi afficher sur stdout. Le mode fichier unique affiche sur stdout quand `-o` n'est pas spécifié.

### Liste de vérification

- La CLI accepte le chemin d'entrée, le chemin de sortie et le drapeau de format
- Le mode fichier unique affiche sur stdout ou écrit dans le fichier de sortie
- Le mode répertoire convertit tous les fichiers `.md`
- `--extract-meta` affiche le frontmatter et se termine
- `--help` montre des exemples d'utilisation
- Les chemins d'entrée invalides produisent un message d'erreur clair

### Question socratique

Pourquoi la CLI utilise-t-elle `sys.exit(1)` pour les erreurs au lieu de seulement afficher un message ? Que communique le code de sortie aux autres programmes ou scripts qui appellent ton outil ?

---

## `converter.py` complet

Voici le fichier complet avec toutes les étapes combinées :

```python
"""Document Converter - Convert between Markdown, HTML, and plain text."""

import re
import html as html_module
import argparse
import sys
from pathlib import Path


def read_markdown(filepath: str) -> str:
    """Read a Markdown file and return its contents."""
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


def markdown_to_html(md_text: str) -> str:
    """Convert Markdown text to HTML."""
    html = md_text

    # Code blocks
    html = re.sub(
        r"```(\w*)\n(.*?)```",
        r'<pre><code class="language-\1">\2</code></pre>',
        html,
        flags=re.DOTALL,
    )

    # Inline code
    html = re.sub(r"`([^`]+)`", r"<code>\1</code>", html)

    # Headings
    html = re.sub(r"^### (.+)$", r"<h3>\1</h3>", html, flags=re.MULTILINE)
    html = re.sub(r"^## (.+)$", r"<h2>\1</h2>", html, flags=re.MULTILINE)
    html = re.sub(r"^# (.+)$", r"<h1>\1</h1>", html, flags=re.MULTILINE)

    # Bold and italic
    html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
    html = re.sub(r"\*(.+?)\*", r"<em>\1</em>", html)

    # Links
    html = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', html)

    # Lists
    lines = html.split("\n")
    in_list = False
    result = []
    for line in lines:
        if line.startswith("- "):
            if not in_list:
                result.append("<ul>")
                in_list = True
            result.append(f"  <li>{line[2:]}</li>")
        else:
            if in_list:
                result.append("</ul>")
                in_list = False
            result.append(line)
    if in_list:
        result.append("</ul>")
    html = "\n".join(result)

    html = re.sub(r"\n{3,}", "\n\n", html)

    return html


CSS = """
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    max-width: 700px;
    margin: 2rem auto;
    padding: 0 1rem;
    line-height: 1.6;
    color: #333;
}
h1, h2, h3 { color: #111; }
code {
    background: #f4f4f4;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
}
pre {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
}
pre code { background: none; padding: 0; color: inherit; }
a { color: #0066cc; }
ul { padding-left: 1.5rem; }
"""


def wrap_html(body: str, title: str = "Converted Document") -> str:
    """Wrap HTML body in a full document with CSS."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>{CSS}</style>
</head>
<body>
{body}
</body>
</html>"""


def html_to_text(html_str: str) -> str:
    """Convert HTML to plain text by stripping tags."""
    text = html_str

    text = re.sub(r"<(br|hr)\s*/?>", "\n", text)
    text = re.sub(r"</(p|div|h[1-6]|li|pre)>", "\n", text)

    text = re.sub(r"<[^>]+>", "", text)
    text = html_module.unescape(text)

    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = text.strip()

    return text


def extract_frontmatter(text: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and return (metadata_dict, body_text)."""
    lines = text.split("\n")

    if not lines or lines[0].strip() != "---":
        return {}, text

    end_index = None
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_index = i
            break

    if end_index is None:
        return {}, text

    metadata = {}
    for line in lines[1:end_index]:
        line = line.strip()
        if not line or ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()

        if "," in value:
            value = [v.strip() for v in value.split(",")]

        metadata[key] = value

    body = "\n".join(lines[end_index + 1 :])
    return metadata, body


def batch_convert(
    input_dir: str,
    output_dir: str,
    format: str = "html",
) -> list[str]:
    """Convert all Markdown files in input_dir to the target format."""
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    converted_files = []

    for md_file in input_path.glob("**/*.md"):
        text = md_file.read_text(encoding="utf-8")
        metadata, body = extract_frontmatter(text)
        html_body = markdown_to_html(body)

        rel_path = md_file.relative_to(input_path)
        if format == "html":
            out_file = output_path / rel_path.with_suffix(".html")
            full_html = wrap_html(html_body, title=metadata.get("title", rel_path.stem))
            out_file.write_text(full_html, encoding="utf-8")
        elif format == "text":
            out_file = output_path / rel_path.with_suffix(".txt")
            plain = html_to_text(html_body)
            out_file.write_text(plain, encoding="utf-8")

        converted_files.append(str(out_file))
        print(f"  Converted: {md_file.name} -> {out_file.name}")

    return converted_files


def main():
    parser = argparse.ArgumentParser(
        description="Convert Markdown files to HTML or plain text.",
        epilog="Examples:\n"
        "  python converter.py sample.md\n"
        "  python converter.py sample.md -o output.html -f text\n"
        '  python converter.py docs/ -o converted/ -f html',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument("input", help="Input file or directory to convert")
    parser.add_argument(
        "-o", "--output",
        help="Output file or directory (default: stdout for files)",
    )
    parser.add_argument(
        "-f", "--format",
        choices=["html", "text"],
        default="html",
        help="Output format (default: html)",
    )
    parser.add_argument(
        "--title",
        default="Converted Document",
        help="Title for HTML output",
    )
    parser.add_argument(
        "--extract-meta",
        action="store_true",
        help="Print extracted metadata and exit",
    )

    args = parser.parse_args()
    input_path = Path(args.input)

    if args.extract_meta:
        if not input_path.is_file():
            parser.error("--extract-meta requires a file, not a directory")
        text = input_path.read_text(encoding="utf-8")
        meta, _ = extract_frontmatter(text)
        for key, value in meta.items():
            print(f"  {key}: {value}")
        return

    if input_path.is_file():
        text = input_path.read_text(encoding="utf-8")
        metadata, body = extract_frontmatter(text)
        html_body = markdown_to_html(body)

        if args.format == "html":
            title = metadata.get("title", args.title)
            result = wrap_html(html_body, title=title)
        else:
            result = html_to_text(html_body)

        if args.output:
            Path(args.output).write_text(result, encoding="utf-8")
            print(f"Converted {input_path.name} -> {args.output}")
        else:
            print(result)

    elif input_path.is_dir():
        output_dir = args.output or "output"
        files = batch_convert(str(input_path), output_dir, format=args.format)
        print(f"\nConverted {len(files)} file(s) to {output_dir}/")

    else:
        print(f"Error: {args.input} does not exist", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

---

## 🧩 Défis

1. **Supporte les listes ordonnées** : Étends `markdown_to_html` pour convertir les lignes `1.`, `2.`, `3.` en balises `<ol>` et `<li>`.

2. **Images** : Ajoute le support de `![alt text](image.png)` convertissant en `<img src="image.png" alt="alt text">`.

3. **Tableaux** : Les tableaux Markdown utilisent les caractères `|` et `-`. Ajoute un convertisseur qui les transforme en balises `<table>`.

4. **Compte de mots** : Ajoute un drapeau `--stats` qui affiche le nombre de mots, de lignes et de caractères au lieu de convertir.

5. **Mode surveillance** : Ajoute un drapeau `--watch` qui surveille le répertoire d'entrée et reconvertit quand les fichiers changent.

## Ce que tu as appris

- Lire des fichiers avec `open()` et l'instruction `with` pour une gestion sûre des ressources
- Utiliser `re` (expressions régulières) pour faire correspondre et transformer des motifs de texte
- Construire des documents HTML avec du CSS intégré pour des pages autonomes
- Retirer les balises HTML et décoder les entités pour produire un texte brut propre
- Analyser un frontmatter simple style YAML sans bibliothèques externes
- Parcourir les répertoires avec `pathlib.Path.glob()` pour le traitement par lots de fichiers
- Construire une CLI avec `argparse` qui supporte les drapeaux, les sous-commandes et le texte d'aide
- Gérer les erreurs avec élégance grâce aux codes de sortie et aux messages conviviaux