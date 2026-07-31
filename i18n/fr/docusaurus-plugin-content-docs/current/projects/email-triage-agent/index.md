---
id: email-triage-agent
title: "Construire un Agent Personnel de Tri d'E-mails"
sidebar_label: "Construire un Agent Personnel de Tri d'E-mails"
slug: /projects/email-triage-agent
description: "Passe du bac à sable dans le navigateur au vrai Python : construis un agent qui catégorise, priorise, et rédige (mais n'envoie jamais) des réponses pour tes e-mails, en utilisant un LLM gratuit."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Agent Personnel de Tri d'E-mails

<ProjectPublishedDate projectId="email-triage-agent" />

<ProjectGreeting />

Tout dans le cours jusqu'ici tournait dans un bac à sable isolé, dans le navigateur — pour que tu puisses commencer à écrire du Python dès le premier jour sans aucune configuration. Ce projet est l'étape de remise de diplôme : installe Python pour de vrai sur ta propre machine, puis utilise-le pour construire quelque chose d'authentiquement utile — un agent qui lit un lot d'e-mails, te dit lesquels comptent vraiment, et rédige une réponse suggérée pour ceux qui en ont besoin. Cela suppose Python 101 ; rien de Analyse de Données n'est requis.

C'est optionnel et non noté. Voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Charger un dossier fourni d'e-mails d'exemple — aucune vraie boîte de réception, mot de passe, ou configuration IMAP requise pour terminer ce projet.
2. Obtenir une clé API IA gratuite et écrire un prompt qui catégorise chaque e-mail (urgent / nécessite-réponse / newsletter / pour-info / potentiellement-spam) et lui assigne une priorité.
3. Écrire un second prompt qui rédige une réponse suggérée pour tout ce qui en a besoin — et intégrer une règle stricte que cet agent ne brise jamais : **il n'envoie jamais rien, jamais**. Chaque brouillon n'est qu'affiché et sauvegardé localement pour que toi tu le lises et l'envoies toi-même.
4. Exécuter le pipeline complet de bout en bout et lire ce qu'il a produit.
5. *(Optionnel, « aller plus loin »)* Pointe le même script vers ta propre vraie boîte de réception via IMAP au lieu des e-mails d'exemple, en utilisant un « mot de passe d'application » Gmail — pas ton vrai mot de passe.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal et recommandé — c'est du vrai Python tournant sur ta propre machine, le même mouvement « gradue vers du vrai Python » que tout autre projet de cette série. La leçon centrale (Étapes 1–4) n'a besoin de rien d'autre que les e-mails d'exemple fournis, donc il n'y a pas de compromis de confidentialité à gérer même en exécutant en local. La Configuration ci-dessous explique comment installer `uv`.

**GitHub Codespaces** fonctionne bien pour la leçon centrale : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt) et exécute exactement les mêmes commandes `uv` depuis un terminal dans ton onglet de navigateur. Les e-mails d'exemple fournis en font une façon authentiquement complète de faire tout le projet sans aucune configuration locale.

**Google Colab, Kaggle Notebooks, ou Binder** fonctionnent aussi pour la leçon centrale — zéro installation, directement dans ton navigateur. Le dépôt fournit un notebook prêt à l'emploi qui reflète exactement les étapes de cette leçon :

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-triage-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-triage-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Femail-triage-agent%2Fnotebook.ipynb)

Clique sur un badge, exécute les cellules de haut en bas, et colle une clé API gratuite quand demandé. C'est une façon de moindre fidélité de vivre le projet qu'un vrai projet `uv` local (pas de fichiers séparés, pas de vraie structure de projet), donc traite-le comme une façon rapide d'expérimenter plutôt que le chemin principal.

**Une note sur l'extension IMAP optionnelle** : aucune des trois options ci-dessus n'est un bon endroit pour taper un vrai mot de passe e-mail, mot de passe d'application ou non. Si tu essaies l'étape optionnelle « aller plus loin », fais-le en local, dans un fichier `.env` qui ne quitte jamais ta machine — pas dans une cellule de notebook ou un IDE cloud que tu ne contrôles pas entièrement.

## Configuration

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

