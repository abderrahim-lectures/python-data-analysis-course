---
title: "Processeur Vidéo"
description: "Traitez des vidéos avec découpage, effets, intégration de sous-titres et conversion de format."
difficulty: "advanced"
estimatedMinutes: 75
tags: ["moviepy", "video-processing", "ffmpeg", "subtitles"]
learningObjectives:
  - Découper et couper des vidéos sur des plages horaires précises avec une précision au niveau de l'image
  - Appliquer des superpositions de texte avec des polices, positions et minutages personnalisés
  - Extraire les pistes audio et générer des images miniatures à partir de n'importe quelle image
  - Convertir entre formats vidéo et compresser pour différents cas d'usage
prerequisites:
  - "Les bases de Python (fonctions, chaînes, f-strings)"
  - "FFmpeg installé sur ton système (couvert dans Configuration)"
  - "Un fichier vidéo d'exemple avec lequel travailler (n'importe quel MP4 convient)"
---

# 🎬 Processeur Vidéo

Le montage vidéo est traditionnellement point-and-click, mais chaque opération — découper, superposer du texte, extraire l'audio, convertir les formats — est en réalité une fonction déterministe appliquée à des images et des plages horaires. Ce projet construit une boîte à outils qui enveloppe MoviePy (qui enveloppe ffmpeg) dans des fonctions Python propres, pour que tu puisses scriptiser les tâches de traitement vidéo de la même façon que tu scriptiserais n'importe quelle autre transformation de données : charger, opérer, sauvegarder.

Cela suppose les bases de Python et une installation fonctionnelle de ffmpeg (couvert dans Configuration). C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Charger un fichier vidéo et inspecter ses métadonnées (durée, résolution, FPS, audio).
2. Découper les vidéos sur des plages horaires précises et extraire les pistes audio.
3. Générer des images miniatures à partir de n'importe quelle image dans une vidéo.
4. Ajouter des superpositions de texte avec contrôle de position, de minutage et de police.
5. Convertir entre formats vidéo et compresser pour la diffusion web.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal et recommandé — MoviePy exige ffmpeg (un binaire au niveau du système, pas un paquet Python), et un vrai système de fichiers pour lire et écrire des fichiers vidéo. Aucun environnement de jeu basé sur un navigateur ne peut faire ça.

**Google Colab** fonctionne avec une petite étape de configuration — ffmpeg est pré-installé sur l'environnement d'exécution de Colab, et tu peux `!pip install moviepy` pour commencer. Tu devras téléverser ta vidéo d'exemple ou en télécharger une depuis une URL. C'est un bon chemin « essaie d'abord » avant de t'engager dans une installation locale.

**JupyterLite ne prend pas en charge MoviePy** — aucun accès au système de fichiers, aucun binaire ffmpeg, et aucune capacité `write_videofile`. Ne l'utilise pas pour ce projet.

**Binder** peut fonctionner si ffmpeg est disponible dans l'image de l'environnement d'exécution, mais est lent et peu fiable pour l'entrée/sortie vidéo. Tiens-toi-en à local ou à Colab.

## Configuration

Tout ce dont tu as besoin avant d'écrire une ligne de traitement vidéo : Python, ffmpeg et MoviePy.

### Installer `uv`

`uv` est un outil unique qui remplace la chaîne habituelle « installer Python, puis installer pip, puis installer un outil d'environnement virtuel, puis installer les paquets » — il peut installer et gérer lui-même les versions de Python, en plus des dépendances de ton projet.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme qu'il est installé :

```bash
uv --version
```

### Installer ffmpeg

ffmpeg est un binaire au niveau du système que MoviePy utilise sous le capot — tu dois l'installer séparément de tout paquet Python. MoviePy lèvera un `FileNotFoundError` clair s'il ne peut pas le trouver.

**macOS** (Homebrew) :

```bash
brew install ffmpeg
```

**Ubuntu / Debian :**

