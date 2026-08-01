---
id: 2027-webcam-object-counter
title: "Compte des Objets en Temps Réel avec une Caméra Web"
sidebar_label: "Compteur d'Objets avec Caméra Web"
slug: /projects/webcam-object-counter
description: "Compte des objets en direct depuis le flux d'une caméra web avec OpenCV et un modèle YOLO11n pré-entraîné — ou exécute la même détection sur une image ou une vidéo d'exemple fournie sans aucune caméra."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Compte des Objets en Temps Réel avec une Caméra Web

<ProjectPublishedDate projectId="2027-webcam-object-counter" />

<ProjectGreeting />

Ce projet suppose que tu es à l'aise avec le Python 101 — fonctions, boucles et installation de paquets — et ne nécessite aucun bagage préalable en analyse de données ou apprentissage automatique. C'est la première incursion de ce cours dans la vision par ordinateur : au lieu de charger un modèle pré-entraîné qui lit du texte ou des lignes tabulaires, tu chargeras un modèle qui lit des pixels, et tu l'utiliseras pour répondre à une question authentiquement pratique en temps réel — « combien de *ceci* y a-t-il devant la caméra en ce moment ? »

C'est optionnel et non noté. Voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Installer `uv` et configurer un projet local avec OpenCV et un modèle de détection d'objets pré-entraîné.
2. Exécuter la détection sur une seule image d'exemple fournie et dessiner des cadres englobants autour de ce qu'elle trouve.
3. Compter les objets d'une classe cible (p. ex. `person`) et afficher un total cumulé.
4. Traiter une courte vidéo d'exemple fournie image par image.
5. Brancher la même boucle de détection sur ta propre caméra web pour un comptage en direct et en temps réel.

## Où exécuter ceci

**En local avec `uv` est la seule façon d'obtenir l'expérience complète de caméra web en direct.** Une caméra web physique connectée à ton ordinateur est du matériel — il n'y a pas de route depuis un onglet de navigateur tournant dans le cloud jusqu'à une caméra posée sur ton bureau. Les étapes 1 à 5 ci-dessous supposent cette voie, et l'Étape 5 en particulier ne fonctionnera tout simplement pas ailleurs.

