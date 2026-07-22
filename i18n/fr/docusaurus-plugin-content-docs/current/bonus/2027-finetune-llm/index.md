---
id: 2027-finetune-llm
title: "Capstone 2027 : affinez un petit modèle de langage avec Unsloth"
sidebar_label: "2027 : affiner un petit modèle de langage"
slug: /bonus/2027-finetune-llm
description: "Passez du bac à sable dans le navigateur à du vrai Python : affinez un petit modèle de langage open-source avec LoRA via Unsloth, sur un GPU gratuit."
---

import CapstoneProgressCheckbox from '@site/src/components/CapstoneProgressCheckbox';

# 🎁 Capstone 2027 : affinez un petit modèle de langage avec Unsloth

**Félicitations d'avoir terminé le cours.** Dans le track Difficile de Python 101, vous avez construit un tout petit modèle de langage entièrement à partir de zéro — comptages de mots, tables de probabilités bigrammes, échantillonnage pondéré. Ce Capstone reprend exactement ce fil : plutôt que de construire les mathématiques d'un modèle de langage à partir de rien, vous allez prendre un vrai modèle pré-entraîné open-source et le spécialiser pour une tâche de votre choix en l'*affinant* (fine-tuning) — en ajustant légèrement ses poids existants avec une petite quantité de vos propres données, en utilisant [Unsloth](https://unsloth.ai), une bibliothèque conçue spécifiquement pour rendre cela rapide et (surtout) gratuit.

Ceci est optionnel et non noté. C'est ici parce que terminer 10 semaines de fondamentaux mérite une récompense qui pointe vers ce qui vient ensuite. C'est aussi le projet de cette année — un nouveau projet est ajouté chaque année, et ceux des années précédentes restent disponibles, y compris le [Capstone agent IA de 2026](/docs/bonus/2026-ai-agent) ; voir [Choisissez votre Capstone](/docs/bonus) pour la liste complète.

:::tip[Une différence honnête avec le Capstone 2026]
Le Capstone 2026 tournait entièrement sur votre propre machine. Celui-ci ne le peut pas complètement — affiner un modèle de langage, même petit, nécessite un GPU, et la plupart des ordinateurs portables personnels n'en ont pas un adapté à cette tâche. Ce Capstone divise donc le travail : la configuration du projet, la préparation des données, et l'exécution de votre modèle *terminé* se font localement avec `uv`, exactement comme en 2026 ; l'étape d'affinage elle-même s'exécute sur un GPU hébergé gratuit (Google Colab ou Kaggle) à la place. Ce n'est pas un raccourci — c'est la façon honnête et standard de faire cela sans dépenser d'argent.
:::

## 🎯 Ce que vous allez faire

1. Installer `uv` et configurer un projet local — même première étape que chaque Capstone.
2. Préparer un petit jeu de données d'exemples qui montre au modèle le comportement que vous voulez qu'il apprenne.
3. Obtenir un accès GPU gratuit via Google Colab ou Kaggle, et utiliser Unsloth pour affiner avec LoRA un petit modèle open-source (environ 1 milliard de paramètres) sur votre jeu de données.
4. Télécharger le résultat — un petit fichier « adaptateur », pas un tout nouveau modèle — et l'exécuter localement pour voir votre modèle affiné en action.

## Étape 1 : installer `uv`

`uv` est un outil unique qui remplace la chaîne habituelle « installer Python, puis installer pip, puis installer un outil d'environnement virtuel, puis installer les paquets » — il peut installer et gérer lui-même les versions de Python, en plus des dépendances de votre projet.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Fermez et rouvrez votre terminal, puis confirmez l'installation :

```bash
uv --version
```

Configurez ensuite un projet local pour les étapes de préparation des données et d'inférence (les parties qui n'ont pas besoin d'un GPU) :

```bash
uv init finetune-llm
cd finetune-llm
uv add datasets huggingface_hub
```

## Étape 2 : préparer un petit jeu de données

L'affinage enseigne à un modèle un *comportement* spécifique, pas de nouveaux faits à partir de zéro — il fonctionne mieux avec un ensemble d'exemples petit, ciblé et bien formaté, pas un énorme tas de texte brut. Un format courant est une liste de paires instruction/réponse. Choisissez une tâche étroite et personnelle — quelques idées : répondre aux questions avec un ton ou un personnage spécifique, suivre un format de sortie fixe (par ex. toujours répondre en JSON valide), ou résumer du texte comme vous le feriez personnellement.

Écrivez vos exemples localement dans un petit fichier JSON :

