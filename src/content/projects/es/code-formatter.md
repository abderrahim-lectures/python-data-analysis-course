---
title: "Formateador de Código"
description: "Formateador de código que impone un estilo consistente con cero configuración."
difficulty: "beginner"
estimatedMinutes: 60
xpReward: 100
tags: ["Developer Tools", "CLI Tools", "Utility"]
prerequisites:
  - "Leer y escribir archivos de texto"
  - "Métodos de strings: partition, rstrip, lstrip, join"
  - "Ejecutar scripts desde la terminal con argumentos"
learningObjectives:
  - "Inspeccionar un archivo fuente línea por línea y medir sus puntos 'sucios'"
  - "Aplicar normalizaciones seguras de espacios y comentarios solo con métodos de strings"
  - "Compactar corridas de líneas en blanco y forzar una nueva línea final"
  - "Diagnosticar indentaciones que no son múltiplos de 4"
  - "Reportar estadísticas antes/después y envolver la herramienta en un CLI con sys.argv"
---

# 🛠️ 🧹 Construir un Formateador de Código

El código real llega desordenado: espacios al final de las líneas, `#comentario` sin espacio, dos líneas en blanco donde solo va una, e indentación que se saltó la regla de 4 espacios. Este proyecto construye un **formateador de código**, una pequeña herramienta de terminal que lee un archivo de Python, aplica solo normalizaciones *seguras* de espacios y comentarios, compacta corridas de líneas en blanco, verifica la indentación, imprime un reporte de exactamente qué cambió y escribe la copia limpia en `formatted.py`. Se limita deliberadamente a espacios y separación de comentarios (nunca renombra ni reordena código), así que ejecutarla no puede romper el programa. Solo librería estándar, determinista, y se convierte en un comando real: `python3 code_formatter.py messy.py`.

Esto asume manejo de archivos y métodos básicos de strings. Es un proyecto opcional y no calificado, consulta [Proyectos del mundo real](/es/proyectos) para la lista completa, en crecimiento.

## 🎯 Lo que harás

1. Leer una muestra deliberadamente desordenada e imprimir sus "marcas de suciedad".
2. Recortar espacios finales y normalizar `#comentario` → `# comentario`.
3. Compactar corridas de líneas en blanco y forzar una nueva línea final.
4. Verificar la indentación contra pasos de 4 espacios e imprimir advertencias.
5. Envolverlo como `code_formatter.py <archivo>` con un reporte antes/después.

## Dónde ejecutar esto

**Localmente** es el hogar natural, la herramienta trabaja sobre un archivo en tu propio directorio.

```bash
mkdir code-formatter && cd code-formatter
touch code_formatter.py
```

**Google Colab, Kaggle Notebooks y Binder** también ejecutan cada bloque; en un notebook llamarías las funciones directamente (`format_source(...)`) en lugar de la ruta de sys.argv. Las constantes son idénticas en todos lados.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/code-formatter/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/code-formatter/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcode-formatter%2Fnotebook.es.ipynb)

## Configuración

Cero dependencias; un archivo fuente que atacar.

### Crea la muestra desordenada

```bash
mkdir code-formatter && cd code-formatter
touch code_formatter.py
```

Copia este archivo como `messy.py`. Los espacios finales existen a propósito, no dejes que tu editor los recorte antes del experimento:

```python
#sum module
def add(a,b):  #add two numbers
    """Add a and b."""

        return a + b   

def greet(name):
  msg = "hello " + name
   return msg   #too much indent
```

**✅ Lista de verificación**

- ✅ `messy.py` tiene **10 líneas**, y los espacios finales después de `#sum module`, `#add two numbers` y `return a + b` siguen visibles en un editor de texto.
- ✅ `python3 code_formatter.py` se ejecuta y todavía no imprime nada (es un archivo vacío).

**🤔 Pregunta(s) socrática(s)**

- Algunas transformaciones son *seguras* (eliminar espacios finales nunca cambia lo que hace un programa) y otras no (reordenar código). ¿Por qué "solo seguro" es un buen primer formateador, y qué rompería en un archivo lleno de comentarios *entre* funciones si reordenaras líneas?
- La línea de la muestra `   return msg   #too much indent` comete tres crímenes a la vez. Antes de escribir código, nombra los tres de memoria.

## Paso 1: Leer e inspeccionar el archivo

