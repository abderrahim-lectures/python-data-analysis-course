---
title: "Almacén de Features"
description: "Repositorio centralizado de features para ML con versionado, compartición y servicio online/offline."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["ml", "data-pipeline", "database"]
learningObjectives:
  - "Diseñar un registro de features con metadatos versionados"
  - "Calcular features desde datos crudos y persistirlas en un almacén local"
  - "Servir features por búsqueda de clave en el momento para entrenamiento e inferencia"
  - "Exponer una CLI simple para registrar, calcular y obtener features"
prerequisites: ["Python 101", "Análisis de Datos"]
---

# 🗄️ Almacén de Features

Los modelos de machine learning se rompen cuando el código que calcula features durante el entrenamiento se desvía del código que las calcula en producción. Un almacén de features arregla esto calculando las features una vez, versionándolas, y sirviendo los mismos valores ya sea que estés ajustando un modelo o puntuando una solicitud. Este proyecto construye un almacén de features ligero y respaldado por archivos con una CLI: registras definiciones de features, las calculas desde datos crudos, y las obtienes por clave de entidad con corrección en el tiempo.

Esto asume Python 101 y comodidad con pandas de Análisis de Datos — nada más allá. Opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Configurar un pequeño proyecto con `uv` e instalar las dependencias que necesitarás.
2. Definir un registro de features que almacene nombres, versiones y descripciones de fuente de features como JSON.
3. Escribir una función de cálculo de features que transforme datos crudos en un DataFrame reutilizable.
4. Persistir las features calculadas en un almacén local de Parquet con snapshots versionados.
5. Obtener features por clave de entidad con corrección en el tiempo para que entrenar nunca vea datos futuros.
6. Conectarlo todo en una CLI que registra, calcula y obtiene desde la línea de comandos.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal aquí — este proyecto lee y escribe archivos en disco (snapshots de Parquet, un registro JSON), lo que funciona de forma más natural fuera de un notebook.

**Google Colab, Kaggle Notebooks y Binder** funcionan bien para probar la herramienta. El notebook instala las mismas dependencias y usa el mismo código; el almacenamiento respaldado por archivos funciona en el sistema de archivos efímero de un notebook durante la sesión.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/feature-store/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/feature-store/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffeature-store%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes de construir: un entorno de Python, dos paquetes y un directorio de proyecto pequeño.

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
uv init feature-store
cd feature-store
uv add pandas pyarrow click
```

`pandas` maneja el cálculo de features, `pyarrow` nos permite escribir y leer archivos Parquet de forma eficiente, y `click` construye la interfaz CLI. Aquí no se necesita `python-dotenv` porque no hay claves de API involucradas.

### Crea la estructura del proyecto

```bash
mkdir -p store
touch store/__init__.py store/registry.py store/compute.py store/io.py store/cli.py
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `feature-store/` existe con un `pyproject.toml`, y `pandas`, `pyarrow` y `click` están instalados.
- ✅ El directorio `store/` tiene `__init__.py`, `registry.py`, `compute.py`, `io.py` y `cli.py`.

## Paso 1: Define el registro de features

Un registro de features es el catálogo de todo lo que tu almacén sabe calcular. Cada entrada registra el nombre de la feature, su versión, una descripción legible para humanos y la clave de entidad sobre la que está claveada. Mantenerlo como un archivo JSON simple significa que puedes inspeccionarlo a mano, hacer diff entre versiones y cargarlo rápido.

### 1.1 Escribe el esquema del registro

**👟 Pista inicial :** Crea un dataclass `Feature` y una clase `Registry` que cargue y guarde un archivo JSON.

```python
# store/registry.py
import json
from dataclasses import dataclass, asdict
from pathlib import Path

REGISTRY_PATH = Path("feature_registry.json")

@dataclass
class Feature:
    name: str
    version: int
    description: str
    entity_key: str  # the column used to look up this feature

class Registry:
    def __init__(self, path: Path = REGISTRY_PATH):
        self.path = path
        self.features: dict[str, Feature] = {}
        if path.exists():
            self._load()

    def _load(self):
        raw = json.loads(self.path.read_text())
        for entry in raw:
            feat = Feature(**entry)
            self.features[feat.name] = feat

    def register(self, name: str, version: int, description: str, entity_key: str):
        feat = Feature(name, version, description, entity_key)
        self.features[name] = feat
        self._save()

    def _save(self):
        data = [asdict(f) for f in self.features.values()]
        self.path.write_text(json.dumps(data, indent=2))
```

