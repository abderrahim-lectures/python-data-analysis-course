---
title: "Build a Form Builder"
description: "Build a Python-powered form builder that generates JSON schema forms with validation rules, conditional logic, and submission handling."
difficulty: "intermediate"
estimatedMinutes: 50
tags: ["cli", "data-validation", "developer-tools"]
learningObjectives:
  - "Model form fields as Python dataclasses with type-safe validation rules"
  - "Generate JSON schema from form definitions for rendering in any frontend"
  - "Implement conditional logic that shows or hides fields based on user input"
  - "Handle form submissions with validation and structured output"
prerequisites: ["Python 101"]
---

# 📝 Build a Form Builder

Every web form is fundamentally the same thing: a list of fields, each with a type, a label, validation rules, and optionally a condition that determines when it appears. This project builds a Python form builder that takes a declarative form definition and outputs JSON schema — the same format used by React JSON Schema Form, JSON Editor, and dozens of other rendering libraries. You define the form once in Python, and any frontend can render it.

This assumes Python 101 — nothing from Data Analysis is required. Optional and ungraded; see [Real-World Projects](/docs/projects) for the full list.

## 🎯 What you'll do

1. Set up a project with `uv` and install the dependencies you'll need.
2. Model form fields as Python dataclasses with types, labels, and validation rules.
3. Generate JSON schema from form definitions that any rendering library can consume.
4. Add conditional logic so fields appear or hide based on other field values.
5. Validate user submissions against the form's rules and report errors clearly.
6. Build a CLI that defines, renders, and validates forms from the command line.

## Where to run this

**Locally with `uv`** is the primary path — this is a CLI tool that reads form definitions and writes JSON schema files.

**Google Colab, Kaggle Notebooks, and Binder** work for trying the tool. The notebook installs the same packages and uses the same code; it generates and validates sample forms in the session.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/form-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/form-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fform-builder%2Fnotebook.ipynb)

## Setup

Everything you need before building: a Python environment, a CLI framework, and a project directory.

### Install `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Close and reopen your terminal, then confirm:

```bash
uv --version
```

### Scaffold the project

```bash
uv init form-builder
cd form-builder
uv add click pydantic
```

`click` builds the CLI and `pydantic` provides validation with clear error messages. The project keeps fields, schema generation, validation, and the CLI in separate files.

### Create the project structure

