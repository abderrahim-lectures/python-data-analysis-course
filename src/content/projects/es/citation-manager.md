---
title: "Gestor de Citas"
description: "Un kit de herramientas de bibliografía en Python: un almacén de citas de dict-de-dicts, formato estilo APA, búsqueda entre campos, un verificador de referencias faltantes-y-sin-usar basado en aritmética de conjuntos, detección de casi-duplicados por título normalizado, conteos por tipo y un generador de sección de Referencias con persistencia en JSON."
difficulty: "intermediate"
estimatedMinutes: 75
xpReward: 100
tags: ["Science", "Productivity", "Utility"]
prerequisites:
  - "Diccionarios anidados y métodos de strings"
  - "Conjuntos y comprensiones de lista"
  - "Leer y escribir archivos JSON"
learningObjectives:
  - "Modelar una bibliografía como un dict de dicts de entrada con claves estables"
  - "Formatear entradas en texto APA consistente con una sola función"
  - "Buscar entre autores, títulos y publicaciones con coincidencia de substring"
  - "Encontrar referencias faltantes y sin usar con diferencia de conjuntos"
  - "Detectar casi-duplicados por título normalizado y generar una sección de Referencias ordenada"
---

# 🛠️ 📚 Construye un Gestor de Citas

Los papers no se escriben solos — pero la bibliografía casi puede hacerlo. Este proyecto construye un pequeño **gestor de citas**: un almacén de entradas bibliográficas (clave → autor/título/año/publicación/tipo), un formateador que convierte cualquier entrada en una línea consistente estilo APA, una búsqueda que trabaja entre autores, títulos y publicaciones, un verificador de *faltantes-y-sin-usar* construido sobre la diferencia de conjuntos que encuentra errores de lista de referencias antes de que lo haga un revisor, detección de casi-duplicados que atrapa el mismo libro ingresado dos veces con mayúsculas diferentes, conteos por tipo, y un generador final que ordena toda la biblioteca por año-y-autor y escribe una sección de `References` más una copia de seguridad en JSON. Todo es determinista — datos pequeños y curados a mano, sin aleatoriedad, solo biblioteca estándar pura.

Esto asume dicts anidados, conjuntos, comprensiones y JSON básico. Es un proyecto opcional y no calificado — consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente. Un archivo, solo biblioteca estándar.

## 🎯 Lo que harás

1. Construir el almacén de bibliografía y un formateador APA.
2. Buscar en el almacén por autor, título y publicación.
3. Verificar las citas en texto de un manuscrito por claves faltantes y sin usar.
4. Detectar entradas casi-duplicadas y contar los tipos.
5. Generar una sección de Referencias ordenada por año-y-autor y persistirla en JSON.

## Dónde ejecutar esto

Dondequiera que corra Python 3.10+ — localmente, Colab, Kaggle o Binder. Todo el proyecto es `json` + built-ins, así que no hay nada que instalar y ninguna diferencia de entorno.

```bash
mkdir citation-manager && cd citation-manager
touch citations.py
```

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/citation-manager/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/citation-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcitation-manager%2Fnotebook.ipynb)

## Configuración

Cero dependencias: solo confirma el intérprete y crea el archivo.

### Verifica el entorno

```bash
python3 --version
```

**✅ Lista de verificación**

- ✅ `python3 --version` muestra 3.10+.
- ✅ `citations.py` existe; `import json` y `import itertools` funcionan.
- ✅ Sin `pip install` — es la biblioteca estándar haciendo el trabajo.

**🤔 Pregunta(s) socrática(s)**

- Una bibliografía es un *mapeo*: citas `[knuth1984]` en el texto y la sección de Referencias lo expande. ¿Dónde en este proyecto es el dict la forma correcta, y dónde perdería información una lista plana?
- El gestor formatea las entradas él mismo. ¿Por qué una *única* función de formato es mejor que escribir cada línea de referencia a mano — y qué riesgo introduce esa abstracción cuando una publicación cambia de estilo a mitad del proyecto?

