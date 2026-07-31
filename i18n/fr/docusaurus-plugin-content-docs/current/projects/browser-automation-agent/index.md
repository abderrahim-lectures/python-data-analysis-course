---
id: 2027-browser-automation-agent
title: "Construire un Agent d'Automatisation de Navigateur"
sidebar_label: "Agent d'Automatisation de Navigateur"
slug: /projects/browser-automation-agent
description: "Combine l'automatisation de navigateur Playwright avec un agent LLM gratuit à appel d'outils qui remplit tout seul un vrai formulaire web de pratique."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Agent d'Automatisation de Navigateur

<ProjectPublishedDate projectId="2027-browser-automation-agent" />

<ProjectGreeting />

Chaque autre projet de cette section parle à une API ou lit des fichiers locaux. Celui-ci pilote un vrai navigateur — cliquant, tapant, et lisant une vraie page — puis remet ce contrôle à un agent LLM, pour qu'il puisse décider *quel* champ remplir avec *quoi*, au lieu que tu codes en dur chaque sélecteur à la main. Prérequis supposés : Python 101, plus avoir déjà construit le [projet Agent IA](/docs/projects/ai-agent) — celui-ci réutilise son pattern d'appel d'outils (`deepagents`, une clé API gratuite) et ajoute un vrai contrôle de navigateur par-dessus, donc ce n'est pas l'endroit pour débuter avec les agents à partir de zéro.

C'est optionnel et non noté. Voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Installer [Playwright](https://playwright.dev/python/) pour Python et un vrai binaire de navigateur Chromium.
2. Écrire un script codé en dur qui remplit un vrai formulaire de pratique à la main — et voir exactement à quel point c'est fragile.
3. Envelopper la lecture de page et le remplissage de champs comme des **outils** qu'un agent LLM peut appeler.
4. Donner à l'agent un objectif en anglais simple (« remplis ce formulaire avec ces détails ») et le laisser décider quels champs correspondent à quels appels d'outils, puis l'exécuter de bout en bout et vérifier la vraie soumission.

## Où exécuter ceci

**En local avec `uv`** est le chemin que suivent les étapes de cette leçon, et la seule façon totalement fidèle de faire ce projet : Playwright a besoin d'un vrai binaire de navigateur installé à piloter, ce qui signifie une vraie machine (ou virtuelle) avec un vrai affichage. La section Configuration ci-dessous explique comment installer à la fois `uv` et ce binaire de navigateur.

**GitHub Codespaces** fonctionne bien ici aussi, et est une véritable alternative sans configuration si tu préfères ne rien installer localement pour l'instant : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés) et exécute `uv run playwright install chromium` depuis un terminal dans ton onglet de navigateur — l'installation du navigateur fonctionne exactement pareil là-bas que sur ta propre machine, le mode headless n'a pas besoin d'un vrai affichage non plus dans les deux cas.

**Google Colab, Kaggle Notebooks ou Binder sont mal adaptés à ce projet en particulier**, et cette page saute délibérément une version notebook plutôt que d'en forcer une — un vrai navigateur Playwright a besoin d'un vrai binaire de navigateur plus un processus persistant qu'il contrôle étape par étape, ce qui ne correspond pas proprement au modèle de cellules sans état et sans fenêtre de navigateur local d'un notebook, contrairement aux appels `requests` du [projet scrape-analyze](/docs/projects/scrape-analyze). Si tu veux quand même expérimenter dans un notebook, la version honnête de cela n'est **pas** un vrai contrôle de navigateur du tout : simule une fausse « page » comme un simple dictionnaire Python de noms de champs et de types, donne à l'agent des outils qui lisent/écrivent ce dictionnaire au lieu d'une vraie page Playwright, et utilise-le pour démontrer seulement la *prise de décision* de l'agent — quel champ il pense correspondre à quelle information — sans qu'aucun vrai navigateur ne soit ouvert nulle part. C'est une façon légitime d'explorer le raisonnement de l'Étape 3 isolément, mais ce n'est pas ce projet ; traite-le comme un jouet, pas comme un substitut à la Configuration ci-dessous.

## Configuration

### Installe `uv`

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

### Mets en place le projet et installe le binaire de navigateur de Playwright

```bash
uv init browser-automation-agent
cd browser-automation-agent
uv add playwright deepagents langchain-openai python-dotenv
uv run playwright install chromium
```

