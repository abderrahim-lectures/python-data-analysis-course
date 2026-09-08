---
title: "Analizador de Artículos de Investigación"
description: "Extrae datos estructurados de artículos académicos — citas, métodos, resultados y referencias — a partir de texto plano con Python puro."
difficulty: "advanced"
estimatedMinutes: 240
tags: ["scripting", "regex", "text-processing", "data-extraction", "cli"]
learningObjectives:
  - "Analiza un artículo académico de texto plano en secciones estructuradas con detección de encabezados"
  - "Extrae citas y construye una lista de referencias con un analizador impulsado por regex"
  - "Clasifica el texto de métodos y resultados por pertenencia a sección"
  - "Implementa una búsqueda rankeada diminuta sobre el contenido analizado"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/functions", "python-101/dictionaries"]
---

# 📄 Construye un Analizador de Artículos de Investigación

Leer un artículo es una cosa; *indexar* un corpus de ellos es otra. Una revisión de literatura, un gestor de referencias, una herramienta de generación de revisiones — todos empiezan con el mismo trabajo poco glamoroso: convertir un muro de prosa en una estructura con secciones, citas y una bibliografía con la que una máquina pueda trabajar. Este proyecto construye ese analizador desde cero en Python puro. Tomarás el texto plano de un artículo académico real, detectarás sus encabezados de sección por su forma, dividirás el cuerpo en partes estructuradas, extraerás citas estilo `[1]`, `[2, 3]` y las referencias a las que apuntan, y luego construirás una pequeña búsqueda rankeada sobre el contenido analizado. La decodificación de PDF está fuera de alcance y deliberadamente lo está — la ingeniería interesante es el texto en el momento en que ya está en tu disco: reconocimiento de formas, regex y estructuras de datos, ninguna de las cuales necesita una librería de PDF.

Esto asume Python 101 — E/S de archivos, strings, funciones y diccionarios. Opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Cargar el texto plano de un artículo real y echar un vistazo a su forma cruda.
2. Detectar los encabezados de sección por su tipografía (números, Title Case, longitud) en lugar de una lista escrita a mano.
3. Dividir el artículo en un mapa estructurado `{sección: texto}` que puedas consultar.
4. Extraer las citas en línea y construir una sección de referencias — con la relación cita↔referencia intacta.
5. Construir una búsqueda rankeada diminuta (frecuencia de términos) sobre las secciones analizadas y comprobarla con el sentido común.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal — el analizador opera sobre archivos de texto plano que puedes encontrar, tocar y hacer diff, y la regla de solo-stdlib (`re`, `collections`, `pathlib`) significa cero fricción de instalación más allá de `uv init`.

**GitHub Codespaces** es la experiencia idéntica: abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), clona el `.txt` de un artículo público y analízalo en una pestaña del navegador.

**Google Colab, Kaggle Notebooks y Binder manejan el análisis con honestidad** — Python puro corre en cualquier lugar, y un artículo corto de texto plano pegado o subido al notebook se analiza exactamente como localmente. El notebook puede incluso generar un *artículo de muestra* sobre la marcha para que tengas datos deterministas antes de obtener uno real. Lo único que un notebook no puede reproducir es la alegría de "agarra un `.txt` real de arXiv y analízalo" — ese tirón es un hábito local/de terminal.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/research-paper-parser/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/research-paper-parser/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fresearch-paper-parser%2Fnotebook.ipynb)

## Configuración

Dos cosas antes de que aterrice el primer encabezado: `uv` en tu PATH, y un artículo genuino de texto plano para masticar.

### Instala `uv`

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, luego:

```bash
uv --version
mkdir research-paper-parser && cd research-paper-parser
uv init --bare
```

### Consigue un artículo de texto plano

La página `Source` de arXiv ofrece un `.txt` de texto plano para la mayoría de los artículos, y el repositorio del curso incluye una pequeña muestra:

```bash
mkdir -p papers
# fetch a real one (example: an arXiv paper's HTML -> download source -> extract .txt)
curl -L -o papers/sample.txt https://raw.githubusercontent.com/abderrahim-lectures/python-data-analysis-course/main/examples/research-paper-parser/paper.txt
wc -l papers/sample.txt
```

