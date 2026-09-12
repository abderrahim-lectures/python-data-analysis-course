---
title: 'Herramienta de Hojas de Cálculo'
description: 'Construye una herramienta de procesamiento de hojas de cálculo en Python que pueda leer, transformar y exportar datos de CSV y Excel.'
difficulty: intermediate
estimatedMinutes: 120
learningObjectives:
  - Dominar el procesamiento de datos con pandas
  - Implementar transformaciones de datos flexibles
  - Crear un motor de fórmulas personalizado
  - Generar gráficos y visualizaciones
  - Construir una interfaz de línea de comandos completa
prerequisites:
  - Python a nivel intermedio
  - Conocimientos básicos de pandas
  - familiaridad con CSV y formatos de datos
  - Terminal yeditor de código
---

- **Ejecútalo en el navegador.** Hay un cuaderno interactivo listo, ábrelo en Colab, Kaggle o Binder y sigue los pasos en orden.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/spreadsheet-tool/notebook.es.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/spreadsheet-tool/notebook.es.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fspreadsheet-tool%2Fnotebook.es.ipynb)

## 🎯 Lo que harás

Vas a construir una herramienta completa de procesamiento de hojas de cálculo que pueda leer datos de CSV y Excel, aplicar transformaciones, ejecutar fórmulas y exportar resultados con gráficos.

**Objetivo principal:** Crear una herramienta CLI que procese hojas de cálculo de forma similar a Excel pero desde la terminal.

**Tu herramienta podrá:**

- **Leer archivos** CSV y Excel
- **Aplicar transformaciones** de datos flexibles
- **Ejecutar fórmulas** personalizadas
- **Generar gráficos** automáticamente
- **Exportar resultados** a múltiples formatos

Pasos:

- Paso 1: Diseña la arquitectura de la herramienta
- Paso 2: Implementa el lector de archivos
- Paso 3: Crea el motor de transformaciones
- Paso 4: Implementa el motor de fórmulas
- Paso 5: Agrega generación de gráficos
- Paso 6: Implementa el sistema de exportación
- Paso 7: Construye la interfaz de línea de comandos

Dónde ejecutar esto:

Trabaja desde la carpeta `projects/` de tu repo `pyda-course`.

## Configuración

1. Crea un entorno virtual:

```bash
cd projects/spreadsheet-tool
uv venv
source .venv/bin/activate
```

2. Instala las dependencias:

```bash
uv pip install pandas openpyxl matplotlib click rich
```

3. Verifica la instalación:

```bash
python -c "import pandas, openpyxl, matplotlib, click; print('Dependencias listas')"
```

---

## Paso 1: Diseña la arquitectura de la herramienta

Antes de escribir código, necesitas diseñar la estructura modular de la herramienta.

### 1.1 Crea la estructura del proyecto

```bash
mkdir -p src src/readers src/transformers src/formulas src/visualizers src/exporters
```

### 1.2 Crea el archivo de configuración

Crea `config.py`:

```python
from pathlib import Path

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
OUTPUT_DIR = BASE_DIR / "output"
CHARTS_DIR = BASE_DIR / "charts"

# Configuración de archivos
SUPPORTED_FORMATS = {
    "input": [".csv", ".xlsx", ".xls", ".tsv"],
    "output": [".csv", ".xlsx", ".json", ".html"],
}

# Configuración de procesamiento
MAX_ROWS = 1_000_000
CHUNK_SIZE = 10_000

# Configuración de visualización
DEFAULT_CHART_SIZE = (10, 6)
CHART_DPI = 100
```

### 1.3 Define el esquema de datos

```python
from dataclasses import dataclass
from typing import Any

@dataclass
class Spreadsheet:
    data: Any  # DataFrame de pandas
    filename: str
    sheet_name: str = None
    metadata: dict = None

    @property
    def shape(self) -> tuple:
        return self.data.shape

    @property
    def columns(self) -> list[str]:
        return list(self.data.columns)

    def head(self, n: int = 5):
        return self.data.head(n)

    def info(self) -> dict:
        return {
            "filename": self.filename,
            "shape": self.shape,
            "columns": self.columns,
            "dtypes": self.data.dtypes.to_dict(),
            "memory_usage": self.data.memory_usage(deep=True).sum(),
        }
```

### Verifica

- La estructura del proyecto está configurada
- Los directorios para cada componente existen
- El esquema de datos es claro

### Checklist

- [ ] Estructura de directorios creada
- [ ] Configuración de formatos soportados
- [ ] Esquema de Spreadsheet definido
- [ ] Directorios de salida configurados

---

## Paso 2: Implementa el lector de archivos

