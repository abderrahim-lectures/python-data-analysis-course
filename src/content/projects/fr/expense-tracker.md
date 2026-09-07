---
title: "Suiveur de Dépenses"
description: "Suivez les dépenses avec catégories, budgets, scan de reçus et rapports financiers."
difficulty: "beginner"
estimatedMinutes: 50
xpReward: 50
tags: ["pandas", "matplotlib", "data-analysis", "visualization"]
prerequisites:
  - "Les bases de Python (variables, boucles, fonctions, dictionnaires)"
  - "Les bases de pandas (DataFrames, groupby)"
  - "Les bases de matplotlib"
learningObjectives:
  - "Modéliser des données financières avec des dictionnaires et listes Python"
  - "Convertir des données brutes en DataFrames pandas pour l'analyse"
  - "Regrouper et agréger les dépenses par catégorie et par mois"
  - "Construire un système d'alerte de budget basé sur des seuils"
  - "Créer des diagrammes en barres et en secteurs avec matplotlib"
  - "Persister les données en CSV et les recharger entre sessions"
---

# 💰 Suiveur de Dépenses

Suis tes dépenses, tiens-toi aux budgets et visualise où va ton argent — tout depuis la ligne de commande. Ce projet te fait passer des dictionnaires Python bruts à l'analyse pandas puis aux graphiques matplotlib, en construisant un outil pratique que tu peux réellement utiliser pour gérer tes finances.

Ceci est facultatif et non noté. Consulte [Real-World Projects](/docs/projects) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Définir un modèle de données pour les dépenses et budgets avec des dictionnaires et listes Python simples.
2. Écrire des fonctions pour journaliser de nouvelles dépenses avec date, montant, catégorie et description.
3. Convertir les données de dépenses en DataFrame pandas et calculer des résumés par catégorie et par mois.
4. Construire un système d'alerte de budget qui signale les dépassements avec des seuils configurables.
5. Générer des diagrammes en barres et en secteurs montrant où va ton argent.
6. Persister les dépenses dans un fichier CSV et les recharger entre sessions.
7. Polir le tout en une CLI interactive avec un menu, une sortie colorée et la validation des entrées.

## Où exécuter ceci

- **Localement avec `uv` (recommandé).** Ce projet utilise `pandas` et `matplotlib`, donc une installation locale est le chemin le plus fluide. La section Configuration ci-dessous le parcourt.
- **JupyterLite playground.** Colle les cellules de code directement dans un notebook — cela fonctionne bien pour explorer les étapes d'analyse (2–5), bien que le menu CLI (étape 7) soit conçu pour un vrai terminal.
- **Google Colab.** Ouvre un nouveau notebook et colle les cellules. Même réserve que JupyterLite : la CLI interactive fonctionne le mieux dans un vrai terminal.

## Configuration

`uv` est un outil unique qui remplace la chaîne habituelle « installer Python, puis pip, puis un environnement virtuel » — il peut installer et gérer des versions de Python aux côtés des dépendances de ton projet.

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

Puis configure le projet :

```bash
uv init expense-tracker
cd expense-tracker
uv add pandas matplotlib
```

`pandas` gère l'analyse de données (DataFrames, groupby, agrégations) et `matplotlib` génère les graphiques. Tout le reste est du Python standard library.

## Étape 1 : Définir le modèle de données

Avant d'écrire des fonctions, décide comment les dépenses et budgets vivent en mémoire. Chaque dépense est un dictionnaire avec quatre champs — date, montant, catégorie et description. Une liste contient toutes les dépenses. Un dictionnaire séparé mappe chaque catégorie à sa limite de budget mensuelle.

### 1.1 Crée les conteneurs vides

**👟 Indice de départ :** Importe `pandas` et `date` de `datetime`. Crée une liste vide appelée `expenses` et un dictionnaire `budgets` avec quatre catégories : groceries, transport, dining et entertainment. Choisis des montants en dollars raisonnables pour chaque budget.

