---
title: "Affiner un petit modèle de langage avec Unsloth"
description: "Passe du bac à sable dans le navigateur à du vrai Python : affinez un petit modèle de langage open-source avec LoRA via Unsloth, sur un GPU gratuit."
---


# 🎛️ Affiner un petit modèle de langage avec Unsloth

Dans le track Difficile de Python 101, tu as construit un tout petit modèle de langage entièrement à partir de zéro, comptages de mots, tables de probabilités bigrammes, échantillonnage pondéré. Ce projet reprend exactement ce fil : plutôt que de construire les mathématiques d'un modèle de langage à partir de rien, tu vas prendre un vrai modèle pré-entraîné open-source et le spécialiser pour une tâche de ton choix en l'*affinant* (fine-tuning), en ajustant légèrement ses poids existants avec une petite quantité de tes propres données, en utilisant [Unsloth](https://unsloth.ai), une bibliothèque conçue spécifiquement pour rendre cela rapide et (surtout) gratuit.

Ceci est optionnel et non noté, un bon choix une fois que tu as terminé le track Difficile de Python 101 (le modèle de langage construit à partir de zéro te donne l'intuition sur laquelle ce projet s'appuie). Voir [Projets concrets](/fr/projets) pour la liste complète, qui s'enrichit au fil du temps, y compris le [projet Agent IA](/fr/projets/ai-agent).

:::tip[Une différence honnête avec le projet Agent IA]
Le projet Agent IA tourne entièrement sur ta propre machine. Celui-ci ne le peut pas complètement, affiner un modèle de langage, même petit, nécessite un GPU, et la plupart des ordinateurs portables personnels n'en ont pas un adapté à cette tâche. Ce projet divise donc le travail : la configuration du projet, la préparation des données, et l'exécution de ton modèle *terminé* se font localement avec `uv`, comme pour le projet Agent IA ; l'étape d'affinage elle-même s'exécute sur un GPU hébergé gratuit (Google Colab ou Kaggle) à la place. Ce n'est pas un raccourci, c'est la façon honnête et standard de faire cela sans dépenser d'argent.
:::

## 🎯 Ce que tu vas faire

1. Installer `uv` et configurer un projet local, même première étape que chaque projet.
2. Préparer un petit jeu de données d'exemples qui montre au modèle le comportement que tu veux qu'il apprenne.
3. Obtenir un accès GPU gratuit via Google Colab ou Kaggle, et utiliser Unsloth pour affiner avec LoRA un petit modèle open-source (environ 1 milliard de paramètres) sur ton jeu de données.
4. Télécharger le résultat, un petit fichier « adaptateur », pas un tout nouveau modèle, et l'exécuter localement pour voir ton modèle affiné en action.

## Où exécuter ceci

**En local avec `uv`** est le chemin que suivent les étapes de cette leçon, et celui recommandé pour la Configuration, la préparation du jeu de données, et l'inférence locale (Étapes 1 et 3), la section Configuration ci-dessous explique comment l'installer. L'Étape 2, l'affinage réel, nécessite un GPU et tourne sur le notebook officiel de Unsloth pour Colab/Kaggle quoi qu'il arrive (voir l'Étape 2 ci-dessous), puisque cette étape ne peut vraiment pas se produire sur la plupart des ordinateurs portables.

Si tu préfères essayer les étapes de préparation de données et d'inférence locales dans un notebook hébergé au lieu d'utiliser `uv`, il y a un notebook compagnon fait pour cela :

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finetune-llm-unsloth/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finetune-llm-unsloth/notebook.fr.ipynb)

Ce badge couvre seulement les étapes **locales** (préparation des données et inférence), l'étape d'affinage elle-même utilise encore le notebook officiel de Unsloth, lié séparément dans l'Étape 2.

## Configuration

`uv` est un seul outil qui remplace la chaîne habituelle « installe Python, puis installe pip, puis installe un outil d'environnement virtuel, puis installe les paquets », il peut installer et gérer les versions de Python lui-même, en plus des dépendances de ton projet.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme que c'est installé :

