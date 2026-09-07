---
title: "Registro de Auditoría"
description: "Registro de eventos solo de adición con una cadena de hash SHA-256: cada entrada enlaza a su predecesora, una pasada de verificación prueba que nada fue alterado, las consultas filtran por severidad y fuente, la retención poda entradas viejas manteniendo la cadena válida, y una exportación de cumplimiento envía JSONL para dashboards."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Security", "Backend", "Data Visualization"]
prerequisites:
  - "Clases, métodos y estado de instancia de Python"
  - "Leer y escribir archivos de texto línea por línea"
  - "Conceptos básicos de hashlib: qué es un resumen hex SHA-256"
learningObjectives:
  - "Modelar un registro de eventos solo de adición cuyas filas llevan un hash encadenado de su predecesor"
  - "Probar la resistencia a la manipulación recomputando y comparando cada eslabón de la cadena"
  - "Consultar el registro por severidad y fuente y agregar conteos para un dashboard"
  - "Podar entradas viejas con retención mientras se re-ancla una cadena aún válida"
  - "Exportar un feed JSONL de cumplimiento verificado contra el registro fuente"
---

# 🛠️ 🔐 Construye un Registro de Auditoría

Un registro de auditoría es el documento que le muestras al investigador *después* de que algo salió mal: quién hizo qué, en qué orden y — de manera crítica — si algo de eso fue alterado en silencio después. Un archivo de registro de líneas de texto no prueba nada por sí mismo; una edición de texto plano se ve idéntica a un evento real. Este proyecto construye la estructura que hace detectable la reescritura: un registro solo de adición donde cada entrada lleva un hash SHA-256 de su propio contenido **más** el hash de la entrada anterior, formando una cadena. Altera una línea en cualquier parte y cada eslabón subsecuente se rompe; una sola pasada de `verify()` reporta exactamente qué entrada fue tocada. Alrededor de ese núcleo agregarás consultas por severidad y fuente, una poda de retención que mantiene la cadena válida y una exportación JSONL para dashboards y herramientas de cumplimiento. Todo corre en la biblioteca estándar y es determinista — los mismos dieciséis eventos verifican de la misma manera cada vez.

Esto asume clases, métodos, E/S de archivos y una primera mirada a `hashlib.sha256`. Es un proyecto opcional y no calificado — consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Escribir un registrador solo de adición que almacene eventos como una línea cada uno.
2. Agregar una cadena de hash, y luego probar que atrapa una entrada falsificada.
3. Consultar por severidad y fuente, y contar eventos por severidad.
4. Podar entradas viejas con retención mientras mantienes la verificación en verde.
5. Exportar un feed JSONL de cumplimiento y un resumen legible por humanos.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — el registrador es biblioteca estándar pura (`hashlib`, `pathlib`, `json`), así que un `uv init` es todo lo que necesitas.

**Google Colab, Kaggle Notebooks y Binder** ejecutan cada paso sin modificar. Usa una ruta local al proyecto (ej. `audit.log`) en lugar de una ruta del sistema; los notebooks y Binder dejan que ese archivo viva junto al código.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/audit-logger/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/audit-logger/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Faudit-logger%2Fnotebook.ipynb)

## Configuración

Todo lo necesario antes del primer evento.

### Configura el proyecto

```bash
uv init audit-logger
cd audit-logger
```

Sin dependencias. El registro es un archivo `.txt` con un evento por línea; la logística de "solo de adición" es simplemente `open(..., "a")`.

**✅ Lista de verificación**

- ✅ `uv init audit-logger` crea el proyecto y un `main.py`.
- ✅ `uv run python3 -c "import hashlib, pathlib, json"` tiene éxito — todo es biblioteca estándar.

**🤔 Pregunta(s) socrática(s)**

- Una línea de registro como `INFO auth login ok` sola no prueba nada sobre su propia autenticidad. ¿Qué dos propiedades debe tener un registro *resistente a la manipulación* más allá de "es un archivo que alguien escribió"?
- La cadena hashea cada entrada contra su predecesora, así que el *orden* es parte de la evidencia. ¿Por qué importa el orden para un registro de auditoría — qué ocultaría un registro forjado pero re-ordenado?

## Paso 1: Un registro de eventos solo de adición

Primero, registro honesto ordinario solo de adición: los eventos se vuelven líneas en un archivo. La resistencia a la manipulación llega en el paso 2.

### 1.1 El helper de resumen