```python
import pandas as pd
from datetime import date

expenses = []
budgets = {
    "groceries": 500,
    "transport": 200,
    "dining": 300,
    "entertainment": 150,
}
```

**🎯 Résultat attendu :** Pas encore de sortie visible — tu viens de créer deux conteneurs vides. Lancer `print(expenses)` donne `[]` et `print(budgets)` montre les quatre catégories avec leurs limites.

**🩹 Si ça ne marche pas :** Si tu obtiens une `NameError` sur `pd`, assure-toi qu'`import pandas as pd` est en haut de la cellule ou du script. Si `budgets` affiche un dictionnaire vide, vérifie que tu as inclus les deux-points entre les noms de catégories et les montants.

### 1.2 Comprendre la structure de dépense

Chaque dépense que tu journalises sera un dictionnaire qui ressemble à cela :

```python
{
    "date": "2026-09-06",
    "amount": 42.50,
    "category": "groceries",
    "description": "Weekly farmer's market",
}
```

La `date` est stockée comme une chaîne au format ISO (`YYYY-MM-DD`) pour qu'elle se trie correctement. Le `amount` est un flottant arrondi à deux décimales. La `category` est toujours en minuscules pour la cohérence. La `description` est un texte libre.

**✅ Liste de vérification**

- ✅ `expenses` est une liste vide `[]`.
- ✅ `budgets` a quatre clés : `"groceries"`, `"transport"`, `"dining"`, `"entertainment"`.
- ✅ Tu peux expliquer ce que représente chaque champ d'un dictionnaire de dépense.

---

## Étape 2 : Ajouter des dépenses

Écris une fonction qui prend un montant, une catégorie et une description, construit un dictionnaire de dépense et l'ajoute à la liste. Inclus la normalisation de date et une validation de base.

### 2.1 Écris la fonction `add_expense`

**👟 Indice de départ :** Définis `add_expense(amount, category, description)` qui ajoute un dictionnaire à `expenses`. Utilise `date.today().isoformat()` pour la date. Arrondis le montant à deux décimales. Mets la catégorie en minuscules. Imprime un message de confirmation après chaque ajout.

```python
def add_expense(amount: float, category: str, description: str) -> None:
    expenses.append({
        "date": date.today().isoformat(),
        "amount": round(amount, 2),
        "category": category.lower(),
        "description": description,
    })
    print(f"Added: ${amount:.2f} in {category}")
```

### 2.2 Teste-la avec des données d'échantillon

**👟 Indice de départ :** Appelle `add_expense` quatre fois avec des montants, catégories et descriptions différents. Puis imprime la liste `expenses` pour confirmer que les quatre y sont.

```python
add_expense(42.50, "groceries", "Weekly farmer's market")
add_expense(15.00, "transport", "Bus pass top-up")
add_expense(28.00, "dining", "Lunch with colleague")
add_expense(55.00, "groceries", "Pantry restock")
```

**🎯 Résultat attendu :**

```
Added: $42.50 in groceries
Added: $15.00 in transport
Added: $28.00 in dining
Added: $55.00 in groceries
```

L'impression de `expenses` montre une liste de quatre dictionnaires, chacun avec les clés `date`, `amount`, `category` et `description`.

**🩹 Si ça ne marche pas :** Si la catégorie n'apparaît pas en minuscules dans la sortie, assure-toi d'appeler `.lower()` sur l'entrée — cela empêche `"Groceries"` et `"groceries"` de devenir des catégories séparées. Si la date affiche la date du jour même si tu en as entré une autre, c'est attendu : la fonction estampille toujours la date courante.

### 2.3 Vérifie les données

**✅ Liste de vérification**

