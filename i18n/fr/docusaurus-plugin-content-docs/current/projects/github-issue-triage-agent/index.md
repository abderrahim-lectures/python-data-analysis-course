---
id: github-issue-triage-agent
title: "Construire un Agent de Tri d'Issues GitHub"
sidebar_label: "Construire un Agent de Tri d'Issues GitHub"
slug: /projects/github-issue-triage-agent
description: "Passe du bac à sable dans le navigateur au vrai Python : récupère les issues ouvertes d'un vrai dépôt GitHub public et utilise un LLM gratuit pour rédiger des suggestions d'étiquettes de tri qu'un mainteneur humain relira."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Agent de Tri d'Issues GitHub

<ProjectPublishedDate projectId="github-issue-triage-agent" />

<ProjectGreeting />

Chaque dépôt open-source avec un peu de trafic accumule un backlog d'issues non triées — rapports de bugs, demandes de fonctionnalités, questions, et doublons, tous assis là sans étiquette jusqu'à ce qu'un mainteneur ait le temps de les trier à la main. Ce projet construit un petit script qui fait la première passe pour eux : il récupère les issues OUVERTES d'un vrai dépôt public directement depuis la propre API de GitHub, envoie chacune à un LLM gratuit, et affiche un rapport suggérant une étiquette de tri et une justification d'une phrase pour chaque issue — le genre de chose qu'un mainteneur pourrait survoler en une minute au lieu de lire chaque issue à partir de zéro.

Cela suppose Python 101 — rien de Analyse de Données n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Installer `uv`, obtenir une clé API LLM gratuite, et mettre en place un petit projet.
2. Récupérer les issues OUVERTES d'un vrai dépôt GitHub public en utilisant l'API REST gratuite de GitHub — aucune authentification requise pour les lectures publiques.
3. Écrire un prompt qui transforme le titre et le corps d'une issue en une demande d'étiquette de tri suggérée et d'une justification d'une phrase.
4. Appeler le LLM pour chaque issue et analyser sa réponse.
5. Afficher un rapport de tri lisible, et exécuter le tout de bout en bout contre un vrai dépôt.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal et recommandé — le même mouvement « gradue vers du vrai Python » que tout autre projet de cette section.

**GitHub Codespaces** fonctionne tout aussi bien, et est particulièrement pratique pour ce projet en particulier : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt) et tu es déjà assis dans un environnement conscient de `git`/`gh` avec une vraie identité GitHub attachée — un choix naturel pour un projet qui tourne entièrement autour des dépôts et issues GitHub.

**Google Colab ou Kaggle Notebooks** conviennent aussi bien ici — c'est un script léger appelant une API sans serveur de fichiers local ni processus de longue durée à gérer, donc `!pip install requests python-dotenv openai` dans une cellule suivi du collage du code en cellules de notebook fonctionne sans grande adaptation. Une version notebook prête à l'emploi se trouve dans [`examples/github-issue-triage-agent/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/github-issue-triage-agent/notebook.ipynb) si tu préfères ne pas coller le code toi-même :

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/github-issue-triage-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/github-issue-triage-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgithub-issue-triage-agent%2Fnotebook.ipynb)

## Configuration

### 1. Installe `uv`

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

### 2. Mets en place le projet

```bash
uv init github-issue-triage-agent
cd github-issue-triage-agent
uv add requests python-dotenv openai
```

`requests` récupère les issues depuis l'API REST de GitHub ; `python-dotenv` charge ta clé API depuis un fichier `.env` local ; `openai` est le client utilisé pour appeler GitHub Models par défaut (son API est compatible OpenAI) — voir le tip ci-dessous si tu choisis un fournisseur LLM différent.

### 3. Obtiens une clé API LLM gratuite

**Choisis le fournisseur que tu préfères** — aucun ne nécessite de carte de crédit au moment de l'écriture, et ce cours n'en favorise aucun. L'exemple plus complet dans le dépôt du cours ([`examples/github-issue-triage-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/github-issue-triage-agent)) supporte les six d'office, sélectionnables avec un seul réglage.