El registro es un diccionario claveado por nombre de feature, respaldado por un archivo JSON plano. Cada `Feature` lleva un entero `version` para que puedas avanzar sin destruir definiciones viejas. El campo `entity_key` registra qué columna sirve como clave de búsqueda — esto importa después al obtener features para una entidad específica.

**🎯 Resultado esperado :** `Registry().register("avg_order_value", 1, "Mean order value", "user_id")` crea un archivo `feature_registry.json` que contiene una entrada con los cuatro campos.

**🩹 Si sale mal :** Si el archivo JSON no aparece, `self._save()` puede no estarse llamando después de `register()`. Si cargar un archivo corrupto lanza un error confuso, agrega un `try/except json.JSONDecodeError` alrededor de `_load()` e imprime un mensaje claro.

### 1.2 Verifica el round-trip del registro

```python
# Quick smoke test
from store.registry import Registry

reg = Registry()
reg.register("avg_order_value", 1, "Mean order value per user", "user_id")
reg2 = Registry()  # re-load from disk
assert reg2.features["avg_order_value"].version == 1
```

Recargar el registro desde disco debería producir el mismo `Feature` que acabas de registrar — esto confirma que el round-trip JSON funciona de punta a punta.

**🎯 Resultado esperado :** La aserción pasa silenciosamente; `feature_registry.json` contiene la entrada registrada.

**🩹 Si sale mal :** Si `reg2` está vacío, la ruta de `_load()` no está ejecutándose — verifica que `self.path.exists()` devuelve `True` al cargar.

### 1.3 Verifica el registro

**✅ Lista de verificación**

- ✅ `Registry().register(...)` crea un archivo `feature_registry.json` con los campos correctos.
- ✅ Recargar un `Registry()` desde la misma ruta devuelve los mismos datos de feature.
- ✅ Dos features con nombres distintos pueden coexistir en el mismo archivo de registro.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué usar un entero de versión en lugar de sobrescribir la definición de la feature en su lugar? ¿Qué se rompe si siempre mutas la última versión?
- El registro almacena metadatos de features pero no los valores calculados. ¿Qué ventaja te da separar los metadatos de los datos cuando después agregas un segundo backend de almacenamiento?

## Paso 2: Calcula features desde datos crudos

Ahora que el registro sabe *qué* features existen, necesitas código que las *calcule* desde datos crudos. Una función de cálculo de features toma un DataFrame crudo y devuelve un DataFrame nuevo con la feature calculada como columna, unida por la clave de entidad.

### 2.1 Escribe la primera función de cálculo

**👟 Pista inicial :** Escribe una función que agrupe datos crudos de transacciones por `user_id` y calcule el valor promedio de pedido.

```python
# store/compute.py
import pandas as pd

def compute_avg_order_value(transactions: pd.DataFrame) -> pd.DataFrame:
    """Compute the average order value per user from a transactions DataFrame."""
    return (
        transactions
        .groupby("user_id")["amount"]
        .mean()
        .reset_index(name="avg_order_value")
    )
```

El cálculo es un solo `groupby` + `mean` de pandas — el mismo patrón que usarías en cualquier análisis de datos. La función devuelve un DataFrame con exactamente dos columnas: la clave de entidad (`user_id`) y el valor de la feature (`avg_order_value`). Esta forma de dos columnas es el formato de salida estándar que toda función de cálculo debería seguir.

**🎯 Resultado esperado :** Dado un DataFrame con las columnas `user_id` y `amount`, la función devuelve un DataFrame con las columnas `user_id` y `avg_order_value` donde cada fila es la media de un usuario.

**🩹 Si sale mal :** Si la salida tiene columnas extra, el `groupby` está seleccionando demasiado. Si el índice se ve mal, asegúrate de que `.reset_index(name="avg_order_value")` está encadenado.

### 2.2 Agrega una segunda función de cálculo