- **GitHub Codespaces** te donne un environnement de développement cloud sans configuration (Node, Python et `uv` déjà installés — voir [`.devcontainer/devcontainer.json`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/.devcontainer/devcontainer.json)), et les Étapes 1 à 4 (image d'exemple, comptage, vidéo d'exemple) y fonctionnent très bien. L'Étape 5 non — un Codespace tourne sur un serveur distant sans accès à ta caméra web locale non plus.
- **Google Colab, Kaggle Notebooks, ou Binder** sont bons pour la variante **image-d'exemple-uniquement** de ce projet, pas la caméra web en direct. Un notebook réel et exécutable qui télécharge les images d'exemple fournies et exécute le même code de détection vit dans [`examples/webcam-object-counter/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/webcam-object-counter/notebook.ipynb) (pointera vers `main` une fois fusionné). Clique sur un badge pour le lancer directement :

  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/webcam-object-counter/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/webcam-object-counter/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwebcam-object-counter%2Fnotebook.ipynb)

  Sois honnête avec toi-même sur ce que cela t'apporte : uniquement la détection d'images d'exemple, pas un flux de caméra en direct. C'est une manière authentiquement bonne de voir le modèle fonctionner avec zéro installation, mais ce n'est pas le même projet que l'Étape 5.

## Configuration

`uv` est un outil unique qui remplace la chaîne habituelle « installe Python, puis installe pip, puis installe un outil d'environnement virtuel, puis installe des paquets » — il peut installer et gérer lui-même les versions de Python, en plus des dépendances de ton projet.

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

Ensuite, configure le projet :

```bash
uv init webcam-object-counter
cd webcam-object-counter
uv add opencv-python ultralytics
```

Aucune clé API n'est nécessaire nulle part dans ce projet — la détection tourne entièrement en local, sans aucun service externe impliqué. Fais attention à la taille, cependant : `opencv-python` et `ultralytics` (qui entraîne PyTorch) sont un vrai téléchargement — attends-toi à ce que ce `uv add` prenne quelques minutes et quelques centaines de mégaoctets d'espace disque la première fois.

:::tip[Deux façons de détecter des objets — choisis celle qui correspond]
OpenCV embarque des **cascades de Haar** intégrées — petites, rapides, sans téléchargement supplémentaire, mais limitées : chaque cascade est entraînée pour une chose spécifique (l'exemple classique est `haarcascade_frontalface_default.xml` pour les visages de face) et fonctionne mieux sur une vue de face assez propre. Ce projet utilise plutôt **YOLO11n** via le paquet `ultralytics` — un modèle de détection d'objets petit (quelques mégaoctets) mais authentiquement moderne, pré-entraîné sur les 80 classes d'objets courants du jeu de données COCO (personne, voiture, chien, bus, chaise, et plus), qui reconnaît bien plus que des visages et gère bien mieux les scènes réelles plus désordonnées. Le compromis honnête : YOLO11n est une installation plus lourde et un peu plus lent par image qu'une cascade de Haar, mais il détecte de vrais objets, pas seulement des visages, ce qui est tout l'intérêt d'un projet « compter des objets » à usage général. Si tu n'as jamais besoin que de détecter des visages, une cascade de Haar est une alternative tout à fait raisonnable et plus légère qui vaut la peine d'être connue.
:::

## Étape 1 : Détecte des objets dans une seule image d'exemple

Chaque script ci-dessous réutilise cette même idée centrale. `yolo11n.pt` est un point de contrôle pré-entraîné — `ultralytics` le télécharge automatiquement la première fois que tu construis `YOLO(...)`, et le met en cache localement ensuite :

```python
# detect_image.py
import cv2
from ultralytics import YOLO

model = YOLO("yolo11n.pt")

results = model("samples/street.jpg")
result = results[0]

print(f"Detected {len(result.boxes)} object(s):")
for box in result.boxes:
    class_name = model.names[int(box.cls)]
    confidence = float(box.conf)
    print(f"  - {class_name} ({confidence:.0%} confidence)")

annotated = result.plot()  # draws boxes + labels on a copy of the image
cv2.imwrite("output_street.jpg", annotated)
```

```bash
uv run python detect_image.py
```

`model(image_path)` exécute tout le pipeline de détection en un seul appel : redimensionne l'image, la fait passer dans le réseau, et convertit la sortie brute en une liste de cadres, chacun avec un libellé de classe et un score de confiance. `result.boxes` est cette liste — `box.cls` est un index de classe dans `model.names` (un dict des 80 noms de classes COCO), et `box.conf` est la confiance du modèle que le cadre contient effectivement cette classe. `result.plot()` est une méthode de commodité qui redessine tout cela sur l'image pour toi, afin que tu n'aies pas à écrire ta propre boucle de dessin de cadres avec `cv2.rectangle`.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Exécuter le script affiche au moins un objet détecté avec un nom de classe et un score de confiance.</StepChecklistItem>
<StepChecklistItem>`output_street.jpg` existe et, ouvert dans un visualiseur d'images, montre des cadres dessinés autour de vrais objets dans l'image.</StepChecklistItem>
<StepChecklistItem>Tu peux expliquer, en une phrase, ce que `box.cls` et `box.conf` représentent chacun.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

Le modèle renvoie un score de confiance pour chaque cadre, pas seulement un oui/non « objet ici ». Si tu filtrais tout cadre dont la confiance est inférieure à 90 %, t'attendrais-tu à voir plus de fausses détections ou plus de détections manquées — et laquelle de ces deux erreurs compte le plus pour un projet dont tout l'intérêt est un *comptage* précis ?

## Étape 2 : Compte une classe cible et garde un total cumulé

Détecter tout est un bon début, mais « compter des objets » signifie généralement compter *un type* de chose — des personnes passant par une porte, des voitures dans un parking, et ainsi de suite :

```python
# count_class.py
from ultralytics import YOLO

model = YOLO("yolo11n.pt")

target_class = "person"
image_paths = ["samples/street.jpg", "samples/people.jpg"]

running_total = 0
for image_path in image_paths:
    result = model(image_path, verbose=False)[0]
    count = sum(1 for box in result.boxes if model.names[int(box.cls)] == target_class)
    running_total += count
    print(f"{image_path}: {count} {target_class}(s) -- running total: {running_total}")

print(f"\nTotal {target_class}(s): {running_total}")
```

```bash
uv run python count_class.py
```

Le comptage n'est qu'un filtre-et-somme sur `result.boxes`, comparant le nom de classe de chaque cadre à celui qui t'intéresse. `verbose=False` réduit au silence la journalisation propre à `ultralytics` pour que tes propres instructions `print` ne soient pas enterrées dessous.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Le script affiche un comptage par image et un total cumulé qui ne fait que monter.</StepChecklistItem>
<StepChecklistItem>Changer `target_class` en une classe COCO différente (p. ex. `"bus"`) change les comptages affichés en conséquence.</StepChecklistItem>
<StepChecklistItem>Tu comprends pourquoi cela réutilise `model.names[int(box.cls)]` plutôt que de coder en dur un numéro d'index de classe.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

Si deux personnes sur une photo sont debout si proches que leurs cadres englobants se chevauchent presque entièrement, y a-t-il un moyen réaliste pour cette approche de comptage de les sous-compter ou sur-compter ? Qu'est-ce que tu regarderais dans `result.boxes` pour vérifier ?

## Étape 3 : Traite une courte vidéo d'exemple image par image

Une vidéo n'est qu'une séquence d'images — exactement le même code de détection par image des Étapes 1-2, exécuté une fois par image dans une boucle :

```python
# detect_video.py
import cv2
from ultralytics import YOLO

model = YOLO("yolo11n.pt")
target_class = "person"

cap = cv2.VideoCapture("samples/sample_street.mp4")
fps = cap.get(cv2.CAP_PROP_FPS) or 15
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
writer = cv2.VideoWriter("output_video.mp4", cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))

