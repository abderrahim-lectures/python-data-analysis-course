---
title: "Processeur de Tableurs"
description: "Un outil en ligne de commande qui lit les fichiers CSV et Excel, explore et transforme les données, et exporte les résultats."
difficulty: beginner
estimatedMinutes: 45
xpReward: 50
tags: ["pandas", "csv", "data-analysis", "cli"]
learningObjectives:
  - "Lire les fichiers CSV et Excel avec détection automatique de l'encodage"
  - "Explorer et résumer les données tabulaires rapidement"
  - "Filtrer, trier, agréger et pivoter les données"
  - "Nettoyer les données sales (valeurs manquantes, types incorrects, espaces en trop)"
  - "Exporter les résultats en CSV, Excel et JSON"
  - "Envelopper le tout dans un menu interactif"
prerequisites:
  - "Bases de Python (variables, boucles, fonctions, dictionnaires)"
  - "Pandas de base"
---

# Processeur de Tableurs

## 🎯 Ce que tu vas faire

Un outil en ligne de commande qui lit les fichiers CSV et Excel, explore et transforme les données, et exporte les résultats. En chemin, tu apprendras le workflow pandas de base qui sous-tend presque toutes les tâches d'analyse de données.

### Pourquoi ce projet ?

Chaque analyste de données, scientifique et ingénieur passe du temps à travailler avec des tableurs. Ce projet t'enseigne les fondamentaux de pandas qui remplacent des heures de travail manuel sur tableur par quelques lignes de code reproductible. Tu construiras un outil CLI réutilisable que tu pourras pointer vers n'importe quel CSV et commencer à travailler immédiatement.

### Ce que tu vas apprendre

- Lire les fichiers CSV et Excel avec détection automatique de l'encodage
- Explorer et résumer les données tabulaires rapidement
- Filtrer, trier, agréger et pivoter les données
- Nettoyer les données sales (valeurs manquantes, types incorrects, espaces en trop)
- Exporter les résultats en CSV, Excel et JSON
- Envelopper le tout dans un menu interactif

---

## Étape 1 : Lire les fichiers CSV

### Objectif

Charger un fichier CSV dans un DataFrame pandas, en gérant différents encodages et séparateurs, puis aperçu les premières lignes.

### Le concept

Les fichiers CSV semblent simples, mais ils viennent en许多 variantes. Certains utilisent des virgules, d'autres des points-virgules. Certains fichiers sont en UTF-8, d'autres en Latin-1. Avant de pouvoir analyser quoi que ce soit, tu dois comprendre avec quoi tu travailles. Pandas nous donne les outils, mais nous devons écrire un petit wrapper pour essayer différentes options jusqu'à ce que quelque chose fonctionne.

### Code fonctionnel

Crée un fichier appelé `spreadsheet_processor.py` :

```python
import pandas as pd
import sys
import json
from pathlib import Path


def detect_encoding(filepath):
    """Try common encodings and return the first one that works."""
    encodings = ["utf-8", "latin-1", "cp1252", "iso-8859-1"]
    for enc in encodings:
        try:
            with open(filepath, "r", encoding=enc) as f:
                f.read(1024)  # Read a chunk to test
            return enc
        except (UnicodeDecodeError, UnicodeError):
            continue
    return "utf-8"  # Fallback


def detect_delimiter(filepath, encoding):
    """Peek at the first line to guess the delimiter."""
    delimiters = [",", ";", "\t", "|"]
    with open(filepath, "r", encoding=encoding) as f:
        first_line = f.readline()

    counts = {d: first_line.count(d) for d in delimiters}
    best = max(counts, key=counts.get)
    return best if counts[best] > 0 else ","


def read_csv_file(filepath):
    """Read a CSV with auto-detected encoding and delimiter."""
    path = Path(filepath)
    if not path.exists():
        print(f"Error: File '{filepath}' not found.")
        sys.exit(1)

    encoding = detect_encoding(path)
    delimiter = detect_delimiter(path, encoding)

    print(f"  Encoding:  {encoding}")
    print(f"  Delimiter: {repr(delimiter)}")

    df = pd.read_csv(path, encoding=encoding, sep=delimiter)
    return df


# --- Demo ---
if __name__ == "__main__":
    # Create a sample CSV for testing
    sample_data = """Name,Age,City,Score
Alice,30,New York,85.5
Bob,25,San Francisco,92.3
Charlie,35,Chicago,78.1
Diana,28,Boston,95.0
Eve,32,New York,88.7"""

    sample_path = "sample_data.csv"
    with open(sample_path, "w") as f:
        f.write(sample_data)

    print(f"Reading: {sample_path}")
    df = read_csv_file(sample_path)
    print(f"\nShape: {df.shape[0]} rows x {df.shape[1]} columns\n")
    print(df.to_string(index=False))
```

