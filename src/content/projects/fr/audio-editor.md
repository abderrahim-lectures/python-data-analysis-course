---
title: "Éditeur Audio"
description: "Éditez des fichiers audio avec découpage, suppression de bruit, conversion de format et visualisation d'ondes."
difficulty: "intermediate"
estimatedMinutes: 50
tags: ["pydub", "audio-processing", "matplotlib", "waveform", "numpy"]
learningObjectives:
  - "Synthétiser une tonalité de test propre à partir du calcul brut des échantillons"
  - "Découper et assembler des fichiers audio avec une précision à la milliseconde"
  - "Appliquer des fondus, la normalisation du volume et la conversion de format"
  - "Combiner plusieurs clips en une seule piste"
  - "Générer des visualisations de forme d'onde pour l'analyse audio"
prerequisites: ["Les bases de Python", "L'entrée/sortie de fichiers"]
---

# 🛠️ 🎧 Construire un Éditeur Audio

Chaque épisode de podcast, sonnerie et effet sonore de jeu vidéo est passé par le même pipeline : quelqu'un a découpé les bonnes parties, fondu les bords pour que rien ne claque, ajusté le volume, et cousu les morceaux ensemble. Les studios professionnels font cela dans des applications lourdes ; ce projet construit un petit éditeur audio en ligne de commande en Python qui fait tout cela sur de vrais fichiers audio avec `pydub` — découpage à la milliseconde, fondus, normalisation du volume, conversion de format, assemblage de clips, et une image de forme d'onde pour que tu puisses *voir* exactement ce que tu as changé.

Cela suppose Python 101 et de l'entrée/sortie de fichiers de base — rien de l'Analyse de Données n'est requis. C'est facultatif et non noté — consulte [Projets du monde réel](/fr/projets) pour la liste complète et grandissante.

## 🎯 Ce que tu vas faire

1. Installer `uv`, la pile `pydub`/`numpy`/`matplotlib`, et un `ffmpeg` fonctionnel pour que les formats compressés aient un vrai encodeur derrière eux.
2. Synthétiser une tonalité de test propre à partir de zéro — une source d'audio garantie quels que soient les fichiers que tu possèdes.
3. Découper, fondre et normaliser le volume d'un clip avec une précision à la milliseconde.
4. Convertir entre WAV, MP3 et OGG et assembler plusieurs clips en un montage sans couture.
5. Rendre une forme d'onde pour que tu puisses voir exactement ce que tes modifications ont fait au son.

## Où exécuter ceci

**Localement avec `uv`** est le chemin principal et recommandé — `pydub` délègue l'encodage MP3/OGG à l'exécutable `ffmpeg`, et c'est la seule dépendance que ce projet ne peut pas installer pour toi depuis PyPI. Tu installeras `ffmpeg` via ton gestionnaire de paquets système dans Configuration ; tout le reste tourne depuis ton terminal.