El lector debe soportar múltiples formatos de entrada y manejar diferentes encoding.

### 2.1 Crea el lector CSV

Crea `src/readers/csv_reader.py`:

```python
import pandas as pd
from pathlib import Path

class CSVReader:
    def __init__(self):
        self.supported_encodings = ["utf-8", "latin-1", "cp1252", "iso-8859-1"]

    def read(self, filepath: str, **kwargs) -> pd.DataFrame:
        """Lee un archivo CSV con manejo de encoding."""
        path = Path(filepath)

        if not path.exists():
            raise FileNotFoundError(f"Archivo no encontrado: {filepath}")

        # Intentar con diferentes encodings
        for encoding in self.supported_encodings:
            try:
                df = pd.read_csv(
                    filepath,
                    encoding=encoding,
                    **kwargs,
                )
                return df
            except (UnicodeDecodeError, pd.errors.ParserError):
                continue

        raise ValueError(f"No se pudo leer el archivo {filepath} con ningún encoding soportado")

    def read_with_dtypes(self, filepath: str, dtypes: dict = None) -> pd.DataFrame:
        """Lee CSV con tipos de datos personalizados."""
        return self.read(filepath, dtype=dtypes)

    def read_chunked(self, filepath: str, chunk_size: int = 10000) -> pd.DataFrame:
        """Lee CSV grandes por chunks."""
        chunks = []
        for chunk in pd.read_csv(filepath, chunksize=chunk_size):
            chunks.append(chunk)
        return pd.concat(chunks, ignore_index=True)

    def preview(self, filepath: str, n: int = 5) -> pd.DataFrame:
        """Vista previa de un archivo CSV."""
        return self.read(filepath, nrows=n)
```

### 2.2 Crea el lector Excel

```python
import pandas as pd
from pathlib import Path

class ExcelReader:
    def __init__(self):
        self.engine = "openpyxl"

    def read(self, filepath: str, sheet_name: str = None, **kwargs) -> pd.DataFrame:
        """Lee un archivo Excel."""
        path = Path(filepath)

        if not path.exists():
            raise FileNotFoundError(f"Archivo no encontrado: {filepath}")

        return pd.read_excel(
            filepath,
            sheet_name=sheet_name,
            engine=self.engine,
            **kwargs,
        )

    def read_all_sheets(self, filepath: str) -> dict[str, pd.DataFrame]:
        """Lee todas las hojas de un archivo Excel."""
        xls = pd.ExcelFile(filepath, engine=self.engine)
        sheets = {}

        for sheet_name in xls.sheet_names:
            sheets[sheet_name] = pd.read_excel(xls, sheet_name=sheet_name)

        return sheets

    def get_sheet_names(self, filepath: str) -> list[str]:
        """Retorna los nombres de las hojas."""
        xls = pd.ExcelFile(filepath, engine=self.engine)
        return xls.sheet_names

    def preview(self, filepath: str, sheet_name: str = None, n: int = 5) -> pd.DataFrame:
        """Vista previa de una hoja Excel."""
        return self.read(filepath, sheet_name=sheet_name, nrows=n)
```

### 2.3 Crea el lector unificado

```python
from pathlib import Path
from csv_reader import CSVReader
from excel_reader import ExcelReader

class SpreadsheetReader:
    def __init__(self):
        self.readers = {
            ".csv": CSVReader(),
            ".tsv": CSVReader(),
            ".xlsx": ExcelReader(),
            ".xls": ExcelReader(),
        }

    def read(self, filepath: str, **kwargs) -> pd.DataFrame:
        """Lee cualquier formato soportado."""
        path = Path(filepath)
        extension = path.suffix.lower()

        if extension not in self.readers:
            raise ValueError(f"Formato no soportado: {extension}")

        return self.readers[extension].read(filepath, **kwargs)

    def read_info(self, filepath: str) -> dict:
        """Obtiene información del archivo sin cargar todos los datos."""
        path = Path(filepath)
        extension = path.suffix.lower()

        if extension == ".csv":
            preview = CSVReader().preview(filepath)
        elif extension in [".xlsx", ".xls"]:
            reader = ExcelReader()
            preview = reader.preview(filepath)
            return {
                "filename": path.name,
                "format": extension,
                "sheets": reader.get_sheet_names(filepath),
                "preview": preview,
            }
        else:
            raise ValueError(f"Formato no soportado: {extension}")

        return {
            "filename": path.name,
            "format": extension,
            "preview": preview,
            "columns": list(preview.columns),
            "dtypes": preview.dtypes.to_dict(),
        }

    def list_formats(self) -> list[str]:
        """Retorna los formatos soportados."""
        return list(self.readers.keys())
```

