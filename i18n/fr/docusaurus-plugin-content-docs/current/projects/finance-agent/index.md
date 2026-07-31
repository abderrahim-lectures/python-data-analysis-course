---
id: 2027-finance-agent
title: "Construire un Agent de Finances Personnelles"
sidebar_label: "Construire un Agent de Finances Personnelles"
slug: /projects/finance-agent
description: "Catégorise un export CSV bancaire et signale les anomalies de dépenses, en combinant la manipulation de données avec pandas et un agent LLM à appel d'outils pour une catégorisation intelligente."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Agent de Finances Personnelles

<ProjectPublishedDate projectId="2027-finance-agent" />

<ProjectGreeting />

Ce projet suppose que tu es à l'aise avec Python 101, et s'appuie sur des idées de deux autres Projets du Monde Réel sans strictement exiger l'un ou l'autre : le nettoyage de données avec pandas à peu près au niveau de [Entraîne ton Premier Modèle de Machine Learning](/docs/projects/ml-classifier) (charger un CSV, gérer des colonnes en désordre), et le pattern d'agent à appel d'outils de [Construire un Agent IA](/docs/projects/ai-agent) (un modèle de langage qui décide d'appeler tes fonctions Python plutôt que de simplement répondre par du texte). Avoir vu l'un ou l'autre aide, mais les étapes ci-dessous réexpliquent ce dont elles ont besoin au fur et à mesure.

C'est optionnel et non noté — un bon choix une fois que tu as terminé Python 101. Voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Charger et nettoyer un export CSV bancaire d'exemple avec pandas.
2. Construire un catégoriseur de référence rapide basé sur des règles — et voir exactement où les règles à mots-clés atteignent leurs limites.
3. Construire un outil d'agent LLM qui catégorise les transactions que les règles n'ont pas pu étiqueter avec confiance, et explique son raisonnement.
4. Signaler les transactions statistiquement inhabituelles (un achat anormalement important comparé à la dépense typique de cette catégorie) et faire résumer par l'agent ce qu'il a trouvé en langage clair.

## Où exécuter ceci

**En local avec `uv`** est le chemin que suivent les étapes de cette leçon, et le recommandé — du vrai Python sur ta propre machine, comme tout autre projet de cette section. La section Configuration ci-dessous explique comment l'installer.

**GitHub Codespaces** est une alternative sans configuration : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt) et exécute exactement les mêmes commandes `uv` depuis un terminal dans ton onglet de navigateur.