while True:
    ok, frame = cap.read()
    if not ok:
        break  # end of the video file, not a broken camera

    result = model(frame, verbose=False)[0]
    count = sum(1 for box in result.boxes if model.names[int(box.cls)] == target_class)

    annotated = result.plot()
    cv2.putText(annotated, f"{target_class}s: {count}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    writer.write(annotated)

cap.release()
writer.release()
```

```bash
uv run python detect_video.py
```

`cv2.VideoCapture` lit un fichier vidéo (ou, à l'Étape 4, une caméra en direct) une image à la fois via `.read()`, qui renvoie `(ok, frame)` — `ok` devient `False` une fois qu'il n'y a plus d'images. `cv2.VideoWriter` est la même idée en sens inverse : il accumule les images que tu lui donnes dans un nouveau fichier vidéo. Note que le `if not ok: break` ici signifie « le fichier est terminé » — l'Étape 4 réutilise exactement cette même vérification, mais là elle signifie quelque chose d'important et de différent.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`output_video.mp4` existe et se lit, montrant des cadres englobants et un comptage en direct superposés sur chaque image.</StepChecklistItem>
<StepChecklistItem>Tu peux expliquer ce que renvoie `cap.read()` et pourquoi la boucle vérifie `ok` avant d'utiliser `frame`.</StepChecklistItem>
<StepChecklistItem>Tu as remarqué que le comptage peut scintiller d'une image à l'autre même si rien dans la scène n'a visiblement changé.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

Le comptage que tu affiches est un instantané par image, pas un total par vidéo — faire passer la même personne devant la caméra pendant trois secondes pourrait la compter dans chaque image. Que nécessiterait « compter combien de personnes *distinctes* ont traversé le cadre », au-delà de ce que ce script fait actuellement ?

## Étape 4 : Passe en direct avec ta caméra web

Même boucle, une ligne différente : échange le chemin du fichier vidéo contre `0`, l'index de la caméra par défaut de ton ordinateur :

```python
# detect_webcam.py
import cv2
from ultralytics import YOLO

model = YOLO("yolo11n.pt")
target_class = "person"

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Could not open the webcam. Check that one is connected, that no other "
          "app is using it, and that this program has camera permission.")