## Paso 1: El almacén de bibliografía

Empieza con el modelo de datos: un dict cuyas claves son identificadores de cita (`shannon1948`) y cuyos valores son dicts de entrada.

### 1.1 Las entradas

**👟 Pista inicial :** Un dict de seis entradas, cada una con `authors`, `title`, `year`, `venue`, `type`.

```python
# citations.py
import json
import itertools

bib = {
    "knuth1984": {"authors": "Donald E. Knuth", "title": "The TeXbook",
                  "year": 1984, "venue": "Addison-Wesley", "type": "book"},
    "turing1950": {"authors": "Alan M. Turing", "title": "Computing machinery and intelligence",
                   "year": 1950, "venue": "Mind 59 (236)", "type": "article"},
    "shannon1948": {"authors": "Claude E. Shannon", "title": "A mathematical theory of communication",
                    "year": 1948, "venue": "Bell System Technical Journal", "type": "article"},
    "hopper1978": {"authors": "Grace M. Hopper", "title": "The education of a computer",
                   "year": 1978, "venue": "IEEE Transactions on Computers", "type": "article"},
    "ritchie1974": {"authors": "Dennis M. Ritchie; Ken Thompson", "title": "The UNIX time-sharing system",
                    "year": 1974, "venue": "Communications of the ACM", "type": "article"},
    "lamport1994": {"authors": "Leslie Lamport", "title": "LaTeX: A Document Preparation System",
                    "year": 1994, "venue": "Addison-Wesley", "type": "book"},
}
```

El identificador es cómo el manuscrito cita una fuente; la entrada lleva los datos bibliográficos. Esa separación — *clave estable* vs *datos mutables* — es lo que evita que un re-formato o una búsqueda rompan cada cita en el texto.

**🎯 Resultado esperado :** Ninguno aún — solo datos. Verifica la forma como sanidad: las seis entradas tienen los mismos cinco campos.

**🩹 Si sale mal :** Un `venue` faltante en una entrada no reventará *aquí* pero luego formateará como `None` — revisa los dicts antes de seguir.

### 1.2 Un formateador, todas las entradas

**👟 Pista inicial :** `format_apa(entry)` → `"{authors} ({year}). {title}. {venue}."`, iterando sobre `bib`.

```python
# citations.py (continued)
def format_apa(entry):
    return f"{entry['authors']} ({entry['year']}). {entry['title']}. {entry['venue']}."

for key, entry in bib.items():
    print(f"[{key:>10}] {format_apa(entry)}")
```

Cada cita se vuelve exactamente una línea desde una función. Cambia el estilo (APA → MLA) en un solo lugar y toda la bibliografía lo sigue.

**🎯 Resultado esperado :**

```
[ knuth1984] Donald E. Knuth (1984). The TeXbook. Addison-Wesley.
[turing1950] Alan M. Turing (1950). Computing machinery and intelligence. Mind 59 (236).
[shannon1948] Claude E. Shannon (1948). A mathematical theory of communication. Bell System Technical Journal.
[hopper1978] Grace M. Hopper (1978). The education of a computer. IEEE Transactions on Computers.
[ritchie1974] Dennis M. Ritchie; Ken Thompson (1974). The UNIX time-sharing system. Communications of the ACM.
[lamport1994] Leslie Lamport (1994). LaTeX: A Document Preparation System. Addison-Wesley.
```

**🩹 Si sale mal :** Si el orden `abecedarian` difiere, todavía no hay ordenamiento — este es el orden de inserción (orden de líneas del dict). Si una línea muestra `None`, a esa entrada le falta la clave `venue`.

### 1.3 Verifica el almacén

**✅ Lista de verificación**

- ✅ Seis entradas, cada una con `authors`, `title`, `year`, `venue`, `type`.
- ✅ Las entradas se vuelven en seis líneas formateadas — una función, cinco campos, cero duplicación.
- ✅ Los identificadores son identificadores estables; los datos pueden cambiar sin romper las citas.