### Verifica

- Los readers manejan diferentes encodings
- Los archivos Excel con múltiples hojas se leen correctamente
- La información del archivo se obtiene sin cargar todos los datos

### Checklist

- [ ] `CSVReader` maneja múltiples encodings
- [ ] `ExcelReader` lee hojas individuales y múltiples
- [ ] `SpreadsheetReader` unifica la interfaz
- [ ] `read_info` retorna metadata sin cargar todo

---

## Paso 3: Crea el motor de transformaciones

El motor de transformaciones permite modificar datos de forma flexible y encadenable.

### 3.1 Implementa transformaciones básicas

Crea `src/transformers/base.py`:

```python
import pandas as pd
from typing import Callable

class TransformationPipeline:
    def __init__(self):
        self.transformations = []

    def add(self, name: str, func: Callable, **kwargs):
        """Agrega una transformación al pipeline."""
        self.transformations.append({
            "name": name,
            "func": func,
            "kwargs": kwargs,
        })
        return self

    def apply(self, df: pd.DataFrame) -> pd.DataFrame:
        """Aplica todas las transformaciones en orden."""
        result = df.copy()

        for t in self.transformations:
            try:
                result = t["func"](result, **t["kwargs"])
            except Exception as e:
                print(f"Error en transformación '{t['name']}': {e}")
                raise

        return result

    def list_transformations(self) -> list[str]:
        """Lista las transformaciones disponibles."""
        return [t["name"] for t in self.transformations]

    def remove(self, name: str) -> bool:
        """Elimina una transformación por nombre."""
        for i, t in enumerate(self.transformations):
            if t["name"] == name:
                self.transformations.pop(i)
                return True
        return False
```

### 3.2 Implementa transformaciones comunes

```python
import pandas as pd
import numpy as np

class DataTransformer:
    def __init__(self):
        self.pipeline = TransformationPipeline()

    def rename_columns(self, df: pd.DataFrame, mapping: dict) -> pd.DataFrame:
        """Renombra columnas."""
        return df.rename(columns=mapping)

    def drop_columns(self, df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
        """Elimina columnas."""
        return df.drop(columns=columns, errors="ignore")

    def filter_rows(self, df: pd.DataFrame, condition: str) -> pd.DataFrame:
        """Filtra filas por condición."""
        return df.query(condition)

    def sort_by(self, df: pd.DataFrame, columns: list[str], ascending: bool = True) -> pd.DataFrame:
        """Ordena por columnas."""
        return df.sort_values(by=columns, ascending=ascending)

    def add_column(self, df: pd.DataFrame, name: str, expression: str) -> pd.DataFrame:
        """Agrega una columna calculada."""
        df[name] = df.eval(expression)
        return df

    def fill_missing(self, df: pd.DataFrame, method: str = "mean") -> pd.DataFrame:
        """Rellena valores faltantes."""
        if method == "mean":
            return df.fillna(df.mean(numeric_only=True))
        elif method == "median":
            return df.fillna(df.median(numeric_only=True))
        elif method == "mode":
            return df.fillna(df.mode().iloc[0])
        elif method == "ffill":
            return df.fillna(method="ffill")
        elif method == "bfill":
            return df.fillna(method="bfill")
        else:
            return df.fillna(method)

    def remove_duplicates(self, df: pd.DataFrame, subset: list[str] = None) -> pd.DataFrame:
        """Elimina filas duplicadas."""
        return df.drop_duplicates(subset=subset)

    def convert_types(self, df: pd.DataFrame, type_map: dict) -> pd.DataFrame:
        """Convierte tipos de columnas."""
        for col, dtype in type_map.items():
            if col in df.columns:
                df[col] = df[col].astype(dtype)
        return df

    def aggregate(self, df: pd.DataFrame, group_by: list[str], agg_map: dict) -> pd.DataFrame:
        """Agrupa y agrega datos."""
        return df.groupby(group_by).agg(agg_map).reset_index()

    def pivot(self, df: pd.DataFrame, index: str, columns: str, values: str) -> pd.DataFrame:
        """Crea una tabla pivote."""
        return df.pivot_table(index=index, columns=columns, values=values, aggfunc="mean")

    def melt(self, df: pd.DataFrame, id_vars: list[str], value_vars: list[str]) -> pd.DataFrame:
        """Convierte de formato ancho a largo."""
        return df.melt(id_vars=id_vars, value_vars=value_vars)
```

### Verifica

- El pipeline encadena transformaciones correctamente
- Las transformaciones manejan errores de forma robusta
- Los tipos de datos se convierten correctamente

