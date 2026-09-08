---
title: "Boîte à Outils de Clonage Vocal"
description: "Clone des voix à partir de courts échantillons audio pour la synthèse vocale et la conversion de voix."
difficulty: "advanced"
estimatedMinutes: 75
tags: ["audio", "numpy", "signal-processing"]
learningObjectives:
  - Lire et normaliser l'audio WAV en tableaux numpy
  - "Extraire le pitch, l'énergie et les caractéristiques de passage par zéro par cadre"
  - Construire un profil vocal par locuteur à partir des caractéristiques
  - "Comparer deux profils avec une métrique de distance"
  - Décaler un clip vers une plage de pitch cible et écrire le WAV
prerequisites:
  - "Les bases de Python (fonctions, boucles)"
  - "Aisance avec les tableaux numpy, le découpage et les petits calculs"
  - "Intuition pour la fréquence et le taux d'échantillonnage (une heure de bases audio)"
---

# 🛠️ 🎙️ Boîte à Outils de Clonage Vocal

Le clonage vocal fait les gros titres, mais sous la magie se cache un problème de mesure : qu'est-ce qui, précisément, fait qu'une voix sonne comme *cette* personne ? Cette boîte à outils construit la moitié honnête et interprétable de ce problème en numpy — lis l'audio comme des nombres bruts, mesure le pitch et l'énergie par cadre, condense un clip en profil de locuteur, compare deux profils, et enfin façonne un clip vers les statistiques d'une autre voix. Tu ne produiras pas ici la voix synthétique d'une célébrité ; tu *comprendras* les nombres à partir desquels tout vrai système de clonage démarre.

Cela suppose Python 101, l'aisance avec numpy et une familiarité passagère avec le taux d'échantillonnage et la fréquence — rien d'Analyse de Données au-delà n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

> **La clause de responsabilité.** Cloner une voix sans consentement est de l'usurpation d'identité et, dans de nombreuses juridictions, une fraude — cette boîte à outils est conçue comme un instrument de *mesure* et ne livre aucun modèle qui reproduit une personne réelle à partir d'un échantillon. Utilise-la sur tes propres enregistrements, des clips synthétiques et du matériel de référence clairement étiqueté. N'oublie pas ce qu'un extracteur de caractéristiques peut contenir : des statistiques, pas une identité.

## 🎯 Ce que tu vas faire

1. Lire un fichier WAV dans un tableau numpy normalisé et inspecter sa forme.
2. Extraire les caractéristiques par cadre — énergie RMS, taux de passage par zéro et pitch par autocorrélation.
3. Condenser les caractéristiques d'un clip en un seul profil de locuteur.
4. Comparer deux locuteurs avec une métrique de distance pour trouver la correspondance la plus proche.
5. Façonner le pitch d'un clip cible dans la plage d'une voix de référence et écrire le WAV.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal. C'est exclusivement numpy, donc ça s'installe proprement n'importe où, et c'est le seul chemin où *tes* fichiers WAV (tes propres enregistrements, un audio de référence clairement étiqueté) vivent sur un disque que tu désignes. Le vrai travail audio est un travail local.

**Google Colab, Kaggle Notebooks et Binder** exécutent chaque étape de manière identique — numpy est pré-installé et les calculs en virgule flottante sont les mêmes partout. L'honnêteté impose de préciser : un notebook n'a par défaut aucun *fichier du locuteur*, donc le notebook d'exemple synthétise des clips de style sinusoïdal et formantique pour démontrer l'extraction de caractéristiques (comme ce guide le fait ci-dessous), plutôt que de prétendre cloner un vrai enregistrement. Utilise les badges pour voir les caractéristiques et les profils calculés de bout en bout ; passe au `uv` local quand tu veux pointer la boîte à outils sur un vrai audio, possédé éthiquement.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/voice-cloning-toolkit/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/voice-cloning-toolkit/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fvoice-cloning-toolkit%2Fnotebook.ipynb)