Si la muestra no está disponible, cualquier `.txt` de un artículo de conferencia funciona — el analizador está basado en formas, no bloqueado por formato.

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `papers/sample.txt` existe y `wc -l` reporta unos cientos de líneas de prosa.
- ✅ `head -20 papers/sample.txt` muestra un título, luego encabezados de sección, luego texto del cuerpo.

## Paso 1: Carga e inspecciona el texto crudo

Todo analizador empieza *mirando* — imprimir la forma del archivo antes de que cualquier lógica se comprometa con supuestos. Este paso lee todo el artículo, lo divide en líneas y calcula las estadísticas baratas que te enseñan cómo se ve "un encabezado" en *este* archivo (los títulos son cortos, en ALL-CAPS o Title Case, numerados; las líneas del cuerpo son oraciones largas). Adivinar encabezados antes de esta inspección es cómo los analizadores caen en el bloqueo de formato.

**👟 Pista inicial:** Empieza escribiendo `load(path)` que lea todo el archivo con `Path(path).read_text(encoding="utf-8", errors="ignore").splitlines()`, luego imprime el conteo de líneas y una ventana sobre las primeras 25 líneas.

```python
# parser.py
from pathlib import Path

def load(path: str) -> list[str]:
    return Path(path).read_text(encoding="utf-8", errors="ignore").splitlines()

lines = load("papers/sample.txt")
print("total lines:", len(lines))
for i in range(0, min(25, len(lines))):
    print(f"{i:4d} | {lines[i][:80]}")
```

`read_text(...)["utf-8", errors="ignore"]` se traga el byte mojibake ocasional de un `.txt` antiguo sin bloquearse — una elección pragmática para un rasguñador de texto (perder un carácter corrupto gana a abortar todo el análisis). `errors="ignore"` también es la bandera roja del revisor: es una perilla de pérdida de datos silenciosa, y elegirla *deliberadamente* con un comentario es el movimiento profesional. El corte `[:80]` es cordura barata sobre lo que el archivo contiene realmente antes de que escribas una sola regla de coincidencia.

**🎯 Resultado esperado:** Un conteo (~300-600 líneas típico) y una ventana de las primeras 25 líneas que muestra el título, un Abstract, y luego encabezados de sección numerados como `1. Introduction`, `2. Methods` — la evidencia de forma exacta de la que dependen las heurísticas del siguiente paso.

**🩹 Si sale mal:** Si el archivo está vacío o el conteo de líneas es diminuto, la descarga falló o la ruta de la muestra es incorrecta — comprueba que `papers/sample.txt` existe y tiene bytes no cero. Si cada línea imprime vacía, el archivo es UTF-16 u otro no-UTF-8 — `errors="ignore"` ocultaría *ese* fallo al eliminar todo; imprime `repr(lines[5][:50])` para ver los bytes crudos.

**✅ Lista de verificación**

- ✅ El conteo de líneas es sensato (cientos) y las primeras líneas incluyen un título + Abstract.
- ✅ Has *visto* los estilos de encabezado con tus propios ojos antes de codificar el detector.
- ✅ `errors="ignore"` es una elección *deliberada*, no un accidente — puedes decir cuándo la eliminarías.

**🤔 Pregunta(s) socrática(s)**

- Antes de escribir el detector de encabezados, imagina dos artículos: uno con `**3. Results**` (negrita, de tres palabras) y uno con una línea simple `Results and Discussion`. Si escribes un regex para el *primero*, ¿qué te enseña el *segundo* sobre por qué forma-sobre-sintaxis es el movimiento robusto para un analizador destinado a generalizar?
- `errors="ignore"` elimina bytes corruptos silenciosamente. Nombra un escenario donde esa política cause una *respuesta incorrecta en lugar de un bloqueo* — y el diagnóstico que lo atraparía.

## Paso 2: Detecta los encabezados de sección por forma

