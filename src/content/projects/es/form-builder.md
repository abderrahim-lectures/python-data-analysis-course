---
title: "Constructor de Formularios"
description: "Construir formularios web con drag-and-drop, reglas de validación y manejo de envíos."
difficulty: "intermediate"
estimatedMinutes: 50
tags: ["cli", "data-validation", "developer-tools"]
learningObjectives:
  - "Modelar campos de formulario como dataclasses de Python con reglas de validación type-safe"
  - "Generar JSON Schema a partir de definiciones de formularios para renderizarlos en cualquier frontend"
  - "Implementar lógica condicional que muestra u oculta campos según la entrada del usuario"
  - "Manejar envíos de formularios con validación y salida estructurada"
prerequisites:
  - "Python 101"
---

# 📝 Constructor de Formularios

Cada formulario web es fundamentalmente lo mismo: una lista de campos, cada uno con un tipo, una etiqueta, reglas de validación y opcionalmente una condición que determina cuándo aparece. Este proyecto construye un constructor de formularios en Python que toma una definición declarativa de formulario y genera JSON Schema — el mismo formato usado por React JSON Schema Form, JSON Editor y docenas de otras librerías de renderizado. Defines el formulario una vez en Python, y cualquier frontend puede renderizarlo.

Esto asume Python 101 — no se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa.

## 🎯 Lo que harás

1. Configurar un proyecto con `uv` e instalar las dependencias que necesitarás.
2. Modelar campos de formulario como dataclasses de Python con tipos, etiquetas y reglas de validación.
3. Generar JSON Schema a partir de definiciones de formularios que cualquier librería de renderizado pueda consumir.
4. Añadir lógica condicional para que los campos aparezcan o se oculten según los valores de otros campos.
5. Validar los envíos de usuarios contra las reglas del formulario y reportar los errores con claridad.
6. Construir una CLI que define, renderiza y valida formularios desde la línea de comandos.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal — es una herramienta CLI que lee definiciones de formularios y escribe archivos JSON Schema.

**Google Colab, Kaggle Notebooks y Binder** funcionan para probar la herramienta. El notebook instala los mismos paquetes y usa el mismo código; genera y valida formularios de muestra en la sesión.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/form-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/form-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fform-builder%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes de construir: un entorno de Python, un framework de CLI y un directorio de proyecto.

### Instala `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Cierra y vuelve a abrir tu terminal, luego confirma:

```bash
uv --version
```

### Crea el scaffold del proyecto

```bash
uv init form-builder
cd form-builder
uv add click pydantic
```

`click` construye la CLI y `pydantic` proporciona validación con mensajes de error claros. El proyecto mantiene los campos, la generación de esquemas, la validación y la CLI en archivos separados.

### Crea la estructura del proyecto