## Configuration

Crée le projet et installe la seule bibliothèque sur laquelle la boîte à outils est construite.

```bash
uv init voice-cloning-toolkit
cd voice-cloning-toolkit
uv add numpy
```

```bash
uv run python -c "import numpy; print('ok')"
```

`numpy` est tout le moteur audio : un fichier WAV devient un tableau `float` 1-D, et chaque caractéristique de ce projet — énergie, taux de croisement, pitch — est une expression numpy sur ce tableau. `wave` (utilisé à l'Étape 1) est livré avec Python et gère le conteneur WAV.

**✅ Liste de vérification**

- ✅ `uv add numpy` a terminé et le contrôle d'import affiche `ok`.
- ✅ Un projet `voice-cloning-toolkit/` neuf existe avec un `pyproject.toml`.

## Étape 1 : Lis un fichier WAV dans un tableau numpy

Chaque mesure de cette boîte à outils commence de la même façon : un `.wav` sur le disque devient un tableau 1-D de valeurs de −1 à 1, une par échantillon. Cette étape écrit un petit ton de démonstration, le lit à nouveau, et vérifie le calcul qui transforme des octets en son.

### 1.1 Écris `read_wav` et un ton de démonstration

**👟 Indice de départ :** Utilise le module `wave` de la bibliothèque standard pour ouvrir le conteneur, récupère `framerate` et le nombre de canaux, décode les octets bruts avec `np.frombuffer`, et normalise les valeurs `int16` vers `[-1, 1]`.

```python
# voicekit.py
import wave
import numpy as np

def read_wav(path: str) -> tuple[np.ndarray, int]:
    """Return (float samples in [-1,1], sample_rate)."""
    with wave.open(path, "rb") as wav:
        sample_rate = wav.getframerate()
        n_channels = wav.getnchannels()
        frames = wav.readframes(wav.getnframes())
    data = np.frombuffer(frames, dtype=np.int16).astype(np.float64)
    if n_channels > 1:
        data = data[::n_channels]
    return data / 32768.0, sample_rate

SR = 22050
seconds = 2
t = np.linspace(0, seconds, SR * seconds, endpoint=False)
tone = 0.3 * np.sin(2 * np.pi * 220 * t)

with wave.open("demo.wav", "wb") as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)          # 16-bit = 2 bytes/sample
    wav.setframerate(SR)
    wav.writeframes((tone * 32767).astype(np.int16).tobytes())

data, sr = read_wav("demo.wav")
print("shape:", data.shape, "sr:", sr, "peak:", round(float(np.abs(data).max()), 3))
```

Le pipeline : `wave` lit le conteneur (combien de temps, combien de largeur, combien de canaux) ; `np.frombuffer` réinterprète la chaîne d'octets bruts comme des nombres `int16` sans copier ; et diviser par `32768.0` remet à l'échelle toute la plage 16 bits dans `[-1, 1]` en virgule flottante — la convention d'unité que partage chaque bibliothèque audio. Mono est à un saut d'index de liste (`data[::n_channels]` sur un fichier 2 canaux prend un échantillon sur deux). La sinusoïde à `220 Hz` est accordée à mi-baryton, ce que l'Étape 2 devrait *mesurer en retour*.

**🎯 Résultat attendu :** `shape: (44100,) sr: 22050 peak: 0.3` — un échantillon par image à exactement 0,3 d'amplitude de crête.

**🩹 Si ça ne marche pas :** Si `shape` rapporte `(88200,)`, c'est que `setnchannels(1)` a été sauté ou que `read_wav` n'effondre pas la stéréo. Si la crête est `0.03`, l'amplitude `0.3` divisée par `100` signifie que l'étape de mise à l'échelle `int16` a double-normalisé. Si `wave.ERROR` dit que le fichier n'est pas un wave RIFF, c'est que `writeframes` a écrit des flottants non encodés — caste avec `.astype(np.int16)` d'abord.

### 1.2 Vérifie le lecteur

**✅ Liste de vérification**

- ✅ `demo.wav` existe et `read_wav` retourne `(44100 échantillons, 22050 Hz)`.
- ✅ La valeur absolue de crête égale le `0.3` que tu as écrit.
- ✅ Éditer `SR` et relancer change le nombre d'échantillons proportionnellement.

**🤔 Question(s) socratique(s)**

- Le fichier stocke des valeurs `int16` ; le lecteur convertit en flottants dans `[-1, 1]`. Pourquoi un extracteur de caractéristiques *éviterait-il délibérément* les entiers pour les calculs d'énergie — que casse-t-on si tu calcules RMS sur des `int16` bruts et puis sur des flottants ?
- Un clip de 2 secondes à 22 050 Hz fait 44 100 échantillons. Si l'audio est instantanément « du son à un moment dans le temps », pourquoi la boîte à outils a-t-elle besoin de *cadres* (Étape 2) au lieu de traiter tout le tableau comme un seul nombre ?

## Étape 2 : Extrais les caractéristiques par cadre

Une voix n'est pas une seule note — c'est un *contour* de pitch qui change 10 fois par seconde. Cette étape découpe l'audio en petits cadres qui se chevauchent et mesure chacun : à quel point c'est fort (`RMS energy`), à quel point c'est bruyant (`zero-crossing rate`), et à quelle fondamentale ça bourdonne (`autocorrelation pitch`).

### 2.1 Cadre le signal et calcule l'énergie et les croisements

**👟 Indice de départ :** Cadre avec des fenêtres de 20 ms et des pas de 10 ms (réglages de discours standard), puis fais de `rms` et `zero_crossings` des fonctions numpy d'une ligne.

```python
# voicekit.py (continuation)
def frame_signal(data: np.ndarray, frame_s: float = 0.02,
                 hop_s: float = 0.01, sr: int = SR):
    frame_n = int(frame_s * sr)
    hop_n = int(hop_s * sr)
    frames = [data[i:i + frame_n]
              for i in range(0, len(data) - frame_n + 1, hop_n)]
    return np.array(frames)

def rms(segment: np.ndarray) -> float:
    return float(np.sqrt(np.mean(segment ** 2)))

def zero_crossings(segment: np.ndarray) -> int:
    return int(np.mean(np.diff(np.sign(segment)) != 0) * len(segment))

frames = frame_signal(data)
energies = np.array([rms(f) for f in frames])
crossings = np.array([zero_crossings(f) for f in frames])
print("frames:", frames.shape[0], "| mean energy:", round(float(energies.mean()), 4))
print("mean crossings/frame:", round(float(crossings.mean()), 1))
```

`frame_signal` est la géométrie classique de l'analyse de la parole : 20 ms par cadre, glissant de 10 ms — donc chaque échantillon est mesuré plus d'une fois, ce qui garde le contour de pitch lisse. `rms` est la définition de la sonie (`mean(segment²)` puis la racine carrée) ; `zero_crossings` compte combien de fois la forme d'onde passe par zéro, un proxy bon marché pour la brillance/le bruit — un « s » sifflant croise constamment, un « o » chaud rarement. L'énergie d'une sinusoïde pure de 220 Hz est plate, ce qui est exactement ce que la démo montre.

**🎯 Résultat attendu :** `frames: 199` (2 s à des pas de 10 ms), une énergie moyenne proche de `0.21`, et des croisements moyens par cadre proches de 9 (un cadre de 220 Hz couvre 4,4 cycles, deux croisements chacun).

**🩹 Si ça ne marche pas :** Si `frames: 200`, c'est que la borne `+ 1` dans le range manque, donc le dernier cadre partiel s'est glissé dedans. Si l'énergie varie sauvagement d'un cadre à l'autre, `i:i + frame_n` a un décalage de chevauchement et les cadres partagent les données brutes inégalement. Si les croisements lisent ~440, tu comptes *les deux* bords de chaque cycle — c'est le double du taux attendu et devrait être divisé dans `zero_crossings`.

### 2.2 Estime le pitch par autocorrélation

**👟 Indice de départ :** Autocorrèle le cadre centré, limite la recherche de délai à 80-400 Hz (la bande de voix humaine), trouve le délai (en échantillons) qui culmine, et convertis `délai → Hz` avec `sr / délai`.

```python
# voicekit.py (continuation)
def autocorr_pitch(segment: np.ndarray, sr: int = SR) -> float:
    seg = segment - segment.mean()
    corr = np.correlate(seg, seg, mode="full")[len(seg) - 1:]
    min_lag = int(sr / 400)   # highest pitch we accept
    max_lag = int(sr / 80)    # lowest pitch we accept
    region = corr[min_lag:max_lag + 1]
    if len(region) == 0 or region.max() <= 0:
        return 0.0
    peak_lag = min_lag + int(np.argmax(region))
    return sr / peak_lag

pitches = np.array([autocorr_pitch(f) for f in frames])
voiced = pitches[pitches > 0]
print("median pitch:", round(float(np.median(voiced)), 1), "Hz")
```

L'autocorrélation pose une question simple : *décale le cadre contre lui-même, et à quel délai ressemble-t-il le plus à son voisin ?* Pour un ton de 220 Hz échantillonné à 22 050 Hz, un cycle complet fait ~100 échantillons, donc la corrélation culmine au délai ≈ 100 → `sr / délai ≈ 220`. Restreindre `min_lag`/`max_lag` à la bande 80-400 Hz est la partie qui empêche un cadre soufflé ou silencieux de matcher du bruit aléatoire à un délai absurde ; tout ce qui est hors de la bande de voix humaine n'est pas un pitch digne d'être rapporté, et `return 0.0` marque un cadre comme non voisé.

**🎯 Résultat attendu :** Un `median pitch` très proche de `220.0` Hz — la boîte à outils a mesuré le ton qu'on lui a donné.

**🩹 Si ça ne marche pas :** Si le pitch lit ~110 Hz, c'est que `peak_lag` a trouvé le *second* pic (l'harmonique d'octave exacte) parce que la région choisie est trop large — resserre `max_lag`, ou prends le premier maximum local, pas le global. Si le pitch est `0.0` partout, c'est que `region.max() <= 0` filtre tout parce que la moyenne du segment n'a pas été soustraite. Si les fréquences sont instables entre les cadres, le cadre de 20 ms est si long qu'il regroupe deux notes différentes — raccourcis `frame_s`.

### 2.3 Vérifie l'ensemble de caractéristiques

**✅ Liste de vérification**

- ✅ Cadres = ~199, énergie moyenne proche de 0,21, croisements proches de 18, pitch médian ≈ 220 Hz.
- ✅ Les cadres non voisés (silence) sont rapportés comme `0.0`, pas comme un pitch aléatoire.
- ✅ Tu peux énoncer ce qu'un seul *cadre* représente et pourquoi le chevauchement aide.

**🤔 Question(s) socratique(s)**

- L'autocorrélation a trouvé la période du ton parfaitement sur une sinusoïde pure. Quel audio du monde réel (pense : un « s » vocal ou un rire) fait échouer ou diviser par deux l'autocorrélation, et comment détecterais-tu cet échec dans le contour de pitch lui-même ?
- Le taux de passage par zéro et le pitch montent tous deux pour les voix aiguës. Pourquoi les outils de parole calculent-ils *les deux* plutôt que de traiter le taux de croisement comme un substitut du pitch ?

## Étape 3 : Construis un profil de locuteur

Les caractéristiques par cadre sont la matière première ; un *profil* est la condensation qu'une comparaison peut utiliser — la moyenne et la plage de pitch, et l'énergie moyenne, pressées de tout un clip en un petit dict.

### 3.1 Écris `build_profile`

**👟 Indice de départ :** Lis le fichier, cadre-le, exécute les caractéristiques de l'Étape 2 sur chaque cadre, puis collecte les pitches *voisés* et l'énergie globale dans un seul dict de synthèse.

```python
# voicekit.py (continuation)
def build_profile(path: str) -> dict:
    data, sr = read_wav(path)
    frames = frame_signal(data, sr=sr)
    pitches = [autocorr_pitch(f, sr) for f in frames]
    voiced = [p for p in pitches if p > 0]
    energy = float(np.mean([rms(f) for f in frames]))
    return {
        "mean_pitch": float(np.mean(voiced)) if voiced else 0.0,
        "pitch_range": (float(min(voiced)), float(max(voiced))) if voiced else (0.0, 0.0),
        "mean_energy": energy,
    }

def make_tone(freq: float, seconds: float = 1.0, sr: int = SR) -> str:
    t = np.linspace(0, seconds, int(sr * seconds), endpoint=False)
    tone = 0.25 * np.sin(2 * np.pi * freq * t)
    path = f"tone_{int(freq)}Hz.wav"
    with wave.open(path, "wb") as wav:
        wav.setnchannels(1); wav.setsampwidth(2)
        wav.setframerate(sr)
        wav.writeframes((tone * 32767).astype(np.int16).tobytes())
    return path

prof_low = build_profile(make_tone(110))
prof_high = build_profile(make_tone(300))
print("low voice:", prof_low)
print("high voice:", prof_high)
```

Un profil est exactement quatre nombres choisis pour être *lisibles* : `mean_pitch` situe la voix dans la plage humaine, `pitch_range` capture l'expressivité (monotone → large), et `mean_energy` est un proxy de la sonie. Filtrer `voiced` compte — les cadres silencieux tireraient la moyenne vers 0 et empoisonneraient la comparaison s'ils restaient. Réutiliser `make_tone` donne à la boîte à outils des voix de test contrôlées : deux tons purs à 110 Hz et 300 Hz dont les profils *devraient* différer seulement en `mean_pitch`, donc l'extraction de profil est vérifiable avant que le vrai audio ne la complique.

**🎯 Résultat attendu :** Deux profils dont les centres de `pitch_range` diffèrent — `mean_pitch ≈ 110` pour le ton bas, `≈ 300` pour le ton haut — avec des `mean_energy` à peu près égaux (`≈ 0.18`).

**🩹 Si ça ne marche pas :** Si les deux pitches lisent ~0, c'est que `voiced` est vide parce que `autocorr_pitch` n'a jamais passé le test `region.max() > 0`. Si `mean_energy` diffère énormément entre les tons, c'est que les amplitudes de `make_tone` diffèrent (la ligne `tone = 0.25 * …` utilise deux multiplicateurs différents). Si `pitch_range` est un seul nombre au lieu d'un tuple, c'est que les parenthèses d'enveloppement dans le dict manquent.

### 3.2 Vérifie les profils

**✅ Liste de vérification**

- ✅ Le profil du ton bas rapporte ~110 Hz et celui du ton haut ~300 Hz.
- ✅ Les deux valeurs `mean_energy` concordent à quelques pour cent près.
- ✅ Un clip uniquement silencieux donne un profil à `mean_pitch: 0.0` sans planter.

**🤔 Question(s) socratique(s)**

- Le profil fait quatre nombres, pourtant les humains distinguent des centaines de voix. Quelle information *jettes-tu* qu'un vrai modèle deepfake garderait, et pourquoi la jeter est-elle en fait une caractéristique de sécurité pour cette boîte à outils ?
- `mean_energy` replie la sonie dans le profil, mais une voix enregistrée près versus loin la change. Comment rendrais-tu le profil équitable selon les distances d'enregistrement — et ce changement rend-il les comparaisons plus honnêtes ?

## Étape 4 : Compare deux locuteurs avec une métrique de distance

Avec des profils comme points, « qui est le plus proche de qui » devient de l'arithmétique : une distance relative par caractéristique, sommée. Cette étape score la distance d'une voix cible à chaque profil candidat et classe la plus proche — la même forme que la dernière couche d'un système d'identification de voix.

### 4.1 Écris `profile_distance` et classe les candidats

**👟 Indice de départ :** Normalise chaque différence de caractéristique par la valeur de référence (pour que 10 Hz comptent moins à 300 Hz qu'à 100 Hz), somme les deux différences normalisées, et choisis le candidat avec le plus petit total.

```python
# voicekit.py (continuation)
def profile_distance(a: dict, b: dict) -> float:
    pitch_diff = abs(a["mean_pitch"] - b["mean_pitch"]) / (b["mean_pitch"] + 1e-9)
    energy_diff = abs(a["mean_energy"] - b["mean_energy"]) / (b["mean_energy"] + 1e-9)
    return pitch_diff + energy_diff

mid_tone = build_profile(make_tone(200))
candidates = {"low": prof_low, "high": prof_high}
for name, prof in candidates.items():
    print(f"{name:>5} distance: {profile_distance(mid_tone, prof):.3f}")

best = min(candidates, key=lambda n: profile_distance(mid_tone, candidates[n]))
print("closest match to 200 Hz:", best)
```

Diviser chaque différence par la caractéristique de référence est l'astuce : `|110 − 200| / 110 ≈ 0.82` mais `|300 − 200| / 300 ≈ 0.33`, donc un écart absolu est jugé *relativement au pitch auquel il se produit* — une dérive de 10 Hz de voix de chef devrait faire moins de mal qu'une dérive de 10 Hz de chuchotement. Ajouter `1e-9` contre une référence zéro empêche la formule de diviser par du silence. Sommer les deux termes normalisés produit une « proximité » sans unité que tu peux comparer entre candidats, et `min(..., key=...)` transforme le tableau de bord en verdict.

**🎯 Résultat attendu :** `low  distance: 0.82`, `high distance: 0.33`, puis `closest match to 200 Hz: high` — le ton de 200 Hz est plus proche du profil de 300 Hz.

**🩹 Si ça ne marche pas :** Si les distances à « low » et « high » sont égales, c'est que le dénominateur dans une ligne `diff` est mal mis à l'échelle (les deux utilisant `a` au lieu de `b`). Si le verdict est toujours « low », c'est que `min` a choisi la distance *maximale* parce que `key=` retourne `-distance`. Si la distance imprime `inf`, un profil a `mean_pitch == 0.0` et le garde-fou `1e-9` manque.

### 4.2 Vérifie les comparaisons

**✅ Liste de vérification**

- ✅ Un ton de 200 Hz est jugé le plus proche du profil de 300 Hz sous cette métrique.
- ✅ Un ton de 150 Hz fait basculer le verdict vers low, et tu peux prédire où se trouve la frontière.
- ✅ Tu peux expliquer *pourquoi* normaliser par la référence bat les différences absolues brutes.

**🤔 Question(s) socratique(s)**

- Cette métrique pondère pitch et énergie également (1:1). Pour un vrai classement « qui sonne pareil », tu ajouterais une troisième caractéristique, ou pondérerais le pitch plus haut. Que se passe-t-il pour le verdict si `energy_diff` commence à dominer — quel type de mauvaise réponse apparaît ?
- La métrique n'utilise jamais la plage de *pitch*. Deux voix avec le même pitch moyen mais l'une monotone et l'autre animée obtiennent une distance de 0. Quand la plage compte-elle vraiment pour distinguer des voix, et qu'échangerais-tu pour l'inclure ?

## Étape 5 : Façonne un clip vers une plage cible

Le geste final est le « clone » honnête de la boîte à outils : mesure le pitch de chaque cadre, et s'il atterrit en dehors de la plage d'un locuteur de référence, ré-échantillonne ce cadre pour qu'il se déplace vers la référence — puis écris le résultat comme un nouveau WAV. Les statistiques se transfèrent ; l'identité non.

### 5.1 Écris l'étape d'ajustement de pitch et l'écriveur WAV

**👟 Indice de départ :** Ré-échantillonne un cadre par le facteur `f` via `np.interp` (raccourcir élève le pitch, allonger l'abaisse), serre chaque cadre hors plage vers la plage de référence, et réassemble les cadres en un seul tableau.

```python
# voicekit.py (continuation)
def pitch_shift(segment: np.ndarray, factor: float) -> np.ndarray:
    n = int(len(segment) / factor)
    xs = np.linspace(0, len(segment) - 1, n)
    return np.interp(xs, np.arange(len(segment)), segment)

def fit_to_range(data: np.ndarray, sr: int, target: dict) -> np.ndarray:
    low, high = target["pitch_range"]
    frames = frame_signal(data, sr=sr)
    shaped = []
    for frame in frames:
        p = autocorr_pitch(frame, sr)
        if 0 < p < low:
            shaped.append(pitch_shift(frame, low / p))
        elif p > high:
            shaped.append(pitch_shift(frame, high / p))
        else:
            shaped.append(frame)
    return np.concatenate(shaped)

def write_wav(path: str, data: np.ndarray, sr: int = SR) -> None:
    with wave.open(path, "wb") as wav:
        wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(sr)
        clip = np.clip(data, -1, 1)
        wav.writeframes((clip * 32767).astype(np.int16).tobytes())

source = read_wav(make_tone(500))       # a 500 Hz tone
shaped_data, sr = source[0], source[1]
shaped = fit_to_range(shaped_data, sr, prof_low)   # target range ~110 Hz
write_wav("shaped.wav", shaped)
after = build_profile("shaped.wav")
print("before:", round(build_profile("tone_500Hz.wav")["mean_pitch"], 1), "Hz")
print("after:", round(after["mean_pitch"], 1), "Hz  (target ~min/mean of low)")
```

`pitch_shift` ré-échantillonne : pour `factor = 2`, il garde un échantillon sur deux environ dans la moitié de la longueur, ce qui *élève* le pitch perçu d'une octave — la physique de jouer un enregistrement plus vite est exactement la même transformation. `fit_to_range` ne l'applique que là où c'est nécessaire : en dessous du bord bas de `pitch_range` de la référence, décale le cadre vers le haut jusqu'à `low` ; au-dessus du bord haut, vers le bas. Il révèle aussi le compromis honnête — le ré-échantillonnage change aussi la *durée*, ce qui explique pourquoi le vrai clonage vocal re-synthétise avec un vocoder plutôt que de ré-échantillonner, et pourquoi la sortie de cette boîte à outils est une démo « façonnée », jamais une copie parasite.

**🎯 Résultat attendu :** « before: 500.0 Hz », « after: » une valeur proche de la plage du profil bas (`~110-150`), et un `shaped.wav` jouable sur le disque dont tu entendras le pitch chuter.

**🩹 Si ça ne marche pas :** Si « after » lit encore ~500 Hz, c'est que `build_profile` est exécuté sur `tone_500Hz.wav` au lieu de `shaped.wav` (la variable `after`). Si le pitch chute mais que le fichier est silencieux, c'est que `write_wav` a écrêté tout ce qui dépassait `±1` — les cadres ré-échantillonnés ont débordé avant `np.clip`. Si tu entends des artefacts au lieu d'un ton, c'est que `np.concatenate` a joint des cadres de longueurs désalignées — chaque `pitch_shift` doit se réassembler proprement en filtrant *uniquement des cadres entiers*.

### 5.2 Vérifie de bout en bout

**✅ Liste de vérification**

- ✅ Une source de 500 Hz chute dans la plage de pitch du profil bas.
- ✅ `write_wav` produit un `shaped.wav` jouable avec `build_profile` cohérent à la relecture.
- ✅ Les cadres hors plage se déplacent ; les cadres en plage passent intacts.
- ✅ Tu as réfléchi au clonage que tu n'as *pas* construit : aucun modèle appris, aucune identité, pas de problème de consentement sans le propriétaire du clip.

**🤔 Question(s) socratique(s)**

- Le ré-échantillonnage déplace à la fois le pitch et la vitesse, donc la voix façonnée est plus courte. Si tu voulais préserver la durée en temps réel, que devrais-tu faire aux *autres* cadres (indice : le ré-échantillonnage inverse), et quel artefact apparaît quand les deux ajustements entrent en collision ?
- La boîte à outils transfère des statistiques mais ne peut explicitement pas reproduire une voix. Où, précisément, se situe la ligne entre « mesurer une voix » et « usurper une voix » — et laquelle des caractéristiques d'aujourd'hui devrais-tu *retirer*, pas ajouter, pour garder cet outil du bon côté ?

## ⚠️ Pièges courants

- **Lire l'`int16` brut comme amplitude.** Oublier la remise à l'échelle `/ 32768.0` fait passer des entiers dans les calculs de caractéristiques ; l'énergie et les croisements ressortent sauvagement gonflés. Correction : normalise une fois dans `read_wav`, fais confiance à chaque fonction en aval.
- **Oublier de centrer les cadres avant l'autocorrélation.** Un segment avec un décalage DC se corrèle avec *lui-même* au délai 0 pour toujours, produisant des pics de quasi-zéro lag bidons. Correction : soustrais `segment.mean()` avant `np.correlate`.
- **Doubler le pitch / poser des erreurs d'octave.** L'argmax global de la région de corrélation peut atterrir sur la seconde harmonique. Correction : prends le *premier* pic local après le délai minimum, ou resserre `max_lag`.
- **Mélanger les caractéristiques brutes avec le filtre voisé.** Nourrir des cadres non voisés (silence → pitch `0.0`) dans `np.mean(voiced)` sans filtrer tire chaque profil vers zéro. Correction : retire toujours `pitch <= 0` comme le fait l'Étape 3.
- **Faire confiance au profil comme identité.** Les moyennes sont des statistiques, pas une personne. Toute utilisation de cette boîte à outils qui assimile « profil le plus proche » à « c'est le locuteur » — pour la sécurité, l'usurpation ou l'attribution — répète exactement l'erreur contre laquelle l'avertissement en haut met en garde.

## Ce que tu viens de construire

Une boîte à outils de mesure vocale purement numpy qui lit l'audio WAV, extrait les caractéristiques pitch/énergie/croisement par cadre, condense les clips en profils comparables, classe la proximité des locuteurs avec une métrique de distance normalisée, et façonne le pitch d'un clip dans la plage statistique d'un autre — avec la limite du clonage énoncée honnêtement sur chaque chemin. La compétence transférable est *l'extraction de caractéristiques sur des signaux bruts* : l'audio, les flux de capteurs et les formes d'onde récompensent tous la même recette de cadrage, de mesure et de condensation avant qu'une couche « intelligente » ne les voie jamais.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/voice-cloning-toolkit/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-cloning-toolkit) dans le dépôt du cours est une version plus complète du code ci-dessus, avec des tons de synthétiseur de style formantique et un notebook traçant le contour de pitch avant/après. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute une troisième caractéristique — le centroïde spectral via une FFT de chaque cadre — et observe la métrique de distance s'aiguiser sur deux voix qui partagent un même pitch moyen.
- Trace le contour de pitch sur la durée du clip pour pouvoir *voir* le vibrato et l'intonation au lieu d'un nombre moyen unique.
- Implémente un contrôle de brillance par taux de passage par zéro pour rejeter les cadres surtout non voisés, rendant le filtrage `voiced` plus malin que « pitch > 0 ».
- Écris `read_wav`, `build_profile` et `profile_distance` contre quelques tons étiquetés à la main dans un `test_voicekit.py` pour que les régressions de caractéristiques ne puissent pas s'infiltrer silencieusement.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