**👟 Pista inicial :** Escribe `digest(*parts)` que une las partes con `|` y devuelve el resumen hex SHA-256 — el pegamento para cada hash que computarás.

```python
# main.py
import hashlib, pathlib, json

def digest(*parts):
    return hashlib.sha256("|".join(parts).encode()).hexdigest()

print(digest("1", "2025-06-01T10:00:00", "INFO", "auth", "login ok"))
```

`"|".join(parts)` hace inequívoca la cadena que hasheas: sin un separador, `"a" + "bc"` y `"ab" + "c"` colisionan; con `|`, `("a","bc")` y `("ab","c")` difieren en bytes. El resumen hex es determinista — mismas entradas, misma salida, para siempre — que es la propiedad de la que pende toda la cadena.

**🎯 Resultado esperado :** Una cadena hex de 64 caracteres (ej. `f0c2…`): los resúmenes SHA-256 siempre son 64 caracteres hex sin importar la longitud de la entrada.

**🩹 Si sale mal :** Si la longitud de la salida difiere de 64, no estás llamando `sha256` (`md5` da 32). Si aparece un `TypeError`, se coló una parte no-cadena — codifica/`str()` primero.

### 1.2 Añade eventos como líneas

**👟 Pista inicial :** Escribe `AuditLog(path)` con un `append(severity, source, message, ts)` que añade una línea unida con pipes por evento.

```python
# main.py (continued)
class AuditLog:
    def __init__(self, path):
        self.path = pathlib.Path(path)
        self._seq = 0

    def append(self, severity, source, message, ts="2025-06-01T10:00:00"):
        self._seq += 1
        payload = [str(self._seq), ts, severity, source, message]
        with self.path.open("a") as f:
            f.write("|".join(payload) + "\n")
        return self._seq

log = AuditLog("audit.log")
log.append("INFO", "auth", "login ok", ts="2025-06-01T10:00:00")
log.append("INFO", "auth", "logout ok", ts="2025-06-01T10:01:00")
print(log.path.read_text())
```

`open("a")` es el *modo* que hace real la promesa de solo de adición: cada llamada escribe al final y nunca reescribe bytes anteriores. El contador `seq` da a los eventos un orden explícito que sobrevive incluso si los timestamps son iguales. El payload unido con pipes es el registro de datos del log — la cadena del paso 2 lo envuelve.

**🎯 Resultado esperado :**

```
1|2025-06-01T10:00:00|INFO|auth|login ok
2|2025-06-01T10:01:00|INFO|auth|logout ok
```

**🩹 Si sale mal :** Si el archivo sobrescribe en lugar de añadir, `open` usó el modo `"w"`. Si las líneas se juntan, falta el `\n` final en la escritura.

### 1.3 Ten un génesis

**👟 Pista inicial :** Agrega `GENESIS = digest("GENESIS")` para que la primera entrada tenga un hash al que apuntar.

```python
# main.py (continued)
GENESIS = digest("GENESIS")
print(GENESIS[:16], "...")
```

Toda cadena necesita un predecesor para su primer eslabón. `GENESIS` es ese ancla constante: la entrada 1 apunta *a* ella, y una vez que existe la entrada 1, la cadena referencia solo entradas reales. No hay nada secreto sobre la cadena `"GENESIS"` — su rol es ser un punto de partida **fijo y conocido** contra el que todos verifican.

**🎯 Resultado esperado :** Dieciséis caracteres hex seguidos de `...` (los 64 completos están en la primera línea de la región del paso 1.1 — mismo helper, misma función).

**🩹 Si sale mal :** Si `GENESIS` varía entre ejecuciones, estás hasheando una parte dependiente del tiempo. Debe ser un literal.

### 1.4 Verifica la capa de adición

**✅ Lista de verificación**

- ✅ Dos llamadas a `append` producen exactamente dos líneas unidas con pipes, en orden.
- ✅ Reabrir la misma ruta de `AuditLog` y añadir escribe la tercera línea al final.
- ✅ `GENESIS` es una constante — mismo valor en cada ejecución del intérprete.

**🤔 Pregunta(s) socrática(s)**

- Solo de adición es una *política* aquí (tú controlas el código que lo escribe). ¿Dónde tiene que vivir la prueba real de "nadie reescribió la historia" — en la convención de escritura, o en algo verificable después? Eso verificable es el paso 2.
- El archivo tiene los eventos en texto claro, legible por cualquiera. ¿Es eso una debilidad para un registro de *auditoría*, y qué agregarías — cifrado, firmas o permisos — sin romper la cadena?

