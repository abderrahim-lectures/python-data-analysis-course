---
title: "Cuchillo Suizo JSON"
description: "Una herramienta CLI que formatea, valida, consulta y transforma archivos JSON con el poder de JQ."
tags: ["cli", "data-pipeline", "developer-tools"]
---

# 🔧 Construye un Cuchillo Suizo JSON

Cualquier desarrollador que trabaja con JSON tiene una docena de operaciones pequeñas: formatear este archivo, validar aquel, extraer este campo, convertir a YAML. Este proyecto construye un único CLI con Click que las maneja todas. Es el tipo de herramienta que ahorra minutos todos los días y se paga a sí misma en una semana.

Esto asume Python 101 y comodidad con los flujos de trabajo de CLI de [Herramientas de Desarrollo](/es/proyectos). Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Configurar un proyecto con `uv` e instalar las dependencias de CLI y de conversión de formatos.
2. Implementar el formateo de JSON con indentación configurable.
3. Añadir validación con ubicación de errores.
4. Construir un motor de consultas por notación de punto estilo JQ.
5. Implementar la conversión de formatos entre JSON, YAML y TOML.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal — es una herramienta CLI que lee y escribe archivos.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/json-swiss-army-knife/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/json-swiss-army-knife/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fjson-swiss-army-knife%2Fnotebook.es.ipynb)

## Configuración

Todo lo que necesitas antes de construir: un entorno de Python, Click y librerías de formatos.

### Instala `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Cierra y vuelve a abrir tu terminal, luego confirma:

```bash
uv --version
```

### Configura el proyecto

```bash
uv init json-swiss-army-knife
cd json-swiss-army-knife
uv add click pyyaml tomli rich
```

`click` maneja el enrutamiento del CLI. `pyyaml` y `tomli` manejan la conversión de formatos. `rich` proporciona la salida con colores.

### Crea la estructura del proyecto

```bash
touch json_knife/__init__.py json_knife/formatter.py json_knife/validator.py json_knife/query.py json_knife/converter.py json_knife/cli.py
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `json-swiss-army-knife/` existe con un `pyproject.toml` y todas las dependencias instaladas.
- ✅ El directorio `json_knife/` tiene todos los archivos de módulo requeridos.

## Paso 1: Formatea JSON con indentación configurable

El formateo convierte el JSON minificado en algo legible para humanos. Es la característica más simple pero la más usada.

### 1.1 Implementa el formateador

**👟 Pista inicial :** Crea `json_knife/formatter.py` con una función que haga un pretty-print del JSON.

```python
# json_knife/formatter.py
import json

def format_json(data: str, indent: int = 2) -> str:
    parsed = json.loads(data)
    return json.dumps(parsed, indent=indent, ensure_ascii=False, sort_keys=False)
```

Esto carga la cadena JSON y luego la vuelve a volcar con la indentación especificada. `ensure_ascii=False` conserva los caracteres Unicode.

**🎯 Resultado esperado :** `format_json('{"b":1,"a":2}', indent=2)` devuelve:
```json
{
  "b": 1,
  "a": 2
}
```

**🩹 Si sale mal :** Si obtienes `json.JSONDecodeError`, la entrada no es JSON válido.

### 1.2 Verifica el formateador

**✅ Lista de verificación**

- ✅ `format_json('{"a":1}')` devuelve una salida con pretty-print.
- ✅ Se respeta la indentación personalizada.

**🤔 Pregunta(s) socrática(s)**

- ¿Cuál es la diferencia entre `sort_keys=True` y dejarlo en falso? ¿Cuándo querrías las llaves ordenadas?

## Paso 2: Valida JSON con ubicaciones de error

La validación detecta los errores de sintaxis antes de que se propaguen. El valor clave es reportar *dónde* ocurrió el error.

### 2.1 Implementa el validador

**👟 Pista inicial :** Crea `json_knife/validator.py`.

```python
# json_knife/validator.py
import json

def validate_json(data: str) -> tuple[bool, str]:
    try:
        json.loads(data)
        return True, "Valid JSON"
    except json.JSONDecodeError as e:
        return False, f"Line {e.lineno}, Column {e.colno}: {e.msg}"
```

`json.JSONDecodeError` incluye los atributos `lineno` y `colno` que señalan el error con precisión.

**🎯 Resultado esperado :** `validate_json('{"a": 1,}')` devuelve `(False, "Line 1, Column 10: ...")`.

**🩹 Si sale mal :** Si no obtienes la información de línea/columna, no estás capturando `JSONDecodeError`.

### 2.2 Verifica el validador

**✅ Lista de verificación**

- ✅ El JSON válido devuelve `(True, "Valid JSON")`.
- ✅ El JSON inválido devuelve `(False, ...)` con línea y columna.

**🤔 Pregunta(s) socrática(s)**

- ¿Cómo lo extenderías para validar contra un JSON Schema? ¿Qué librería usarías?

## Paso 3: Construye un motor de consultas por notación de punto

Esta es la característica estrella del Cuchillo Suizo: `$.users[*].name` para extraer valores anidados.

### 3.1 Implementa el analizador de consultas

**👟 Pista inicial :** Crea `json_knife/query.py`.

```python
# json_knife/query.py
import json, re

def query_json(data: str, path: str) -> list:
    parsed = json.loads(data)
    tokens = re.findall(r'[\w\[\]*$]+', path)
    tokens = [t for t in tokens if t not in ("$", "")]
    results = _traverse(parsed, tokens)
    return results if isinstance(results, list) else [results]

