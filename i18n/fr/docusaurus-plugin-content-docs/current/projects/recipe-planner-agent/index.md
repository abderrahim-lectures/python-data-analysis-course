---
id: recipe-planner-agent
title: "Construire un Agent Planificateur de Recettes"
sidebar_label: "Agent Planificateur de Recettes"
slug: /projects/recipe-planner-agent
description: "Passe du playground dans le navigateur au vrai Python : construis un agent IA qui utilise des outils avec les deepagents de LangChain, qui suggère des repas à partir des ingrédients que tu as sous la main, ancré dans une vraie base de données de recettes locale."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Agent Planificateur de Recettes

<ProjectPublishedDate projectId="recipe-planner-agent" />

<ProjectGreeting />

Tu tapes une liste d'ingrédients que tu as réellement sous la main — disons, des œufs, des tomates, de l'ail et du pain — et un agent suggère 2-3 vrais repas que tu pourrais préparer avec, puis construit une liste de courses pour tout ce qui manque pour le meilleur. Le twist qui en fait un agent authentiquement utile, pas juste un chatbot : il n'invente jamais de recette. Il appelle un outil qui cherche dans une vraie base de données de recettes locale et ne peut suggérer que ce que cet outil retourne réellement — la même idée d'ancrage derrière des systèmes bien plus sérieux de « ne laisse pas le modèle inventer des choses », réduite à quelque chose que tu peux construire en un après-midi.

Cela suppose du Python de niveau Python 101. Avoir fait le [projet Agent IA](/docs/projects/ai-agent) d'abord est une vraie aide, pas une exigence stricte — ce projet réutilise le même framework `deepagents` et le même motif d'appel d'outils, juste avec un outil plus structuré et façonné pour le monde réel. C'est optionnel et non noté ; voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Installer `uv`, obtenir une clé API IA de niveau gratuit, et configurer un petit projet avec `deepagents` — tout d'abord, dans Configuration ci-dessous.
2. Définir une petite « base de données de recettes » locale — une simple liste Python de dicts, 10-15 recettes, chacune avec sa propre liste d'ingrédients.
3. Écrire une fonction d'outil que l'agent peut appeler pour chercher dans cette base de données par les ingrédients que tu as sous la main.
4. Connecter cet outil à un agent `deepagents` avec un prompt système qui le garde ancré uniquement dans de vraies recettes.
5. Demander à l'agent des suggestions de repas à partir d'une vraie liste d'ingrédients, puis lui faire construire une liste de courses pour celui que tu choisis.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal et recommandé — du vrai Python installé sur ta propre machine, le même mouvement « gradue vers du vrai Python » que tous les autres projets de cette section. Les étapes 1 et suivantes supposent ce chemin.

**GitHub Codespaces** fonctionne tout aussi bien : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt) et exécute exactement les mêmes commandes `uv` depuis un terminal dans ton onglet de navigateur.

