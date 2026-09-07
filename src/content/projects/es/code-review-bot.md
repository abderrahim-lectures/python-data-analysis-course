---
title: "Bot de Revisión de Código con IA"
description: "Revisión de código automatizada que detecta errores, sugiere mejoras y aplica guías de estilo."
difficulty: "intermediate"
estimatedMinutes: 75
xpReward: 100
tags: ["AI Agents", "Developer Tools", "APIs"]
prerequisites:
  - "Funciones, listas y dicts"
  - "Comprensiones de listas y dicts"
  - "Leer un archivo de texto y escribir JSON"
learningObjectives:
  - "Modelar un pull request como líneas de código con un nombre de archivo"
  - "Codificar reglas de revisión como datos (nombre, severidad, prueba) en lugar de ramas if"
  - "Adjuntar comentarios por línea y agregarlos por severidad"
  - "Calcular un veredicto APPROVE/REJECT y exportar la revisión como JSON"
  - "Re-revisar el diff corregido y ver cómo el veredicto cambia"
---

# 🛠️ 🤖 Construir un Bot de Revisión de Código

Los bots de revisión leen cada pull request para que los humanos no tengan que hacerlo — y antes de que intervenga cualquier LLM, un bot de revisión es mayormente *reglas*. Este proyecto construye uno: un **agente de revisión de código** determinista que toma un diff de PR simulado (`payment.py`), aplica un registro de reglas (longitud de línea, espacios finales, `except` desnudo, `print` de depuración, `TODO` sin resolver, docstrings faltantes), adjunta un comentario por línea para cada acierto, los agrega por severidad, decide `REJECT` cuando existe un problema mayor, exporta toda la revisión como un payload JSON, y luego re-revisa el diff *corregido* para ver el veredicto pasar a `APPROVE`. Sin red, sin aleatoriedad — el mismo diff siempre produce la misma revisión, que es exactamente lo que hace auditable a un bot de reglas: cada comentario es trazable hasta una prueba.

Esto asume funciones, colecciones, E/S de archivos y JSON. Es un proyecto opcional y no calificado — consulta [Proyectos del mundo real](/docs/projects) para la lista completa, en crecimiento.

## 🎯 Lo que harás

1. Modelar un pull request como una lista nombrada de líneas.
2. Escribir reglas como datos — un registro que el bot recorre.
3. Revisar un diff, adjuntar comentarios y agregarlos por severidad.
4. Calcular el veredicto y exportar el reporte como JSON.
5. Corregir los bloqueadores, re-revisar y ver `REJECT` → `APPROVE`.

## Dónde ejecutar esto

**Localmente** es el hogar natural para una herramienta de revisión que lee y escribe archivos.

```bash
mkdir code-review-bot && cd code-review-bot
touch review_bot.py
```

**Google Colab, Kaggle Notebooks y Binder** ejecutan todo sin cambios — cada bloque es Python puro. La exportación JSON sigue siendo un archivo que puedes abrir.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/code-review-bot/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/code-review-bot/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcode-review-bot%2Fnotebook.ipynb)

## Configuración

Sin paquetes; un archivo espécimen que revisar.

### Crea el PR espécimen

```bash
mkdir code-review-bot && cd code-review-bot
touch review_bot.py
```

Guarda esto como `payment.py` — el "PR bajo revisión". Nota las dos líneas con espacios finales y el `except:` a propósito:

```python
def process_payment(total, tax_rate):       
    """Compute the final total."""
    discount = 0
    if total > 100:
        discount = total * 0.1
    try:
        final = total + (total * tax_rate) - discount
    except:  # noqa: E722
        print("something went wrong")
    return final

# TODO: add tests for negative totals
def apply_coupon(order_total, coupon):
    return order_total - coupon
# This comment is deliberately stretched out far beyond 72 chars to flag long lines. xxxxxxxxxxxxxxxx  
```

**✅ Lista de verificación**

- ✅ `payment.py` tiene **15 líneas**; la línea 1 y la línea 15 terminan con espacios finales (todavía visibles en un editor).
- ✅ `final` en la línea 7 — la función que recibió un docstring — funciona como la línea base saludable.
- ✅ `python3 review_bot.py` se ejecuta sin salida todavía.