Primero debes *ver* el desastre. El Paso 1 lee `messy.py` e informa dónde está sucio.

### 1.1 Leer todas las líneas

**👟 Pista inicial :** `open(...).read().splitlines()`, líneas sin el `\n` final, así cada entrada es contenido puro.

```python
# code_formatter.py
import sys

def read_lines(path):
    with open(path) as f:
        return f.read().splitlines()

lines = read_lines("messy.py")
print("lines:", len(lines))
for i, ln in enumerate(lines, 1):
    print(f"{i:>2} |{ln}|")
```

`splitlines()` conserva el *contenido* de cada línea pero descarta el salto de línea, así el reporte puede mostrar los caracteres exactos de una línea, los espacios finales se vuelven visibles dentro de los delimitadores `|…|`. Las barras `|` importan: hacen legible el espacio invisible.

**🎯 Resultado esperado :**

```
lines: 10
 1 |#sum module   |
 2 |def add(a,b):  #add two numbers   |
 3 |    """Add a and b."""|
 4 ||
 5 |        return a + b   |
 6 ||
 7 |   |
 8 |def greet(name):|
 9 |  msg = "hello " + name|
10 |   return msg   #too much indent|
```

**🩹 Si sale mal :** Si la línea 1 muestra `#sum module` sin espacios finales, tu editor recortó automáticamente, vuelve a crear `messy.py` con un `echo`/pegado simple. Si la línea 7 no muestra nada dentro de `|   |`, la línea de solo espacios sobrevivió, bien.

### 1.2 Encontrar las marcas de suciedad

**👟 Pista inicial :** Tres recorridos: espacios finales, comentarios pegados al texto e indentación que no sea de 4.

```python
# code_formatter.py (continued)
trailing = [i for i, ln in enumerate(lines, 1) if ln != ln.rstrip()]
print("trailing whitespace on:", trailing)

comment_lines = [i for i, ln in enumerate(lines, 1)
                 if "#" in ln and not ln.lstrip().startswith("#!")]
print("comment lines:", comment_lines)

indent_bad = []
for i, ln in enumerate(lines, 1):
    body = ln.lstrip(" ")
    if body and not body.startswith("#"):
        lead = len(ln) - len(ln.lstrip(" "))
        if lead % 4 != 0:
            indent_bad.append((i, lead))
print("indent warnings:", indent_bad)
```

`ln != ln.rstrip()` es la prueba de espacios finales, `rstrip` elimina espacios solo del *final*, así que cualquier diferencia es basura final. La indentación se mide *contando* los espacios iniciales: `lstrip(" ")` da el cuerpo, y `len(ln) - len(body)` es el sangrado inicial, se marca cuando no es un múltiplo de 4.

**🎯 Resultado esperado :**

```
trailing whitespace on: [1, 2, 5, 7]
comment lines: [1, 2, 10]
indent warnings: [(9, 2), (10, 3)]
```

**🩹 Si sale mal :** Si alguna lista final tiene índices distintos, tu copia de `messy.py` perdió sus espacios (ver 1.1). Si `comment lines` muestra entradas diferentes, revisa la prueba de `#` en línea contra el archivo real.

### 1.3 Verifica la inspección

**✅ Lista de verificación**

- ✅ Se leyeron 10 líneas; espacios finales en 1, 2, 5, 7 (la línea 7 es de solo espacios).
- ✅ Hay comentarios en 1, 2, 10, los tres pegados al texto sin espacio después de `#`.
- ✅ Advertencias de indentación en (9, 2) y (10, 3), emitir una advertencia *sin* reescribir en silencio mantiene la herramienta honesta.

**🤔 Pregunta(s) socrática(s)**

- La línea 7 contiene tres espacios y nada más. ¿Es `isspace()` un mejor detector de "en blanco" que `== ""`? ¿Dónde una línea llena de tabs se vería "en blanco" con `== ""` pero no con `isspace()`?
- `indent_bad` ignora las líneas de solo comentarios (`startswith("#")`). ¿Por qué un *comentario* en la columna 3 debería ser legal aunque una *sentencia* en la columna 3 no lo sea?

## Paso 2: Recortar y arreglar comentarios

La limpieza segura: quitar espacios finales y luego poner un espacio después de cada `#`.

### 2.1 Los normalizadores línea por línea

**👟 Pista inicial :** Un `fix_line` que aplica rstrip y luego repara la parte del comentario con `partition("#")`.