### Mets en place le projet

```bash
uv init email-triage-agent
cd email-triage-agent
uv add openai python-dotenv
```

`openai` est la bibliothèque cliente que ce projet utilise pour appeler le LLM — chaque fournisseur du tableau ci-dessous expose justement un endpoint Chat Completions compatible OpenAI, donc une petite classe cliente couvre les six, juste pointée vers une `base_url` différente. `python-dotenv` te permet de garder ta clé API dans un fichier `.env` local plutôt que de faire `export` à chaque session.

### Obtiens une clé API IA gratuite

**Choisis le fournisseur que tu préfères** — aucun ne nécessite de carte de crédit au moment de l'écriture, et ce cours n'en favorise aucun.

| Fournisseur | Où obtenir une clé | Pourquoi le choisir |
|---|---|---|
| **GitHub Models** *(par défaut suggéré)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un jeton d'accès personnel avec le scope `models: read` | Pas d'inscription séparée — tu as déjà un compte GitHub. Limites de niveau gratuit plus généreuses que Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | L'option la plus couramment référencée ; utilisée dans les brouillons précédents de cette page. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inférence rapide, niveau gratuit généreux, pas de carte. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Un des quotas gratuits permanents les plus généreux. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Volume quotidien de tokens élevé, pas de carte. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Une API, plusieurs modèles gratuits — bon pour comparer les fournisseurs. |

Quel que soit celui que tu choisis, le processus est le même :

1. Connecte-toi et génère une clé API sur le site de ce fournisseur.
2. **Ne colle jamais cette clé directement dans le code ni ne la commite dans un dépôt.** Crée plutôt un fichier `.env` dans le dossier de ton projet :

```bash
# .env
LLM_PROVIDER=github
GITHUB_TOKEN=ta-clé-ici
```

`LLM_PROVIDER` indique au script quel fournisseur tu as choisi (`github`, `gemini`, `groq`, `mistral`, `cerebras`, ou `openrouter`) ; il vaut `github` par défaut si tu l'omets. Remplis seulement la clé unique dont tu as réellement besoin — la liste complète des noms de variables se trouve dans le `.env.example` de l'exemple du dépôt.