```python
# build_dataset.py
import json

examples = [
    {
        "instruction": "Summarize this course in one sentence.",
        "response": "A free, browser-based course teaching Python and pandas from first principles through a full data-analysis project.",
    },
    {
        "instruction": "Explain what a variable is, briefly.",
        "response": "A variable is a name that points to a value stored in memory, so you can refer to that value again by name instead of retyping it.",
    },
    # Add at least 30-50 more examples for the model to actually pick up a
    # pattern — a handful of examples is enough to see this code run, but not
    # enough to see a real behavior change once fine-tuned.
]

with open("dataset.jsonl", "w") as f:
    for example in examples:
        f.write(json.dumps(example) + "\n")

print(f"Wrote {len(examples)} examples to dataset.jsonl")
```

```bash
uv run python build_dataset.py
```

:::tip[La qualité prime sur la quantité]
La propre documentation d'Unsloth et la plupart des guides d'affinage s'accordent là-dessus : 50 exemples soigneusement écrits et cohérents enseignent un comportement à un modèle bien plus fiablement que 500 exemples bâclés ou incohérents. Si vos exemples se contredisent entre eux (répondant différemment au même type de question à chaque fois), le modèle n'a rien de cohérent à apprendre.
:::

## Étape 3 : affiner avec Unsloth sur un GPU gratuit