else:
    print("Webcam opened. Press 'q' in the video window to quit.")
    while True:
        ok, frame = cap.read()
        if not ok:
            print("Lost the camera feed. Stopping.")
            break

        result = model(frame, verbose=False)[0]
        count = sum(1 for box in result.boxes if model.names[int(box.cls)] == target_class)

        annotated = result.plot()
        cv2.putText(annotated, f"{target_class}s: {count}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.imshow("Webcam Object Counter (press q to quit)", annotated)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
```

```bash
uv run python detect_webcam.py
```

`cv2.VideoCapture(0)` ouvre ta caméra par défaut de la même manière que `VideoCapture("some_file.mp4")` a ouvert un fichier à l'Étape 3 — même boucle `.read()`, même forme `(ok, frame)`. Les deux différences importantes : `.isOpened()` est vérifiée *en amont* ici, puisque « pas de caméra web disponible » est un échec réel et courant qui devrait produire un message clair plutôt qu'un crash déroutant au fond de la boucle ; et une fois en cours, le passage de `ok` à `False` en pleine boucle signifie que la connexion de la caméra a été perdue (débranchée, permission révoquée), pas « fin atteinte », puisqu'une caméra en direct n'a pas de fin. `cv2.imshow` ouvre une fenêtre en direct — une vraie fenêtre GUI, donc ce script ne produira pas de sortie visible dans un simple terminal distant sans affichage.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Une fenêtre s'ouvre montrant ton flux de caméra en direct avec des cadres englobants et un comptage en cours dessinés dessus.</StepChecklistItem>
<StepChecklistItem>Tenir un nombre différent de l'objet cible (p. ex. toi-même, puis toi et une seconde personne) change le comptage affiché/à l'écran en conséquence.</StepChecklistItem>
<StepChecklistItem>Débrancher ou couvrir la caméra en pleine exécution produit le message « flux de caméra perdu », pas un blocage silencieux.</StepChecklistItem>
<StepChecklistItem>Appuyer sur « q » ferme la fenêtre proprement au lieu de nécessiter un forçage à quitter.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

Les Étapes 3 et 4 utilisent `if not ok: break` au même endroit exact du code, mais cette ligne signifie quelque chose de différent dans chacune (« fin de fichier » vs. « problème de caméra »). Pourquoi vaut-il la peine d'écrire un message distinct pour chaque cas dans du code réel, plutôt que de traiter les deux comme la même erreur générique ?

## ⚠️ Pièges courants

- **Permission de caméra web refusée.** macOS et Windows demandent l'accès à la caméra la première fois qu'une application essaie de l'utiliser — si tu as rejeté cette invite (ou si elle est apparue derrière une autre fenêtre), `cv2.VideoCapture(0).isOpened()` renverra `False` même avec une caméra parfaitement fonctionnelle. Vérifie les paramètres de confidentialité de la caméra de ton système d'exploitation pour ton application de terminal ou ton interpréteur Python spécifiquement.
- **La première exécution est lente et nécessite une connexion internet.** `ultralytics` télécharge `yolo11n.pt` depuis les serveurs d'Ultralytics la première fois que tu construis `YOLO(...)` — ensuite il est mis en cache localement (typiquement sous `~/.cache` ou le répertoire courant) et chaque exécution ultérieure est entièrement hors ligne. Si la toute première exécution semble bloquée, elle est probablement encore en train de télécharger, pas coincée.
- **Confondre « aucun objet détecté » avec « la caméra ne fonctionne pas ».** Ces deux cas se ressemblent à première vue — un comptage vide dans les deux cas — mais ils ont des correctifs complètement différents. Vérifie `cap.isOpened()` et si `cv2.imshow` affiche une image en direct *avant* de t'inquiéter de savoir pourquoi le comptage est nul ; un flux fonctionnel avec un comptage réellement vide (rien ne correspondant à ta classe cible n'est dans le cadre) n'est pas un bug.
- **Décalages d'index de caméra sur les machines avec plus d'une caméra.** `VideoCapture(0)` ouvre la caméra que ton système d'exploitation considère comme par défaut, qui n'est pas toujours celle que tu attends sur un ordinateur portable avec une caméra web externe branchée — essaie `1`, `2`, etc. si `0` ouvre la mauvaise.

## Ce que tu viens de construire

Un vrai pipeline de vision par ordinateur fonctionnel : charge un modèle pré-entraîné, exécute-le sur des pixels au lieu de lignes ou de texte, et transforme sa sortie brute (cadres, indices de classe, scores de confiance) en quelque chose qu'une personne veut réellement — un comptage en direct d'un type spécifique d'objet. La même forme en trois étapes (détection par image → filtrer vers une classe → boucler sur les images) passe à l'échelle d'une seule photo à un flux de caméra authentiquement en direct avec seulement la source d'entrée qui change.

:::tip[Cela se généralise au-delà de « compter des objets »]
Tout ici — un détecteur pré-entraîné, une boucle sur les images, un comptage en cours — est aussi l'épine dorsale de choses comme les capteurs de comptage de personnes aux entrées de magasins, les caméras basiques de comptage de trafic, et les compteurs d'espèces par pièges photographiques de faune sauvage. La logique de comptage de l'Étape 2 est délibérément simple (pas de suivi d'objets entre les images, donc une personne immobile pendant dix images est comptée dans les dix), ce qui est une simplification honnête, pas un bug caché — voir la section « Où aller à partir d'ici » pour ce que les systèmes réels ajoutent par-dessus.
:::

## Où aller à partir d'ici

- **Suivi d'objets, pas seulement détection.** La question socratique de l'Étape 3 pointe la vraie lacune : ce projet compte des objets *par image*, pas des objets distincts *à travers* une vidéo. Des bibliothèques comme le mode de suivi intégré d'`ultralytics` lui-même (`model.track(...)`, utilisant des algorithmes comme ByteTrack) assignent un ID persistant à chaque objet à travers les images, de sorte que « combien de personnes *distinctes* ont traversé le cadre » devient répondable au lieu de juste « combien sont dans le cadre en ce moment ».
- **Un modèle plus grand et plus précis.** `yolo11n.pt` (« n » pour nano) échange un peu de précision contre de la vitesse et de la taille. `ultralytics` fournit des points de contrôle plus grands (`yolo11s.pt`, `yolo11m.pt` et plus) qui détectent plus fiablement, surtout les objets petits ou partiellement masqués, au prix de plus de calcul par image — cela vaut la peine d'essayer si les comptages en direct de l'Étape 4 semblent peu fiables sur ta configuration particulière.
- **Une classe personnalisée, pas seulement les 80 de COCO.** YOLO11n ne reconnaît que ce sur quoi il a été entraîné. Ajuster finement un modèle YOLO sur tes propres images étiquetées (une version beaucoup plus petite de la même idée que le [projet Fine-tune a Small Language Model](/docs/projects/finetune-llm-unsloth)) te permet de compter quelque chose que COCO n'a jamais inclus — un produit spécifique sur une étagère, un outil spécifique, tout ce dont tu peux étiqueter quelques centaines d'exemples.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="2027-webcam-object-counter" />