**🤔 Pregunta(s) socrática(s)**

- `format_apa` imprime el año en paréntesis *dentro* del string con `(entry['year'])`. ¿Qué se rompería si el `year` fuera un int cada vez *excepto* una entrada almacenada como un string `"1984"`? Diseña un solo cast que repare todas las entradas.
- Las obras de dos autores se almacenan como `"Dennis M. Ritchie; Ken Thompson"` — un string con un separador. ¿Dónde empieza esa convención de división a filtrarse a través del formateador, y qué te compraría un modelo adecuado `authors: [list]`?

## Paso 2: Busca en el almacén

Encuentra una cita sabiendo solo *algo* sobre ella — un autor, una palabra del título, una publicación, un año.

### 2.1 La búsqueda de substring

**👟 Pista inicial :** `search(query)` devuelve cada clave cuya entrada contiene la consulta (insensible a mayúsculas) en autor, título, publicación o exactamente el año.

```python
# citations.py (continued)
def search(query):
    q = query.casefold()
    hits = []
    for key, entry in bib.items():
        haystack = " ".join([
            entry["authors"], entry["title"], entry["venue"],
            str(entry["year"])]).casefold()
        if q in haystack:
            hits.append(key)
    return hits

print("search('turing')      ->", search("turing"))
print("search('addison')     ->", search("addison"))
print("search('1984')        ->", search("1984"))
```

Unir todos los campos en un solo pajar en minúscula significa que una sola prueba de substring cubre cada campo con una línea de lógica — la consulta aparece en *cualquier* campo y coincide. El case-folding hace que `unix` sea igual a `UNIX`.

**🎯 Resultado esperado :**

```
search('turing')      -> ['turing1950']
search('addison')     -> ['knuth1984', 'lamport1994']
search('1984')        -> ['knuth1984']
```

**🩹 Si sale mal :** Si `search('UNIX')` devuelve `[]`, `casefold()` se aplicó solo a la consulta. Si `search('1984')` coincide con un título que contiene "1984" *y* con el año real, el pajar une los campos con strings — decide si el año debe coincidir exactamente o como substring (aquí: substring).

### 2.2 Entiende los aciertos

**👟 Pista inicial :** Imprime las líneas APA para los resultados de una consulta.

```python
# citations.py (continued)
for key in search("addison"):
    print(f"[{key:>10}] {format_apa(bib[key])}")
```

Que `search('addison')` devuelva dos resultados es un momento de enseñanza: "Addison" es una *editorial*, y aparece en el `venue` de ambos libros. Una búsqueda por palabra clave no puede distinguir autor de editorial de año — solo encuentra texto.

**🎯 Resultado esperado :**

```
[ knuth1984] Donald E. Knuth (1984). The TeXbook. Addison-Wesley.
[lamport1994] Leslie Lamport (1994). LaTeX: A Document Preparation System. Addison-Wesley.
```

**🩹 Si sale mal :** Si el bucle imprime más o menos líneas de las que reportó `search`, la función de búsqueda y este bucle difieren — reutiliza `search`, no re-teclees su lógica.

### 2.3 Verifica la búsqueda

**✅ Lista de verificación**

- ✅ Coincidencia insensible a mayúsculas entre autor, título y publicación.
- ✅ `search('addison')` → dos libros (coincidencia de editorial), `search('1984')` → solo Knuth.
- ✅ La búsqueda es una función pura de `bibliography` + consulta — mismo almacén, mismos aciertos.

**🤔 Pregunta(s) socrática(s)**

- La consulta es un *substring*: `'a'` coincide con casi todo, `'e'` con todavía más. ¿Qué tipo de corpus haría inútil la coincidencia de texto completo, y qué mejora de dos comandos (p. ej. con ámbito por campo `author:knuth`) lo arreglaría?
- Unir los campos en un solo pajar pierde *dónde* ocurrió la coincidencia. ¿Cómo extenderías `search` para devolver pares `(key, field)` — y por qué podría querer un gestor de bibliografías informar "coincidió en la publicación" vs "coincidió en el título"?