:::tip[Un fichier .env est souvent plus pratique qu'export]
Plutôt que de faire `export` d'une clé à chaque nouvelle session de terminal, `python-dotenv` lit `.env` automatiquement dès que ton script appelle `load_dotenv()` — pas de configuration par session, et c'est déjà exclu de git via `.gitignore` donc tu ne peux pas accidentellement commiter une vraie clé.
:::

Une clé API est un secret, exactement comme un mot de passe — quiconque la possède peut utiliser le quota de ton compte. La traiter comme une variable d'environnement plutôt qu'une chaîne codée en dur est la pratique standard exactement pour cette raison, et c'est la même habitude de sécurité du monde réel enseignée dans le [projet Agent IA](/docs/projects/ai-agent).

Avec `uv` installé, le projet configuré, et `.env` rempli, tu es prêt à construire — chaque étape à partir d'ici suppose que tout ceci est déjà fait.

## Étape 1 : Charge et inspecte les e-mails d'exemple

L'exemple du dépôt fournit six e-mails d'exemple courts et réalistes dans `sample_emails/` — une demande urgente de client, une newsletter, deux messages qui nécessitent authentiquement une réponse, une promo de spam, et une notification automatique pour information. Ce sont des fichiers texte brut ayant la forme d'un `.eml` simplifié : quelques lignes `En-tête: valeur`, une ligne vide, puis le corps.

Crée `triage.py` et commence avec un petit analyseur :

```python
# triage.py
"""Loads sample emails and will, by the end of this lesson, categorize,
prioritize, and draft replies for them using a free-tier LLM.

Run with: uv run python triage.py
"""

from dataclasses import dataclass
from pathlib import Path

SAMPLE_EMAILS_DIR = Path("sample_emails")


@dataclass
class Email:
    filename: str
    sender: str
    subject: str
    date: str
    body: str


def parse_email(path: Path) -> Email:
    """Parses one plain-text sample email: a few `Header: value` lines, a
    blank line, then the body -- the same shape as a real .eml file's
    headers, simplified so no email-parsing library is needed."""
    text = path.read_text(encoding="utf-8")
    header_text, _, body = text.partition("\n\n")
    headers = {}
    for line in header_text.splitlines():
        if ":" in line:
            key, _, value = line.partition(":")
            headers[key.strip().lower()] = value.strip()
    return Email(
        filename=path.name,
        sender=headers.get("from", "unknown"),
        subject=headers.get("subject", "(no subject)"),
        date=headers.get("date", "unknown"),
        body=body.strip(),
    )


def load_emails(directory: Path) -> list[Email]:
    """Loads every .txt file in `directory`, sorted by filename."""
    return [parse_email(p) for p in sorted(directory.glob("*.txt"))]


if __name__ == "__main__":
    emails = load_emails(SAMPLE_EMAILS_DIR)
    print(f"Loaded {len(emails)} email(s) from {SAMPLE_EMAILS_DIR}/\n")
    for email in emails:
        print(f"[{email.filename}] {email.subject!r} from {email.sender}")
```

Copie les six fichiers d'exemple depuis le dossier [`sample_emails/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/email-triage-agent/sample_emails) de l'exemple du dépôt dans le dossier `sample_emails/` de ton propre projet, puis exécute :

```bash
uv run python triage.py
```

`text.partition("\n\n")` fait le vrai travail ici : il divise le fichier en exactement deux morceaux à la *première* ligne vide — tout ce qui la précède (les en-têtes) et tout ce qui la suit (le corps) — ce qui est une structure suffisante pour travailler sans importer une bibliothèque complète d'analyse d'e-mails pour un texte aussi simple.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python triage.py` s'exécute sans erreur et affiche six e-mails chargés.</StepChecklistItem>
<StepChecklistItem>Chaque ligne affichée montre un vrai sujet et expéditeur, pas `"unknown"` ou `"(no subject)"`.</StepChecklistItem>
<StepChecklistItem>`sample_emails/` existe dans le dossier de ton projet et contient les six fichiers `.txt`.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `parse_email` cherche la *première* ligne vide pour séparer les en-têtes du corps. Qu'est-ce qui irait mal si un des e-mails d'exemple avait une ligne vide quelque part dans son propre texte de corps ?
- Les vrais fichiers `.eml` peuvent avoir des dizaines d'en-têtes (`Message-ID`, `Content-Type`, `X-Mailer`, et plus) que cet analyseur ignore silencieusement en ne lisant que `from`, `subject`, et `date`. Pourquoi ignorer le reste est-il le bon choix pour ce projet ?

## Étape 2 : Catégorise et priorise chaque e-mail avec un LLM

Maintenant remets chaque e-mail analysé à un modèle de langage et demande-lui de le trier en une catégorie et une priorité — la véritable étape de tri. Ajoute ceci à `triage.py` :

```python
import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Every provider below exposes an OpenAI-compatible Chat Completions
# endpoint, so one client class covers all six -- only the base_url, model
# name, and which environment variable holds the key change.
PROVIDERS = {
    "github": {
        "base_url": "https://models.github.ai/inference",
        "api_key_env": "GITHUB_TOKEN",
        "model": "gpt-4o-mini",
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "api_key_env": "GOOGLE_API_KEY",
        "model": "gemini-3.5-flash",
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "api_key_env": "GROQ_API_KEY",
        "model": "llama-3.3-70b-versatile",
    },
    "mistral": {
        "base_url": "https://api.mistral.ai/v1",
        "api_key_env": "MISTRAL_API_KEY",
        "model": "mistral-small-latest",
    },
    "cerebras": {
        "base_url": "https://api.cerebras.ai/v1",
        "api_key_env": "CEREBRAS_API_KEY",
        "model": "llama-3.3-70b",
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "api_key_env": "OPENROUTER_API_KEY",
        "model": "meta-llama/llama-3.3-70b-instruct:free",
    },
}


def build_client() -> tuple[OpenAI, str]:
    """Builds an OpenAI-compatible client for LLM_PROVIDER (default "github").
    Returns (client, model_name)."""
    provider = os.environ.get("LLM_PROVIDER", "github")
    config = PROVIDERS[provider]
    client = OpenAI(api_key=os.environ[config["api_key_env"]], base_url=config["base_url"])
    return client, config["model"]


TRIAGE_PROMPT = """You are an email triage assistant. Read the email below and respond with ONLY a JSON object (no other text, no markdown fence), with these exact keys:

- "category": one of "urgent", "needs-reply", "newsletter", "fyi", "spam-ish"
- "priority": one of "high", "medium", "low"
- "reasoning": one short sentence explaining the category and priority
- "needs_reply": true or false

Email:
From: {sender}
Subject: {subject}
Date: {date}

{body}
"""


def triage_email(client: OpenAI, model: str, email: Email) -> dict:
    """Asks the LLM to categorize and prioritize one email. Read-only:
    never modifies or sends anything -- just returns the model's verdict."""
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": TRIAGE_PROMPT.format(
            sender=email.sender, subject=email.subject, date=email.date, body=email.body,
        )}],
    )
    content = response.choices[0].message.content.strip()
    if content.startswith("```"):
        content = content.strip("`").removeprefix("json").strip()
    return json.loads(content)
