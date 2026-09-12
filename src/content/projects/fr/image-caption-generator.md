---
title: "Générateur de Descriptions d'Images"
description: "Génère des descriptions en langage naturel pour les images en utilisant des modèles vision-langage."
difficulty: "intermediate"
estimatedMinutes: 45
tags: ["ai", "computer-vision", "cli"]
learningObjectives:
  - "Charger et prétraiter des images pour une entrée de modèle vision-langage"
  - "Envoyer des images à une API de vision gratuite et analyser les réponses de descriptions"
  - "Traiter des lots d'images avec un suivi de progression"
  - "Intégrer les descriptions générées dans les métadonnées EXIF des images"
prerequisites: ["Python 101"]
---

# 🖼️ Construire un Générateur de Descriptions d'Images

Chaque photo sur le web a besoin d'une description textuelle, pour l'accessibilité, pour les moteurs de recherche, pour les personnes qui ne peuvent pas charger l'image. Écrire les descriptions à la main est lent ; un modèle vision-langage peut les générer en quelques secondes. Ce projet construit un outil CLI qui prend une image (depuis un chemin de fichier ou une URL) et produit une description lisible par l'humain en utilisant une API de vision gratuite. Tu géreras le prétraitement des images, les appels API, le traitement par lots avec suivi de progression, et même l'écriture des descriptions dans les métadonnées des images.

Cela suppose Python 101, rien de Analyse de Données n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Mettre en place un projet avec `uv` et installer les dépendances dont tu auras besoin.
2. Charger et redimensionner des images avec Pillow pour l'envoi à l'API.
3. Envoyer une image à un modèle vision-langage gratuit et analyser la description retournée.
4. Construire un processeur par lots qui gère des répertoires d'images avec un suivi de progression.
5. Intégrer les descriptions générées dans les métadonnées EXIF des images pour un stockage portable.
6. Câbler le tout dans un CLI qui décrit des images individuelles ou des dossiers entiers.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal, cet outil lit des fichiers d'images depuis le disque et écrit des images modifiées avec des métadonnées intégrées.

**Google Colab, Kaggle Notebooks et Binder** fonctionnent pour essayer l'outil. Le notebook utilise le même code et inclut des images d'exemple pour les tests. Tu auras besoin d'une clé API gratuite (GitHub Models, Gemini ou Groq) définie comme variable d'environnement.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/image-caption-generator/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/image-caption-generator/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fimage-caption-generator%2Fnotebook.fr.ipynb)

## Configuration

Tout ce dont tu as besoin avant de décrire des images : un environnement Python, une bibliothèque d'images, un client HTTP et une clé API gratuite.

### Installe `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Ferme et rouvre ton terminal, puis confirme :

```bash
uv --version
```

### Met en place le projet

```bash
uv init image-caption-generator
cd image-caption-generator
uv add Pillow requests click python-dotenv
```

`Pillow` gère le chargement des images, le redimensionnement et les métadonnées EXIF. `requests` envoie les images à l'API de vision. `click` construit le CLI, et `python-dotenv` charge ta clé API depuis un fichier `.env`.

### Obtiens une clé API de vision gratuite

Tu as besoin d'un fournisseur qui prend en charge les entrées d'images. GitHub Models et Gemini fonctionnent tous les deux :

| Fournisseur | Où obtenir une clé | Modèle de vision |
|---|---|---|
| **GitHub Models** *(suggéré)* | [github.com/settings/tokens](https://github.com/settings/tokens) avec le scope `models: read` | `gpt-4o-mini` |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | `gemini-1.5-flash` |

```bash
# .env
GITHUB_TOKEN=your-key-here
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `image-caption-generator/` existe avec un `pyproject.toml`, et `Pillow`, `requests`, `click` et `python-dotenv` sont installés.
- ✅ Tu as un fichier `.env` avec une clé API valide, pas collée dans un script.

## Étape 1 : Charge et prétraite les images

Les API de vision ont des limites de taille, envoyer une photo brute de 20 Mo gaspille de la bande passante et peut être rejeté. Le prétraitement charge l'image, la redimensionne à une dimension raisonnable et la convertit dans un format que l'API accepte (JPEG ou PNG encodé en base64).

### 1.1 Charge et redimensionne une image

**👟 Indice de départ :** Crée `caption/preprocess.py` avec une fonction qui charge une image et la redimensionne pour tenir dans 1024×1024 pixels.

```python
# caption/preprocess.py
from PIL import Image
import base64
from io import BytesIO
from pathlib import Path

MAX_DIMENSION = 1024

def load_and_resize(image_path: str) -> Image.Image:
    """Load an image and resize it to fit within MAX_DIMENSION."""
    img = Image.open(image_path)
    img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)
    return img

