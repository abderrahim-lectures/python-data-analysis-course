---
id: study-buddy-agent
title: "Construire un Agent de Quiz de Compagnon d'Étude"
sidebar_label: "Agent de Quiz de Compagnon d'Étude"
slug: /projects/study-buddy-agent
description: "Passe du playground intégré au navigateur au vrai Python : construis une app de terminal qui transforme tes propres notes d'étude en quiz, en utilisant un LLM de niveau gratuit pour écrire les questions et juger tes réponses."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Agent de Quiz de Compagnon d'Étude

<ProjectPublishedDate projectId="study-buddy-agent" />

<ProjectGreeting />

Tout dans le cours jusqu'à présent s'est exécuté dans un playground en bac à sable, intégré au navigateur — pour que tu puisses commencer à écrire du Python dès le premier jour avec zéro configuration. Ce projet est l'étape de la graduation : installe le vrai Python sur ta propre machine, puis utilise-le pour construire un outil que tu pourrais réellement continuer à utiliser pour une toute autre classe — une app de quiz qui lit tes propres notes d'étude, écrit des questions ancrées dans ce qui s'y trouve réellement (pas des trivia génériques), t'interroge une question à la fois dans le terminal, et fait juger par un modèle de langage si ta réponse tapée est assez proche, avec un retour bref dans les deux cas.

C'est optionnel et non noté — un bon choix une fois que tu as terminé Python 101 ; rien de Data Analysis n'est requis. Voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Installer `uv` et obtenir une clé API LLM de niveau gratuit.
2. Charger un de tes propres fichiers de notes et décider quelle part en donner au modèle comme contexte.
3. Écrire un prompt qui génère des questions de quiz ancrées dans ce texte spécifique, avec une réponse attendue que le programme garde pour lui.
4. Construire la boucle interactive : poser une question, prendre ta réponse tapée, faire juger par le modèle et donner un retour.
5. Suivre un score cumulé et le rapporter à la fin.

## Où exécuter ceci

**En local avec `uv`** est le chemin que suivent les étapes de cette leçon, et le recommandé — c'est du vrai Python tournant sur ta propre machine, le même mouvement « gradue vers du vrai Python » que tout autre projet de cette section.

**GitHub Codespaces** est une alternative sans configuration si tu préfères ne rien installer localement pour l'instant : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt) et exécute exactement les mêmes commandes `uv` depuis un terminal dans ton onglet de navigateur.

**Google Colab, Kaggle Notebooks, ou Binder** fonctionnent bien aussi — ce projet n'est qu'un script de terminal qui appelle une API hébergée, pas de GPU ni de gros paquet local impliqué. Une version notebook prête à l'emploi vit dans [`examples/study-buddy-agent/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/study-buddy-agent/notebook.ipynb) — elle reflète la même logique `generate_questions()` / `judge_answer()` / `run_quiz()`, utilise `input()` dans une cellule de la même façon que tu le ferais dans un terminal, et incorpore directement l'un des fichiers de notes d'exemple pour qu'elle s'exécute sans avoir besoin de téléverser un fichier. Lance-la avec l'un des badges ci-dessous :

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/study-buddy-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/study-buddy-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fstudy-buddy-agent%2Fnotebook.ipynb)

C'est une façon de moindre fidélité de vivre l'expérience qu'un vrai projet local (pas de vraie structure de fichiers, pas de fichiers `.py` séparés), mais c'est une façon raisonnable d'essayer rapidement l'idée.

## Configuration

Tout ce dont tu as besoin avant l'étape 1 — installer `uv`, créer le projet, et obtenir une clé API — se trouve ici, tout à l'avance, pour que les étapes ci-dessous puissent se concentrer purement sur la logique du quiz.

### Installer `uv`

`uv` est un seul outil qui remplace la chaîne habituelle « installe Python, puis installe pip, puis installe un outil d'environnement virtuel, puis installe les paquets » — il peut installer et gérer les versions de Python lui-même, en plus des dépendances de ton projet.

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