## Paso 2: La cadena de hash — y la prueba de manipulación

Ahora la recompensa: cada entrada almacena el hash de la entrada anterior, haciendo que cualquier edición rompa la cadena. Luego la verificas — y observas cómo atrapa una edición plantada.

### 2.1 Enlaza cada entrada con su predecesora

**👟 Pista inicial :** En `append`, lee el último hash almacenado (empezando en `GENESIS`), computa el siguiente eslabón como `digest(*payload, prev)`, y almacena `prev` y el nuevo hash en la línea.

```python
# main.py (continued)
    def rows(self):
        return [line.split("|") for line in self.path.read_text().splitlines()]

    def _last_hash(self):
        if not self.path.exists() or not self.path.read_text().strip():
            return GENESIS
        return self.rows()[-1][-1]

    def append(self, severity, source, message, ts="2025-06-01T10:00:00"):
        self._seq += 1
        prev = self._last_hash()
        payload = [str(self._seq), ts, severity, source, message]
        h = digest(*payload, prev)
        with self.path.open("a") as f:
            f.write("|".join(payload + [prev, h]) + "\n")
        return self._seq, h

log.append("WARN", "payments", "retry #1", ts="2025-06-01T10:02:00")
row = log.rows()[-1]
print(row)
```

Cada línea ahora es siete campos: los cinco campos de datos, el hash anterior y el hash propio de la entrada `digest(*payload, prev)`. El hash *incluye* `prev`, así que el orden es parte de la prueba. La siguiente entrada lee el último hash de esta y lo envuelve hacia adelante — una cadena literal, un eslabón por línea.

**🎯 Resultado esperado :** Una lista de 7 campos cuyo último campo es un hash de 64 caracteres, ej. `['3', '2025-06-01T10:02:00', 'WARN', 'payments', 'retry #1', '…', '…']`.

**🩹 Si sale mal :** Si la línea tiene seis campos, `payload + [prev, h]` no se unió. Si el hash almacenado no cambia entre entradas, `_last_hash` no está leyendo la línea anterior.

### 2.2 Verifica la cadena

**👟 Pista inicial :** Escribe `verify()` que recorra las filas, recomputando cada hash esperado a partir del payload y `prev`, y devuelva `(ok, position)` donde está una ruptura.

```python
# main.py (continued)
    def verify(self):
        expected = GENESIS
        for i, row in enumerate(self.rows()):
            payload, prev, stored = row[:5], row[5], row[6]
            if prev != expected:
                return False, i
            expected = digest(*payload, prev)
            if stored != expected:
                return False, i
        n = len(self.rows())
        return (True, n) if n else (False, 0)

log.append("ERROR", "payments", "charge declined", ts="2025-06-01T10:03:00")
log.append("ERROR", "net", "timeout", ts="2025-06-01T10:04:00")
log.append("WARN", "payments", "charge recovered", ts="2025-06-01T10:05:00")
print("verify:", log.verify())
```

`verify` reproduce la función exacta que usó `append`: empieza en `GENESIS`, y en cada fila confirma que el `prev` almacenado coincide con donde está la caminata, luego confirma que el hash almacenado es igual al hash que `append` habría escrito. Una cadena intacta camina las seis filas hasta `(True, 6)`.

**🎯 Resultado esperado :** `verify: (True, 6)`.

**🩹 Si sale mal :** Si `(True, 6)` se imprime como `(False, 0)`, la rebanada de payload en `verify` descartó el campo de mensaje — muchos principiantes usan `row[:4]` y rompen cada hash. Usa `row[:5]` (los cinco campos de datos).

### 2.3 Planta una manipulación y atrápala

**👟 Pista inicial :** Corrompe el mensaje de la fila 4 y verifica de nuevo — la ruptura debe apuntar exactamente a esa entrada.

```python
# main.py (continued)
lines = open("audit.log").readlines()                 # read all lines first
fields = lines[3].rstrip("\n").split("|")
fields[4] = fields[4].replace("declined", "DECLINED")
lines[3] = "|".join(fields) + "\n"
open("audit.log", "w").write("".join(lines))          # truncate only at the end

print("after edit:", log.verify())
```