```python
# code_formatter.py (continued)
def fix_line(ln):
    fixed = ln.rstrip()
    if "#" not in fixed or fixed.startswith("#!"):
        return fixed
    pre, _, comment = fixed.partition("#")
    comment = comment.strip()
    if comment == "":
        return pre.rstrip()
    if pre.strip() == "":
        return "# " + comment
    return pre.rstrip() + "  # " + comment
```

El corte `partition("#")` mantiene el lado izquierdo (código) separado del comentario, así cada lado se normaliza de forma independiente. Comentario en la columna 0 → `# sum module`; comentario en línea → código, dos espacios, `# comentario`. `#!` (un encabezado de script shebang) se deja solo, tiene su propia convención.

**🎯 Resultado esperado :** Una función, todavía sin salida, pero razona qué hace con la línea 10: `   return msg   #too much indent` → `   return msg  # too much indent`.

### 2.2 Aplicarlo a todo el archivo

**👟 Pista inicial :** Mapear `fix_line` sobre todas las líneas e imprimir el resultado.

```python
# code_formatter.py (continued)
fixed = [fix_line(ln) for ln in lines]
for i, ln in enumerate(fixed, 1):
    print(f"{i:>2} |{ln}|")
```

**🎯 Resultado esperado :**

```
 1 |# sum module|
 2 |def add(a,b):  # add two numbers|
 3 |    """Add a and b."""|
 4 ||
 5 |        return a + b|
 6 ||
 7 ||
 8 |def greet(name):|
 9 |  msg = "hello " + name|
10 |   return msg  # too much indent|
```

**🩹 Si sale mal :** Si la línea 1 se volvió `  # sum module`, la rama de columna 0 (`pre.strip() == ""`) no se ejecutó, verifica que *particionaste* antes de inspeccionar `pre`. Si `#` todavía toca el texto, se omitió `comment.strip()` y el espacio nunca se insertó.

### 2.3 Verifica la limpieza

**✅ Lista de verificación**

- ✅ Espacios finales eliminados de 1, 2, 5, 7.
- ✅ `#sum module` → `# sum module`; `#add two numbers` → `# add two numbers`; `#too much indent` → `# too much indent`.
- ✅ El código y el comentario mantienen exactamente dos espacios entre ellos, el contrato `pre.rstrip() + "  # "`.

**🤔 Pregunta(s) socrática(s)**

- `fix_line` trata el lado *izquierdo* como código. ¿Qué pasaría con un *string* de Python que contenga `#` (`s = "color #ff00aa"`)? ¿Vale la pena un formateador consciente de strings para una primera herramienta, y qué dice eso sobre el límite del "subconjunto seguro"?
- `#!` se excluye con un caso especial. Los comentarios de línea bash (`#!`, `##`), los docstrings (`"""`) y los strings en línea sobrecargan `#`. ¿Qué única regla de oro evita que un formateador principiante corrompa archivos válidos?

## Paso 3: Compactar corridas en blanco y forzar una nueva línea final

Las líneas de solo espacios y los blancos repetidos son ruido de maquetación. El Paso 3 los aprieta.

### 3.1 Un espacio en blanco a la vez

**👟 Pista inicial :** Recorre las líneas arregladas, descartando cualquier línea en blanco (`""` o de solo espacios) que siga directamente a otra línea en blanco.

```python
# code_formatter.py (continued)
def collapse_blanks(lines):
    out = []
    for ln in lines:
        blank = ln.strip() == ""
        if blank and out and out[-1].strip() == "":
            continue
        out.append(ln)
    return out

collapsed = collapse_blanks(fixed)
print("lines after collapse:", len(collapsed))
for i, ln in enumerate(collapsed, 1):
    print(f"{i:>2} |{ln}|")
```

`strip() == ""` llama en blanco a una línea *tanto* si es una línea realmente vacía como si es una línea de solo espacios (`   `), ambas son maquetación, ninguna lleva contenido. La protección `out and out[-1].strip() == ""` conserva solo la *primera* de una corrida, así 2+ blancos se compactan a 1 en todas partes en una sola pasada.

**🎯 Resultado esperado :**

```
lines after collapse: 9
 1 |# sum module|
 2 |def add(a,b):  # add two numbers|
 3 |    """Add a and b."""|
 4 ||
 5 |        return a + b|
 6 ||
 7 |def greet(name):|
 8 |  msg = "hello " + name|
 9 |   return msg  # too much indent|
```