```python
# store/compute.py (continued)
def compute_purchase_count(transactions: pd.DataFrame) -> pd.DataFrame:
    """Compute the total number of purchases per user."""
    return (
        transactions
        .groupby("user_id")
        .size()
        .reset_index(name="purchase_count")
    )
```

Agregar una segunda función confirma el patrón: cada cálculo es una función independiente que toma datos crudos y devuelve un DataFrame de dos columnas claveado por la entidad.

**🎯 Resultado esperado :** `compute_purchase_count(df)` devuelve un DataFrame con las columnas `user_id` y `purchase_count`.

**🩹 Si sale mal :** Si `.size()` devuelve una Serie en lugar de un DataFrame, olvidaste `.reset_index(name="purchase_count")`.

### 2.3 Verifica los cálculos

**✅ Lista de verificación**

- ✅ `compute_avg_order_value(df)` devuelve un DataFrame de dos columnas con `user_id` y `avg_order_value`.
- ✅ `compute_purchase_count(df)` devuelve un DataFrame de dos columnas con `user_id` y `purchase_count`.
- ✅ Ambas funciones funcionan sobre el mismo DataFrame de entrada sin modificarlo.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué imponer una salida de dos columnas (clave de entidad + valor de feature) en lugar de devolver una Serie o un dict? ¿Cómo simplifica esa forma los pasos de almacenamiento y recuperación?
- ¿Qué pasa si dos tablas crudas distintas comparten la misma clave de entidad pero tienen tipos de entidad diferentes — digamos `user_id` en órdenes y `product_id` en inventario?

## Paso 3: Persiste features en Parquet con snapshots versionados

Las features calculadas necesitan aterrizar en disco para poder obtenerse después. Parquet es el formato correcto aquí: es columnar, rápido de leer, y pandas lo escribe con una sola llamada de función. Cada versión de una feature recibe su propio archivo, así que obtener "versión 1" significa leer un archivo específico.

### 3.1 Escribe la capa de persistencia

**👟 Pista inicial :** Crea `store/io.py` con funciones para escribir un DataFrame en un archivo Parquet versionado y leerlo de vuelta.

```python
# store/io.py
import pandas as pd
from pathlib import Path

STORE_DIR = Path("feature_store_data")

def save_features(feature_name: str, version: int, df: pd.DataFrame):
    """Write a feature DataFrame to a versioned Parquet file."""
    STORE_DIR.mkdir(exist_ok=True)
    path = STORE_DIR / f"{feature_name}_v{version}.parquet"
    df.to_parquet(path, index=False)

def load_features(feature_name: str, version: int) -> pd.DataFrame:
    """Read a feature DataFrame from a versioned Parquet file."""
    path = STORE_DIR / f"{feature_name}_v{version}.parquet"
    return pd.read_parquet(path)
```

La convención de nombres de archivo `{name}_v{version}.parquet` es simple y legible para humanos. `mkdir(exist_ok=True)` significa que la función funciona en la primera ejecución sin un paso de configuración separado. Escribir con `index=False` mantiene limpio el archivo Parquet — la clave de entidad es una columna regular, no un índice, lo que simplifica las uniones posteriores.

**🎯 Resultado esperado :** `save_features("avg_order_value", 1, df)` crea `feature_store_data/avg_order_value_v1.parquet`, y `load_features("avg_order_value", 1)` devuelve un DataFrame idéntico.

**🩹 Si sale mal :** Si `load_features` lanza `FileNotFoundError`, la ruta del archivo no coincide — verifica que `STORE_DIR` y el patrón de nombres son consistentes entre guardar y cargar. Si el DataFrame cargado tiene una columna extra `__index_level_0__`, guardaste con `index=True` en lugar de `False`.

### 3.2 Verifica el round-trip

```python
# Quick round-trip test
import pandas as pd
from store.io import save_features, load_features

df = pd.DataFrame({"user_id": [1, 2], "avg_order_value": [45.0, 82.5]})
save_features("avg_order_value", 1, df)
loaded = pd.read_parquet("feature_store_data/avg_order_value_v1.parquet")
assert loaded.equals(df)
```

El archivo guardado debería leerse de vuelta como un DataFrame idéntico. Esta prueba de round-trip detecta pronto desajustes de formato, problemas de índice e inconsistencias de ruta.