**🤔 Pregunta(s) socrática(s)**

- Un revisor inteligente *juzga*; este bot solo *prueba*. ¿Dónde está el límite entre una regla que puedes codificar como `True/False` y un juicio que necesita un LLM o un humano?
- El veredicto del bot es `APPROVE` o `REJECT`. ¿Qué información añadiría un tercer estado (`COMMENT`) a un proceso de merge donde "aprobar con comentarios" es un paso real — y qué regla de las de aquí lo produciría alguna vez?

## Paso 1: Modelar el PR

Un bot de revisión recorre líneas. Primero, un `load_pr` que convierte el archivo en una estructura que el bot pueda escanear.

### 1.1 El PR como líneas

**👟 Pista inicial :** Un conjunto pequeño sin dataclass: `{"file": "payment.py", "lines": [...]}`.

```python
# review_bot.py
import json

def load_pr(path):
    with open(path) as f:
        return {"file": path, "lines": f.read().splitlines()}

pr = load_pr("payment.py")
print("file:", pr["file"], "| lines:", len(pr["lines"]))
for i, ln in enumerate(pr["lines"], 1):
    print(f"{i:>2} |{ln}|")
```

`splitlines()` descarta el `\n`, así que `pr["lines"]` es *contenido puro* — una lista cuyo índice (como número de línea) es a lo que apuntará un comentario. Un conjunto tipo dict (nombre de archivo + líneas) es la forma más pequeña que una herramienta de revisión puede entregar a un motor de reglas, y refleja cómo los bots reales reciben un pull request (nombre, luego líneas cambiadas).

**🎯 Resultado esperado :**

```
file: payment.py | lines: 15
 1 |def process_payment(total, tax_rate):       |
 2 |    """Compute the final total."""|
 3 |    discount = 0|
 4 |    if total > 100:|
 5 |        discount = total * 0.1|
 6 |    try:|
 7 |        final = total + (total * tax_rate) - discount|
 8 |    except:  # noqa: E722|
 9 |        print("something went wrong")|
10 |    return final|
11 ||
12 |# TODO: add tests for negative totals|
13 |def apply_coupon(order_total, coupon):|
14 |    return order_total - coupon|
15 |# This comment is deliberately stretched out far beyond 72 chars to flag long lines. xxxxxxxxxxxxxxxx  |
```

**🩹 Si sale mal :** Si `lines` muestra 16, un salto de línea final suelto añadió un elemento vacío (o tu editor añadió uno) — `splitlines()` lo maneja, pero vuelve a contar el archivo. Si los delimitadores `|…|` pierden los espacios finales de la línea 1, tu editor recortó automáticamente el espécimen (vuélvelo a pegar).

### 1.2 Verifica el modelo

**✅ Lista de verificación**

- ✅ `pr` es un dict con `file` y `lines`; 15 líneas en total.
- ✅ La línea 1 y la línea 15 muestran visualmente espacios finales dentro de `|…|`.
- ✅ El indexado coincide: `pr["lines"][7]` es la línea `except:` (base 0) — las posiciones de las reglas mapean `i+1`.

**🤔 Pregunta(s) socrática(s)**

- El dict agrupa `file` y `lines`. Si revisaras un PR *real* de GitHub, ¿qué dos o tres campos necesitaría la entrada del bot además del contenido (p. ej. SHA del commit, autor)? ¿Por qué esos son parte del *rastro de auditoría* de un comentario?
- Los números de línea son base 1 para los humanos, pero Python indexa en base 0. Cada comentario que produzcas llevará `line = i + 1`. ¿Dónde está el bug esperando si una regla olvida el `+1`?

## Paso 2: Reglas como datos

La inteligencia del bot es un *registro* — reglas codificadas como datos que el motor recorre, así añadir una regla significa añadir un dict, no una rama if.

### 2.1 El registro

**👟 Pista inicial :** Cada regla es `(nombre, severidad, prueba)` donde `test(line) -> bool`; `MAX_LINE` limita la longitud de línea.

