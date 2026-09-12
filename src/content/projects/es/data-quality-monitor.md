---
title: "Monitor de Calidad de Datos"
description: "Verificaciones continuas de calidad de datos con puntuación, alertas y detección de deriva en pipelines."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "csv", "dataclasses", "reporting"]
prerequisites:
  - "Fundamentos de Python (variables, bucles, funciones, diccionarios)"
  - "dataclasses y lectura de CSV con el módulo csv"
learningObjectives:
  - "Modelar reglas de calidad como datos con una dataclass Rule y un archivo de reglas JSON"
  - "Implementar un motor de verificación que reporte violaciones por regla con índices de fila"
  - "Calcular una puntuación de calidad global a partir de las tasas de aprobación por regla"
  - "Detectar regresiones comparando tasas de aprobación entre instantáneas"
  - "Entregar una CLI que devuelva un código de salida distinto de cero en fallo de calidad"
---

# 🩺 Construir un Monitor de Calidad de Datos

"No envíes datos que no hayas verificado" solo funciona si la verificación es barata y repetible. Este proyecto construye la herramienta que la hace barata: un archivo de reglas escrito en JSON, un motor que convierte cada regla en una lista de filas violatorias, una puntuación que resume todo el archivo, una comparación de deriva que hace sonar una campana cuando una columna empeora silenciosamente entre instantáneas, y una CLI cuyo código de salida un script de build puede realmente aprovechar. Todo es `csv`, `dataclasses` y `json`, sin framework, sin base de datos, solo tus reglas ejecutadas contra tus datos.

Esto asume Python 101 más `dataclasses` y `csv`. No se requiere nada del módulo de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa, en crecimiento.

## 🎯 Lo que harás

1. Modelar reglas de calidad como datos: una dataclass `Rule` que un archivo JSON simple pueda describir.
2. Escribir el motor de verificación: cinco tipos de verificación (`not_null`, `unique`, `within_range`, `in_set`, más una guardia para las desconocidas) que devuelven filas `Violation` explícitas.
3. Agregar los resultados en un informe con tasas de aprobación por regla y una puntuación de calidad global.
4. Comparar tres instantáneas trimestrales y marcar las columnas cuya tasa de aprobación regresó.
5. Pasar a CLI: un comando contra un CSV + un archivo de reglas, código de salida = veredicto de calidad.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado, todo el punto es la pequeña CLI que un script de build o cron puede llamar, y eso necesita un sistema de archivos real.

**GitHub Codespaces** es una alternativa sin configuración: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node y Python ya están instalados) y ejecuta los mismos comandos desde una terminal del navegador.