## Paso 3: Verifica cada cita en texto

La lista de referencias debe contener cada obra citada, y nada citado puede faltar del almacén. La aritmética de conjuntos hace esto en dos líneas.

### 3.1 Faltantes y sin usar

**👟 Pista inicial :** Un manuscrito cita `in_text`; calcula `missing = cited − stored` y `unused = stored − cited`.

```python
# citations.py (continued)
in_text = ["knuth1984", "turing1950", "shannon1948", "hopper1978",
           "lamport1994", "smith2021"]

missing = sorted(set(in_text) - set(bib))
unused = sorted(set(bib) - set(in_text))
print("MISSING (cited but no entry) :", missing)
print("UNUSED  (stored but not cited):", unused)
```

`set(in_text) - set(bib)` es "citas sin hogar" — `smith2021` está en el texto pero no en el almacén. `set(bib) - set(in_text)` es "entradas almacenadas nunca mencionadas" — `ritchie1974` está en la biblioteca pero ninguna oración lo cita. Encuentros que, a lo Socrático con `@staticmethod`, te meten en volver a revisar: una línea por cada dirección, y el hallazgo favorito del revisor (una referencia faltante) salta a la vista.

**🎯 Resultado esperado :**

```
MISSING (cited but no entry) : ['smith2021']
UNUSED  (stored but not cited): ['ritchie1974']
```

**🩹 Si sale mal :** Si `missing` y `unused` están intercambiados, el orden de resta se volteó — el primer operando es "lo que tenemos", el segundo es "lo que queremos". Si `smith2021` no aparece, la lista del manuscrito y el almacén usan identificadores inconsistentes (errores tipográficos) — normaliza las claves antes de difear.

### 3.2 El arreglo

**👟 Pista inicial :** Agrega la entrada faltante, luego re-verifica que ambas direcciones reporten vacío.

```python
# citations.py (continued)
bib["smith2021"] = {
    "authors": "Barbara J. Smith", "title": "Design patterns for tiny data pipelines",
    "year": 2021, "venue": "Journal of Small Systems", "type": "article"}

missing = sorted(set(in_text) - set(bib))
unused = sorted(set(bib) - set(in_text))
print("MISSING after fix :", missing)
print("UNUSED  after fix :", unused)
```

Agregar la entrada re-equilibra los conjuntos: `smith2021` ahora se resuelve, así que `missing` está vacío. `ritchie1974` permanece sin usar — un hallazgo real: la biblioteca tiene una fuente que el manuscrito nunca menciona (cítala correctamente o elimínala).

**🎯 Resultado esperado :**

```
MISSING after fix : []
UNUSED  after fix : ['ritchie1974']
```

**🩹 Si sale mal :** Si `UNUSED` sigue listando `smith2021`, la clave de la entrada y el identificador en texto difieren por mayúsculas o espacios — haz que `set(in_text)` y `set(bib)` compartan una normalización. Si el arreglo se tragó silenciosamente el `missing` anterior, la asignación `bib["smith2021"]` aterrizó después de la re-verificación (¡orden!).

### 3.3 Verifica el verificador

**✅ Lista de verificación**

- ✅ Faltante (smith2021) y sin usar (ritchie1974) encontrados con un diff cada uno.
- ✅ Después de registrar smith2021, `missing` está vacío y `unused` es solo `['ritchie1974']`.
- ✅ `missing`/`unused` nunca se superponen — un bug de diseño (como difear dos copias de `bib`) es imposible una vez que los conjuntos son distintos.

**🤔 Pregunta(s) socrática(s)**

