---
title: "Construire un agent IA"
description: "Passez du bac à sable dans le navigateur à du vrai Python : installez Python en local et construisez votre premier agent IA avec deepagents de LangChain."
difficulty: intermediate
---


# 🤖 Construire un agent IA

Tout jusqu'ici tournait dans un bac à sable isolé, dans le navigateur — pour que vous puissiez commencer à écrire du Python dès le premier jour sans aucune configuration. Ce projet est l'étape de remise de diplôme : installez Python pour de vrai sur votre propre machine, puis utilisez-le pour construire quelque chose que le bac à sable n'a jamais pu exécuter — un agent IA avec sa propre clé API, appelant un vrai modèle de langage.

Ceci est optionnel et non noté — un bon choix une fois que vous avez terminé Python 101 (les bases de manipulation de données de Data Analysis sont un plus, pas un prérequis). Voir [Projets concrets](/fr/projets) pour la liste complète, qui s'enrichit au fil du temps.

## 🎯 Ce que tu vas faire

1. Installer `uv`, un outil moderne et rapide pour gérer Python lui-même et les dépendances de ton projet — sans besoin d'installateur Python séparé.
2. Obtenir une clé API IA de palier gratuit. **Tu es libre d'utiliser le fournisseur de ton choix** — GitHub Models est le défaut suggéré ci-dessous car il ne nécessite pas d'inscription séparée (tu as déjà un compte GitHub), mais Gemini, Groq, Mistral, Cerebras, et OpenRouter ont tous des paliers gratuits utilisables aussi.
3. Mettre en place un petit projet et installer `deepagents` de LangChain.
4. Écrire un petit agent avec deux outils jouets, l'exécuter en local, et le voir choisir le bon outil pour chaque question.
5. Ajouter la gestion des erreurs de limite de débit et une boucle de chat interactive pour pouvoir poser des questions à répétition sans redémarrer le script.

## Où exécuter ceci

**En local avec `uv`** est le chemin que suivent les étapes de cette leçon, et celui recommandé — c'est du vrai Python qui tourne sur ta propre machine, la même démarche de « passage au vrai Python » que chaque autre projet de cette section. La section Configuration ci-dessous explique comment l'installer.

**GitHub Codespaces** est une alternative sans configuration si tu préfères ne rien installer localement pour l'instant : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt) et exécute exactement les mêmes commandes `uv` depuis un terminal dans l'onglet de ton navigateur.

**Google Colab, Kaggle Notebooks, ou Binder** fonctionnent aussi, puisque ce projet n'a pas besoin de GPU — une version réelle et exécutable en notebook de l'agent de ce projet (les mêmes outils jouets et la même configuration `create_deep_agent` qu'à l'Étape 1 ci-dessous) se trouve dans [`examples/ai-agent/notebook.fr.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-agent/notebook.fr.ipynb). Clique sur un badge pour le lancer directement, sans aucune installation locale :

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-agent/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-agent/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-agent%2Fnotebook.fr.ipynb)

Sois honnête avec toi-même sur le compromis, cependant : c'est une façon moins fidèle de vivre le projet qu'un vrai projet `uv` local — pas de fichiers séparés, pas de vraie structure de projet, juste des cellules dans un notebook. Traite-le comme un moyen rapide d'expérimenter, pas comme le chemin principal.

## Configuration

Tout ce dont tu as besoin avant d'écrire une seule ligne de l'agent lui-même : un vrai Python, une clé API gratuite, et un petit projet pour contenir les deux.

### Installe `uv`

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

### Installe un véritable interpréteur Python

Contrairement aux bacs à sable dans le navigateur, `uv` peut récupérer et gérer un véritable interpréteur Python directement sur ta machine — tu n'as pas besoin de visiter séparément python.org :

```bash
uv python install 3.12
```

C'est ton moment de remise de diplôme : un vrai Python, installé et géré sur ton propre ordinateur, pas dans un bac à sable de navigateur.

### Obtiens une clé API IA gratuite

**Choisis le fournisseur que tu préfères** — aucun ne nécessite de carte de crédit au moment de l'écriture, et ce cours n'en favorise aucun. L'agent d'exemple du dépôt du cours ([`examples/ai-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent)) prend en charge les six directement, sélectionnés avec un seul paramètre.