El enfoque frágil es una lista codificada a mano (`if line == "Introduction":`). El enfoque robusto trata la "condición de encabezado" como una *puntuación* — una línea es un encabezado cuando es corta, empieza por sí misma y se lee como un título (Title Case o ALL-CAPS, posiblemente numerado). Esto hace que el analizador sobreviva a títulos que nunca ha visto, que es todo el punto de la extracción basada en formas.

**👟 Pista inicial:** Empieza escribiendo `is_heading(line)` con las tres señales — un prefijo numerado `^\d+(\.\d+)*\.?\s`, `istitle()`/`isupper()`, y la lista `known` — combinadas con `or`, luego escanea tus líneas del Paso 1 e imprime todo lo que marcaste.

```python
# parser.py (continued)
import re

def is_heading(line: str) -> bool:
    s = line.strip()
    if not s or len(s) > 80:
        return False
    numbered = bool(re.match(r"^\d+(\.\d+)*\.?\s+\S", s))
    titlecase = s.istitle() or s.isupper()
    # 'Abstract', 'References', 'Conclusion' are single-word famous headings too
    known = s in {"Abstract", "Introduction", "Methods", "Results",
                  "Discussion", "Conclusion", "References"}
    return (numbered or titlecase or known) and len(s.split()) <= 12

headings = [(i, ln) for i, ln in enumerate(lines) if is_heading(ln)]
for i, h in headings[:12]:
    print(f"{i:4d}: {h}")
```

El detector es un predicado compuesto: un encabezado es una línea que es corta (`len<=80`, `<=12 palabras`), y se lee como un título (con prefijo de número, Title Case, ALL-CAPS o un nombre famoso de una sola palabra). Cualquier señal sola es un salto; la *unión* es cómo los artículos reales expresan encabezados en estilos salvajemente variados. Nota el `<=80` y `<=12` deliberadamente gruesos: rechazan la prosa mientras aceptan prácticamente cualquier encabezado que una revista acuñe, intercambiando unos cuantos falsos positivos (una oración corta en negrita) por la catástrofe mucho mayor del falso negativo (perderse un encabezado).

**🎯 Resultado esperado:** Las primeras ~10-12 líneas de encabezado con sus índices de línea — coincidiendo con tu comprobación visual del Paso 1, porque las reglas se derivaron de esa misma inspección.

**🩹 Si sale mal:** Si se pierde un encabezado real, su estilo cayó fuera del predicado — pásalo por las tres sub-pruebas (`numbered`, `istitle`, `isupper`) para ver qué rama falló, luego afloja esa. Si se marcan líneas cortas de prosa como encabezados (una oración lacónica de menos de 12 palabras que empieza con mayúscula), ese es un falso positivo conocido de la detección de formas — el intercambio es intencional, y el division en secciones del Paso 3 descarta limpiamente el texto de cuerpo basura de todos modos.

**✅ Lista de verificación**

- ✅ Los encabezados detectados coinciden con tu lectura visual del Paso 1 dentro de un par de aciertos.
- ✅ Puedes decir *cuál* sub-señal atrapó cada encabezado (numerado vs Title Case vs palabra conocida).
- ✅ Puedes articular el intercambio de falsos positivos (oraciones cortas tituladas) y por qué vale la pena.

**🤔 Pregunta(s) socrática(s)**

- El predicado es "cualquiera de varias señales". Dalo la vuelta: ¿qué se rompe si exiges *TODAS* (corta Y numerada Y Title Case)? Nombra un patrón de encabezado real que rechazaría — ese es exactamente el peligro de sobreajuste que un detector de formas debe esquivar.
- `known` es una lista codificada a mano de nombres de sección famosos. Extiende el pensamiento: ¿qué pasa cuando un artículo llama a una sección "5. Experimental Setup" — qué rama la atrapa, y cuál es el riesgo residual si este detector se topa con una sección titulada, digamos, "A Note on Notation"?

## Paso 3: Divide en un mapa de secciones estructuradas