- El orden de `set` es arbitrario para una lista de strings; ordenaste ambos resultados. ¿Por qué importa el *ordenar* el reporte para un lector humano, y dónde engañaría en realidad la salida ordenada (p. ej. ordenar por año de descubrimiento, no por identificador)?
- "Entrada sin usar" puede significar "todavía no citada" u "obsolescencia." ¿Qué efecto secundario tendría una entrada sin usar *eliminada* en la siguiente ejecución — y por qué es la advertencia tipo lint (nunca auto-eliminar) el comportamiento de herramienta más seguro?

## Paso 4: Limpia duplicados y cuenta tipos

Las listas de referencias se duplican silenciosamente — el mismo libro ingresado dos veces con campos ligeramente diferentes. El Paso 4 normaliza títulos para atraparlo y cuenta los tipos.

### 4.1 Un casi-duplicado

**👟 Pista inicial :** Alimenta al almacén un libro que ya existe bajo un segundo identificador con mayúsculas/edición diferentes.

```python
# citations.py (continued)
duplicates = {
    "lamport1994": {"authors": "Leslie Lamport", "title": "LaTeX: A Document Preparation System",
                    "year": 1994, "venue": "Addison-Wesley", "type": "book"},
    "lamport94": {"authors": "L. Lamport", "title": "LaTeX: a document preparation system",
                  "year": 1994, "venue": "Addison-Wesley Pub.", "type": "book"},
}

def norm_title(title):
    return " ".join(title.casefold().split())

dups = []
for a, b in itertools.combinations(duplicates, 2):
    if norm_title(duplicates[a]["title"]) == norm_title(duplicates[b]["title"]):
        dups.append((a, b))
print("NEAR-DUPLICATES:", dups)
```

`norm_title` blanquea y aplica case-fold a un título — `"LaTeX: A Document Preparation System"` y `"LaTeX: a document preparation system"` se vuelven el mismo string, así que los dos identificadores se marcan como una sola obra. Una prueba de igualdad cruda lo pasaría por alto por la diferencia de mayúsculas; la normalización es lo que hace que "casi" se vuelva "idéntico".

**🎯 Resultado esperado :** `NEAR-DUPLICATES: [('lamport1994', 'lamport94')]`

**🩹 Si sale mal :** Si ningún par se marca, el normalizador no corrió (compara títulos crudos — las mayúsculas difieren). Si se marcan *más* pares que uno, `itertools.combinations(…, 2)` iteró sobre un almacén que ya contiene los duplicados — prueba el dict pequeño `duplicates`, no sobre `bib`.

### 4.2 Cuenta los tipos

**👟 Pista inicial :** Cuenta las entradas por `type` con un dict como histograma.

```python
# citations.py (continued)
types = {}
for entry in bib.values():
    types[entry["type"]] = types.get(entry["type"], 0) + 1
print("BY TYPE:", types)
```

Un histograma de tipos es un inventario de una línea: cuántos artículos vs libros componen tu sección de métodos. `get(type, 0) + 1` es el idiom del contador que viste en el rastreador de carbono — la primera aparición arranca en cero.

**🎯 Resultado esperado :** `BY TYPE: {'book': 2, 'article': 4}`

**🩹 Si sale mal :** Si los libros sumaron 3, una entrada duplicada se coló en `bib` — exactamente el problema que el Paso 4 existe para atrapar. Si el conteo es una constante (`{'book': 1}`), el bucle actualiza la misma clave en cada pasada en lugar de una por entrada.

### 4.3 Verifica la limpieza

**✅ Lista de verificación**

- ✅ `lamport1994` vs `lamport94` marcados como casi-duplicados por título normalizado.
- ✅ Histograma de tipos `{'book': 2, 'article': 4}`.
- ✅ La normalización (case-fold + espacios en blanco) es la *razón* por la que tanto los pares como los totales por tipo coinciden.

**🤔 Pregunta(s) socrática(s)**