| Fournisseur | Où obtenir une clé | Pourquoi le choisir |
|---|---|---|
| **GitHub Models** *(défaut suggéré)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un jeton d'accès personnel avec le scope `models: read` | Pas d'inscription séparée — tu as déjà un compte GitHub. Limites de palier gratuit plus généreuses que celles de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | L'option la plus couramment référencée ; utilisée dans les versions précédentes de cette page. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inférence rapide, palier gratuit généreux, pas de carte. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | L'un des quotas gratuits permanents les plus généreux. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Volume élevé de tokens quotidiens, pas de carte. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Une seule API, de nombreux modèles gratuits — bon pour comparer les fournisseurs. |

Quel que soit celui que tu choisis, le processus est le même :

1. Connecte-toi et génère une clé API sur le site de ce fournisseur.
2. **Ne colle jamais cette clé directement dans le code ni ne la commite dans un dépôt.** Définis-la plutôt comme une variable d'environnement :

```bash
# macOS / Linux (ajoute à ~/.bashrc ou ~/.zshrc pour la rendre persistante)
export GITHUB_TOKEN="your-key-here"   # or GOOGLE_API_KEY, GROQ_API_KEY, etc. -- match your provider

# Windows (PowerShell)
$env:GITHUB_TOKEN = "your-key-here"
```

Une clé API est un secret, exactement comme un mot de passe — quiconque la possède peut utiliser le quota de ton compte. La traiter comme une variable d'environnement plutôt qu'une chaîne codée en dur est la pratique standard exactement pour cette raison, et c'est la première véritable habitude de sécurité que ce cours te demande de développer.

:::tip[Un fichier .env est souvent plus pratique qu'export]
Plutôt que de faire `export` d'une clé à chaque nouvelle session de terminal, tu peux la mettre dans un fichier `.env` dans le dossier de ton projet (voir le `.env.example` de l'exemple du dépôt) et la charger automatiquement avec le paquet `python-dotenv` — couvert plus bas.
:::

### Mets en place le projet avec `uv`

```bash
uv init ai-agent
cd ai-agent
uv add deepagents langchain-openai python-dotenv
```

`uv init` crée un petit projet (un `pyproject.toml` suivant tes dépendances) et `uv add` installe des paquets dans un environnement isolé pour ce projet — automatiquement, sans configuration manuelle d'environnement virtuel. `deepagents` est le framework de LangChain pour construire des agents avec planification, utilisation d'outils, et délégation à des sous-agents intégrées ; `langchain-openai` est le paquet d'intégration que cet exemple utilise pour parler à GitHub Models (son API est compatible OpenAI, donc le paquet d'intégration OpenAI fonctionne pour lui — voir l'astuce ci-dessous si tu as choisi un fournisseur différent) ; `python-dotenv` te permet de garder ta clé API dans un fichier `.env` local plutôt que de faire `export` à chaque session.

Si tu as choisi un fournisseur différent ci-dessus, remplace `langchain-openai` par le propre paquet de ce fournisseur — `langchain-google-genai` (Gemini), `langchain-groq` (Groq), ou `langchain-mistralai` (Mistral). Cerebras et OpenRouter sont aussi compatibles OpenAI, donc ils utilisent aussi `langchain-openai`, juste avec une `base_url` différente.

