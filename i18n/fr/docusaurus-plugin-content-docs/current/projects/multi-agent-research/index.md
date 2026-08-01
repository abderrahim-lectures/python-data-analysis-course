---
id: multi-agent-research
title: "Construire un Assistant de Recherche Multi-Agents"
sidebar_label: "Construire un Assistant de Recherche Multi-Agents"
slug: /projects/multi-agent-research
description: "Passe du bac à sable dans le navigateur à du vrai Python : construis un petit système multi-agents — un planificateur, un chercheur et un rédacteur — qui décompose une question de recherche et synthétise un vrai rapport, en utilisant les sous-agents de deepagents de LangChain et un LLM de palier gratuit."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Assistant de Recherche Multi-Agents

<ProjectPublishedDate projectId="multi-agent-research" />

<ProjectGreeting />

Un seul agent avec une pile d'outils et un long prompt système fonctionne bien pour les petites tâches, mais il commence à craquer dès qu'une tâche a des *phases* vraiment différentes qui demandent des instructions différentes — planifier quoi chercher, chercher réellement chaque morceau, puis tout rédiger. Ce projet répartit ce travail entre trois petits agents aux instructions étroites au lieu d'un seul gros : un **planificateur** qui décompose une question de recherche en une poignée de sous-questions, un **chercheur** qui répond à chaque sous-question par lui-même, et un **rédacteur** qui synthétise tout en un rapport final — coordonnés avec la fonctionnalité de sous-agents `deepagents` de LangChain.

Cela suppose du Python 101, et cela s'appuie directement sur le [projet Agent IA](/docs/projects/ai-agent) — même bibliothèque `deepagents`, même configuration API de palier gratuit, même idée d'un modèle décidant quoi appeler et quand, juste appliquée à la délégation de sous-tâches entières plutôt qu'à l'appel d'outils individuels. Faire ce projet d'abord n'est pas strictement requis, mais c'est une rampe d'accès bien plus douce que de commencer ici à froid.

C'est optionnel et non noté. Voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Installer `uv`, un outil rapide et moderne pour gérer Python lui-même et les dépendances de ton projet.
2. Obtenir une clé API IA de palier gratuit — le même choix de six fournisseurs que le projet Agent IA.
3. Configurer un petit projet et installer `deepagents`.
4. Définir trois sous-agents — planificateur, chercheur, rédacteur — chacun avec son propre prompt système étroit.
5. Les relier ensemble en un seul agent de niveau supérieur et l'exécuter sur une vraie question de recherche, de bout en bout.

## Où exécuter ceci

**En local avec `uv`** est le chemin que suivent les étapes de cette leçon, et celui recommandé — c'est du vrai Python qui tourne sur ta propre machine, le même mouvement « passage au vrai Python » que chaque autre projet de cette section. La section Configuration ci-dessous explique comment l'installer.

**GitHub Codespaces** est une alternative sans configuration si tu préfères ne rien installer localement pour l'instant : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt) et exécute exactement les mêmes commandes `uv` depuis un terminal dans l'onglet de ton navigateur.

**Google Colab, Kaggle Notebooks, ou Binder** fonctionnent aussi, puisque rien ici n'a besoin de GPU — chaque étape n'est qu'un appel API à un LLM de palier gratuit. Une vraie version notebook exécutable de ce projet se trouve dans le dépôt à [`examples/multi-agent-research/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/multi-agent-research/notebook.ipynb) — clique sur un badge ci-dessous pour la lancer avec zéro configuration locale, sans besoin de fichier `.env` (il demande ta clé API de façon interactive avec `getpass` à la place) :