Reescribir el archivo no es especial — el punto es que la herramienta *se da cuenta*. El payload de la fila 4 cambió, así que su hash almacenado ya no coincide con `digest(*payload, prev)`, y `verify` reporta la ruptura en el índice de fila 3. Cualquier edición en cualquier parte es atrapada, porque cada eslabón de la cadena subsecuente también estaría en desacuerdo. (Restaura el archivo — reescríbelo desde cero — antes del paso 3.)

**🎯 Resultado esperado :** `after edit: (False, 3)` — la entrada manipulada es la entrada 4 (índice 3).

**🩹 Si sale mal :** Si la verificación reporta un índice posterior, la edición cambió bytes que alimentan solo un hash almacenado *posterior* — verifica que mutaste el campo de mensaje (índice 4), no el campo de hash (índice 6).

### 2.4 Verifica la cadena

**✅ Lista de verificación**

- ✅ Seis entradas honestas verifican como `(True, 6)`.
- ✅ Editar el mensaje de la entrada 4 produce `(False, 3)`.
- ✅ Editar *cualquier* entrada — mensaje, severidad u orden — se rompe en o después de esa entrada.

**🤔 Pregunta(s) socrática(s)**

- La cadena atrapa ediciones pero no la *eliminación de todo el archivo* ni una restauración a granel. ¿Qué distingue la resistencia a la manipulación (este paso) de las firmas digitales (tu clave privada), y qué preocupación resuelve cada una?
- `verify` recomputa desde `GENESIS` cada vez. Si el registro tuviera un millón de entradas, ¿a dónde iría el costo — y qué adición barata (almacenar el último hash, re-verificar desde ahí) mantiene rápidas las comprobaciones puntuales?

## Paso 3: Consulta y agrega

Una pila de líneas resistente a la manipulación aún necesita que se le *hagan preguntas*. El paso 3 agrega filtros y conteos.

### 3.1 Filtra por severidad y fuente

**👟 Pista inicial :** Escribe `select(severity=None, source=None)` que devuelva las filas coincidentes como los cuatro campos de datos que la gente lee.

```python
# main.py (continued)
    def select(self, *, severity=None, source=None):
        out = []
        for row in self.rows():
            if severity and row[2] != severity:
                continue
            if source and row[3] != source:
                continue
            out.append(row[:4])
        return out

# fresh, intact log with the full six-event feed
fresh = AuditLog("audit2.log")
for s, src, msg, ts in [
    ("INFO", "auth", "login ok", "2025-06-01T10:00:00"),
    ("INFO", "auth", "logout ok", "2025-06-01T10:01:00"),
    ("WARN", "payments", "retry #1", "2025-06-01T10:02:00"),
    ("ERROR", "payments", "charge declined", "2025-06-01T10:03:00"),
    ("ERROR", "net", "timeout", "2025-06-01T10:04:00"),
    ("WARN", "payments", "charge recovered", "2025-06-01T10:05:00"),
]:
    fresh.append(s, src, msg, ts=ts)

print([r[2:4] for r in fresh.select(severity="ERROR")])
print([r[:2] for r in fresh.select(source="payments")])
```

`select` es un filtro puro sobre `rows()`: sin estado, sin mutación — mismas filas adentro, mismas respuestas afuera, de manera determinista. Sostener los campos de *datos* `row[:4]` (dejando fuera los dos hashes) hace legible la lista de resultados y mantiene los hashes visibles en `rows()` cuando necesitas verificar.

**🎯 Resultado esperado :**

```
[['ERROR', 'payments'], ['ERROR', 'net']]
[['1', '2025-06-01T10:00:00'], ['3', '2025-06-01T10:02:00'], ['4', '2025-06-01T10:03:00'], ['6', '2025-06-01T10:05:00']]
```

**🩹 Si sale mal :** Si un filtro no devuelve nada, las mayúsculas de severidad/fuente difieren del registro (almacenado `ERROR` vs consultado `error`). Si ambos filtros devuelven todo el registro, los `continue` de salto se reemplazaron por appends, o los argumentos de palabra clave nunca llegaron al método.

### 3.2 Conteos para un dashboard

**👟 Pista inicial :** Usa `Counter` sobre el campo de severidad para obtener totales por severidad en una línea.

```python
# main.py (continued)
from collections import Counter

def counts(rows):
    return dict(Counter(r[2] for r in rows))

print(counts(fresh.rows()))
```

`Counter(r[2] for r in rows)` agrupa cada línea del registro por severidad y devuelve los totales: estos son los números que renderiza tu widget de "errores últimas 24h". Como opera sobre `rows()` (que aún lleva la cadena), los mismos datos alimentan tanto el dashboard como la verificación.