def image_to_base64(img: Image.Image, format: str = "JPEG") -> str:
    """Convert a PIL Image to a base64-encoded string."""
    buffer = BytesIO()
    img.convert("RGB").save(buffer, format=format)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
```

La méthode `thumbnail` redimensionne l'image en préservant son ratio d'aspect, une photo de 4000×3000 devient 1024×768, pas un 1024×1024 déformé. L'appel `convert("RGB")` garantit que l'image est dans un format que JPEG peut encoder, même si l'original était en RGBA (PNG transparent) ou en niveaux de gris. La chaîne base64 est ce que l'API attend dans le corps de la requête.

**🎯 Résultat attendu :** `load_and_resize("photo.jpg")` retourne une image PIL avec les deux dimensions ≤ 1024. `image_to_base64(img)` retourne une longue chaîne de caractères (A-Z, a-z, 0-9, +, /).

**🩹 Si ça ne marche pas :** Si `thumbnail` ne redimensionne pas, c'est que l'image est déjà plus petite que le maximum, c'est un comportement correct, pas un bug. Si l'encodage `base64` échoue, le format de l'image peut ne pas être pris en charge par PIL.

### 1.2 Vérifie le prétraitement

```python
from caption.preprocess import load_and_resize, image_to_base64
from PIL import Image

# Create a test image
img = Image.new("RGB", (2000, 1500), color="red")
img.save("/tmp/test_large.jpg")

# Resize
small = load_and_resize("/tmp/test_large.jpg")
assert small.width <= 1024
assert small.height <= 1024

# Encode
b64 = image_to_base64(small)
assert len(b64) > 100  # base64 string is non-trivial
```

**🎯 Résultat attendu :** Toutes les assertions passent ; l'image redimensionnée tient dans 1024×1024 et la chaîne base64 n'est pas vide.

**🩹 Si ça ne marche pas :** Si la largeur ou la hauteur dépasse encore 1024, `thumbnail` n'est pas appelée, vérifie que la méthode est enchaînée sur l'objet `img`.

### 1.3 Vérifie le prétraitement des images

**✅ Liste de vérification**

- ✅ `load_and_resize` retourne une image avec les deux dimensions ≤ 1024.
- ✅ Le ratio d'aspect est préservé (ni étiré ni écrasé).
- ✅ `image_to_base64` retourne une chaîne base64 valide.

**🤔 Question(s) socratique(s)**

- Pourquoi redimensionner à 1024×1024 au lieu d'envoyer l'image en pleine résolution ? Quel est le coût d'envoyer une photo de 20 Mo à une API de vision par rapport à une version redimensionnée de 200 Ko ?
- Si l'image d'entrée est une capture d'écran (1920×1080), la miniature fait 1024×576. Qu'est-ce qui changerait si tu avais besoin de recadrages carrés pour une application de réseaux sociaux ?

## Étape 2 : Envoie une image à une API de vision et analyse la description

L'API de vision prend une image et un prompt texte, et retourne une description. Tu utiliseras l'endpoint compatible OpenAI (qui fonctionne pour GitHub Models, Gemini et d'autres) pour envoyer l'image comme URL de données base64.

### 2.1 Écris l'appelant API

**👟 Indice de départ :** Crée `caption/api.py` avec une fonction qui envoie une image au modèle de vision et retourne la description.

```python
# caption/api.py
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def get_client() -> OpenAI:
    """Create an OpenAI-compatible client for GitHub Models."""
    return OpenAI(
        api_key=os.environ.get("GITHUB_TOKEN", ""),
        base_url="https://models.github.ai/inference",
    )

def caption_image(client: OpenAI, image_b64: str, prompt: str = "Describe this image in one detailed sentence.") -> str:
    """Send a base64 image to the vision model and return the caption."""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
            ],
        }],
        max_tokens=200,
    )
    return response.choices[0].message.content.strip()