```

Mets à jour le bloc `if __name__ == "__main__":` pour réellement l'appeler :

```python
if __name__ == "__main__":
    client, model = build_client()
    emails = load_emails(SAMPLE_EMAILS_DIR)
    print(f"Triaging {len(emails)} email(s) with model '{model}'...\n")
    for email in emails:
        verdict = triage_email(client, model, email)
        print(f"[{email.filename}] {email.subject!r}")
        print(f"  category: {verdict['category']}   priority: {verdict['priority']}")
        print(f"  reasoning: {verdict['reasoning']}\n")
```

```bash
uv run python triage.py
```

Le prompt demandant « SEULEMENT un objet JSON » puis l'analysant avec `json.loads` est ce qui transforme une réponse en texte libre du modèle en quelque chose sur quoi ton code peut réellement se brancher (`verdict["category"]`, `verdict["needs_reply"]`) — la même idée que `int(input(...))` transforme du texte clavier tapé librement en quelque chose avec quoi ton code peut faire de l'arithmétique, juste avec un modèle de langage remplaçant le clavier. Les modèles enveloppent parfois le JSON dans une balise ` ```json ` malgré l'instruction de ne pas le faire ; la ligne `content.strip("`")` est là spécifiquement pour survivre à cela sans planter.

:::tip[Demande un ensemble fixe de catégories, pas du texte libre]
`TRIAGE_PROMPT` détaille les cinq chaînes de catégorie exactes autorisées plutôt que de demander au modèle « d'inventer une catégorie ». Un modèle avec une liste fixe et explicite est bien plus cohérent d'un e-mail à l'autre qu'un modèle à qui on demande d'inventer librement des étiquettes — ce qui compte ici, puisque le code en aval (le `if verdict["needs_reply"]` de l'Étape 3) dépend de la prévisibilité des valeurs.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python triage.py` affiche une ligne de catégorie, priorité, et raisonnement pour les six e-mails d'exemple.</StepChecklistItem>
<StepChecklistItem>L'e-mail urgent du client et la newsletter obtiennent des catégories et priorités visiblement différentes.</StepChecklistItem>
<StepChecklistItem>Pas de `JSONDecodeError` — si tu en vois un, affiche la chaîne `content` brute avant l'analyse pour voir ce que le modèle a réellement retourné.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- L'e-mail de promo de spam (`04_spammy_promo.txt`) utilise un langage d'urgence (« agis maintenant », « expire dans 24 heures ») très similaire à l'e-mail authentiquement urgent du client. Qu'est-ce que dans le *contenu* de chaque e-mail (au-delà du seul ton) permettrait à un lecteur attentif — ou un prompt attentif — de les distinguer ?
- Qu'est-ce que tu attendrais qu'il se passe si tu retirais l'instruction « réponds avec SEULEMENT un objet JSON » et demandais simplement au modèle de « catégoriser cet e-mail » ? Essaie-le, et regarde ce qui casse dans ton code Python en conséquence.

## Étape 3 : Rédige (mais n'envoie jamais) une réponse

C'est l'étape où « agent » commence à signifier plus que « catégoriseur » — pour tout ce que le modèle a marqué `needs_reply: true`, demande-lui de rédiger une vraie réponse. Mais c'est aussi là que ce projet trace une ligne stricte : **l'agent ne fait toujours que rédiger du texte. Il n'envoie jamais rien, à personne, sous aucune condition.** Il n'y a aucun code SMTP dans ce projet du tout — pas commenté, pas derrière un flag, simplement absent, parce qu'un script qui *peut* envoyer un e-mail n'est qu'à un bug ou un mauvais prompt de le faire réellement.

Ajoute ceci à `triage.py` :

```python
DRAFT_REPLY_PROMPT = """Draft a short, professional reply to the email below. Write ONLY the reply body text -- no subject line, no commentary about what you're doing, just the reply itself, as if the recipient is about to review and send it.

Original email:
From: {sender}
Subject: {subject}

{body}
"""


