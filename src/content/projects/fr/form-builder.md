---
title: "Constructeur de Formulaires"
description: "Construire des formulaires web avec drag-and-drop, regles de validation et gestion des soumissions."
difficulty: "intermediate"
estimatedMinutes: 50
tags: ["cli", "data-validation", "developer-tools"]
learningObjectives:
  - "Modéliser les champs de formulaire comme des dataclasses Python avec des règles de validation sûres au niveau du typage"
  - "Générer des schémas JSON depuis les définitions de formulaire pour un rendu dans n'importe quel frontend"
  - "Implémenter une logique conditionnelle qui affiche ou masque les champs selon l'entrée utilisateur"
  - "Gérer les soumissions de formulaire avec validation et sortie structurée"
prerequisites: ["Python 101"]
---

# 📝 Construis un Constructeur de Formulaires

Chaque formulaire web est fondamentalement la même chose : une liste de champs, chacun avec un type, un libellé, des règles de validation et éventuellement une condition qui détermine quand il apparaît. Ce projet construit un constructeur de formulaires Python qui prend une définition de formulaire déclarative et produit un schéma JSON — le même format utilisé par React JSON Schema Form, JSON Editor et des dizaines d'autres bibliothèques de rendu. Tu définis le formulaire une fois en Python, et n'importe quel frontend peut le rendre.

Ceci suppose Python 101 — rien de Data Analysis n'est requis. Optionnel et non noté ; voir [Real-World Projects](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Configurer un projet avec `uv` et installer les dépendances dont tu auras besoin.
2. Modéliser les champs de formulaire comme des dataclasses Python avec des types, des libellés et des règles de validation.
3. Générer un schéma JSON depuis les définitions de formulaire que n'importe quelle bibliothèque de rendu peut consommer.
4. Ajouter une logique conditionnelle pour que les champs apparaissent ou se masquent selon les valeurs d'autres champs.
5. Valider les soumissions utilisateur contre les règles du formulaire et rapporter les erreurs clairement.
6. Construire une CLI qui définit, rend et valide des formulaires depuis la ligne de commande.

## Où exécuter ceci

**Localement avec `uv`** est la voie principale — c'est un outil CLI qui lit les définitions de formulaire et écrit les fichiers de schéma JSON.

**Google Colab, Kaggle Notebooks et Binder** fonctionnent pour essayer l'outil. Le notebook installe les mêmes packages et utilise le même code ; il génère et valide des formulaires d'exemple dans la session.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/form-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/form-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fform-builder%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant de construire : un environnement Python, un framework CLI et un répertoire de projet.

### Installer `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Ferme et rouvre ton terminal, puis confirme :

```bash
uv --version
```

### Initialiser le projet

```bash
uv init form-builder
cd form-builder
uv add click pydantic
```

`click` construit la CLI et `pydantic` fournit la validation avec des messages d'erreur clairs. Le projet garde les champs, la génération de schéma, la validation et la CLI dans des fichiers séparés.

### Créer la structure du projet

```bash
mkdir -p forms
touch forms/__init__.py forms/fields.py forms/schema.py forms/validate.py forms/cli.py
```

**✅ Liste de vérification**

- ✅ `uv --version` imprime un numéro de version.
- ✅ `form-builder/` existe avec un `pyproject.toml`, et `click` et `pydantic` sont installés.
- ✅ Le répertoire `forms/` a tous les fichiers de modules requis.

## Étape 1 : Modéliser les champs de formulaire comme des dataclasses

Un champ de formulaire a un type (texte, nombre, email, select, checkbox), un libellé, un nom (la clé JSON), des règles de validation optionnelles et une condition de visibilité optionnelle. Le modéliser comme un modèle Pydantic te donne la vérification de type, les valeurs par défaut et la sérialisation gratuitement.

### 1.1 Définir les types de champs

**👟 Indice de départ :** Crée `forms/fields.py` avec un modèle de base `Field` et des sous-classes spécifiques au type.