**Google Colab, Kaggle Notebooks, ou Binder** conviennent aussi — c'est un script léger qui appelle juste une API, pas de GPU ni d'installation lourde. Une version notebook prête à exécuter de ce projet ([`examples/recipe-planner-agent/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/recipe-planner-agent/notebook.ipynb)) est à un clic :

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/recipe-planner-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/recipe-planner-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Frecipe-planner-agent%2Fnotebook.ipynb)

C'est une façon de moindre fidélité de vivre le projet qu'un vrai projet `uv` local — pas de fichiers séparés, pas de vraie structure de projet — mais parfaitement faisable pour tester l'idée. Définis ta clé API avec `os.environ["GITHUB_TOKEN"] = "..."` dans la cellule getpass (ou utilise le panneau Secrets de Colab).

## Configuration

Tout ce qui est nécessaire avant que tu écrives une seule ligne de l'agent lui-même vit ici — installer `uv`, obtenir une clé API, créer le projet, et configurer ton fichier `.env`. Les étapes 1 et suivantes supposent que tout cela est déjà fait.

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

Si tu n'as pas encore un vrai interpréteur Python installé et géré par `uv` (d'un projet précédent de cette série), procure-toi-en un maintenant :

```bash
uv python install 3.12
```

### Obtenir une clé API IA gratuite

**Choisis le fournisseur que tu préfères** — aucun n'exige de carte de crédit au moment où ceci est écrit, et ce cours n'en favorise aucun.

| Fournisseur | Où obtenir une clé | Pourquoi tu pourrais le choisir |
|---|---|---|
| **GitHub Models** *(suggéré par défaut)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un jeton d'accès personnel avec le champ d'application `models: read` | Pas d'inscription séparée — tu as déjà un compte GitHub. Limites de niveau gratuit plus généreuses que celles de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | L'option la plus couramment référencée. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inférence rapide, niveau gratuit généreux, pas de carte. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Un des quotas gratuits permanents les plus généreux. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Volume quotidien de jetons élevé, pas de carte. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Une API, de nombreux modèles gratuits — bon pour comparer les fournisseurs. |

Quel que soit celui que tu choisis, le processus est le même : connecte-toi, génère une clé sur le site de ce fournisseur, et **ne la colle jamais directement dans le code ni ne la commit dans un dépôt**. Ce projet la garde dans un fichier `.env` (ci-dessous) à la place.

### Configurer le projet avec `uv`

```bash
uv init recipe-planner-agent
cd recipe-planner-agent
uv add deepagents langchain-openai python-dotenv
```

`uv init` crée un petit projet (un `pyproject.toml` qui suit tes dépendances) et `uv add` installe les paquets dans un environnement isolé pour ce projet automatiquement, sans configuration manuelle d'environnement virtuel. `deepagents` est le framework de LangChain pour construire des agents avec utilisation d'outils intégrée — le même que celui utilisé dans le [projet Agent IA](/docs/projects/ai-agent) ; `langchain-openai` est le paquet d'intégration que cet exemple utilise pour parler à GitHub Models (son API est compatible OpenAI, donc le paquet d'intégration OpenAI fonctionne aussi pour lui — voir l'astuce ci-dessous si tu as choisi un fournisseur différent) ; `python-dotenv` te permet de garder ta clé API dans un fichier `.env` local.

Si tu as choisi un fournisseur différent ci-dessus, remplace `langchain-openai` par le paquet de ce fournisseur — `langchain-google-genai` (Gemini), `langchain-groq` (Groq), ou `langchain-mistralai` (Mistral). Cerebras et OpenRouter sont aussi compatibles OpenAI, donc ils utilisent `langchain-openai` également, juste avec un `base_url` différent.

:::tip[Consulte la documentation actuelle — et le nom du modèle]
Les frameworks d'agents évoluent vite, et les noms de modèles aussi : ils sont renommés et retirés sur une échelle de mois, pas d'années. Utilise un ID de modèle explicite et versionné plutôt qu'un alias `-latest` — plusieurs fournisseurs, dont Google, ont déprécié ces alias parce qu'ils permutent silencieusement vers une nouvelle version du modèle, ce qui peut casser du code qui fonctionne sans avertissement. Avant d'exécuter ceci, vérifie la page de prix/modèle actuelle de ton fournisseur, et parcours le README de `deepagents` lui-même pour son API actuelle.
:::

### Créer ton fichier `.env`

Dans ton dossier de projet, crée un fichier nommé `.env` (ne le commit jamais) avec la clé du fournisseur que tu as choisi :

```bash
# .env
GITHUB_TOKEN=your-key-here
```

`python-dotenv` (installé ci-dessus) lit ce fichier dans `os.environ` en haut de ton script, donc ton code n'a jamais la clé tapée directement dedans.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv --version` affiche un numéro de version.</StepChecklistItem>
<StepChecklistItem>Tu as une vraie clé API d'un fournisseur, et elle est enregistrée dans un fichier `.env` — pas collée dans un fichier `.py`.</StepChecklistItem>
<StepChecklistItem>`uv add deepagents langchain-openai python-dotenv` (ou le paquet de ton fournisseur) s'est terminé sans erreur.</StepChecklistItem>
</StepChecklist>

## Étape 1 : Construis ta base de données de recettes locale

Tout ce que l'agent suggérera jamais vient de cette seule structure de données — une simple liste Python de dicts, pas de serveur de base de données, pas d'API externe. Crée `recipes.py` :

```python
# recipes.py
RECIPES = [
    {
        "name": "Tomato Egg Stir-Fry",
        "ingredients": ["eggs", "tomatoes", "garlic", "salt", "oil"],
        "instructions": "Scramble the eggs, set aside. Saute garlic and chopped tomatoes "
        "until soft, stir the eggs back in, season with salt.",
    },
    {
        "name": "Garlic Butter Pasta",
        "ingredients": ["pasta", "butter", "garlic", "parmesan", "salt"],
        "instructions": "Boil the pasta. Melt butter with minced garlic, toss the pasta "
        "in it, top with grated parmesan and salt.",
    },
    {
        "name": "Classic Grilled Cheese",
        "ingredients": ["bread", "cheese", "butter"],
        "instructions": "Butter one side of each bread slice, add cheese between the "
        "unbuttered sides, grill in a pan until golden on both sides.",
    },
    {
        "name": "Simple Fried Rice",
        "ingredients": ["rice", "eggs", "soy sauce", "onion", "oil"],
        "instructions": "Scramble the eggs and set aside. Fry chopped onion in oil, add "
        "cooked rice, stir in soy sauce and the eggs.",
    },
    {
        "name": "Chickpea Salad",
        "ingredients": ["chickpeas", "cucumber", "tomatoes", "olive oil", "lemon", "salt"],
        "instructions": "Drain the chickpeas, dice the cucumber and tomatoes, toss "
        "everything with olive oil, lemon juice, and salt.",
    },
    # ... a real database keeps going. See examples/recipe-planner-agent/recipes.py
    # in the course repo for the full 13-recipe version this lesson uses.
]
```

Chaque recette est juste un dict avec un `name`, une liste d'`ingredients` (en minuscules, sans quantités — juste ce qui est nécessaire), et de courtes `instructions`. C'est exactement la même forme que la liste jouet `topics` du `search_course_topics` du projet Agent IA, juste plus riche : une liste d'enregistrements structurés sur laquelle ta fonction d'outil peut chercher.

:::tip[Plus c'est grand, mieux c'est ici]
Une base de données de recettes avec 3-4 entrées donnera l'impression que ton agent est cassé même quand le code est bon — la plupart des listes d'ingrédients qu'un élève tape ne chevaucheront simplement rien. Vise les 10-15 recettes complètes (la copie du dépôt en a 13), couvrant un vrai mélange de protéines, de glucides et de légumes, pour qu'une liste typique de « qu'est-ce qu'il y a dans mon frigo » ait une chance décente de correspondre à quelque chose.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`recipes.py` définit `RECIPES` comme une liste d'au moins 10 dicts.</StepChecklistItem>
<StepChecklistItem>Chaque recette a un `name`, des `ingredients` (une liste), et des `instructions`.</StepChecklistItem>
<StepChecklistItem>Les noms d'ingrédients sont en minuscules et cohérents entre les recettes (ex. toujours `"tomatoes"`, jamais un mélange de `"tomatoes"` et `"Tomato"`).</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Pourquoi une liste de dicts plutôt que, disons, un dict indexé par nom de recette ? Que gagnerais-tu ou perdrais-tu dans les deux cas ?
- Si deux recettes partagent presque tous leurs ingrédients, comment cela pourrait-il affecter celle que l'agent tend à suggérer en premier ?

## Étape 2 : Écris un outil avec lequel l'agent peut chercher des recettes

L'agent n'a pas le droit de lire `recipes.py` directement — il ne peut voir que ce qu'une fonction d'outil retourne, exactement comme `search_course_topics` dans le projet Agent IA. Ajoute ceci à `recipes.py`, ou à un nouveau fichier qui importe `RECIPES` :

```python
def search_recipes_by_ingredients(ingredients: list[str]) -> str:
    """Search the local recipe database for recipes that best match the given ingredients.

    `ingredients` should be a list of ingredient names the caller already
    has on hand (e.g. ["eggs", "tomatoes", "garlic"]). Returns the top
    matching recipes, ranked by how many of their ingredients are already
    covered, each with its full ingredient list and the ingredients still
    missing -- so a shopping list can be built from the result without
    guessing. Returns a plain "no matches" message if nothing overlaps at
    all, so the caller never has to invent a recipe out of thin air.
    """
    have = {i.strip().lower() for i in ingredients}
    scored = []
    for recipe in RECIPES:
        needed = {i.lower() for i in recipe["ingredients"]}
        overlap = have & needed
        if not overlap:
            continue
        missing = sorted(needed - have)
        scored.append((len(overlap), recipe, missing))

    if not scored:
        return "No matching recipes found in the database for those ingredients."

    scored.sort(key=lambda row: row[0], reverse=True)
    top = scored[:5]

    lines = []
    for _, recipe, missing in top:
        missing_text = ", ".join(missing) if missing else "nothing -- you have it all!"
        lines.append(
            f"- {recipe['name']} | full ingredient list: {', '.join(recipe['ingredients'])} "
            f"| missing: {missing_text}"
        )
    return "Matching recipes (best match first):\n" + "\n".join(lines)
```

L'idée centrale : `have & needed` (intersection d'ensembles) compte combien d'ingrédients d'une recette tu as déjà, `needed - have` (différence d'ensembles) est exactement ce qui manque encore. Trier par taille de chevauchement, du plus grand au plus petit, signifie que les recettes les plus proches de « prêtes à cuisiner maintenant » viennent en premier — et parce que l'outil retourne les ingrédients manquants pour *chaque* candidat, pas seulement le meilleur, l'agent a tout ce qu'il faut pour construire une liste de courses plus tard sans une deuxième recherche.

Note que le type de retour est une simple chaîne, comme `search_course_topics` et `count_words` dans les projets précédents — le modèle lit du texte, pas des objets Python, donc une chaîne clairement formatée est ce qu'un outil devrait renvoyer.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`search_recipes_by_ingredients(["eggs", "tomatoes", "garlic"])` appelé directement en Python (pas encore d'agent) retourne une vraie chaîne non vide.</StepChecklistItem>
<StepChecklistItem>L'appeler avec des ingrédients qui ne correspondent à rien dans `RECIPES` retourne le message « no matching recipes », pas une erreur.</StepChecklistItem>
<StepChecklistItem>Le docstring explique ce que la fonction fait et ce qu'elle retourne — pas un espace réservé.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Pourquoi l'outil retourne-t-il les ingrédients manquants pour les 5 meilleures correspondances, pas seulement la meilleure unique ? Que perdrait l'agent s'il n'obtenait que la meilleure correspondance ?
- Que se passe-t-il en ce moment si quelqu'un passe `["Tomatoes"]` (avec une majuscule) — est-ce que ça correspond toujours à `"tomatoes"` dans la base de données ? Pourquoi ?

## Étape 3 : Connecte l'outil à un agent `deepagents`

Crée `planner.py` :

```python
import os

from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

from recipes import RECIPES, search_recipes_by_ingredients

load_dotenv()  # reads .env into the environment, if present

SYSTEM_PROMPT = """You are a helpful recipe-planning assistant.

You have exactly one source of truth for what recipes exist: the
search_recipes_by_ingredients tool. Never invent, guess, or recall a recipe
from your own training data -- only suggest recipes that tool actually
returned in its results for this conversation.

When a student lists what they have on hand:
1. Call search_recipes_by_ingredients with that ingredient list.
2. Suggest 2-3 recipes from the tool's results, explaining briefly why each
   is a good fit (how much they already have).
3. If the tool returns no matches, say so plainly and suggest the student
   try listing a few more ingredients -- do not make up a recipe to fill
   the gap.
4. If asked to build a shopping list for a specific recipe, use the
   "missing" ingredients the tool already reported for that recipe -- don't
   recompute or guess at what's missing.
"""

model = ChatOpenAI(
    model="gpt-4o-mini",  # confirm this still has a free tier before running -- see the tip above
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

agent = create_deep_agent(
    model=model,
    tools=[search_recipes_by_ingredients],
    system_prompt=SYSTEM_PROMPT,
)
```

C'est la même forme `create_deep_agent(model=..., tools=[...], system_prompt=...)` du projet Agent IA, avec un outil au lieu de deux. Ce qui est différent, et mérite qu'on s'y attarde, c'est le **prompt système** : il ne décrit pas juste l'outil, il interdit explicitement le mode d'échec que tout ce projet est conçu pour démontrer — suggérer une recette que l'outil n'a jamais retournée. Qu'un outil soit *disponible* ne garantit pas que le modèle l'utilise toujours ; c'est dans le prompt système que tu lui dis qu'utiliser l'outil, et seulement l'outil, n'est pas optionnel ici.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`planner.py` importe `RECIPES` et `search_recipes_by_ingredients` depuis `recipes.py` sans erreur.</StepChecklistItem>
<StepChecklistItem>`agent = create_deep_agent(...)` s'exécute sans lever d'exception — cela ne fait que construire l'agent, ça n'appelle pas encore le modèle.</StepChecklistItem>
<StepChecklistItem>Le prompt système dit explicitement de ne pas suggérer une recette que l'outil n'a pas retournée.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Le prompt système dit au modèle quoi faire si l'outil ne retourne aucune correspondance. Que penses-tu qu'il se passe si tu omets cette instruction entièrement — d'où pourrait venir la réponse du modèle à la place ?
- Pourquoi passer `tools=[search_recipes_by_ingredients]` (la fonction elle-même) plutôt que, disons, `tools=[RECIPES]` (les données brutes) ? Que pourrait réellement faire le modèle avec une liste brute de dicts comme « outil » ?

## Étape 4 : Demande des suggestions de repas

Ajoute un bloc d'exécution en bas de `planner.py` :

```python
if __name__ == "__main__":
    on_hand = "I have eggs, tomatoes, garlic, bread, and cheese. What can I make?"
    print("🧑 You:", on_hand)
    result = agent.invoke({"messages": [{"role": "user", "content": on_hand}]})
    print("🤖 Agent:", result["messages"][-1].content)
```

Exécute-le :

```bash
uv run python planner.py
```

Tu devrais voir la réponse finale de l'agent : 2-3 vrais noms de recettes tirés directement de `RECIPES`, chacun avec une courte raison de pourquoi il correspond à tes ingrédients. Si tu es curieux·se de *comment* il y est arrivé — quel appel d'outil s'est produit, avec quels arguments, et ce que l'outil a réellement retourné avant que le modèle écrive sa réponse — affiche la liste complète `result["messages"]` au lieu de juste la dernière, la même technique couverte dans la section « Comprendre la trace interne complète » du projet Agent IA : un `HumanMessage` (ta question), un `AIMessage` demandant l'appel d'outil, un `ToolMessage` avec la vraie chaîne retournée par `search_recipes_by_ingredients`, puis un `AIMessage` final avec la réponse.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Exécuter `uv run python planner.py` affiche une vraie réponse, pas un traceback.</StepChecklistItem>
<StepChecklistItem>Chaque nom de recette dans la réponse apparaît réellement dans `RECIPES` — vérifie à l'œil, ou en cherchant dans `recipes.py`.</StepChecklistItem>
<StepChecklistItem>Tu as essayé au moins une liste d'ingrédients qui correspond mal, et l'agent l'a gérée raisonnablement (il l'a dit, ou a suggéré des options vaguement liées) au lieu d'inventer quelque chose.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si tu changes `on_hand` en ingrédients qui ne chevauchent rien dans ta base de données, que dit l'agent ? Suit-il l'instruction du prompt système, ou retombe-t-il dans la supposition ?
- L'outil retourne ses 5 meilleures correspondances, mais le prompt système demande 2-3 suggestions. Où ce resserrement se produit-il — dans ton code Python, ou dans le raisonnement du modèle ?