def draft_reply(client: OpenAI, model: str, email: Email) -> str:
    """Asks the LLM to draft a reply. The result is ALWAYS just printed and
    saved to a local file for a human to review -- this function has no
    way to actually send anything, on purpose."""
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": DRAFT_REPLY_PROMPT.format(
            sender=email.sender, subject=email.subject, body=email.body,
        )}],
    )
    return response.choices[0].message.content.strip()
```

:::tip[Ne laisse jamais un agent envoyer quoi que ce soit sans toi dans la boucle]
C'est la leçon la plus importante de ce projet, plus importante que n'importe quelle ligne de code spécifique : un agent qui peut *rédiger* une réponse est utile ; un agent qui peut en *envoyer* une de manière autonome est une chose très différente, bien plus risquée — une mauvaise catégorisation, une instruction par injection de prompt cachée dans un corps de message, ou un modèle qui a une mauvaise journée, et il a envoyé quelque chose que tu n'as jamais approuvé, à quelqu'un de réel, que tu ne peux pas reprendre. La fonction `draft_reply` de ce projet retourne une chaîne et ne fait rien d'autre — pas de `smtplib`, pas de « auto-envoi si confiance élevée », rien d'automatique. Ce n'est pas une fonctionnalité manquante. C'est la conception. Garde cette limite si tu étends ce projet toi-même.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`draft_reply` est définie, prend un `Email`, et retourne une simple chaîne — rien dedans ne touche au réseau sauf le seul appel API LLM.</StepChecklistItem>
<StepChecklistItem>Tu peux pointer l'endroit exact dans ton code où une réponse devrait être envoyée, et confirmer que ce code n'existe pas.</StepChecklistItem>
<StepChecklistItem>Tu comprends *pourquoi* ça compte, pas juste que c'est une règle — voir les questions socratiques ci-dessous.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Imagine une version de ce projet qui envoie automatiquement une réponse chaque fois que le modèle rapporte une confiance élevée. Quelle est une façon réaliste dont ça pourrait mal tourner — pour l'e-mail urgent du client spécifiquement, ou pour la promo de spam ?
- Un des e-mails d'exemple (`04_spammy_promo.txt`) contient un langage manipulateur conçu pour faire agir un lecteur vite sans réfléchir. Si un vrai attaquant élaborait un e-mail spécifiquement pour manipuler un *agent IA* qui le lit (plutôt qu'un humain), à quoi ça pourrait ressembler, et comment le jamais-auto-envoi protégerait-il contre ça même si l'étape de catégorisation était dupée ?

## Étape 4 : Exécute-le de bout en bout et révise la sortie

Connecte tout ensemble — catégorise chaque e-mail, rédige une réponse pour ceux qui en ont besoin, et sauvegarde chaque brouillon dans un dossier local `drafts/` plutôt que d'afficher des murs de texte dans le terminal :

```python
DRAFTS_DIR = Path("drafts")