| Fournisseur | Où obtenir une clé | Pourquoi le choisir |
|---|---|---|
| **GitHub Models** *(par défaut suggéré)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un jeton d'accès personnel avec le scope `models: read` | Pas d'inscription séparée — tu as déjà un compte GitHub, et ce projet en a déjà besoin d'un pour l'API des issues. Limites de niveau gratuit plus généreuses que Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | L'option la plus couramment référencée ; utilisée dans les brouillons précédents de cette page. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inférence rapide, niveau gratuit généreux, pas de carte. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Un des quotas gratuits permanents les plus généreux. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Volume quotidien de tokens élevé, pas de carte. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Une API, plusieurs modèles gratuits — bon pour comparer les fournisseurs. |

Quel que soit celui que tu choisis, le processus est le même : connecte-toi et génère une clé API sur le site de ce fournisseur, puis **ne la colle jamais directement dans le code ni ne la commite dans un dépôt** — mets-la plutôt dans un fichier `.env` (section suivante).

:::tip[Tu utilises un fournisseur différent de GitHub Models ?]
Le code de cette leçon utilise le paquet `openai` pour appeler GitHub Models, puisque GitHub Models, Cerebras, et OpenRouter sont tous compatibles OpenAI (même client, `base_url` différente). Gemini, Groq, et Mistral ont besoin de leur propre SDK — `uv add google-generativeai`, `uv add groq`, ou `uv add mistralai` respectivement — et un petit remplacement dans `call_llm` ci-dessous. L'exemple plus complet du dépôt ([`examples/github-issue-triage-agent/triage.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/github-issue-triage-agent)) a déjà les six connectés côte à côte.
:::

### 4. Crée ton fichier `.env`

```bash
# .env
LLM_PROVIDER=github
GITHUB_TOKEN=ta-clé-de-fournisseur-llm-ici

# Optional -- see Step 1 below. Raises GitHub's API rate limit; not required.
GITHUB_API_TOKEN=
```

`GITHUB_TOKEN` ici est ta clé de **fournisseur LLM** (GitHub Models spécifiquement) — pas besoin qu'elle soit le même jeton que `GITHUB_API_TOKEN`, qui est un jeton complètement séparé et optionnel utilisé uniquement pour l'étape de récupération d'issues ci-dessous. C'est bien qu'ils soient le même jeton d'accès personnel si tu en as généré un en pensant aux deux usages, mais ni ce projet ni GitHub ne l'exigent.

## Étape 1 : Récupère les issues ouvertes d'un vrai dépôt

GitHub expose une API REST gratuite pour lire les données de dépôts publics — aucune authentification nécessaire pour lire les issues d'un dépôt public. Crée `triage.py` :

```python
# triage.py
import requests

GITHUB_API_URL = "https://api.github.com"


def fetch_open_issues(owner: str, repo: str, limit: int = 10) -> list[dict]:
    """Fetch up to `limit` OPEN issues from a public GitHub repo."""
    response = requests.get(
        f"{GITHUB_API_URL}/repos/{owner}/{repo}/issues",
        params={"state": "open", "per_page": min(limit, 100), "sort": "updated"},
        headers={"Accept": "application/vnd.github+json"},
        timeout=10,
    )
    response.raise_for_status()
    # GitHub's /issues endpoint also returns pull requests -- a PR *is* an
    # issue internally. Real issues lack a "pull_request" key, so filter it.
    issues = [item for item in response.json() if "pull_request" not in item]
    return issues[:limit]


if __name__ == "__main__":
    issues = fetch_open_issues("psf", "requests", limit=10)
    for issue in issues:
        print(f"#{issue['number']}: {issue['title']}")
```

```bash
uv run python triage.py
```