**🩹 Si sale mal :** Si la línea 7 todavía se imprime como en blanco, la línea de solo espacios no se volvió en blanco con `strip() == ""`, sí lo hizo, salvo que la línea contenga caracteres invisibles que no son espacios. Si una *corrida de tres* deja dos blancos, la protección revisó el `ln` crudo en lugar de la última línea añadida.

### 3.2 La nueva línea final

**👟 Pista inicial :** Volver a unir con `"\n"` y siempre terminar el texto con `"\n"`.

```python
# code_formatter.py (continued)
def build_text(lines):
    return "\n".join(lines) + "\n"

text = build_text(collapsed)
print("ends with newline:", text.endswith("\n"))
print("input bytes:", len(open("messy.py").read().encode()),
      "output bytes:", len(text.encode()))
```

La última línea de un archivo debe terminar con una nueva línea, la convención POSIX, y lo que `join + "\n"` garantiza incluso cuando la fuente lo olvidó. Los conteos de bytes son una prueba rápida de salud: la limpieza *encoge* el archivo (177 → 166 bytes) porque el espacio basura son bytes reales.

**🎯 Resultado esperado :**

```
ends with newline: True
input bytes: 177 output bytes: 166
```

**🩹 Si sale mal :** Si `ends with newline: False`, el `+ "\n"` quedó antes del `join`. Si los bytes de salida son *mayores*, la normalización de comentarios agregó espacios más rápido de lo que el recorte final los eliminó, mide con honestidad, ese es el veredicto de la herramienta.

### 3.3 Verifica la compactación

**✅ Lista de verificación**

- ✅ De 10 líneas → 9: la línea de solo espacios `   ` se compactó con el blanco de arriba.
- ✅ Queda exactamente una línea en blanco entre los cuerpos de las funciones.
- ✅ `text` termina en una nueva línea; la salida (166 bytes) es más pequeña que la entrada (177).

**🤔 Pregunta(s) socrática(s)**

- `build_text` agrega un `\n` para todo el archivo. ¿Por qué ese es el *único* salto de línea que ese conteo necesita, y qué haría `"\n".join(lines)` *sin* la nueva línea final a `splitlines()` en la siguiente lectura?
- La compactación de líneas en blanco es idempotente (ejecutarla dos veces no cambia nada la segunda). ¿Por qué la idempotencia es una *buena propiedad* para un formateador, y qué transformación de este proyecto *no* es idempotente?

## Paso 4: Diagnóstico de indentación

En Python la indentación es semántica, así que el formateador *diagnostica* en lugar de adivinar.

### 4.1 Emitir advertencias

**👟 Pista inicial :** Re-ejecutar el escaneo de conteo de sangría e imprimir cada línea que no sea múltiplo de 4 con su conteo actual de espacios.

```python
# code_formatter.py (continued)
print("INDENT WARNINGS")
for i, ln in enumerate(collapsed, 1):
    body = ln.lstrip(" ")
    if body and not body.startswith("#"):
        lead = len(ln) - len(ln.lstrip(" "))
        if lead % 4 != 0:
            print(f"  line {i}: {lead} spaces (should be a multiple of 4)")
```

El formateador se niega a *adivinar* el arreglo, `2` espacios en la línea 8 y `3` en la 9 son ambiguos (`2` pertenece bajo el `def`, pero la herramienta no puede saber el contexto), así que los expone ante el ojo del desarrollador.

**🎯 Resultado esperado :**

```
INDENT WARNINGS
  line 8: 2 spaces (should be a multiple of 4)
  line 9: 3 spaces (should be a multiple of 4)
```

**🩹 Si sale mal :** Si las advertencias nombran líneas distintas, la lista compactada tiene posiciones diferentes que `messy.py`, el reporte habla del texto *actual*. Si no se imprime nada, `lstrip(" ")` sobre una línea indentada con tab oculta el sangrado (ver la pregunta socrática abajo).

### 4.2 El contrato de tabs

**👟 Pista inicial :** Convertir cualquier corrida de tabs existente en bloques de 4 espacios y registrar si existió alguna.

```python
# code_formatter.py (continued)
has_tabs = any("\t" in ln for ln in collapsed)
print("tabs found in source:", has_tabs)
```