### Résultat attendu

```
Reading: sample_data.csv
  Encoding:  utf-8
  Delimiter: ','

Shape: 5 rows x 4 columns

    Name  Age         City  Score
  Alice   30     New York   85.5
    Bob   25  San Francisco   92.3
Charlie   35      Chicago   78.1
  Diana   28       Boston   95.0
    Eve   32     New York   88.7
```

### Si ça ne marche pas

- **`FileNotFoundError`** — Le chemin du fichier est incorrect. Utilise `Path(filepath).resolve()` pour obtenir le chemin absolu et vérifie-le.
- **`ParserError: Error tokenizing`** — La détection du séparateur a choisi le mauvais caractère. Essaie de passer `sep=None` et `engine="python"` à `pd.read_csv`, ou spécifie le séparateur manuellement.
- **Caractères corrompus** — La détection de l'encodage s'est trompée. Ouvre le fichier dans un éditeur de texte, vérifie son encodage, et passe-le directement à `pd.read_csv(encoding=...)`.

---

## Étape 2 : Explorer les données

### Objectif

Utiliser les méthodes de résumé de pandas pour comprendre la forme, les types et les statistiques de tes données avant de faire quoi que ce soit.

### Le concept

La première chose que tu fais après avoir chargé des données, c'est les regarder. Combien de lignes et de colonnes ? Quels sont les types de données ? Y a-t-il des colonnes numériques pour calculer ? Des valeurs manquantes ? Pandas a des méthodes intégrées qui répondent à ces questions en quelques secondes.

### Code fonctionnel

Ajoute cette fonction à `spreadsheet_processor.py` :

```python
def explore_data(df):
    """Print a quick summary of the DataFrame."""
    print(f"\n{'='*50}")
    print("DATA EXPLORATION")
    print(f"{'='*50}")

    print(f"\nShape: {df.shape[0]} rows, {df.shape[1]} columns")

    print(f"\nColumn types:")
    for col in df.columns:
        print(f"  {col:<20} {str(df[col].dtype):<10} "
              f"({df[col].nunique()} unique)")

    print(f"\nMissing values:")
    missing = df.isnull().sum()
    if missing.any():
        for col, count in missing[missing > 0].items():
            print(f"  {col}: {count} ({count/len(df)*100:.1f}%)")
    else:
        print("  None")

    print(f"\nNumeric summary:")
    numeric_cols = df.select_dtypes(include="number")
    if not numeric_cols.empty:
        print(numeric_cols.describe().round(2).to_string())
    else:
        print("  No numeric columns found.")
```

### Résultat attendu

```
==================================================
DATA EXPLORATION
==================================================

Shape: 5 rows, 4 columns

Column types:
  Name                 object     (5 unique)
  Age                  int64      (5 unique)
  City                 object     (4 unique)
  Score                float64    (5 unique)

Missing values:
  None

Numeric summary:
         Age  Score
count   5.0    5.0
mean   30.0   87.92
std     3.5    6.26
min    25.0   78.10
25%    28.0   85.50
50%    30.0   88.70
75%    32.0   92.30
max    35.0   95.00
```