Ahora que los encabezados están encontrados, la recompensa: convertir una lista plana de líneas en un diccionario `{encabezado: texto_del_cuerpo}`. Cada encabezado inicia una nueva sección, y todo lo que hay entre él y el siguiente encabezado le pertenece. Esta es la estructura de datos que convierte "leer el artículo" en "hacerle preguntas al artículo" — y reutiliza exactamente el detector que ya construiste.

**👟 Pista inicial:** Empieza escribiendo `split_sections(lines, is_heading)` como un fold: un nombre de `current` de encabezado, una lista `buf`, y un bucle `for` que cierra el cubo en el dict cada vez que se dispara un nuevo encabezado (con contenido).

```python
# parser.py (continued)

def split_sections(lines: list[str], is_heading) -> dict[str, str]:
    sections: dict[str, str] = {}
    current = "frontmatter"
    buf: list[str] = []
    for ln in lines:
        if is_heading(ln) and buf:
            sections[current] = "\n".join(buf).strip()
            current = ln.strip()
            buf = []
        else:
            buf.append(ln)
    if buf:
        sections[current] = "\n".join(buf).strip()
    return sections

sections = split_sections(lines, is_heading)
for name, body in sections.items():
    words = len(body.split())
    print(f"{name[:45]:<47} {words:>6} words")
```

El núcleo es un *fold acumulador*: `current` apunta al encabezado que estás llenando, `buf` reúne sus líneas, y cuando aparece un nuevo encabezado cierras el último cubo (solo si tenía contenido — `if buf` omite la deriva vacía entre encabezados consecutivos). El cubo de frontmatter atrapa todo lo anterior al primer encabezado real — título, autores, abstract — bajo una clave sintética, manteniendo el mapa total sin texto descartado. La salida es el momento en que el artículo deja de ser un string y se convierte en *datos consultables*.

**🎯 Resultado esperado:** Un `dict` con una entrada `frontmatter` y una entrada por sección real, cada una imprimiendo su nombre y conteo de palabras — Methods más pesado que Conclusion, frontmatter pequeño pero presente.

**🩹 Si sale mal:** Si solo aparecen `frontmatter` y una sección gigante, el detector de encabezados se disparó una vez arriba — el primer encabezado del cuerpo se perdió en el Paso 2; vuelve a ejecutar el detector y aflójalo. Si un encabezado se *traga* dentro de la sección de arriba, `is_heading` devolvió False para exactamente el encabezado que inicia el límite del cubo — misma solución, línea diferente. Si las secciones se mezclan, la protección `if is_heading and buf` — no `if is_heading` solo — está eliminando un cierre de buffer vacío cuando dos encabezados quedan adyacentes.

**✅ Lista de verificación**

- ✅ El mapa de secciones refleja la lista de encabezados del Paso 1 — cada encabezado detectado es una clave de diccionario.
- ✅ No se pierde texto: la unión de todos los cuerpos de sección reconstruye las líneas originales.
- ✅ `frontmatter` captura el bloque previo al encabezado (título + abstract) intacto.

**🤔 Pregunta(s) socrática(s)**

- El fold cierra un cubo solo cuando se dispara el *siguiente* encabezado. Traza qué pasaría si un encabezado quedara al *final* de una sección — ¿cómo garantiza el código que el `buf` final aún aterrice en el dict (mira el `if buf` final)? ¿Qué bug aparece sin él?
- Los *límites* de sección están definidos por encabezados; pero las claves del mapa son strings de encabezado crudos. Si ahora quisieras "the Methods" programáticamente, ¿qué le hace un encabezado como `3. Methods and Materials` vs `Methods` a las búsquedas de coincidencia exacta — y por qué eso aboga por normalizar las claves al almacenarlas?

## Paso 4: Extrae las citas y construye una lista de referencias

Un analizador no termina en las secciones — un analizador de *investigación* debe encontrar las referencias. Los artículos citan con `[12]`, `[3, 5]` o `[4–7]` en línea, y esos tokens son los bordes de un grafo de citas de vuelta a la bibliografía numerada. Este paso aísla las referencias, extrae los números de cita y mapea `número → artículo` usando el bloque de la lista de referencias — convirtiendo el ruido entre corchetes en un dict estructurado `{num: título}`.