**🎯 Resultado esperado :** `{'INFO': 2, 'WARN': 2, 'ERROR': 2}`.

**🩹 Si sale mal :** Si una severidad falta en el dict, `Counter` solo clavea lo que contó — una severidad con cero eventos no aparecerá. Si los conteos suman más de seis, el archivo tiene líneas duplicadas sobrantes de la demo de manipulación del paso 2 — empieza fresco con `audit2.log`.

### 3.3 Verifica la capa de consulta

**✅ Lista de verificación**

- ✅ `select(severity="ERROR")` devuelve exactamente las entradas 4 y 5.
- ✅ `select(source="payments")` devuelve cuatro entradas: seqs 3, 4 y 6.
- ✅ `counts(rows)` devuelve `{'INFO': 2, 'WARN': 2, 'ERROR': 2}` en el registro intacto.

**🤔 Pregunta(s) socrática(s)**

- `select` devuelve *copias* (`row[:4]`), nunca manejadores a las filas internas. Si un llamador mutara una entrada devuelta (cambiara una severidad), ¿cambiaría también el archivo — y es esa la propiedad que quieres para un registro de auditoría?
- Un dashboard muestra `ERROR: 2`. El mismo archivo en la versión que el paso 2 pudo manipular muestra números diferentes. ¿Qué te compra "verifica el registro *antes* de confiar en los números del dashboard" que el dashboard solo no puede?

## Paso 4: Retención — poda sin romper la cadena

Los registros crecen para siempre; las políticas de retención los limitan. El paso 4 recorta las entradas viejas **y** re-ancla la cadena sobreviviente para que un registro podado aún verifique.

### 4.1 Recorta entradas viejas

**👟 Pista inicial :** Escribe `retain(since_seq)` que mantenga las filas con `seq >= since_seq` y reescriba el archivo.

```python
# main.py (continued)
    def retain(self, since_seq):
        kept = [r for r in self.rows() if int(r[0]) >= since_seq]
        with self.path.open("w") as f:
            expected = GENESIS
            for row in kept:
                payload = row[:5]
                prev = row[5]
                if prev != expected:
                    prev = expected
                expected = digest(*payload, prev)
                f.write("|".join(payload + [prev, expected]) + "\n")
        return len(kept)

print("kept:", fresh.retain(3))
print(fresh.path.read_text())
```

Dejar caer filas que llevaban los eslabones de la cadena vieja huérfiaría los valores `prev` de los sobrevivientes. `retain` arregla eso reiniciando la caminata en `GENESIS` y recomputando el `prev`/hash de cada sobreviviente mientras reescribe — el archivo se encoge, y la cadena se re-ancla a la primera entrada mantenida. La retención es *política* de datos, no magia: mantén las N más nuevas, mantén todo lo posterior a una fecha, mantén solo una severidad — la misma lógica de reescritura lo maneja.

**🎯 Resultado esperado :**

```
kept: 4
3|2025-06-01T10:02:00|WARN|payments|retry #1|…|…
4|2025-06-01T10:03:00|ERROR|payments|charge declined|…|…
5|2025-06-01T10:04:00|ERROR|net|timeout|…|…
6|2025-06-01T10:05:00|WARN|payments|charge recovered|…|…
```

**🩹 Si sale mal :** Si `kept` es 0, podaste todo (`since_seq` demasiado alto) — inofensivo pero revisa el conteo. Si el `prev` de los sobrevivientes aún apunta a filas caídas, falta el re-ancla `if prev != expected: prev = expected` y la cadena fallará la verificación.

### 4.2 Re-verifica la cadena podada

**👟 Pista inicial :** Corre `verify()` de nuevo — la cadena retenida debe regresar en verde.

```python
# main.py (continued)
print("post-retention verify:", fresh.verify())
from collections import Counter
print(dict(Counter(r[2] for r in fresh.rows())))
```

Una buena política de retención deja un registro *más pequeño pero aún confiable*. `verify()` recomputando desde `GENESIS` prueba que la cadena podada es autoconsistente, y los conteos muestran los datos de la política: las dos entradas de login `INFO` se fueron, su evidencia resumida solo por lo que sobrevivió.

**🎯 Resultado esperado :**

```
post-retention verify: (True, 4)
{'WARN': 2, 'ERROR': 2}
```