## Étape 5 : Construis une liste de courses et exécute-le de bout en bout

Parce que `search_recipes_by_ingredients` a déjà calculé les ingrédients manquants pour chaque recette candidate, obtenir une liste de courses n'est qu'une question de suivi dans la même conversation — aucun nouvel outil nécessaire. Étends le bloc d'exécution pour continuer la conversation au lieu d'en commencer une nouvelle à chaque fois :

```python
if __name__ == "__main__":
    conversation = []

    on_hand = "I have eggs, tomatoes, garlic, bread, and cheese. What can I make?"
    print("🧑 You:", on_hand)
    conversation.append({"role": "user", "content": on_hand})
    result = agent.invoke({"messages": conversation})
    conversation = result["messages"]  # carry the full history forward
    print("🤖 Agent:", conversation[-1].content)

    print()
    follow_up = "Great, let's go with the first one -- what's my shopping list?"
    print("🧑 You:", follow_up)
    conversation.append({"role": "user", "content": follow_up})
    result = agent.invoke({"messages": conversation})
    conversation = result["messages"]
    print("🤖 Agent:", conversation[-1].content)
```

`conversation = result["messages"]` est la ligne importante : chaque appel `agent.invoke(...)` est sans état en soi, donc la *seule* façon pour la deuxième question de savoir à quoi « le premier » se réfère est si tu lui rends tout l'historique de messages — y compris la réponse précédente du modèle lui-même et tous les appels d'outil qu'il a faits — comme partie de l'entrée de l'appel suivant. Supprime cette ligne et relance : la deuxième question ne pourra résoudre « le premier » à rien, parce qu'en ce qui concerne cet appel, aucun premier message n'a jamais existé.