**Google Colab, Kaggle Notebooks, ou Binder** fonctionnent aussi — ce projet n'a besoin d'aucun GPU, juste de pandas et d'un appel API LLM par transaction ambiguë. Une version notebook réelle et exécutable (le même pipeline que les étapes ci-dessous, travaillant sur le même CSV d'exemple synthétique) vit dans [`examples/finance-agent/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/notebook.ipynb). Clique sur un badge pour le lancer directement, sans aucune installation locale :

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffinance-agent%2Fnotebook.ipynb)

Sois honnête avec toi-même sur le compromis, cependant : c'est une façon de moindre fidélité de vivre le projet qu'un vrai projet `uv` local — pas de fichiers séparés, pas de vraie structure de projet, juste des cellules dans un notebook. Traite-le comme une façon rapide d'expérimenter, pas le chemin principal.

## Configuration

### Installe `uv`

`uv` est un seul outil qui remplace la chaîne habituelle « installe Python, puis installe pip, puis installe un outil d'environnement virtuel, puis installe les paquets ».

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
uv init finance-agent
cd finance-agent
uv add pandas deepagents langchain-openai python-dotenv
```

`pandas` gère le chargement et le nettoyage du CSV ; `deepagents` est le framework de LangChain pour construire des agents à appel d'outils ; `langchain-openai` parle à GitHub Models (son API est compatible OpenAI — voir le tip ci-dessous si tu as choisi un fournisseur différent) ; `python-dotenv` lit ta clé API depuis un fichier `.env` local.

### Obtiens une clé API IA gratuite

**Choisis le fournisseur que tu préfères** — aucun ne nécessite de carte de crédit au moment de l'écriture. L'exemple complet dans le dépôt du cours ([`examples/finance-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/finance-agent)) supporte les six d'office, sélectionnables avec un seul réglage.

| Fournisseur | Où obtenir une clé | Pourquoi le choisir |
|---|---|---|
| **GitHub Models** *(par défaut suggéré)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un jeton d'accès personnel avec le scope `models: read` | Pas d'inscription séparée — tu as déjà un compte GitHub. Limites de niveau gratuit plus généreuses que Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | L'option la plus couramment référencée. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inférence rapide, niveau gratuit généreux, pas de carte. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Un des quotas gratuits permanents les plus généreux. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Volume quotidien de tokens élevé, pas de carte. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Une API, plusieurs modèles gratuits — bon pour comparer les fournisseurs. |

Crée un fichier `.env` (ne le commite jamais) avec la clé du fournisseur que tu as choisi :

```bash
# .env
GITHUB_TOKEN=ta-clé-ici
```

:::tip[Un fichier .env est souvent plus pratique qu'export]
Plutôt que de faire `export` d'une clé à chaque nouvelle session de terminal, mets-la dans un fichier `.env` (voir le `.env.example` de l'exemple du dépôt) et charge-la automatiquement avec `python-dotenv`, comme le font les étapes ci-dessous.
:::

## Étape 1 : Charge et nettoie un export CSV bancaire d'exemple

:::tip[N'envoie jamais de vraies données bancaires non expurgées à une API tierce]
Ce projet travaille sur un CSV d'exemple **synthétique** — fausses dates, faux noms de commerçants, faux montants, fourni dans [`examples/finance-agent/transactions.csv`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/transactions.csv). Les Étapes 3 et 4 envoient des descriptions et montants de transactions à une API LLM tierce. Faire ça avec ton export bancaire *réel* signifie qu'une copie de ton historique financier réel — noms de commerçants, montants de dépenses, potentiellement plus si tu as exporté des colonnes supplémentaires — se retrouve maintenant sur les serveurs de ce fournisseur, soumise à quelles que soient les politiques de rétention et d'entraînement qu'il a actuellement, entièrement hors de ton contrôle. Si tu adaptes un jour ceci à tes vraies dépenses, expurge ou synthétise d'abord : retire les numéros de compte, généralise les noms de commerçants qui révèlent quelque chose de sensible, arrondis ou brouille les montants. C'est une habitude authentiquement importante, pas une formalité de cours — traite tout script qui appelle une API externe comme quelque chose qui verra tout ce que tu lui donnes.
:::

Télécharge le CSV d'exemple, ou copie-le depuis [`examples/finance-agent/transactions.csv`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/transactions.csv) dans le dossier de ton projet. Il ressemble à un vrai export : une ligne par transaction, une date, une description brute du commerçant exactement comme une banque l'imprimerait (abrégée, parfois cryptique), et un montant signé — négatif pour l'argent qui sort, positif pour les dépôts.

```python
import pandas as pd

df = pd.read_csv("transactions.csv", parse_dates=["date"])
df["description"] = df["description"].str.strip()
df = df.dropna(subset=["date", "description", "amount"]).sort_values("date").reset_index(drop=True)
df.head()
```

`parse_dates=["date"]` te donne de vrais objets `Timestamp` plutôt que de simples chaînes, pour que les étapes suivantes puissent grouper par mois ou trier chronologiquement sans tout ré-analyser. `.str.strip()` nettoie les espaces égarés dont sont pleins les vrais exports bancaires. Retirer les lignes auxquelles il manque une des trois colonnes essentielles est une façon simple et honnête de gérer une ligne authentiquement mal formée sans deviner ce qu'elle voulait dire.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`df["date"].dtype` montre un type datetime, pas `object`.</StepChecklistItem>
<StepChecklistItem>`df["amount"]` contient à la fois des valeurs négatives (dépenses) et positives (revenus).</StepChecklistItem>
<StepChecklistItem>`df.isna().sum()` ne montre aucune valeur manquante dans `date`, `description`, ou `amount`.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

Un vrai export bancaire pourrait aussi inclure une colonne `balance` cumulative. Rien dans ce projet ne l'utilise — mais peux-tu penser à une vérification de cohérence que tu pourrais faire en utilisant `balance` que `date`, `description`, et `amount` seuls ne peuvent pas te donner ?

## Étape 2 : Construis un catégoriseur de référence basé sur des règles — et vois ses limites

La façon la moins coûteuse de catégoriser une transaction est une recherche par mot-clé : si `"STARBUCKS"` apparaît dans la description, appelle ça `"Dining"`. C'est rapide, gratuit, et n'a besoin d'aucune clé API du tout — un bon réflexe à avoir avant d'ajouter de l'IA à un pipeline.

```python
RULES = {
    "starbucks": "Dining",
    "trader joes": "Groceries",
    "netflix.com": "Subscriptions",
    "shell oil": "Transport",
    "pacific gas electric": "Utilities",
    # ... see examples/finance-agent/rules.py for the full list
}


def categorize_rule_based(description: str) -> str | None:
    text = description.lower()
    for keyword, category in RULES.items():
        if keyword in text:
            return category
    return None


df["category"] = df["description"].apply(categorize_rule_based)
resolved = df["category"].notna().sum()
print(f"Rule-based pass: {resolved}/{len(df)} categorized. {len(df) - resolved} left ambiguous.")
```

Exécute ça contre les données d'exemple et une solide majorité des lignes sont catégorisées instantanément. Mais regarde ce qui reste dans `df[df["category"].isna()]` : des descriptions comme `SQ *JOES COFFEE CART`, `TST* CORNER BISTRO`, `PAYPAL *MERCHXYZ123`, `AMZN MKTP US*1H8KX2LP2`, et `VENMO PAYMENT JSMITH`. Un humain jetant un œil à `SQ *JOES COFFEE CART` reconnaît « coffee cart » instantanément — mais aucune liste fixe de mots-clés ne peut anticiper chaque préfixe de processeur de paiement (`SQ *`, `TST*`, `PAYPAL *`) ou virement de pair-à-pair qu'un export bancaire contiendra jamais. C'est une limitation réelle et courante des approches basées sur des règles pour du texte désordonné du monde réel, pas une artificielle — c'est exactement le fossé que l'étape suivante existe pour combler.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Tu peux afficher les lignes exactes que `categorize_rule_based` a laissées à `None`, et voir pourquoi chacune est authentiquement ambiguë (un préfixe de processeur de paiement ou un virement P2P, pas juste une faute de frappe dans ton dictionnaire de règles).</StepChecklistItem>
<StepChecklistItem>Tu as résisté à l'envie d'ajouter simplement plus de mots-clés pour chaque cas — une poignée de lignes non résolues restantes est attendue, pas un bug à corriger avec des règles.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

Si tu continuais à ajouter des mots-clés pour toujours, pourrais-tu éventuellement couvrir chaque description bancaire possible qu'une personne pourrait jamais voir ? Qu'est-ce que ta réponse implique sur le moment où une approche purement basée sur des règles cesse de valoir la peine d'être maintenue ?

## Étape 3 : Construis un outil d'agent LLM qui catégorise les transactions ambiguës

C'est la même forme d'appel d'outils que [Construire un Agent IA](/docs/projects/ai-agent) : une fonction Python avec une docstring, remise à `create_deep_agent`, que le modèle décide d'appeler lui-même.

```python
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from deepagents import create_deep_agent

load_dotenv()

CATEGORIES = [
    "Income", "Housing", "Groceries", "Dining", "Transport", "Utilities",
    "Subscriptions", "Entertainment", "Shopping", "Healthcare", "Travel", "Fees", "Other",
]


def categorize_transaction(description: str, amount: float) -> str:
    """Categorize one bank transaction the rule-based pass couldn't confidently label.

    `description` is the raw bank description string; `amount` is signed
    (negative = money out). Must return exactly one of: Income, Housing,
    Groceries, Dining, Transport, Utilities, Subscriptions, Entertainment,
    Shopping, Healthcare, Travel, Fees, Other.
    """
    # A real version of this tool could just let the model itself reason
    # about the description text and return a category directly, with no
    # body here at all -- see the tip below. This version keeps a small,
    # deterministic heuristic so the example stays fully repeatable offline.
    text = description.lower()
    if text.startswith("sq *") or text.startswith("tst*") or "coffee" in text or "bistro" in text:
        return "Dining"
    if text.startswith("venmo") or text.startswith("paypal"):
        return "Other"
    if text.startswith("amzn mktp"):
        return "Shopping"
    return "Other"


model = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

agent = create_deep_agent(
    model=model,
    tools=[categorize_transaction],
    system_prompt=(
        "You are a personal finance assistant. When asked to categorize a "
        "transaction, call the categorize_transaction tool rather than "
        "guessing -- it exists precisely for the ambiguous cases a simple "
        "keyword list can't handle."
    ),
)

unresolved = df[df["category"].isna()]
for idx, row in unresolved.iterrows():
    result = agent.invoke({
        "messages": [{
            "role": "user",
            "content": f"Categorize this transaction: description={row['description']!r}, amount={row['amount']}",
        }]
    })
    text = str(result["messages"][-1].content)
    match = next((c for c in CATEGORIES if c.lower() in text.lower()), "Other")
    df.at[idx, "category"] = match

df["category"].value_counts()
```

Remarque que la boucle appelle `agent.invoke(...)` une fois par ligne non résolue, chacune un aller-retour séparé vers le modèle — la même considération de limite de débit du projet Agent IA s'applique ici : exécute ça contre un gros CSV et tu peux atteindre le plafond par minute d'un niveau gratuit. Voir la section « Gérer les limites de débit » de ce projet, et `ask()` dans [`examples/ai-agent/agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent/agent.py), pour un pattern de nouvelle tentative que tu peux réutiliser ici.

:::tip[Laisse le modèle raisonner, ne recache pas juste les règles dans l'outil]
Le corps de `categorize_transaction` ci-dessus est délibérément encore une petite heuristique, pas une recherche codée en dur — mais tu peux aller plus loin : donne au `system_prompt` de l'agent la liste complète des catégories et demande-lui de raisonner directement sur une description inconnue (`"SQ *"` est le préfixe de point de vente de Square ; `"TST*"` est celui de Toast — un modèle qui a vu suffisamment de données de paiement du monde réel peut souvent inférer « c'est probablement un petit restaurant ou un stand » juste à partir de la forme de la chaîne, de la même façon qu'un humain le ferait). L'exemple plus complet du dépôt dans [`examples/finance-agent/finance_agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/finance-agent) est écrit pour faciliter ce changement — voir ses commentaires.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Chaque ligne qui était `None` après l'Étape 2 a maintenant une `category` non nulle après l'exécution de cette étape.</StepChecklistItem>
<StepChecklistItem>Tu as affiché au moins une réponse de l'agent et peux pointer quel appel d'outil a produit quelle catégorie.</StepChecklistItem>
<StepChecklistItem>`df["category"].value_counts()` montre des catégories qui ont du sens pour ce que tu sais de chaque commerçant.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

La docstring de l'outil liste les 13 catégories valides, et le code qui lit la réponse du modèle (`match = next((c for c in CATEGORIES if c.lower() in text.lower()), "Other")`) retombe quand même sur `"Other"` si aucune d'elles n'apparaît. Pourquoi garder ce filet de sécurité même si l'outil est *censé* toujours retourner l'une des 13 ? Qu'est-ce qui pourrait mal tourner sans lui ?

## Étape 4 : Signale les anomalies statistiques et résume-les en langage clair

« Anomalie » signifie ici : anormalement importante *pour cette catégorie*. Une charge d'hôtel de 400 $ est banale pour Travel mais un net cas extrême pour Dining — donc au lieu d'un seuil global unique en dollars, calcule un **z-score** par catégorie : combien d'écarts-types une transaction se situe au-dessus de la dépense moyenne de sa propre catégorie.

```python
spend = df["amount"].where(df["amount"] < 0)
df["spend_abs"] = spend.abs()

stats = df.groupby("category")["spend_abs"].agg(["mean", "std"]).rename(
    columns={"mean": "category_mean", "std": "category_std"}
)
df = df.join(stats, on="category")

safe_std = df["category_std"].replace(0, pd.NA)  # avoid dividing by 0/undefined std for tiny categories
df["z_score"] = (df["spend_abs"] - df["category_mean"]) / safe_std
df["is_anomaly"] = (df["z_score"] >= 2.0).fillna(False)

flagged = df[df["is_anomaly"]].sort_values("z_score", ascending=False)
flagged[["date", "description", "spend_abs", "category", "category_mean", "z_score"]]
```

Un z-score de 2,0 signifie « plus de deux écarts-types au-dessus de la moyenne de cette catégorie » — une règle empirique statistique courante, bien que quelque peu arbitraire, pour « inhabituel ». Exécute ça sur les données d'exemple et tu devrais voir quelques transactions se démarquer clairement : un achat d'électronique surdimensionné par rapport à la dépense Shopping typique, et une charge de restaurant bien au-dessus de la dépense Dining typique (un grand dîner de groupe, peut-être — les données ne peuvent pas dire pourquoi, seulement que c'est inhabituel).

Remets maintenant la liste brute signalée au même agent et demande-lui d'expliquer ce qu'il a trouvé, en langage clair :

```python
summary_lines = [
    f"- {row['date'].date()} | {row['description']} | ${row['spend_abs']:.2f} in {row['category']} "
    f"(category average: ${row['category_mean']:.2f}, z-score: {row['z_score']:.1f})"
    for _, row in flagged.iterrows()
]
anomaly_summary = "\n".join(summary_lines) if summary_lines else "No anomalies found."

result = agent.invoke({
    "messages": [{
        "role": "user",
        "content": (
            "Here are transactions flagged as statistically unusual for their category "
            "(z-score = how many standard deviations above that category's average spend):\n\n"
            f"{anomaly_summary}\n\n"
            "Summarize this for someone reviewing their bank statement, in 2-4 plain-English "
            "sentences. No new numbers, no advice beyond what the data supports."
        ),
    }]
})
print(result["messages"][-1].content)
```

Le prompt dit délibérément « pas de nouveaux nombres, pas de conseil au-delà de ce que les données appuient » — une vraie protection contre un mode d'échec courant des résumés LLM : inventer une explication d'apparence plausible mais non étayée (« c'était probablement un dîner d'anniversaire ») plutôt que de s'en tenir à ce que les statistiques montrent réellement.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`flagged` contient la ou les transaction(s) que tu t'attendrais à voir se démarquer à l'œil, et exclut les ordinaires.</StepChecklistItem>
<StepChecklistItem>Tu comprends pourquoi le z-score est calculé *par catégorie*, pas globalement à travers toutes les dépenses.</StepChecklistItem>
<StepChecklistItem>Le résumé en langage clair de l'agent ne mentionne que des catégories/montants qui apparaissent réellement dans `anomaly_summary` — rien d'inventé.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

Une catégorie avec seulement une ou deux transactions a un écart-type indéfini ou proche de zéro — le code ci-dessus se protège contre la division par ça avec `.replace(0, pd.NA)`. Qu'arriverait-il aux z-scores d'une catégorie si cette protection n'était pas là, et pourquoi une catégorie avec très peu de transactions pourrait-elle être un mauvais candidat pour ce genre de détection d'anomalies dès le départ ?

## ⚠️ Pièges courants

- **Envoyer de vraies données financières à une API tierce.** Couvert ci-dessus, ça vaut la peine de le répéter : ce projet est construit autour d'un CSV synthétique spécifiquement pour que tu construises l'habitude de traiter tout script qui appelle une API externe comme quelque chose qui verra tout ce que tu lui donnes.
- **Relancer la boucle de catégorisation inutilement.** Appeler `agent.invoke(...)` une fois par ligne non résolue consomme du vrai quota API à chaque fois que tu relances ton script — mets en cache les résultats (ex. dans un CSV local ou un dict indexé par description) plutôt que de recatégoriser les mêmes lignes à chaque exécution pendant que tu itères sur l'Étape 4.
- **Un seuil d'anomalie global au lieu d'un par catégorie.** Signaler « toute transaction au-dessus de 200 $ » raterait un cas extrême de 150 $ dans une catégorie qui dépense normalement 20 $, et signalerait constamment des charges de loyer ou de voyage ordinaires. Compare chaque transaction à la dépense typique de sa propre catégorie, comme le fait l'Étape 4.
- **Laisser l'agent de résumé inventer des explications.** Un LLM à qui on demande d'« expliquer » une anomalie fabriquera volontiers une raison d'apparence plausible si tu le laisses faire. Contrains le prompt aux vrais chiffres, comme à l'Étape 4, et traite tout ce qui va au-delà comme le modèle qui devine, pas qui rapporte.
- **Faire confiance à `is_anomaly` d'une catégorie avec 1-2 transactions.** Une catégorie dont presque chaque valeur vient d'un échantillon minuscule ne te dit pas encore grand-chose sur ce qui est « normal » pour elle — voir la question socratique ci-dessus.

## Ce que tu viens de construire

Un pipeline petit mais authentiquement utile : une passe basée sur des règles qui gère les 80% faciles des transactions gratuitement, un agent LLM qui récupère le reste ambigu qu'une liste fixe de mots-clés ne peut structurellement pas couvrir, et une vérification statistique des anomalies qui transforme « est-ce que quelque chose semble bizarre ici ? » en une réponse réelle et défendable — puis un résumé en langage clair sur lequel un lecteur non technique pourrait agir. Cette forme « passe déterministe bon marché d'abord, IA pour le reste authentiquement ambigu » se généralise bien au-delà de la finance — c'est le même réflexe derrière beaucoup de pipelines de données du monde réel qui utilisent des LLM.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/finance-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/finance-agent) dans le dépôt du cours a le pipeline complet en fichiers séparés et réutilisables (`rules.py`, `anomalies.py`, `finance_agent.py`) plus un CSV d'exemple synthétique, et supporte les six fournisseurs du tableau ci-dessus, sélectionnables avec un seul réglage. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et exécute-le depuis là.
:::

## Où aller à partir d'ici

- **Un résumé sans confusion à travers les mois.** Groupe par `date.dt.to_period("M")` et compare les totaux de catégorie de chaque mois — les dépenses augmentent-elles quelque part de spécifique, au-delà de n'importe quelle transaction signalée individuelle ?
- **Une vérification d'anomalies plus intelligente.** Un z-score suppose que les dépenses au sein d'une catégorie ont approximativement une forme de cloche, ce qui n'est pas toujours vrai (le loyer est presque constant ; la restauration varie beaucoup). Regarde des mesures plus robustes comme la médiane et l'écart interquartile (IQR) pour les catégories où quelques grandes valeurs faussent la moyenne.
- **Un vrai budget de catégorisation.** Plutôt que de recatégoriser chaque ligne non résolue à chaque exécution, persiste les résultats catégorisés (un fichier SQLite local ou un cache CSV indexé par description) pour que relancer le script n'appelle l'agent que sur des transactions authentiquement nouvelles.
- **Plusieurs mois, plusieurs comptes.** Les vraies finances s'étendent sur plus d'un compte. Essaie d'étendre le pipeline pour charger plusieurs CSV et réconcilier les catégories de façon cohérente entre eux.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="2027-finance-agent" />