**GitHub Codespaces** fonctionne aussi très bien : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) — `ffmpeg` y est déjà installé, donc chaque étape ci-dessous (y compris les conversions de format de l'Étape 3) tourne sans toucher au système.

**Google Colab, Kaggle Notebooks et Binder sont une vraie façon de faire tourner ceci presque de bout en bout** — plus honnête que la plupart des projets, parce que rien ici ne dépend de ton historique git local. L'avertissement honnête, c'est l'entrée audio : un notebook n'a aucun de tes fichiers audio, donc le notebook ci-dessous *synthétise la même tonalité de test* que tu construis à l'Étape 1 et travaille avec ça. Il peut aussi installer un binaire `ffmpeg` pour l'étape de conversion de format, donc même la conversion MP3/OGG fonctionne — c'est juste convertir une tonalité que personne n'a enregistrée, plutôt qu'un clip qui te tient à cœur. Utilise-le pour voir tout le pipeline tourner avec zéro configuration ; passe à `uv` local ou à un Codespace une fois que tu veux le pointer sur tes propres enregistrements.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/audio-editor/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/audio-editor/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Faudio-editor%2Fnotebook.fr.ipynb)

## Configuration

Tout ce qu'il te faut avant d'écrire une ligne de l'éditeur lui-même : une toolchain Python moderne, les bibliothèques audio, et le seul binaire système sans lequel `pydub` ne peut pas vivre.

### Installer `uv`

`uv` est un outil unique qui remplace la chaîne habituelle « installer Python, puis installer pip, puis installer un outil d'environnement virtuel, puis installer les paquets » — il peut installer et gérer les versions de Python lui-même, aux côtés des dépendances de ton projet.

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

### Configure le projet

```bash
uv init audio-editor
cd audio-editor
uv add pydub numpy matplotlib
```

`pydub` est l'éditeur audio lui-même — il charge, découpe et exporte l'audio. `numpy` transforme les échantillons bruts de l'audio en un tableau que tu peux analyser, et `matplotlib` dessine la forme d'onde que tu rendras à l'Étape 5. Les trois s'installent depuis PyPI en une seule commande.

### Installer `ffmpeg`

`pydub` ne gère nativement que le WAV non compressé. Dès que tu exportes en MP3 ou OGG (Étape 3), il se délègue à l'exécutable `ffmpeg` de ton système :

- **macOS** : `brew install ffmpeg`
- **Ubuntu/Debian** : `sudo apt install ffmpeg`
- **Windows** (choco) : `choco install ffmpeg` — ou installe la build depuis ffmpeg.org et ajoute-la à ton PATH

Confirme qu'il est visible pour ton shell :

```bash
ffmpeg -version
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `audio-editor/` existe avec un `pyproject.toml`, et `pydub`, `numpy` et `matplotlib` sont installés.
- ✅ `ffmpeg -version` affiche la bannière de version FFmpeg (Acceptable de passer si tu ne touches jamais qu'au WAV — sinon, tu heurteras le mur à l'Étape 3).

## Étape 1 : Synthétise et inspecte une tonalité de test

La plupart des projets audio commencent par « charge un fichier que tu as » — ce qui échoue en silence au moment précis où l'apprenant n'a pas de `.mp3` sous la main. Donc ce projet commence dans l'autre sens : tu vas *construire* une onde sinusoïdale de 3 secondes propre à partir de nombres bruts, puis l'inspecter comme si c'était n'importe quel fichier importé. Générer de l'audio est aussi la façon la plus rapide possible de comprendre ce qu'est réellement un échantillon : un entier signé par frame, et la « hauteur » n'est que la vitesse à laquelle cet entier oscille.

### 1.1 Construis une tonalité à partir d'échantillons bruts

**👟 Indice de départ :** Commence par une onde sinusoïdale mono, 16 bits, 44,1 kHz à 440 Hz (le La de concert) en n'utilisant que le module `array` de la bibliothèque standard, puis enveloppe les octets résultants dans un `AudioSegment` de `pydub`.

```python
# audio_editor.py
import math
from array import array
from pathlib import Path

from pydub import AudioSegment

def make_test_tone(freq: float = 440.0, ms: int = 3000, gain_db: float = -12.0, sample_rate: int = 44100) -> AudioSegment:
    """A clean 16-bit sine wave: `freq` Hz, `ms` milliseconds long, at `gain_db` dB."""
    n_samples = int(ms / 1000 * sample_rate)
    raw = array("h", (int(32767 * 0.5 * math.sin(2 * math.pi * freq * t / sample_rate)) for t in range(n_samples)))
    return AudioSegment(raw.tobytes(), frame_rate=sample_rate, sample_width=2, channels=1).apply_gain(gain_db)

tone = make_test_tone()
print(f"Duration: {len(tone) / 1000:.1f} seconds")
print(f"Channels: {tone.channels} (mono)")
print(f"Sample rate: {tone.frame_rate} Hz")
print(f"Sample width: {tone.sample_width} bytes (16-bit)")
print(f"Loudness: {tone.dBFS:.1f} dBFS")
tone.export(Path("tone.wav"), format="wav")
print("Saved tone.wav")
```

Chaque ligne ici enseigne un vrai concept audio. `array("h", ...)` écrit des entiers signés 16 bits — les deux octets (`sample_width=2`) qui composent chaque échantillon d'un fichier de qualité CD standard. L'expression à l'intérieur calcule `sin(2π·freq·t / sample_rate)` : multiplier l'argument du sinus par `t/sample_rate` convertit les *échantillons* écoulés en *secondes* écoulées, donc 440 Hz signifie que l'onde accomplit 440 cycles complets par seconde. `apply_gain` met l'intensité sonore à l'échelle dans le domaine des décibels, ce qui est la façon dont les oreilles (et le reste de ce projet) parlent du volume.

**🎯 Résultat attendu :** Affiche `Duration: 3.0 seconds`, `Channels: 1 (mono)`, `Sample rate: 44100 Hz`, `Sample width: 2 bytes (16-bit)`, une lecture d'intensité autour de **-21 dBFS**, et `Saved tone.wav`.

**🩹 Si ça ne marche pas :** Si `apply_gain` ou un autre appel pydub lève une erreur opaque, tu as peut-être une version périmée de pydub — referais `uv add pydub` pour en obtenir une récente. Si la lecture d'intensité n'est pas proche de -21 dBFS, rappelle-toi que `dBFS` est l'intensité *RMS* : une sinusoïde demi-échelle pointe à -6 dBFS mais lit ~3 dB plus silencieuse en moyenne, et ton gain de `-12` déplace toute cette lecture vers le bas. Si l'export WAV échoue, ce n'est pas ffmpeg — WAV est le chemin natif de pydub ; vérifie que le chemin du fichier est inscriptible.

### 1.2 Vérifie la tonalité

**✅ Liste de vérification**

- ✅ `make_test_tone()` retourne un `AudioSegment` de 3,0 s, mono, 44,1 kHz, 16 bits, et `tone.wav` existe.
- ✅ Tu peux reformuler, avec tes propres mots, comment `t / sample_rate` convertit l'index d'échantillon en secondes.
- ✅ Tu peux expliquer pourquoi l'audio 16 bits stocke chaque échantillon dans 2 octets.

**🤔 Question(s) socratique(s)**

- Qu'est-ce qui changerait dans la tonalité si tu retirais le `* 0.5` avant `int(...)` dans l'expression du sinus ? (C'est un moyen rapide de ressentir la différence entre « clipping » et « audio silencieux ».)
- Pourquoi doubler la fréquence de 440 à 880 Hz *diviserait-il par deux* la période de hauteur mais garderait la durée exactement de 3 secondes identique ?

## Étape 2 : Découpe, fonds et normalise un clip

Le vrai audio n'est jamais uniformément fort et ne commence jamais à un passage à zéro pratique. Trois modifications corrigent cela : le **découpage** retire les parties dont tu ne veux pas, le **fondu** monte en douceur le volume sur les bords pour que tu n'entendes pas de clic, et la **normalisation** déplace l'intensité globale vers un niveau cible pour que ton clip se place de façon cohérente à côté des autres.

### 2.1 Écris les trois fonctions de modification

**👟 Indice de départ :** Écris des fonctions simples — `trim_audio(audio, start_ms, end_ms)`, `apply_fades(...)` et `normalize_volume(...)` — chacune retournant un *nouveau* `AudioSegment`, ne mutant jamais l'entrée.

```python
# audio_editor.py (continued)
def trim_audio(audio: AudioSegment, start_ms: int, end_ms: int) -> AudioSegment:
    """Extract the segment between start_ms and end_ms, clamped to valid bounds."""
    start_ms = max(0, start_ms)
    end_ms = min(len(audio), end_ms)
    return audio[start_ms:end_ms]

def apply_fades(audio: AudioSegment, fade_in_ms: int = 1000, fade_out_ms: int = 1000) -> AudioSegment:
    """Ramp volume up over fade_in_ms and back down over fade_out_ms to avoid clicks."""
    return audio.fade_in(fade_in_ms).fade_out(fade_out_ms)

def normalize_volume(audio: AudioSegment, target_db: float = -20.0) -> AudioSegment:
    """Shift the whole clip so its average (RMS) loudness lands on target_db."""
    return audio.apply_gain(target_db - audio.dBFS)
```

Slicer un `AudioSegment` avec `[start_ms:end_ms]` fonctionne exactement comme slicer une liste, mais les unités sont des millisecondes — et contrairement à un humain avec une lame de rasoir, Python fait toujours une *copie*, donc ta `tone` originale survit à chaque découpe. Le fondu à l'entrée n'est pas une décoration : une forme d'onde qui commence à pleine amplitude passe d'un coup du silence à un cri en un échantillon, ce qui sonne comme un clic ; un fondu sur quelques centaines de millisecondes laisse l'oreille suivre le changement. La normalisation est une simple soustraction dans le domaine des décibels — les décibels sont logarithmiques, donc `target_db - audio.dBFS` est précisément la correction nécessaire (aucune multiplication requise, parce qu'ajouter des décibels, c'est multiplier les amplitudes).

**🎯 Résultat attendu :** Les fonctions sont définies ; `len(trim_audio(tone, 500, 2500))` retourne 2000 (2,0 secondes) même si tu as demandé une demi-seconde dans une tonalité de 3 secondes.

**🩹 Si ça ne marche pas :** Si un découpage retourne un segment (quasi-)vide, ton `start_ms` est plus grand ou égal à `end_ms` — la slice est vide, et pydub ne se plaindra pas. Si normaliser un clip *silencieux* lève une erreur ou affiche un nombre bizarre, c'est parce que le silence a `dBFS = -inf` : soustraire `-inf` donne l'infini, ce qui est indéfini comme gain — normalise toujours de l'audio qui contient réellement du son.

### 2.2 Applique les modifications et exporte

**👟 Indice de départ :** Coupe la tonalité de 500 à 2500 ms, fondu d'entrée de 200 ms et de sortie de 400 ms, normalise à -18 dBFS, et exporte `clip.wav`.

```python
clip = trim_audio(tone, 500, 2500)
clip = apply_fades(clip, fade_in_ms=200, fade_out_ms=400)
clip = normalize_volume(clip, target_db=-18.0)
clip.export("clip.wav", format="wav")
print(f"Exported clip.wav ({len(clip) / 1000:.1f}s)")
```

**🎯 Résultat attendu :** Affiche `Exported clip.wav (2.0s)` et écrit un WAV de 2 secondes dont la forme d'onde monte en douceur au début.

**🩹 Si ça ne marche pas :** Si cela affiche `0.0s`, la slice de découpe était dans le mauvais sens (voir 2.1). Si le clip est *éblouissant* de fort ou silencieux après normalisation, le `target_db` que tu as choisi est loin de là où la tonalité a commencé — `apply_gain` le poussera volontiers jusque-là, ce qui est correct mais peut te surprendre ; règle `target_db` à -18 et écoute un niveau confortable.

### 2.3 Vérifie les modifications

**✅ Liste de vérification**

- ✅ `clip.wav` fait exactement 2,0 secondes et se joue avec un fondu d'entrée et de sortie fluides.
- ✅ La `tone.wav` originale est intacte à 3,0 secondes — le découpage n'a pas muté la source.
- ✅ Tu peux expliquer pourquoi la normalisation est *une addition/soustraction en dB* plutôt qu'une multiplication des échantillons bruts.

**🤔 Question(s) socratique(s)**

- Si tu appliquais le fondu *après* la normalisation, l'intensité finale mesurerait-elle toujours -18 dBFS ? Pourquoi l'*ordre* fondu-puis-normalise (ou normalise-puis-fondu) est-il une vraie décision avec un résultat différent ?
- `apply_fades` retourne `audio.fade_in(...).fade_out(...)`, enchaînant deux appels. Qu'est-ce qui casserait si `fade_in` retournait `None` — et qu'est-ce que cela te dit sur la raison pour laquelle les méthodes pydub retournent de nouveaux segments ?

## Étape 3 : Convertir entre formats

Un seul fichier WAV est l'équivalent audio d'un `.txt` — non compressé et énorme. Le partage signifie généralement MP3 (pour les gens), OGG (pour les pipelines open source) ou FLAC (pour les archives sans perte). La conversion de format est la seule étape de ce projet qui appelle un binaire séparé : `pydub` écrit ce que tu lui dis, mais `ffmpeg` fait l'encodage réel.

### 3.1 Écris `convert_format`

**👟 Indice de départ :** Écris une fonction qui charge *n'importe quel* chemin lisible et le ré-exporte sous un format différent, prenant le format explicitement pour qu'il n'y ait aucune devinette à partir des extensions.

```python
# audio_editor.py (continued)
def convert_format(input_path: str, output_path: str, fmt: str = "wav") -> None:
    """Load any pydub-supported file and re-save it as `fmt`."""
    audio = AudioSegment.from_file(input_path)
    audio.export(output_path, format=fmt)
    print(f"Converted {input_path} -> {Path(output_path).name}")

convert_format("clip.wav", "clip.mp3", fmt="mp3")
convert_format("clip.wav", "clip.ogg", fmt="ogg")
```

`AudioSegment.from_file` renifle le format depuis le fichier, donc le chargeur reste générique — et passer `format=` à `export` supprime toute ambiguïté sur ce que tu as demandé. Remarque qu'il n'y a pas de gestion d'erreur autour des exports basés sur `ffmpeg` : si le binaire manque, `pydub` lève une `FileNotFoundError` claire qui le nomme — c'est l'échec que nous voulons que tu voies *une fois* pour que tu n'oublies jamais que l'Étape 1 se traduit par ce moment.

**🎯 Résultat attendu :** Affiche `Converted clip.wav -> clip.mp3` et `Converted clip.wav -> clip.ogg`, et les deux nouveaux fichiers existent avec des tailles **bien plus petites** que `clip.wav` (MP3/OGG sont une compression avec perte).

**🩹 Si ça ne marche pas :** Si tu obtiens `FileNotFoundError: ffmpeg not found` (ou similaire), `ffmpeg` n'est pas sur le PATH — exécute l'étape de Configuration que tu as sautée et vérifie `ffmpeg -version`. Si l'export MP3 réussit mais que l'OGG échoue, ta build ffmpeg peut manquer l'encodeur OGG, un manque spécifique à la build ; convertis en `.ogg` via `ffmpeg` directement une fois dans un terminal pour confirmer que le codec est présent.

### 3.2 Vérifie la conversion

**✅ Liste de vérification**

- ✅ `clip.mp3` et `clip.ogg` existent et sont tous deux dramatiquement plus petits que `clip.wav`.
- ✅ Tu peux nommer quelle étape de ce projet ne peut réellement pas tourner sans un binaire non Python.

**🤔 Question(s) socratique(s)**

- WAV → MP3 perd de l'information ; MP3 → WAV la préserve mais ne *restaure* pas ce qui a été perdu. Qu'est-ce que cela implique de convertir un fichier d'avant en arrière de façon répétée, et quand chaque direction serait-elle le bon choix ?
- Pourquoi la fonction de chargement n'a-t-elle pas besoin d'argument `format=` alors que la fonction d'exportation bénéficie d'un tel argument ?

## Étape 4 : Combiner des clips en un montage

Modifier, ce n'est pas seulement couper — c'est aussi assembler des morceaux. Le même opérateur `+` que tu as utilisé pour sentir le slicing joint les segments bout à bout, et un `AudioSegment.silent(...)` explicite te permet d'insérer des trous délibérés de silence entre eux, comme un podcast insère un temps mort entre les segments.

### 4.1 Écris `combine_clips`

**👟 Indice de départ :** Gère le cas de liste vide d'abord, puis plie les clips ensemble avec `+=`, en insérant `gap_ms` de silence entre les clips consécutifs.

```python
# audio_editor.py (continued)
def combine_clips(clips: list[AudioSegment], gap_ms: int = 0) -> AudioSegment:
    """Concatenate clips with `gap_ms` of silence between consecutive ones."""
    if not clips:
        return AudioSegment.empty()
    silence = AudioSegment.silent(duration=gap_ms)
    combined = clips[0]
    for clip in clips[1:]:
        combined += silence + clip
    return combined

intro = trim_audio(tone, 0, 1000)
middle = trim_audio(tone, 1200, 2200)
outro = trim_audio(tone, 2400, 3000)
montage = combine_clips([intro, middle, outro], gap_ms=250)
montage.export("montage.wav", format="wav")
print(f"Montage: {len(montage) / 1000:.1f}s")
```

L'habitude importante ici est la vérification de liste vide en premier : concaténer une liste vide planterait au moment où tu indexes `clips[0]`, et un *éditeur audio* qui plante sur le silence est embarrassant. Le motif d'accumulation — commencer par `clips[0]`, puis ajouter `silence + clip` pour chaque reste — est une version falsy d'un repli de style `sum`, et il est idiomatique pour tout (audio, listes, fragments HTML) où l'élément de jonction n'est pas l'identité.

**🎯 Résultat attendu :** Affiche `Montage: 3.1s` — trois segments totalisant 2,6 s *plus* deux trous de silence de 250 ms — et écrit `montage.wav`.

**🩹 Si ça ne marche pas :** Si `combine_clips([])` plante avec une erreur d'index, le garde a été abandonné — remets le `if not clips: return` antérieur. Si la longueur totale n'est pas 2,6 s + (n-1)·gap, une de tes slices `trim_audio` s'étend hors de la tonalité et a été bornée (tu as demandé plus de 3,0 s), donc vérifie les durées brutes de `intro`/`middle`/`outro`.

### 4.2 Vérifie le montage

**✅ Liste de vérification**

- ✅ `montage.wav` fait exactement 3,1 s et joue trois segments de hauteur séparés par des trous de silence.
- ✅ `combine_clips([], gap_ms=250)` retourne un segment vide valide sans planter.

**🤔 Question(s) socratique(s)**

- `montage` a été construit sans fondus entre les segments. Liste les deux problèmes que tu t'attendrais à *entendre* à chaque jonction, et où dans les fonctions de l'Étape 2 tu insérerais un correctif.
- Le trou est ajouté comme `combined += silence + clip`, mais jamais entre tout premier clip et rien. Comment ajusterais-tu la boucle pour mettre un silence `gap_ms` *uniforme* entre chaque paire de segments ?

## Étape 5 : Visualiser la forme d'onde

À ce stade, tu as transformé l'audio de quatre façons mais tu n'en as *vu* aucune. Une forme d'onde transforme l'historique d'amplitude en une forme — tu peux littéralement diagnostiquer un mauvais découpage (falaise abrupte), un fondu manquant (chute verticale) ou un clip normalisé (hauteur uniforme) d'un seul coup d'œil. C'est l'étape de la récompense : les nombres deviennent une image.

### 5.1 Écris `plot_waveform`

**👟 Indice de départ :** Tire les échantillons bruts du segment avec `get_array_of_samples()`, mappe l'*index* d'échantillon en *secondes* avec `np.linspace`, et trace l'amplitude contre le temps — puis sauvegarde et affiche le résultat.

```python
# audio_editor.py (continued)
import numpy as np
import matplotlib.pyplot as plt

def plot_waveform(audio: AudioSegment, title: str = "Waveform") -> None:
    """Plot sample amplitude against time and save a PNG."""
    samples = np.array(audio.get_array_of_samples())
    if audio.channels == 2:
        samples = samples[::2]
    times = np.linspace(0, len(audio) / 1000, num=len(samples))
    plt.figure(figsize=(12, 4))
    plt.plot(times, samples, linewidth=0.5, color="#2563eb")
    plt.fill_between(times, samples, alpha=0.3, color="#2563eb")
    plt.title(title)
    plt.xlabel("Time (seconds)")
    plt.ylabel("Amplitude")
    plt.tight_layout()
    plt.savefig("waveform.png", dpi=150)
    print("Saved waveform.png")

plot_waveform(clip, "Trimmed + Faded + Normalized Clip")
```

`get_array_of_samples()` te donne les mêmes entiers 16 bits que tu as *créés* à l'Étape 1 — l'analyse et la synthèse sont les deux faces d'une même pièce. L'astuce stéréo `samples[::2]` décime : prendre chaque second échantillon extrait exactement un canal, parce que les canaux sont entrelacés gauche-droite-gauche-droite. `linspace(0, len(audio)/1000, num=len(samples))` réutilise l'aperçu de l'Étape 1 — l'index d'échantillon se mappe au temps en divisant par le taux d'échantillonnage — donc l'axe de temps est en secondes honnêtes.

**🎯 Résultat attendu :** Une fenêtre matplotlib plus `waveform.png` montrant une trace de 2 secondes qui diminue en cône près de `t=0` (le fondu d'entrée) et diminue en cône près de `t≈1,6 s` (le fondu de sortie).

**🩹 Si ça ne marche pas :** Si aucune fenêtre ne s'ouvre sur une machine headless ou dans un notebook, c'est attendu — `plt.savefig` a déjà écrit le PNG, et les utilisateurs de notebook obtiennent le tracé en ligne à la place ; rien n'est cassé. Si le tracé montre un bloc bleu plein, la tonalité est trop dense à 44,1 kHz pour se résoudre — zoome, ou trace une slice plus courte comme `tone[0:200]`. Si deux canaux se brouillent l'un l'autre, la décimation `[::2]` manque.

### 5.2 Vérifie la visualisation

**✅ Liste de vérification**

- ✅ `waveform.png` existe et montre une pente de fondu d'entrée claire, une pente de fondu de sortie, et un milieu relativement plat.
- ✅ Tu peux pointer le fondu dans l'image *avant* de regarder le code qui l'a faite.

**🤔 Question(s) socratique(s)**

- En quoi `plot_waveform(tone, ...)` (3 secondes, sans fondus) serait-elle différente de `plot_waveform(clip, ...)`, et qu'est-ce que cette comparaison te dit sur l'utilisation des formes d'onde pour vérifier tes propres modifications ?
- La forme d'onde montre l'amplitude, pas l'intensité sonore. Un bourdonnement de 20 Hz silencieux et un sifflement de 20 kHz fort balancent tous deux entre ±0,5 — quelle *mesure supplémentaire* (indice : elle est déjà affichée à l'Étape 1) les distingue, et pourquoi ?

## ⚠️ Pièges courants

- **`ffmpeg` manquant.** L'export MP3/OGG est la seule étape qui dépend d'un binaire non Python. `pydub` lève une `FileNotFoundError` nommant `ffmpeg` — un échec honnête et instructif — mais tu peux sauter toute la classe d'erreurs en exécutant la vérification de Configuration `ffmpeg -version` une fois avant l'Étape 3.
- **Un découpage au-delà de la fin qui se borne en silence.** `audio[start:end]` ne se plaint jamais quand `end` dépasse la durée ; il retourne juste moins d'audio que demandé. Déboguer « mon montage est plus court que prévu » commence par additionner les longueurs des morceaux, pas par la logique de combinaison.
- **Normaliser le silence lève une erreur bizarre.** Un clip silencieux a `dBFS = -inf`, donc `target_db - audio.dBFS` vaut `inf`, et `apply_gain(inf)` est indéfini. Garde avec une vérification `if audio.dBFS == float('-inf')` avant de normaliser, ou ne normalise jamais un segment dont tu n'as pas vérifié qu'il a du son.
- **Visualiser de longs fichiers avec d'énormes tableaux.** `get_array_of_samples()` sur un long fichier stéréo retourne des millions d'échantillons ; tracer tout est lent et ressemble à un bloc plein. Sous-découpe le segment (`audio[start:end]`) ou sous-échantillonne avant de tracer.
- **Oublier que le dB est logarithmique.** Un gain de `+6 dB` ne double pas les valeurs d'échantillon — il double la *puissance*. Doubler numériquement les valeurs `int(...)` est un boost d'environ 6 dB, et mélanger les deux, c'est ainsi que les volumes finissent à 6 dB d'un objectif.
- **Supposer que la stéréo est deux copies des mêmes données.** Les canaux entrelacés signifient que `samples[::2]` est *un* canal, pas « les données paires ». Sauter la décimation brouille ta forme d'onde.

## Ce que tu viens de construire

Un éditeur audio en ligne de commande fonctionnel : il synthétise du son à partir du calcul brut des échantillons, le découpe avec une précision à la milliseconde, le fond et le normalise dans le domaine des décibels, convertit les formats à travers un vrai encodeur externe, assemble plusieurs clips en un montage, et prouve chaque modification visuellement avec une forme d'onde rendue. Rien ici n'est une simulation — `tone.wav`, `clip.wav` et `montage.wav` sont des fichiers audio jouables que tu peux ouvrir dans n'importe quel lecteur multimédia.

:::tip[Exécute une version plus complète sans configuration locale]
[`examples/audio-editor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/audio-editor) dans le dépôt du cours est une version plus complète du code ci-dessus en un notebook exécutable unique : il synthétise la tonalité de test, exécute chaque modification des Étapes 1 à 5, et affiche la forme d'onde en ligne. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là-bas.
:::

## Où aller à partir d'ici

- Construis un **détecteur de silence** : `split_on_silence(tone)` segmente un fichier audio aux points calmes et affiche le `(start_ms, end_ms)` de chaque segment — pydub fournit `audio.split_on_silence(...)` prêt à l'emploi, et il rend le découpage automatique d'un long enregistrement presque gratuit.
- Écris un **combineur de podcast** qui joint une intro, plusieurs segments d'épisode et une outro avec `clip.crossfade(duration)` pour des transitions fluides au lieu de trous durs — tu as déjà `combine_clips`, donc remplacer `AudioSegment.silent(...)` par `crossfade` est une ligne de réflexion.
- Ajoute un **contrôle de vitesse préservant la hauteur** : `audio._spawn(data, overrides={'frame_rate': new_rate}).set_frame_rate(original_rate)` joue le même audio plus vite sans voix de Chipmunk — le calcul d'échantillons de l'Étape 1 fait ressentir celui-ci comme un tour de victoire.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier·e ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis — et son README contient un tutoriel complet, accessible aux débutants, pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, étape par étape. Aucune expérience git préalable n'est requise.

Bienvenue à Python qui fait du bruit. 🎓