if __name__ == "__main__":
    client, model = build_client()
    emails = load_emails(SAMPLE_EMAILS_DIR)
    DRAFTS_DIR.mkdir(exist_ok=True)
    print(f"Triaging {len(emails)} email(s) with model '{model}'...\n")

    for email in emails:
        verdict = triage_email(client, model, email)
        print(f"[{email.filename}] {email.subject!r}")
        print(f"  category: {verdict['category']}   priority: {verdict['priority']}")
        print(f"  reasoning: {verdict['reasoning']}")

        if verdict.get("needs_reply"):
            reply = draft_reply(client, model, email)
            draft_path = DRAFTS_DIR / f"{Path(email.filename).stem}_draft_reply.txt"
            draft_path.write_text(reply, encoding="utf-8")
            print(f"  -> draft reply saved to {draft_path}  (NOT sent -- review and send yourself)")
        print()

    print(f"Done. Review anything in {DRAFTS_DIR}/ yourself before sending.")
```

```bash
uv run python triage.py
```

Ouvre les fichiers dans `drafts/` et lis-les réellement — c'est le but de tout le projet. Enverrais-tu ce que le modèle a rédigé, tel quel ? Le modifierais-tu d'abord ? Pour au moins un brouillon, réécris-le dans tes propres mots avant de le considérer « terminé » — cette passe éditoriale est exactement l'étape d'humain-dans-la-boucle autour de laquelle ce projet est construit, pas une réflexion après coup boulonnée par-dessus.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python triage.py` s'exécute jusqu'au bout et affiche une ligne de tri pour les six e-mails d'exemple.</StepChecklistItem>
<StepChecklistItem>`drafts/` contient une réponse sauvegardée pour chaque e-mail que le modèle a marqué `needs_reply: true`, et aucun fichier pour ceux qui ne le sont pas.</StepChecklistItem>
<StepChecklistItem>Tu as réellement ouvert et lu au moins un brouillon de réponse, et pourrais dire si tu l'enverrais tel quel ou le modifierais d'abord.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Lis le brouillon de réponse pour `03_needs_reply_coworker.txt` (la divergence des chiffres du T3). Résout-il réellement la divergence, ou reconnaît-il juste la question ? Qu'est-ce que ça te dit sur ce qu'un modèle de rédaction peut et ne peut pas faire seul ?
- Si tu exécutais ce script deux fois sur le même e-mail, t'attendrais-tu à ce que les deux brouillons de réponse soient identiques ? Essaie-le. Qu'est-ce que la réponse te dit sur le fait de te fier à une seule sortie de LLM comme si c'était une fonction fixe et déterministe ?

## Optionnel, « aller plus loin » : connecte ceci à une vraie boîte de réception

Tout ce qui précède tourne entièrement sur les e-mails d'exemple fournis — pas de vraie boîte de réception, pas de vrai mot de passe, rien qui quitte ta machine. Cette section n'est délibérément **pas** le chemin principal : c'est une extension optionnelle pour une fois que tu es à l'aise avec le comportement du script, pas quelque chose vers quoi te tourner le premier jour.

Gmail (et la plupart des fournisseurs) supportent les **Mots de Passe d'Application** — un mot de passe séparé, révocable, à usage limité que tu génères spécifiquement pour une application, au lieu de donner à cette application ton vrai mot de passe de compte. Si ton vrai mot de passe doit un jour changer, un mot de passe d'application peut être révoqué indépendamment ; s'il doit un jour changer, ça ne touche pas du tout à tes vraies informations d'identification. Pour en créer un pour Gmail : active la validation en deux étapes sur ton compte Google, puis visite [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) et génère un nouveau mot de passe d'application pour « Mail ». Utilise *ce* mot de passe généré, jamais ton vrai mot de passe Gmail, où que ce soit dans ce projet.

Installe le paquet optionnel `imap-tools` (ne fait pas partie des dépendances de la leçon centrale) et ajoute tes identifiants IMAP à `.env` :

```bash
uv add imap-tools
```

```bash
# .env — add these three lines
IMAP_HOST=imap.gmail.com
IMAP_USER=toi@gmail.com
IMAP_APP_PASSWORD=ton-mot-de-passe-d-application-ici
```