`\t` está prohibido en la muestra (y normalmente en código Python según PEP 8). La verificación es un solo `any(...)` sobre las líneas; si se encuentra, `.expandtabs(4)` las reescribiría, pero como `messy.py` no tiene ninguno, la respuesta impresa es `False`, y la historia del tab queda como un contrato documentado en lugar de una mutación oculta.

**🎯 Resultado esperado :** `tabs found in source: False`

**🩹 Si sale mal :** Si se imprime `True`, tu copia ganó un tab en algún lugar, decide: mantenlo como diagnóstico (reporta la línea) o expándelo con `.expandtabs(4)`, reemplazando la contabilidad posterior de espacios.

### 4.3 Verifica los diagnósticos

**✅ Lista de verificación**

- ✅ Las advertencias nombran las líneas 8 (2 espacios) y 9 (3 espacios), ambas sentencias, no comentarios.
- ✅ `tabs found in source: False`.
- ✅ En este paso no se *escribió* nada, el diagnóstico es de solo lectura por diseño.

**🤔 Pregunta(s) socrática(s)**

- Una línea indentada con un *tab* falla silenciosamente `lstrip(" ")` (su sangrado es invisible). ¿Qué único cambio hace que el diagnóstico también capture tabs, y qué ancho de tab (4 vs 8) asumiría la regla `% 4`?
- `def` está en la columna 0, su cuerpo en 4, los cuerpos anidados en 8. Dados esos tres hechos, ¿existe *alguna* regla inequívoca para "arreglar" los espacios iniciales de una línea indentada, o la advertencia es el producto correcto aquí?

## Paso 5: Guardar el resultado y convertirlo en un CLI

La herramienta necesita una salida a archivo y una puerta de entrada de línea de comandos.

### 5.1 Escribir formatted.py

**👟 Pista inicial :** Escribir `build_text(...)` de vuelta con `open(..., "w")` y releerlo para probar que hace round-trip.

```python
# code_formatter.py (continued)
with open("formatted.py", "w") as f:
    f.write(text)

again = open("formatted.py").read()
print("formatted.py lines:", len(again.splitlines()))
print("round-trip identical:", again == text)
```

Persistir el resultado hace que la herramienta sea *útil*, `messy.py` queda como el espécimen, `formatted.py` es la copia limpia. Releer y comparar `== text` es la misma disciplina de round-trip sin pérdidas que usarías en cualquier pipeline: escribir, leer de vuelta, verificar igualdad.

**🎯 Resultado esperado :**

```
formatted.py lines: 9
round-trip identical: True
```

**🩹 Si sale mal :** Si el round-trip dice `False`, el manejo extra de `"\n"` o los espacios finales cambiaron, compara `repr(text)` contra `repr(again)`.

### 5.2 El despachador

**👟 Pista inicial :** Leer `sys.argv[1]` como el nombre del archivo, formatearlo e imprimir el resumen antes/después.

```python
# code_formatter.py (continued)
def format_file(path):
    lines = open(path).read().splitlines()
    fixed = [fix_line(ln) for ln in lines]
    collapsed = collapse_blanks(fixed)
    text = build_text(collapsed)
    with open("formatted.py", "w") as f:
        f.write(text)
    trailing = [i for i, ln in enumerate(lines, 1) if ln != ln.rstrip()]
    print(f"{path}: {len(lines)} -> {len(collapsed)} lines; "
          f"{len(trailing)} trailing-whitespace fixes; "
          f"see formatted.py")

if __name__ == "__main__":
    format_file(sys.argv[1])
```

Todo el pipeline, leer, arreglar, compactar, unir, escribir, resumir, es ahora *una* función de una ruta de archivo. `sys.argv[1]` lo convierte en un CLI: escribe `python3 code_formatter.py messy.py` y la herramienta edita desde la línea de comandos.

**🎯 Vamos a ejecutarlo :**

```bash
python3 code_formatter.py messy.py
```

**🎯 Resultado esperado :**

```
messy.py: 10 -> 9 lines; 4 trailing-whitespace fixes; see formatted.py
```

**🩹 Si sale mal :** Si aparece un `IndexError`, faltó `sys.argv[1]` (ejecútalo *con* el nombre del archivo). Si los conteos no dan 10→9 y 4, `format_file` releyó un `formatted.py` que ya existía, siempre opera sobre el archivo espécimen.

### 5.3 Verifica el CLI

**✅ Lista de verificación**

