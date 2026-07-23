---
id: 2026-ai-agent
title: "Construire un agent IA"
sidebar_label: "Construire un agent IA"
slug: /projects/ai-agent
description: "Passez du bac à sable dans le navigateur à du vrai Python : installez Python en local et construisez votre premier agent IA avec deepagents de LangChain."
---

import CapstoneProgressCheckbox from '@site/src/components/CapstoneProgressCheckbox';

# 🌍 Construire un agent IA

Tout jusqu'ici tournait dans un bac à sable isolé, dans le navigateur — pour que vous puissiez commencer à écrire du Python dès le premier jour sans aucune configuration. Ce projet est l'étape de remise de diplôme : installez Python pour de vrai sur votre propre machine, puis utilisez-le pour construire quelque chose que le bac à sable n'a jamais pu exécuter — un agent IA avec sa propre clé API, appelant un vrai modèle de langage.

Ceci est optionnel et non noté — un bon choix une fois que vous avez terminé Python 101 (les bases de manipulation de données de Data Analysis sont un plus, pas un prérequis). Voir [Projets concrets](/docs/projects) pour la liste complète, qui s'enrichit au fil du temps.

## 🎯 Ce que vous allez faire

1. Installer `uv`, un outil moderne et rapide pour gérer Python lui-même et les dépendances de votre projet — sans besoin d'installateur Python séparé.
2. Obtenir une clé API IA de palier gratuit. **Vous êtes libre d'utiliser le fournisseur de votre choix** — GitHub Models est le défaut suggéré ci-dessous car il ne nécessite pas d'inscription séparée (vous avez déjà un compte GitHub), mais Gemini, Groq, Mistral, Cerebras, et OpenRouter ont tous des paliers gratuits utilisables aussi.
3. Configurer un petit projet et installer `deepagents` de LangChain.
4. Écrire et exécuter un petit agent, localement, depuis votre propre terminal.

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

### Installer un véritable interpréteur Python

Contrairement aux bacs à sable dans le navigateur, `uv` peut récupérer et gérer un véritable interpréteur Python directement sur votre machine — vous n'avez pas besoin de visiter séparément python.org :

```bash
uv python install 3.12
```

C'est votre moment de remise de diplôme : un vrai Python, installé et géré sur votre propre ordinateur, pas dans un bac à sable de navigateur.

## Étape 2 : obtenir une clé API IA gratuite

**Choisissez le fournisseur de votre choix** — aucun d'eux ne nécessite de carte de crédit au moment de l'écriture, et ce cours n'en favorise aucun par rapport aux autres. L'agent d'exemple du dépôt du cours ([`examples/ai-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent)) prend en charge les six directement, sélectionnés avec un seul paramètre.

| Fournisseur | Où obtenir une clé | Pourquoi vous pourriez le choisir |
|---|---|---|
| **GitHub Models** *(défaut suggéré)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un jeton d'accès personnel avec le scope `models: read` | Pas d'inscription séparée — vous avez déjà un compte GitHub. Limites de palier gratuit plus généreuses que celles de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | L'option la plus couramment référencée ; utilisée dans les versions précédentes de cette page. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inférence rapide, palier gratuit généreux, pas de carte. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | L'un des quotas gratuits permanents les plus généreux. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Volume élevé de tokens quotidiens, pas de carte. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Une seule API, de nombreux modèles gratuits — bon pour comparer les fournisseurs. |

Quel que soit celui que vous choisissez, le processus est le même :

1. Connectez-vous et générez une clé API sur le site de ce fournisseur.
2. **Ne collez jamais cette clé directement dans le code ni ne la validez dans un dépôt.** Définissez-la plutôt comme une variable d'environnement :

```bash
# macOS / Linux (ajoutez à ~/.bashrc ou ~/.zshrc pour la rendre persistante)
export GITHUB_TOKEN="your-key-here"   # or GOOGLE_API_KEY, GROQ_API_KEY, etc. -- match your provider

# Windows (PowerShell)
$env:GITHUB_TOKEN = "your-key-here"
```

Une clé API est un secret, exactement comme un mot de passe — quiconque la possède peut utiliser le quota de votre compte. La traiter comme une variable d'environnement plutôt qu'une chaîne codée en dur est la pratique standard exactement pour cette raison, et c'est la première véritable habitude de sécurité que ce cours vous demande de développer.

:::tip[Un fichier .env est souvent plus pratique qu'export]
Plutôt que de faire `export` d'une clé à chaque nouvelle session de terminal, vous pouvez la mettre dans un fichier `.env` dans le dossier de votre projet (voir le `.env.example` de l'exemple du dépôt) et la charger automatiquement avec le paquet `python-dotenv` — couvert à l'étape 4.
:::

## Étape 3 : configurer le projet avec `uv`