- ✅ Quatre dépenses sont dans la liste après avoir appelé `add_expense` quatre fois.
- ✅ Chaque dépense a les quatre clés : `date`, `amount`, `category`, `description`.
- ✅ La catégorie est en minuscules quel que soit le mode de saisie.
- ✅ Le montant est arrondi à deux décimales.

**🤔 Question(s) socratique(s)**

Pourquoi passer la catégorie en minuscules dans la fonction plutôt que d'exiger de l'appelant qu'il la tape en minuscules ? Qu'arriverait-il à ton analyse `groupby` de l'étape 3 si `"Groceries"` et `"groceries"` comptaient comme des catégories séparées ?

---

## Étape 3 : Convertir en DataFrame et analyser

Les listes brutes de dictionnaires sont bien pour la journalisation, mais une vraie analyse a besoin de pandas. Convertis la liste en DataFrame, puis utilise `groupby` pour calculer les totaux par catégorie et les résumés mensuels.

### 3.1 Construis le DataFrame

**👟 Indice de départ :** Passe la liste `expenses` directement à `pd.DataFrame()`. Imprime le résultat avec `to_string(index=False)` pour une sortie propre — pas de numéros de ligne encombrant la vue.

```python
df = pd.DataFrame(expenses)
print("All expenses:")
print(df.to_string(index=False))
```

**🎯 Résultat attendu :**

```
All expenses:
       date  amount    category                description
 2026-09-06   42.50   groceries  Weekly farmer's market
 2026-09-06   15.00   transport          Bus pass top-up
 2026-09-06   28.00      dining      Lunch with colleague
 2026-09-06   55.00   groceries          Pantry restock
```

**🩹 Si ça ne marche pas :** Si tu vois un DataFrame vide avec `RangeIndex(start=0, stop=0, step=0)`, la liste `expenses` est vide — tu n'as pas encore appelé `add_expense` dans cette session. Si les noms de colonnes semblent faux, vérifie que tes dictionnaires de dépense utilisent exactement `"date"`, `"amount"`, `"category"` et `"description"` comme clés.

### 3.2 Calcule les totaux par catégorie

**👟 Indice de départ :** Utilise `df.groupby("category")["amount"].sum()` pour obtenir une Series dont l'index est le nom de catégorie et les valeurs le total dépensé. Imprime-la.

```python
category_totals = df.groupby("category")["amount"].sum()
print("\nSpending by category:")
print(category_totals)
```

**🎯 Résultat attendu :**

```
Spending by category:
category
groceries     97.50
dining        28.00
transport     15.00
```

**🩹 Si ça ne marche pas :** Si tu obtiens une `KeyError`, le nom de colonne ne correspond pas — vérifie les fautes de frappe comme `"cat"` au lieu de `"category"`. Si les totaux semblent faux, vérifie que tu as passé `["amount"]` avant `.sum()` — sans cela, tu essaierais d'additionner chaque colonne numérique, ce qui pourrait inclure des données inattendues.

### 3.3 Ajoute des résumés mensuels

**👟 Indice de départ :** Convertis la colonne `date` en datetime avec `pd.to_datetime()`, puis extrais la période mensuelle avec `.dt.to_period("M")`. Regroupe par celle-ci et additionne.

```python
df["date"] = pd.to_datetime(df["date"])
monthly = df.groupby(df["date"].dt.to_period("M"))["amount"].sum()
print("\nMonthly totals:")
print(monthly)
```

**🎯 Résultat attendu :** Si toutes les dépenses datent de septembre 2026, tu verras une seule ligne :

```
Monthly totals:
date
2026-09    140.5
```

**🩹 Si ça ne marche pas :** Une `TypeError` sur `pd.to_datetime` signifie que les chaînes de date ne sont pas dans un format reconnaissable — retourne à `add_expense` et confirme que tu utilises `date.today().isoformat()`. Si les dates de mois différents n'apparaissent pas séparément, tes données de test sont toutes du même mois — ajoute une dépense avec une date différente pour tester.

### 3.4 Vérifie l'analyse