```bash
uv --version
```

Mets ensuite en place un projet local pour les étapes de préparation des données et d'inférence (les parties qui n'ont pas besoin d'un GPU) :

```bash
uv init finetune-llm
cd finetune-llm
uv add datasets huggingface_hub
```

## Étape 1 : Préparer un petit jeu de données

L'affinage enseigne à un modèle un *comportement* spécifique, pas de nouveaux faits à partir de zéro, il fonctionne mieux avec un ensemble d'exemples petit, ciblé et bien formaté, pas un énorme tas de texte brut. Un format courant est une liste de paires instruction/réponse. Choisis une tâche étroite et personnelle, quelques idées : répondre aux questions avec un ton ou un personnage spécifique, suivre un format de sortie fixe (par ex. toujours répondre en JSON valide), ou résumer du texte comme tu le ferais personnellement.

### 1.1 Écris tes exemples et construis le fichier

**👟 Indice de départ :** Commence à partir des deux exemples ci-dessous, garde la forme exacte `{"instruction": ..., "response": ...}` pour chaque entrée, et fais grossir la liste à 30-50 avant de passer à la suite, un objet JSON par ligne (`.jsonl`), pas un seul tableau JSON :

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

**🎯 Résultat attendu :** `Wrote N examples to dataset.jsonl` où N correspond à la longueur de ta liste, et ouvrir `dataset.jsonl` dans un éditeur montre un objet JSON valide par ligne, pas de problèmes de virgule finale, puisque chaque ligne est écrite indépendamment.

**🩹 Si ça ne marche pas :** Si `dataset.jsonl` a moins de lignes que d'exemples que tu as écrits, vérifie s'il y a une clé dupliquée par mégarde dans l'un de tes dictionnaires (Python ne garde silencieusement que la dernière valeur pour une clé répétée, ce qui ne plantera pas mais semblera faux). Garde la liste courte (2-3 exemples) juste pour confirmer que le script fonctionne, puis fais-la grossir à 30-50 avant l'Étape 2, un jeu de données de 2 exemples passe bien à travers le notebook d'affinage mais ne produira pas de changement de comportement visible ensuite.

### 1.2 Vérifie le jeu de données

**✅ Liste de vérification**

- ✅ `dataset.jsonl` existe avec un objet JSON par ligne, chacun portant exactement `instruction` et `response`.
- ✅ Le compteur affiché par le script correspond au nombre d'exemples que tu as réellement écrits.
- ✅ Chaque entrée conserve la même forme `{"instruction": ..., "response": ...}`, pas de clés ou formats incohérents entre les entrées.

**🤔 Question(s) socratique(s)**

L'astuce ci-dessus avertit que « 50 exemples soigneusement écrits et cohérents enseignent un comportement à un modèle bien plus fiablement que 500 exemples bâclés ou incohérents. » Si deux de tes exemples répondent au *même* genre de question de façon contradictoire, qu'est-ce que le modèle doit apprendre, et pourquoi ajouter plus d'exemples contradictoires aggraverait-il le problème plutôt que de l'améliorer ?

## Étape 2 : Affiner avec Unsloth sur un GPU gratuit