- `norm_title` procesa mayúsculas y espacios pero no puntuación — `"The UNIX Operating System"` vs `"The UNIX Operating System."` NO coincidirían. ¿Qué dos normalizadores los harían coincidir, y qué pareja "falsa amiga" fusionarían ahora incorrectamente?
- El año no es parte de la verificación de duplicados. Dos *ediciones* diferentes de un libro son de verdad entradas distintas, pero tendrían títulos casi idénticos. ¿Cómo permitirías que pase "mismo título, año distinto" — y cuándo debería una *edición más nueva* reemplazar por CTL automáticamente a la antigua?

## Paso 5: Genera la sección de Referencias

El entregable: una lista de referencias ordenada en pantalla, en un archivo, y una copia de seguridad en JSON del almacén.

### 5.1 Ordena por año, luego autor

**👟 Pista inicial :** `sorted(bib, key=lambda k: (bib[k]["year"], bib[k]["authors"].casefold()))`, numerado.

```python
# citations.py (continued)
order = sorted(bib, key=lambda k: (bib[k]["year"], bib[k]["authors"].casefold()))
for i, key in enumerate(order, start=1):
    print(f"{i:>2}. {format_apa(bib[key])}")
```

Ordenar por `year` primero, autor segundo, imita el orden típico de una lista de referencias (cronológico, con empates rotos alfabéticamente). La clave estable sobrevive el ordenamiento — las entradas nunca se copian fuera de lugar.

**🎯 Resultado esperado :**

```
 1. Claude E. Shannon (1948). A mathematical theory of communication. Bell System Technical Journal.
 2. Alan M. Turing (1950). Computing machinery and intelligence. Mind 59 (236).
 3. Dennis M. Ritchie; Ken Thompson (1974). The UNIX time-sharing system. Communications of the ACM.
 4. Grace M. Hopper (1978). The education of a computer. IEEE Transactions on Computers.
 5. Donald E. Knuth (1984). The TeXbook. Addison-Wesley.
 6. Leslie Lamport (1994). LaTeX: A Document Preparation System. Addison-Wesley.
```

**🩹 Si sale mal :** Si las fechas son un problema (1948 después de 1984), el `year` se ordenó como *string* — castea a int o compara numéricamente. Si los autores dentro de un año difieren, el desempate con `authors.casefold()` no corrió.

### 5.2 Persiste y recarga

**👟 Pista inicial :** Escribe las líneas de referencias en `references.txt` y el almacén en `bib.json`, luego recarga el almacén y prueba que `len` y las claves sobreviven.

```python
# citations.py (continued)
with open("references.txt", "w") as f:
    for key in order:
        f.write(format_apa(bib[key]) + "\n")

with open("bib.json", "w") as f:
    json.dump(bib, f, indent=2)

loaded = json.load(open("bib.json"))
print("bib.json round-trip:", len(loaded), "entries,",
      "keys match" if sorted(loaded) == sorted(bib) else "KEYS MISMATCH")
```

`references.txt` es el entregable humano (una sección de Referencias como texto plano). `bib.json` es el entregable de máquina — todo el almacén serializado para que la siguiente sesión pueda recargarlo sin cambios en lugar de re-teclear entradas. JSON convierte el dict anidado en texto portable y de vuelta.

**🎯 Resultado esperado :**

```
bib.json round-trip: 7 entries, keys match
```

…y `references.txt` conteniendo las seis líneas ordenadas de 5.1 — más `bib.json` restaurado con 7 entradas (las seis originales y `smith2021`).

**🩹 Si sale mal :** Si el round-trip reporta menos entradas, JSON descartó silenciosamente una entrada cuyo valor no era serializable a JSON (p. ej. un `datetime`). Si `keys match` imprime un desajuste, las claves recargadas difieren en orden u ortografía — compara como conjuntos; el orden en un objeto JSON se conserva en la práctica pero nunca se garantiza.

### 5.3 Verifica el entregable

**✅ Lista de verificación**

- ✅ Lista de referencias ordenada por año, luego autor — Shannon 1948 primero, Lamport 1994 al final.
- ✅ `references.txt` tiene 6 líneas limpias; `bib.json` recarga a 7 entradas con claves coincidentes.
- ✅ El mismo `format_apa` produjo cada línea — pantalla, archivo y JSON nunca discrepan.