**👟 Pista inicial:** Empieza escribiendo `extract_references(text)` para cortar todo después del marcador `References`, luego `citations_from(body)` con `re.findall(r"\[(\d+(?:\s*,\s*\d+)*)\]", ...)` que divide cada bloque de corchetes en sus números individuales.

```python
# parser.py (continued)
import re

def extract_references(text: str, prefix: str = "References") -> list[str]:
    m = re.search(prefix + r"\s*\n(.*)", text, re.S)
    return [l for l in (m.group(1).splitlines() if m else []) if l.strip()][:20]

refs = extract_references("\n".join(lines))
print("first few references:")
for r in refs[:5]:
    print("  ", r[:90])

def citations_from(body: str) -> list[int]:
    nums = re.findall(r"\[(\d+(?:\s*,\s*\d+)*)\]", body)
    out = []
    for block in nums:
        out += [int(x) for x in re.split(r"\s*,\s*", block)]
    return out

print("citations in frontmatter:", citations_from(sections.get("frontmatter", ""))[:10])
```

`extract_references` divide en el marcador `References` y agarra todo lo que viene después — una heurística cruda pero altamente efectiva de "el resto del artículo es la bibliografía" (reforzada por el corte `.splitlines()[:~20]`). `citations_from` es el motor de citas en línea: `findall` agarra grupos entre corchetes como `[12, 34]`, y el `re.split` interior convierte el bloque separado por comas en números individuales. El patrón `\d+(?:\s*,\s*\d+)*` coincide con uno-o-muchos números separados por comas, que es exactamente el caso `[4, 7, 12]`; el rango de guion `[4–7]` es un TODO marcado que extenderías. Los números de cita son las *direcciones* hacia la lista de referencias — el join `{num: título}` es el puente entre "lo que el texto cita" y "lo que la bibliografía lista oficialmente".

**🎯 Resultado esperado:** Las primeras ~5 líneas de referencia de la bibliografía, y una lista corta de citas numéricas extraídas del frontmatter (el abstract normalmente cita algunas) — probando que tanto el divisor de secciones como el regex de citas funcionan de punta a punta.

**🩹 Si sale mal:** Si `extract_references` devuelve una lista vacía, el marcador `References` no es una línea simple — algunos artículos lo subrayan o lo numeran (`References` vs `REFERENCES`); prueba la bandera `re.IGNORECASE` insensible a mayúsculas. Si `citations_from` no encuentra nada, el artículo usa citas autor-año `(Smith, 2020)` en lugar de corchetes numéricos — esa es una gramática genuinamente diferente, y tu regex *debería* fallar en ella, que es la lección: sabe qué esquema de citas estás apuntando. Si los rangos de guion `[4–7]` no se expanden, esa es la rama TODO conocida — `int("4–7")` lanzará un `ValueError` que es tu señal para implementar la expansión de rango.

**✅ Lista de verificación**

- ✅ `extract_references` devuelve las líneas iniciales de la bibliografía, no texto del cuerpo.
- ✅ `citations_from` convierte `[1, 2]` en `{1, 2}` y `[12]` en `{12}`.
- ✅ Puedes contrastar la discusión del esquema numérico vs autor-año *antes* de prometer un analizador universal.

**🤔 Pregunta(s) socrática(s)**

- El patrón de corchetes de `findall` es codicioso sobre comas: `[12, 34, 56]` produce un bloque que se divide en tres números. Reescribe en tu cabeza qué produce un `[12, 34]` más un `[5]` separado — y piensa si el orden de los números en la lista de salida coincide con el orden en el texto cuando aparecen bloques mixtos de cita única y múltiple. ¿Importa el orden para los bordes del grafo de citas?
- El divisor `{"References ..."}` asume "bloque de referencias = todo después del marcador". ¿Qué le pasa al analizador si un artículo pone un *Apéndice* después de sus referencias — dónde aterriza el texto del apéndice en `extract_references`, y cuál es la regla extra única que evita que contamine la bibliografía?