**🎯 Resultado esperado :** La aserción pasa; el archivo Parquet existe en disco con el tamaño correcto.

**🩹 Si sale mal :** Si la aserción falla, verifica un desajuste de versión de pandas o una columna de índice no deseada.

### 3.3 Verifica la persistencia

**✅ Lista de verificación**

- ✅ `save_features` crea un archivo `.parquet` en `feature_store_data/`.
- ✅ `load_features` lee de vuelta un DataFrame idéntico desde ese archivo.
- ✅ Dos versiones distintas de la misma feature existen como archivos separados en disco.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué usar archivos separados por versión en lugar de un solo archivo con una columna `version`? ¿Qué compensación crea eso entre almacenamiento y velocidad de lectura?
- Parquet comprime los datos por columna. Para un almacén de features con muchas features por entidad, ¿por qué podría el almacenamiento columnar ser más rápido que el almacenamiento por filas como CSV?

## Paso 4: Obtén features por clave de entidad con corrección en el tiempo

La característica crítica de un almacén de features es la corrección en el tiempo: al entrenar un modelo sobre datos históricos, no debes filtrar valores de features futuros hacia el pasado. Este paso construye una función de obtención que lee un archivo de features versionado y filtra exactamente a las claves de entidad que solicitas.

### 4.1 Escribe la función de obtención

**👟 Pista inicial :** Crea `fetch_features` en `store/io.py` que cargue una feature versionada y filtre a las claves de entidad solicitadas.

```python
# store/io.py (continued)
def fetch_features(
    feature_name: str,
    version: int,
    entity_keys: list,
    key_column: str = "user_id",
) -> pd.DataFrame:
    """Fetch feature values for specific entity keys from a versioned snapshot."""
    df = load_features(feature_name, version)
    return df[df[key_column].isin(entity_keys)].reset_index(drop=True)
```

El filtro `isin` es la forma más simple de corrección en el tiempo: cargas un snapshot que se escribió en un momento específico, y obtienes solo las entidades que te importan. El parámetro `key_column` permite que esta función funcione para cualquier tipo de entidad, no solo `user_id`.

**🎯 Resultado esperado :** `fetch_features("avg_order_value", 1, [1, 3])` devuelve un DataFrame con solo las filas donde `user_id` es 1 o 3.

**🩹 Si sale mal :** Si el resultado incluye claves que no solicitaste, el nombre de la columna de filtro está mal. Si el resultado está vacío, las claves podrían no existir en el snapshot almacenado — verifica el número de versión.

### 4.2 Construye la fachada `FeatureStore`

```python
# store/io.py (continued)
class FeatureStore:
    """Convenience wrapper tying registry, computation, and storage together."""

    def __init__(self, registry: "Registry"):
        self.registry = registry

    def compute_and_store(self, name: str, raw_df: pd.DataFrame, compute_fn):
        """Register a feature, compute it, and persist the result."""
        feat = self.registry.features[name]
        df = compute_fn(raw_df)
        save_features(name, feat.version, df)
        return df

    def get(self, name: str, entity_keys: list, key_column: str = "user_id") -> pd.DataFrame:
        """Fetch feature values for specific entity keys."""
        feat = self.registry.features[name]
        return fetch_features(name, feat.version, entity_keys, key_column)
```

La fachada une las tres capas: `compute_and_store` llama a la función de cálculo y persiste el resultado bajo la versión del registro. `get` lee de vuelta la feature almacenada para entidades específicas. Esta separación de calcular, almacenar y obtener es la misma arquitectura que se usa en almacenes de features de producción — solo que es más pequeña aquí.

**🎯 Resultado esperado :** `store.get("avg_order_value", [1, 2])` devuelve un DataFrame de dos columnas con valores para esos dos usuarios.

**🩹 Si sale mal :** Si `get` lanza un `KeyError`, la feature no está en el registro — regístrala antes de obtenerla. Si el DataFrame devuelto tiene todas las filas en lugar de solo las claves solicitadas, verifica que `fetch_features` está filtrando, no devolviendo el DataFrame completo.

### 4.3 Verifica la obtención en el tiempo

**✅ Lista de verificación**