**🩹 Si sale mal :** Si `verify()` devuelve `(False, …)` después de podar, el re-ancla reescribió `prev` pero olvidó recomputar el hash propio de esa fila, o la primera fila mantenida aún almacenaba el predecesor viejo (caído).

### 4.3 Verifica la retención

**✅ Lista de verificación**

- ✅ `retain(3)` en un registro de 6 entradas mantiene exactamente 4 filas y devuelve `4`.
- ✅ El archivo podado re-verifica como `(True, 4)`.
- ✅ Los conteos después de podar reflejan solo las filas sobrevivientes.

**🤔 Pregunta(s) socrática(s)**

- La retención mantiene las N entradas más nuevas y se re-ancla a `GENESIS`. Un requisito regulatorio podría querer "guardado por 90 días y luego eliminado" — ¿qué *significa* "eliminado" para una cadena que se supone de solo de adición, y quién recibe una copia antes de que corra la poda?
- Después de podar, la lista de sobrevivientes comienza en `WARN retry #1` — los eventos `INFO login ok` se fueron también del resumen. ¿Querrías una entrada *marcadora de retención* ("dos eventos INFO podados el 2025-06-08") escrita en el registro, y qué le haría eso a la cadena?

## Paso 5: Exportación de cumplimiento

Los registros de auditoría se consumen — por dashboards, SIEMs, hojas de cálculo. El paso 5 exporta el registro como datos que un consumidor puede usar, más un resumen legible por humanos.

### 5.1 Exporta JSONL

**👟 Pista inicial :** Escribe `export_jsonl()` que devuelva un objeto JSON por fila, con los campos intactos.

```python
# main.py (continued)
    def export_jsonl(self):
        lines = []
        for row in self.rows():
            lines.append(json.dumps({"seq": int(row[0]), "ts": row[1],
                                     "severity": row[2], "source": row[3],
                                     "message": row[4]}))
        return lines

for line in fresh.export_jsonl():
    print(line)
```

JSON Lines (`.jsonl`) es el formato de intercambio que los dashboards y agregadores de registros esperan: un objeto JSON autodescriptivo por línea, cada línea un evento completo. Exportado *después* de la validación (paso 4.2) representa "el contenido en el que confiamos", separado del formato de fila cruda en el que vive la cadena — la exportación es la interfaz, la cadena es el respaldo.

**🎯 Resultado esperado :**

```
{"seq": 3, "ts": "2025-06-01T10:02:00", "severity": "WARN", "source": "payments", "message": "retry #1"}
{"seq": 4, "ts": "2025-06-01T10:03:00", "severity": "ERROR", "source": "payments", "message": "charge declined"}
{"seq": 5, "ts": "2025-06-01T10:04:00", "severity": "ERROR", "source": "net", "message": "timeout"}
{"seq": 6, "ts": "2025-06-01T10:05:00", "severity": "WARN", "source": "payments", "message": "charge recovered"}
```

**🩹 Si sale mal :** Si `message` muestra un hash de 64 caracteres en lugar del texto, exportaste `row[5]`/`row[6]` (los campos de la cadena) en lugar de `row[4]`. Si `json.dumps` da error, un campo tiene un no-cadena (todos los campos aquí son cadenas — revisa que `seq` primero se convierta a `int`).

### 5.2 El resumen humano

**👟 Pista inicial :** Imprime un resumen breve de cumplimiento: conteo de eventos, totales por fuente y por severidad, y el veredicto de verificación.

```python
# main.py (continued)
def summary(log):
    rows = log.rows()
    verdict, span = log.verify()
    return f"SIGNALS on {log.path.name}: verified={verdict} events={span} " \
           f"severities={dict(Counter(r[2] for r in rows))}"

print(summary(fresh))
```

Una línea que un revisor de cumplimiento puede citar: "verified=True, events=4, severities=…". Atar el *veredicto* a la misma cadena que los conteos evita que el dashboard muestre números que la cadena no respaldaría — la exportación y la declaración de confianza viajan juntas.

**🎯 Resultado esperado :** `SIGNALS on audit2.log: verified=True events=4 severities={'WARN': 2, 'ERROR': 2}`.

**🩹 Si sale mal :** Si `verified=False`, la exportación corrió sobre un archivo manipulado/desalineado por retención. Reconstruye el registro (restaura del paso 2.3) y re-ejecuta — el resumen es tan honesto como la cadena.

### 5.3 Verifica la exportación