Cette dernière commande est l'étape facile à oublier, et celle spécifique à Playwright : le paquet `playwright` que tu viens d'installer avec `uv add` n'est que le driver Python — il n'inclut pas de vrai navigateur. `playwright install chromium` télécharge une vraie build figée de Chromium (correspondant à la version exacte de Playwright que tu as) dans un cache local que le paquet pilote ensuite. Passe-la, et chaque script ci-dessous échoue immédiatement avec une erreur te disant qu'un exécutable de navigateur est manquant.

:::tip[C'est le Playwright Python, pas le propre Playwright Node de ce dépôt]
Si tu as regardé dans le propre dépôt de ce cours, tu as peut-être remarqué `playwright` déjà listé comme dépendance de développement Node dans le `package.json` racine — cette copie est un outillage sans rapport que ce site utilise pour ses propres tests de bout en bout, écrits en JavaScript/TypeScript. Le **paquet pip** `playwright` que tu viens d'installer avec `uv add` est une bibliothèque Python complètement séparée avec sa propre installation, son propre cache de navigateur, et sa propre API (`sync_playwright()`, pas `require('playwright')`). Ils partagent un nom et un moteur d'automatisation de navigateur sous-jacent, mais aucune installation n'affecte l'autre, et tu n'as pas besoin de Node.js installé du tout pour faire ce projet.
:::

### Obtiens une clé API IA gratuite

**Choisis le fournisseur que tu préfères** — aucun ne nécessite de carte de crédit au moment de l'écriture.

| Fournisseur | Où obtenir une clé | Pourquoi le choisir |
|---|---|---|
| **GitHub Models** *(par défaut suggéré)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un jeton d'accès personnel avec le scope `models: read` | Pas d'inscription séparée — tu as déjà un compte GitHub. Limites de niveau gratuit plus généreuses que Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | L'option la plus couramment référencée ; utilisée dans les brouillons précédents de cette page. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inférence rapide, niveau gratuit généreux, pas de carte. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Un des quotas gratuits permanents les plus généreux. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Volume quotidien de tokens élevé, pas de carte. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Une API, plusieurs modèles gratuits — bon pour comparer les fournisseurs. |

Même règle que tout autre projet ici : **ne** colle **jamais** une clé directement dans le code ni ne la commite — configure-la comme variable d'environnement, ou mets-la dans un fichier `.env` local (ne commite pas non plus celui-là) et charge-la avec `python-dotenv`, comme le projet Agent IA.

```bash
# .env
GITHUB_TOKEN=ta-clé-ici
```

## Étape 1 : Un script codé en dur, sans LLM pour l'instant

Avant de recourir à un agent, écris la version simple faite à la main — ça vaut la peine de sentir exactement à quel point elle est fragile avant de résoudre ce problème. La cible de tout ce projet est [httpbin.org/forms/post](https://httpbin.org/forms/post), un petit formulaire de « commande de pizza » bien connu et stable, construit spécifiquement pour tester des outils comme celui-ci — pas de connexion, pas de vraies données client, rien derrière une autorisation, et un bac à sable public et respectueux des CGU pour tester des formulaires que des étudiants et tutoriels utilisent depuis des années.

Crée `scripted_fill.py` :

```python
from playwright.sync_api import sync_playwright

FORM_URL = "https://httpbin.org/forms/post"

ORDER = {
    "custname": "Ada Lovelace",
    "custtel": "555-0100",
    "custemail": "ada@example.com",
    "size": "medium",
    "topping": ["bacon", "cheese"],
    "delivery": "18:30",
    "comments": "Please ring the bell twice.",
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False, slow_mo=250)
    page = browser.new_page()
    page.goto(FORM_URL)

    page.fill('input[name="custname"]', ORDER["custname"])
    page.fill('input[name="custtel"]', ORDER["custtel"])
    page.fill('input[name="custemail"]', ORDER["custemail"])
    page.check(f'input[name="size"][value="{ORDER["size"]}"]')
    for topping in ORDER["topping"]:
        page.check(f'input[name="topping"][value="{topping}"]')
    page.fill('input[name="delivery"]', ORDER["delivery"])
    page.fill('textarea[name="comments"]', ORDER["comments"])
    page.click('button[type="submit"]')

    page.wait_for_selector("pre")
    print(page.locator("pre").inner_text())
    browser.close()
```

Exécute-le :

```bash
uv run python scripted_fill.py
```

Une vraie fenêtre Chromium visible apparaît (`headless=False`), tape dans chaque champ, et soumet — httpbin renvoie les données soumises en JSON, que tu devrais voir affichées dans ton terminal.

Maintenant imagine que le propriétaire du formulaire renomme `custname` en `customer_name`, ou ajoute un nouveau champ requis. Ce script casse immédiatement, sans aucune idée de *pourquoi* — il n'a jamais regardé la page, il a juste rejoué une séquence fixe de sélecteurs. Cette fragilité est le vrai problème que résout ce projet.

<StepChecklist>
  <StepChecklistItem>`uv run python scripted_fill.py` ouvre un navigateur visible, remplit le formulaire, et affiche le JSON soumis.</StepChecklistItem>
  <StepChecklistItem>Tu peux pointer au moins un nom de champ ou sélecteur dans le script qui casserait silencieusement si le formulaire changeait.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)** : Si tu ne contrôlais pas le site web cible et qu'il changeait son formulaire demain, comment le *découvrirais*-tu seulement, à part exécuter le script et lire l'erreur ?

## Étape 2 : Enveloppe le navigateur comme des outils

Un agent LLM ne peut pas appeler directement l'API Python de Playwright — les outils `deepagents` sont de simples fonctions avec des arguments simples et compatibles JSON, la même forme que tu as vue dans le projet Agent IA. Donc la solution à la fragilité de l'Étape 1 est de donner au modèle un petit ensemble fixe de *capacités* au lieu d'un script fixe, et de le laisser décider quand utiliser chacune.

Crée `browser_tools.py` (ou ajoute ceci en haut de `agent.py` — les deux fonctionnent) :

```python
from playwright.sync_api import sync_playwright

class BrowserSession:
    def __init__(self, headless: bool = True) -> None:
        self._playwright = sync_playwright().start()
        self.browser = self._playwright.chromium.launch(headless=headless)
        self.page = self.browser.new_page()

    def close(self) -> None:
        self.browser.close()
        self._playwright.stop()

_session: BrowserSession | None = None

def _page():
    if _session is None:
        raise RuntimeError("No active browser session -- call navigate() first.")
    return _session.page

def navigate(url: str) -> str:
    """Open a URL in the browser. Always call this first."""
    _page().goto(url)
    return f"Navigated to {url}"

def read_form_fields() -> str:
    """List every form field on the current page: its name, type, and (for
    radio/checkbox groups) its available option values."""
    fields = _page().eval_on_selector_all(
        "input, textarea, select",
        "els => els.map(el => ({name: el.getAttribute('name'), "
        "type: el.getAttribute('type') || el.tagName.toLowerCase(), "
        "value: el.getAttribute('value')}))",
    )
    return "\n".join(f"- name={f['name']!r} type={f['type']} value={f['value']!r}" for f in fields)

def fill_text_field(name: str, value: str) -> str:
    """Type a value into a text-like field (text, email, tel, time, textarea) by its name."""
    _page().fill(f'[name="{name}"]', value)
    return f"Filled '{name}' with '{value}'"

def select_option(name: str, value: str) -> str:
    """Check a radio button or checkbox by its name and option value."""
    _page().check(f'input[name="{name}"][value="{value}"]')
    return f"Selected '{value}' for '{name}'"

def click_submit() -> str:
    """Click the form's submit button."""
    _page().click('button[type="submit"], input[type="submit"]')
    _page().wait_for_load_state("networkidle")
    return "Submitted."

def read_page_text() -> str:
    """Read back the visible text of the current page -- use this to verify what happened."""
    return _page().inner_text("body")[:2000]
```

Remarque ce qui a changé par rapport à l'Étape 1 : rien ici ne mentionne `custname` ou `size` ou un champ spécifique. `read_form_fields` découvre quels que soient les champs qui existent réellement sur quelle que soit la page qu'elle pointe — l'agent, pas ce code, est responsable de faire correspondre « nom du client » à `name="custname"`.

<StepChecklist>
  <StepChecklistItem>Tu peux expliquer, en une phrase, pourquoi ces fonctions-outils prennent de simples chaînes (une URL, un nom de champ, une valeur) plutôt qu'un objet `Page` de Playwright comme argument.</StepChecklistItem>
  <StepChecklistItem>`read_form_fields()` appelée manuellement contre une vraie page retourne une vraie liste des noms de champs réels de la page — pas une supposition codée en dur.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)** : `read_form_fields` ne tronque rien et retourne la *vraie* structure de la page au modèle. Qu'est-ce qui pourrait mal se passer si tu faisais plutôt confiance au modèle pour deviner les noms de champs sans jamais l'appeler ?