C'est l'étape qui nécessite un GPU. [Unsloth](https://github.com/unslothai/unsloth) fournit des notebooks prêts à l'emploi spécifiquement conçus pour les paliers GPU **gratuits** de Google Colab et Kaggle — vous n'installez rien localement pour cette partie.

1. Allez sur la [page des notebooks d'Unsloth](https://docs.unsloth.ai/get-started/unsloth-notebooks) et ouvrez l'un des notebooks Colab conviviaux pour débutants pour un petit modèle (environ 1 milliard de paramètres — assez petit pour être affiné rapidement et pour être réellement téléchargé et exécuté ensuite). Un modèle ouvert de 1 milliard de paramètres, comme une petite version de Llama ou Qwen, est un point de départ raisonnable et bien pris en charge ; vérifiez la liste de notebooks d'Unsloth pour savoir quel petit modèle dispose actuellement d'un modèle fonctionnel, car le modèle le mieux pris en charge change avec le temps.
2. Dans le notebook, remplacez son jeu de données d'exemple par le vôtre : téléversez le `dataset.jsonl` que vous avez construit à l'étape 2 (le panneau de téléversement de fichiers de Colab, ou montez Google Drive), et pointez la cellule de chargement de données du notebook vers celui-ci à la place.
3. Exécutez les cellules du notebook dans l'ordre. L'étape centrale d'affinage utilise **LoRA** (Low-Rank Adaptation) : plutôt que de mettre à jour les milliards de paramètres d'un modèle (lent, nécessite beaucoup de mémoire), LoRA gèle le modèle d'origine et entraîne une paire de matrices de rang bien plus faible, ajoutées par-dessus — mathématiquement, si la matrice de poids d'origine est $W$, LoRA apprend une mise à jour de rang faible $\Delta W = BA$ (où $B$ et $A$ sont des matrices bien plus petites) et utilise $W + \Delta W$ au moment de l'inférence. C'est la même idée que d'approximer une grande matrice par une matrice de dimension inférieure — un concept d'algèbre linéaire que vous connaissez déjà — appliquée pour rendre l'affinage assez peu coûteux pour tourner sur un GPU gratuit.
4. Une fois l'entraînement terminé, le notebook enregistre votre résultat sous forme d'un petit **adaptateur** — juste les matrices $A$ et $B$, typiquement quelques dizaines de mégaoctets, pas une copie de plusieurs gigaoctets du modèle entier. Téléchargez ce dossier adaptateur sur votre ordinateur.

:::tip[Vérifiez la documentation actuelle avant de commencer]
Quel modèle spécifique, quel notebook spécifique, et la propre API d'Unsloth évoluent tous vite — plus vite que la plupart des logiciels, puisqu'il s'agit d'un outil activement développé et proche de la recherche. Avant d'exécuter quoi que ce soit, ouvrez la [documentation actuelle d'Unsloth](https://docs.unsloth.ai) et utilisez le notebook et le modèle qu'elle recommande actuellement pour les débutants, plutôt que de supposer que les spécificités de l'année dernière s'appliquent encore.
:::

## Étape 4 : exécutez votre modèle affiné localement

De retour sur votre propre machine, chargez le modèle de base plus votre adaptateur téléchargé et essayez-le :

```bash
uv add transformers peft torch --extra-index-url https://download.pytorch.org/whl/cpu
```

```python
# infer.py
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

base_model_name = "unsloth/<the-base-model-you-fine-tuned>"  # match Step 3's notebook
adapter_path = "./my-adapter"  # the folder you downloaded from Colab

tokenizer = AutoTokenizer.from_pretrained(base_model_name)
base_model = AutoModelForCausalLM.from_pretrained(base_model_name)
model = PeftModel.from_pretrained(base_model, adapter_path)

prompt = "Summarize this course in one sentence."
inputs = tokenizer(prompt, return_tensors="pt")
output = model.generate(**inputs, max_new_tokens=80)
print(tokenizer.decode(output[0], skip_special_tokens=True))
```

```bash
uv run python infer.py
```

Exécuter un modèle d'environ 1 milliard de paramètres sur CPU est lent (attendez-vous à de vraies secondes, pas des millisecondes, par réponse) mais ça fonctionne — c'est votre propre machine qui exécute réellement un modèle de langage affiné, sans clé API, sans connexion internet requise une fois les fichiers du modèle téléchargés.

## ⚠️ Pièges courants

- **Trop peu d'exemples, ou trop incohérents.** Un jeu de données de 5 exemples, ou 50 exemples qui répondent chacun différemment à des questions similaires, ne donne au modèle rien de fiable à généraliser — vous obtiendrez quelque chose de proche du modèle de base non affiné.
- **Oublier d'échanger réellement votre propre jeu de données.** Il est facile d'exécuter un notebook de bout en bout sur son jeu de données *d'exemple* et de conclure « ça a marché » sans jamais avoir entraîné sur vos propres données — confirmez toujours que la cellule de chargement de données lit bien `dataset.jsonl`, pas le fichier de démonstration original du notebook.
- **Essayer d'affiner localement sur le GPU d'un portable (ou sans GPU) au lieu d'utiliser celui hébergé gratuitement.** Même un « petit » modèle de 1 milliard de paramètres a besoin d'une vraie mémoire GPU pour s'entraîner efficacement — le palier gratuit de Colab/Kaggle existe précisément pour que vous n'ayez pas besoin du vôtre.
- **Mélanger le modèle de base entre les étapes 3 et 4.** L'adaptateur que vous avez téléchargé n'a de sens que chargé par-dessus le modèle de base *exact* sur lequel il a été entraîné — le charger sur un modèle différent (même de nom similaire) provoquera soit une erreur, soit produira silencieusement du non-sens.

## Ce que vous venez de construire

Vous n'avez pas entraîné un modèle de langage à partir de zéro — c'est ce que le track Difficile de Python 101 vous a déjà fait traverser, de la manière honnête et fondée sur les premiers principes. Ici, vous avez pris un vrai modèle pré-entraîné et vous l'avez *spécialisé* : la même idée sous-jacente (un modèle dont le comportement est façonné par des données) mais à une échelle et un niveau de capacité qu'aucun modèle construit à partir de zéro dans un navigateur ne pourrait atteindre, en utilisant une technique (LoRA) spécifiquement conçue pour rendre cela abordable sur du matériel gratuit.

## Où aller à partir d'ici

- Essayez une tâche véritablement différente pour votre prochain affinage — un format de sortie fixe, un ton spécifique, ou un domaine étroit (par ex. répondre uniquement à des questions sur un sujet) tend à montrer des différences avant/après plus claires et convaincantes qu'un changement large et générique.
- Lisez la propre documentation d'Unsloth sur la **quantification** — les notebooks du palier gratuit utilisent déjà la quantification 4 bits pour faire tenir l'entraînement dans une mémoire GPU limitée ; comprendre ce que cela sacrifie (une petite quantité de précision) contre ce que cela permet (faire tenir un modèle qui ne tiendrait pas autrement) vaut la peine d'être su avant de s'y fier pour quoi que ce soit au-delà d'un projet de cours.
- Comparez ceci au [Capstone agent IA de 2026](/docs/bonus/2026-ai-agent) : celui-là change le *comportement* d'un modèle en lui donnant des outils et des instructions au moment de la requête (aucun entraînement impliqué) ; celui-ci change les poids réels du modèle à l'avance. Les deux sont des approches réelles et actuelles pour construire avec des modèles de langage — savoir quand privilégier l'une ou l'autre est quelque chose de véritablement utile à avoir ressenti de première main, pas juste lu.

## Partagez votre projet avec la classe

Vous avez construit quelque chose dont vous êtes fier ? [`examples/student-agents/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-agents) est une galerie de projets Capstone que d'autres étudiants ont soumis — et son README a un guide complet et accessible aux débutants pour ajouter le vôtre via une **pull request**, même si vous n'avez jamais utilisé git auparavant : forker le dépôt, créer une branche, valider vos fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est présumée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<CapstoneProgressCheckbox capstoneId="2027-finetune-llm" />