### Checklist

- [ ] `TransformationPipeline` encadena operaciones
- [ ] `DataTransformer` implementa transformaciones comunes
- [ ] Las transformaciones manejan valores faltantes
- [ ] La agrupación y pivoteo funcionan

---

## Paso 4: Implementa el motor de fórmulas

El motor de fórmulas permite crear columnas calculadas con expresiones flexibles.

### 4.1 Crea el evaluador de fórmulas

Crea `src/formulas/engine.py`:

```python
import pandas as pd
import numpy as np
import re
from typing import Any

class FormulaEngine:
    def __init__(self):
        self.functions = {
            "SUM": lambda x: x.sum(),
            "MEAN": lambda x: x.mean(),
            "MEDIAN": lambda x: x.median(),
            "STD": lambda x: x.std(),
            "MIN": lambda x: x.min(),
            "MAX": lambda x: x.max(),
            "COUNT": lambda x: x.count(),
            "ABS": lambda x: abs(x),
            "ROUND": lambda x, n=0: round(x, n),
            "IF": lambda condition, true_val, false_val: true_val if condition else false_val,
        }

    def evaluate(self, df: pd.DataFrame, formula: str) -> pd.Series:
        """Evalúa una fórmula en un DataFrame."""
        try:
            # Reemplazar referencias a columnas
            processed = self._process_references(df, formula)

            # Evaluar la expresión
            result = df.eval(processed)

            return result
        except Exception as e:
            raise ValueError(f"Error evaluando fórmula '{formula}': {e}")

    def _process_references(self, df: pd.DataFrame, formula: str) -> str:
        """Procesa referencias a columnas en la fórmula."""
        # Reemplazar nombres de columnas entre corchetes
        def replace_column(match):
            col_name = match.group(1)
            if col_name in df.columns:
                return f"`{col_name}`"
            return match.group(0)

        return re.sub(r"\[([^\]]+)\]", replace_column, formula)

    def add_function(self, name: str, func):
        """Agrega una función personalizada."""
        self.functions[name.upper()] = func

    def list_functions(self) -> list[str]:
        """Lista las funciones disponibles."""
        return list(self.functions.keys())

    def create_calculated_column(self, df: pd.DataFrame, name: str, formula: str) -> pd.DataFrame:
        """Crea una columna calculada."""
        df[name] = self.evaluate(df, formula)
        return df

    def apply_formula_to_column(self, df: pd.DataFrame, column: str, formula: str) -> pd.Series:
        """Aplica una fórmula a una columna específica."""
        if column not in df.columns:
            raise ValueError(f"Columna '{column}' no encontrada")

        # Reemplazar $ en la fórmula con la columna
        processed_formula = formula.replace("$", column)
        return self.evaluate(df, processed_formula)
```

### 4.2 Implementa fórmulas avanzadas

```python
class AdvancedFormulaEngine(FormulaEngine):
    def __init__(self):
        super().__init__()
        self._register_advanced_functions()

    def _register_advanced_functions(self):
        """Registra funciones avanzadas."""
        self.functions.update({
            "PERCENTILE": lambda x, p: np.percentile(x, p),
            "QUANTILE": lambda x, q: np.quantile(x, q),
            "ZSCORE": lambda x: (x - x.mean()) / x.std(),
            "NORMALIZE": lambda x: (x - x.min()) / (x.max() - x.min()),
            "LAG": lambda x, n=1: x.shift(n),
            "LEAD": lambda x, n=1: x.shift(-n),
            "ROLLING_MEAN": lambda x, window=3: x.rolling(window=window).mean(),
            "ROLLING_STD": lambda x, window=3: x.rolling(window=window).std(),
            "CUMSUM": lambda x: x.cumsum(),
            "CUMPROD": lambda x: x.cumprod(),
            "DIFF": lambda x, n=1: x.diff(n),
            "PCT_CHANGE": lambda x, n=1: x.pct_change(n),
        })

    def rolling_operation(self, df: pd.DataFrame, column: str, operation: str,
                          window: int = 3) -> pd.Series:
        """Realiza operaciones rolling en una columna."""
        if column not in df.columns:
            raise ValueError(f"Columna '{column}' no encontrada")

        col = df[column]
        operations = {
            "mean": lambda x: x.rolling(window=window).mean(),
            "std": lambda x: x.rolling(window=window).std(),
            "min": lambda x: x.rolling(window=window).min(),
            "max": lambda x: x.rolling(window=window).max(),
            "sum": lambda x: x.rolling(window=window).sum(),
        }

        if operation not in operations:
            raise ValueError(f"Operación '{operation}' no soportada")

        return operations[operation](col)

    def window_function(self, df: pd.DataFrame, column: str, func, window: int = 3) -> pd.Series:
        """Aplica una función de ventana personalizada."""
        return df[column].rolling(window=window).apply(func, raw=True)
```