**✅ Liste de vérification**

- ✅ `df` a exactement quatre colonnes : `date`, `amount`, `category`, `description`.
- ✅ `category_totals` totalise le même montant que l'addition à la main de tous les montants.
- ✅ Les résumés mensuels regroupent correctement les dépenses par année-mois.
- ✅ Les catégories vides n'apparaissent pas dans la sortie du groupby.

**🤔 Question(s) socratique(s)**

Qu'est-ce que `df.groupby("category")["amount"].mean()` te dirait que `.sum()` ne dit pas ? Quand la dépense moyenne par dépense importe-t-elle plus que la dépense totale ?

---

## Étape 4 : Alertes de budget

L'analyse des dépenses est intéressante, mais un traqueur de budget doit te *prévenir* quand tu es sur le point de dépasser. Vérifie chaque catégorie contre sa limite de budget et imprime des alertes à un seuil configurable.

### 4.1 Écris la fonction `check_budgets`

**👟 Indice de départ :** Définis `check_budgets(spending, budgets, threshold=0.8)` qui boucle sur chaque catégorie de `budgets`, recherche combien a été dépensé, calcule le pourcentage et imprime une ligne de statut : OK si sous le seuil, WARNING entre le seuil et 100 %, OVER BUDGET si dépassé.

```python
def check_budgets(spending: dict, budgets: dict, threshold: float = 0.8) -> None:
    for category, limit in budgets.items():
        spent = spending.get(category, 0)
        pct = spent / limit if limit else 0
        if pct >= 1.0:
            print(f"  OVER BUDGET: {category} — ${spent:.0f} / ${limit:.0f}")
        elif pct >= threshold:
            print(f"  WARNING: {category} — ${spent:.0f} / ${limit:.0f} ({pct:.0%})")
        else:
            print(f"  OK: {category} — ${spent:.0f} / ${limit:.0f}")
```

### 4.2 Exécute-la contre tes données

**👟 Indice de départ :** Convertis `category_totals` en dict avec `.to_dict()` et passe-le à `check_budgets` avec `budgets`.

```python
print("Budget status:")
check_budgets(category_totals.to_dict(), budgets)
```