:::tip[Vérifie la documentation actuelle — et le nom du modèle]
Les frameworks d'agents évoluent vite, tout comme les noms de modèles : ils sont renommés et retirés sur une échelle de temps de mois, pas d'années. Les propres arguments nommés de `create_deep_agent` ont déjà changé une fois depuis les versions précédentes de cette page (c'est `system_prompt`, pas `instructions`) — un rappel que cet extrait peut devenir obsolète même après avoir été vérifié une fois. Utilise un identifiant de modèle explicite et versionné plutôt qu'un alias `-latest` : plusieurs fournisseurs, dont Google, ont déprécié ceux-ci car ils basculent silencieusement vers une nouvelle version de modèle, ce qui peut casser du code fonctionnel sans avertissement. Avant d'exécuter ceci, vérifie la page de tarification/modèles actuelle de ton fournisseur, et parcoure le propre README de `deepagents` pour son API actuelle.
:::

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `ai-agent/` existe avec un `pyproject.toml`, et `deepagents`, `langchain-openai`, et `python-dotenv` sont installés.
- ✅ Tu as une vraie clé API d'un fournisseur, exportée comme variable d'environnement ou enregistrée dans un fichier `.env` dans le dossier de ton projet — pas collée dans un script.

## Étape 1 : Écrire ton premier agent

C'est l'étape centrale : deux fonctions Python ordinaires qui deviennent les outils de l'agent, un modèle relié à ta clé API, et `create_deep_agent` qui les assemble. Les docstrings de chaque fonction sont ce que le modèle lit pour décider quel outil correspond à une question — pas le code à l'intérieur.

### 1.1 Écris `agent.py`

Crée un fichier `.env` (ne le commite jamais) avec la clé du fournisseur que tu as choisi :

```bash
# .env
GITHUB_TOKEN=your-key-here
```

Maintenant crée `agent.py` :

**👟 Indice de départ :** Deux fonctions Python ordinaires avec des type hints et des docstrings deviennent les outils de l'agent ; `create_deep_agent(model=..., tools=[...], system_prompt=...)` les relie au modèle — les docstrings sont ce que le modèle lit pour décider quel outil correspond à une question, pas le code à l'intérieur :

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

**🎯 Résultat attendu :** `uv run python agent.py` affiche une seule ligne — la réponse finale de l'agent, quelque chose comme `Yes, "groupby" was covered in the course.`

**🩹 Si ça ne marche pas :** Un `KeyError: 'GITHUB_TOKEN'` signifie que la variable d'environnement/valeur `.env` n'est pas trouvée — confirme que `.env` est dans le même dossier que `agent.py`, sans faute de frappe dans le nom de la variable. Un `401`/`403` signifie que la clé elle-même est incorrecte, expirée, ou manque le bon scope — régénère-la. Une erreur de limite de débit `429` est attendue et couverte à l'Étape 3, pas un bug.

### 1.2 Comprends ce que font `load_dotenv` et `create_deep_agent`

`load_dotenv()` lit ton fichier `.env` dans `os.environ` avant que quoi que ce soit d'autre ne s'exécute, donc `os.environ["GITHUB_TOKEN"]` trouve la clé que tu as définie lors de la Configuration — le même concept de module `os` que `input()` lisant depuis le clavier, sauf qu'il lit depuis un fichier à la place. `create_deep_agent` relie le modèle à une liste de fonctions Python que l'agent peut appeler comme **outils** — c'est l'idée centrale derrière les agents : un modèle de langage qui ne peut pas seulement répondre par du texte, mais décider d'appeler ton code, lire le résultat, et l'utiliser pour éclairer sa réponse.

Remarque `tools=[search_course_topics, count_weeks_remaining]` — deux outils, pas un. Le modèle choisit *quel* outil (le cas échéant) correspond à la question, entièrement par lui-même : demande « Did we cover groupby? » et il appelle `search_course_topics` ; demande « How many weeks are left if I'm on week 4? » et il appelle `count_weeks_remaining` à la place. Tu n'écris jamais toi-même une chaîne `if`/`elif` acheminant les questions vers les outils — la docstring de chaque fonction (la chaîne entre triples guillemets juste après `def`) est ce que le modèle lit pour décider quel outil correspond à quelle demande, exactement comme les docstrings de la semaine 4 de Python 101, sauf qu'ici c'est un modèle de langage qui les lit, pas un humain parcourant ton code.

### 1.3 Vérifie l'agent

**✅ Liste de vérification**

- ✅ `uv run python agent.py` affiche une seule réponse cohérente — pas une trace d'erreur ou une chaîne vide.
- ✅ La réponse fait référence aux données de l'outil (mentionne « groupby » comme sujet du cours), pas une réponse générique.
- ✅ Tu peux expliquer, dans tes propres mots, pourquoi `tools=[search_course_topics, count_weeks_remaining]` passe deux fonctions et le modèle en choisit une de lui-même.

**🤔 Question(s) socratique(s)**

- Si tu ajoutais un troisième outil `def get_weather(city: str) -> str: ...` et que tu demandais « Did we cover groupby? », le modèle l'appellerait-il ? Pourquoi ou pourquoi non — qu'est-ce qui empêche le modèle d'appeler des outils qui ne correspondent pas à la question ?
- La docstring de `search_course_topics` dit « pretends to look up ». Un vrai agent chercherait dans une base de données ou un système de fichiers à la place. Qu'est-ce qui changerait dans l'appel `create_deep_agent` si l'implémentation de la fonction changeait — le comportement de l'agent changerait-il, ou juste la logique interne de l'outil ?

## Étape 2 : Comprendre le fonctionnement de la boucle d'agent

Rien ici n'est magique — `create_deep_agent` construit une boucle, et chaque itération de cette boucle est un appel API ordinaire au modèle que tu as configuré. Comprendre cette boucle est ce qui sépare « j'ai exécuté du code que quelqu'un a écrit » de « je peux construire et déboguer des agents moi-même ».

### 2.1 La boucle à cinq étapes

Chaque interaction d'agent suit le même schéma :

1. Ta question va au modèle, avec la *liste* des outils disponibles (leurs noms, paramètres, et docstrings — pas leur code).
2. Le modèle répond soit par une réponse textuelle finale, **soit** par une demande d'appel d'un outil spécifique avec des arguments spécifiques.
3. S'il a demandé un appel d'outil, ton propre code Python (pas le modèle) exécute réellement cette fonction et obtient un vrai résultat.
4. Ce résultat retourne au modèle comme nouveau contexte, et la boucle recommence à l'étape 2 — le modèle pourrait appeler un autre outil, ou avoir maintenant assez d'information pour répondre.
5. Une fois que le modèle répond avec du texte et aucune autre demande d'outil, la boucle s'arrête et c'est ta réponse finale.

C'est exactement pourquoi une erreur de limite de débit (voir l'Étape 3) peut survenir même pour ce qui ressemble à « une question » — une question nécessitant deux appels d'outils coûte au moins trois allers-retours au modèle (décider d'appeler l'outil A, décider d'appeler l'outil B, produire la réponse finale), pas un.