### Verifica

- Las fórmulas se evalúan correctamente
- Las referencias a columnas se procesan
- Las funciones avanzadas funcionan

### Checklist

- [ ] `FormulaEngine` evalúa fórmulas básicas
- [ ] Las referencias a columnas se procesan correctamente
- [ ] `AdvancedFormulaEngine` agrega funciones rolling
- [ ] Las funciones personalizadas se pueden agregar

---

## Paso 5: Agrega generación de gráficos

El sistema debe generar gráficos automáticamente basándose en los datos.

### 5.1 Crea el generador de gráficos

Crea `src/visualizers/chart_generator.py`:

```python
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use("Agg")  # Backend no interactivo
import pandas as pd
import numpy as np
from pathlib import Path
from config import DEFAULT_CHART_SIZE, CHART_DPI, CHARTS_DIR

class ChartGenerator:
    def __init__(self):
        self.default_style = "seaborn-v0_8-darkgrid"

    def bar_chart(self, df: pd.DataFrame, x: str, y: str, title: str = None,
                  output_path: str = None) -> str:
        """Genera un gráfico de barras."""
        fig, ax = plt.subplots(figsize=DEFAULT_CHART_SIZE)

        df.plot(kind="bar", x=x, y=y, ax=ax, color="#3498db")

        ax.set_title(title or f"{y} por {x}")
        ax.set_xlabel(x)
        ax.set_ylabel(y)
        plt.xticks(rotation=45, ha="right")
        plt.tight_layout()

        if output_path:
            plt.savefig(output_path, dpi=CHART_DPI, bbox_inches="tight")
            plt.close()
            return output_path

        return self._save_default(fig, "bar_chart")

    def line_chart(self, df: pd.DataFrame, x: str, y: str, title: str = None,
                   output_path: str = None) -> str:
        """Genera un gráfico de líneas."""
        fig, ax = plt.subplots(figsize=DEFAULT_CHART_SIZE)

        ax.plot(df[x], df[y], marker="o", color="#2ecc71", linewidth=2)

        ax.set_title(title or f"Tendencia de {y}")
        ax.set_xlabel(x)
        ax.set_ylabel(y)
        ax.grid(True, alpha=0.3)
        plt.tight_layout()

        if output_path:
            plt.savefig(output_path, dpi=CHART_DPI, bbox_inches="tight")
            plt.close()
            return output_path

        return self._save_default(fig, "line_chart")

    def pie_chart(self, df: pd.DataFrame, labels: str, values: str, title: str = None,
                  output_path: str = None) -> str:
        """Genera un gráfico de pastel."""
        fig, ax = plt.subplots(figsize=DEFAULT_CHART_SIZE)

        colors = plt.cm.Set3(np.linspace(0, 1, len(df)))
        ax.pie(df[values], labels=df[labels], autopct="%1.1f%%", colors=colors)

        ax.set_title(title or f"Distribución de {values}")
        plt.tight_layout()

        if output_path:
            plt.savefig(output_path, dpi=CHART_DPI, bbox_inches="tight")
            plt.close()
            return output_path

        return self._save_default(fig, "pie_chart")

    def scatter_plot(self, df: pd.DataFrame, x: str, y: str, title: str = None,
                     color_by: str = None, output_path: str = None) -> str:
        """Genera un gráfico de dispersión."""
        fig, ax = plt.subplots(figsize=DEFAULT_CHART_SIZE)

        if color_by and color_by in df.columns:
            for category in df[color_by].unique():
                mask = df[color_by] == category
                ax.scatter(df[mask][x], df[mask][y], label=category, alpha=0.6)
            ax.legend()
        else:
            ax.scatter(df[x], df[y], color="#e74c3c", alpha=0.6)

        ax.set_title(title or f"{y} vs {x}")
        ax.set_xlabel(x)
        ax.set_ylabel(y)
        ax.grid(True, alpha=0.3)
        plt.tight_layout()

        if output_path:
            plt.savefig(output_path, dpi=CHART_DPI, bbox_inches="tight")
            plt.close()
            return output_path

        return self._save_default(fig, "scatter_plot")

    def histogram(self, df: pd.DataFrame, column: str, bins: int = 30,
                  title: str = None, output_path: str = None) -> str:
        """Genera un histograma."""
        fig, ax = plt.subplots(figsize=DEFAULT_CHART_SIZE)

        df[column].hist(bins=bins, ax=ax, color="#9b59b6", alpha=0.7, edgecolor="black")

        ax.set_title(title or f"Distribución de {column}")
        ax.set_xlabel(column)
        ax.set_ylabel("Frecuencia")
        plt.tight_layout()

        if output_path:
            plt.savefig(output_path, dpi=CHART_DPI, bbox_inches="tight")
            plt.close()
            return output_path

        return self._save_default(fig, "histogram")

    def heatmap(self, df: pd.DataFrame, title: str = None, output_path: str = None) -> str:
        """Genera un mapa de calor de correlaciones."""
        fig, ax = plt.subplots(figsize=DEFAULT_CHART_SIZE)

        corr = df.select_dtypes(include=[np.number]).corr()
        im = ax.imshow(corr, cmap="coolwarm", aspect="auto")

        ax.set_xticks(range(len(corr.columns)))
        ax.set_yticks(range(len(corr.columns)))
        ax.set_xticklabels(corr.columns, rotation=45, ha="right")
        ax.set_yticklabels(corr.columns)

        plt.colorbar(im)
        ax.set_title(title or "Mapa de Calor de Correlaciones")
        plt.tight_layout()

        if output_path:
            plt.savefig(output_path, dpi=CHART_DPI, bbox_inches="tight")
            plt.close()
            return output_path

        return self._save_default(fig, "heatmap")

    def _save_default(self, fig, chart_type: str) -> str:
        """Guarda el gráfico con nombre por defecto."""
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{chart_type}_{timestamp}.png"
        output_path = CHARTS_DIR / filename

        plt.savefig(output_path, dpi=CHART_DPI, bbox_inches="tight")
        plt.close()

        return str(output_path)

    def auto_chart(self, df: pd.DataFrame) -> list[str]:
        """Genera gráficos automáticamente basándose en los datos."""
        charts = []

        # Histogramas para columnas numéricas
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols[:3]:
            path = self.histogram(df, col, title=f"Distribución de {col}")
            charts.append(path)

        # Gráfico de barras para categóricas
        categorical_cols = df.select_dtypes(include=["object"]).columns
        if len(categorical_cols) > 0 and len(numeric_cols) > 0:
            cat_col = categorical_cols[0]
            num_col = numeric_cols[0]
            summary = df.groupby(cat_col)[num_col].mean().reset_index()
            path = self.bar_chart(summary, cat_col, num_col,
                                  title=f"Promedio de {num_col} por {cat_col}")
            charts.append(path)

        # Gráfico de correlación si hay múltiples numéricas
        if len(numeric_cols) >= 2:
            path = self.heatmap(df, title="Correlaciones")
            charts.append(path)

        return charts
```