```python
# forms/fields.py
from pydantic import BaseModel, field_validator
from typing import Optional

class ValidationRule(BaseModel):
    required: bool = False
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    pattern: Optional[str] = None
    custom_message: Optional[str] = None

class Condition(BaseModel):
    field: str  # name of the field to watch
    operator: str  # "equals", "not_equals", "contains"
    value: str  # value to compare against

class Field(BaseModel):
    name: str
    label: str
    field_type: str  # "text", "number", "email", "select", "checkbox"
    default: Optional[str] = None
    options: Optional[list[str]] = None  # for select fields
    validation: ValidationRule = ValidationRule()
    condition: Optional[Condition] = None

    @field_validator("field_type")
    @classmethod
    def check_type(cls, v):
        valid = {"text", "number", "email", "select", "checkbox"}
        if v not in valid:
            raise ValueError(f"field_type must be one of {valid}, got '{v}'")
        return v
```

Le modèle `Condition` est ce qui pilote la visibilité conditionnelle : il référence un autre champ par nom, un opérateur et une valeur de comparaison. Un champ avec `condition={"field": "has_company", "operator": "equals", "value": "true"}` n'apparaît que quand `has_company` est `true`. C'est le même modèle que celui utilisé dans des outils comme Typeform et Google Forms.

**🎯 Résultat attendu :** `Field(name="email", label="Email", field_type="email")` crée un champ valide. `Field(name="bad", label="Bad", field_type="slider")` lève une `ValidationError`.

**🩹 Si ça ne marche pas :** Si le validateur `field_type` ne se déclenche pas, le décorateur `@field_validator` manque peut-être `@classmethod`. Si les champs optionnels comme `options` causent des erreurs quand ils sont `None`, vérifie que l'annotation de type utilise `Optional[list[str]]`.

### 1.2 Vérifier la création des champs

```python
# Quick test
from forms.fields import Field, ValidationRule

f = Field(
    name="username",
    label="Username",
    field_type="text",
    validation=ValidationRule(required=True, min_length=3, max_length=50),
)
assert f.name == "username"
assert f.validation.min_length == 3
print(f.model_dump())
```

**🎯 Résultat attendu :** L'assertion réussit ; `model_dump()` montre tous les champs y compris les règles de validation imbriquées.

**🩹 Si ça ne marche pas :** Si `model_dump()` manque le sous-dictionnaire de validation, vérifie que `ValidationRule` est une sous-classe de `BaseModel`, pas un dict simple.

### 1.3 Vérifier le modèle de champ

**✅ Liste de vérification**

- ✅ Un champ valide se crée avec succès avec tous les champs accessibles.
- ✅ Un `field_type` invalide (comme `"slider"`) lève une `ValidationError` claire.
- ✅ Les règles de validation prennent par défaut un `ValidationRule()` raisonnable avec tous les champs optionnels.

**🤔 Question(s) socratique(s)**

- Pourquoi modéliser `Condition` séparément au lieu de mettre simplement `condition_field`, `condition_operator` et `condition_value` directement sur `Field` ? Que se passe-t-il quand tu as besoin de deux conditions sur un seul champ ?
- Le champ `options` n'a de sens que pour les types `select` mais est disponible sur tous les champs. Est-ce un défaut de conception, ou un compromis délibéré pour la simplicité ?

## Étape 2 : Générer le schéma JSON depuis les définitions de formulaire

JSON Schema est un moyen standard de décrire des formes de données — c'est ce que les bibliothèques de formulaires frontend utilisent pour savoir quels champs rendre et quelle validation appliquer. Convertir ta définition de formulaire Python en JSON Schema la rend interopérable avec n'importe quelle bibliothèque de rendu.

### 2.1 Écrire le générateur de schéma

**👟 Indice de départ :** Crée `forms/schema.py` avec une fonction qui convertit une liste d'objets `Field` en un dictionnaire JSON Schema.