```

Le format `data:image/jpeg;base64,{image_b64}` est la façon dont les API de vision acceptent les images en ligne, le modèle reçoit les données de pixels brutes encodées en texte, et non une URL qu'il devrait aller chercher. `max_tokens=200` garde des descriptions concises. Le prompt est configurable pour que tu puisses demander différents styles de description (« une phrase », « paragraphe détaillé », « texte alternatif pour lecteurs d'écran »).

**🎯 Résultat attendu :** `caption_image(client, base64_string)` retourne une chaîne comme "A red bicycle parked against a brick wall on a sunny afternoon."

**🩹 Si ça ne marche pas :** Si l'API retourne une erreur, vérifie que la variable d'environnement `GITHUB_TOKEN` est définie. Si la réponse est vide, le modèle ne prend peut-être pas en charge la vision, essaie un autre nom de modèle.

### 2.2 Gère les erreurs avec élégance

```python
# caption/api.py (continued)
def safe_caption(client: OpenAI, image_b64: str, prompt: str = "Describe this image.") -> str:
    """Caption an image with error handling."""
    try:
        return caption_image(client, image_b64, prompt)
    except Exception as e:
        return f"[Error: {e}]"
```

**🎯 Résultat attendu :** Si l'appel API réussit, retourne la description. S'il échoue (erreur réseau, clé invalide, limite de débit), retourne une chaîne d'erreur au lieu de planter.

**🩹 Si ça ne marche pas :** Si les erreurs ne sont pas attrapées, le bloc `try/except` est manquant ou le type d'exception n'est pas assez large.

### 2.3 Vérifie l'appelant API

**✅ Liste de vérification**

- ✅ `caption_image` retourne une chaîne (la description) pour une image valide.
- ✅ `safe_caption` retourne un message d'erreur au lieu de planter en cas d'échec.
- ✅ Le client peut être créé depuis un fichier `.env` sans coder en dur la clé.

**🤔 Question(s) socratique(s)**

- La description est une chaîne. Si tu voulais une sortie structurée (objets, couleurs, type de scène), comment changerais-tu le prompt pour obtenir un JSON analysable de la part du modèle ?
- Si tu envoies la même image deux fois avec des prompts différents, tu obtiens des descriptions différentes. Comment évaluerais-tu quel prompt produit les descriptions les plus utiles pour ton cas d'usage ?

## Étape 3 : Construis un processeur par lots avec suivi de progression

Décrire une image est simple ; décrire un répertoire de 500 images nécessite un suivi de progression, une gestion d'erreur par image et un résumé de ce qui a fonctionné.

### 3.1 Écris le processeur par lots

**👟 Indice de départ :** Crée `caption/batch.py` avec une fonction qui traite un répertoire d'images.

```python
# caption/batch.py
from pathlib import Path
from caption.preprocess import load_and_resize, image_to_base64
from caption.api import get_client, safe_caption

def caption_directory(
    directory: str,
    extensions: tuple[str, ...] = (".jpg", ".jpeg", ".png", ".webp"),
) -> list[dict]:
    """Caption all images in a directory. Returns a list of {path, caption, error} dicts."""
    client = get_client()
    results = []
    image_files = sorted(
        p for p in Path(directory).iterdir()
        if p.suffix.lower() in extensions
    )
    total = len(image_files)
    for i, path in enumerate(image_files, 1):
        print(f"[{i}/{total}] {path.name}...", end=" ", flush=True)
        try:
            img = load_and_resize(str(path))
            b64 = image_to_base64(img)
            caption = safe_caption(client, b64)
            results.append({"path": str(path), "caption": caption, "error": None})
            print("OK")
        except Exception as e:
            results.append({"path": str(path), "caption": None, "error": str(e)})
            print(f"FAIL: {e}")
    print(f"\nDone: {total - len([r for r in results if r['error']])}/{total} succeeded")
    return results
```

La fonction parcourt le répertoire, filtre par extension d'image et traite chaque fichier avec un compteur de progression. `end=" "` et `flush=True` sur le `print` gardent la progression sur une seule ligne. Chaque résultat est un dictionnaire avec le chemin, la description et l'erreur (s'il y en a une), cela rend facile le filtrage des succès et des échecs ensuite.

**🎯 Résultat attendu :** Pour un répertoire avec 5 images, la sortie affiche `[1/5] photo1.jpg... OK` jusqu'à `[5/5] photo5.jpg... OK`, et se termine par "Done: 5/5 succeeded".

**🩹 Si ça ne marche pas :** Si aucun fichier n'est trouvé, vérifie que le chemin est correct et que les fichiers ont des extensions d'image. Si tous les fichiers échouent avec la même erreur, la clé API est probablement invalide.

### 3.2 Ajoute une limitation de débit

```python
# caption/batch.py (continued)
import time