- ✅ `fetch_features` devuelve solo las claves de entidad solicitadas, no el DataFrame almacenado completo.
- ✅ `FeatureStore.get` lee la versión correcta desde el registro.
- ✅ Calcular y obtener la misma feature devuelve valores consistentes.

**🤔 Pregunta(s) socrática(s)**

- En un pipeline de ML real, podrías entrenar con datos de enero pero servir predicciones en marzo. ¿Cómo te ayuda el esquema de número de versión a servir al modelo entrenado en enero con los valores de features de enero, aunque ahora existan valores de marzo?
- ¿Qué se rompe si dos features comparten la misma columna de clave de entidad pero el cálculo de una feature agrupa por una columna distinta?

## Paso 5: Conéctalo todo en una CLI

Una CLI te permite registrar features, calcularlas y obtener resultados sin escribir scripts de Python. Este paso usa `click` para construir tres subcomandos.

### 5.1 Construye la CLI

**👟 Pista inicial :** Crea `store/cli.py` con los subcomandos `register`, `compute` y `fetch`.

```python
# store/cli.py
import click
import pandas as pd
from store.registry import Registry
from store.compute import compute_avg_order_value, compute_purchase_count
from store.io import FeatureStore

COMPUTE_MAP = {
    "avg_order_value": compute_avg_order_value,
    "purchase_count": compute_purchase_count,
}

@click.group()
def cli():
    """Feature Store CLI — register, compute, and fetch ML features."""
    pass

@cli.command()
@click.option("--name", required=True, help="Feature name")
@click.option("--version", default=1, help="Feature version")
@click.option("--description", default="", help="Human-readable description")
@click.option("--entity-key", default="user_id", help="Column to key on")
def register(name, version, description, entity_key):
    reg = Registry()
    reg.register(name, version, description, entity_key)
    click.echo(f"Registered '{name}' v{version}")

@cli.command()
@click.option("--name", required=True, help="Feature name to compute")
@click.option("--input", "input_file", required=True, help="Path to CSV input")
def compute(name, input_file):
    reg = Registry()
    store = FeatureStore(reg)
    fn = COMPUTE_MAP.get(name)
    if fn is None:
        click.echo(f"Unknown feature: {name}. Available: {list(COMPUTE_MAP)}")
        return
    df = pd.read_csv(input_file)
    result = store.compute_and_store(name, df, fn)
    click.echo(f"Computed {len(result)} rows for '{name}'")

@cli.command()
@click.option("--name", required=True, help="Feature name to fetch")
@click.option("--keys", required=True, help="Comma-separated entity keys")
@click.option("--key-column", default="user_id", help="Column to filter on")
def fetch(name, keys, key_column):
    reg = Registry()
    store = FeatureStore(reg)
    key_list = [int(k.strip()) for k in keys.split(",")]
    result = store.get(name, key_list, key_column)
    click.echo(result.to_string(index=False))

if __name__ == "__main__":
    cli()
```

El diccionario `COMPUTE_MAP` es la tabla de despacho: mapea nombres de features a sus funciones de cálculo. Agregar una feature nueva significa escribir una función de cálculo y agregar una línea a este mapa. La CLI es delgada — parsea argumentos, delega en el código de la biblioteca e imprime resultados — lo que facilita probar cada subcomando de forma independiente.

**🎯 Resultado esperado :** `uv run python -m store.cli register --name avg_order_value --version 1 --description "Mean order value" --entity-key user_id` imprime "Registered 'avg_order_value' v1" y crea el archivo de registro.

**🩹 Si sale mal :** Si `click` no puede encontrar el comando, puede que necesites `if __name__ == "__main__": cli()` al final. Si el comando compute falla con una feature faltante, regístrala primero.

### 5.2 Prueba de humo de punta a punta

```python
# Quick end-to-end test
import pandas as pd
from store.registry import Registry
from store.compute import compute_avg_order_value, compute_purchase_count
from store.io import FeatureStore

raw = pd.DataFrame({
    "user_id": [1, 1, 2, 2, 3],
    "amount": [10, 20, 30, 40, 50],
})
reg = Registry()
reg.register("avg_order_value", 1, "Mean order value per user", "user_id")
reg.register("purchase_count", 1, "Total purchases per user", "user_id")

store = FeatureStore(reg)
store.compute_and_store("avg_order_value", raw, compute_avg_order_value)
store.compute_and_store("purchase_count", raw, compute_purchase_count)

avg = store.get("avg_order_value", [1, 3])
cnt = store.get("purchase_count", [2])
print(avg)
print(cnt)
```