**🤔 Pregunta(s) socrática(s)**

- La sección de Referencias se ordenó cronológicamente — pero muchas revistas ordenan *alfabéticamente* por autor. ¿Qué línea única cambiaría la política a alfabética, y por qué el *formateador* permanece intacto de cualquier manera?
- `json.dump(bib, f, indent=2)` no reordena nada pero el archivo crece más. Los round-trips que comparten `sorted(…) == sorted(…)` ocultan el orden; ¿cómo estamparías con versión `bib.json` (p. ej. un campo `"schema": 2`) para que una carga futura pueda rechazar limpiamente un archivo incompatible?

## ⚠️ Errores comunes

- **Claves vs datos.** El identificador identifica la obra; la entrada la describe. Editar la *clave* en un renombrado rompe las citas en texto; editar los *campos* nunca lo hace. Mantén las claves estables.
- **Mayúsculas en la coincidencia.** `search` y `norm_title` deben ambos hacer `casefold()`. Un `in` crudo sobre títulos de mayúsculas mezcladas hace fallar cada casi-duplicado y la mitad de tus búsquedas.
- **Orden ordenado vs de inserción.** El orden de inserción del `dict` es agradable pero no es una *política*; la sección de Referencias ordena explícitamente por `(year, author)`. No confíes en que el orden del dict sea el ordenamiento.
- **Diferencias de conjuntos en la dirección correcta.** `set(in_text) - set(bib)` = citado-pero-no-almacenado (faltante); el inverso = sin usar. Una dirección intercambiada y reportas entradas fantasma en lugar de faltantes.
- **Años string se ordenan mal.** `"1978" < "1948"` como *strings* es `False` — castea los años a `int` (o rellénalos) antes de ordenar cronológicamente.
- **Los casi-duplicados necesitan una cuenca de comparación.** Verificar cada entrada contra una "lista de títulos conocidos" escrita a mano pierde pares *dentro* del almacén — usa `itertools.combinations(keys, 2)` sobre los títulos almacenados.

## Lo que acabas de construir

Un gestor de citas que va de hechos bibliográficos crudos a una lista de referencias a prueba de revisores: un almacén de dict-de-dicts con identificadores estables, una función `format_apa` que es dueña del estilo, búsqueda de substring entre campos, una verificación de salud de dos líneas por diferencia de conjuntos que encuentra citas faltantes y sin usar antes que un humano, detección de duplicados por título normalizado, un histograma de tipos, y un generador ordenado por año/autor que escribe tanto el archivo de `References` humano como una copia de seguridad en JSON. Las ideas se transfieren mucho más allá de las bibliografías: **mantén los identificadores estables separados de los registros mutables**; **deja que un solo formateador sea dueño de cada renderizado**; **normaliza antes de comparar**; y **convierte la verificación de salud en una diferencia de conjuntos** — los mismos tres patrones corren directorios de empleados, manifiestos de paquetes y cachés de traducción.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/citation-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/citation-manager) en el repositorio del curso es el gestor completo como notebook — almacén, formateador, búsqueda, verificación de faltantes/sin usar, dedupe y el round-trip de Referencias ordenadas + JSON, ejecutable en Colab/Kaggle/Binder. Clona el repositorio o [ábrelo en un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Carga un archivo `.bib` de BibTeX real en lugar de teclear entradas — analiza líneas `@article{key, field = value}` y aliméntalas a `bib`.
- Agrega búsqueda con ámbito por campo (`author:knuth`, `year:1974`) que devuelva pares `(key, field)` en lugar de un pajar unido.
- Implementa **"convirtir a MLA"**: un segundo formateador y un parámetro `style` en `format_apa` — probando que la decisión de estilo está aislada en un solo lugar.
- Ordena las revistas: haz un histograma de los valores de `venue` y saca a la luz qué publicaciones usan más tus referencias.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