## Étape 3 : Donne à l'agent un objectif en anglais simple

Maintenant connecte ces outils à un agent `deepagents`, le même pattern `create_deep_agent` que le projet Agent IA, et donne-lui un objectif en langage ordinaire plutôt qu'un script étape par étape :

```python
import os
from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

model = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

agent = create_deep_agent(
    model=model,
    tools=[navigate, read_form_fields, fill_text_field, select_option, click_submit, read_page_text],
    system_prompt=(
        "You are a browser-automation agent. Navigate to the given URL, call "
        "read_form_fields to see the real fields on the page, then map the given "
        "details onto the real field names and types you found -- never guess a "
        "field name read_form_fields didn't show you. Fill what you can confidently "
        "match, submit, then read the page back to confirm."
    ),
)

_session = BrowserSession(headless=False)
goal = (
    "Go to https://httpbin.org/forms/post and fill it out with these details: "
    "Customer name: Grace Hopper. Phone: 555-0199. Email: grace@example.com. "
    "Pizza size: large. Toppings: mushroom and cheese. Delivery time: 19:00. "
    "Comments: leave at the front desk. Then submit it."
)
result = agent.invoke({"messages": [{"role": "user", "content": goal}]})
print(result["messages"][-1].content)
_session.close()
```

Exécute-le et observe la fenêtre du navigateur : l'agent appelle `navigate`, puis `read_form_fields`, puis une séquence d'appels `fill_text_field`/`select_option` qu'il a choisis lui-même — dans un ordre qu'il a choisi lui-même, en utilisant des noms de champs qu'il a lus sur la vraie page plutôt que ceux que tu lui as donnés dans le texte de l'objectif.