**🎯 Résultat attendu** (avec les données d'échantillon) :

```
Budget status:
  OK: groceries — $97 / $500
  OK: transport — $15 / $200
  OK: dining — $28 / $300
  OK: entertainment — $0 / $150
```

Ajoute une dépense plus grosse pour voir l'avertissement :

```python
add_expense(450.00, "groceries", "Big grocery run")
check_budgets(
    pd.DataFrame(expenses).groupby("category")["amount"].sum().to_dict(),
    budgets,
)
```

Maintenant groceries affiche un WARNING à 90 % ($547 / $500). Dépasser la limite et il imprime OVER BUDGET.

**🩹 Si ça ne marche pas :** Si toutes les catégories affichent `OK` même avec de grosses dépenses, vérifie que tu passes le dict *additionné* des totaux, pas la liste brute des dépenses. Si tu obtiens une `ZeroDivisionError`, une de tes limites de budget est zéro — chaque catégorie de `budgets` a besoin d'une limite positive.

### 4.3 Teste le seuil

**✅ Liste de vérification**

- ✅ Une catégorie sous 80 % de son budget affiche « OK ».
- ✅ Une catégorie entre 80 % et 100 % affiche « WARNING » avec le pourcentage.
- ✅ Une catégorie à plus de 100 % affiche « OVER BUDGET ».
- ✅ Les catégories absentes du dict de dépenses (comme `entertainment` avec zéro dépense) affichent « OK » à 0 %.

**🤔 Question(s) socratique(s)**

Pourquoi prendre 80 % par défaut comme seuil d'avertissement ? Quels types de dépenses pourraient avoir besoin d'un seuil plus bas (disons 50 %) contre un plus haut (90 %) ? Comment laisserais-tu les utilisateurs définir des seuils par catégorie au lieu d'un seul seuil global ?

---

## Étape 5 : Visualiser les dépenses

Les nombres dans un tableau sont utiles, mais les graphiques rendent les schémas de dépenses immédiatement évidents. Construis un diagramme en barres pour les totaux par catégorie et un diagramme en secteurs pour les proportions — côte à côte dans une seule figure.

### 5.1 Crée les graphiques côte à côte

**👟 Indice de départ :** Importe `matplotlib.pyplot`. Utilise `plt.subplots(1, 2, figsize=(12, 5))` pour créer deux axes. Trace un diagramme en barres à gauche et un diagramme en secteurs à droite. Enregistre la figure avec `savefig`.

```python
import matplotlib.pyplot as plt

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Bar chart
colors = ["#2ecc71", "#3498db", "#e74c3c", "#f39c12"]
category_totals.plot(kind="bar", ax=axes[0], color=colors[:len(category_totals)])
axes[0].set_title("Spending by Category")
axes[0].set_ylabel("Amount ($)")
axes[0].tick_params(axis="x", rotation=45)

# Pie chart
category_totals.plot(kind="pie", ax=axes[1], autopct="%1.1f%%", startangle=90)
axes[1].set_title("Spending Distribution")
axes[1].set_ylabel("")

plt.tight_layout()
plt.savefig("spending_report.png", dpi=150)
plt.show()
print("Chart saved to spending_report.png")
```

**🎯 Résultat attendu :** Une fenêtre s'ouvre (ou une image en ligne dans un notebook) montrant deux graphiques : un diagramme en barres à gauche avec une barre par catégorie, et un diagramme en secteurs à droite montrant les ventilations en pourcentage. Un fichier appelé `spending_report.png` apparaît dans ton répertoire de travail.

**🩹 Si ça ne marche pas :** Si le diagramme en secteurs montre des étiquettes qui se chevauchent, augmente `figsize` à `(14, 6)` ou réduis la taille de police avec `plt.rcParams["font.size"] = 10` avant de tracer. Si `savefig` enregistre une image vide, assure-toi que `plt.show()` vient *après* `savefig` — certains backends effacent la figure sur `show()`. Si tu obtiens une `IndexError` sur `colors[:len(category_totals)]`, tes données de dépenses ont plus de catégories que de couleurs — ajoute plus de codes hex à la liste.

### 5.2 Personnalise l'apparence

**👟 Indice de départ :** Ajoute un titre à la figure avec `fig.suptitle("September 2026 Spending Report", fontsize=14)`. Utilise `plt.tight_layout(rect=[0, 0, 1, 0.95])` pour faire de la place au titre.

```python
fig.suptitle("September 2026 Spending Report", fontsize=14, fontweight="bold")
plt.tight_layout(rect=[0, 0, 1, 0.95])
plt.savefig("spending_report.png", dpi=150, bbox_inches="tight")
plt.show()
```

### 5.3 Vérifie les graphiques

**✅ Liste de vérification**

- ✅ Le diagramme en barres a une barre par catégorie avec des étiquettes sur l'axe des x.
- ✅ Le diagramme en secteurs montre des étiquettes en pourcentage (par ex. « 69.4% ») sur chaque part.
- ✅ Un fichier PNG est enregistré sur disque et n'est pas vide.
- ✅ Les graphiques sont lisibles — pas de texte qui se chevauche ni d'étiquettes coupées.

**🤔 Question(s) socratique(s)**

Quand un diagramme en barres est-il plus utile qu'un diagramme en secteurs, et vice versa ? Qu'arrive-t-il au diagramme en secteurs si une catégorie domine à 95 % des dépenses — peux-tu encore lire les plus petites parts ?

---

## Étape 6 : Enregistrer et charger les données

Tes dépenses disparaissent quand le programme se ferme. Corrige cela en écrivant dans un fichier CSV sur disque et en le rechargeant au démarrage.

### 6.1 Enregistre les dépenses en CSV

**👟 Indice de départ :** Écris `save_expenses(df, filename)` qui appelle `df.to_csv(filename, index=False)`. L'usage d'`index=False` empêche pandas d'écrire des numéros de ligne qui encombreraient le fichier.

```python
def save_expenses(df: pd.DataFrame, filename: str = "expenses.csv") -> None:
    df.to_csv(filename, index=False)
    print(f"Saved {len(df)} expenses to {filename}")
```

**🎯 Résultat attendu :** Appeler `save_expenses(df)` écrit `expenses.csv` et imprime `Saved 4 expenses to expenses.csv`. Le fichier CSV a une ligne d'en-tête suivie d'une ligne par dépense.

### 6.2 Charge les dépenses depuis le CSV

**👟 Indice de départ :** Écris `load_expenses(filename)` qui vérifie d'abord si le fichier existe. Si c'est le cas, lis-le avec `pd.read_csv` et analyse la colonne de date. Sinon, renvoie un DataFrame vide avec les bonnes colonnes.

```python
from pathlib import Path

def load_expenses(filename: str = "expenses.csv") -> pd.DataFrame:
    path = Path(filename)
    if not path.exists():
        print(f"No existing data found — starting fresh.")
        return pd.DataFrame(columns=["date", "amount", "category", "description"])
    df = pd.read_csv(filename, parse_dates=["date"])
    print(f"Loaded {len(df)} expenses from {filename}")
    return df
```

**🎯 Résultat attendu :** Au premier lancement (pas encore de CSV) : `No existing data found — starting fresh.` Aux lancements suivants : `Loaded 4 expenses from expenses.csv`.

**🩹 Si ça ne marche pas :** Si tu obtiens une `ParserError` sur `pd.read_csv`, le CSV a des lignes malformées — ouvre-le dans un éditeur de texte pour vérifier les virgules errantes ou les guillemets cassés. Si les dates apparaissent comme des chaînes au lieu d'objets datetime, assure-toi d'avoir inclus `parse_dates=["date"]`. Si le fichier existe mais que `load_expenses` renvoie un DataFrame vide, le chemin de fichier est faux — exécute ton script depuis le même répertoire où tu as enregistré le CSV.

### 6.3 Vérifie la persistance

**✅ Liste de vérification**

- ✅ Après l'enregistrement, `expenses.csv` existe et contient la ligne d'en-tête plus les lignes de données.
- ✅ Après le chargement, le DataFrame a les mêmes données que celles enregistrées.
- ✅ L'absence du fichier CSV ne fait pas planter le programme — il repart proprement de zéro.
- ✅ Les dates sont analysées comme des objets datetime après le chargement, pas comme de simples chaînes.

---

## Étape 7 : Polir la CLI

Rassemble tout dans un système de menu interactif. L'utilisateur choisit des actions dans une liste numérotée, l'entrée est validée avant traitement, et l'expérience est soignée.

### 7.1 Construis la boucle de menu

**👟 Indice de départ :** Écris une fonction `main()` qui charge les données enregistrées au démarrage, puis boucle : imprime un menu, lit le choix de l'utilisateur, répartit vers la bonne fonction et enregistre après chaque modification. Utilise une boucle `while True` qui se casse sur l'option « quitter ».

```python
def show_menu() -> None:
    print("\n=== Expense Tracker ===")
    print("1. Add expense")
    print("2. View all expenses")
    print("3. Spending by category")
    print("4. Monthly summary")
    print("5. Budget status")
    print("6. Generate chart")
    print("7. Quit")

def view_expenses(df: pd.DataFrame) -> None:
    if df.empty:
        print("No expenses recorded yet.")
        return
    print(df.to_string(index=False))

def show_category_summary(df: pd.DataFrame) -> None:
    if df.empty:
        print("No expenses to summarize.")
        return
    totals = df.groupby("category")["amount"].sum().sort_values(ascending=False)
    print("\nSpending by category:")
    for cat, amt in totals.items():
        print(f"  {cat:15s} ${amt:>8.2f}")

def show_monthly_summary(df: pd.DataFrame) -> None:
    if df.empty:
        print("No expenses to summarize.")
        return
    monthly = df.groupby(df["date"].dt.to_period("M"))["amount"].sum()
    print("\nMonthly totals:")
    for period, amt in monthly.items():
        print(f"  {period}  ${amt:.2f}")
```

### 7.2 Câble la validation des entrées

**👟 Indice de départ :** Quand l'utilisateur ajoute une dépense, valide que le montant est un nombre positif et que la catégorie n'est pas vide. Redemande sur une mauvaise entrée au lieu de planter.

```python
def get_valid_amount() -> float:
    while True:
        try:
            amt = float(input("Amount: $"))
            if amt <= 0:
                print("  Amount must be positive.")
                continue
            return round(amt, 2)
        except ValueError:
            print("  Please enter a valid number.")

def get_valid_category() -> str:
    while True:
        cat = input("Category: ").strip().lower()
        if cat:
            return cat
        print("  Category cannot be empty.")
```

### 7.3 Assemble le `main()` complet

**👟 Indice de départ :** Charge les données dans un `df` global au démarrage. Après chaque action qui modifie les données, recalcule `df` et enregistre-le. Le menu boucle jusqu'à ce que l'utilisateur choisisse de quitter.

```python
def main() -> None:
    global expenses, df
    df = load_expenses()
    expenses = df.to_dict("records")

    while True:
        show_menu()
        choice = input("Choose (1-7): ").strip()

        if choice == "1":
            amt = get_valid_amount()
            cat = get_valid_category()
            desc = input("Description: ").strip()
            add_expense(amt, cat, desc)
            expenses = df.to_dict("records")
            expenses.append({
                "date": date.today().isoformat(),
                "amount": amt,
                "category": cat,
                "description": desc,
            })
            df = pd.DataFrame(expenses)
            df["date"] = pd.to_datetime(df["date"])
            save_expenses(df)
        elif choice == "2":
            view_expenses(df)
        elif choice == "3":
            show_category_summary(df)
        elif choice == "4":
            show_monthly_summary(df)
        elif choice == "5":
            print("\nBudget status:")
            check_budgets(
                df.groupby("category")["amount"].sum().to_dict(),
                budgets,
            )
        elif choice == "6":
            if df.empty:
                print("No data to chart yet.")
            else:
                category_totals = df.groupby("category")["amount"].sum()
                fig, axes = plt.subplots(1, 2, figsize=(12, 5))
                colors = ["#2ecc71", "#3498db", "#e74c3c", "#f39c12", "#9b59b6"]
                category_totals.plot(kind="bar", ax=axes[0], color=colors[:len(category_totals)])
                axes[0].set_title("Spending by Category")
                axes[0].set_ylabel("Amount ($)")
                axes[0].tick_params(axis="x", rotation=45)
                category_totals.plot(kind="pie", ax=axes[1], autopct="%1.1f%%", startangle=90)
                axes[1].set_title("Spending Distribution")
                axes[1].set_ylabel("")
                plt.tight_layout()
                plt.savefig("spending_report.png", dpi=150)
                plt.show()
                print("Chart saved to spending_report.png")
        elif choice == "7":
            print("Goodbye!")
            break
        else:
            print("Invalid choice — pick 1 through 7.")

if __name__ == "__main__":
    main()
```

**🎯 Résultat attendu :** Le programme imprime un menu numéroté, accepte ton choix, effectue l'action et revient au menu. Ajouter une dépense met immédiatement à jour le CSV. Une entrée invalide (des lettres là où un nombre est attendu, une catégorie vide) imprime une erreur et redemande.

**🩹 Si ça ne marche pas :** Si tu obtiens une `UnboundLocalError`, la déclaration `global df` manque ou `df` n'est pas initialisée avant la boucle de menu. Si l'enregistrement produit un CSV vide, assure-toi que `save_expenses(df)` est appelée *après* l'ajout à la liste et la reconstruction du DataFrame, pas avant.

### 7.4 Exécute le programme complet

**✅ Liste de vérification**

- ✅ Le menu s'imprime au démarrage et réapparaît après chaque action.
- ✅ Ajouter une dépense met à jour `expenses.csv` immédiatement.
- ✅ Les montants non numériques et les catégories vides sont rejetées avec un message clair.
- ✅ Quitter le programme et le relancer charge les dépenses de la session précédente.
- ✅ Les sept options du menu fonctionnent sans erreur.

---

## ⚠️ Pièges courants

- **Oublier d'enregistrer après les changements.** Si tu modifies `expenses` ou `df` mais n'appelles pas `save_expenses`, le CSV est périmé. Enregistre toujours juste après une opération qui change les données — pas seulement à la sortie du programme — pour qu'un plantage ou un Ctrl+C ne perde que l'action courante.
- **Confusion chaîne de date contre datetime.** Charger depuis le CSV sans `parse_dates=["date"]` donne des chaînes comme `"2026-09-06"` au lieu d'objets datetime. L'appel `.dt.to_period("M")` du résumé mensuel plantera avec une `TypeError` sur des chaînes.
- **Casse de catégorie incohérente.** Si `"Groceries"` et `"groceries"` apparaissent tous deux dans les données, `groupby` les traite comme des catégories séparées. Mets toujours la catégorie en minuscules dans `add_expense`, pas au site d'appel.
- **Diagramme en secteurs avec trop de catégories.** Avec 10+ catégories, le diagramme en secteurs devient illisible. Envisage de filtrer sur le top 5 et de regrouper le reste sous « other » pour le secteur, tout en gardant le diagramme en barres complet.
- **Écraser le CSV au chargement.** `load_expenses` doit *lire* le fichier, pas y écrire. Un glissement courant est d'importer la mauvaise fonction ou d'appeler `save` dans `load`.

## Ce que tu viens de construire

Un traqueur de dépenses en ligne de commande qui fonctionne : il journalise les dépenses, les analyse avec pandas, surveille les budgets avec des alertes à seuil, génère des graphiques avec matplotlib et persiste tout dans un fichier CSV. Tu as modélisé des données financières avec de simples dictionnaires Python, convertis en DataFrames pour l'analyse, construit des pipelines d'agrégation avec `groupby`, implémenté une logique d'alerte basée sur des seuils et créé des graphiques dignes de publication — toutes des compétences pratiques qui se transfèrent directement à un vrai travail d'analyse financière.

## Où aller ensuite

- **Projections de dépenses récurrentes.** Ajoute un champ `recurring` (hebdomadaire, mensuel, aucun) à chaque dépense et projette la dépense totale des 3 prochains mois à partir des entrées récurrentes.
- **Recommandations de catégories.** Quand un utilisateur tape une description, scanne les dépenses déjà journalisées et suggère la catégorie la plus courante pour des descriptions similaires avec une simple correspondance de chaînes.
- **Suiveur d'objectif d'épargne.** Ajoute un objectif d'épargne mensuel (par ex. 1 000 $). Après chaque dépense journalisée, imprime combien tu peux encore dépenser tout en atteignant l'objectif.
- **Importation de relevés bancaires.** Lis les exports CSV de ta banque et auto-catégorise les transactions à partir des schémas de descriptions.
- **GUI avec tkinter.** Enveloppe la même logique dans une GUI de bureau avec des champs de saisie, des boutons et un canevas de graphique intégré.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants — et son README contient un parcours complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