- ✅ `python3 code_formatter.py messy.py` escribe `formatted.py` (9 líneas) e imprime el resumen.
- ✅ Los números del resumen coinciden con los pasos anteriores: 10→9 líneas, 4 arreglos de espacios finales.
- ✅ `messy.py` no se toca (entrada de solo lectura), la herramienta nunca reescribe la fuente.

**🤔 Pregunta(s) socrática(s)**

- `format_file` escribe a un nombre *fijo* `formatted.py`. La segunda ejecución sobrescribe la primera salida. ¿Preferirías `f"formatted_{path}"` o una bandera `--out`, y cuál es el argumento para *no* sobrescribir el archivo fuente directamente?
- Este formateador hoy es de solo espacios. Si añadieras una transformación más (p. ej. una línea en blanco después de cada función `def`), ¿qué prueba demostraría que *nunca* rompe el significado de `messy.py`, y qué significa "no cambiar nunca el significado" para Python, donde la indentación es crítica?

## ⚠️ Errores comunes

- **`splitlines` vs `read().split("\n")`.** `splitlines()` ignora el elemento final vacío que un `"\n"` split ingenuo produce, terminando con una línea en blanco espuria al final.
- **`lstrip()` también elimina tabs.** Contar la indentación con `len(ln) - len(ln.lstrip())` cuenta espacios *y* tabs como un carácter cada uno; usa `lstrip(" ")` o una pasada consciente de tabs. (Este proyecto verifica tabs por separado.)
- **Compactar blancos sobre la lista equivocada.** Compactar antes de recortar significa que una línea de solo espacios (`   `) se comporta como *contenido* y nunca se fusiona con el blanco de arriba. Orden: recortar → arreglar → compactar.
- **`partition` vs `split`.** `partition("#")` conserva las tres partes (pre, "#", post); `split("#")` manejaría mal un comentario que contenga `#` o destruiría el límite en el primer separador.
- **Separación de comentarios en strings.** `s = "#ff00aa"` contiene un `#` *dentro de un literal de string*, un formateador de solo espacios lo reescribiría felizmente. El límite del "subconjunto seguro" es tu escudo; documéntalo.
- **Sobrescribir el espécimen.** Escribir `messy.py` de vuelta destruye lo que estás midiendo. Escribe a `formatted.py`; mantén la entrada de solo lectura.

## Lo que acabas de construir

Un formateador de código funcional con un CLI real: inspección de líneas con barras `|…|` visibles, recorte de espacios finales y separación de comentarios `#` con builtins de strings, compactación de corridas en blanco con un barrido idempotente de una pasada, una garantía de nueva línea final con prueba de conteo de bytes, diagnósticos de indentación de solo lectura en pasos de 4, una verificación del contrato de tabs y un escritor de `formatted.py` que hace round-trip byte idéntico. Debajo, los patrones son reutilizables en cualquier lugar: **mide los puntos sucios antes de normalizar**, **aplica solo transformaciones seguras y reversibles**, **haz la detección de blancos consciente de espacios (`strip() == "")**, **diagnostica en lugar de adivinar cuando un arreglo es ambiguo** y **mantén la entrada de solo lectura mientras envías la salida por separado**.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/code-formatter/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/code-formatter) en el repositorio del curso contiene el formateador completo como un notebook, inspección, arreglos, compactación, diagnósticos y CLI, ejecutable en Colab/Kaggle/Binder. Clona el repositorio o [ábrelo en un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Ejecútalo sobre un archivo real *tuyo*: `python3 code_formatter.py some_script.py` y lee lo que reporta.
- Agrega el manejo `.expandtabs(4)` para que los archivos indentados con tabs se conviertan en la misma corrida, con una línea `Tabs converted: N`.
- Haz inteligente el nombre de la salida: `formatted_<basename>` en lugar de un nombre fijo, o una bandera `--check` que solo imprime el reporte sin escribir un archivo (amigable con CI).
- Compáralo contra el real: ejecuta Black (`pip install black`) sobre el mismo espécimen y haz un diff de `formatted.py` contra la salida de Black, una lección humilde de cuánto más profundo llega un formateador *real*.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientes orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene una guía completa, amigable para principiantes, para agregar el tuyo mediante un **pull request**, incluso si nunca has usado git: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, paso a paso. No se asume experiencia previa en git.

Bienvenido a escribir Python fuera del navegador. 🎓