```python
# review_bot.py (continued)
MAX_LINE = 72

RULES = [
    {"name": "line-length", "severity": "minor",
     "test": lambda ln: len(ln) > MAX_LINE},
    {"name": "trailing-space", "severity": "minor",
     "test": lambda ln: ln != ln.rstrip()},
    {"name": "bare-except", "severity": "major",
     "test": lambda ln: ln.lstrip().startswith("except:")},
    {"name": "debug-print", "severity": "minor",
     "test": lambda ln: "print(" in ln},
    {"name": "todo-marker", "severity": "info",
     "test": lambda ln: "TODO" in ln or "FIXME" in ln},
    {"name": "missing-docstring", "severity": "minor",
     "test": lambda ln: False},  # needs line context, wired next
]
```

Cada regla es un dict simple: un nombre, una severidad y una prueba pura. La prueba de except desnudo es un sobre-coincidencia fiel (`except:`), y `missing-docstring` se deja deliberadamente en `False` hasta que el Paso 2.2 le dé contexto. Un registro construido a partir de datos es lo que hace *mantenible* al bot — puedes extenderlo desde un archivo de configuración más tarde sin editar el motor.

**🎯 Resultado esperado :** Todavía nada — RULES es datos. Verifica cada prueba a mano: `len("…") > 72` es longitud de línea; `ln != ln.rstrip()` son espacios finales.

### 2.2 Los docstrings necesitan contexto

**👟 Pista inicial :** Una prueba de docstring que mira las pocas líneas *después* de un `def` — una función tiene docstring si su siguiente línea no en blanco `startswith('"""')`.

```python
# review_bot.py (continued)
def has_docstring(lines, idx):
    for ln in lines[idx:idx + 3]:
        if ln.strip() == "":
            continue
        return ln.lstrip().startswith('"""')
    return False

RULES.append({"name": "missing-docstring", "severity": "minor",
              "test": lambda ln: ln.lstrip().startswith("def ") and
                                 not has_docstring(pr["lines"], 0)})
```

Espera — un lambda no puede alcanzar el *índice actual* de la línea, así que este cableado ingenuo verificará `pr["lines"][0]` para siempre. La forma correcta es una prueba que tome el *índice*, no la línea. Reescribe el registro para que cada prueba reciba `(lines, i)`:

```python
# review_bot.py (continued)
def t_missing_docstring(lines, i):
    return lines[i].lstrip().startswith("def ") and not has_docstring(lines, i)

RULES = [
    {"name": "line-length", "severity": "minor",
     "test": lambda lines, i: len(lines[i]) > MAX_LINE},
    {"name": "trailing-space", "severity": "minor",
     "test": lambda lines, i: lines[i] != lines[i].rstrip()},
    {"name": "bare-except", "severity": "major",
     "test": lambda lines, i: lines[i].lstrip().startswith("except:")},
    {"name": "debug-print", "severity": "minor",
     "test": lambda lines, i: "print(" in lines[i]},
    {"name": "todo-marker", "severity": "info",
     "test": lambda lines, i: "TODO" in lines[i] or "FIXME" in lines[i]},
    {"name": "missing-docstring", "severity": "minor",
     "test": t_missing_docstring},
]
```

Todas las pruebas ahora reciben `(lines, i)` — la mayoría ignora el índice; la regla de docstrings lo necesita. Esa uniformidad es el contrato que permite que el motor (Paso 3) se mantenga simple y correcto.

**🎯 Resultado esperado :** Nada — pero al releer la lista, ya puedes predecir sobre qué líneas disparará cada prueba (1 y 15 para espacios finales, 8 para except desnudo, 9 para print de depuración, 12 para todo, 13 para docstring, 15 para longitud).

### 2.3 Verifica el registro

**✅ Lista de verificación**

- ✅ Seis reglas nombradas con severidades; cada una es una prueba pura sobre `(lines, i)`.
- ✅ `missing-docstring` usa la prueba contextual `t_missing_docstring`, no el stub ingenuo.
- ✅ Las severidades mapean a políticas: `major` solo para `except` desnudo; el resto `minor`/`info`.

**🤔 Pregunta(s) socrática(s)**

- La prueba de except desnudo coincide con `except:` pero no con `except Exception:` — esta última es *más* específica y, podría decirse, aceptable. ¿Codificarías `except Exception:` como su propia regla o enseñarías a la prueba sobre `except ValueError:`? ¿Cuál es la mejora de una línea?
- Reglas como datos significa que el motor no sabe qué significa una "regla". Si un bot futuro añadiera una regla de *ML* («esta línea huele a bug»), ¿cómo se asignaría la severidad ahí — y qué hace que las reglas deterministas de aquí sean una buena *línea base* contra la que verificar una regla de ML?