Tu devrais voir jusqu'à 10 lignes, chacune un vrai numéro et titre d'issue actuellement ouverte de [`psf/requests`](https://github.com/psf/requests). `params={"state": "open", ...}` fait le filtrage important ici — le comportement par défaut de GitHub inclurait aussi les issues fermées, et ce projet ne se soucie que de celles qui ont encore besoin de tri.

:::tip[La limite de débit non authentifiée de GitHub est basse]
Les requêtes non authentifiées vers l'API REST de GitHub sont plafonnées à **60 requêtes/heure, par adresse IP** — facile à atteindre si tu relances ce script souvent pendant le développement, ou si tu partages une IP avec des camarades sur le même réseau. Cette leçon ne fait qu'une seule requête API par exécution (un appel récupère jusqu'à 100 issues d'un coup), donc tu ne l'atteindras probablement pas juste en suivant le tutoriel — mais si tu vois un `403` mentionnant une limite de débit, c'est ce qui s'est passé. Configurer `GITHUB_API_TOKEN` (n'importe quel jeton d'accès personnel, aucun scope requis pour les lectures publiques) dans ton `.env` élève la limite à 5 000 requêtes/heure — voir l'étape optionnelle dans la Configuration ci-dessus.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python triage.py` s'exécute sans erreur et affiche de vrais numéros et titres d'issues.</StepChecklistItem>
<StepChecklistItem>Aucune ligne affichée n'est une pull request — vérifie quelques-uns des numéros affichés contre l'onglet Issues réel du dépôt sur GitHub.</StepChecklistItem>
<StepChecklistItem>Changer `owner`/`repo` vers un dépôt public réel différent fonctionne toujours.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Le filtre `"pull_request" not in item` s'exécute *après* que la requête revient, sur des données que GitHub t'a déjà envoyées. Pourrais-tu plutôt demander à GitHub d'exclure les pull requests dans la requête elle-même ? Que devrais-tu vérifier dans la documentation de l'API GitHub pour le découvrir ?
- `sort="updated"` signifie que les 10 issues que tu obtiens sont les 10 *mises à jour le plus récemment*, pas les 10 plus anciennes ou créées le plus récemment. Pourquoi « mise à jour le plus récemment » pourrait-elle être une valeur par défaut plus utile pour un outil de tri que « créée le plus récemment » ?

## Étape 2 : Écris un prompt de suggestion de tri par issue

Chaque issue doit devenir un prompt demandant au modèle exactement deux choses : une étiquette d'une liste fixe, et une justification d'une phrase. Ajoute ceci à `triage.py` :

```python
MAX_BODY_CHARS = 2000  # keep each issue's body well inside any model's context window
LABEL_CHOICES = ["bug", "feature", "question", "docs", "duplicate-looking", "other"]


def build_triage_prompt(issue: dict) -> str:
    title = issue.get("title") or "(no title)"
    body = (issue.get("body") or "(no description provided)")[:MAX_BODY_CHARS]

    return (
        "You are drafting a SUGGESTION for a human maintainer triaging a GitHub "
        "issue. You are not applying anything -- your output will be reviewed by "
        "a person before any label is added.\n\n"
        f"Choose exactly one label from this list: {', '.join(LABEL_CHOICES)}.\n\n"
        f"Issue title: {title}\n"
        f"Issue body:\n{body}\n\n"
        "Reply in exactly this two-line format, nothing else:\n"
        "Label: <one label from the list>\n"
        "Rationale: <one sentence explaining the suggested label and its priority>"
    )
```

Deux choix délibérés ici. D'abord, `MAX_BODY_CHARS` tronque le corps de l'issue — certaines issues atteignent des milliers de mots (traces de pile collées, longs logs), et il n'y a aucun avantage à dépenser des tokens sur plus que ce dont le modèle a besoin pour saisir l'essentiel ; voir la section des pièges ci-dessous pour ce qui se passe si tu sautes ça. Ensuite, le prompt demande un format de réponse fixe et simple à deux lignes (`Label: ...` / `Rationale: ...`) plutôt que du JSON — plus facile à suivre de manière fiable pour un petit modèle gratuit, et assez facile à analyser avec de simples méthodes de chaînes à l'étape suivante.

:::tip[« Suggérer, pas appliquer » est une instruction structurante, pas un détail poli]
Remarque que le prompt dit explicitement au modèle qu'il rédige une suggestion pour révision humaine, pas qu'il applique quoi que ce soit. Ce script appuie ça avec un vrai comportement, pas juste des mots : rien dans `triage.py` n'appelle jamais un endpoint GitHub qui ajouterait une étiquette ou un commentaire à une vraie issue — il ne fait que lire les issues et afficher du texte dans ton terminal. C'est une limite de sécurité délibérée, le même principe derrière n'importe quel outil d'IA qui touche aux affaires d'autres personnes : rédige avec confiance, agis seulement avec un humain dans la boucle, particulièrement pour quelque chose d'aussi facile à mal interpréter subtilement qu'une lecture en une phrase du rapport de bug de quelqu'un d'autre.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`build_triage_prompt` inclut le vrai titre et le (tronqué) corps réel de l'issue, pas un texte d'espace réservé.</StepChecklistItem>
<StepChecklistItem>Le prompt liste toutes les `LABEL_CHOICES` explicitement, pas une instruction vague de « choisis une étiquette ».</StepChecklistItem>
<StepChecklistItem>Afficher `build_triage_prompt(issues[0])` pour une vraie issue récupérée produit un prompt bien formé et lisible.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Pourquoi contraindre le modèle à une liste fixe de `LABEL_CHOICES` plutôt que de le laisser inventer n'importe quelle étiquette qu'il veut ? Que perdrais-tu si tu retirais cette contrainte ?
- Si le corps d'une issue est vide (certaines issues n'en ont vraiment aucun), qu'envoie actuellement `build_triage_prompt` au modèle ? Est-ce un prompt raisonnable, ou l'améliorerais-tu ?

## Étape 3 : Appelle le LLM et analyse sa réponse

Maintenant connecte un vrai appel LLM, et transforme sa réponse en deux lignes en un `dict` Python utilisable :

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)


def call_llm(prompt: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before relying on it
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,  # a triage suggestion should be consistent, not creative
    )
    return response.choices[0].message.content or ""


def parse_triage_reply(reply: str) -> dict:
    label, rationale = "other", reply.strip()
    for line in reply.splitlines():
        if line.lower().startswith("label:"):
            candidate = line.split(":", 1)[1].strip().lower()
            label = candidate if candidate in LABEL_CHOICES else candidate or "other"
        elif line.lower().startswith("rationale:"):
            rationale = line.split(":", 1)[1].strip()
    return {"label": label, "rationale": rationale}


def suggest_triage(issue: dict) -> dict:
    reply = call_llm(build_triage_prompt(issue))
    return parse_triage_reply(reply)
```

N'oublie pas `from dotenv import load_dotenv` plus `load_dotenv()` près du haut du fichier, pour que `os.environ["GITHUB_TOKEN"]` trouve réellement la clé depuis ton fichier `.env` — même pattern que le [projet Agent IA](/docs/projects/ai-agent).

`parse_triage_reply` retombe délibérément sur `label="other"` et la réponse brute comme justification si le modèle ne suit pas exactement le format à deux lignes demandé — les modèles gratuits ajoutent parfois du texte égaré ou sautent une ligne, et un *brouillon* de tri légèrement mal formé reste plus utile affiché pour qu'un humain le survole que jeté silencieusement sur une erreur d'analyse.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Appeler `suggest_triage` sur une vraie issue récupérée retourne un `dict` avec une vraie `label` et une vraie `rationale` de la taille d'une phrase — pas une erreur ou des chaînes vides.</StepChecklistItem>
<StepChecklistItem>La `label` retournée est toujours une des `LABEL_CHOICES` (ou le repli `"other"`), jamais du texte arbitraire fuyant sans être analysé.</StepChecklistItem>
<StepChecklistItem>Alimenter délibérément `parse_triage_reply` avec une réponse mal formée (ex. juste `"I think this is a bug"`, sans lignes `Label:`/`Rationale:`) ne plante pas — ça retombe gracieusement.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `temperature=0.2` biaise le modèle vers sa réponse la plus probable, la moins « créative ». Pourquoi une basse température pourrait-elle compter plus pour un outil de tri que pour, disons, un assistant d'écriture créative ?
- Si tu exécutais `suggest_triage` sur la *même* issue deux fois, t'attendrais-tu à exactement la même justification les deux fois ? Qu'est-ce que ta réponse suggère sur combien un mainteneur devrait faire confiance à une seule suggestion par rapport à la traiter comme un point de données ?

## Étape 4 : Affiche le rapport et exécute-le de bout en bout

Assemble tout le pipeline — récupérer, suggérer, rapporter :

```python
import time


def print_triage_report(owner: str, repo: str, issues: list[dict], suggestions: list[dict]) -> None:
    print("=" * 72)
    print(f"Triage suggestions for {owner}/{repo} -- {len(issues)} open issue(s)")
    print("These are DRAFT suggestions. Review each one before applying any label.")
    print("=" * 72)
    for issue, suggestion in zip(issues, suggestions):
        print(f"\n#{issue['number']}: {issue['title']}")
        print(f"  {issue['html_url']}")
        print(f"  Suggested label: {suggestion['label']}")
        print(f"  Rationale:       {suggestion['rationale']}")


if __name__ == "__main__":
    owner, repo = "psf", "requests"
    issues = fetch_open_issues(owner, repo, limit=10)

    suggestions = []
    for issue in issues:
        suggestions.append(suggest_triage(issue))
        time.sleep(0.5)  # a small, deliberate gap between LLM calls

    print_triage_report(owner, repo, issues, suggestions)
```

```bash
uv run python triage.py
```

Tu devrais voir un rapport complet : un en-tête nommant le dépôt et le nombre d'issues, puis un bloc par issue avec son numéro, titre, vraie URL GitHub, étiquette suggérée, et justification d'une phrase — plus cette ligne de rappel en haut disant que ce sont des brouillons, pas des changements appliqués. Essaie de pointer `owner`/`repo` vers un dépôt public réel et actif différent (n'importe lequel avec des issues ouvertes fonctionne) et confirme que le rapport s'adapte à un contenu d'issue authentiquement différent, pas juste en répétant la même sortie.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Exécuter `triage.py` de bout en bout affiche un rapport complet sans traceback non géré.</StepChecklistItem>
<StepChecklistItem>Chaque issue dans le rapport a une vraie URL GitHub, une étiquette suggérée, et une justification non vide.</StepChecklistItem>
<StepChecklistItem>L'exécuter contre un second dépôt public réel différent produit des suggestions authentiquement différentes, pas un rapport qui ressemble à un copier-coller.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si deux issues du même dépôt sont presque des doublons l'une de l'autre, ce script le remarquerait-il ? Que faudrait-il pour ajouter une suggestion « possible doublon de #N » — quelle information supplémentaire le prompt aurait-il besoin ?
- En ce moment chaque issue reçoit son propre appel LLM séparé. Qu'est-ce qui changerait, en mieux ou en pire, si tu envoyais plutôt les 10 issues au modèle dans un seul prompt et demandais 10 suggestions étiquetées d'un coup ?

## ⚠️ Pièges courants

- **Atteindre la limite de débit non authentifiée de GitHub sur un dépôt actif ou une boucle de développement rapide.** 60 requêtes/heure semble beaucoup jusqu'à ce que tu relances le script chaque minute en déboguant. Un `403` mentionnant une limite de débit signifie ça, pas un bug dans ton code — configure `GITHUB_API_TOKEN` dans `.env` pour l'élever à 5 000/heure.
- **Des issues avec des corps très longs dépassant le contexte d'un modèle, ou gaspillant simplement des tokens/du quota.** Certaines issues incluent des traces de pile complètes, des logs collés, ou des captures d'écran intégrées en texte qui atteignent des milliers de mots. `MAX_BODY_CHARS` tronque ça — retire cette troncature et tu risques une requête lente, coûteuse contre ton quota gratuit, ou dans de rares cas trop grande pour le modèle entièrement.
- **Traiter la suggestion du LLM comme une vérité absolue plutôt qu'un brouillon.** Un modèle gratuit lisant un titre et un corps tronqué n'a pas accès aux vraies conventions du dépôt, sa taxonomie d'étiquettes, ou le contexte d'issues liées — il peut mal étiqueter un vrai bug comme une « question », ou manquer que deux issues sont des doublons. Encadre toujours ça comme accélérant la première passe d'un humain, jamais comme un remplacement.
- **Oublier que l'endpoint `/issues` de GitHub retourne aussi les pull requests.** Saute le filtre `"pull_request" not in item` de l'Étape 1 et tu finiras par demander à un LLM de trier des PR comme si c'étaient des rapports de bugs — un résultat confus et faux pour quelque chose qui n'est pas du tout une issue.

## Ce que tu viens de construire

Un vrai pipeline récupérer → prompt → suggérer → rapporter contre un vrai dépôt GitHub public et en direct — pas un jeu de données jouet. La forme ici se généralise bien au-delà du tri : tout flux de travail où tu veux qu'un LLM rédige un jugement de première passe sur un lot d'éléments du monde réel (tickets de support, descriptions de pull requests, messages clients) pour qu'un humain révise suit la même boucle récupérer-un-élément, construire-un-prompt-focalisé, appeler-le-modèle, rapporter-le-résultat que tu viens d'écrire.

## Où aller à partir d'ici

- **Applique réellement des étiquettes — prudemment, une fois que tu fais confiance aux suggestions.** Le [CLI `gh`](https://cli.github.com/) (`gh issue edit 123 --add-label bug`) ou le propre endpoint d'édition d'issues de l'API GitHub peut ajouter une étiquette pour de vrai. Si tu construis ça, garde un humain explicitement dans la boucle — ex. affiche d'abord les suggestions, demande une confirmation par issue (ou par lot) avant d'appeler l'API, et n'applique jamais automatiquement une étiquette directement depuis la première passe d'un modèle. Traite l'accès en écriture aux issues du dépôt de quelqu'un d'autre avec une vraie prudence, surtout un que tu ne maintiens pas toi-même.
- **Regroupe plusieurs issues en un seul appel LLM** au lieu d'un appel par issue — moins d'allers-retours, mais un prompt plus complexe et un problème d'analyse plus difficile (le mode sortie structurée/JSON vaut la peine d'être exploré ici).
- **Ajoute une vérification de « possible doublon »** en embeddant les titres d'issues (voir le [projet RAG](/docs/projects/rag-notes) pour le pattern d'embeddings) et en signalant les paires suspicieusement similaires, plutôt que de dépendre du LLM pour se souvenir de chaque autre issue ouverte par lui-même.
- **Mets en cache les résultats** pour que relancer le script ne retrie pas les issues que tu as déjà révisées — un simple fichier JSON indexé par numéro d'issue, vérifié avant chaque appel LLM, suffit pour une première version.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/github-issue-triage-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/github-issue-triage-agent) dans le dépôt du cours est une version plus complète du code ci-dessus, avec les six fournisseurs du tableau connectés côte à côte, sélectionnables avec un seul réglage, plus un `GITHUB_API_TOKEN` optionnel pour la limite de débit GitHub plus élevée. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, et `uv` déjà installés) et exécute-le depuis là.
:::

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="github-issue-triage-agent" />