```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows** (Chocolatey) :

```powershell
choco install ffmpeg
```

Confirme qu'il est installé :

```bash
ffmpeg -version
```

### Configurer le projet

```bash
uv init video-processor
cd video-processor
uv add moviepy pillow
```

`moviepy` enveloppe ffmpeg dans une API conviviale pour Python pour charger, éditer et exporter des clips vidéo. `pillow` est utilisé par `generate_thumbnail` pour sauvegarder les images comme images. Les deux sont des paquets Python purs sans dépendances natives — mais ils exigent `ffmpeg` à l'exécution.

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `ffmpeg -version` affiche les infos de version de ffmpeg (pas « command not found »).
- ✅ `video-processor/` existe avec un `pyproject.toml`, et `moviepy` et `pillow` sont installés.

## Étape 1 : Charge une vidéo et inspecte ses métadonnées

Dans toute tâche de traitement vidéo, la première étape est de savoir avec quoi tu travailles : combien de temps, quelle résolution, quel taux d'images, et a-t-elle une piste audio ? `VideoFileClip` charge la vidéo et expose tout cela comme de simples attributs.

### 1.1 Écris le chargeur

```python
from moviepy import VideoFileClip, AudioFileClip, TextClip, concatenate_videoclips
from pathlib import Path

def load_video(path: str) -> VideoFileClip:
    """Load a video file and handle common errors."""
    try:
        clip = VideoFileClip(path)
        return clip
    except FileNotFoundError:
        print(f"Error: File '{path}' not found.")
        raise
    except Exception as e:
        print(f"Error loading video: {e}")
        raise

video = load_video("sample.mp4")
print(f"Duration: {video.duration:.1f} seconds")
print(f"Resolution: {video.size[0]}x{video.size[1]}")
print(f"FPS: {video.fps}")
print(f"Has audio: {video.audio is not None}")
```

**👟 Indice de départ :** `VideoFileClip(path)` charge la vidéo paresseusement — les données d'image réelles sont lues image par image au besoin, donc charger une vidéo de 10 minutes ne consomme pas 10 minutes de RAM. Les attributs `.duration`, `.size` et `.fps` sont lus depuis l'en-tête du fichier par ffmpeg. Vérifie toujours `video.audio is not None` avant d'essayer d'accéder à l'audio — certaines vidéos sont silencieuses.

**🎯 Résultat attendu :** Pour un fichier MP4 typique :
```
Duration: 10.0 seconds
Resolution: 1920x1080
FPS: 30.0
Has audio: True
```

**🩹 Si ça ne marche pas :** Un `FileNotFoundError` signifie que le chemin est faux — utilise un chemin complet ou confirme que tu es dans le bon répertoire. Si tu obtiens une erreur ffmpeg, c'est que ffmpeg n'est pas installé ou pas sur ton `PATH` — exécute `ffmpeg -version` pour confirmer. Une vidéo corrompue ou partiellement téléchargée peut charger les métadonnées mais échouer lors de l'accès aux images plus tard.

### 1.2 Vérifie les métadonnées

**✅ Liste de vérification**

- ✅ `load_video("sample.mp4")` retourne un objet `VideoFileClip` sans erreur.
- ✅ `.duration` est un nombre positif (secondes), `.size` est une liste `[width, height]`, `.fps` est un nombre positif.
- ✅ `.audio` est soit un `AudioFileClip` soit `None`, et tu peux gérer les deux cas.

**🤔 Question(s) socratique(s)**

- Une vidéo a `.fps = 29.97` au lieu de 30. Que signifie la différence de 0,03 pour les opérations au niveau du cadre comme découper exactement à 5,0 secondes — obtiendrais-tu exactement l'image attendue ?
- `.size` te donne `[width, height]` (x d'abord), ce qui est l'inverse de l'ordre mathématique `[row, col]`. Pourquoi les outils vidéo utilisent-ils cette convention, et où le décalage pourrait-il causer un bug dans ton code ?

## Étape 2 : Découpe des vidéos et extrais l'audio

Le découpage est l'opération de montage vidéo la plus courante — prendre un clip entre deux horodatages. Extraire l'audio est tout aussi simple : sépare la piste sonore des images vidéo et sauvegarde-la dans son propre fichier. Les deux opérations produisent de nouveaux fichiers sur le disque.

### 2.1 Découpe et extrais l'audio

```python
def trim_video(video: VideoFileClip, start: float, end: float) -> VideoFileClip:
    """Extract a segment between start and end (in seconds)."""
    if start < 0 or end > video.duration:
        print(f"Warning: clamping to valid range (0–{video.duration:.1f}s)")
        start = max(0, start)
        end = min(video.duration, end)
    return video.subclipped(start, end)