## Paso 3: Ejecutar la revisión

El motor: recorrer cada regla contra cada línea y adjuntar un comentario por acierto.

### 3.1 El motor de comentarios

**👟 Pista inicial :** `review(pr)` itera sobre `(regla, índice_de_línea)`, ejecuta `rule["test"]` y añade un dict de comentario.

```python
# review_bot.py (continued)
def review(pr):
    comments = []
    lines = pr["lines"]
    for i in range(len(lines)):
        for rule in RULES:
            if rule["test"](lines, i):
                comments.append({
                    "file": pr["file"],
                    "line": i + 1,            # 1-based for humans
                    "rule": rule["name"],
                    "severity": rule["severity"],
                    "code": lines[i].rstrip(),
                })
    return comments

comments = review(pr)
print("comments:", len(comments))
for c in comments:
    print(f"{c['line']:>2} {c['severity']:<5} {c['rule']:<16} {c['code'][:40]}")
```

Un bucle anidado sobre reglas × líneas es todo el motor — añadir una regla o una línea no cambia nada aquí. Cada comentario lleva `file`, `line` base 1, `rule`, `severity` y el fragmento de código *recortado*, así un humano puede leerlo sin abrir el archivo. `code = lines[i].rstrip()` mantiene el mensaje corto mientras `line` fija la ubicación exacta.

**🎯 Resultado esperado :**

```
comments: 7
 1 minor trailing-space    def process_payment(total, tax_rate):
 8 major bare-except       except:  # noqa: E722
 9 minor debug-print       print("something went wrong")
12 info  todo-marker       # TODO: add tests for negative totals
13 minor missing-docstring def apply_coupon(order_total, coupon):
15 minor line-length       # This comment is deliberately stretched out far beyond 72 chars to flag long line
15 minor trailing-space    # This comment is deliberately stretched out far beyond 72 chars to flag long line
```

**🩹 Si sale mal :** Si la línea 15 aparece solo una vez, una de sus dos reglas no disparó (es *a la vez* larga *y* con espacio final — dos pruebas independientes, dos comentarios). Si falta la línea 8, `lstrip().startswith("except:")` tropezó con el sufijo `  # noqa` — no debería; la regla prueba el *inicio*.

### 3.2 Resumen por severidad

**👟 Pista inicial :** `Counter` sobre las severidades y luego el veredicto: `REJECT` si hay algún `major`.

```python
# review_bot.py (continued)
from collections import Counter

counts = Counter(c["severity"] for c in comments)
print("BY SEVERITY:", dict(counts))
verdict = "REJECT" if counts.get("major", 0) else "APPROVE"
print("VERDICT:", verdict)
```

Siete comentarios son ruido; `{major:1, minor:5, info:1}` es la señal. El veredicto es un booleano: el `except` desnudo que se traga todos los tipos de excepción es el bloqueador — todo lo demás es pulido. La agregación por severidad es lo que convierte un muro de comentarios en una decisión de merge.

**🎯 Resultado esperado :**

```
BY SEVERITY: {'major': 1, 'minor': 5, 'info': 1}
VERDICT: REJECT
```

**🩹 Si sale mal :** Si `minor` suma 4, una regla se quedó (p. ej. `missing-docstring` todavía en el stub de antes del Paso 2.2 — agrega uno). Si el veredicto dice `APPROVE`, `counts.get("major", 0)` cambió a `counts["major"]` y falló/no hizo nada — mantén el `.get`.

### 3.3 Verifica la ejecución

**✅ Lista de verificación**

- ✅ 7 comentarios: espacios finales ×2 (1, 15), longitud de línea (15), except desnudo (8), print de depuración (9), todo (12), docstring faltante (13).
- ✅ `{'major': 1, 'minor': 5, 'info': 1}`; `VERDICT: REJECT`.
- ✅ Cada comentario lleva archivo, línea base 1, regla, severidad y un fragmento de código recortado.

**🤔 Pregunta(s) socrática(s)**