def caption_directory_with_delay(
    directory: str,
    delay_seconds: float = 1.0,
    **kwargs,
) -> list[dict]:
    """Caption with a delay between API calls to respect rate limits."""
    client = get_client()
    results = []
    image_files = sorted(
        p for p in Path(directory).iterdir()
        if p.suffix.lower() in kwargs.get("extensions", (".jpg", ".jpeg", ".png", ".webp"))
    )
    total = len(image_files)
    for i, path in enumerate(image_files, 1):
        print(f"[{i}/{total}] {path.name}...", end=" ", flush=True)
        try:
            img = load_and_resize(str(path))
            b64 = image_to_base64(img)
            caption = safe_caption(client, b64)
            results.append({"path": str(path), "caption": caption, "error": None})
            print("OK")
        except Exception as e:
            results.append({"path": str(path), "caption": None, "error": str(e)})
            print(f"FAIL: {e}")
        if i < total:
            time.sleep(delay_seconds)
    return results
```

Les fournisseurs de niveau gratuit imposent souvent des limites de débit (requêtes par minute). L'appel `time.sleep(delay_seconds)` entre les requêtes t'empêche d'atteindre ces limites et de te faire limiter. Une seconde entre les requêtes est assez conservateur pour la plupart des fournisseurs.

**🎯 Résultat attendu :** Le processeur par lots fait une brève pause entre chaque image, et toutes les requêtes réussissent sans erreur 429 (limite de débit).

**🩹 Si ça ne marche pas :** Si tu atteins encore les limites de débit, augmente le délai. Si le lot est trop lent, diminue-le, mais surveille les erreurs.

### 3.3 Vérifie le traitement par lots

**✅ Liste de vérification**

- ✅ `caption_directory` traite tous les fichiers d'images d'un répertoire.
- ✅ La progression est affichée comme `[i/total] nom-du-fichier... OK/FAIL`.
- ✅ Les résultats incluent à la fois les descriptions réussies et les messages d'erreur.

**🤔 Question(s) socratique(s)**

- Si un lot de 1000 images est interrompu à mi-chemin (erreur réseau, Ctrl+C), comment reprendrais-tu à l'endroit où tu t'es arrêté au lieu de redécrire les 500 premières ?
- Le processeur par lots affiche la progression sur stdout. Pour un vrai outil, comment ajouterais-tu une barre de progression (comme `tqdm`) qui montre l'ETA et le débit ?

## Étape 4 : Intègre les descriptions dans les métadonnées EXIF des images

Stocker les descriptions comme fichiers texte séparés est fragile, la description est séparée de l'image. Les métadonnées EXIF sont intégrées au fichier image lui-même, donc la description voyage avec l'image où qu'elle aille.

### 4.1 Écris les métadonnées EXIF

**👟 Indice de départ :** Crée `caption/metadata.py` avec une fonction qui écrit une description dans le champ EXIF UserComment d'une image.

```python
# caption/metadata.py
from PIL import Image
from PIL.ExifTags import Base as ExifBase
import piexif

def write_caption_to_exif(image_path: str, caption: str, output_path: str | None = None):
    """Write a caption into an image's EXIF UserComment field."""
    output = output_path or image_path
    img = Image.open(image_path)

    # Build EXIF data
    exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}}

    # UserComment tag (0x9286)
    exif_dict["Exif"][piexif.ExifIFD.UserComment] = caption.encode("utf-8")

    # Write back
    exif_bytes = piexif.dump(exif_dict)
    img.save(output, exif=exif_bytes, quality=95)
    print(f"Caption written to {output}")