## Paso 5: Una pequeña búsqueda rankeada sobre el artículo analizado

Secciones, citas, referencias — el artefacto de ingeniería son datos, y los datos solo valen si puedes *hacerles preguntas*. Este último paso construye una búsqueda rankeada mínima: las palabras de una consulta se puntúan por cuán a menudo aparecen en cada sección (frecuencia de términos), y las secciones se listan mejor-primero. Es un juguete, pero completa el pipeline desde texto crudo hasta algo que puedes interrogar de verdad.

**👟 Pista inicial:** Empieza escribiendo `word_counts(body)` con un tokenizador `[a-z]+` y `Counter`, luego `search(query, sections)` que puntúa cada sección por cuántos tokens de la consulta aparecen en ella y ordena descendente.

```python
# parser.py (continued)
from collections import Counter

TOK = re.compile(r"[a-z]+")

def word_counts(body: str) -> Counter:
    return Counter(TOK.findall(body.lower()))

def search(query: str, sections: dict[str, str], top: int = 3) -> list[tuple[str, int]]:
    q = set(TOK.findall(query.lower()))
    scored = []
    for name, body in sections.items():
        counts = word_counts(body)
        score = sum(counts[w] for w in q)
        if score:
            scored.append((name, score))
    return sorted(scored, key=lambda t: t[1], reverse=True)[:top]

for q in ["method data", "conclusion results"]:
    print(f"\nquery: {q!r}")
    for name, score in search(q, sections):
        print(f"   {score:>4}  {name[:50]}")
```

El mecanismo es la frecuencia de términos: tokeniza el texto en minúsculas en palabras alfabéticas (`findall` luego elimina lo no-letra vía `[a-z]+`), etiqueta cada sección con su `Counter`, y puntúa una sección por cuántos tokens de la consulta aparecen en ella. Esto no es TF-IDF (una palabra común como "data" no se de-pondera), y no se rankea contra otros documentos más allá de un solo artículo — pero es la *forma* correcta de una solución de búsqueda, y el delimitador `TOK` (eliminar cualquier cosa no-letra para que `data,` y `data` se unifiquen) es una decisión de tokenización real. El filtro `if score` elimina silenciosamente las secciones con cero coincidencias, así que el top-K es honesto sobre "lo mejor que *tiene* el término".

**🎯 Resultado esperado:** Para `"method data"`, la sección Methods puntúa muy por encima de las demás; `"conclusion results"` rankea Results y Conclusion alto — la salida de la búsqueda coincide visiblemente con la estructura real del artículo, que es la comprobación de cordura.

**🩹 Si sale mal:** Si el mejor acierto es el frontmatter para cada consulta, las secciones son diminutas o el cuerpo nunca se dividió — revisa el mapa del Paso 3 (si todo el artículo es un cubo `frontmatter`, nada se rankea). Si `"data"` no devuelve nada, el tokenizador `[a-z]+` se atraganta con una forma con guion o apóstrofo — eso es esperado; añade `[a-z'-]+` para mantener intactas las contracciones, y nota el intercambio. Si se pierde una sección de alta puntuación, las palabras de la consulta no se cruzaron con los tokens de la sección verbatim — una brecha de stemming (run/ran) que puedes reconocer como el límite entre un juguete y un motor de búsqueda.

**✅ Lista de verificación**

- ✅ `"method data"` rankea Methods primero; `"conclusion results"` rankea Results/Conclusion alto.
- ✅ Las consultas de cero coincidencias devuelven una lista vacía (sin basura de puntuación NaN).
- ✅ Puedes explicar *una* limitación (sin TF-IDF, sin stemming, corpus de un solo artículo) que un motor real arregla.

**🤔 Pregunta(s) socrática(s)**