Relance-le avec `uv run python planner.py` et tu devrais voir un échange complet et réel : une suggestion, puis une liste de courses construite à partir des ingrédients « missing » exacts que l'outil a rapportés pour la recette que tu as choisie — pas une nouvelle supposition.

:::tip[Essaie une liste d'ingrédients délibérément parcimonieuse]
Relance-le avec seulement un ou deux ingrédients, quelque chose comme `"I have onions and salt. What can I make?"` C'est la meilleure façon de voir réellement le garde-fou de ton prompt système agir : avec presque rien à faire correspondre, tu obtiendras soit des suggestions honnêtes de « pas vraiment une correspondance, mais voici l'option la plus proche », soit (si le chevauchement est trop mince) le message « no matches » de l'outil passé directement — dans les deux cas, observe si l'agent résiste encore à inventer quelque chose qui n'est pas dans `RECIPES`.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>La deuxième question de la conversation se réfère correctement de retour à « le premier » de la réponse précédente.</StepChecklistItem>
<StepChecklistItem>La liste de courses qu'elle produit correspond aux ingrédients « missing » que l'outil a rapportés pour cette recette — pas une liste différente ou inventée.</StepChecklistItem>
<StepChecklistItem>Tu as exécuté le test d'ingrédients parcimonieux ci-dessus et l'agent n'a pas inventé une recette absente de `RECIPES`.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Qu'est-ce qui casserait dans la question de suivi si tu commençais une `conversation = []` toute neuve pour elle au lieu de réutiliser celle de la première question ?
- L'étape de la liste de courses n'appelle aucun nouvel outil — elle réutilise des données que le premier appel d'outil a déjà retournées. Qu'est-ce que cela suggère sur la conception de la valeur de retour d'un outil en pensant à plus que la seule question immédiate ?

## ⚠️ Pièges courants

- **Une base de données de recettes trop petite.** Avec seulement une poignée de recettes, la plupart des listes d'ingrédients qu'un élève tape ne chevaucheront rien, et l'agent aura l'air cassé même quand le code est correct. Vise les 10-15 recettes complètes couvrant une vraie variété.
- **Des noms d'ingrédients qui ne correspondent pas.** `"tomato"` dans ta liste tapée ne correspondra pas à `"tomatoes"` dans la base de données avec cet outil simple basé sur des ensembles — il n'y a pas de correspondance floue ici. Garde les noms d'ingrédients cohérents (toujours au pluriel, toujours en minuscules) à la fois dans la base de données et dans ce que tu demandes à l'agent, ou étends l'outil avec une normalisation de base (ex. retirer un `"s"` final) si tu veux aller plus loin.
- **L'agent inventant une recette quand l'outil ne retourne rien.** C'est exactement le mode d'échec que le prompt système de l'étape 3 existe pour empêcher. Si tu sautes cette instruction, ou si tu la formules trop vaguement, un modèle capable « aidera » souvent en suggérant quelque chose qui semble plausible plutôt qu'en admettant qu'il n'a rien — teste spécifiquement le cas des ingrédients parcimonieux de l'astuce ci-dessus pour l'attraper.
- **Perdre l'historique de conversation entre les questions.** Si une question de suivi comme « c'est quoi la liste de courses pour le premier » obtient une réponse confuse ou générique, vérifie que tu passes la liste `conversation` accumulée (étape 5) à `agent.invoke(...)`, pas juste le message le plus récent tout seul.

## Ce que tu viens de construire

Un agent qui répond à une question authentiquement ouverte — « qu'est-ce que je peux faire ? » — en ancrant chaque partie de sa réponse dans de vraies données locales structurées plutôt que dans son propre savoir d'entraînement, et qui refuse de combler les vides avec des détails inventés quand les données n'en soutiennent pas un. Ce motif d'ancrage (un outil soutenu par de vraies données, un prompt système qui interdit de répondre en dehors de lui) est la même forme derrière des systèmes bien plus sérieux qui exigent qu'une IA reste factuelle : un bot d'assistance restreint à la vraie documentation, un assistant de codage restreint à une vraie base de code, un outil de recherche restreint à de vraies sources récupérées. Tu viens de construire la plus petite version de cette idée, avec des recettes.

## Où aller à partir d'ici

- Fais grandir `recipes.py` bien au-delà de 13 entrées, ou charge-le depuis un vrai fichier JSON ou CSV au lieu d'une liste Python codée en dur — la fonction d'outil n'a presque pas à changer.
- Ajoute un deuxième outil, ex. `get_recipe_instructions(name: str) -> str`, pour que l'agent puisse guider un élève dans la cuisine de la recette qu'il vient de suggérer, pas juste la nommer.
- Améliore la correspondance dans `search_recipes_by_ingredients` — gère les pluriels simples, ignore les basiques de garde-manger courants comme le sel et l'huile lors du score du chevauchement (la plupart des cuisines en ont déjà), ou laisse l'élève dire ce qu'il ne veut *pas* explicitement.
- Revisite la section sur les **sous-agents** du projet Agent IA — tu pourrais scinder ceci en un sous-agent « trouveur de recettes » et un sous-agent « liste de courses », chacun avec une tâche plus restreinte.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python hors du navigateur. 🎓

<ProjectProgressCheckbox projectId="recipe-planner-agent" />