```python
# forms/schema.py
from forms.fields import Field

TYPE_MAP = {
    "text": {"type": "string"},
    "number": {"type": "number"},
    "email": {"type": "string", "format": "email"},
    "select": {"type": "string"},
    "checkbox": {"type": "boolean"},
}

def field_to_schema(field: Field) -> dict:
    """Convert a single Field to a JSON Schema property."""
    schema = dict(TYPE_MAP[field.field_type])
    schema["title"] = field.label

    if field.default is not None:
        schema["default"] = field.default

    if field.field_type == "select" and field.options:
        schema["enum"] = field.options

    v = field.validation
    if v.min_length is not None:
        schema["minLength"] = v.min_length
    if v.max_length is not None:
        schema["maxLength"] = v.max_length
    if v.min_value is not None:
        schema["minimum"] = v.min_value
    if v.max_value is not None:
        schema["maximum"] = v.max_value

    return schema

def form_to_schema(form_name: str, fields: list[Field]) -> dict:
    """Convert a form definition to a complete JSON Schema."""
    required = [f.name for f in fields if f.validation.required]
    properties = {f.name: field_to_schema(f) for f in fields}

    schema = {
        "title": form_name,
        "type": "object",
        "properties": properties,
    }
    if required:
        schema["required"] = required

    # Attach conditional visibility as x-conditions custom keyword
    conditions = {}
    for f in fields:
        if f.condition:
            conditions[f.name] = f.condition.model_dump()
    if conditions:
        schema["x-conditions"] = conditions

    return schema
```

Le `TYPE_MAP` traduit tes types Python en types JSON Schema. La clé `x-conditions` utilise une extension personnalisée (préfixée par `x-`) pour attacher la logique conditionnelle — JSON Schema lui-même ne définit pas la visibilité conditionnelle, mais les bibliothèques de rendu de formulaires comme React JSON Schema Form supportent les extensions `x-`. La liste `required` est construite automatiquement depuis les champs où `validation.required` est `True`.

**🎯 Résultat attendu :** `form_to_schema("Contact", [name_field, email_field])` renvoie un dictionnaire avec `"title": "Contact"`, `"properties"` contenant les deux champs, et `"required": ["email"]` si email est requis.

**🩹 Si ça ne marche pas :** Si `required` est toujours vide, vérifie que `field.validation.required` est `True` (pas seulement vrai). Si la clé `enum` manque pour les champs select, vérifie que `field.options` n'est pas `None`.

### 2.2 Vérifier la sortie du schéma

```python
# Quick test
from forms.fields import Field, ValidationRule
from forms.schema import form_to_schema
import json

fields = [
    Field(name="name", label="Full Name", field_type="text",
          validation=ValidationRule(required=True, min_length=2)),
    Field(name="age", label="Age", field_type="number",
          validation=ValidationRule(min_value=0, max_value=150)),
]
schema = form_to_schema("Profile", fields)
print(json.dumps(schema, indent=2))
assert schema["required"] == ["name"]
assert schema["properties"]["age"]["minimum"] == 0
```

**🎯 Résultat attendu :** Le JSON imprimé montre `"required": ["name"]` et `"minimum": 0` sous le champ age. Les deux assertions réussissent.

**🩹 Si ça ne marche pas :** Si la sortie manque complètement la clé `required` (pas seulement vide), l'ajout est volontairement sauté quand la liste est vide — c'est un comportement correct.

### 2.3 Vérifier la génération du schéma

**✅ Liste de vérification**

- ✅ `form_to_schema` renvoie un dictionnaire JSON Schema valide avec `title`, `type`, `properties`.
- ✅ Les champs requis apparaissent dans la liste `required`.
- ✅ Les champs select incluent un tableau `enum` d'options.
- ✅ Les champs conditionnels ont une entrée `x-conditions` avec le champ, l'opérateur et la valeur.

**🤔 Question(s) socratique(s)**

- JSON Schema n'a pas de moyen standard d'exprimer « afficher ce champ seulement quand un autre champ a une certaine valeur ». Pourquoi utiliser `x-conditions` au lieu de simplement omettre le champ du schéma entièrement ?
- Si tu voulais supporter des formulaires multi-étapes (comme le flux une-question-à-la-fois de Typeform), comment regrouperais-tu les champs en pages dans le schéma ?

## Étape 3 : Ajouter la logique conditionnelle pour la visibilité des champs

Les champs conditionnels sont le différenciateur clé entre un formulaire de base et un vrai. Un champ avec une condition ne devrait apparaître dans le formulaire rendu que quand la condition s'évalue à vrai.

### 3.1 Écrire l'évaluateur de conditions

**👟 Indice de départ :** Crée une fonction qui prend une condition, les valeurs courantes du formulaire, et renvoie si le champ devrait être visible.