Le [`fetch_from_imap.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/email-triage-agent/fetch_from_imap.py) de l'exemple du dépôt récupère tes messages non lus les plus récents en **lecture seule** — `mark_seen=False` signifie que télécharger un message ici ne le marque pas comme lu dans ta vraie boîte de réception — et sauvegarde chacun comme un fichier `.txt` local ayant exactement la même forme que les e-mails d'exemple de `triage.py` :

```bash
uv run python fetch_from_imap.py
uv run python triage.py real_emails
```

Si tu n'utilises pas Gmail, la plupart des fournisseurs supportent IMAP avec un mot de passe d'application ou équivalent — vérifie les paramètres de sécurité du compte de ton fournisseur pour l'option équivalente, et ajuste `IMAP_HOST` en conséquence.

:::tip[Le moindre privilège, appliqué à ta propre boîte de réception]
Un mot de passe d'application limité seulement à « Mail », que tu peux révoquer à tout moment sans toucher à ta vraie connexion, est la même idée de *moindre privilège* derrière les clés API, les permissions de fichiers, et les jetons d'accès limités ailleurs dans ce cours — accorde la plus petite quantité d'accès qui fait le travail, pas ton compte entier. N'utilise jamais ton vrai mot de passe Gmail ici, et ne saute jamais la validation en deux étapes pour rendre la configuration plus rapide.
:::

## ⚠️ Pièges courants

- **Le modèle ne retourne pas de JSON valide.** Malgré l'instruction « SEULEMENT un objet JSON » du prompt, un modèle peut occasionnellement ajouter une phrase égarée ou envelopper la sortie dans un bloc de code. Si `json.loads` lève une exception, affiche d'abord la chaîne `content` brute pour voir exactement ce qui est revenu avant de supposer que ton code est en cause.
- **Confondre « rédigé » avec « envoyé ».** Un fichier sauvegardé dans `drafts/` n'est pas un e-mail envoyé — rien n'est encore allé nulle part. Si tu veux réellement répondre, ouvre ton vrai client e-mail et copie le brouillon toi-même ; c'est la conception, pas une étape manquante.
- **Limites de débit sur le niveau LLM gratuit.** Six e-mails représentent deux appels LLM chacun (tri, plus un brouillon pour tout ce qui nécessite une réponse) — suffisant pour occasionnellement atteindre un 429 sur un niveau gratuit. Ce n'est pas un bug ; voir la section « Gérer les limites de débit » du [projet Agent IA](/docs/projects/ai-agent) pour le même pattern et une approche de nouvelle tentative que tu peux copier.
- **Traiter les étiquettes de catégorie/priorité comme une vérité absolue.** Le verdict `"urgent"` ou `"spam-ish"` du modèle est une suggestion, pas un fait — il peut mal juger un message concis mais authentiquement urgent comme basse priorité, ou une liste de diffusion légitime comme spam. Survole la catégorisation toi-même avant de lui faire aveuglément confiance, surtout au début.

## Ce que tu viens de construire

Un pipeline de tri petit mais complet : analyser, catégoriser avec un LLM, rédiger avec un second appel LLM, et — de façon critique — s'arrêter là. Rien ici n'est une simplification jouet de la limite de sécurité ; un assistant e-mail de production gérant ta vraie boîte de réception devrait tracer exactement la même ligne entre « l'agent décide quoi dire » et « un humain décide si le dire réellement », juste avec plus d'e-mails et possiblement plus de catégories. La taille de la boîte de réception change ; la limite ne devrait pas.

## Où aller à partir d'ici

- Ajoute plus de catégories ou une échelle de priorité plus fine, et vois comment le prompt doit changer pour garder le modèle cohérent à mesure que l'ensemble d'étiquettes grandit.
- Étends `parse_email` pour gérer de vrais fichiers `.eml` (le module intégré `email` de Python les analyse correctement, y compris les pièces jointes et les corps multipart) au lieu du format texte brut simplifié utilisé ici.
- Essaie un second appel LLM qui révise le brouillon du *premier* modèle avant de le sauvegarder — un simple pattern en deux passes « rédiger, puis critiquer », et un premier goût en douceur des pipelines d'agents multi-étapes comme ceux du [projet Agent IA](/docs/projects/ai-agent).

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="email-triage-agent" />