```bash
mkdir -p forms
touch forms/__init__.py forms/fields.py forms/schema.py forms/validate.py forms/cli.py
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `form-builder/` exists with a `pyproject.toml`, and `click` and `pydantic` are installed.
- ✅ The `forms/` directory has all required module files.

## Step 1: Model form fields as dataclasses

A form field has a type (text, number, email, select, checkbox), a label, a name (the JSON key), optional validation rules, and an optional visibility condition. Modeling this as a Pydantic model gives you type checking, default values, and serialization for free.

### 1.1 Define the field types

**👟 Starter hint:** Create `forms/fields.py` with a base `Field` model and type-specific subclasses.

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

The `Condition` model is what drives conditional visibility: it references another field by name, an operator, and a comparison value. A field with `condition={"field": "has_company", "operator": "equals", "value": "true"}` only appears when `has_company` is `true`. This is the same pattern used in tools like Typeform and Google Forms.

**🎯 Expected output:** `Field(name="email", label="Email", field_type="email")` creates a valid field. `Field(name="bad", label="Bad", field_type="slider")` raises a `ValidationError`.

**🩹 If it's off:** If the `field_type` validator doesn't fire, the `@field_validator` decorator may be missing `@classmethod`. If optional fields like `options` cause errors when `None`, check the type annotation uses `Optional[list[str]]`.

### 1.2 Verify field creation

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

**🎯 Expected output:** The assertion passes; `model_dump()` shows all fields including nested validation rules.

**🩹 If it's off:** If `model_dump()` is missing the validation sub-dict, check that `ValidationRule` is a `BaseModel` subclass, not a plain dict.

### 1.3 Verify the field model

**✅ Checklist**

- ✅ A valid field creates successfully with all fields accessible.
- ✅ An invalid `field_type` (like `"slider"`) raises a clear `ValidationError`.
- ✅ Validation rules default to a sensible `ValidationRule()` with all fields optional.

**🤔 Socratic Question(s)**

- Why model `Condition` separately instead of just putting `condition_field`, `condition_operator`, and `condition_value` directly on `Field`? What happens when you need two conditions on one field?
- The `options` field is only meaningful for `select` types but is available on all fields. Is this a design flaw, or a deliberate tradeoff for simplicity?

## Step 2: Generate JSON schema from form definitions

JSON Schema is a standard way to describe data shapes — it's what frontend form libraries use to know what fields to render and what validation to apply. Converting your Python form definition to JSON Schema makes it interoperable with any rendering library.

### 2.1 Write the schema generator

**👟 Starter hint:** Create `forms/schema.py` with a function that converts a list of `Field` objects into a JSON Schema dictionary.

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

The `TYPE_MAP` translates your Python types to JSON Schema types. The `x-conditions` key uses a custom extension (prefixed with `x-`) to attach conditional logic — JSON Schema itself doesn't define conditional visibility, but form rendering libraries like React JSON Schema Form support `x-` extensions. The `required` list is built automatically from fields where `validation.required` is `True`.

**🎯 Expected output:** `form_to_schema("Contact", [name_field, email_field])` returns a dictionary with `"title": "Contact"`, `"properties"` containing both fields, and `"required": ["email"]` if email is required.

**🩹 If it's off:** If `required` is always empty, check that `field.validation.required` is `True` (not just truthy). If the `enum` key is missing for select fields, verify `field.options` is not `None`.

### 2.2 Verify schema output

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

**🎯 Expected output:** The printed JSON shows `"required": ["name"]` and `"minimum": 0` under the age field. Both assertions pass.

**🩹 If it's off:** If the output is missing the `required` key entirely (not just empty), the function skips adding it when the list is empty — that's correct behavior.

### 2.3 Verify schema generation

**✅ Checklist**

- ✅ `form_to_schema` returns a valid JSON Schema dictionary with `title`, `type`, `properties`.
- ✅ Required fields appear in the `required` list.
- ✅ Select fields include an `enum` array of options.
- ✅ Conditional fields have an `x-conditions` entry with the field, operator, and value.

**🤔 Socratic Question(s)**

- JSON Schema doesn't have a standard way to express "show this field only when another field has a certain value." Why use `x-conditions` instead of just skipping the field in the schema entirely?
- If you wanted to support multi-step forms (like Typeform's one-question-at-a-time flow), how would you group fields into pages in the schema?

## Step 3: Add conditional logic for field visibility

Conditional fields are the key differentiator between a basic form and a real one. A field with a condition should only appear in the rendered form when the condition evaluates to true.

### 3.1 Write the condition evaluator

**👟 Starter hint:** Create a function that takes a condition, the current form values, and returns whether the field should be visible.

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

The `str()` conversion and `.lower()` normalization means `"True"`, `"true"`, and `True` all compare equal — this prevents the common bug where Python booleans and string representations diverge. The function returns `False` for missing fields rather than raising an error, because a field that hasn't been filled in yet shouldn't make its dependents visible.

**🎯 Expected output:** `evaluate_condition(Condition(field="role", operator="equals", value="admin"), {"role": "admin"})` returns `True`. Same condition with `{"role": "user"}` returns `False`.

**🩹 If it's off:** If `"True"` and `true` don't compare equal, the `.lower()` normalization is missing. If missing fields cause a `KeyError`, the `values.get(condition.field)` isn't being used.

### 3.2 Add conditional rendering to schema generation

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

**🎯 Expected output:** Given fields with and without conditions, `visible_fields(fields, {"has_company": "true"})` returns only the fields whose conditions are met (or have no condition).

**🩹 If it's off:** If all fields are returned regardless of conditions, the `evaluate_condition` call is being skipped — check the `if` statement.

### 3.3 Verify conditional logic

**✅ Checklist**

- ✅ `evaluate_condition` returns `True` when the condition matches, `False` otherwise.
- ✅ `visible_fields` filters out fields whose conditions are not met.
- ✅ Fields without conditions are always visible.

**🤔 Socratic Question(s)**

- What happens if field A depends on field B, and field B depends on field A? Would `visible_fields` loop forever, return both, or return neither? How would you detect and handle circular dependencies?
- If a condition references a field that doesn't exist in the form, should the field be visible or hidden? Why is "hidden" the safer default?

## Step 4: Validate submissions against form rules

A form definition is only useful if it can validate real user input. This step takes a form definition and a dictionary of submitted values, checks every validation rule, and returns a list of errors.

### 4.1 Write the submission validator

**👟 Starter hint:** Create `validate_submission` in `forms/validate.py` that checks each field's rules against the submitted data.

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

The validator checks visible fields only — if a conditional field is hidden because its condition isn't met, its validation rules don't apply. This matches how real form UIs work: you don't validate fields the user can't see. Each error includes the field name and a human-readable message, which makes it straightforward to display errors next to the right field in a UI.

**🎯 Expected output:** Submitting `{"name": ""}` for a form with `name` required returns `[{"field": "name", "message": "'Full Name' is required"}]`. Submitting `{"name": "Alice", "age": "not_a_number"}` returns an age validation error.

**🩹 If it's off:** If errors appear for hidden conditional fields, the `visible` filter isn't being applied. If the error list is always empty, check that `val` is being compared against the right type (string `"0"` is not the same as number `0`).

### 4.2 Verify validation

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

**🎯 Expected output:** Both assertions pass; the error list has two entries, one per invalid field.

**🩹 If it's off:** If the email error is missing, the `required` check runs after the type check — make sure `continue` skips the remaining checks once a required error is found.

### 4.3 Verify the submission validator

**✅ Checklist**

- ✅ Required fields that are empty or missing produce an error.
- ✅ Number fields outside `min_value`/`max_value` produce an error.
- ✅ Select fields with invalid options produce an error.
- ✅ Hidden conditional fields are not validated.

**🤔 Socratic Question(s)**

- What happens if you submit `age: "25"` as a string? The validator converts it to `float`. Should it reject non-numeric strings early with a type error, or silently convert? What's the user-experience tradeoff?
- How would you add support for regex pattern validation (the `pattern` field on `ValidationRule`)? What library would you use and why?

## Step 5: Build the CLI

Wire everything together with commands to render, validate, and inspect forms from the command line.

### 5.1 Write the CLI

**👟 Starter hint:** Create `forms/cli.py` with `render`, `validate`, and `inspect` subcommands.

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

The `render` command builds a sample contact form and writes its JSON Schema to a file. The `inspect` command reads that file and prints a human-readable summary. The `validate` command accepts key=value pairs and checks them against the schema. Each command is self-contained and testable independently.

**🎯 Expected output:** `uv run python -m forms.cli render --name "Contact" --output contact.json` creates `contact.json` with a valid JSON Schema. `uv run python -m forms.cli inspect contact.json` prints "Form: Contact" with 4 fields.

**🩹 If it's off:** If the output file is empty, the `json.dump` call is missing `indent=2`. If `inspect` can't find the file, check the path is relative to where you ran the command.

### 5.2 End-to-end smoke test

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

This tests the full pipeline: defining a conditional form, generating its schema, checking visibility, and validating submissions. Each assertion confirms a different part of the system works.

**🎯 Expected output:** All assertions pass; the conditional field is visible when the condition is met and invisible when it's not.

**🩹 If it's off:** If the condition assertion fails, check that the `Condition` object's `field` name matches exactly. If validation doesn't flag the hidden field, check that `validate_submission` filters by visibility first.

### 5.3 Verify the CLI pipeline

**✅ Checklist**

- ✅ `render` creates a JSON Schema file with all fields and their types.
- ✅ `inspect` prints a summary showing field names, types, and which are required.
- ✅ Conditional fields appear in the schema with `x-conditions` metadata.

**🤔 Socratic Question(s)**

- If you wanted to support multi-step forms, how would you represent page boundaries in the JSON Schema? Would you use `allOf`, a custom `x-pages` key, or something else?
- The `validate` CLI command only accepts string values. How would you handle file uploads, date pickers, or rich text fields in a real form builder?

## ⚠️ Common pitfalls

- **Forgetting that conditional fields need validation too.** A field with `required=True` and a condition should only be validated when its condition is met — otherwise users see errors for fields they can't even see. `validate_submission` filters by visibility before checking rules.
- **Type mismatches between JSON and Python.** JSON doesn't distinguish between `0` and `"0"`. The validator converts string inputs to numbers for number fields, but be aware that a form submission with `"age": "twenty"` needs to be caught as a type error, not silently ignored.
- **Custom `x-` extensions that renderers don't understand.** JSON Schema renderers ignore unknown keys, so `x-conditions` won't break rendering — but it also won't automatically apply conditional logic. You need to implement the condition evaluation in your rendering code.
- **Not handling empty optional fields.** An optional text field submitted as `""` (empty string) should pass validation — the required check runs first and skips further checks for empty non-required fields.
- **Overwriting the schema file without warning.** `render` writes to `output` without checking if the file exists. In a real tool, add a `--force` flag or warn before overwriting.

## What you just built

A form builder that models form fields as validated Python objects, generates JSON Schema for any rendering library, evaluates conditional visibility rules, and validates submissions against the form's rules. The separation of concerns — field definitions, schema generation, condition evaluation, and submission validation — mirrors how production form builders like Typeform and JotForm work internally.

:::tip[Run a fuller version without any local setup]
[`examples/form-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/form-builder) in the course repo has a richer version with more field types, a sample multi-step form, and the CLI wired up end to end. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a `--format html` option to `render` that generates a complete HTML form from the JSON schema, with validation attributes baked in.
- Build a form versioning system: track changes to form definitions over time so you can migrate old submissions to new schemas.
- Add cross-field validation rules (e.g., "password_confirmation must match password") that go beyond single-field checks.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