def _traverse(obj, tokens):
    if not tokens:
        return obj
    key, *rest = tokens
    if key == "*":
        if isinstance(obj, list):
            return [_traverse(item, rest) for item in obj]
        elif isinstance(obj, dict):
            return [_traverse(v, rest) for v in obj.values()]
        return []
    elif key.endswith("]"):
        idx = int(key.rstrip("]"))
        return _traverse(obj[idx], rest) if isinstance(obj, list) and idx < len(obj) else []
    elif isinstance(obj, dict) and key in obj:
        return _traverse(obj[key], rest)
    return []
```

La expresión regular extrae los tokens de la ruta como `"users"`, `"[*]"`, `"name"`. `_traverse` recorre la estructura de forma recursiva. `[*]` se expande a todos los elementos de la lista.

**🎯 Resultado esperado :** `query_json('[{"name":"Alice"},{"name":"Bob"}]', '$[*].name')` devuelve `["Alice", "Bob"]`.

**🩹 Si sale mal :** Si obtienes resultados vacíos, revisa que la expresión regular esté dividiendo los tokens correctamente.

### 3.2 Verifica el motor de consultas

**✅ Lista de verificación**

- ✅ `$.users[*].name` extrae los nombres de una lista de objetos de usuario.
- ✅ Las rutas anidadas como `$.config.database.host` funcionan.
- ✅ El comodín `[*]` expande los elementos de la lista.

**🤔 Pregunta(s) socrática(s)**

- ¿Cómo añadirías soporte para filtros como `$.users[?(@.age > 30)]`?
- ¿Qué pasa si la ruta contiene puntos en los nombres de las llaves?

## Paso 4: Implementa la conversión de formatos

Convertir entre JSON, YAML y TOML ahorra saltar manualmente entre herramientas.

### 4.1 Crea el conversor

**👟 Pista inicial :** Crea `json_knife/converter.py`.

```python
# json_knife/converter.py
import json, yaml, tomli

def convert_to_json(data: str, from_format: str) -> dict:
    if from_format == "yaml":
        return yaml.safe_load(data)
    elif from_format == "toml":
        return tomli.loads(data)
    elif from_format == "json":
        return json.loads(data)
    raise ValueError(f"Unknown format: {from_format}")

def convert_from_json(data: dict, to_format: str) -> str:
    if to_format == "yaml":
        return yaml.dump(data, default_flow_style=False, allow_unicode=True)
    elif to_format == "toml":
        import tomli_w
        return tomli_w.dumps(data)
    elif to_format == "json":
        return json.dumps(data, indent=2, ensure_ascii=False)
    raise ValueError(f"Unknown format: {to_format}")
```

**🎯 Resultado esperado :** Convertir JSON a YAML y de vuelta produce datos equivalentes.

**🩹 Si sale mal :** Si la conversión a TOML falla, asegúrate de haber instalado `tomli-w` para escribir.

### 4.2 Verifica el conversor

**✅ Lista de verificación**

- ✅ JSON → YAML conserva los tipos de datos.
- ✅ YAML → JSON hace un viaje de ida y vuelta correctamente.
- ✅ TOML ↔ JSON funciona para estructuras simples.

**🤔 Pregunta(s) socrática(s)**

- ¿Qué tipos de datos puede representar TOML que JSON no pueda (y viceversa)?

## ⚠️ Errores comunes

- **Inyección de rutas en las consultas.** Analiza siempre las rutas con una expresión regular o un tokenizador; nunca pases cadenas crudas a `eval()` ni a acceso dinámico de atributos.
- **La coerción de tipos predeterminada de YAML.** YAML convierte silenciosamente `yes` en `True` y `1.0` en un flotante. Usa `yaml.safe_load()` y nunca `yaml.load()` con entrada no confiable.
- **TOML solo soporta diccionarios.** Los arreglos de nivel superior no son TOML válido. Convertir un arreglo JSON a TOML requiere envolverlo en un dict.
- **Streaming para archivos grandes.** Las cuatro características cargan todo el archivo en memoria. Para archivos JSON de 100MB+, usa `ijson` para consultas en streaming.
- **Argumentos de Click vs opciones.** Usa argumentos para el archivo de entrada (posicional, requerido) y opciones para banderas como `--indent` y `--output-format`. Esto coincide con las expectativas de los usuarios.

## Lo que acabas de construir

Una sola herramienta CLI que maneja las cuatro operaciones JSON más comunes: formateo, validación, consulta y conversión de formatos. El motor de consultas por notación de punto recorre las estructuras anidadas de forma recursiva y expande los comodines. La conversión de formatos une JSON, YAML y TOML para los flujos de trabajo de canalización de datos. Esta herramienta resuelve un dolor real de los desarrolladores — todos los equipos tienen a alguien que sigue ejecutando `python -m json.tool` y deseando que hiciera más.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/json-swiss-army-knife/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/json-swiss-army-knife) en el repositorio del curso tiene una versión más rica con consultas en streaming, diff de JSON, validación de esquema y el CLI conectado de principio a fin. Clónalo, o abre el repositorio completo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde allí.
:::

## A dónde ir desde aquí

- Añade análisis JSON en streaming con `ijson` para poder consultar archivos de varios GB sin cargarlos en memoria.
- Implementa diff de JSON entre dos archivos, mostrando las llaves añadidas, eliminadas y cambiadas.
- Añade una bandera `--jq` que acepte expresiones JQ reales, no solo notación de punto.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa y apta para principiantes sobre cómo añadir el tuyo mediante una **pull request**, incluso si nunca has usado git: hacer un fork del repositorio, crear una rama, hacer commit de tus archivos y abrir la PR, paso a paso. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