```

Le tag EXIF `UserComment` (0x9286) est le champ standard pour les métadonnées textuelles arbitraires dans les images. Utiliser `piexif` te donne un accès direct à la structure EXIF brute au lieu de dépendre du support limité d'EXIF de Pillow. Le paramètre `output_path` te permet d'écrire dans un nouveau fichier au lieu de modifier l'original.

**🎯 Résultat attendu :** `write_caption_to_exif("photo.jpg", "A sunset over the ocean")` enregistre l'image avec la description intégrée dans ses données EXIF.

**🩹 Si ça ne marche pas :** Si `piexif` n'est pas installé, ajoute-le : `uv add piexif`. Si les données EXIF sont perdues après l'enregistrement, le paramètre de qualité peut provoquer un ré-encodage, essaie `quality=100`.

### 4.2 Lis les descriptions EXIF

```python
# caption/metadata.py (continued)
def read_caption_from_exif(image_path: str) -> str | None:
    """Read the caption from an image's EXIF UserComment field."""
    try:
        img = Image.open(image_path)
        exif = img.getexif()
        if piexif.ExifIFD.UserComment in exif:
            return exif[piexif.ExifIFD.UserComment].decode("utf-8")
    except Exception:
        pass
    return None
```

**🎯 Résultat attendu :** Relire la description retourne exactement la chaîne qui a été écrite.

**🩹 Si ça ne marche pas :** Si la lecture retourne `None` après l'écriture, le numéro du tag EXIF peut ne pas correspondre, vérifie `piexif.ExifIFD.UserComment`.

### 4.3 Vérifie l'intégration EXIF

**✅ Liste de vérification**

- ✅ `write_caption_to_exif` intègre la description dans le fichier image.
- ✅ `read_caption_from_exif` retourne la chaîne exacte de la description.
- ✅ L'image modifiée est visuellement identique à l'originale.

**🤔 Question(s) socratique(s)**

- Les métadonnées EXIF sont supprimées par la plupart des plateformes de médias sociaux et des applications de messagerie. Si tu avais besoin que les descriptions survivent au téléversement, où d'autre les stockerais-tu ?
- Si tu voulais intégrer des descriptions dans plusieurs langues, comment les stockerais-tu dans EXIF sans écraser la langue précédente ?

## Étape 5 : Construis le CLI

Câble le tout ensemble avec des commandes pour la description d'images individuelles, le traitement par lots et les opérations de métadonnées.

### 5.1 Construis le CLI

**👟 Indice de départ :** Crée `caption/cli.py` avec les sous-commandes `caption`, `batch` et `embed`.

```python
# caption/cli.py
import json
import click
from caption.preprocess import load_and_resize, image_to_base64
from caption.api import get_client, safe_caption
from caption.batch import caption_directory
from caption.metadata import write_caption_to_exif

@click.group()
def cli():
    """Image Caption Generator — caption images with AI vision models."""
    pass

@cli.command()
@click.argument("image_path", type=click.Path(exists=True))
@click.option("--prompt", default="Describe this image in one detailed sentence.")
def caption(image_path, prompt):
    """Generate a caption for a single image."""
    client = get_client()
    img = load_and_resize(image_path)
    b64 = image_to_base64(img)
    result = safe_caption(client, b64, prompt)
    click.echo(f"Caption: {result}")

@cli.command()
@click.argument("directory", type=click.Path(exists=True))
@click.option("--output", "-o", default="captions.json", help="Output JSON file")
def batch(directory, output):
    """Caption all images in a directory."""
    results = caption_directory(directory)
    with open(output, "w") as f:
        json.dump(results, f, indent=2)
    click.echo(f"Results saved to {output}")

@cli.command()
@click.argument("image_path", type=click.Path(exists=True))
@click.option("--caption-text", "-c", required=True, help="Caption to embed")
def embed(image_path, caption_text):
    """Embed a caption into an image's EXIF metadata."""
    write_caption_to_exif(image_path, caption_text)
    click.echo("Caption embedded successfully")

if __name__ == "__main__":
    cli()
```

Les trois commandes correspondent aux trois principaux cas d'usage : décrire une image (test rapide), décrire un répertoire (travail par lots) et intégrer une description (gestion des métadonnées). Chaque commande délègue au code de la bibliothèque et affiche un résultat lisible par l'humain.

**🎯 Résultat attendu :** `uv run python -m caption.cli caption photo.jpg` affiche "Caption: A red bicycle parked against a wall."

**🩹 Si ça ne marche pas :** Si `get_client()` échoue, vérifie ton fichier `.env`. Si le chemin de l'image n'est pas trouvé, lance la commande depuis le répertoire qui contient l'image.

### 5.2 Test de fumée de bout en bout

```python
from caption.preprocess import load_and_resize, image_to_base64
from caption.metadata import write_caption_to_exif, read_caption_from_exif
from PIL import Image