<StepChecklist>
  <StepChecklistItem>Les appels d'outils de l'agent (affiche `result["messages"]` et cherche les entrées d'appel d'outil `AIMessage`, comme la trace du projet Agent IA) montrent qu'il appelle `read_form_fields` avant tout appel `fill_text_field`/`select_option`.</StepChecklistItem>
  <StepChecklistItem>Tu as changé un détail dans l'objectif en anglais simple (ex. un topping différent) et l'as relancé sans toucher au code des outils, et la soumission a changé en conséquence.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)** : Le system prompt dit explicitement « ne devine jamais un nom de champ que `read_form_fields` ne t'a pas montré. » Pourquoi cette instruction compte-t-elle plus ici qu'elle ne comptait pour les outils jouets dans le projet Agent IA ?

## Étape 4 : Exécute-le de bout en bout et vérifie la vraie soumission

Exécute le script complet et confirme que toute la boucle a vraiment fonctionné, pas juste qu'elle n'a pas planté :

```bash
uv run python agent.py
```

Vérifie le texte final affiché de la page (de `read_page_text`) par rapport à ce que httpbin renvoie réellement — ça devrait être un blob JSON sous `"form"` contenant chaque valeur que tu as demandée, en utilisant les vrais noms de champs que l'agent a découverts, pas les noms en anglais simple de ton objectif.

<StepChecklist>
  <StepChecklistItem>Le texte final de la page montré par l'agent contient chaque valeur de ton objectif, correctement associée au bon champ.</StepChecklistItem>
  <StepChecklistItem>Tu l'as exécuté une seconde fois avec `headless=True` et il s'est terminé sans fenêtre visible, confirmant qu'il ne dépend pas secrètement du fait que tu le regardes.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)** : Si l'agent avait soumis le formulaire avec un champ erroné — disons, le mauvais topping — comment le saurais-tu, à part lire toi-même le texte de confirmation ? Que faudrait-il pour que l'agent vérifie son propre travail ?