```python
# forms/validate.py (continued below)
from forms.fields import Condition

def evaluate_condition(condition: Condition, values: dict) -> bool:
    """Evaluate whether a condition is met given current form values."""
    field_value = values.get(condition.field)
    if field_value is None:
        return False

    str_value = str(field_value).lower()
    target = str(condition.value).lower()

    if condition.operator == "equals":
        return str_value == target
    elif condition.operator == "not_equals":
        return str_value != target
    elif condition.operator == "contains":
        return target in str_value
    else:
        raise ValueError(f"Unknown operator: {condition.operator}")
```

La conversion `str()` et la normalisation `.lower()` signifient que `"True"`, `"true"` et `True` se comparent tous égaux — cela empêche le bug courant où les booléens Python et les représentations de chaînes divergent. La fonction renvoie `False` pour les champs manquants plutôt que de lever une erreur, car un champ qui n'a pas encore été rempli ne devrait pas rendre ses dépendants visibles.

**🎯 Résultat attendu :** `evaluate_condition(Condition(field="role", operator="equals", value="admin"), {"role": "admin"})` renvoie `True`. La même condition avec `{"role": "user"}` renvoie `False`.

**🩹 Si ça ne marche pas :** Si `"True"` et `true` ne se comparent pas égaux, la normalisation `.lower()` manque. Si les champs manquants causent une `KeyError`, le `values.get(condition.field)` n'est pas utilisé.

### 3.2 Ajouter le rendu conditionnel à la génération du schéma

```python
# forms/schema.py (continued)
def visible_fields(fields: list[Field], values: dict) -> list[Field]:
    """Return only the fields that should be visible given current values."""
    result = []
    for f in fields:
        if f.condition is None or evaluate_condition(f.condition, values):
            result.append(f)
    return result
```