- La línea 15 ganó *dos* comentarios de *dos* reglas. ¿Existe esto de "demasiados comentarios en una línea" — y qué política de deduplicación (p. ej. un comentario por regla por línea, o colapsar por línea) agradecería un revisor humano?
- El veredicto ignora `info` por completo. Si la política del repositorio fuera "los TODOs deben resolverse antes del merge", `todo-marker` se volvería *major*. ¿Qué dice eso sobre de quién es la política que codifica el bot — y cómo la parametrizarías por repositorio sin reescribir las reglas?

## Paso 4: Exportar el reporte

Una revisión sobre la que nadie puede actuar es un pensamiento. El Paso 4 exporta los comentarios como JSON e imprime un resumen humano.

### 4.1 El payload JSON

**👟 Pista inicial :** `json.dump` de la revisión completa como un payload con forma de API: `verdict`, `counts`, `comments`.

```python
# review_bot.py (continued)
report = {
    "verdict": verdict,
    "counts": dict(counts),
    "comments": comments,
}

with open("review.json", "w") as f:
    json.dump(report, f, indent=2)
print("Wrote review.json with", len(comments), "comments")
```

`review.json` es el entregable *de máquina* — un payload con forma de API (`verdict`, `counts`, `comments`) que otra herramienta (un bot de GitHub, una compuerta de CI, un hook de notificación) puede consumir sin re-ejecutar lógica de Python. `indent=2` mantiene el archivo también legible para humanos.

**🎯 Resultado esperado :** `Wrote review.json with 7 comments` — y el archivo se abre con

```json
{
  "verdict": "REJECT",
  "counts": {
    "major": 1,
    "minor": 5,
    "info": 1
  },
  "comments": [...]
}
```

**🩹 Si sale mal :** Si el JSON es una línea incompresible, se omitió `indent=2`. Si `report["comments"]` se ve como `[]`, añadiste cada dict de comentario a una *copia* (p. ej. `c = review(pr)` dos veces) — llama a `review` una sola vez.

### 4.2 El resumen humano

**👟 Pista inicial :** Imprimir un top-3 de "qué arreglar primero" desde `major` y luego en orden de severidad, y dónde mirar.

```python
# review_bot.py (continued)
order = {"major": 0, "minor": 1, "info": 2}
lines_by_rule = {}
for c in comments:
    lines_by_rule.setdefault(c["rule"], []).append(c["line"])

print("SUMMARY")
print(f"  verdict: {verdict}")
print(f"  comments: {len(comments)} ({counts.get('major', 0)} major, "
      f"{counts.get('minor', 0)} minor, {counts.get('info', 0)} info)")
for rule in sorted(lines_by_rule, key=lambda r: order.get(
        RULES[[x['name'] for x in RULES].index(r)]['severity'], 2)):
    print(f"  {rule}: lines {sorted(lines_by_rule[rule])}")
```

El resumen reordena las reglas por severidad para que lo *primero* que lea un desarrollador sea el bloqueador, luego los elementos de pulido. Los números de línea ordenados les permiten saltar directo a cada arreglo.

**🎯 Resultado esperado :**

```
SUMMARY
  verdict: REJECT
  comments: 7 (1 major, 5 minor, 1 info)
  bare-except: lines [8]
  line-length: lines [15]
  missing-docstring: lines [13]
  trailing-space: lines [1, 15]
  debug-print: lines [9]
  todo-marker: lines [12]
```

**🩹 Si sale mal :** Si el orden de las reglas es alfabético sin importar la severidad, la búsqueda de mapeo del `key` está rota — ese baile de índices es frágil; simplifícalo guardando `severity` dentro de cada comentario y ordenando los comentarios directamente (`sorted(comments, key=lambda c: order[c["severity"]])`).

### 4.3 Verifica la exportación

**✅ Lista de verificación**

- ✅ `review.json` tiene verdict, counts, comments; 7 comentarios dentro.
- ✅ El resumen humano lista bare-except primero (el único major), los demás agrupados por regla con números de línea ordenados.
- ✅ El JSON y el resumen cuentan la misma historia — conteos idénticos en ambos lugares.

**🤔 Pregunta(s) socrática(s)**