:::tip[N'automatise que des sites pour lesquels tu as la permission]
`httpbin.org/forms/post` est choisi délibérément parce que c'est un outil public construit *pour* ce type exact de pratique — l'automatiser est attendu, pas une violation de quoi que ce soit. Ce n'est pas vrai pour la plupart des sites web. Ne pointe jamais du code d'automatisation de navigateur vers les pages de connexion, de paiement, ou de compte d'un vrai site de production sans l'autorisation explicite du propriétaire du site — les Conditions Générales d'Utilisation de la plupart des sites interdisent la soumission automatisée de formulaires, le scraping, ou les actions de compte en masse, et « le formulaire était techniquement accessible publiquement » n'est pas la même chose que « j'avais la permission de l'automatiser. » Traite ceci comme tu traiterais n'importe quel autre identifiant ou compte : obtiens la permission explicite avant d'automatiser de vraies cibles qui ne sont pas de pratique.
:::

:::tip[Les sélecteurs sont un contrat avec une page que tu ne contrôles pas]
Chaque appel `page.fill(...)` et `page.check(...)` ci-dessus dépend du fait que le HTML réel du site cible ne change pas — un attribut `name` renommé, un `<div>` échangé contre un vrai `<button>`, ou un formulaire redessiné casse un script codé en dur instantanément et silencieusement. C'est exactement pourquoi l'outil `read_form_fields` de l'Étape 2 existe : un agent qui *lit* la page avant d'agir s'adapte à de petits changements qu'un script codé en dur ne peut pas gérer, même s'il n'est toujours pas immunisé contre une page qui change toute sa structure ou sa signification.
:::

## ⚠️ Pièges courants

- **Oublier `uv run playwright install chromium`** — l'échec le plus courant. `uv add playwright` n'installe que le driver Python ; le message d'erreur (« Executable doesn't exist... ») te le dit exactement, mais c'est facile à rater à une première lecture.
- **Fragilité des sélecteurs** — un sélecteur comme `input[name="custname"]` ne fonctionne que parce que c'est le vrai attribut sur *cette* page aujourd'hui. Copier des sélecteurs d'un site vers un site différent, ou les réutiliser après une refonte, est la source la plus courante d'un script qui « fonctionnait avant. »
- **Confusion entre mode headless et avec interface** — `headless=False` (une fenêtre visible) est excellent pour le développement et le débogage, mais plus lent et nécessite un vrai affichage ; `headless=True` (par défaut) est ce que tu veux pour tout ce qui est non surveillé, comme le CI, mais rend le débogage d'un échec plus difficile puisque tu ne peux pas l'observer se produire. Bascule délibérément, ne le laisse pas sur celui avec lequel tu as commencé.
- **Temporisation et conditions de course** — cliquer sur soumettre avant qu'une page ait fini de charger, ou lire le texte de la page avant qu'une redirection se termine, produit des échecs instables et difficiles à reproduire. `wait_for_load_state`, `wait_for_selector` de Playwright, et son auto-attente intégrée sur la plupart des actions existent spécifiquement pour éviter les appels `time.sleep()` faits à la main, qui masquent les bugs de temporisation plutôt que de les corriger.

## Ce que tu viens de construire

Un agent qui ne fait pas que *parler* — il prend des actions réelles et vérifiables dans un vrai navigateur, décidant lequel d'un petit ensemble de capacités utiliser et dans quel ordre, en se basant sur ce qu'il observe réellement sur la page plutôt que sur un script que tu as écrit à l'avance. C'est la même boucle d'appel d'outils du projet Agent IA, mais maintenant les « outils » ont des effets de bord dans le monde réel plutôt que de simplement retourner du texte, ce qui est exactement la forme de la plupart des agents d'automatisation véritablement utiles.

## Où aller à partir d'ici

- Ajoute un outil qui relit la valeur *spécifique* dans un champ après l'avoir rempli (pas juste toute la page), pour que l'agent puisse vérifier chaque remplissage avant de passer au suivant, plutôt que de vérifier seulement à la toute fin.
- Essaie un formulaire avec plus de types de champs — un menu déroulant `<select>`, un formulaire multi-pages, un champ avec validation côté client en temps réel — et vois lesquels des outils de l'Étape 2 doivent évoluer pour le gérer.
- Compare ceci au [projet Agent IA](/docs/projects/ai-agent) : les outils de celui-là ne retournent toujours que du texte ; ces outils changent le vrai état du navigateur. Réfléchis à ce que cette différence signifie pour la rigueur avec laquelle tu voudrais tester l'ensemble d'outils d'un agent avant de lui faire confiance sans surveillance.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="2027-browser-automation-agent" />