[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/multi-agent-research/notebook.ipynb)
[![Open in Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/multi-agent-research/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmulti-agent-research%2Fnotebook.ipynb)

C'est une façon moins fidèle de vivre le projet qu'un vrai projet `uv` local, mais parfaitement utilisable pour tester rapidement l'idée.

## Configuration

Tout ce qui suit prépare entièrement ton environnement avant que la construction ne commence : installer `uv`, obtenir une clé API gratuite, configurer le projet, et configurer ton fichier `.env`.

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

Ferme et rouvre ton terminal, puis confirme l'installation :

```bash
uv --version
```

### Obtenir une clé API IA gratuite

**Choisis le fournisseur de ton choix** — aucun d'eux ne nécessite de carte de crédit au moment de l'écriture, et ce cours n'en favorise aucun par rapport aux autres. L'agent d'exemple du dépôt du cours ([`examples/multi-agent-research/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/multi-agent-research)) prend en charge les six directement, sélectionnés avec un seul paramètre, le même modèle que le projet Agent IA.

| Fournisseur | Où obtenir une clé | Pourquoi tu pourrais le choisir |
|---|---|---|
| **GitHub Models** *(défaut suggéré)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un jeton d'accès personnel avec le scope `models: read` | Pas d'inscription séparée — tu as déjà un compte GitHub. Limites de palier gratuit plus généreuses que celles de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | L'option la plus couramment référencée. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inférence rapide, palier gratuit généreux, pas de carte. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | L'un des quotas gratuits permanents les plus généreux. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Volume élevé de tokens quotidiens, pas de carte. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Une seule API, de nombreux modèles gratuits — bon pour comparer les fournisseurs. |

Quel que soit celui que tu choisis, le processus est le même :

1. Connecte-toi et génère une clé API sur le site de ce fournisseur.
2. **Ne colle jamais cette clé directement dans le code ni ne la valide dans un dépôt.** Définis-la plutôt comme une variable d'environnement :

```bash
# macOS / Linux (add to ~/.bashrc or ~/.zshrc to persist it)
export GITHUB_TOKEN="your-key-here"   # or GOOGLE_API_KEY, GROQ_API_KEY, etc. -- match your provider

# Windows (PowerShell)
$env:GITHUB_TOKEN = "your-key-here"
```

:::tip[Un fichier .env est souvent plus pratique qu'export]
Plutôt que de faire `export` d'une clé à chaque nouvelle session de terminal, tu peux la mettre dans un fichier `.env` dans le dossier de ton projet (voir le `.env.example` de l'exemple du dépôt) et la charger automatiquement avec le paquet `python-dotenv` — couvert plus bas.
:::

### Configurer le projet avec `uv`

```bash
uv init multi-agent-research
cd multi-agent-research
uv add deepagents langchain-openai python-dotenv
```

`deepagents` est le même framework LangChain que celui utilisé dans le projet Agent IA, et c'est ce qui rend tout ce projet petit : en plus de l'utilisation d'outils, il a une fonctionnalité intégrée de **sous-agents** — une façon de transmettre une partie d'une tâche à un agent instruit séparément, plutôt que de coder à la main ta propre boucle qui appelle le modèle trois fois avec trois prompts différents et recoud les résultats toi-même. `langchain-openai` parle à GitHub Models (son API est compatible OpenAI) ; remplace-le par `langchain-google-genai`, `langchain-groq`, ou `langchain-mistralai` si tu as choisi un fournisseur différent ci-dessus — Cerebras et OpenRouter sont aussi compatibles OpenAI, donc `langchain-openai` les couvre aussi, juste avec une `base_url` différente, exactement comme dans le projet Agent IA.

Crée un fichier `.env` (ne le valide jamais) avec la clé du fournisseur que tu as choisi :

```bash
# .env
GITHUB_TOKEN=your-key-here
```

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv add deepagents langchain-openai python-dotenv` terminé sans aucune erreur.</StepChecklistItem>
<StepChecklistItem>Un fichier `.env` existe dans le dossier du projet avec une vraie clé, et il n'est pas suivi par git (`uv init` te donne un `.gitignore` — confirme que `.env` y figure).</StepChecklistItem>
</StepChecklist>

## Étape 1 : Définis les sous-agents planificateur, chercheur et rédacteur

Chaque sous-agent dans `deepagents` n'est qu'un simple dict : un `name`, un `description` (utilisé par l'agent de niveau supérieur pour décider quand lui déléguer), un `system_prompt` (ses propres instructions étroites), et éventuellement ses propres `tools`. Crée `agent.py` :

```python
import os

from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

model = ChatOpenAI(
    model="gpt-4o-mini",  # confirm this still has a free tier before running
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

planner_subagent = {
    "name": "planner",
    "description": "Breaks a research question down into 3-5 focused, independently-answerable sub-questions.",
    "system_prompt": (
        "You are a research planner. Given a broad research question, break it "
        "into 3 to 5 specific, independently-answerable sub-questions that together "
        "cover the topic well. Output ONLY a numbered list of sub-questions -- no "
        "preamble, no answers, just the questions themselves."
    ),
}

researcher_subagent = {
    "name": "researcher",
    "description": "Answers one specific sub-question at a time, concisely and factually.",
    "system_prompt": (
        "You are a researcher. Answer the single sub-question you are given as "
        "accurately and concisely as you can, using your own knowledge. You have "
        "no web search tool in this version -- if you are not confident about a "
        "fact, say so explicitly rather than guessing. Answer in 2-4 sentences."
    ),
}

writer_subagent = {
    "name": "writer",
    "description": "Synthesizes a set of sub-question answers into one coherent final report.",
    "system_prompt": (
        "You are a writer. Given a research question and a set of sub-question/answer "
        "pairs, synthesize them into one coherent, well-organized report of a few "
        "paragraphs. Do not just concatenate the answers -- connect them into prose "
        "that reads as a single piece of writing, and note plainly if the underlying "
        "research flagged low confidence anywhere."
    ),
}
```

:::tip[Sois honnête sur ce que « recherche » signifie ici]
Le sous-agent chercheur ci-dessus répond depuis les propres connaissances d'entraînement du modèle — aucun véritable outil de recherche web n'est branché. C'est une simplification délibérée, pas un raccourci caché : cela garde ce projet petit et adapté au palier gratuit, mais cela signifie que les réponses peuvent être obsolètes ou fausses sur tout ce sur quoi le modèle n'a pas été bien entraîné, sans moyen de vérifier contre une source en direct. Voir « Où aller à partir d'ici » pour savoir comment brancher un vrai outil de recherche une fois que tu es à l'aise avec cette version.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`agent.py` définit `planner_subagent`, `researcher_subagent`, et `writer_subagent`, chacun avec un `system_prompt` distinct.</StepChecklistItem>
<StepChecklistItem>Chaque `system_prompt` dit clairement ce que ce rôle fait et *ne fait pas* — ex. le prompt du planificateur dit de ne pas répondre aux sous-questions qu'il génère.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Le prompt système du planificateur lui interdit explicitement de répondre à ses propres sous-questions. Que penses-tu qu'il arriverait au reste du pipeline s'il ignorait cette instruction et y répondait quand même ?
- Pourquoi pourrait-il compter que le `description` de chaque sous-agent soit écrit pour que l'*agent de niveau supérieur* le lise, pas un humain ? Que te coûterait ici un `description` vague (« fait des trucs de recherche ») ?

## Étape 2 : Relie les sous-agents entre eux et exécute-le

L'agent de niveau supérieur ne fait aucune recherche lui-même — tout son travail est de la délégation, dans l'ordre : planifier, puis rechercher chaque sous-question, puis rédiger. Ajoute ceci en bas de `agent.py` :

```python
agent = create_deep_agent(
    model=model,
    subagents=[planner_subagent, researcher_subagent, writer_subagent],
    system_prompt=(
        "You coordinate a research task using your sub-agents, strictly in this order: "
        "1) delegate to the 'planner' sub-agent to get a numbered list of sub-questions. "
        "2) delegate each sub-question, one at a time, to the 'researcher' sub-agent. "
        "3) delegate to the 'writer' sub-agent, giving it the original question plus every "
        "sub-question/answer pair, and have it produce the final report. "
        "Return ONLY the writer's final report as your answer -- no intermediate steps."
    ),
)

if __name__ == "__main__":
    question = "What makes a programming language good for beginners to learn first?"
    result = agent.invoke({"messages": [{"role": "user", "content": question}]})
    print(result["messages"][-1].content)
```

Exécute-le :

```bash
uv run python agent.py
```

`subagents=[...]` est tout le mécanisme : l'agent de niveau supérieur voit le `name` et le `description` de chaque sous-agent de la même façon qu'il verrait le nom et la docstring d'un outil, et décide quand transmettre à lequel, en se basant sur les instructions du `system_prompt` de niveau supérieur et l'état de la conversation jusqu'à présent. C'est exactement l'idée enseignée dans la section « Où aller à partir d'ici » du projet Agent IA, juste utilisée ici pour tout le pipeline plutôt que pour un spécialiste supplémentaire aux côtés d'un agent à usage général.

### Ce que tu devrais voir

Un seul bloc de texte affiché — le rapport final synthétisé du rédacteur, quelques paragraphes couvrant les sous-questions trouvées par le planificateur. Si tu affiches plutôt la liste complète de `result["messages"]` (le même modèle que le projet Agent IA), tu verras toute la trace : la liste numérotée du planificateur, chaque appel du chercheur et sa réponse, puis le passage final du rédacteur — tous comme de vrais messages échangés entre l'agent de niveau supérieur et chaque sous-agent.

Si à la place tu vois une trace d'erreur, vérifie laquelle — les mêmes trois catégories que le projet Agent IA : une variable d'environnement manquante/erronée (`KeyError`), une mauvaise clé (401/403), ou une limite de débit (429, voir le piège ci-dessous).

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python agent.py` affiche un rapport final, pas une trace d'erreur.</StepChecklistItem>
<StepChecklistItem>Le rapport se lit vraiment comme une synthèse de plusieurs sous-questions, pas un seul paragraphe superficiel.</StepChecklistItem>
<StepChecklistItem>Afficher la liste complète de `result["messages"]` montre que les trois rôles ont été réellement invoqués — planificateur, chercheur (plusieurs fois), puis rédacteur.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Essaie une question de recherche bien plus étroite (quelque chose avec fondamentalement une seule sous-question évidente) et une bien plus large (quelque chose qui pourrait se diviser en dix sous-questions). Comment le comportement du planificateur change-t-il, et la qualité du rapport final suit-elle la qualité de la décomposition réelle de la question ?
- Le `system_prompt` de niveau supérieur dit « retourne UNIQUEMENT le rapport final du rédacteur. » Que t'attendrais-tu à voir dans la sortie si tu retirais cette instruction ?

:::tip[Vérifie la documentation actuelle avant de t'appuyer dessus]
L'API de sous-agents de `deepagents` est plus récente et moins éprouvée que son API d'appel d'outils simple, et les deux ont déjà changé de forme une fois depuis les versions précédentes du projet Agent IA. Avant de construire dessus au-delà de cette leçon, parcours le propre README de `deepagents` pour sa forme actuelle de `subagents=[...]`, le même conseil donné dans le projet Agent IA pour les autres arguments nommés de `create_deep_agent`.
:::

## ⚠️ Pièges courants

- **Fuite de rôles.** Si le `system_prompt` d'un sous-agent n'est pas assez étroit, il commence à faire le travail d'un autre rôle — un planificateur qui répond aussi à ses propres questions, ou un rédacteur qui invente de nouvelles sous-questions au lieu de synthétiser celles qu'on lui a données. Si la sortie semble étrange, le correctif est presque toujours de resserrer le prompt du sous-agent fautif, pas d'ajouter plus d'instructions à celui de niveau supérieur.
- **Les limites de débit se multiplient vite.** Une question de recherche ici coûte au moins un appel du planificateur, un appel du chercheur *par sous-question* (typiquement 3-5), et un appel du rédacteur — six à huit allers-retours minimum, contre les appels à un chiffre que fait un simple agent d'appel d'outils. Attends-toi à heurter un 429 plus tôt que dans le projet Agent IA ; le même modèle de réessai avec délai de la fonction `ask()` de ce projet s'applique ici sans changement.
- **Le chercheur hallucine avec assurance.** Sans véritable outil de recherche, le sous-agent chercheur peut produire une réponse fluide qui semble juste mais qui est fausse sur tout ce qui est obscur ou récent. Son prompt système lui demande de signaler explicitement une faible confiance, mais il n'est pas garanti qu'un modèle de langage suive cette instruction parfaitement à chaque fois — vérifie les réponses sur des questions dont tu connais déjà la réponse.
- **Le rédacteur perd les réponses des sous-questions au lieu de les citer.** Si le `system_prompt` de niveau supérieur ne dit pas clairement à l'agent de niveau supérieur de passer *chaque* paire sous-question/réponse au rédacteur, il peut n'en résumer que certaines, ou inventer des connexions entre des réponses qu'il n'a jamais réellement vues. Affiche la trace complète (Étape 2) pour confirmer que le rédacteur a bien reçu tout ce que le chercheur a produit.

## Ce que tu viens de construire

Un petit pipeline où trois agents aux instructions étroites, chacun avec un prompt système limité à exactement un travail, produisent un résultat qu'aucun d'eux ne pourrait produire correctement seul — un planificateur doué pour décomposer, pas pour répondre ; un chercheur doué pour répondre à une question ciblée, pas pour gérer un rapport entier ; un rédacteur doué pour synthétiser, pas pour rechercher. C'est la même idée derrière les plus grands systèmes multi-agents en production : pas un énorme prompt essayant de tout faire, mais plusieurs petits, chacun facile à raisonner et à déboguer séparément, coordonnés par un agent de niveau supérieur qui ne décide que *qui* continue.

## Où aller à partir d'ici

- **Donne au chercheur un véritable outil de recherche.** La plus grande faille d'honnêteté de cette version est que « recherche » ici signifie « les propres connaissances d'entraînement du modèle », pas une vraie recherche web. Plusieurs fournisseurs ont des API de recherche de palier gratuit (Tavily et l'API non officielle de DuckDuckGo sont des points de départ courants) — branche-en une comme outil sur `researcher_subagent["tools"]`, le même modèle `tools=[...]` du projet Agent IA, et le chercheur pourra citer de vraies sources actuelles au lieu de se rappeler des données d'entraînement.
- **Ajoute un quatrième rôle**, comme un sous-agent critique qui examine le rapport du rédacteur par rapport aux sous-questions originales et signale les lacunes avant la sortie finale — un modèle courant une fois qu'un pipeline a plus de quelques étapes.
- **Diffuse la sortie intermédiaire** au lieu de n'afficher que le rapport final, pour que tu puisses voir arriver les sous-questions du planificateur et chaque réponse du chercheur en temps réel plutôt que d'attendre que tout le pipeline se termine en silence.
- Revisite la section du projet Agent IA sur la trace interne complète (`result["messages"]`) — la même technique pour transformer un résultat brut bruyant en un compte rendu lisible étape par étape s'applique ici, juste avec les messages de trois rôles entrelacés au lieu d'un.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis — et son README a un guide complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, valider tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est présumée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="multi-agent-research" />