```bash
uv init ai-agent
cd ai-agent
uv add deepagents langchain-openai python-dotenv
```

`uv init` crée un petit projet (un `pyproject.toml` suivant vos dépendances) et `uv add` installe des paquets dans un environnement isolé pour ce projet — automatiquement, sans configuration manuelle d'environnement virtuel. `deepagents` est le framework de LangChain pour construire des agents avec planification, utilisation d'outils, et délégation à des sous-agents intégrées ; `langchain-openai` est le paquet d'intégration que cet exemple utilise pour parler à GitHub Models (son API est compatible OpenAI, donc le paquet d'intégration OpenAI fonctionne pour lui — voir l'astuce ci-dessous si vous avez choisi un fournisseur différent) ; `python-dotenv` vous permet de garder votre clé API dans un fichier `.env` local plutôt que de faire `export` à chaque session.

Si vous avez choisi un fournisseur différent à l'étape 2, remplacez `langchain-openai` par le propre paquet de ce fournisseur — `langchain-google-genai` (Gemini), `langchain-groq` (Groq), ou `langchain-mistralai` (Mistral). Cerebras et OpenRouter sont aussi compatibles OpenAI, donc ils utilisent aussi `langchain-openai`, juste avec une `base_url` différente.

:::tip[Vérifiez la documentation actuelle — et le nom du modèle]
Les frameworks d'agents évoluent vite, tout comme les noms de modèles : ils sont renommés et retirés sur une échelle de temps de mois, pas d'années. Les propres arguments nommés de `create_deep_agent` ont déjà changé une fois depuis les versions précédentes de cette page (c'est `system_prompt`, pas `instructions`) — un rappel que cet extrait peut devenir obsolète même après avoir été vérifié une fois. Utilisez un identifiant de modèle explicite et versionné plutôt qu'un alias `-latest` : plusieurs fournisseurs, dont Google, ont déprécié ceux-ci car ils basculent silencieusement vers une nouvelle version de modèle, ce qui peut casser du code fonctionnel sans avertissement. Avant d'exécuter ceci, vérifiez la page de tarification/modèles actuelle de votre fournisseur, et parcourez le propre README de `deepagents` pour son API actuelle.
:::

## Étape 4 : écrire votre premier agent

Créez un fichier `.env` (ne le validez jamais) avec la clé du fournisseur que vous avez choisi :

```bash
# .env
GITHUB_TOKEN=your-key-here
```

Puis créez `agent.py` :

```python
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from deepagents import create_deep_agent

load_dotenv()  # reads .env into the environment, if present

def search_course_topics(query: str) -> str:
    """A toy tool: pretends to look up whether a topic was covered in this course."""
    topics = ["variables", "loops", "functions", "csv files", "pandas", "dataframes", "groupby"]
    matches = [t for t in topics if query.lower() in t]
    return f"Matching topics: {matches}" if matches else "No matching topics found."

def count_weeks_remaining(current_week: int) -> str:
    """A second toy tool: how many weeks are left in the 10-week course."""
    remaining = max(0, 10 - current_week)
    return f"{remaining} week(s) remaining out of 10."

model = ChatOpenAI(
    model="gpt-4o-mini",  # confirm this still has a free tier before running — see the tip above
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

agent = create_deep_agent(
    model=model,
    tools=[search_course_topics, count_weeks_remaining],
    system_prompt="You help students figure out whether a topic was covered in their course.",
)

if __name__ == "__main__":
    result = agent.invoke({"messages": [{"role": "user", "content": "Did we cover groupby?"}]})
    print(result["messages"][-1].content)  # just the final answer, not the full internal trace
```

Exécutez-le — avec `uv`, aucune activation manuelle d'environnement n'est nécessaire :

```bash
uv run python agent.py
```

`load_dotenv()` lit votre fichier `.env` dans `os.environ` avant que quoi que ce soit d'autre ne s'exécute, donc `os.environ["GITHUB_TOKEN"]` trouve la clé que vous avez définie à l'étape 2 — le même concept de module `os` que `input()` lisant depuis le clavier, sauf qu'il lit depuis un fichier à la place. `create_deep_agent` relie le modèle à une liste de fonctions Python que l'agent peut appeler comme **outils** — c'est l'idée centrale derrière les agents : un modèle de langage qui ne peut pas seulement répondre par du texte, mais décider d'appeler votre code, lire le résultat, et l'utiliser pour éclairer sa réponse.

Remarquez `tools=[search_course_topics, count_weeks_remaining]` — deux outils, pas un. Le modèle choisit *quel* outil (le cas échéant) correspond à la question, entièrement par lui-même : demandez « Did we cover groupby? » et il appelle `search_course_topics` ; demandez « How many weeks are left if I'm on week 4? » et il appelle `count_weeks_remaining` à la place. Vous n'écrivez jamais vous-même une chaîne `if`/`elif` acheminant les questions vers les outils — la docstring de chaque fonction (la chaîne entre triples guillemets juste après `def`) est ce que le modèle lit pour décider quel outil correspond à quelle demande, exactement comme les docstrings de la semaine 4 de Python 101, sauf qu'ici c'est un modèle de langage qui les lit, pas un humain parcourant votre code.

### Comment l'agent décide réellement quoi faire

Rien ici n'est magique — `create_deep_agent` construit une boucle, et chaque itération de cette boucle est un appel API ordinaire au modèle que vous avez configuré :

1. Votre question va au modèle, avec la *liste* des outils disponibles (leurs noms, paramètres, et docstrings — pas leur code).
2. Le modèle répond soit par une réponse textuelle finale, **soit** par une demande d'appel d'un outil spécifique avec des arguments spécifiques.
3. S'il a demandé un appel d'outil, votre propre code Python (pas le modèle) exécute réellement cette fonction et obtient un vrai résultat.
4. Ce résultat retourne au modèle comme nouveau contexte, et la boucle recommence à l'étape 2 — le modèle pourrait appeler un autre outil, ou avoir maintenant assez d'information pour répondre.
5. Une fois que le modèle répond avec du texte et aucune autre demande d'outil, la boucle s'arrête et c'est votre réponse finale.

C'est exactement pourquoi une erreur de limite de débit (voir ci-dessous) peut survenir même pour ce qui ressemble à « une question » — une question nécessitant deux appels d'outils coûte au moins trois allers-retours au modèle (décider d'appeler l'outil A, décider d'appeler l'outil B, produire la réponse finale), pas un.

### Ce que vous devriez voir

Une seule ligne affichée — la réponse finale de l'agent, quelque chose comme :

```
Yes, "groupby" was covered in the course.
```

Si à la place vous voyez une trace d'erreur Python, vérifiez laquelle :

- **`KeyError: 'GITHUB_TOKEN'`** — la variable d'environnement/valeur `.env` n'est pas trouvée. Confirmez que `.env` est dans le même dossier que `agent.py` et n'a pas de faute de frappe dans le nom de la variable, ou que vous avez bien exécuté `export` dans la même session de terminal depuis laquelle vous exécutez le script.
- **Une erreur d'authentification (401/403)** — la clé elle-même est incorrecte, expirée, ou (pour GitHub Models) manque le scope `models: read`. Régénérez-la.
- **Une erreur de limite de débit (429)** — voir la section suivante. C'est courant et attendu, pas un signe que quelque chose est cassé.

### Comprendre la trace interne complète

`result["messages"][-1].content` ci-dessus montre délibérément seulement la réponse finale. Si vous affichez tout le `result` à la place, vous verrez quelque chose de bien plus bruyant — chaque message que LangGraph a suivi en interne, chacun portant des champs de comptabilité en plus du contenu réel :

```python
result = agent.invoke({"messages": [{"role": "user", "content": "Did we cover groupby?"}]})
for message in result["messages"]:
    print(type(message).__name__, "->", message)
```

Réduite à ce qui compte réellement, la trace derrière cette seule question ressemble à ceci :

| # | Type de message | Ce qu'il contient |
|---|---|---|
| 1 | `HumanMessage` | Votre question : `"Did we cover groupby?"` |
| 2 | `AIMessage` (sans texte) | Le modèle a décidé d'appeler `search_course_topics(query="groupby")` — pas encore de réponse, juste une demande d'outil |
| 3 | `ToolMessage` | La *vraie* valeur de retour de votre fonction Python : `"Matching topics: ['groupby']"` |
| 4 | `AIMessage` (finale) | La véritable réponse du modèle, maintenant qu'il a le résultat de l'outil : `"Yes, groupby was covered."` |

Les parties bruyantes que vous pouvez ignorer sans risque en lisant une trace brute : les champs `id`/`tool_call_id` (comptabilité pour faire correspondre un appel d'outil à son résultat), les traces de raisonnement interne spécifiques au fournisseur (pas destinées à être lisibles par un humain), et `usage_metadata` (comptages de tokens, utile pour le suivi des coûts, sans rapport avec la conversation elle-même). Cette forme à 4 lignes — question, appel d'outil, résultat d'outil, réponse — est toute la boucle d'agent de la section précédente, simplement écrite comme données plutôt que comme une liste numérotée.

### Gérer les limites de débit

Chaque palier gratuit ici plafonne combien de requêtes vous pouvez faire par minute ou par jour, et chaque tour de l'agent — décider d'appeler un outil, puis lire le résultat — utilise au moins une requête. Exécutez quelques questions à la suite et vous pourriez bien voir quelque chose comme :

```
Error calling model ... (RESOURCE_EXHAUSTED): 429 RESOURCE_EXHAUSTED.
...Please retry in 41.7s.
```

Ce n'est pas un bug dans votre code — c'est le fournisseur qui vous dit de ralentir. Deux façons de gérer cela :

1. **Le plus simple** : attendez simplement le nombre de secondes suggéré et relancez le script.
2. **Plus robuste** : enveloppez l'appel `agent.invoke(...)` dans un `try`/`except` qui capture l'erreur, attend, et réessaie automatiquement — exactement le motif enseigné comme contenu bonus dans la semaine 4 de Python 101. L'exemple plus complet du dépôt fait cela pour de vrai : voir `ask()` dans [`examples/ai-agent/agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent/agent.py) pour une version fonctionnelle que vous pouvez copier, y compris l'analyse du délai de réessai suggéré par le fournisseur à partir du message d'erreur.

:::tip[Vous utilisez un fournisseur différent ?]
Remplacez le bloc `ChatOpenAI(...)` par le propre client de votre fournisseur — par ex. `ChatGoogleGenerativeAI(model="gemini-3.5-flash", google_api_key=os.environ["GOOGLE_API_KEY"])` pour Gemini, ou `ChatGroq(model="llama-3.3-70b-versatile", api_key=os.environ["GROQ_API_KEY"])` pour Groq. Tout le reste dans ce fichier reste identique — `deepagents` ne se soucie pas de quel fournisseur est derrière le modèle. Voir [`examples/ai-agent/agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent) dans le dépôt du cours pour les six connectés côte à côte, sélectionnables avec une seule variable d'environnement.
:::

## Ce que vous venez de construire

`search_course_topics` est délibérément trivial — les outils d'un vrai agent pourraient chercher sur le web, interroger une base de données, ou exécuter du code. Mais la forme est la même que celle qui alimente des systèmes bien plus capables : un modèle qui raisonne sur une tâche, décide quel outil appeler et avec quels arguments, lit le résultat de l'outil, et continue — parfois en appelant plusieurs outils en séquence avant de répondre. Vous venez de construire la plus petite version possible de cette boucle, localement, avec votre propre clé.

:::tip[Exécutez une version plus complète sans aucune configuration locale]
[`examples/ai-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent) dans le dépôt du cours n'est **pas une copie du code ci-dessus** — c'est une version délibérément plus complète, avec de vrais outils (elle recherche dans les vrais fichiers de leçon de ce cours et analyse ses vrais jeux de données avec pandas, au lieu d'une liste de sujets codée en dur) et une prise en charge des six fournisseurs du tableau ci-dessus, sélectionnés avec un seul paramètre. Clonez-le, ou ouvrez tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, et `uv` déjà installés) et exécutez-le depuis là.
:::

## Où aller à partir d'ici

- Donnez à votre agent un outil véritablement *utile*, pas juste un jouet — un qui lit un vrai fichier local, ou appelle une vraie API publique. La copie [`examples/ai-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent) du dépôt fait déjà cela : elle recherche dans les vrais fichiers de leçon de ce cours et analyse ses vrais jeux de données avec pandas, au lieu de deviner.
- Regardez la prise en charge par `deepagents` des **sous-agents** — déléguer une partie d'une tâche à un agent instruit séparément, similaire à la façon dont un manager pourrait déléguer une sous-tâche à un spécialiste :

```python
from deepagents import create_deep_agent

research_subagent = {
    "name": "topic-researcher",
    "description": "Looks up whether a topic was covered in the course, in detail.",
    "system_prompt": "You research course topics thoroughly using the available tools.",
    "tools": [search_course_topics],
}

agent = create_deep_agent(
    model=model,
    tools=[search_course_topics, count_weeks_remaining],
    subagents=[research_subagent],
    system_prompt="Delegate topic-research questions to the topic-researcher sub-agent.",
)
```

L'agent principal peut maintenant transférer une sous-tâche à `topic-researcher` au lieu de tout faire lui-même — utile une fois que les instructions et la liste d'outils d'un seul agent commencent à devenir trop volumineuses pour être raisonnées en un seul endroit.
- Revisitez le contenu bonus `try`/`except` et `class` de Python 101 — le vrai code d'agent s'appuie constamment sur les deux (capturer un appel d'outil échoué, envelopper un état lié dans une classe) de façons que le programme principal de ce cours a délibérément évitées.

## Partagez votre agent avec la classe

Vous avez construit quelque chose dont vous êtes fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie d'agents que d'autres étudiants ont soumis — et son README a un guide complet et accessible aux débutants pour ajouter le vôtre via une **pull request**, même si vous n'avez jamais utilisé git auparavant : forker le dépôt, créer une branche, valider vos fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est présumée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<CapstoneProgressCheckbox capstoneId="2026-ai-agent" />