def extract_audio(video: VideoFileClip, output_path: str) -> None:
    """Extract the audio track from a video."""
    if video.audio is None:
        print("No audio track found in this video.")
        return
    video.audio.write_audiofile(output_path)
    print(f"Audio saved to {output_path}")

def generate_thumbnail(video: VideoFileClip, timestamp: float, output_path: str) -> None:
    """Save a single frame as a thumbnail image."""
    frame = video.get_frame(timestamp)
    from PIL import Image
    img = Image.fromarray(frame)
    img.save(output_path, quality=90)
    print(f"Thumbnail at {timestamp}s saved to {output_path}")

clip = trim_video(video, 10, 25)
clip.write_videofile("trimmed.mp4", codec="libx264", audio_codec="aac")

extract_audio(video, "audio_track.wav")

generate_thumbnail(video, 5.0, "thumb.jpg")

video.close()
```

**👟 Indice de départ :** `video.subclipped(start, end)` retourne un nouveau `VideoFileClip` qui ne contient que les images entre `start` et `end` secondes — il ne modifie pas le clip original. `write_videofile` encode ensuite et sauvegarde le clip découpé sur le disque : `codec="libx264"` est le codec vidéo standard, et `audio_codec="aac"` est le codec audio standard. `get_frame(timestamp)` retourne une seule image comme tableau NumPy, que PIL peut sauvegarder comme JPEG ou PNG. Ferme toujours les clips avec `close()` quand tu as fini pour libérer le descripteur de processus ffmpeg.

**🎯 Résultat attendu :**
```
trimmed.mp4 — une vidéo de 15 secondes (de 10s à 25s de l'originale)
audio_track.wav — la piste audio complète
thumb.jpg — une image unique au repère de 5 secondes
```

**🩹 Si ça ne marche pas :** Si `trimmed.mp4` n'a pas d'audio, la vidéo originale n'a probablement pas de piste audio (`video.audio is None`). Si `write_videofile` génère une erreur, c'est que ffmpeg n'est pas installé — les paramètres de codec (`libx264`, `aac`) sont spécifiques à ffmpeg. Si `thumb.jpg` est surtout noir, l'image à cet horodatage est un fondu d'entrée ou un écran titre — essaie un horodatage différent.

### 2.2 Vérifie le découpage et l'extraction

**✅ Liste de vérification**

- ✅ `trimmed.mp4` existe et a une durée égale à `end - start` secondes.
- ✅ `audio_track.wav` est un fichier audio jouable (ou `extract_audio` a affiché « No audio track »).
- ✅ `thumb.jpg` est une image JPEG valide de la bonne résolution.

**🤔 Question(s) socratique(s)**

- `trim_video` serre `start` et `end` sur la plage valide plutôt que de lever une erreur. Est-ce le bon choix pour une fonction de bibliothèque, ou lever une erreur serait-il mieux ? Quels sont les compromis dans un script vs. un outil orienté utilisateur ?
- `video.close()` est appelé à la fin. Que se passe-t-il si tu oublies de l'appeler — le ramasse-miettes de Python finirait-il par nettoyer, ou ce processus ffmpeg reste-t-il ? Comment saurais-tu si tu as fui un processus ?

## Étape 3 : Ajoute des superpositions de texte

Les superpositions de texte transforment un clip brut en quelque chose avec du contexte — titres, étiquettes, sous-titres, filigranes. `TextClip` de MoviePy crée une couche de texte, et la composer sur la vidéo la positionne à des coordonnées et des moments précis.

### 3.1 Construis la fonction de superposition

```python
def add_text_overlay(
    video_path: str,
    text: str,
    start: float,
    end: float,
    font_size: int = 24,
    position: str = "center",
    output_path: str = "overlay.mp4",
) -> None:
    """Add a text overlay to a video segment."""
    video = load_video(video_path)

    positions = {
        "center": ("center", "center"),
        "top": ("center", 40),
        "bottom": ("center", video.h - 60),
        "top-left": (40, 40),
    }

    txt_clip = (
        TextClip(
            text=text,
            font_size=font_size,
            color="white",
            bg_color="black",
            text_align="center",
            size=(video.w * 0.8, None),
            method="caption",
        )
        .with_position(positions.get(position, positions["center"]))
        .with_start(start)
        .with_end(end)
    )

    result = video.with_composite([txt_clip])
    result.write_videofile(output_path, codec="libx264", audio_codec="aac")
    video.close()
    print(f"Saved {output_path}")

add_text_overlay("sample.mp4", "Welcome to My Video", start=0, end=3, output_path="titled.mp4")
```

**👟 Indice de départ :** `TextClip` crée une couche vidéo à partir d'une chaîne — `method="caption"` fait passer le texte à la ligne à `size=(video.w * 0.8, None)` (80 % de la largeur de la vidéo, hauteur automatique), et `bg_color="black"` dessine un fond sombre derrière le texte blanc pour la lisibilité. `.with_start(start).with_end(end)` fait apparaître le texte seulement pendant cette fenêtre temporelle. `video.with_composite([txt_clip])` superpose la couche de texte sur la vidéo ; la piste audio originale passe inchangée.

**🎯 Résultat attendu :** `titled.mp4` joue la vidéo avec « Welcome to My Video » visible pendant les 3 premières secondes (0-3), puis disparaît pour le reste.

**🩹 Si ça ne marche pas :** Si le texte apparaît mais sans fond, c'est que `bg_color` n'est pas appliqué — vérifie que tu le passes comme argument de mot-clé de `TextClip`, pas à `.with_position()`. Si `write_videofile` échoue avec une erreur de codec, confirme que ffmpeg est installé (`ffmpeg -version`). Si le texte est coupé ou passe à la ligne bizarrement, `size=(video.w * 0.8, None)` est trop étroit — augmente le rapport de largeur.

### 3.2 Vérifie la superposition de texte

**✅ Liste de vérification**

- ✅ `titled.mp4` existe et a la même durée que `sample.mp4`.
- ✅ Le texte est visible pendant la fenêtre temporelle spécifiée et absent en dehors.
- ✅ La piste audio originale joue partout, non affectée par la superposition de texte.

**🤔 Question(s) socratique(s)**

- La fonction de superposition code en dur du texte `"white"` sur fond `"black"`. Que changerais-tu pour prendre en charge des couleurs dynamiques par appel — et quelles combinaisons de couleurs sont garanties lisibles sur n'importe quel fond vidéo ?
- `method="caption"` fait passer le texte à la ligne automatiquement. Que ferait `method="label"` à la place — et quand voudrais-tu du texte non enroulé dans une superposition vidéo ?

## Étape 4 : Convertit entre formats

Différentes plateformes exigent différents formats vidéo — YouTube accepte MP4, Discord préfère WebM, certains systèmes plus anciens ont besoin d'AVI. Cette étape construit un convertisseur qui ré-encode une vidéo dans un format cible, avec compression optionnelle pour la diffusion web.

### 4.1 Convertit un seul fichier

```python
def convert_video(
    input_path: str,
    output_path: str,
    codec: str = "libx264",
    fps: int = 24,
    bitrate: str = "5000k",
) -> None:
    """Convert a video to a different format or encoding."""
    video = load_video(input_path)
    video.write_videofile(
        output_path,
        codec=codec,
        fps=fps,
        bitrate=bitrate,
        audio_codec="aac",
    )
    video.close()
    print(f"Converted {input_path} → {output_path}")

convert_video("sample.mp4", "sample.webm", codec="libvpx-vp9")
convert_video("sample.mp4", "sample_low.mp4", bitrate="1000k")
```

**👟 Indice de départ :** `codec="libvpx-vp9"` produit des fichiers WebM (VP9 est le codec vidéo de Google pour WebM) ; `bitrate="1000k"` produit un fichier beaucoup plus petit que le `5000k` par défaut en réduisant la qualité — c'est le compromis que tu contrôles : débit plus bas = fichier plus petit = qualité plus basse. Le paramètre `fps=24` ré-échantillonne la vidéo à 24 ips si l'originale est plus élevée, ce qui est une optimisation web courante.

**🎯 Résultat attendu :**
```
sample.webm — un fichier WebM (codec VP9, même durée)
sample_low.mp4 — un MP4 compressé à un débit plus bas (taille de fichier plus petite)
```

**🩹 Si ça ne marche pas :** Si `sample.webm` ne se joue pas, le décodeur n'est pas disponible sur ton système — VLC et la plupart des navigateurs modernes gèrent VP9, mais certains lecteurs plus anciens ne le font pas. Si `sample_low.mp4` est à peine plus petit que l'original, `bitrate="1000k"` n'est pas assez bas pour la résolution de la vidéo — essaie `"500k"` ou réduis la résolution (MoviePy a une méthode `resize`).

### 4.2 Convertit un répertoire par lots

```python
def batch_convert(input_dir: str, output_dir: str, target_format: str = "mp4") -> None:
    """Convert all video files in a directory."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    extensions = {".avi", ".mov", ".webm", ".mkv", ".flv"}
    for filepath in Path(input_dir).iterdir():
        if filepath.suffix.lower() in extensions:
            out = output_path / f"{filepath.stem}.{target_format}"
            try:
                convert_video(str(filepath), str(out))
            except Exception as e:
                print(f"  ✗ {filepath.name}: {e}")

batch_convert("raw_videos", "converted")
```

**👟 Indice de départ :** `Path(input_dir).iterdir()` liste chaque fichier du répertoire ; `suffix.lower()` attrape `.AVI` et `.avi` comme la même extension ; le `try/except` dans la boucle empêche qu'un fichier en échec tue tout le lot. C'est la version « production » du convertisseur de fichier unique — les opérations en masse ont besoin d'une gestion d'erreurs par élément, pas par lot.

**🎯 Résultat attendu :** Chaque fichier `.avi`, `.mov`, `.webm`, `.mkv` ou `.flv` dans `raw_videos/` produit un équivalent `.mp4` dans `converted/`, avec les éventuelles erreurs imprimées par fichier.

**🩹 Si ça ne marche pas :** Si le répertoire `converted/` n'existe pas, le `mkdir(parents=True, exist_ok=True)` le crée — confirme que tu n'as pas ajouté une variante `exist_ok=False`. Si certains fichiers échouent silencieusement, le `try/except` imprime l'erreur mais tu ne la vois peut-être pas — redirige stdout vers un fichier journal si tu exécutes en masse.

### 4.3 Vérifie la conversion

**✅ Liste de vérification**

- ✅ `convert_video` produit un nouveau fichier avec la bonne extension (`.webm`, `.mp4`, etc.).
- ✅ `batch_convert` produit un fichier de sortie par fichier d'entrée, avec les erreurs journalisées par fichier plutôt que d'interrompre tout le lot.
- ✅ Le fichier converti se joue correctement dans VLC ou un navigateur — durée et audio correspondent à l'original.

**🤔 Question(s) socratique(s)**

- `convert_video` accepte un `codec` et un `bitrate` comme paramètres séparés, mais régler un débit élevé avec un codec de basse qualité (comme `mpeg4`) pourrait ne pas améliorer la qualité. Comment documenterais-tu quelles combinaisons codec/débit sont sensées ?
- `batch_convert` ignore silencieusement les fichiers qui ne sont pas dans l'ensemble d'extensions. Et si tu voulais aussi traiter les fichiers `.mp4` (ré-encodage pour la qualité) ? Comment éviterais-tu de re-convertir les fichiers déjà dans le format cible ?

## ⚠️ Pièges courants

- **ffmpeg non installé ou pas sur le `PATH`.** Les erreurs de MoviePy ne disent pas toujours « ffmpeg manquant » — tu pourrais voir un `OSError` ou `FileNotFoundError` cryptique sur un chemin que tu n'as pas écrit. Exécute toujours `ffmpeg -version` comme première étape de diagnostic. MoviePy 2.x regroupe son propre ffmpeg dans certaines installations, mais l'installation système est plus fiable.
- **Oublier `video.close()`.** Chaque `VideoFileClip` ouvre un sous-processus ffmpeg. Sans `close()`, ces processus s'accumulent — tu verras des processus `ffmpeg` zombies dans ton moniteur système, et ton script tiendra des verrous de fichier qui empêchent de ré-encoder le même fichier. Utilise un bloc `try/finally` ou des gestionnaires de contexte si tu traites beaucoup de fichiers.
- **Décalage de résolution de la superposition de texte.** `TextClip` rend le texte à une taille de pixel fixe ; si la vidéo est en 4K (3840×2160) et que `font_size=24`, le texte sera minuscule par rapport au cadre. Mette `font_size` à l'échelle avec `video.w / 1920` pour garder le texte proportionné entre les résolutions.
- **`write_videofile` bloque le script.** L'encodage est gourmand en CPU et synchrone — une vidéo de 10 minutes peut mettre des minutes à encoder. Dans un notebook Jupyter, cela fige le kernel jusqu'à la fin. Dans un vrai pipeline, tu exécuterais l'encodage dans un sous-processus ou un thread en arrière-plan.
- **Codec WebM non disponible sur tous les lecteurs.** VP9 (`libvpx-vp9`) est largement pris en charge dans les navigateurs mais pas dans tous les lecteurs multimédia. Si ta cible est un lecteur multimédia (pas un navigateur), reste avec `libx264` (MP4) — c'est le codec le plus universellement compatible.

## Ce que tu viens de construire

Une boîte à outils de traitement vidéo qui enveloppe l'API ffmpeg de MoviePy dans des fonctions Python propres et réutilisables : découpage, extraction audio, génération de miniatures, superpositions de texte et conversion de format. Chaque fonction gère ses propres cas d'erreur et documente ses paramètres, pour que tu puisses les composer dans des pipelines plus grands. Tu as aussi appris l'idiome clé de MoviePy : charger un clip, appliquer des opérations qui retournent de nouveaux clips, et écrire le résultat sur le disque.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/video-processor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/video-processor) dans le dépôt du cours est une version plus complète avec une fonction de bande-annonce (extrait plusieurs segments et fait des fondus croisés entre eux), un filigrane animé et une interface CLI pour le traitement par lots. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Construis une bande-annonce : à partir d'une liste d'horodatages `(start, end)` d'une longue vidéo, extrais chaque segment, ajoute un fondu croisé de 0,5 s entre eux, et concatène en une seule bande-annonce en utilisant `concatenate_videoclips(method="compose")`.
- Ajoute un filigrane animé : crée un filigrane qui défile lentement de gauche à droite sur la vidéo en utilisant une fonction `make_frame` avec des calculs de décalage x dépendant du temps.
- Construis un compresseur vidéo : calcule le débit actuel à partir de la taille de fichier et de la durée, calcule le débit cible pour une taille de fichier souhaitée, et ré-encode — rapporte le taux de compression.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