Esto ejecuta el pipeline completo: registrar, calcular, almacenar, obtener. Cada pieza se probó individualmente en pasos anteriores; esto confirma que funcionan juntas.

**🎯 Resultado esperado :** La tabla del valor promedio de pedido muestra `user_id 1` en `15.0` y `user_id 3` en `50.0`. El conteo de compras para `user_id 2` es `2`.

**🩹 Si sale mal :** Si los valores están mal, la función de cálculo puede no estar agrupando por la columna correcta. Si la obtención devuelve todas las filas, `fetch_features` no está filtrando por clave.

### 5.3 Verifica el pipeline de la CLI

**✅ Lista de verificación**

- ✅ `register` crea una entrada de registro; `compute` lee un CSV y persiste archivos Parquet; `fetch` imprime valores de features filtrados.
- ✅ Ejecutar los tres subcomandos en secuencia produce resultados consistentes.
- ✅ La CLI imprime mensajes de error útiles para features desconocidas o archivos faltantes.

**🤔 Pregunta(s) socrática(s)**

- La CLI despacha el cálculo de features vía un `COMPUTE_MAP` codificado. En un almacén de features real con docenas de features, ¿cómo evitarías editar este mapa cada vez que agregas una?
- Si quisieras agregar una bandera `--version` al comando `fetch`, ¿qué cambiaría sobre cómo se consulta el registro?

## ⚠️ Errores comunes

- **Calcular features sobre el dataset completo incluyendo filas futuras.** Al entrenar sobre datos históricos, tu DataFrame crudo debe filtrarse al periodo de entrenamiento *antes* de pasarlo a la función de cálculo. La corrección en el tiempo vive en los datos de entrada, no en la lógica de obtención del almacén de features.
- **Sobrescribir archivos de features sin versionar.** Si `save_features` escribe siempre en la misma ruta, pierdes la capacidad de servir versiones viejas. Incluye siempre el número de versión en el nombre del archivo y súbelo cuando la lógica de cálculo cambie.
- **Fuga de índice en los round-trips de Parquet.** Pandas escribe el índice del DataFrame a Parquet por defecto. Usa `index=False` al guardar y `reset_index(drop=True)` al obtener para mantener la clave de entidad como una columna simple, no un índice oculto.
- **Codificar el nombre de la columna de clave de entidad.** Diferentes features pueden estar claveadas por columnas distintas (`user_id`, `product_id`, `session_id`). El parámetro `key_column` existe por esta razón — no asumas que cada feature usa `user_id`.
- **Olvidar registrar antes de calcular.** `FeatureStore.compute_and_store` lee la versión del registro. Si la feature no está registrada, obtienes un `KeyError` — registra siempre primero.

## Lo que acabas de construir

Un almacén de features ligero pero real: un registro que cataloga definiciones de features con versionado, funciones de cálculo que transforman datos crudos en features reutilizables, persistencia respaldada por Parquet para snapshots versionados, y una CLI que une registrar-calcular-obtener en un solo pipeline. La arquitectura — separar metadatos, cálculo, almacenamiento y servicio — espeja cómo funcionan los almacenes de features de producción como Feast y Tecton, solo que con archivos en lugar de una base de datos distribuida.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/feature-store/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/feature-store) en el repositorio del curso tiene una versión más rica con más funciones de cálculo de features, un dataset de muestra en CSV y la CLI conectada de punta a punta. Clónalo, o abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Agrega una verificación de frescura que ponga marcas de tiempo a cada snapshot de features y alerte cuando los datos sean más viejos que un umbral configurable.
- Construye un subcomando `compare` que haga diff de dos versiones de la misma feature para detectar sesgo de entrenamiento-servicio.
- Integra con un script real de entrenamiento de modelos: obtén features para un conjunto de claves de entidad, pásalas a un modelo scikit-learn y evalúa si la deriva de versión cambia la precisión.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