- El dict `comment` ya lleva `severity` y, sin embargo, el resumen la re-deriva de `RULES` por nombre. ¿Qué bug en esa búsqueda (una regla renombrada) revela sobre la *duplicación* entre la fuente de verdad de datos y el reporte — y qué cambio de una línea haría que los comentarios se auto-describieran?
- Un bot real publica `review.json` en un endpoint de API. ¿Qué campos añadirías *antes* de enviarlo a la API de GitHub — p. ej. `commit_sha`, `pull_request`, `author` — y por qué una auditoría los quiere en el payload y no solo en el log?

## Paso 5: Re-revisar tras los arreglos

La recompensa: un desarrollador corrige los bloqueadores, el bot se re-ejecuta y el veredicto cambia.

### 5.1 Corregir el diff

**👟 Pista inicial :** Parchear los dos problemas adyacentes a `major` — una excepción específica en lugar del `except` desnudo, y una línea 15 sensata.

```python
# review_bot.py (continued)
fixed_lines = list(pr["lines"])
fixed_lines[7] = "    except ValueError:  # noqa: E722"
fixed_lines[14] = "# This comment is now a sane length."

fixed_pr = {"file": "payment.py", "lines": fixed_lines}
fixed_comments = review(fixed_pr)
fixed_counts = Counter(c["severity"] for c in fixed_comments)
fixed_verdict = "REJECT" if fixed_counts.get("major", 0) else "APPROVE"
print("FIXED BY SEVERITY:", dict(fixed_counts))
print("NEW VERDICT:", fixed_verdict)
```

Una copia de lista (`list(pr["lines"])`) y luego escrituras dirigidas por índice representan "las ediciones del desarrollador". `except ValueError:` mantiene el manejador específico (un `except` desnudo debe volverse una excepción *nombrada* o la regla sigue disparando).

**🎯 Resultado esperado :**

```
FIXED BY SEVERITY: {'minor': 3, 'info': 1}
NEW VERDICT: APPROVE
```

**🩹 Si sale mal :** Si `major` sigue siendo 1, el reemplazo no aterrizó en `fixed_lines[7]` (el índice 7 es la línea 8 — ¡verifica base 0!). Si minor sigue siendo 5, la línea 15 no se acortó de verdad a menos de 72 caracteres.

### 5.2 El bucle del agente completo

**👟 Pista inicial :** Un `run_review(pr)` que devuelve veredicto + reporte, así un llamador puede revisar, corregir y re-revisar en un bucle.

```python
# review_bot.py (continued)
def run_review(pr, out="review.json"):
    comments = review(pr)
    counts = Counter(c["severity"] for c in comments)
    verdict = "REJECT" if counts.get("major", 0) else "APPROVE"
    report = {"verdict": verdict, "counts": dict(counts), "comments": comments}
    with open(out, "w") as f:
        json.dump(report, f, indent=2)
    return verdict, report

v1, r1 = run_review(pr)
v2, r2 = run_review(fixed_pr, out="review_v2.json")
print(v1, "->", v2)
print("comments", len(r1["comments"]), "->", len(r2["comments"]))
```

Envolver todo el pipeline en un solo `run_review(pr, out=…)` hace el bot *reutilizable* — revisar, corregir, re-revisar con dos llamadas. El archivo de salida versionado (`review_v2.json`) es el rastro de auditoría que produce el bucle.

**🎯 Resultado esperado :**

```
REJECT -> APPROVE
comments 7 -> 4
```

**🩹 Si sale mal :** Si la primera línea imprime `APPROVE -> APPROVE`, `run_review` no heredó la lógica de severidad (deriva de copiar-pegar entre `review` y la línea del veredicto). Si los conteos dicen `7 -> 5`, la línea 15 corregida todavía lleva espacio final.

### 5.3 Verifica el bucle

**✅ Lista de verificación**

- ✅ Primera revisión: 7 comentarios, `REJECT` (bare-except es major).
- ✅ Después de arreglar `except:` → `except ValueError:` y acortar la línea 15: 4 comentarios, `APPROVE`.
- ✅ Se escriben tanto `review.json` como `review_v2.json` — el historial completo de decisiones del bot sobrevive.

**🤔 Pregunta(s) socrática(s)**