# Create a test image
img = Image.new("RGB", (800, 600), color="blue")
img.save("/tmp/test_caption.jpg")

# Preprocess
small = load_and_resize("/tmp/test_caption.jpg")
b64 = image_to_base64(small)
assert len(b64) > 100

# Metadata round-trip
write_caption_to_exif("/tmp/test_caption.jpg", "A blue rectangle")
capt = read_caption_from_exif("/tmp/test_caption.jpg")
assert capt == "A blue rectangle"
```

Ceci teste le pipeline complet : créer, prétraiter, encoder, intégrer, relire. Chaque morceau a été testé individuellement ; ceci confirme que le passage entre eux est propre.

**🎯 Résultat attendu :** Toutes les assertions passent ; la description fait l'aller-retour à travers les métadonnées EXIF.

**🩹 Si ça ne marche pas :** Si la lecture EXIF échoue, vérifie que `piexif` est installé et que le fichier n'a pas été corrompu par l'écriture.

### 5.3 Vérifie le pipeline CLI

**✅ Liste de vérification**

- ✅ `caption` génère une description textuelle pour une image individuelle.
- ✅ `batch` traite toutes les images d'un répertoire et enregistre les résultats en JSON.
- ✅ `embed` écrit une description dans les métadonnées EXIF qui peut être relue.

**🤔 Question(s) socratique(s)**

- Si tu voulais décrire des images depuis des URLs au lieu de fichiers locaux, qu'est-ce qui changerait dans l'étape de prétraitement ?
- Comment ajouterais-tu une commande `--compare` qui décrit la même image avec deux prompts différents et affiche les différences côte à côte ?

## ⚠️ Pièges courants

- **Envoyer des images en pleine résolution à l'API.** Une photo de 20 Mo gaspille de la bande passante, coûte plus de tokens et peut dépasser la limite de taille de l'API. Redimensionne toujours à ≤ 1024 pixels sur le côté le plus long avant d'envoyer.
- **Oublier que les données EXIF sont supprimées au téléversement.** La plupart des plateformes de médias sociaux et des applications de messagerie retirent les métadonnées EXIF. Si tes descriptions doivent survivre au téléversement, stocke-les aussi dans un fichier compagnon ou une base de données.
- **Ne pas gérer les limites de débit de l'API en mode batch.** Les fournisseurs de niveau gratuit limitent les requêtes par minute. Sans délai entre les requêtes dans le traitement par lots, tu atteindras des erreurs 429 après quelques images.
- **Envoyer des images RGBA à l'encodage JPEG.** JPEG ne supporte pas la transparence. L'appel `convert("RGB")` dans `image_to_base64` gère cela, mais l'oublier provoque une erreur `cannot write mode RGBA as JPEG`.
- **Considérer la première description comme vérité absolue.** Les modèles de vision hallucinent parfois des objets qui ne sont pas dans l'image ou manquent des détails évidents. Pour un usage en production, tu ajouterais une étape de vérification ou une relecture humaine.

## Ce que tu viens de construire

Un générateur de descriptions d'images qui prend n'importe quelle image et produit une description lisible par l'humain en utilisant un modèle de vision gratuit. Le pipeline, prétraiter, encoder, décrire, intégrer les métadonnées, gère le cycle de vie complet du texte alternatif généré par IA. Le processeur par lots transforme un dossier de centaines d'images en un fichier JSON de descriptions en quelques minutes, et l'intégration EXIF garantit que les descriptions restent attachées à leurs images.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/image-caption-generator/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/image-caption-generator) dans le dépôt du cours a une version plus riche avec le support de plusieurs fournisseurs, des images d'exemple et le CLI câblé de bout en bout. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute un mode `--compare` qui envoie la même image à deux modèles différents et affiche les descriptions côte à côte pour la comparaison de qualité.
- Construis une interface web avec Gradio ou Streamlit qui te permet de glisser-déposer des images et de voir les descriptions instantanément.
- Implémente une notation de la qualité des descriptions : utilise un second modèle pour noter la précision, le détail et la grammaire de la description sur une échelle de 1 à 5.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