### Verifica

- Los gráficos se generan correctamente
- Los gráficos automáticos son útiles
- Los archivos se guardan en el directorio correcto

### Checklist

- [ ] `ChartGenerator` genera múltiples tipos de gráfico
- [ ] Los gráficos tienen títulos y etiquetas
- [ ] `auto_chart` genera gráficos automáticos
- [ ] Los archivos se guardan en `charts/`

---

## Paso 6: Implementa el sistema de exportación

El sistema debe exportar datos a múltiples formatos de salida.

### 6.1 Crea los exportadores

Crea `src/exporters/base.py`:

```python
import pandas as pd
from pathlib import Path
from datetime import datetime

class BaseExporter:
    def __init__(self):
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    def generate_filename(self, base_name: str, extension: str) -> str:
        """Genera nombre de archivo con timestamp."""
        return f"{base_name}_{self.timestamp}{extension}"

class CSVExporter(BaseExporter):
    def export(self, df: pd.DataFrame, output_path: str = None, **kwargs) -> str:
        """Exporta DataFrame a CSV."""
        if output_path is None:
            output_path = self.generate_filename("export", ".csv")

        df.to_csv(output_path, index=False, **kwargs)
        return output_path

class ExcelExporter(BaseExporter):
    def export(self, df: pd.DataFrame, output_path: str = None,
               sheet_name: str = "Sheet1", **kwargs) -> str:
        """Exporta DataFrame a Excel."""
        if output_path is None:
            output_path = self.generate_filename("export", ".xlsx")

        df.to_excel(output_path, index=False, sheet_name=sheet_name, **kwargs)
        return output_path

    def export_multiple_sheets(self, sheets: dict[str, pd.DataFrame],
                               output_path: str = None) -> str:
        """Exporta múltiples hojas a Excel."""
        if output_path is None:
            output_path = self.generate_filename("export", ".xlsx")

        with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
            for name, df in sheets.items():
                df.to_excel(writer, sheet_name=name, index=False)

        return output_path

class JSONExporter(BaseExporter):
    def export(self, df: pd.DataFrame, output_path: str = None, **kwargs) -> str:
        """Exporta DataFrame a JSON."""
        if output_path is None:
            output_path = self.generate_filename("export", ".json")

        df.to_json(output_path, orient="records", force_ascii=False, indent=2, **kwargs)
        return output_path

class HTMLExporter(BaseExporter):
    def export(self, df: pd.DataFrame, output_path: str = None,
               title: str = "Datos Exportados", **kwargs) -> str:
        """Exporta DataFrame a HTML."""
        if output_path is None:
            output_path = self.generate_filename("export", ".html")

        html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{ font-family: system-ui, sans-serif; margin: 20px; }}
        table {{ border-collapse: collapse; width: 100%; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f2f2f2; }}
        tr:nth-child(even) {{ background-color: #f9f9f9; }}
    </style>
</head>
<body>
    <h1>{title}</h1>
    {df.to_html(index=False)}
</body>
</html>"""

        Path(output_path).write_text(html, encoding="utf-8")
        return output_path
```