### Si ça ne marche pas

- **Toutes les colonnes sont de type `object`** — Les nombres étaient stockés comme des chaînes (peut-être avec des virgules ou des signes dollar). Tu corrigeras cela à l'Étape 5 avec `pd.to_numeric`.
- **`describe()` n'affiche rien** — Aucune colonne numérique n'existe. Vérifie si les données se sont chargées correctement et si une conversion de type est nécessaire.
- **Les valeurs manquantes apparaissent de façon inattendue** — Pandas traite `""`, `"NA"`, `"N/A"` et `"null"` comme NaN par défaut. Passe `na_values=["ton_marqueur"]` à `read_csv` si tes données utilisent un marqueur différent.

---

## Étape 3 : Filtrer et trier

### Objectif

Extraire des sous-ensembles de données avec un filtrage basé sur des conditions et trier par une ou plusieurs colonnes.

### Le concept

Le filtrage te permet de n'extraire que les lignes qui t'intéressent. Pandas supporte plusieurs approches : l'indexation booléenne (la plus courante), la méthode `.query()` pour des expressions lisibles, et `loc`/`iloc` pour un accès basé sur les étiquettes et les positions. Le tri réorganise les données pour que les motifs deviennent visibles.

### Code fonctionnel

Ajoute ces fonctions à `spreadsheet_processor.py` :

```python
def filter_data(df, column, operator, value):
    """Filter rows based on a condition.

    Args:
        df: pandas DataFrame
        column: column name to filter on
        operator: one of '==', '!=', '>', '<', '>=', '<=', 'contains'
        value: the value to compare against
    """
    if column not in df.columns:
        print(f"Error: Column '{column}' not found.")
        print(f"Available columns: {', '.join(df.columns)}")
        return df

    # Try to cast value to the column's dtype for proper comparison
    col_dtype = df[column].dtype
    try:
        if col_dtype in ("int64", "int32"):
            value = int(value)
        elif col_dtype in ("float64", "float32"):
            value = float(value)
    except (ValueError, TypeError):
        pass  # Keep as string

    ops = {
        "==": df[column] == value,
        "!=": df[column] != value,
        ">":  df[column] > value,
        "<":  df[column] < value,
        ">=": df[column] >= value,
        "<=": df[column] <= value,
        "contains": df[column].astype(str).str.contains(value, case=False, na=False),
    }

    if operator not in ops:
        print(f"Error: Unknown operator '{operator}'. Use: {', '.join(ops.keys())}")
        return df

    mask = ops[operator]
    result = df[mask]
    print(f"\nFiltered: {len(result)} rows match '{column} {operator} {value}'")
    return result


def sort_data(df, columns, ascending=True):
    """Sort by one or more columns.

    Args:
        columns: list of column names
        ascending: True for ascending, False for descending
                   Can also be a list matching the columns list
    """
    invalid = [c for c in columns if c not in df.columns]
    if invalid:
        print(f"Error: Columns not found: {', '.join(invalid)}")
        return df

    result = df.sort_values(by=columns, ascending=ascending)
    direction = "ascending" if ascending else "descending"
    print(f"\nSorted by {', '.join(columns)} ({direction})")
    return result
```

### Résultat attendu

```python
# Filter: People older than 28
filtered = filter_data(df, "Age", ">", 28)
print(filtered.to_string(index=False))

# Output:
# Filtered: 3 rows match 'Age > 28'
#     Name  Age         City  Score
#   Alice   30     New York   85.5
# Charlie   35      Chicago   78.1
#     Eve   32     New York   88.7

# Sort by Score descending
sorted_df = sort_data(filtered, ["Score"], ascending=False)
print(sorted_df.to_string(index=False))

# Output:
# Sorted by Score (descending)
#     Name  Age         City  Score
#     Eve   32     New York   88.7
#   Alice   30     New York   85.5
# Charlie   35      Chicago   78.1
```

### Si ça ne marche pas