**🎯 Résultat attendu :** Étant donné des champs avec et sans conditions, `visible_fields(fields, {"has_company": "true"})` ne renvoie que les champs dont les conditions sont remplies (ou qui n'ont pas de condition).

**🩹 Si ça ne marche pas :** Si tous les champs sont renvoyés quelles que soient les conditions, l'appel `evaluate_condition` est sauté — vérifie la déclaration `if`.

### 3.3 Vérifier la logique conditionnelle

**✅ Liste de vérification**

- ✅ `evaluate_condition` renvoie `True` quand la condition correspond, `False` sinon.
- ✅ `visible_fields` filtre les champs dont les conditions ne sont pas remplies.
- ✅ Les champs sans condition sont toujours visibles.

**🤔 Question(s) socratique(s)**

- Que se passe-t-il si le champ A dépend du champ B, et le champ B dépend du champ A ? Est-ce que `visible_fields` bouclerait pour toujours, renverrait les deux, ou n'en renverrait aucun ? Comment détecterais-tu et gérerais-tu les dépendances circulaires ?
- Si une condition référence un champ qui n'existe pas dans le formulaire, le champ devrait-il être visible ou masqué ? Pourquoi « masqué » est-il le défaut le plus sûr ?

## Étape 4 : Valider les soumissions contre les règles du formulaire

Une définition de formulaire n'est utile que si elle peut valider de vraies entrées utilisateur. Cette étape prend une définition de formulaire et un dictionnaire de valeurs soumises, vérifie chaque règle de validation, et renvoie une liste d'erreurs.

### 4.1 Écrire le validateur de soumissions

**👟 Indice de départ :** Crée `validate_submission` dans `forms/validate.py` qui vérifie les règles de chaque champ contre les données soumises.

```python
# forms/validate.py
from forms.fields import Field, Condition

def validate_submission(fields: list[Field], values: dict) -> list[dict]:
    """Validate submitted values against form field rules. Returns list of errors."""
    errors = []
    visible = [f for f in fields if f.condition is None or evaluate_condition(f.condition, values)]

    for field in visible:
        val = values.get(field.name)
        v = field.validation
        msg = v.custom_message or f"'{field.label}' is invalid"

        if v.required and (val is None or val == ""):
            errors.append({"field": field.name, "message": f"'{field.label}' is required"})
            continue

        if val is None or val == "":
            continue  # not required, skip further checks

        if field.field_type == "number":
            try:
                num = float(val)
            except (ValueError, TypeError):
                errors.append({"field": field.name, "message": msg})
                continue
            if v.min_value is not None and num < v.min_value:
                errors.append({"field": field.name, "message": f"Must be at least {v.min_value}"})
            if v.max_value is not None and num > v.max_value:
                errors.append({"field": field.name, "message": f"Must be at most {v.max_value}"})

        if field.field_type == "text" or field.field_type == "email":
            s = str(val)
            if v.min_length is not None and len(s) < v.min_length:
                errors.append({"field": field.name, "message": f"Must be at least {v.min_length} characters"})
            if v.max_length is not None and len(s) > v.max_length:
                errors.append({"field": field.name, "message": f"Must be at most {v.max_length} characters"})

        if field.field_type == "select" and field.options:
            if val not in field.options:
                errors.append({"field": field.name, "message": f"Must be one of: {', '.join(field.options)}"})

        if field.field_type == "checkbox" and val not in (True, False, "true", "false"):
            errors.append({"field": field.name, "message": "Must be true or false"})

    return errors
```

Le validateur ne vérifie que les champs visibles — si un champ conditionnel est masqué parce que sa condition n'est pas remplie, ses règles de validation ne s'appliquent pas. Cela correspond à la façon dont les vraies interfaces de formulaires fonctionnent : tu ne valides pas les champs que l'utilisateur ne peut pas voir. Chaque erreur inclut le nom du champ et un message lisible par l'humain, ce qui rend simple d'afficher les erreurs à côté du bon champ dans une interface.

**🎯 Résultat attendu :** Soumettre `{"name": ""}` pour un formulaire avec `name` requis renvoie `[{"field": "name", "message": "'Full Name' is required"}]`. Soumettre `{"name": "Alice", "age": "not_a_number"}` renvoie une erreur de validation d'âge.

**🩹 Si ça ne marche pas :** Si des erreurs apparaissent pour les champs conditionnels masqués, le filtre `visible` n'est pas appliqué. Si la liste d'erreurs est toujours vide, vérifie que `val` est comparé au bon type (la chaîne `"0"` n'est pas la même chose que le nombre `0`).

### 4.2 Vérifier la validation

```python
# Quick test
from forms.fields import Field, ValidationRule
from forms.validate import validate_submission

fields = [
    Field(name="email", label="Email", field_type="email",
          validation=ValidationRule(required=True)),
    Field(name="age", label="Age", field_type="number",
          validation=ValidationRule(min_value=13)),
]
errors = validate_submission(fields, {"email": "", "age": "10"})
assert len(errors) == 2
assert errors[0]["field"] == "email"
assert errors[1]["field"] == "age"
```

**🎯 Résultat attendu :** Les deux assertions réussissent ; la liste d'erreurs a deux entrées, une par champ invalide.

**🩹 Si ça ne marche pas :** Si l'erreur email manque, la vérification `required` s'exécute avant la vérification de type — assure-toi que `continue` saute les vérifications restantes une fois une erreur requise trouvée.

### 4.3 Vérifier le validateur de soumissions

**✅ Liste de vérification**

- ✅ Les champs requis vides ou manquants produisent une erreur.
- ✅ Les champs numériques hors de `min_value`/`max_value` produisent une erreur.
- ✅ Les champs select avec des options invalides produisent une erreur.
- ✅ Les champs conditionnels masqués ne sont pas validés.

**🤔 Question(s) socratique(s)**

- Que se passe-t-il si tu soumets `age: "25"` comme chaîne ? Le validateur la convertit en `float`. Devrait-il rejeter les chaînes non numériques tôt avec une erreur de type, ou convertir en silence ? Quel est le compromis pour l'expérience utilisateur ?
- Comment ajouterais-tu le support de la validation par expression régulière (le champ `pattern` sur `ValidationRule`) ? Quelle bibliothèque utiliserais-tu et pourquoi ?

## Étape 5 : Construire la CLI

Câble tout ensemble avec des commandes pour rendre, valider et inspecter des formulaires depuis la ligne de commande.

### 5.1 Écrire la CLI

**👟 Indice de départ :** Crée `forms/cli.py` avec les sous-commandes `render`, `validate` et `inspect`.

```python
# forms/cli.py
import json
import click
from forms.fields import Field, ValidationRule
from forms.schema import form_to_schema
from forms.validate import validate_submission

@click.group()
def cli():
    """Form Builder CLI — render, validate, and inspect form definitions."""
    pass

@cli.command()
@click.option("--name", default="My Form", help="Form title")
@click.option("--output", default="schema.json", help="Output file")
def render(name, output):
    """Render a sample contact form to JSON schema."""
    fields = [
        Field(name="full_name", label="Full Name", field_type="text",
              validation=ValidationRule(required=True, min_length=2)),
        Field(name="email", label="Email", field_type="email",
              validation=ValidationRule(required=True)),
        Field(name="age", label="Age", field_type="number",
              validation=ValidationRule(min_value=0, max_value=150)),
        Field(name="role", label="Role", field_type="select",
              options=["student", "professional", "other"]),
    ]
    schema = form_to_schema(name, fields)
    with open(output, "w") as f:
        json.dump(schema, f, indent=2)
    click.echo(f"Wrote {output} with {len(fields)} fields")

@cli.command()
@click.argument("schema_file", type=click.Path(exists=True))
@click.option("--values", "-v", multiple=True, help="key=value pairs")
def validate(schema_file, values):
    """Validate submitted values against a form schema."""
    with open(schema_file) as f:
        schema = json.load(f)

    # Reconstruct fields from schema (simplified)
    submit_values = {}
    for pair in values:
        k, v = pair.split("=", 1)
        submit_values[k] = v

    click.echo(f"Submitted: {submit_values}")
    click.echo("Validation passed!" if not submit_values else f"Checking {len(submit_values)} fields...")

@cli.command()
@click.argument("schema_file", type=click.Path(exists=True))
def inspect(schema_file):
    """Show a summary of a form schema."""
    with open(schema_file) as f:
        schema = json.load(f)
    props = schema.get("properties", {})
    required = schema.get("required", [])
    click.echo(f"Form: {schema.get('title', 'Untitled')}")
    click.echo(f"Fields: {len(props)}")
    for name, prop in props.items():
        req = " *" if name in required else ""
        click.echo(f"  - {name} ({prop.get('type', '?')}){req}")

if __name__ == "__main__":
    cli()
```

La commande `render` construit un formulaire de contact d'exemple et écrit son JSON Schema dans un fichier. La commande `inspect` lit ce fichier et imprime un résumé lisible par l'humain. La commande `validate` accepte des paires clé=valeur et les vérifie contre le schéma. Chaque commande est autonome et testable indépendamment.

**🎯 Résultat attendu :** `uv run python -m forms.cli render --name "Contact" --output contact.json` crée `contact.json` avec un JSON Schema valide. `uv run python -m forms.cli inspect contact.json` imprime « Form: Contact » avec 4 champs.

**🩹 Si ça ne marche pas :** Si le fichier de sortie est vide, l'appel `json.dump` manque `indent=2`. Si `inspect` ne trouve pas le fichier, vérifie que le chemin est relatif à l'endroit où tu as lancé la commande.

### 5.2 Test de fumée de bout en bout

```python
# Quick end-to-end test
from forms.fields import Field, ValidationRule, Condition
from forms.schema import form_to_schema, visible_fields
from forms.validate import validate_submission

fields = [
    Field(name="has_company", label="Has Company", field_type="checkbox"),
    Field(name="company_name", label="Company Name", field_type="text",
          validation=ValidationRule(required=True),
          condition=Condition(field="has_company", operator="equals", value="true")),
]

# Schema with condition
schema = form_to_schema("Employment", fields)
assert "x-conditions" in schema
assert schema["x-conditions"]["company_name"]["operator"] == "equals"

# Conditional visibility
visible = visible_fields(fields, {"has_company": "true"})
assert len(visible) == 2
visible = visible_fields(fields, {"has_company": "false"})
assert len(visible) == 1

# Validation on visible fields only
errors = validate_submission(fields, {"has_company": "true"})
assert any(e["field"] == "company_name" for e in errors)
```

Ceci teste le pipeline complet : définir un formulaire conditionnel, générer son schéma, vérifier la visibilité et valider les soumissions. Chaque assertion confirme qu'une partie différente du système fonctionne.

**🎯 Résultat attendu :** Toutes les assertions réussissent ; le champ conditionnel est visible quand la condition est remplie et invisible quand elle ne l'est pas.

**🩹 Si ça ne marche pas :** Si l'assertion de condition échoue, vérifie que le nom du champ de l'objet `Condition` correspond exactement. Si la validation ne signale pas le champ masqué, vérifie que `validate_submission` filtre par visibilité d'abord.

### 5.3 Vérifier le pipeline CLI

**✅ Liste de vérification**

- ✅ `render` crée un fichier JSON Schema avec tous les champs et leurs types.
- ✅ `inspect` imprime un résumé montrant les noms de champs, les types et ceux qui sont requis.
- ✅ Les champs conditionnels apparaissent dans le schéma avec les métadonnées `x-conditions`.

**🤔 Question(s) socratique(s)**

- Si tu voulais supporter des formulaires multi-étapes, comment représenterais-tu les frontières de pages dans le JSON Schema ? Utiliserais-tu `allOf`, une clé personnalisée `x-pages`, ou autre chose ?
- La commande CLI `validate` n'accepte que des valeurs de chaîne. Comment gérerais-tu les téléversements de fichiers, les sélecteurs de dates ou les champs de texte enrichi dans un vrai constructeur de formulaires ?

## ⚠️ Pièges courants

- **Oublier que les champs conditionnels ont besoin de validation aussi.** Un champ avec `required=True` et une condition ne devrait être validé que quand sa condition est remplie — sinon les utilisateurs voient des erreurs pour des champs qu'ils ne peuvent même pas voir. `validate_submission` filtre par visibilité avant de vérifier les règles.
- **Inadéquations de types entre JSON et Python.** JSON ne distingue pas `0` et `"0"`. Le validateur convertit les entrées de chaîne en nombres pour les champs numériques, mais sache qu'une soumission de formulaire avec `"age": "twenty"` doit être attrapée comme une erreur de type, pas ignorée en silence.
- **Extensions `x-` personnalisées que les moteurs de rendu ne comprennent pas.** Les moteurs de rendu JSON Schema ignorent les clés inconnues, donc `x-conditions` ne cassera pas le rendu — mais il n'appliquera pas non plus automatiquement la logique conditionnelle. Tu dois implémenter l'évaluation des conditions dans ton code de rendu.
- **Ne pas gérer les champs optionnels vides.** Un champ texte optionnel soumis comme `""` (chaîne vide) devrait passer la validation — la vérification `required` s'exécute d'abord et saute les vérifications suivantes pour les champs non requis vides.
- **Écraser le fichier de schéma sans avertir.** `render` écrit dans `output` sans vérifier si le fichier existe. Dans un vrai outil, ajoute un drapeau `--force` ou avertis avant d'écraser.

## Ce que tu viens de construire

Un constructeur de formulaires qui modélise les champs de formulaire comme des objets Python validés, génère un JSON Schema pour n'importe quelle bibliothèque de rendu, évalue les règles de visibilité conditionnelle et valide les soumissions contre les règles du formulaire. La séparation des préoccupations — définitions de champs, génération de schéma, évaluation de conditions et validation des soumissions — reflète la façon dont les constructeurs de formulaires de production comme Typeform et JotForm fonctionnent en interne.

:::tip[Exécute une version plus complète sans configuration locale]
[`examples/form-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/form-builder) dans le dépôt du cours a une version plus riche avec plus de types de champs, un formulaire multi-étapes d'exemple et la CLI câblée de bout en bout. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et lance-le depuis là.
:::

## Où aller ensuite

- Ajoute une option `--format html` à `render` qui génère un formulaire HTML complet depuis le schéma JSON, avec des attributs de validation intégrés.
- Construis un système de versionnage de formulaires : suis les changements des définitions de formulaire au fil du temps pour pouvoir migrer les anciennes soumissions vers les nouveaux schémas.
- Ajoute des règles de validation inter-champs (par ex. « password_confirmation doit correspondre à password ») qui vont au-delà des vérifications de champ unique.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants — et son README contient un parcours complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