- El bucle aquí es manual (ejecutaste `run_review` dos veces). Un bot real llamaría a `run_review` en *cada* push. ¿Qué condición de parada o timeout mantendría a un bot autónomo de re-revisar para siempre en un PR que nunca converge?
- `REJECT` aquí significa "un problema mayor". Este bot no tiene noción de *tasa de recall* (¿se le escapó un bug real?) ni *precisión* (¿sus comentarios eran ruido?). Los bots de revisión se afinan normalmente por ambas. Si tuvieras un corpus de PR ya mergeados, ¿cómo medirías la precisión vs el recall de estas seis reglas?

## ⚠️ Errores comunes

- **Deriva base 0 vs base 1.** El motor indexa `lines[i]` en base 0; cada *comentario* reporta `i + 1`. Una regla que olvide el `+1` fija su comentario una línea desviado para siempre.
- **Reglas contextuales como lambdas.** `t_missing_docstring` exige `(lines, i)`; un lambda atascado verificando `pr["lines"][0]` marca silenciosamente cada `def` (o, peor, ninguno). Da a *todas* las reglas la misma firma `(lines, i)`.
- **Falsos negativos de except desnudo.** `except:` se captura; `except Exception:` no. Decide la política y codifica el startswith exacto (`except:`), nunca `"except" in line` (que dispara en comentarios como `# except: …`).
- **Espacio final = líneas de solo espacios.** Una línea de tres espacios falla `ln != ln.rstrip()` — se marca como espacio final, que podría decirse es ruido de *línea en blanco*. Deduplica las corridas en blanco antes del bucle de revisión si eso ensucia el reporte.
- **Mutar el espécimen en el lugar.** `fixed_lines = pr["lines"]` (sin copia) modificaría el PR *original* mientras lo "arreglas" — y `review.json` reflejaría las ediciones en silencio. Copia antes de reescribir.
- **Verificar el JSON dos veces.** Abrir `review.json` antes de que `run_review` terminara (o re-ejecutar `review` dos veces) da payloads obsoletos o duplicados. Una llamada a `run_review` por estado, una escritura.

## Lo que acabas de construir

Un bot de revisión de código de extremo a extremo: un PR modelado como `{file, lines}`, un registro de reglas como datos con seis pruebas deterministas, un motor de dos líneas que puntúa cada regla × cada línea, comentarios por línea con severidad y fragmento de código, un veredicto `REJECT`/`APPROVE` condicionado por `major`, un payload JSON más un resumen humano, y un bucle de re-revisión que cambió el veredicto una vez que el `except` desnudo fue nombrado. La columna vertebral transferible — **reglas como datos para que el motor siga siendo genérico**, **comentarios fijados a números de línea base 1 con un payload programático**, **la agregación por severidad conduciendo un veredicto booleano**, **el diff corregido re-revisado para probar el bucle** — es exactamente cómo se construyen los bots de revisión de CI reales antes (o junto) a cualquier capa de juicio LLM.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/code-review-bot/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/code-review-bot) en el repositorio del curso contiene el bot completo como un notebook — modelo de PR, registro de reglas, motor, exportación JSON y el bucle de corregir y re-revisar, ejecutable en Colab/Kaggle/Binder. Clona el repositorio o [ábrelo en un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Todo son datos — **carga las reglas desde JSON** en lugar de codificar `RULES` a mano, así `review_bot.py` queda sin cambios cuando cambia una regla.
- Convierte el bot en un **CLI**: `python3 review_bot.py payment.py [--out review.json]`, leyendo `sys.argv` como en los proyectos anteriores.
- Añade una **regla contextual**: marca los bloques `try:` cuyo `except` es *desnudo* solo cuando el ancho importa — o una regla que verifique `return` en cada rama de un `if`.
- Compáralo contra un revisor real: ejecuta **ruff** (`pip install ruff`) sobre `payment.py` y mapea cada código `E…`/`W…` de vuelta a tus reglas — una auditoría honesta de lo que las reglas escritas a mano omiten.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientes orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa, amigable para principiantes, para agregar el tuyo mediante un **pull request**, incluso si nunca has usado git: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, paso a paso. No se asume experiencia previa en git.

Bienvenido a escribir Python fuera del navegador. 🎓