### 6.2 Crea el exportador unificado

```python
from csv_exporter import CSVExporter
from excel_exporter import ExcelExporter
from json_exporter import JSONExporter
from html_exporter import HTMLExporter

class SpreadsheetExporter:
    def __init__(self):
        self.exporters = {
            ".csv": CSVExporter(),
            ".xlsx": ExcelExporter(),
            ".json": JSONExporter(),
            ".html": HTMLExporter(),
        }

    def export(self, df: pd.DataFrame, format: str = ".csv", **kwargs) -> str:
        """Exporta DataFrame al formato especificado."""
        if format not in self.exporters:
            raise ValueError(f"Formato no soportado: {format}")

        return self.exporters[format].export(df, **kwargs)

    def export_multiple(self, data: dict[str, pd.DataFrame], format: str = ".csv") -> dict[str, str]:
        """Exporta múltiples DataFrames."""
        results = {}
        for name, df in data.items():
            results[name] = self.export(df, format)
        return results

    def list_formats(self) -> list[str]:
        """Retorna los formatos de exportación soportados."""
        return list(self.exporters.keys())
```

### Verifica

- Cada exportador genera archivos válidos
- Los archivos se guardan en el formato correcto
- La exportación múltiple funciona

### Checklist

- [ ] `CSVExporter` exporta a CSV correctamente
- [ ] `ExcelExporter` exporta a Excel con hojas múltiples
- [ ] `JSONExporter` exporta a JSON estructurado
- [ ] `HTMLExporter` genera HTML con estilos
- [ ] `SpreadsheetExporter` unifica la interfaz

---

## Paso 7: Construye la interfaz de línea de comandos

El último paso es crear una CLI completa para usar la herramienta.

### 7.1 Implementa la CLI

Crea `cli.py`:

```python
import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from pathlib import Path

from src.readers.spreadsheet_reader import SpreadsheetReader
from src.transformers.base import DataTransformer
from src.formulas.engine import AdvancedFormulaEngine
from src.visualizers.chart_generator import ChartGenerator
from src.exporters.base import SpreadsheetExporter

console = Console()
reader = SpreadsheetReader()
transformer = DataTransformer()
formula_engine = AdvancedFormulaEngine()
chart_gen = ChartGenerator()
exporter = SpreadsheetExporter()

@click.group()
def cli():
    """📊 SpreadsheetTool - Procesamiento de hojas de cálculo"""
    pass

@cli.command()
@click.argument("filepath")
def info(filepath: str):
    """Muestra información de un archivo."""
    file_info = reader.read_info(filepath)

    console.print(Panel(
        f"[bold]{file_info['filename']}[/bold]\n"
        f"Formato: {file_info['format']}\n"
        f"Columnas: {', '.join(file_info['columns'])}",
        title="Información del Archivo",
    ))

    if "sheets" in file_info:
        console.print(f"\nHojas: {', '.join(file_info['sheets'])}")

    console.print("\nVista previa:")
    console.print(file_info['preview'])

@cli.command()
@click.argument("filepath")
@click.option("--output", "-o", help="Archivo de salida")
def convert(filepath: str, output: str):
    """Convierte entre formatos (CSV ↔ Excel)."""
    df = reader.read(filepath)

    if output is None:
        ext = Path(filepath).suffix
        new_ext = ".xlsx" if ext == ".csv" else ".csv"
        output = Path(filepath).stem + "_converted" + new_ext

    result = exporter.export(df, Path(output).suffix)
    console.print(f"[green]✓[/green] Convertido a: {result}")

@cli.command()
@click.argument("filepath")
@click.option("--formula", "-f", multiple=True, help="Fórmulas: 'nueva_col = expr'")
@click.option("--output", "-o", required=True, help="Archivo de salida")
def calculate(filepath: str, formula: tuple, output: str):
    """Aplica fórmulas y guarda el resultado."""
    df = reader.read(filepath)

    for f in formula:
        try:
            parts = f.split("=", 1)
            if len(parts) == 2:
                col_name = parts[0].strip()
                expression = parts[1].strip()
                df = formula_engine.create_calculated_column(df, col_name, expression)
        except Exception as e:
            console.print(f"[red]Error en fórmula '{f}': {e}[/red]")

    result = exporter.export(df, Path(output).suffix)
    console.print(f"[green]✓[/green] Resultado guardado en: {result}")

@cli.command()
@click.argument("filepath")
@click.option("--output", "-o", help="Directorio de salida para gráficos")
@click.option("--type", "-t", type=click.Choice(["auto", "bar", "line", "scatter", "histogram", "heatmap"]),
              default="auto", help="Tipo de gráfico")
def chart(filepath: str, output: str, type: str):
    """Genera gráficos de los datos."""
    df = reader.read(filepath)

    if type == "auto":
        charts = chart_gen.auto_chart(df)
    else:
        # Generar un solo gráfico específico
        numeric_cols = df.select_dtypes(include=["number"]).columns
        categorical_cols = df.select_dtypes(include=["object"]).columns

        if type == "histogram" and len(numeric_cols) > 0:
            charts = [chart_gen.histogram(df, numeric_cols[0])]
        elif type == "bar" and len(categorical_cols) > 0 and len(numeric_cols) > 0:
            summary = df.groupby(categorical_cols[0])[numeric_cols[0]].mean().reset_index()
            charts = [chart_gen.bar_chart(summary, categorical_cols[0], numeric_cols[0])]
        elif type == "heatmap":
            charts = [chart_gen.heatmap(df)]
        else:
            charts = chart_gen.auto_chart(df)

    console.print(f"[green]✓[/green] Generados {len(charts)} gráficos:")
    for chart_path in charts:
        console.print(f"  📈 {chart_path}")

@cli.command()
@click.argument("filepath")
@click.option("--output", "-o", help="Archivo de salida")
@click.option("--format", "-f", type=click.Choice(["csv", "xlsx", "json", "html"]),
              default="csv", help="Formato de salida")
def export(filepath: str, output: str, format: str):
    """Exporta datos a diferentes formatos."""
    df = reader.read(filepath)

    ext = f".{format}"
    result = exporter.export(df, ext)
    console.print(f"[green]✓[/green] Exportado a: {result}")

if __name__ == "__main__":
    cli()
```

### Verifica

- La CLI maneja todos los comandos
- Los errores se muestran de forma clara
- La documentación de comandos es útil

### Checklist

- [ ] La CLI tiene comandos para cada operación
- [ ] Los errores se manejan correctamente
- [ ] La documentación de comandos es clara
- [ ] La herramienta funciona end-to-end

---

## 🩹 Si sale mal

**Error de encoding al leer CSV:**
El `CSVReader` intenta automáticamente múltiples encodings. Si falla, verifica que el archivo no esté corrupto.

**Las fórmulas no se evalúan:**
Verifica que los nombres de columnas en la fórmula coincidan exactamente con los del DataFrame. Las columnas con espacios deben ir entre corchetes: `[Nombre de Columna]`.

**Los gráficos no se generan:**
Verifica que matplotlib esté instalado correctamente. Ejecuta `python -c "import matplotlib"` para verificar.

---

## 🧠 Preguntas socráticas

- ¿Cómo extenderías la herramienta para soportar fórmulas más complejas?
- ¿Qué transformaciones agregarías para análisis financiero?
- ¿Cómo manejarías archivos Excel con múltiples hojas relacionadas?
- ¿Qué optimizaciones harías para manejar archivos de gigabytes?

---

## 🎓 ¿Qué sigue?

Tu herramienta de hojas de cálculo está lista. Ahora puedes:

- **Agregar más fórmulas**: Funciones estadísticas, financieras, de texto
- **Crear plantillas**: Guardar y reutilizar secuencias de transformaciones
- **Integrar con APIs**: Conectar con Google Sheets o Airtable
- **Crear un UI web**: Construir una interfaz web con Streamlit

Si quieres crear una interfaz web para la herramienta, revisa la skill de **Sentiment Dashboard** para aprender a construir dashboards interactivos.