**✅ Lista de verificación**

- ✅ `export_jsonl()` emite 4 líneas para el registro retenido, con los mensajes intactos.
- ✅ La línea de resumen acopla `verified=True` con los conteos en una sola cadena.
- ✅ El round-trip del JSONL (`json.loads`) reproduce exactamente los campos de datos de las filas.

**🤔 Pregunta(s) socrática(s)**

- La exportación alimenta un dashboard; la cadena prueba el archivo del que exportó. Un consumidor que solo vio la salida de `export_jsonl()` no tiene cadena — ¿qué enviarías junto al JSONL para que un SIEM descendente lo verifique, sin enviar todo tu código?
- `summary` reporta `events=4` y `verified=True` juntos. Si la verificación fallara, ¿preferirías que el resumen imprima `None` para los conteos, los imprima de todas formas con una advertencia o se rehúse a correr? Defiende tu elección con una audiencia de cumplimiento en mente.

## ⚠️ Errores comunes

- **Rebanada de payload con off-by-one.** `row[:4]` descarta el mensaje y cada hash recomputado discrepa en silencio con lo que `append` escribió. El payload siempre son cinco campos (`[:5]`); los campos de la cadena son `row[5]` (prev) y `row[6]` (hash).
- **Modo `"w"` en el registro en vivo.** Una flag equivocada de `open` borra la cadena a mitad de investigación. Reserva `"w"` para `retain` y reconstrucciones; los appends en vivo deben ser `"a"`.
- **Podar sin re-anclar.** Truncar el archivo pero dejar los `prev` de los sobrevivientes apuntando a filas eliminadas hace que la cadena falle la verificación. Recomputa `prev`/hash desde `GENESIS` mientras reescribes, como hace `retain`.
- **Hashes que incluyen el tiempo.** `digest(str(time.time()), …)` hace no determinista cada verificación. Los timestamps fijos de la guía mantienen reproducibles las cadenas; si registras tiempos de reloj de pared, deben ser *campos estables* — escritos una vez, hasheados sobre — no recomputados en el momento de verificar.
- **Consultar los números de campo equivocados.** Los campos son `[0]=seq [1]=ts [2]=severity [3]=source [4]=message [5]=prev [6]=hash`. Filtrar por `row[1]` filtra timestamps, no severidades.
- **Exportar campos de cadena como datos.** Enviar `row[5]`/`row[6]` a un dashboard filtra hashes a la columna de mensaje. Exporta solo `row[:5]`.

## Lo que acabas de construir

Un registrador de auditoría resistente a la manipulación, consultable y con retención: filas de eventos solo de adición, una cadena de hash anclada en `GENESIS`, un `verify()` que apunta a la entrada exacta manipulada, filtros más conteos de severidad, una poda de retención que re-ancla la cadena y una exportación de cumplimiento JSONL cuyo resumen lleva el veredicto de verificación. La idea central es que *la integridad de auditoría es una propiedad de diseño, no una actitud*: no prometes no manipular el registro, haces que la manipulación sea **detectable** encadenando cada entrada a su predecesora y recomputando el eslabón a demanda. Ese único truco — un hash por línea, incluyendo el hash anterior — es la misma forma que usan blockchains, git y manifiestos de backup deduplicados, porque el grafo de objetos es pequeño y la prueba es barata.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/audit-logger/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/audit-logger) en el repositorio del curso es el registrador completo como notebook — append, verificación, demo de manipulación, filtros, retención y la exportación JSONL, ejecutable en Colab/Kaggle/Binder. Clona el repositorio o [ábrelo en un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Agrega integridad estilo HMAC: firma el hash de cada entrada con una clave secreta (vía `hmac.new`) para que solo los poseedores de la clave puedan crear entradas válidas — así también se atrapa la autoría encubierta por externos, no solo las ediciones accidentales.
- Envía el JSONL a un archivo con `.write_text("\n".join(export_jsonl()))` y un dashboard que lo ingiera, graficando el conteo de `ERROR` por hora a partir del campo `ts`.
- Implementa `tamper_demo()` como un paso que voltea aleatoriamente un carácter en el registro, re-verifica e imprime qué entrada se rompió — una auto-prueba incorporada para la clase.
- Ata la retención a una fecha (`retain_since("2025-06-01T10:03:00")`) y registra una entrada marcadora `RETENTION` cada vez que pode, para que la historia eliminada quede ella misma evidenciada.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