### 2.2 Inspecte la trace interne complète

`result["messages"][-1].content` ci-dessus montre délibérément seulement la réponse finale. Si tu affiches tout le `result` à la place, tu verras quelque chose de bien plus bruyant — chaque message que LangGraph a suivi en interne, chacun portant des champs de comptabilité en plus du contenu réel :

```python
result = agent.invoke({"messages": [{"role": "user", "content": "Did we cover groupby?"}]})
for message in result["messages"]:
    print(type(message).__name__, "->", message)
```

Réduite à ce qui compte réellement, la trace derrière cette seule question ressemble à ceci :

| # | Type de message | Ce qu'il contient |
|---|---|---|
| 1 | `HumanMessage` | Ta question : `"Did we cover groupby?"` |
| 2 | `AIMessage` (sans texte) | Le modèle a décidé d'appeler `search_course_topics(query="groupby")` — pas encore de réponse, juste une demande d'outil |
| 3 | `ToolMessage` | La *vraie* valeur de retour de ta fonction Python : `"Matching topics: ['groupby']"` |
| 4 | `AIMessage` (finale) | La véritable réponse du modèle, maintenant qu'il a le résultat de l'outil : `"Yes, groupby was covered."` |

Les parties bruyantes que tu peux ignorer sans risque en lisant une trace brute : les champs `id`/`tool_call_id` (comptabilité pour faire correspondre un appel d'outil à son résultat), les traces de raisonnement interne spécifiques au fournisseur (pas destinées à être lisibles par un humain), et `usage_metadata` (comptages de tokens, utile pour le suivi des coûts, sans rapport avec la conversation elle-même). Cette forme à 4 lignes — question, appel d'outil, résultat d'outil, réponse — est toute la boucle d'agent de la section précédente, simplement écrite comme données plutôt que comme une liste numérotée.

### 2.3 Vérifie la compréhension de la boucle

**✅ Liste de vérification**

- ✅ Tu peux tracer la forme à 4 lignes (HumanMessage → AIMessage → ToolMessage → AIMessage) dans la sortie de ta propre exécution.
- ✅ Tu peux expliquer pourquoi une question qui nécessite deux appels d'outils produit au moins 3 allers-retours API, pas 1.
- ✅ Tu peux indiquer quelle ligne dans la trace est le *vrai* résultat de l'outil (de ton code Python), pas la prédiction du modèle.

**🤔 Question(s) socratique(s)**

- Le modèle voit les noms et docstrings des outils, pas le code source. Qu'arriverait-il si deux outils avaient la même docstring — le modèle en choisirait un au hasard, ou pourrait-il toujours les distinguer ? Comment cela affecte-t-il la façon dont tu écris les docstrings d'outils dans de vrais projets ?
- La ligne 2 de la trace n'a pas de texte — c'est juste une demande d'outil. Si tu n'affichais que `message.content` pour chaque message, que verrais-tu pour cette ligne, et pourquoi cela fait-il de `message.content` seul une vue incomplète de ce qui s'est passé ?

## Étape 3 : Gérer les limites de débit avec des tentatives de réessai

Chaque palier gratuit ici plafonne combien de requêtes tu peux faire par minute ou par jour, et chaque tour de l'agent — décider d'appeler un outil, puis lire le résultat — utilise au moins une requête. Exécute quelques questions à la suite et tu verras probablement quelque chose comme :

```
Error calling model ... (RESOURCE_EXHAUSTED): 429 RESOURCE_EXHAUSTED.
...Please retry in 41.7s.
```

Cela arrive même pour ce qui ressemble à « une question » — une question nécessitant deux appels d'outils coûte au moins trois allers-retours au modèle. Cette étape construit une gestion de réessai appropriée pour que ton agent ne plante pas quand cela arrive.

### 3.1 Écris le gestionnaire de réessai

**👟 Indice de départ :** Enveloppe l'appel `agent.invoke(...)` dans un `try`/`except` qui capture l'erreur, attend, et réessaie automatiquement — exactement le motif enseigné comme contenu bonus dans la semaine 4 de Python 101 :

```python
import time

def ask_with_retry(agent, question: str, max_retries: int = 3) -> str:
    """Ask the agent a question, retrying automatically on rate-limit errors."""
    for attempt in range(max_retries):
        try:
            result = agent.invoke({"messages": [{"role": "user", "content": question}]})
            return result["messages"][-1].content
        except Exception as e:
            error_str = str(e)
            if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str:
                wait = 30 * (attempt + 1)
                print(f"  Rate limited — waiting {wait}s before retry {attempt + 1}/{max_retries}...")
                time.sleep(wait)
            else:
                raise
    raise RuntimeError(f"Failed after {max_retries} retries due to rate limits.")

answer = ask_with_retry(agent, "Did we cover groupby?")
print(answer)
```

**🎯 Résultat attendu :** La même réponse que l'Étape 1, mais si tu touches une limite de débit, la fonction affiche un message « Rate limited — waiting 30s... » et réessaie silencieusement.

**🩹 Si ça ne marche pas :** Si tu vois le message de réessai mais que la réponse finale est encore une erreur de limite de débit, `max_retries` n'est pas assez élevé ou le temps d'attente est trop court — essaie d'augmenter les deux. Si des erreurs qui ne sont pas des limites de débit sont avalées, le vérificateur `if "RESOURCE_EXHAUSTED"` ne capture pas la bonne chaîne — affiche `error_str` pour voir le message d'erreur exact que ton fournisseur retourne.

### 3.2 Vérifie le gestionnaire de réessai

**✅ Liste de vérification**

- ✅ `ask_with_retry(agent, "Did we cover groupby?")` retourne la même réponse que l'appel brut `agent.invoke`.
- ✅ Une erreur de limite de débit déclenche un réessai (tu vois le message « Rate limited »), pas un plantage immédiat.
- ✅ Après `max_retries` erreurs de limite de débit consécutives, la fonction lève `RuntimeError`, pas un retour silencieux de `None`.

**🤔 Question(s) socratique(s)**

- Le réessai attend `30 * (attempt + 1)` secondes — 30s, 60s, 90s. D'où vient ce chiffre, et qu'arriverait-il si tu utilisais un délai fixe de 5 secondes à la place sur un fournisseur qui suggère d'attendre 60 secondes ?
- Qu'arriverait-il si tu réessayais sur *toutes* les exceptions, pas seulement les erreurs de limite de débit ? Donne un scénario concret où réessayer immédiatement aggraverait un problème.

## Étape 4 : Construire une boucle de chat interactive

Une question à valeur unique est une démo. Une boucle interactive — où tu tapes des questions et l'agent répond, une après l'autre, jusqu'à ce que tu décides d'arrêter — est un outil que tu utiliserais vraiment. Cette étape intègre le gestionnaire de réessai dans un REPL qui tourne dans ton terminal.

### 4.1 Écris la boucle de chat

**👟 Indice de départ :** `while True` est le schéma REPL standard — prompt, lecture, traitement, affichage, répétition. La vérification de `input()` pour quitter est la condition de sortie :

```python
def chat(agent):
    """Interactive REPL: type questions, get answers, type 'quit' to exit."""
    print("Agent chat — type 'quit' to exit.\n")
    while True:
        try:
            question = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break
        if not question:
            continue
        if question.lower() in {"quit", "exit", "q"}:
            print("Goodbye!")
            break
        answer = ask_with_retry(agent, question)
        print(f"Agent: {answer}\n")

if __name__ == "__main__":
    chat(agent)
```

**🎯 Résultat attendu :** Le script affiche « Agent chat — type 'quit' to exit. » et attend une entrée. Chaque question produit une réponse de l'agent, et taper `quit` sort proprement.

**🩹 Si ça ne marche pas :** Si `input()` lève immédiatement `EOFError` (cela arrive dans certains environnements de notebook), tu n'es pas dans un vrai terminal — utilise `uv run python agent.py` depuis un terminal au lieu d'exécuter dans une cellule de notebook. Si le script affiche « Goodbye! » sans demander, l'appel `input()` a été ignoré — vérifie que `chat(agent)` est à l'intérieur du bloc `if __name__ == "__main__":`.

### 4.2 Vérifie la boucle interactive

**✅ Liste de vérification**

- ✅ `uv run python agent.py` entre dans une boucle interactive et affiche « You: ».
- ✅ Taper une question affiche une réponse ; taper `quit` ou `exit` sort proprement.
- ✅ `Ctrl+C` (KeyboardInterrupt) sort aussi proprement de la boucle avec « Goodbye! ».

**🤔 Question(s) socratique(s)**

- La boucle de chat appelle `ask_with_retry` à chaque question, ce qui signifie que les réessais de limite de débit se produisent à l'intérieur de la boucle. Qu'arrive-t-il si un utilisateur tape une question, touche une limite de débit, et que le réessai attend 30 secondes — l'utilisateur regarde un terminal vide. Comment améliorerais-tu l'expérience utilisateur pendant l'attente ?
- Cette boucle n'a pas de mémoire de conversation — chaque question est indépendante. Qu'est-ce qui changerait dans `agent.invoke({"messages": [...]})` si tu voulais que l'agent se souvienne des trois dernières questions et réponses ? Comment `messages` en tant que liste supporte-t-il déjà cela ?

## ⚠️ Pièges courants

- **`KeyError: 'GITHUB_TOKEN'` au démarrage.** Le fichier `.env` est dans le mauvais dossier (il doit être dans le même dossier que `agent.py`), ou la variable d'environnement n'a pas été exportée dans la session de terminal en cours. Vérifie avec `echo $GITHUB_TOKEN` (macOS/Linux) ou `echo $env:GITHUB_TOKEN` (PowerShell) — si ça n'affiche rien, la clé n'est pas chargée.
- **Erreurs de limite de débit (`429 RESOURCE_EXHAUSTED`) sur des questions à la suite.** Ce n'est pas un bug — c'est le plafond de requêtes par minute du palier gratuit. Chaque tour de l'agent (décider l'appel d'outil → lire le résultat → répondre) coûte 2–3 appels API, donc tu touches la limite plus vite que prévu. Le gestionnaire de réessai de l'Étape 3 gère cela ; attendre la durée suggérée et relancer fonctionne aussi.
- **Le modèle ignore tes outils et répond de ses connaissances générales.** Si le modèle répond « I don't have access to course data » au lieu d'appeler un outil, le system prompt ou les docstrings des outils ne sont pas assez clairs sur ce que font les outils. Rends le system prompt explicite : « Use the provided tools to answer questions. Do not answer from general knowledge. »
- **L'API de `create_deep_agent` change entre les versions.** L'argument nommé `system_prompt` s'appelait `instructions` dans les versions précédentes — si tu vois un `TypeError: unexpected keyword argument 'system_prompt'`, vérifie le README actuel de `deepagents` et mets à jour en conséquence. Les frameworks d'agents évoluent vite ; fixe tes dépendances dans `pyproject.toml` si tu veux la reproductibilité.

## Ce que tu viens de construire

Un agent IA fonctionnel avec sa propre clé API, deux outils appelsables, un gestionnaire de réessai pour les limites de débit, et une boucle de chat interactive — tournant en local sur ta machine avec du vrai Python, pas dans un bac à sable de navigateur. Les outils sont délibérément triviaux, mais la forme est la même que celle qui alimente des systèmes bien plus capables : un modèle qui raisonne sur une tâche, décide quel outil appeler et avec quels arguments, lit le résultat de l'outil, et continue — parfois en appelant plusieurs outils en séquence avant de répondre. Tu viens de construire la plus petite version possible de cette boucle, à partir de zéro.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/ai-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent) dans le dépôt du cours n'est **pas une copie du code ci-dessus** — c'est une version délibérément plus complète, avec de vrais outils (elle recherche dans les vrais fichiers de leçon de ce cours et analyse ses vrais jeux de données avec pandas, au lieu d'une liste de sujets codée en dur) et une prise en charge des six fournisseurs du tableau ci-dessus, sélectionnés avec un seul paramètre. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, et `uv` déjà installés) et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Donne à ton agent un outil véritablement *utile*, pas juste un jouet — un qui lit un vrai fichier local, ou appelle une vraie API publique. La copie [`examples/ai-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent) du dépôt fait déjà cela : elle recherche dans les vrais fichiers de leçon de ce cours et analyse ses vrais jeux de données avec pandas, au lieu de deviner.
- Regarde la prise en charge par `deepagents` des **sous-agents** — déléguer une partie d'une tâche à un agent instruit séparément, similaire à la façon dont un manager pourrait déléguer une sous-tâche à un spécialiste :

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
- Revisite le contenu bonus `try`/`except` et `class` de Python 101 — le vrai code d'agent s'appuie constamment sur les deux (capturer un appel d'outil échoué, envelopper un état lié dans une classe) de façons que le programme principal de ce cours a délibérément évitées.

## Partage ton agent avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie d'agents que d'autres étudiants ont soumis — et son README a un guide complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