- La búsqueda es *frecuencia de términos* pura — las palabras repetidas ganan. Añade "and" o "the" a una consulta y observa cómo dominan. ¿Qué cambia el IDF (la mitad de frecuencia-inversa-de-documento del TF-IDF) sobre las palabras comunes basura, y por qué es imposible computarlo correctamente en un corpus de un *solo* documento?
- El stemming (`run` == `ran`, `analysis` == `analys*`) es la línea entre "búsqueda de juguete" y "búsqueda real". Construye el argumento de *por qué* los tokens verbatim siguen funcionando sorprendentemente bien en prosa académica (los artículos reutilizan un vocabulario sorprendentemente fijo a lo largo del arco abstract→methods→results) — y la única sección donde se rompe primero.

## ⚠️ Errores comunes

- **Exigir cada señal para un encabezado.** `numbered AND title-case AND short` rechaza "Results and Discussion" — todo el valor del detector de formas es su *unión* de señales. Espera algunos falsos positivos de prosa corta; el division en cubos de secciones los descarta limpiamente.
- **Codificar a mano los nombres de sección.** Una lista `{"Introduction", "Methods", ...}` se rompe en "Experimental Setup" o "1. Preliminaries". Mantén `known` como una *rama* del predicado, nunca el detector entero.
- **Pérdida de datos silenciosa con `errors="ignore"`.** Un byte corrupto puede vaporizar una línea de texto sin rastro. Prefiere `errors="replace"` (`�` visible) cuando decodifiques archivos no confiables para que una decodificación mala sea diagnosticable en lugar de invisible.
- **Dependencia de una gramática de citas.** El regex numérico `[12, 3]` no encuentra nada en artículos autor-año `(Smith, 2020)`. Decide el esquema que estás apuntando desde el principio; un analizador que "maneja ambos" silenciosamente normalmente maneja el segundo como salida vacía.
- **Sangría de la bibliografía desde un apéndice.** "References = todo después del marcador" se traga silenciosamente un Apéndice. Detén el bloque en el siguiente encabezado (reutiliza `is_heading`) o en un token de salto de página para que la prosa post-bibliografía no pueda contaminar la lista de referencias.

## Lo que acabas de construir

Un genuino analizador de artículos de investigación en Python puro: detectaste encabezados por *forma* en lugar de una lista codificada a mano, plegaste el artículo en un mapa `{sección: texto}` consultable, extrajiste citas numéricas y un bloque de referencias, y rankeaste secciones contra una consulta de frase con frecuencia de términos. Dos hábitos aquí valen más que el propio analizador — la inspección de *mira-antes-de-codificar* que ancla tus heurísticas a datos reales, y la comprensión de que "la parte interesante de analizar es saber qué gramática estás apuntando realmente". Pipelines como este subyacen a gestores de referencias, herramientas de revisión y sistemas de minería de literatura; has construido el núcleo honesto de uno sin una sola librería de PDF.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/research-paper-parser/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/research-paper-parser) en el repositorio del curso agrupa el módulo del analizador, un artículo de muestra de texto plano y un notebook que carga, divide, cita y busca en línea. Clona el repositorio, o ábrelo en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y observa correr el pipeline de principio a fin.
:::

## A dónde ir desde aquí

- **Maneja los rangos de guion:** expande `[4–7]` en `{4,5,6,7}` con un pequeño `re.split(r"\s*[–-]\s*")` + `range()` — el TODO marcado del Paso 4.
- **Soporte autor-año:** añade un segundo regex de citas para `(Smith, 2020)` y un resolutor nombre→referencia; el mismo bloque de `references` se mapea a un dict *con clave por nombre*.
- **Un CLI:** envuelve el pipeline en `argparse` (`parse.py paper.txt --search "neural method"`) para que funcione como una herramienta de shell en lugar de un fragmento pegado.
- **Detente en el apéndice:** haz que `extract_references` termine en el siguiente encabezado, reutilizando `is_heading`, para que el texto post-bibliografía nunca contamine la lista de referencias.

## Comparte tu proyecto con la clase

¿Analizaste un artículo, construiste un grafo de citas u obtuviste un ranking de búsqueda del que estés orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README recorre cómo agregar el tuyo vía un **pull request** de principio a fin: fork, rama, commit y abrir el PR. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