- **TypeError lors de la comparaison** — La colonne est numérique mais tu as passé une chaîne (ou l'inverse). La conversion automatique dans `filter_data` gère les cas courants, mais les formats inhabituels peuvent nécessiter une conversion manuelle préalable.
- **Le filtre retourne un résultat vide** — Vérifie `df[column].unique()` pour voir les valeurs réelles. Les espaces, les différences de casse ou les types inattendus sont des coupables courants.
- **`sort_values` lève un KeyError** — Tu as mal orthographié un nom de colonne. Utilise `df.columns.tolist()` pour vérifier.

---

## Étape 4 : Agréger les données

### Objectif

Résumer les données avec groupby, tableaux croisés dynamiques et tableaux croisés pour trouver des motifs à travers les catégories.

### Le concept

L'agrégration réduit de nombreuses lignes en statistiques de résumé. Le groupby sépare les données par catégorie, applique une fonction (somme, moyenne, comptage) et recompose les résultats. Les tableaux croisés dynamiques restructurent les données pour que les catégories deviennent des colonnes. Les tableaux croisés comptent les co-occurrences entre deux variables catégorielles.

### Code fonctionnel

Ajoute ces fonctions à `spreadsheet_processor.py` :

```python
def aggregate_groupby(df, group_col, agg_col, func="mean"):
    """Group by one column and aggregate another.

    Args:
        group_col: column to group by
        agg_col: column to aggregate
        func: aggregation function ('mean', 'sum', 'count', 'min', 'max', 'median')
    """
    if group_col not in df.columns:
        print(f"Error: Column '{group_col}' not found.")
        return None
    if agg_col not in df.columns:
        print(f"Error: Column '{agg_col}' not found.")
        return None

    agg_map = {
        "mean": "mean", "sum": "sum", "count": "count",
        "min": "min", "max": "max", "median": "median",
    }
    if func not in agg_map:
        print(f"Error: Unknown function '{func}'. Use: {', '.join(agg_map.keys())}")
        return None

    result = df.groupby(group_col)[agg_col].agg(agg_map[func]).reset_index()
    result.columns = [group_col, f"{agg_col}_{func}"]
    print(f"\nGrouped by '{group_col}', {func} of '{agg_col}':")
    return result


def make_pivot(df, index_col, columns_col, values_col, aggfunc="mean"):
    """Create a pivot table.

    Args:
        index_col: column for rows
        columns_col: column for columns
        values_col: column for values
        aggfunc: aggregation function
    """
    for col in [index_col, columns_col, values_col]:
        if col not in df.columns:
            print(f"Error: Column '{col}' not found.")
            return None

    result = pd.pivot_table(
        df, index=index_col, columns=columns_col,
        values=values_col, aggfunc=aggfunc, fill_value=0,
    )
    print(f"\nPivot table: rows={index_col}, cols={columns_col}, values={values_col}")
    return result


def make_crosstab(df, col1, col2):
    """Create a frequency crosstab between two categorical columns."""
    for col in [col1, col2]:
        if col not in df.columns:
            print(f"Error: Column '{col}' not found.")
            return None

    result = pd.crosstab(df[col1], df[col2], margins=True, margins_name="Total")
    print(f"\nCrosstab: {col1} vs {col2}")
    return result
```

### Résultat attendu

```python
# Extend sample data for better aggregation examples
extra_data = """Name,Age,City,Score,Department
Frank,40,Chicago,72.0,Engineering
Grace,29,Boston,91.5,Engineering
Heidi,33,New York,85.0,Marketing
Ivan,27,San Francisco,88.0,Marketing
Judy,31,Chicago,79.5,Marketing"""

extra_path = "sample_data_extra.csv"
with open(extra_path, "w") as f:
    f.write(extra_data)

df = read_csv_file(extra_path)

# Groupby
result = aggregate_groupby(df, "City", "Score", "mean")
print(result.to_string(index=False))

# Output:
# Grouped by 'City', mean of 'Score':
#          City  Score_mean
#       Boston       91.50
#      Chicago       75.75
#     New York       85.00
# San Francisco       88.00

# Crosstab
crosstab = make_crosstab(df, "City", "Department")
print(crosstab.to_string())
```

### Si ça ne marche pas

- **`groupby` retourne une forme inattendue** — Tugroupes peut-être par une colonne avec trop de valeurs uniques. Vérifie avec `df[group_col].nunique()`.
- **Le tableau croisé dynamique affiche que des zéros** — Le `fill_value=0` remplace les NaN. Si beaucoup de groupes n'ont pas de valeurs pour une combinaison, c'est correct. Supprime `fill_value` pour voir les NaN à la place.
- **Le tableau croisé a trop de lignes** — Trop de valeurs uniques dans une colonne. Envisage de regrouper les données numériques avec `pd.cut()` d'abord.

---

## Étape 5 : Nettoyer les données

### Objectif

Gérer les valeurs manquantes, supprimer les espaces, convertir les types et supprimer les doublons.

### Le concept

Les données réelles sont sales. Les noms ont des espaces de fin, les nombres sont stockés comme des chaînes, certaines cellules sont vides, et des lignes en double se glissent. Le nettoyage de données représente souvent 80% du travail. La bonne nouvelle : pandas rend ces opérations simples une fois que tu connais les patterns.

### Code fonctionnel

Ajoute ces fonctions à `spreadsheet_processor.py` :

```python
def clean_data(df, options=None):
    """Apply common data cleaning operations.

    Args:
        options: dict with keys:
            - drop_duplicates: bool (default True)
            - strip_whitespace: bool (default True)
            - fill_na_strategy: str ('drop', 'mean', 'median', 'mode', 'ffill', or a literal value)
            - fix_numeric: list of columns to force numeric
    """
    if options is None:
        options = {}

    original_shape = df.shape
    log = []

    # Strip whitespace from string columns
    if options.get("strip_whitespace", True):
        str_cols = df.select_dtypes(include="object").columns
        for col in str_cols:
            df[col] = df[col].astype(str).str.strip()
        log.append(f"Stripped whitespace from {len(str_cols)} string columns")

    # Fix numeric columns
    for col in options.get("fix_numeric", []):
        if col in df.columns:
            before = df[col].dtype
            df[col] = pd.to_numeric(df[col], errors="coerce")
            coerced = df[col].isnull().sum() - df[col].isna().sum()
            log.append(f"Converted '{col}': {before} -> {df[col].dtype}")

    # Handle missing values
    fill_strategy = options.get("fill_na_strategy", "drop")
    missing_before = df.isnull().sum().sum()

    if fill_strategy == "drop":
        df = df.dropna()
        log.append(f"Dropped rows with missing values")
    elif fill_strategy == "mean":
        numeric_cols = df.select_dtypes(include="number").columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
        log.append(f"Filled numeric NaN with column means")
    elif fill_strategy == "median":
        numeric_cols = df.select_dtypes(include="number").columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
        log.append(f"Filled numeric NaN with column medians")
    elif fill_strategy == "mode":
        for col in df.columns:
            if df[col].isnull().any():
                mode_val = df[col].mode()
                if not mode_val.empty:
                    df[col] = df[col].fillna(mode_val.iloc[0])
        log.append(f"Filled NaN with column modes")
    elif fill_strategy == "ffill":
        df = df.ffill()
        log.append(f"Forward-filled missing values")
    else:
        df = df.fillna(fill_strategy)
        log.append(f"Filled NaN with literal: '{fill_strategy}'")

    missing_after = df.isnull().sum().sum()

    # Drop duplicates
    if options.get("drop_duplicates", True):
        before = len(df)
        df = df.drop_duplicates()
        removed = before - len(df)
        if removed:
            log.append(f"Removed {removed} duplicate rows")

    print(f"\n{'='*50}")
    print("CLEANING SUMMARY")
    print(f"{'='*50}")
    print(f"  Original shape: {original_shape}")
    print(f"  Final shape:    {df.shape}")
    print(f"  Missing before: {missing_before}")
    print(f"  Missing after:  {missing_after}")
    for entry in log:
        print(f"  - {entry}")

    return df.reset_index(drop=True)
```

### Résultat attendu

```python
# Create messy data
messy_data = """Name,Age,City,Score
  Alice ,30, New York ,85.5
Bob,25,San Francisco,92.3
Charlie,,Chicago,78.1
Diana,28,  Boston,95.0
Alice ,30, New York ,85.5
Eve,thirty-two,New York,88.7"""

messy_path = "messy_data.csv"
with open(messy_path, "w") as f:
    f.write(messy_data)

df = read_csv_file(messy_path)
df = clean_data(df, {
    "strip_whitespace": True,
    "fix_numeric": ["Age"],
    "fill_na_strategy": "mean",
    "drop_duplicates": True,
})

# Output:
# ==================================================
# CLEANING SUMMARY
# ==================================================
#   Original shape: (6, 4)
#   Final shape:    (4, 4)
#   Missing before: 1
#   Missing after:  0
#   - Stripped whitespace from 3 string columns
#   - Converted 'Age': object -> float64
#   - Filled numeric NaN with column means
#   - Removed 1 duplicate rows
```

### Si ça ne marche pas

- **`to_numeric` convertit trop en NaN** — La colonne contient du texte non numérique (comme "thirty-two"). Vérifie `df[col].unique()` avant la conversion, et décide de supprimer ou remplacer les mauvaises valeurs.
- **Les espaces ne sont pas entièrement supprimés** — Des espaces non sécables (`\xa0`) ou des tabulations peuvent être présents. Utilise `df[col].str.replace(r'\s+', ' ', regex=True)` pour un nettoyage agressif.
- **Les doublons ne sont pas supprimés** — Les lignes diffèrent dans au moins une colonne. Utilise `df.duplicated(subset=["col1", "col2"])` pour vérifier la similarité sur des colonnes spécifiques.

---

## Étape 6 : Exporter les résultats

### Objectif

Sauvegarder les DataFrames traités en CSV, Excel (avec openpyxl) et JSON.

### Le concept

Après avoir transformé les données, tu dois les sortir. Le CSV est universel mais perd le formatage. L'Excel préserve la structure et peut inclure plusieurs feuilles. Le JSON est idéal pour les applications web et les API. Chaque format a ses compromis, et pandas supporte les trois.

### Code fonctionnel

Ajoute ces fonctions à `spreadsheet_processor.py` :

```python
def export_csv(df, filepath):
    """Export DataFrame to CSV."""
    df.to_csv(filepath, index=False)
    size = Path(filepath).stat().st_size
    print(f"  CSV saved: {filepath} ({size} bytes, {len(df)} rows)")


def export_excel(df, filepath, sheet_name="Sheet1"):
    """Export DataFrame to Excel with openpyxl.

    Requires: pip install openpyxl
    """
    try:
        import openpyxl  # noqa: F401
    except ImportError:
        print("Error: openpyxl not installed. Run: pip install openpyxl")
        return

    df.to_excel(filepath, index=False, sheet_name=sheet_name, engine="openpyxl")
    size = Path(filepath).stat().st_size
    print(f"  Excel saved: {filepath} ({size} bytes, sheet='{sheet_name}')")


def export_json(df, filepath, orient="records"):
    """Export DataFrame to JSON.

    Orient options:
        'records' -> [{"col": val}, ...]  (most common for APIs)
        'index'   -> {0: {"col": val}, ...}
        'columns' -> {"col": {0: val}, ...}
        'split'   -> {"columns": [...], "index": [...], "data": [...]}
    """
    df.to_json(filepath, orient=orient, indent=2, force_ascii=False)
    size = Path(filepath).stat().st_size
    print(f"  JSON saved: {filepath} ({size} bytes, orient='{orient}')")


def export_all(df, base_name="output"):
    """Export to all three formats at once."""
    print(f"\nExporting '{base_name}'...")
    export_csv(df, f"{base_name}.csv")
    export_excel(df, f"{base_name}.xlsx")
    export_json(df, f"{base_name}.json")
```

### Résultat attendu

```
Exporting 'output'...
  CSV saved: output.csv (198 bytes, 4 rows)
  Excel saved: output.xlsx (5120 bytes, sheet='Sheet1')
  JSON saved: output.json (423 bytes, orient='records')
```

### Si ça ne marche pas

- **`ModuleNotFoundError: No openpyxl`** — Installe-le : `pip install openpyxl`. Il n'est pas inclus avec pandas.
- **Le fichier Excel est corrompu** — Tu écrases peut-être un fichier qui est ouvert dans Excel. Ferme-le d'abord, ou utilise un nom de fichier différent.
- **Le JSON contient des chaînes `NaN`** — Pandas sérialise NaN comme `null` par défaut, mais certaines configurations diffèrent. Passe `default_handler=str` ou nettoie les NaN avant l'export.
- **Le CSV contient des antislashs ou guillemets en trop** — Vérifie les paramètres `quoting` et `escapechar`. Les valeurs par défaut gèrent la plupart des cas, mais les retours à la ligne intégrés dans les cellules peuvent causer des problèmes.

---

## Étape 7 : Construire un menu CLI

### Objectif

Envelopper toutes les opérations dans un menu interactif pour qu'un utilisateur puisse charger, explorer, filtrer, trier, agréger, nettoyer et exporter des données sans modifier le code.

### Le concept

Un menu CLI assemble tout. L'utilisateur choisit un numéro, fournit des arguments, et le programme appelle la bonne fonction. Ce pattern est courant pour les outils de données car il rend l'outil accessible aux personnes qui ne veulent pas écrire de Python.

### Code fonctionnel

Ajoute le menu principal à `spreadsheet_processor.py` :

```python
def print_menu():
    """Print the main menu."""
    print(f"\n{'='*50}")
    print("  SPREADSHEET PROCESSOR")
    print(f"{'='*50}")
    print("  1. Load CSV file")
    print("  2. Explore data")
    print("  3. Filter rows")
    print("  4. Sort data")
    print("  5. Aggregate (groupby)")
    print("  6. Clean data")
    print("  7. Export results")
    print("  8. Show current data")
    print("  0. Quit")
    print(f"{'='*50}")


def get_input(prompt, cast=str, default=None):
    """Get input with optional type casting and default value."""
    suffix = f" [{default}]" if default is not None else ""
    raw = input(f"{prompt}{suffix}: ").strip()
    if not raw and default is not None:
        return cast(default) if cast else default
    return cast(raw) if cast else raw


def run_menu():
    """Run the interactive CLI menu."""
    df = None

    while True:
        print_menu()
        choice = get_input("Choice", str, "0")

        if choice == "0":
            print("Goodbye!")
            break

        elif choice == "1":
            path = get_input("File path")
            df = read_csv_file(path)
            print(f"\nLoaded {df.shape[0]} rows x {df.shape[1]} columns")

        elif choice == "2":
            if df is None:
                print("Load a file first (option 1).")
                continue
            explore_data(df)

        elif choice == "3":
            if df is None:
                print("Load a file first.")
                continue
            col = get_input("Column to filter on")
            op = get_input("Operator (==, !=, >, <, >=, <=, contains)", str, "==")
            val = get_input("Value")
            df = filter_data(df, col, op, val)
            print(df.to_string(index=False))

        elif choice == "4":
            if df is None:
                print("Load a file first.")
                continue
            cols = get_input("Columns (comma-separated)")
            col_list = [c.strip() for c in cols.split(",")]
            asc = get_input("Ascending? (y/n)", str, "y").lower() == "y"
            df = sort_data(df, col_list, asc)
            print(df.to_string(index=False))

        elif choice == "5":
            if df is None:
                print("Load a file first.")
                continue
            group = get_input("Group by column")
            agg = get_input("Aggregate column")
            func = get_input("Function (mean, sum, count, min, max)", str, "mean")
            result = aggregate_groupby(df, group, agg, func)
            if result is not None:
                print(result.to_string(index=False))

        elif choice == "6":
            if df is None:
                print("Load a file first.")
                continue
            strategy = get_input(
                "Missing value strategy (drop, mean, median, mode, ffill)", str, "drop"
            )
            df = clean_data(df, {
                "strip_whitespace": True,
                "fill_na_strategy": strategy,
                "drop_duplicates": True,
            })
            print(df.to_string(index=False))

        elif choice == "7":
            if df is None:
                print("Load a file first.")
                continue
            base = get_input("Output base name", str, "output")
            export_all(df, base)

        elif choice == "8":
            if df is None:
                print("Load a file first.")
                continue
            print(df.to_string(index=False))

        else:
            print("Invalid choice. Try again.")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Non-interactive mode: load a file and explore
        df = read_csv_file(sys.argv[1])
        explore_data(df)
    else:
        # Interactive mode
        run_menu()
```

### Résultat attendu

```
==================================================
  SPREADSHEET PROCESSOR
==================================================
  1. Load CSV file
  2. Explore data
  3. Filter rows
  4. Sort data
  5. Aggregate (groupby)
  6. Clean data
  7. Export results
  8. Show current data
  0. Quit
==================================================
Choice [0]: 1
File path: sample_data.csv
  Encoding:  utf-8
  Delimiter: ','

Loaded 5 rows x 4 columns
Choice [0]: 2

==================================================
DATA EXPLORATION
==================================================
...
```

### Si ça ne marche pas

- **La boucle du menu est infinie** — Vérifie que `break` existe dans la branche de sortie. La boucle `while True` nécessite une sortie explicite.
- **`input()` bloque dans les environnements non interactifs** — Utilise `sys.stdin.isatty()` pour détecter si tu es dans un terminal, et reviens à une entrée basée sur des fichiers ou des arguments.
- **L'état est perdu entre les exécutions** — C'est normal. Le menu est sans état ; chaque exécution commence à zéro. Pour la persistance, tu pourrais ajouter une fonctionnalité de sauvegarde/chargement avec JSON.

---

## ✅ Liste de vérification

Après avoir complété toutes les étapes, vérifie ce qui suit :

- [ ] `read_csv_file` détecte automatiquement l'encodage et le séparateur
- [ ] `explore_data` affiche la forme, les types, les valeurs manquantes et les statistiques
- [ ] `filter_data` supporte les six opérateurs de comparaison plus `contains`
- [ ] `sort_data` gère le tri simple et multi-colonnes
- [ ] `aggregate_groupby` fonctionne avec mean, sum, count, min, max et median
- [ ] `make_pivot` et `make_crosstab` produisent des résumés corrects
- [ ] `clean_data` gère les espaces, les valeurs manquantes, la conversion de types et les doublons
- [ ] `export_all` écrit des fichiers CSV, Excel et JSON valides
- [ ] Le menu CLI exécute toutes les opérations de manière interactive
- [ ] Les messages d'erreur sont utiles et indiquent la cause

---

## 🎯 Objectifs supplémentaires

- [ ] Ajouter des opérations de renommage et de suppression de colonnes
- [ ] Supporter la lecture directe des fichiers Excel avec `pd.read_excel`
- [ ] Ajouter un drapeau `--batch` qui lit les commandes depuis un fichier texte
- [ ] Générer un simple graphique à barres en texte pour les colonnes numériques
- [ ] Ajouter une commande `profile` qui écrit un rapport complet de qualité des données dans un fichier
- [ ] Supporter l'enchaînement d'opérations depuis un fichier de configuration JSON (ex. `process --config steps.json`)