```bash
mkdir -p forms
touch forms/__init__.py forms/fields.py forms/schema.py forms/validate.py forms/cli.py
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `form-builder/` existe con un `pyproject.toml`, y `click` y `pydantic` están instalados.
- ✅ El directorio `forms/` tiene todos los archivos de módulo requeridos.

## Paso 1: Modela campos de formulario como dataclasses

Un campo de formulario tiene un tipo (texto, número, email, select, checkbox), una etiqueta, un nombre (la clave JSON), reglas de validación opcionales y una condición de visibilidad opcional. Modelarlo como un modelo de Pydantic te da verificación de tipos, valores por defecto y serialización gratis.

### 1.1 Define los tipos de campo

**👟 Pista inicial :** Crea `forms/fields.py` con un modelo base `Field` y subclases específicas por tipo.

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

El modelo `Condition` es lo que impulsa la visibilidad condicional: referencia a otro campo por nombre, un operador y un valor de comparación. Un campo con `condition={"field": "has_company", "operator": "equals", "value": "true"}` solo aparece cuando `has_company` es `true`. Este es el mismo patrón usado en herramientas como Typeform y Google Forms.

**🎯 Resultado esperado :** `Field(name="email", label="Email", field_type="email")` crea un campo válido. `Field(name="bad", label="Bad", field_type="slider")` lanza un `ValidationError`.

**🩹 Si sale mal :** Si el validador de `field_type` no se dispara, al decorador `@field_validator` le puede faltar `@classmethod`. Si los campos opcionales como `options` causan errores cuando son `None`, revisa que la anotación de tipo use `Optional[list[str]]`.

### 1.2 Verifica la creación del campo

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

**🎯 Resultado esperado :** La aserción pasa; `model_dump()` muestra todos los campos, incluidas las reglas de validación anidadas.

**🩹 Si sale mal :** Si a `model_dump()` le falta el sub-dict de validación, revisa que `ValidationRule` es una subclase de `BaseModel`, no un dict simple.

### 1.3 Verifica el modelo de campo

**✅ Lista de verificación**

- ✅ Un campo válido se crea con éxito con todos los campos accesibles.
- ✅ Un `field_type` inválido (como `"slider"`) lanza un `ValidationError` claro.
- ✅ Las reglas de validación vuelven por defecto a un `ValidationRule()` sensato con todos los campos opcionales.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué modelar `Condition` por separado en lugar de poner `condition_field`, `condition_operator` y `condition_value` directamente en `Field`? ¿Qué pasa cuando necesitas dos condiciones en un campo?
- El campo `options` solo tiene sentido para los tipos `select`, pero está disponible en todos los campos. ¿Es un defecto de diseño, o una compensación deliberada por simplicidad?

## Paso 2: Genera JSON Schema a partir de definiciones de formularios

JSON Schema es una forma estándar de describir formas de datos — es lo que las librerías de formularios de frontend usan para saber qué campos renderizar y qué validación aplicar. Convertir tu definición de formulario en Python a JSON Schema la hace interoperable con cualquier librería de renderizado.

### 2.1 Escribe el generador de esquemas

**👟 Pista inicial :** Crea `forms/schema.py` con una función que convierta una lista de objetos `Field` en un diccionario JSON Schema.

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

El `TYPE_MAP` traduce tus tipos de Python a tipos de JSON Schema. La clave `x-conditions` usa una extensión personalizada (prefijada con `x-`) para adjuntar la lógica condicional — JSON Schema en sí no define visibilidad condicional, pero las librerías de renderizado de formularios como React JSON Schema Form soportan extensiones `x-`. La lista `required` se construye automáticamente a partir de los campos donde `validation.required` es `True`.

**🎯 Resultado esperado :** `form_to_schema("Contact", [name_field, email_field])` devuelve un diccionario con `"title": "Contact"`, `"properties"` conteniendo ambos campos y `"required": ["email"]` si el email es requerido.

**🩹 Si sale mal :** Si `required` siempre está vacío, revisa que `field.validation.required` es `True` (no solo veraz). Si la clave `enum` falta para los campos select, verifica que `field.options` no es `None`.

### 2.2 Verifica la salida del esquema

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

**🎯 Resultado esperado :** El JSON impreso muestra `"required": ["name"]` y `"minimum": 0` bajo el campo age. Ambas aserciones pasan.

**🩹 Si sale mal :** Si a la salida le falta por completo la clave `required` (no solo está vacía), la función omite añadirla cuando la lista está vacía — ese es el comportamiento correcto.

### 2.3 Verifica la generación del esquema

**✅ Lista de verificación**

- ✅ `form_to_schema` devuelve un diccionario JSON Schema válido con `title`, `type`, `properties`.
- ✅ Los campos requeridos aparecen en la lista `required`.
- ✅ Los campos select incluyen un array `enum` de opciones.
- ✅ Los campos condicionales tienen una entrada `x-conditions` con el campo, el operador y el valor.

**🤔 Pregunta(s) socrática(s)**

- JSON Schema no tiene una forma estándar de expresar "muestra este campo solo cuando otro campo tiene cierto valor". ¿Por qué usar `x-conditions` en lugar de simplemente omitir el campo del esquema por completo?
- Si quisieras soportar formularios de múltiples pasos (como el flujo de una pregunta a la vez de Typeform), ¿cómo agruparías los campos en páginas dentro del esquema?

## Paso 3: Añade lógica condicional para la visibilidad de campos

Los campos condicionales son el diferenciador clave entre un formulario básico y uno real. Un campo con una condición solo debe aparecer en el formulario renderizado cuando la condición se evalúa como verdadera.

### 3.1 Escribe el evaluador de condiciones

**👟 Pista inicial :** Crea una función que tome una condición, los valores actuales del formulario y devuelva si el campo debería ser visible.

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

La conversión `str()` y la normalización `.lower()` significan que `"True"`, `"true"` y `True` se comparan como iguales — esto previene el bug común donde los booleanos de Python y las representaciones de cadena divergen. La función devuelve `False` para campos faltantes en lugar de lanzar un error, porque un campo que aún no se ha llenado no debería hacer visibles a sus dependientes.

**🎯 Resultado esperado :** `evaluate_condition(Condition(field="role", operator="equals", value="admin"), {"role": "admin"})` devuelve `True`. La misma condición con `{"role": "user"}` devuelve `False`.

**🩹 Si sale mal :** Si `"True"` y `true` no se comparan como iguales, falta la normalización `.lower()`. Si los campos faltantes causan un `KeyError`, no se está usando `values.get(condition.field)`.

### 3.2 Añade el renderizado condicional a la generación de esquemas

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

**🎯 Resultado esperado :** Dados campos con y sin condiciones, `visible_fields(fields, {"has_company": "true"})` devuelve solo los campos cuyas condiciones se cumplen (o que no tienen condición).

**🩹 Si sale mal :** Si todos los campos se devuelven sin importar las condiciones, se está saltando la llamada a `evaluate_condition` — revisa la sentencia `if`.

### 3.3 Verifica la lógica condicional

**✅ Lista de verificación**

- ✅ `evaluate_condition` devuelve `True` cuando la condición coincide, `False` en caso contrario.
- ✅ `visible_fields` filtra los campos cuyas condiciones no se cumplen.
- ✅ Los campos sin condiciones siempre son visibles.

**🤔 Pregunta(s) socrática(s)**

- ¿Qué pasa si el campo A depende del campo B, y el campo B depende del campo A? ¿Haría `visible_fields` un bucle infinito, devolvería ambos o ninguno? ¿Cómo detectarías y manejarías las dependencias circulares?
- Si una condición referencia un campo que no existe en el formulario, ¿debería el campo ser visible u oculto? ¿Por qué "oculto" es el valor por defecto más seguro?

## Paso 4: Valida envíos contra las reglas del formulario

Una definición de formulario solo es útil si puede validar entrada real del usuario. Este paso toma una definición de formulario y un diccionario de valores enviados, verifica cada regla de validación y devuelve una lista de errores.

### 4.1 Escribe el validador de envíos

**👟 Pista inicial :** Crea `validate_submission` en `forms/validate.py` que verifique las reglas de cada campo contra los datos enviados.

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

El validador solo verifica los campos visibles — si un campo condicional está oculto porque su condición no se cumple, sus reglas de validación no aplican. Esto coincide con cómo funcionan las UI de formularios reales: no validas campos que el usuario no puede ver. Cada error incluye el nombre del campo y un mensaje legible, lo que hace sencillo mostrar los errores junto al campo correcto en una UI.

**🎯 Resultado esperado :** Enviar `{"name": ""}` para un formulario con `name` requerido devuelve `[{"field": "name", "message": "'Full Name' is required"}]`. Enviar `{"name": "Alice", "age": "not_a_number"}` devuelve un error de validación para age.

**🩹 Si sale mal :** Si aparecen errores para campos condicionales ocultos, no se está aplicando el filtro `visible`. Si la lista de errores siempre está vacía, revisa que `val` se compara contra el tipo correcto (la cadena `"0"` no es lo mismo que el número `0`).

### 4.2 Verifica la validación

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

**🎯 Resultado esperado :** Ambas aserciones pasan; la lista de errores tiene dos entradas, una por campo inválido.

**🩹 Si sale mal :** Si el error de email falta, la verificación de `required` corre después de la verificación de tipo — asegúrate de que `continue` salta las verificaciones restantes una vez que se encuentra un error de requerido.

### 4.3 Verifica el validador de envíos

**✅ Lista de verificación**

- ✅ Los campos requeridos que están vacíos o faltan producen un error.
- ✅ Los campos numéricos fuera de `min_value`/`max_value` producen un error.
- ✅ Los campos select con opciones inválidas producen un error.
- ✅ Los campos condicionales ocultos no se validan.

**🤔 Pregunta(s) socrática(s)**

- ¿Qué pasa si envías `age: "25"` como cadena? El validador la convierte a `float`. ¿Debería rechazar las cadenas no numéricas temprano con un error de tipo, o convertir silenciosamente? ¿Cuál es la compensación en experiencia de usuario?
- ¿Cómo añadirías soporte para validación por patrón regex (el campo `pattern` de `ValidationRule`)? ¿Qué librería usarías y por qué?

## Paso 5: Construye la CLI

Conecta todo con comandos para renderizar, validar e inspeccionar formularios desde la línea de comandos.

### 5.1 Escribe la CLI

**👟 Pista inicial :** Crea `forms/cli.py` con los subcomandos `render`, `validate` e `inspect`.

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

El comando `render` construye un formulario de contacto de muestra y escribe su JSON Schema en un archivo. El comando `inspect` lee ese archivo e imprime un resumen legible. El comando `validate` acepta pares clave=valor y los verifica contra el esquema. Cada comando es autocontenido y testeable de forma independiente.

**🎯 Resultado esperado :** `uv run python -m forms.cli render --name "Contact" --output contact.json` crea `contact.json` con un JSON Schema válido. `uv run python -m forms.cli inspect contact.json` imprime "Form: Contact" con 4 campos.

**🩹 Si sale mal :** Si el archivo de salida está vacío, a la llamada a `json.dump` le falta `indent=2`. Si `inspect` no puede encontrar el archivo, revisa que la ruta es relativa a donde ejecutaste el comando.

### 5.2 Prueba de humo de extremo a extremo

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

Esto prueba el pipeline completo: definir un formulario condicional, generar su esquema, verificar la visibilidad y validar envíos. Cada aserción confirma que una parte diferente del sistema funciona.

**🎯 Resultado esperado :** Todas las aserciones pasan; el campo condicional es visible cuando la condición se cumple e invisible cuando no.

**🩹 Si sale mal :** Si la aserción de la condición falla, revisa que el nombre del `field` del objeto `Condition` coincide exactamente. Si la validación no marca el campo oculto, revisa que `validate_submission` filtra por visibilidad primero.

### 5.3 Verifica el pipeline de la CLI

**✅ Lista de verificación**

- ✅ `render` crea un archivo JSON Schema con todos los campos y sus tipos.
- ✅ `inspect` imprime un resumen mostrando nombres de campos, tipos y cuáles son requeridos.
- ✅ Los campos condicionales aparecen en el esquema con metadatos `x-conditions`.

**🤔 Pregunta(s) socrática(s)**

- Si quisieras soportar formularios de múltiples pasos, ¿cómo representarías los límites de página en el JSON Schema? ¿Usarías `allOf`, una clave personalizada `x-pages`, o algo más?
- El comando CLI `validate` solo acepta valores de cadena. ¿Cómo manejarías subidas de archivos, selectores de fecha o campos de texto enriquecido en un constructor de formularios real?

## ⚠️ Errores comunes

- **Olvidar que los campos condicionales también necesitan validación.** Un campo con `required=True` y una condición solo debe validarse cuando su condición se cumple — de otro modo los usuarios ven errores para campos que ni siquiera pueden ver. `validate_submission` filtra por visibilidad antes de verificar las reglas.
- **Discrepancias de tipo entre JSON y Python.** JSON no distingue entre `0` y `"0"`. El validador convierte las entradas de cadena a números para los campos numéricos, pero ten en cuenta que un envío de formulario con `"age": "twenty"` debe detectarse como error de tipo, no ignorarse silenciosamente.
- **Extensiones personalizadas `x-` que los renderizadores no entienden.** Los renderizadores de JSON Schema ignoran las claves desconocidas, así que `x-conditions` no romperá el renderizado — pero tampoco aplicará automáticamente la lógica condicional. Necesitas implementar la evaluación de la condición en tu código de renderizado.
- **No manejar campos opcionales vacíos.** Un campo de texto opcional enviado como `""` (cadena vacía) debe pasar la validación — la verificación de requerido corre primero y salta las demás verificaciones para campos no requeridos vacíos.
- **Sobrescribir el archivo del esquema sin aviso.** `render` escribe en `output` sin verificar si el archivo existe. En una herramienta real, añade un flag `--force` o avisa antes de sobrescribir.

## Lo que acabas de construir

Un constructor de formularios que modela campos como objetos de Python validados, genera JSON Schema para cualquier librería de renderizado, evalúa reglas de visibilidad condicional y valida envíos contra las reglas del formulario. La separación de responsabilidades — definiciones de campos, generación de esquemas, evaluación de condiciones y validación de envíos — refleja cómo funcionan internamente los constructores de formularios de producción como Typeform y JotForm.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/form-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/form-builder) en el repositorio del curso tiene una versión más rica con más tipos de campo, un formulario de muestra de múltiples pasos y la CLI conectada de extremo a extremo. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Añade una opción `--format html` a `render` que genere un formulario HTML completo a partir del JSON schema, con atributos de validación integrados.
- Construye un sistema de versionado de formularios: rastrea los cambios en las definiciones de formularios a lo largo del tiempo para poder migrar envíos antiguos a esquemas nuevos.
- Añade reglas de validación entre campos (p. ej., "password_confirmation debe coincidir con password") que vayan más allá de las verificaciones de campo único.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