C'est l'étape qui nécessite un GPU. [Unsloth](https://github.com/unslothai/unsloth) fournit des notebooks prêts à l'emploi spécifiquement conçus pour les paliers GPU **gratuits** de Google Colab et Kaggle, tu n'installes rien localement pour cette partie.

### 2.1 Confirme d'abord que le notebook de base fonctionne

**👟 Indice de départ :** Exécute les cellules du notebook de haut en bas *sans modification* une première fois, sur ses propres données d'exemple, avant de toucher à quoi que ce soit, confirmer que le notebook de base s'entraîne et produit un adaptateur isole d'abord « est-ce qu'Unsloth fonctionne du tout » de « est-ce que mon remplacement de jeu de données a fonctionné », de la même façon que tester avec des données connues pour être correctes aide partout ailleurs dans ce cours.

1. Va sur la [page des notebooks d'Unsloth](https://docs.unsloth.ai/get-started/unsloth-notebooks) et ouvre l'un des notebooks Colab conviviaux pour débutants pour un petit modèle (environ 1 milliard de paramètres, assez petit pour être affiné rapidement et pour être réellement téléchargé et exécuté ensuite). Un modèle ouvert de 1 milliard de paramètres, comme une petite version de Llama ou Qwen, est un point de départ raisonnable et bien pris en charge ; vérifie la liste de notebooks d'Unsloth pour savoir quel petit modèle dispose actuellement d'un modèle fonctionnel, car le modèle le mieux pris en charge change avec le temps.
2. Exécute les cellules du notebook dans l'ordre, de bout en bout, sans rien changer.

**🎯 Résultat attendu :** La cellule d'entraînement du notebook affiche un nombre de perte d'entraînement visiblement décroissant (il n'atteindra pas zéro, et ne le devrait pas), et la finition produit un dossier d'adaptateur téléchargé de quelques dizaines de mégaoctets, pas de gigaoctets.

**🩹 Si ça ne marche pas :** Si la perte d'entraînement reste plate au lieu de décroître, le notebook ne s'entraîne pas du tout, réexécute les cellules de chargement de données et d'entraînement et regarde les journaux plutôt que de supposer qu'une longue cellule est occupée. Si Colab se déconnecte en cours de route, c'est presque toujours un dépassement de temps d'inactivation du palier gratuit, reconnecte-toi et réexécute depuis le début ; il n'y a pas de sauvegarde partielle dont reprendre dans les notebooks pour débutants.

### 2.2 Échange avec ton propre jeu de données

**👟 Indice de départ :** Maintenant connecte le travail de ton Étape 1 : téléverse le `dataset.jsonl` que tu as construit, et pointe la cellule de chargement de données du notebook vers celui-ci au lieu du jeu de données d'exemple, puis réexécute les cellules dans l'ordre une fois de plus.

```text
# In the notebook's data-loading cell, point it at your dataset.jsonl
# instead of the notebook's bundled example dataset. Exactly which line
# changes depends on the notebook you opened — look for the cell that
# reads a .jsonl/.json dataset and give it your file's name/path.
```

**🎯 Résultat attendu :** La cellule d'entraînement montre à nouveau une perte décroissante, et tu peux confirmer via l'aperçu des données chargées que le notebook lit maintenant les entrées de *ton* `dataset.jsonl` (tes paires instruction/réponse), pas le jeu de démonstration de base.

**🩹 Si ça ne marche pas :** L'échec silencieux le plus courant est la cellule de chargement de données qui lit encore le jeu de données d'exemple original du notebook, cette étape « réussit » sans jamais s'entraîner sur tes données. Vérifie que l'aperçu des données chargées contient bien tes exemples exacts avant que la longue cellule d'entraînement ne s'exécute. Une perte d'entraînement qui reste plate remonte presque toujours à cette même cause de mauvais jeu de données.

:::tip[Vérifie la documentation actuelle avant de commencer]
Quel modèle spécifique, quel notebook spécifique, et la propre API d'Unsloth évoluent tous vite, plus vite que la plupart des logiciels, puisqu'il s'agit d'un outil activement développé et proche de la recherche. Avant d'exécuter quoi que ce soit, ouvre la [documentation actuelle d'Unsloth](https://docs.unsloth.ai) et utilise le notebook et le modèle qu'elle recommande actuellement pour les débutants, plutôt que de supposer que les spécificités de l'année dernière s'appliquent encore.
:::

L'étape centrale d'affinage utilise **LoRA** (Low-Rank Adaptation) : plutôt que de mettre à jour les milliards de paramètres d'un modèle (lent, nécessite beaucoup de mémoire), LoRA gèle le modèle d'origine et entraîne une paire de matrices de rang bien plus faible, ajoutées par-dessus, mathématiquement, si la matrice de poids d'origine est $W$, LoRA apprend une mise à jour de rang faible $\Delta W = BA$ (où $B$ et $A$ sont des matrices bien plus petites) et utilise $W + \Delta W$ au moment de l'inférence. C'est la même idée que d'approximer une grande matrice par une matrice de dimension inférieure, un concept d'algèbre linéaire que tu connais déjà, appliquée pour rendre l'affinage assez peu coûteux pour tourner sur un GPU gratuit. Une fois l'entraînement terminé, le notebook enregistre ton résultat sous forme d'un petit **adaptateur**, juste les matrices $A$ et $B$, typiquement quelques dizaines de mégaoctets, pas une copie de plusieurs gigaoctets du modèle entier. Télécharge ce dossier adaptateur sur ton ordinateur.

### 2.3 Vérifie l'affinage

**✅ Liste de vérification**

- ✅ La cellule d'entraînement s'est exécutée sur ton propre `dataset.jsonl` (confirmé via l'aperçu des données chargées), pas les données de démonstration du notebook.
- ✅ La perte d'entraînement a visiblement diminué au cours de l'exécution.
- ✅ Tu as téléchargé le dossier d'adaptateur résultant sur ton ordinateur, quelques dizaines de mégaoctets, pas de gigaoctets.
- ✅ Tu sais quel modèle de base exact le notebook a affiné, puisque l'Étape 3 a besoin de cet identifiant précis.

**🤔 Question(s) socratique(s)**

Pourquoi le fichier adaptateur ne fait-il que quelques dizaines de mégaoctets alors que le modèle complet qu'il affine fait des gigaoctets ? Si LoRA ne stocke que les matrices de rang faible $A$ et $B$ au lieu de re-sauvegarder tout le modèle de base, qu'arriverait-il si tu essayais d'utiliser cet adaptateur téléchargé sur un modèle différent de celui sur lequel il a été entraîné ?

## Étape 3 : Exécute ton modèle affiné localement

De retour sur ta propre machine, charge le modèle de base plus ton adaptateur téléchargé et essaie-le.

### 3.1 Écris et exécute le script d'inférence

**👟 Indice de départ :** Charge d'abord le modèle *de base* et le tokenizer avec `AutoModelForCausalLM`/`AutoTokenizer`, exactement tel que nommé dans le notebook de l'Étape 2, puis enveloppe le modèle de base avec `PeftModel.from_pretrained(base_model, adapter_path)`, c'est cette seule ligne qui applique réellement ton affinage par-dessus :

```bash
uv add transformers peft torch --extra-index-url https://download.pytorch.org/whl/cpu
```

```python
# infer.py
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

base_model_name = "unsloth/<the-base-model-you-fine-tuned>"  # match Step 2's notebook
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

Exécuter un modèle d'environ 1 milliard de paramètres sur CPU est lent (attend-toi à de vraies secondes, pas des millisecondes, par réponse) mais ça fonctionne, c'est ta propre machine qui exécute réellement un modèle de langage affiné, sans clé API, sans connexion internet requise une fois les fichiers du modèle téléchargés.

**🎯 Résultat attendu :** Une réponse générée qui penche visiblement vers le style ou le format de tes exemples d'entraînement, pas les mêmes mots exacts, mais un changement visible par rapport à la façon dont le modèle de base non affiné répondrait à la même requête.

**🩹 Si ça ne marche pas :** Un `size mismatch`/erreur de configuration au chargement de l'adaptateur signifie presque toujours que `base_model_name` ne correspond pas exactement au modèle de base que le notebook de l'Étape 2 a réellement affiné, vérifie la cellule de chargement de modèle du notebook pour l'identifiant précis et copie-le tel quel. Si la réponse semble indiscernable d'un modèle non entraîné, revérifie que `adapter_path` pointe vers le dossier que tu as téléchargé (pas un espace réservé vide) et que l'Étape 2 s'est réellement entraîné sur tes données, pas sur le jeu de démonstration du notebook.

### 3.2 Vérifie la sortie du modèle affiné

**✅ Liste de vérification**

- ✅ `uv run python infer.py` se termine et affiche une réponse, pas une trace d'erreur.
- ✅ La réponse montre un changement visible vers le style ou le format de tes exemples d'entraînement, par rapport au comportement par défaut du modèle de base.
- ✅ L'identifiant du modèle de base dans `infer.py` correspond exactement à celui que le notebook de l'Étape 2 a affiné.

**🤔 Question(s) socratique(s)**

La réponse devrait montrer le *comportement* que tu as entraîné, mais ne reproduire aucun exemple mot pour mot. Compare ta sortie avec tes données d'entraînement : le modèle mémorise-t-il et répète-t-il un exemple stocké, ou généralise-t-il le pattern instruction/réponse sous-jacent ? Comment ferais-tu la différence, et lequel préférerais-tu ?

## ⚠️ Pièges courants

- **Trop peu d'exemples, ou trop incohérents.** Un jeu de données de 5 exemples, ou 50 exemples qui répondent chacun différemment à des questions similaires, ne donne au modèle rien de fiable à généraliser, tu obtiendras quelque chose de proche du modèle de base non affiné.
- **Oublier d'échanger réellement ton propre jeu de données.** Il est facile d'exécuter un notebook de bout en bout sur son jeu de données *d'exemple* et de conclure « ça a marché » sans jamais avoir entraîné sur tes propres données, confirme toujours que la cellule de chargement de données lit `dataset.jsonl`, pas le fichier de démonstration original du notebook.
- **Essayer d'affiner localement sur le GPU d'un portable (ou sans GPU) au lieu d'utiliser celui hébergé gratuitement.** Même un « petit » modèle de 1 milliard de paramètres a besoin d'une vraie mémoire GPU pour s'entraîner efficacement, le palier gratuit de Colab/Kaggle existe précisément pour que tu n'aies pas besoin du tien.
- **Mélanger le modèle de base entre les étapes 3 et 4.** L'adaptateur que tu as téléchargé n'a de sens que chargé par-dessus le modèle de base *exact* sur lequel il a été entraîné, le charger sur un modèle différent (même de nom similaire) provoquera soit une erreur, soit produira silencieusement du non-sens.

## Ce que tu viens de construire

Tu n'as pas entraîné un modèle de langage à partir de zéro, c'est ce que le track Difficile de Python 101 t'a déjà fait traverser, de la manière honnête et fondée sur les premiers principes. Ici, tu as pris un vrai modèle pré-entraîné et tu l'as *spécialisé* : la même idée sous-jacente (un modèle dont le comportement est façonné par des données) mais à une échelle et un niveau de capacité qu'aucun modèle construit à partir de zéro dans un navigateur ne pourrait atteindre, en utilisant une technique (LoRA) spécifiquement conçue pour rendre cela abordable sur du matériel gratuit.

## Où aller à partir d'ici

- Essaie une tâche véritablement différente pour ton prochain affinage, un format de sortie fixe, un ton spécifique, ou un domaine étroit (par ex. répondre uniquement à des questions sur un sujet) tend à montrer des différences avant/après plus claires et convaincantes qu'un changement large et générique.
- Lis la propre documentation d'Unsloth sur la **quantification**, les notebooks du palier gratuit utilisent déjà la quantification 4 bits pour faire tenir l'entraînement dans une mémoire GPU limitée ; comprendre ce que cela sacrifie (une petite quantité de précision) contre ce que cela permet (faire tenir un modèle qui ne tiendrait pas autrement) vaut la peine d'être su avant de s'y fier pour quoi que ce soit au-delà d'un projet de cours.
- Compare ceci au [projet Agent IA](/fr/projets/ai-agent) : celui-là change le *comportement* d'un modèle en lui donnant des outils et des instructions au moment de la requête (aucun entraînement impliqué) ; celui-ci change les poids réels du modèle à l'avance. Les deux sont des approches réelles et actuelles pour construire avec des modèles de langage, savoir quand privilégier l'une ou l'autre est quelque chose de véritablement utile à avoir ressenti de première main, pas juste lu.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis, et son README a un guide complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