**Google Colab, Kaggle Notebooks o Binder** funcionan para cada paso, el notebook en [`examples/data-quality-monitor/notebook.es.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-quality-monitor/notebook.es.ipynb) ejecuta el mismo motor de reglas sobre las instantáneas trimestrales incluidas en memoria.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-quality-monitor/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-quality-monitor/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-quality-monitor%2Fnotebook.es.ipynb)

## Configuración

`uv` es una sola herramienta que reemplaza la cadena "instalar Python, luego pip, luego una herramienta de entorno virtual", y este proyecto es biblioteca estándar pura.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, y confirma que quedó instalado:

```bash
uv --version
```

Luego configura el proyecto:

```bash
uv init data-quality-monitor
cd data-quality-monitor
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `data-quality-monitor/` existe con un `pyproject.toml`.
- ✅ `python -c "import csv, json, dataclasses"` se ejecuta, sin paquetes de terceros.

## Paso 1: Modelar una regla como datos

Una verificación de calidad es una cosa pequeña: *qué columna*, *qué verificación*, *bajo qué parámetros*. En el momento en que escribes esas verificaciones como sentencias `if` esparcidas por funciones, has acoplado "qué verificar" a "cómo ejecutarlo". La dataclass `Rule` los desacopla, las reglas se vuelven *datos*, cargables desde JSON, así que tu principal añade una regla editando un archivo, no tu código.

### 1.1 Escribir la dataclass `Rule`

**👟 Pista inicial :** Una dataclass con `name`, `column`, `check` y un dict `params`; un método de clase `from_dict` que recoge cualquier clave extra que lleve la regla JSON:

```python
# rules.py
from dataclasses import dataclass
from typing import Any

@dataclass
class Rule:
    name: str
    column: str
    check: str
    params: dict[str, Any] = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Rule":
        return cls(
            name=data["name"],
            column=data["column"],
            check=data["check"],
            params={k: v for k, v in data.items()
                    if k not in {"name", "column", "check"}},
        )

if __name__ == "__main__":
    import json

    raw = json.loads(
        '[{"name": "age in range", "column": "age", "check": "within_range", "min": 0, "max": 100}]'
    )
    rule = Rule.from_dict(raw[0])
    print(rule.name, "->", rule.check, rule.params)
```

`from_dict` es el truco silencioso: las reglas en JSON se escriben como `{"name": ..., "column": ..., "check": ..., "min": ..., "max": ...}` y el método *permite explícitamente* las tres claves estructurales, barriendo todo lo demás a `params`, así que una futura clave `"description": "..."` cae inofensivamente en params en lugar de hacer fallar al cargador. Los type hints en params (`dict[str, Any]`) cubren el hecho de que `allowed` es una lista pero `min` es un float.

**🎯 Resultado esperado :**

```
age in range -> within_range {'min': 0, 'max': 100}
```

**🩹 Si sale mal :** Si params está vacío, `data["name"]` etc. no son las únicas claves, verifica que no pusiste también `"params": {...}` *dentro* de la regla JSON (from_dict no desempaqueta un dict anidado; aplana claves hermanas). Si `Rule` lanza `TypeError`, el campo default `params` usa `None` no `field(default_factory=dict)`, sigue siendo válido aquí, pero pasarás params explícitamente en todas partes, así que prefiere eso.

### 1.2 Verifica el modelo de regla

**✅ Lista de verificación**

- ✅ `Rule.from_dict({"name": "x", "column": "age", "check": "unique"})` se construye con params vacío.
- ✅ Pasar una regla JSON con `"allowed": [...]` deposita esa lista en `rule.params["allowed"]`.
- ✅ `Rule` es una dataclass: comparar `Rule(name="a", column="age", check="unique")` con una igual es `True`.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué es mejor para un equipo donde los analistas, no los ingenieros, definen las verificaciones que una regla sobreviva como *dict/dataclass* (datos) en lugar de una función?
- `from_dict` ignora las claves extra desconocidas barriéndolas a `params`. ¿Cuándo es un bug esa permisividad (un `"minn": 0` con typo hace silenciosamente que una regla no verifique nada muchas veces)?

## Paso 2: Escribir el motor de verificación

El motor es: *dada una regla y todas las filas, devuelve las filas violatorias*. Cada tipo de verificación es un predicado estrecho (`_fails`), y `rule_failures` recorre las filas recolectando registros `Violation` que dicen *qué regla, qué columna, qué índice de fila, qué valor*. Las violaciones son de primera clase aquí, no `print`s, no `assert`s, porque los pasos de informe, deriva y CLI las consumen todas.

### 2.1 Implementar `_fails` y `rule_failures`

**👟 Pista inicial :** Un predicado `_fails(rule, value, rows) -> bool` por nombre de verificación, luego un recolector que mapea los fallos a `Violation`s con índices de fila:

```python
# checks.py
from collections import Counter
from dataclasses import dataclass
from typing import Any

from rules import Rule

@dataclass
class Violation:
    rule: str
    column: str
    row_index: int
    value: Any

def _fails(rule: Rule, value: Any, rows: list[dict]) -> bool:
    if rule.check == "not_null":
        return value is None or str(value).strip() == ""
    if rule.check == "within_range":
        try:
            num = float(value)
        except (TypeError, ValueError):
            return True
        return not (rule.params["min"] <= num <= rule.params["max"])
    if rule.check == "in_set":
        return value not in rule.params["allowed"]
    if rule.check == "unique":
        non_null = [str(r.get(rule.column)) for r in rows if r.get(rule.column) is not None]
        return Counter(non_null)[str(value)] > 1
    raise ValueError(f"unknown check: {rule.check}")

def rule_failures(rows: list[dict], rule: Rule) -> list[Violation]:
    failures: list[Violation] = []
    for i, row in enumerate(rows):
        value = row.get(rule.column)
        if _fails(rule, value, rows):
            failures.append(Violation(rule.name, rule.column, i, value))
    return failures

if __name__ == "__main__":
    rows = [{"id": "1", "age": "36"}, {"id": "2", "age": "101"}, {"id": "3", "age": ""}]
    rule = Rule(name="age in range", column="age", check="within_range",
                params={"min": 0, "max": 100})
    for v in rule_failures(rows, rule):
        print(v.rule, "row", v.row_index, "->", repr(v.value))
```

`unique` es el extraño del grupo y vale la pena leerlo dos veces: no se puede decidir celda por celda, así que cuenta cada valor de columna en *todas* las filas y luego devuelve "falla" para cualquier valor que ocurra más de una vez. La forma `{..., ...} > 1` es una prueba de pertenencia, no una comparación, `Counter` devuelve el conteo y 2 > 1 es la señal de duplicado. El `raise ValueError` para verificaciones desconocidas es deliberado: un nombre de verificación con typo en el archivo de reglas debe fallar ruidosamente en el momento de la verificación, no pasar cada fila silenciosamente.

**🎯 Resultado esperado :**

```
age in range row 1 -> '101'
age in range row 2 -> ''
```

**🩹 Si sale mal :** Si la fila 2 no se atrapa, `float("")` lanzó pero tu `except` no atrapa `ValueError`, tanto `ValueError` como `TypeError` deben estar en la tupla. Si cada valor reporta como duplicado, el `Counter` en `unique` se está reconstruyendo por fila en lugar de una vez por regla, sácalo de `_fails` o confía en que `rule_failures` pase la lista completa de filas.

### 2.2 Verifica el motor

**✅ Lista de verificación**

- ✅ `not_null` falla en `""`, `"   "` y una clave faltante (ninguna de las tres falla).
- ✅ `within_range` falla en `"101"` con max 100 y en `"abc"` (no analizable → falla).
- ✅ `in_set` trata `"platinum"` como un fallo contra `["free", "pro", "business"]`, una cuestión de pertenencia a conjunto, no una cuestión de subcadena.
- ✅ Un `check` desconocido lanza `ValueError` en lugar de pasar silenciosamente.

**🤔 Pregunta(s) socrática(s)**

- `within_range` devuelve `True` (falla) para números no analizables como `"abc"`. ¿Es un valor basura una violación de *rango* o una violación de *formato*, y qué le pasa a la puntuación de una columna si ambos están en desacuerdo?
- `unique` cuenta `str(value)` mientras `in_set` compara valores crudos. ¿Qué hace `"1"` vs `1` (string versus int) a cada verificación, cuándo llamaría `unique` duplicados a dos valores aparentemente diferentes?

## Paso 3: Agregar en un informe y una puntuación

Las violaciones son la evidencia; una puntuación es el veredicto. El informe convierte 5 filas × 4 reglas en una línea por regla, tasa de aprobación y conteo de filas que fallan, y la puntuación promedia las tasas de aprobación. Un único `0.80 / 1.00` es lo que un humano o un registro de build puede analizar de un vistazo y comparar con el trimestre pasado.

### 3.1 Escribir `QualityReport` y `render`

**👟 Pista inicial :** Una dataclass que contiene resultados, un método `pass_rate`, un `score` que los promedia, y un `render` que imprime la versión humana:

```python
# report.py
from dataclasses import dataclass

from checks import Violation, rule_failures
from rules import Rule

@dataclass
class QualityReport:
    rules: list[Rule]
    failures: dict[str, list[Violation]]
    n_rows: int

    def pass_rate(self, rule_name: str) -> float:
        n = len(self.failures[rule_name])
        return 1 - n / max(self.n_rows, 1)

    def score(self) -> float:
        if not self.rules:
            return 0.0
        return sum(self.pass_rate(r.name) for r in self.rules) / len(self.rules)

def build_report(rows: list[dict], rules: list[Rule]) -> QualityReport:
    failures = {r.name: rule_failures(rows, r) for r in rules}
    return QualityReport(rules=rules, failures=failures, n_rows=len(rows))

def render(report: QualityReport) -> str:
    lines = [f"checked {report.n_rows} rows against {len(report.rules)} rules"]
    for rule in report.rules:
        rate = report.pass_rate(rule.name)
        fails = len(report.failures[rule.name])
        mark = "PASS" if rate == 1.0 else "FAIL"
        lines.append(f"[{mark}] {rule.name:<16} {rate:.1%} ({fails} violating rows)")
    lines.append(f"overall quality score: {report.score():.2f} / 1.00")
    return "\n".join(lines)

if __name__ == "__main__":
    import csv
    import json

    csv_text = """id,name,email,age,plan
1,Ada,ada@example.com,36,free
2,Grace,,44,pro
3,Alan,alan@bletchley.uk,,free
4,Katherine,kj@nasa.gov,101,platinum
5,Margaret,mh@mit.edu,66,free
"""
    rules = [Rule.from_dict(r) for r in json.loads(
        '[{"name": "id unique", "column": "id", "check": "unique"},'
        '{"name": "email present", "column": "email", "check": "not_null"},'
        '{"name": "age in range", "column": "age", "check": "within_range", "min": 0, "max": 100},'
        '{"name": "plan valid", "column": "plan", "check": "in_set", "allowed": ["free", "pro", "business"]}]'
    )]

    rows = list(csv.DictReader(csv_text.strip().splitlines()))
    print(render(build_report(rows, rules)))
```

El promedio está *sin ponderar por diseño*: cuatro reglas, cuatro tasas de aprobación, igual voz. `pass_rate` usa `max(self.n_rows, 1)` para que un archivo *vacío* puntúe cada regla al 0% (que todas las cero filas fallen es la lectura honesta) en lugar de fallar en una división por cero. El prefijo `:[FAIL]`/`:PASS` y el formato `:.1%` son toda la UX del informe, una columna que puntúa 80% o una deriva de −13.3% debe ser visible en un escaneo, no después de contar estrellas.

**🎯 Resultado esperado :**

```
checked 5 rows against 4 rules
[PASS] id unique        100.0% (0 violating rows)
[FAIL] email present    80.0% (1 violating rows)
[FAIL] age in range     60.0% (2 violating rows)
[FAIL] plan valid       80.0% (1 violating rows)
overall quality score: 0.80 / 1.00
```

**🩹 Si sale mal :** Si `age in range` muestra 80% en lugar de 60%, el `''` vacío de la fila 3 no se está contando, el `float('')` que lanza se está manejando, pero verifica que la cláusula `except (TypeError, ValueError)` devuelva `True` (falla); si hiciera `pass`ed, la celda vacía cae a la comparación de rango y pasa silenciosamente. Si la línea de puntuación es 1.00, el método `score` está promediando algo distinto a tus reglas, confirma que `len(self.rules)` divide *cuatro* tasas de aprobación.

### 3.2 Verifica el informe

**✅ Lista de verificación**

- ✅ Las filas 2 (Grace, email vacío), 3 (Alan, edad vacía) y 4 (Katherine, edad 101, plan `platinum`) son exactamente las filas violatorias contadas.
- ✅ `render()` imprime una línea por regla más la puntuación; la columna de conteo coincide con `len(rule_failures(...))`.
- ✅ Un CSV vacío puntúa 0.00 sin fallar en `pass_rate`.

**🤔 Pregunta(s) socrática(s)**

- La puntuación es una media simple. Una columna que falla el 40% de las veces y una columna que falla el 10% de las veces arrastran la media con su propio peso. ¿Qué tipo de puntuación *ponderada* querría un panel de hospital o un sistema de nómina, y `render` sigue teniendo sentido, o dividirías el informe en niveles?
- `PASS` requiere exactamente 100%. Dos equipos de calidad de datos difieren sobre si una cobertura de email del 99.5% debería ser verde. ¿Dónde pertenece el umbral de aprobación, en `render` o en la puntuación?

## Paso 4: Detectar deriva entre instantáneas

Un solo archivo limpio es agradable; una columna que *se ensucia* es la emergencia. La deriva compara la tasa de aprobación de cada regla entre archivos de instantánea consecutivos y marca cualquier columna cuya tasa cayó más de un umbral (5 puntos) con el marcador `  <-- regression`, para que un build pueda localizar a la persona dueña de `email present`.

### 4.1 Escribir el comparador

**👟 Pista inicial :** Reutiliza `build_report` por archivo para obtener tasas de aprobación, luego recorre archivo tras archivo imprimiendo tasas y deltas, marcando las caídas más allá del umbral:

```python
# drift.py
from report import build_report

def pass_rates_for_file(path: str, rules: list) -> dict[str, float]:
    import csv
    with open(path, newline="") as f:
        rows = list(csv.DictReader(f))
    report = build_report(rows, rules)
    return {r.name: report.pass_rate(r.name) for r in rules}

def compare(files: list[str], rules: list, threshold: float = 0.05) -> list[str]:
    lines: list[str] = []
    prev = None
    for path in files:
        rates = pass_rates_for_file(path, rules)
        if prev is None:
            lines.append(f"== {path} (baseline)")
            for name, rate in rates.items():
                lines.append(f"   {name:<16} {rate:.1%}")
        else:
            lines.append(f"== {path}")
            for name, rate in rates.items():
                delta = rate - prev[name]
                flag = "   <-- regression" if delta < -threshold else ""
                lines.append(f"   {name:<16} {rate:.1%} ({delta:+.1%}){flag}")
        prev = rates
    return lines

if __name__ == "__main__":
    import csv
    import json

    from rules import Rule

    snapshots = {
        "customers_q1.csv": [
            ["id", "name", "email", "age", "plan"],
            ["1", "Ada", "ada@example.com", "36", "free"],
            ["2", "Grace", "", "44", "pro"],
            ["3", "Alan", "alan@bletchley.uk", "", "free"],
            ["4", "Katherine", "kj@nasa.gov", "101", "platinum"],
            ["5", "Margaret", "mh@mit.edu", "66", "free"],
        ],
        "customers_q2.csv": [
            ["id", "name", "email", "age", "plan"],
            ["6", "Tim", "td@example.com", "44", "free"],
            ["7", "Barbara", "", "29", "free"],
            ["8", "Don", "don@example.com", "118", "pro"],
        ],
        "customers_q3.csv": [
            ["id", "name", "email", "age", "plan"],
            ["9", "Carol", "carol@example.com", "51", "pro"],
            ["10", "David", "david@example.com", "52", "business"],
            ["11", "Ellen", "ellen@example.com", "", "free"],
        ],
    }
    for path, rows in snapshots.items():
        with open(path, "w", newline="") as f:
            csv.writer(f).writerows(rows)

    rules = [Rule.from_dict(r) for r in json.loads(
        '[{"name": "id unique", "column": "id", "check": "unique"},'
        '{"name": "email present", "column": "email", "check": "not_null"},'
        '{"name": "age in range", "column": "age", "check": "within_range", "min": 0, "max": 100},'
        '{"name": "plan valid", "column": "plan", "check": "in_set", "allowed": ["free", "pro", "business"]}]'
    )]

    for line in compare(["customers_q1.csv", "customers_q2.csv", "customers_q3.csv"], rules):
        print(line)
```

La línea de base es el *primer* archivo por posición en la lista, comparando tasas de aprobación con la instantánea inmediatamente anterior (q2 vs q1, q3 vs q2), no siempre con q1. Esa es la pregunta honesta "¿fue la última carga de este equipo peor que la anterior?"; comparar todo con q1 respondería "¿es peor que hace tres meses", que es un gráfico diferente (igual de válido). El formato de delta `%(+...%)` hace imposible leer mal la ambigüedad de signo +/−.

**🎯 Resultado esperado :**

```
== customers_q1.csv (baseline)
   id unique        100.0%
   email present    80.0%
   age in range     60.0%
   plan valid       80.0%
== customers_q2.csv
   id unique        100.0% (+0.0%)
   email present    66.7% (-13.3%)   <-- regression
   age in range     66.7% (+6.7%)
   plan valid       100.0% (+20.0%)
== customers_q3.csv
   id unique        100.0% (+0.0%)
   email present    100.0% (+33.3%)
   age in range     66.7% (+0.0%)
   plan valid       100.0% (+0.0%)
```

**🩹 Si sale mal :** Si el marcador `regression` nunca aparece, `threshold` (default `0.05`) se está comparando contra el signo equivocado, una *caída* es `delta < -threshold`, así que verifica el menos. Si la caída de email de q2 muestra `+13.3%`, el delta se está calculando `prev - rate` en lugar de `rate - prev`, signo, volteado.

### 4.2 Verifica la deriva

**✅ Lista de verificación**

- ✅ `customers_q2.csv` marca exactamente una regresión: `email present`.
- ✅ `age in range` *mejora* q1→q2 (+6.7%) y se mantiene estable q2→q3, nunca marcada falsamente.
- ✅ Los archivos los escribe la demo (para que el comparador corra sobre archivos reales), y las tasas de aprobación en disco coinciden con la fila de línea de base de arriba.

**🤔 Pregunta(s) socrática(s)**

- El umbral (5 puntos) es el mismo para todas las reglas. `email present` cayendo 13.3 puntos dispara la bandera; `age in range` subiendo 6.7 puntos es un pase. ¿Qué tipo de regla merece un umbral *por regla*, y dónde viviría en la firma de `compare` sin cambiar la API?
- La deriva compara tasa contra tasa, ignorando el *volumen* (q2 verifica 3 filas, q1 verificó 5). Una señal de regresión de una sola fila desde un archivo de 3 filas es estadísticamente débil. ¿Cómo se vería una comparación ponderada por confianza, y cuándo es de todos modos la elección pragmática "marcar todo, verificar a mano"?

## Paso 5: La CLI y el código de salida

El motor está terminado; la parte que cambia cómo un equipo *contrata* con la herramienta es el código de salida. `monitor.py` lee un CSV y un archivo de reglas, imprime el informe y sale con `0` si todo pasó o `2` si algo falló, un paso de CI o un script cron puede tratar el no-cero como "bloquear el despliegue / localizar al dueño" sin analizar ni una línea de salida.

### 5.1 Escribir `monitor.py`

**👟 Pista inicial :** `argparse` para `csv_path` + `--rules` opcional, reutiliza `build_report`/`render`, establece `sys.exit` a partir de la puntuación:

```python
# monitor.py
import argparse
import csv
import json
import sys

from report import build_report, render
from rules import Rule

def main() -> None:
    parser = argparse.ArgumentParser(description="Check CSV data quality against a rules file.")
    parser.add_argument("csv_path")
    parser.add_argument("--rules", default="rules.json")
    args = parser.parse_args()

    with open(args.rules) as f:
        rules = [Rule.from_dict(r) for r in json.load(f)]

    with open(args.csv_path, newline="") as f:
        rows = list(csv.DictReader(f))

    report = build_report(rows, rules)
    print(render(report))
    sys.exit(0 if report.score() == 1.0 else 2)

if __name__ == "__main__":
    main()
```

**✅ Lista de verificación**

- ✅ La CLI corre con `uv run python monitor.py customers_q1.csv` e imprime el informe.
- ✅ `echo $?` muestra `2` para customers_q1.csv (puntuación 0.80); un archivo limpio sale `0`.
- ✅ `--rules` respeta una ruta personalizada (p. ej., `uv run python monitor.py data.csv --rules my-rules.json`).

La puntuación es lo único que conoce el código de salida, y eso es una decisión de diseño real. "Puerta de calidad" significa *la puntuación debe ser exactamente 1.00*, lo más estricto posible. Si prefieres poner la puerta en "peor que 0.95", cambias una constante; el informe, el motor y el contrato de la CLI se quedan quietos.

### 5.2 Verifica la CLI de extremo a extremo

**🩹 Si sale mal :** Si `sys.exit(2)` parece no hacer nada, recuerda que la ayuda/versiones de `argparse` salen con sus propios códigos antes de que `main()` llegue siquiera a la puerta, y que una corrida de `--help` reportando 0 es correcto. Si el código de salida es `1` en lugar de `2`, una excepción escapó de `main()` antes de que corriera la puerta, lee el traceback; es un problema de ruta de archivo, no un problema de puerta.

**🤔 Pregunta(s) socrática(s)**

- El código de salida conoce solo aprobar/fallar; el informe conoce qué reglas derivaron. ¿Por qué esa separación es *correcta* para una puerta de CI, y qué perdería tu pipeline si la CLI imprimiera "score 0.80" pero *siempre* saliera con 0?
- `--rules rules.json` usa por default un nombre de archivo fijo. ¿Qué *no* permite `--rules` que un equipo podría querer (reglas por directorio, overrides de variables de entorno), y añadirlos cambiaría el contrato del código de salida?

## ⚠️ Errores comunes

- **Convertir el vacío en un pase.** `float("")` lanza; si tu cláusula `except` devuelve `False` (pasa) o re-lanza silenciosamente, las celdas en blanco atraviesan `within_range`. El vacío es un fallo; lo no analizable es un fallo; una excepción no manejada *no* es un resultado.
- **`unique` re-contando por cada fila.** Construir el `Counter` dentro del predicado por fila convierte un archivo de 100k filas en trabajo O(n²). Cuenta una vez por regla (o acéptalo para datos de demo), y recuerda que `"1"` y `1` son strings diferentes.
- **Volteos de signo en los deltas de deriva.** `delta = rate - prev` marca caídas correctamente; `prev - rate` marca subidas. Es un carácter de un carácter que se lleva la credibilidad de un informe.
- **Puntuación `0/0`.** Un CSV vacío debe puntuar 0.00 mediante una guardia `max(self.n_rows, 1)`, no fallar en una división por cero. La pregunta del archivo vacío es "¿0 filas deben ser un fallo o una omisión?".
- **Deriva del código de salida.** Una herramienta que *imprime* PASS/FAIL pero siempre sale con 0 es decorativa. Si incrustas la puerta en un script, `cmd /c` (Windows) y el encadenado `&&` respetan el código de salida real, elige el código de salida deliberadamente y pruébalo.

## Lo que acabas de construir

Una suite de calidad de datos autocontenida: reglas como datos JSON, un motor de verificación con violaciones por fila, un informe puntuado de una pantalla, una comparación de deriva instantánea a instantánea con banderas de regresión, y una CLI cuyo código de salida es una puerta de despliegue. La habilidad reutilizable es *separar el juicio de la ejecución*: datos `Rule` en un archivo, motor en `checks.py`, presentación en `render`, decisión en un código de salida, cualquiera puede cambiar (nuevo tipo de verificación, nuevo formato de informe, nueva regla de puerta) sin tocar a los otros tres.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/data-quality-monitor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/data-quality-monitor) en el repositorio del curso tiene los scripts completos, los CSVs de instantánea trimestrales y un `rules.json` de muestra. O abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Añade un flag de CLI **`--threshold`** que sobrescriba el default de `compare`, respondiendo la pregunta socrática del Paso 4 sobre sensibilidad por regla sin cambiar el motor.
- Emite un **informe JSON** (`--json report.json`) junto al humano: misma puntuación, mismas violaciones, legible por máquina, el hermano verboso del código de salida.
- Añade **conteos de volumen por columna** a la tabla de deriva (3 filas este trimestre vs 5 el trimestre pasado) para que los lectores humanos vean *confianza* además de tasa.
- Soporta **detección de instantáneas obsoletas**: marca las instantáneas cuya columna de marca de tiempo `as_of` tiene más de N días, la deriva se mide en tiempo, no solo en orden de archivos.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientes orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene una guía completa, amigable para principiantes, para agregar el tuyo mediante un **pull request**, incluso si nunca has usado git: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, paso a paso. No se asume experiencia previa en git.

Bienvenido a escribir Python fuera del navegador. 🎓