### Créer le projet

```bash
uv init study-buddy-agent
cd study-buddy-agent
uv add openai python-dotenv
```

`uv init` crée un petit projet (un `pyproject.toml` qui suit tes dépendances) et `uv add` installe les paquets dans un environnement isolé pour ce projet — sans configuration manuelle d'environnement virtuel. `openai` est la bibliothèque cliente que cette leçon utilise (GitHub Models, le fournisseur par défaut suggéré ci-dessous, expose une API compatible OpenAI) ; `python-dotenv` te permet de garder ta clé API dans un fichier `.env` local plutôt que de la `export`-er à chaque session.

### Obtenir une clé API IA gratuite

**Choisis le fournisseur que tu préfères** — aucun n'exige de carte de crédit au moment où j'écris ceci, et ce cours n'en favorise aucun. Le script d'exemple dans le dépôt du cours ([`examples/study-buddy-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/study-buddy-agent)) utilise GitHub Models par défaut ; passer à un autre fournisseur est un petit changement bien documenté.

| Fournisseur | Où obtenir une clé | Pourquoi tu pourrais le choisir |
|---|---|---|
| **GitHub Models** *(défaut suggéré)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un jeton d'accès personnel avec la portée `models: read` | Pas d'inscription séparée — tu as déjà un compte GitHub. Des limites de niveau gratuit plus généreuses que celles de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | L'option la plus couramment référencée. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inférence rapide, niveau gratuit généreux, pas de carte. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | L'un des quotas gratuits permanents les plus généreux. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Volume quotidien de tokens élevé, pas de carte. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Une API, de nombreux modèles gratuits — idéal pour comparer les fournisseurs. |

Quel que soit ton choix, le processus est le même :

1. Connecte-toi et génère une clé API sur le site de ce fournisseur.
2. **Ne colle jamais cette clé directement dans le code et ne la commite jamais dans un dépôt.** Mets-la dans un fichier `.env` à la place :

```bash
# .env
GITHUB_TOKEN=your-key-here
```

`python-dotenv` lit ce fichier vers `os.environ` automatiquement, le même pattern utilisé tout au long des projets [Agent IA](/docs/projects/ai-agent) et [Appli RAG](/docs/projects/rag-notes) si tu as fait l'un ou l'autre. Une clé API est un secret, exactement comme un mot de passe — quiconque la possède peut utiliser le quota de ton compte.

:::tip[Un fichier `.env` est souvent plus pratique que export]
Au lieu de faire `export` d'une clé dans chaque nouvelle session de terminal, mets-la dans un fichier `.env` dans ton dossier de projet (voir le `.env.example` de l'exemple du dépôt) et charge-la avec `load_dotenv()`, appelée une fois près du haut de ton script.
:::

Avec `uv`, `openai`, `python-dotenv`, et une clé dans `.env`, la configuration est terminée — tout à partir d'ici est de la logique de quiz.

## Étape 1 : Charge tes notes et choisis une stratégie de contexte

Mets un fichier `.txt` ou `.md` de tes propres notes d'étude quelque part dans ton projet — un dossier `notes/`, même convention que le [projet RAG](/docs/projects/rag-notes), est un endroit raisonnable. Le lire n'a rien de nouveau :

```python
from pathlib import Path

notes_text = Path("notes/cell-biology.txt").read_text(encoding="utf-8")
```

Voici la décision de conception que ce projet te demande de prendre explicitement, plutôt que de passer outre : **quelle part de tes notes le modèle devrait-il réellement voir ?**

- **Option A — donne le fichier entier comme contexte.** L'approche la plus simple possible : lis un fichier, remets son texte entier au modèle dans le prompt, terminé. Cela fonctionne très bien tant qu'un seul fichier tient confortablement dans la fenêtre de contexte du modèle — quelques milliers de mots ne posent aucun problème pour n'importe quel modèle gratuit moderne.
- **Option B — découper, embedder, et récupérer**, exactement comme le fait le [projet RAG](/docs/projects/rag-notes) : divise tes notes en petits morceaux, embedde-les localement, et ne récupère que les plus pertinents pour chaque question. Cela passe à l'échelle pour un dossier de notes avec des dizaines de fichiers longs qui ne tiendraient jamais dans un seul prompt.

**Cette leçon choisit l'Option A** et est explicite sur le compromis : c'est moins évolutif, mais c'est une leçon entière plus simple à écrire, lire et déboguer — pas de modèle d'embedding, pas de recherche vectorielle, pas d'étape séparée de construction d'index, juste une chaîne. Ce compromis mérite d'être nommé à voix haute, le même principe d'ancrage que le projet RAG de toute façon : une bonne question de quiz doit venir de texte que le modèle a réellement reçu, pas de texte dont il devine qu'il pourrait être pertinent à partir des données d'entraînement. Si tes propres notes dépassent un seul fichier, ne réinvente pas la récupération — réutilise `retrieve.py` de l'exemple du projet RAG et remplace le prompt de l'étape 2 pour utiliser des morceaux récupérés au lieu d'un fichier entier.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Tu as un dossier `notes/` avec au moins un vrai fichier `.txt`/`.md` de tes propres notes d'étude dedans.</StepChecklistItem>
<StepChecklistItem>Lire le fichier et imprimer sa longueur montre un vrai nombre de caractères, pas `0` ou une erreur.</StepChecklistItem>
<StepChecklistItem>Tu peux expliquer, en une phrase, pourquoi cette leçon donne le fichier entier au modèle au lieu de récupérer des morceaux.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si ton fichier de notes faisait 50 pages au lieu d'une page, qu'est-ce qui tournerait mal précisément avec l'Option A d'abord — une erreur, un prompt tronqué, ou quelque chose de plus subtil comme le modèle n'utilisant réellement que le début du fichier ?
- L'étape de découpage du projet RAG existe pour rendre chaque morceau embeddé *spécifique*. Sauter le découpage ici perd-il cette spécificité, ou donner le fichier entier au modèle lui donne-t-il réellement *plus* avec quoi travailler ? Dans quelles circonstances chaque réponse serait-elle juste ?

## Étape 2 : Génère des questions de quiz ancrées dans tes notes

Demande au modèle un nombre fixe de questions, chacune appariée à une réponse attendue — et sois explicite dans le prompt que les deux doivent venir du texte spécifique que tu lui donnes, pas de la connaissance générale sur le sujet :

```python
import json

GENERATE_PROMPT_TEMPLATE = """You are a study-buddy quiz generator. Read the
study notes below and write exactly {num_questions} quiz questions that can
ONLY be answered correctly by someone who has read THESE SPECIFIC notes --
not generic questions about the general subject. Base every question and
every expected answer strictly on facts stated in the text.

Reply with ONLY a JSON array, no other text, in this exact shape:
[
  {{"question": "...", "expected_answer": "..."}},
  ...
]

Study notes:
{notes_text}
"""

def generate_questions(notes_text: str, num_questions: int = 5) -> list[dict]:
    prompt = GENERATE_PROMPT_TEMPLATE.format(num_questions=num_questions, notes_text=notes_text)
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.choices[0].message.content.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)
```

Deux détails qui méritent l'attention :

- **`expected_answer` est générée maintenant, mais jamais montrée à l'élève avant qu'il ne réponde.** Le programme la garde en mémoire (dans le dict retourné par `generate_questions`) uniquement pour que l'étape 3 ait quelque chose contre quoi juger plus tard — c'est la même idée « ancré, pas deviné » que le contexte récupéré du projet RAG, juste utilisée pour *vérifier* une réponse au lieu d'en *écrire* une.
- **Demander au modèle de répondre uniquement avec du JSON, puis le parser, est un pattern fragile mais courant.** Les modèles enveloppent parfois leur réponse dans une clôture de code ` ```json ` même quand on leur a dit de ne pas le faire — les appels `removeprefix`/`removesuffix` ci-dessus l'enlèvent avant que `json.loads` s'exécute. Si le parsing échoue encore, imprimer la réponse brute avant de la parser est le moyen le plus rapide de voir ce qui est réellement revenu.

:::tip[Demande plus de questions que nécessaire, si la qualité est inconstante]
Les petits modèles de niveau gratuit produisent parfois une question vague ou bizarrement formulée. Si tu remarques cela sur tes propres notes, une solution simple sans nouveau code est de demander quelques questions supplémentaires dans le prompt et de ne garder que les premières `N` — ou juste de relancer la génération, puisque c'est un seul appel API.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`generate_questions(notes_text)` retourne une liste Python de dicts, chacun avec une clé `"question"` et `"expected_answer"`.</StepChecklistItem>
<StepChecklistItem>En lisant quelques-unes des questions générées, elles se réfèrent clairement à des détails spécifiques de ton fichier de notes, pas des faits génériques sur le sujet qu'un moteur de recherche aurait pu écrire.</StepChecklistItem>
<StepChecklistItem>Tu comprends pourquoi `expected_answer` est générée mais pas encore affichée à l'écran.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si tu donnais au modèle un fichier de notes sur un sujet qu'il connaît déjà extrêmement bien grâce à l'entraînement (disons, la photosynthèse de base), comment saurais-tu si une question générée est réellement ancrée dans *tes* notes plutôt que dans la connaissance préalable du modèle ? Y a-t-il un moyen de le tester ?
- Qu'arriverait-il à la qualité des questions si `notes_text` était vide ou juste une phrase courte ? Essaie — le modèle produit-il une réponse élégante ou quelque chose de manifestement cassé ?

## Étape 3 : Construis la boucle de quiz interactive

Maintenant la partie qui fait de ceci un quiz et pas juste un générateur de questions : pose chaque question, lis la réponse tapée de l'élève, et fais juger par le modèle — les réponses en texte libre ne correspondront pas mot pour mot à la réponse attendue, donc une comparaison exacte de chaînes (`==`) marquerait presque tout comme incorrect.

```python
JUDGE_PROMPT_TEMPLATE = """You are grading a student's quiz answer. Judge
whether the student's answer is correct, partially correct, or incorrect,
compared to the expected answer below -- the student won't phrase it
identically, so judge on meaning, not exact wording.

Question: {question}
Expected answer: {expected_answer}
Student's answer: {student_answer}

Reply with ONLY JSON, no other text, in this exact shape:
{{"verdict": "correct" | "close" | "incorrect", "feedback": "one brief, encouraging sentence"}}
"""

def judge_answer(question: str, expected_answer: str, student_answer: str) -> dict:
    prompt = JUDGE_PROMPT_TEMPLATE.format(
        question=question, expected_answer=expected_answer, student_answer=student_answer
    )
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.choices[0].message.content.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)


def run_quiz(questions: list[dict]) -> None:
    score = 0
    for i, item in enumerate(questions, start=1):
        print(f"\nQuestion {i}/{len(questions)}: {item['question']}")
        student_answer = input("Your answer: ").strip()

        result = judge_answer(item["question"], item["expected_answer"], student_answer)
        verdict = result.get("verdict", "incorrect")
        feedback = result.get("feedback", "")

        if verdict == "correct":
            score += 1
            print(f"✅ Correct! {feedback}")
        elif verdict == "close":
            score += 0.5
            print(f"🟡 Close. {feedback}")
        else:
            print(f"❌ Not quite. {feedback}")
            print(f"   Expected answer: {item['expected_answer']}")

    print(f"\nFinal score: {score}/{len(questions)}")
```

Un verdict à trois voies (`correct` / `close` / `incorrect`) est délibérément plus indulgent qu'un bon/mauvais binaire — un élève qui a la bonne idée mais rate un détail reçoit un crédit partiel et un retour utile, plutôt qu'un « incorrect » plat qui ne dit pas pourquoi.

:::tip[input() bloque jusqu'à ce que l'élève appuie sur Entrée]
`input("Your answer: ")` met en pause tout le script à cette ligne jusqu'à ce que tu tapes quelque chose et appuies sur Entrée — exactement comme `input()` de retour dans Python 101, juste maintenant assis dans une boucle qui fait aussi des appels réseau avant et après. Si le terminal semble se bloquer après qu'une question soit affichée, c'est normal : il t'attend, pas l'API.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`run_quiz(questions)` affiche une question à la fois et attend réellement une saisie tapée avant de continuer.</StepChecklistItem>
<StepChecklistItem>Une réponse délibérément correcte est marquée correcte, et une délibérément incorrecte est marquée incorrecte, avec la réponse attendue affichée.</StepChecklistItem>
<StepChecklistItem>Une réponse à peu près juste mais pas exacte dans le libellé (ex. paraphrasée) obtient un verdict raisonnable, pas un « incorrect » injuste.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Pourquoi juger avec un *deuxième* appel LLM par question plutôt que de demander au modèle de générer la question, la réponse attendue, *et* un verdict en un seul appel au moment de la génération du quiz ? Qu'est-ce que cette approche se tromperait, étant donné que l'élève n'a pas encore répondu au moment de la génération ?
- Le verdict `"close"` accorde un demi-crédit. Quel est un cas où la réponse d'un élève devrait clairement être « close » plutôt que complètement correcte ou complètement incorrecte — et ta propre réponse à une vraie question de tes notes y tomberait-elle ?

## Étape 4 : Suis le score et exécute-le de bout en bout

`run_quiz` ci-dessus suit déjà `score` au fur et à mesure et imprime une ligne finale `score/total` une fois la boucle terminée. Relie tout ensemble dans un `main()` :

```python
def main() -> None:
    notes_text = Path("notes/cell-biology.txt").read_text(encoding="utf-8")

    print("Generating questions...")
    questions = generate_questions(notes_text)
    print(f"Got {len(questions)} questions. Let's go!")

    run_quiz(questions)


if __name__ == "__main__":
    main()
```

Exécute-le :

```bash
uv run python study_buddy.py
```

Tu devrais voir une brève pause « Generating questions... » (un appel API), puis cinq questions une à la fois, chacune attendant ta réponse tapée avant de continuer, se terminant par une ligne de score final comme `Final score: 3.5/5`.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python study_buddy.py` s'exécute de bout en bout : génération, puis toutes les questions, puis une ligne de score final.</StepChecklistItem>
<StepChecklistItem>Le nombre de score final correspond à ce que tu attendrais de tes propres réponses (correct = +1, proche = +0,5, incorrect = +0).</StepChecklistItem>
<StepChecklistItem>Le relancer sur le même fichier de notes produit un ensemble *différent* de questions — confirmant que la génération n'est ni codée en dur ni mise en cache.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si tu exécutais tout le script deux fois de suite sur le même fichier de notes, t'attendrais-tu exactement aux mêmes cinq questions les deux fois ? Pourquoi ou pourquoi pas, étant donné comment `generate_questions` appelle le modèle ?
- Actuellement, un mauvais appel `judge_answer` (un échec de parsing, une erreur réseau) ferait planter tout le quiz à mi-chemin, perdant la progression de l'élève sur les questions restantes. Quel est un changement minimal à `run_quiz` qui laisserait le quiz continuer après un mauvais jugement au lieu de s'arrêter complètement ?

## ⚠️ Pièges courants

- **Des notes maigres produisent des questions maigres.** Si ton fichier de notes n'est que quelques courts points, le modèle a très peu sur quoi ancrer cinq questions distinctes, et tu obtiendras des questions répétitives ou trop faciles (« Quel est le nom de... ? »). Des notes plus détaillées, de style prose, produisent des questions nettement meilleures — cela reflète la leçon de découpage du projet RAG : un meilleur texte d'entrée signifie un meilleur résultat, pas un prompt plus malin.
- **Le juge peut être trop strict ou trop indulgent.** Un petit modèle de niveau gratuit notant des réponses en texte libre n'est pas un instrument précis — il peut marquer une réponse correcte mais bizarrement formulée comme fausse, ou laisser passer une réponse qui manque en réalité un détail clé. Si tu remarques un biais constant, resserre le libellé de `JUDGE_PROMPT_TEMPLATE` (ex. « le crédit partiel ne compte que si au moins un fait spécifique est correct ») plutôt que d'essayer de le contourner en Python.
- **Limites de débit de deux appels par question.** Contrairement à une réponse RAG en un seul coup, ce script fait *deux* appels de modèle par question à la fin d'un quiz — un pour la génération (une fois, par quiz) et un pour le jugement (une fois, par question). Un quiz de 5 questions, c'est 6 appels au total ; exécute plusieurs quiz à la suite sur un niveau gratuit et tu peux heurter une erreur de limite de débit 429. Ce n'est pas un bug — voir le [projet Agent IA](/docs/projects/ai-agent#gérer-les-limites-de-débit) pour le même pattern et une approche de nouvelle tentative que tu peux copier.
- **Un JSON malformé du modèle casse `json.loads`.** Même avec une instruction explicite « réponds uniquement avec du JSON », un modèle ajoute parfois une phrase parasite avant ou après le JSON, ou laisse une virgule finale. Si tu heurtes un `JSONDecodeError`, imprime la réponse brute avant de la parser — c'est presque toujours suffisant pour voir exactement ce qui n'a pas marché et ajuster le prompt.

## Ce que tu viens de construire

Un petit pipeline mais complet « générer, puis interagir, puis noter » : un appel LLM transforme tes propres notes en questions ancrées avec des réponses que seul le programme peut voir, une boucle collecte tes réponses tapées, et un second appel LLM juge chacune sur le sens plutôt que sur le libellé exact, avec un score cumulé totalisé sur toute la session. Rien ici n'a été truqué en un jouet qui ne généralise pas — pointe-le vers un fichier de notes réellement utile pour une autre classe que tu suis, et c'est un vrai outil d'étude, pas juste un exercice de cours.

## Où aller à partir d'ici

- Une fois qu'un seul fichier de notes ne suffit plus — un semestre complet de notes réparties sur de nombreux fichiers — réutilise le pipeline `prepare_notes.py`/`build_index.py`/`retrieve.py` du [projet RAG](/docs/projects/rag-notes) : récupère les morceaux les plus pertinents pour un *sujet* sur lequel tu veux être interrogé, et nourris-en `generate_questions` au lieu d'un fichier entier.
- Suis les questions manquées à travers les exécutions (écris-les dans un petit fichier JSON) et construis un mode « révise mes points faibles » qui te re-questionne spécifiquement sur les sujets que tu as ratés auparavant.
- Ajoute un réglage de difficulté à `GENERATE_PROMPT_TEMPLATE` (« questions de rappel faciles » vs « questions exigeant de relier deux idées des notes ») et compare combien le mode plus difficile se ressent réellement plus dur.
- Revisite le contenu bonus `try`/`except` de Python 101 — envelopper `judge_answer` pour qu'une réponse malformée ne termine pas tout le quiz (voir la question socratique de l'étape 4) est exactement ce pattern.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python hors du navigateur. 🎓

<ProjectProgressCheckbox projectId="study-buddy-agent" />
