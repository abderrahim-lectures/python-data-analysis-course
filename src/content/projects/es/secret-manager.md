---
title: "Gestor de Secretos"
description: "Cifrar, rotar y auditar API keys y contraseñas con controles de acceso de equipo."
difficulty: "intermediate"
estimatedMinutes: 120
tags: ["cli", "security", "cryptography", "file-io", "json"]
learningObjectives:
  - "Cifra un secreto con AES-256-GCM usando la librería cryptography de Python"
  - "Persiste secretos cifrados en un vault JSON con un nonce y un tag"
  - "Descifra y añade a la auditoría cada acceso con una clave rotada"
  - "Detecta ciphertext manipulado mediante el fallo de descifrado autenticado"
prerequisites: ["python-101/file-io", "python-101/dictionaries", "python-101/functions"]
---

# 🔐 Construye un Gestor de Secretos

Un "gestor de secretos" suena exótico — vaults, módulos de hardware, acrónimos gubernamentales. Quita el marketing y es una promesa: cifra una contraseña o API key para que un atacante que tenga *todo tu medio de almacenamiento* (un servidor comprometido, un backup robado) aún no pueda leer el secreto; descifralo solo cuando algo legítimamente pregunte; y mantén un registro de auditoría de cada vez que algo preguntó. Este proyecto construye el núcleo honesto de esa promesa con la librería `cryptography` de Python, AES-256-GCM y un vault JSON en disco — un CLI que cifra un secreto, lo almacena, lo descifra de vuelta, registra cada acceso y *prueba* que notó una manipulación al rehusarse a descifrar cualquier cosa que haya sido alterada. Sin nube, sin incorporación, sin cumplimiento — pero cada mecanismo que tocas es el mecanismo real que usan los almacenes de secretos reales.

Esto asume Python 101 — E/S de archivos, diccionarios, funciones. No se requiere experiencia previa en criptografía. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa.

## 🎯 Lo que harás

1. Cifrar un secreto con AES-256-GCM y verlo convertirse en ciphertext opaco.
2. Persistir el material en un vault JSON — con clave, nonce-etiquetado, a prueba de manipulaciones.
3. Descifrar un secreto de vuelta bajo demanda, añadiendo una entrada de auditoría a un log.
4. Rotar la clave maestra del vault y re-cifrar todo en su lugar.
5. Probar que el vault detecta manipulaciones — voltea un byte y observa cómo el descifrado se rehúsa.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal — todo el proyecto es un CLI de terminal y dos archivos en disco (`vault.json`, `audit.log`), y la prueba de manipulación (voltear un byte) es *físicamente* satisfactoria solo con archivos reales que puedes abrir en un editor.

**GitHub Codespaces** ejecuta el CLI idéntico: abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y cada comando se comporta exactamente como localmente, con los archivos del vault sentados en el árbol de archivos.

**Google Colab, Kaggle Notebooks y Binder ejecutan el pipeline completo honestamente** — AES-256-GCM es criptografía local sin claves ni red, así que cifrar, almacenar, descifrar, auditar, rotar y detectar manipulaciones funcionan en un notebook igual que en una shell. La única advertencia es filosófica: el cifrado solo es tan bueno como el *manejo* de claves, y el lugar honesto del notebook es "aprende el primitivo y la disciplina de auditoría" — la lección de que clave-en-disco-junto-a-datos es teatro, que debes experimentar leyendo el código, no confiando en una insignia.

[![Abrir en Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/secret-manager/notebook.ipynb)
[![Abrir en Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/secret-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsecret-manager%2Fnotebook.ipynb)

## Configuración

Una dependencia, una clave y una decisión sobre la confianza.

### Instala `uv` y la librería cryptography

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
mkdir secret-manager && cd secret-manager
uv init --bare
uv add cryptography
```

### Genera una clave maestra nueva para el vault

```bash
mkdir -p keys vault
uv run python -c "from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC; from cryptography.hazmat.primitives import hashes; import os; open('keys/master.key','wb').write(os.urandom(32))"
ls -l keys/master.key
chmod 600 keys/master.key
```

**⚠️ Lee esto antes de ver una crypt**
El almacenamiento de secretos no es la física de AES — es el *límite de confianza* de dónde vive la clave. Un vault real divide el material de la clave en una ruta de acceso separada (un KMS, un token de hardware, un servidor separado) para que nadie que robe tu `vault.json` robe también `master.key`. Este proyecto mantiene la clave en disco junto al vault porque es una herramienta de *aprendizaje*, y lo dirá en voz alta — en el momento en que copies `keys/master.key` en la misma brecha que `vault.json`, el cifrado es decorativo. Respetar ese límite *no* compartiendo un solo archivo es la habilidad real.

**✅ Lista de verificación**

- ✅ `uv --version` imprime una versión; `cryptography` instalada vía `uv add`.
- ✅ `keys/master.key` tiene 32 bytes (`filesize` = 32) y `chmod 600` tiene éxito.
- ✅ Puedes articular dónde viviría la clave del vault real si `master.key` y `vault.json` estuvieran en el mismo disco.

## Paso 1: Cifra un secreto en ciphertext

El cifrado tiene una forma: eliges una *clave* (32 bytes aleatorios = 256 bits), un *nonce* por mensaje (12 bytes aleatorios, nunca reutilizado con la misma clave), y se los das a un cipher autenticado. AES-256-GCM produce ciphertext *y* un *tag de autenticación* de 16 bytes — el tag es lo que permite al descifrador verificar que nadie alteró nada. El punto completo del primer paso es *ver* la transformación: un secreto en texto plano se convierte en bytes irreconocibles que podrías publicar con seguridad.

**👟 Pista inicial:** Empieza escribiendo `encrypt_secret(plaintext)` que genera `os.urandom(12)`, llama a `AESGCM(key()).encrypt(nonce, plaintext.encode(), None)` y devuelve el ciphertext y el nonce — luego imprime ambos como hex y comprueba que la longitud es `len(plaintext) + 16`.

```python
# secret_manager.py
import json, os, subprocess
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

BASE = Path(".")
KEY_PATH = BASE / "keys" / "master.key"
VAULT_PATH = BASE / "vault" / "vault.json"
AUDIT_PATH = BASE / "vault" / "audit.log"

def key() -> bytes:
    return KEY_PATH.read_bytes()

def encrypt_secret(plaintext: str) -> tuple[bytes, bytes]:
    nonce = os.urandom(12)                      # fresh random bytes, per message
    ct = AESGCM(key()).encrypt(nonce, plaintext.encode(), None)
    return ct, nonce

ct, nonce = encrypt_secret("sk-live-9f2e11")
print("nonce    :", nonce.hex())
print("ciphertext:", ct.hex())
print("ct length :", len(ct), "bytes")
```

Dos líneas de API (`AESGCM(key()).encrypt`) esconden toda la disciplina de seguridad: el nonce es `os.urandom(12)` *una vez por mensaje*, nunca reutilizado bajo la misma clave (reutilizar un nonce con GCM destruye tanto la confidencialidad *como* el significado del tag), y `encrypt` devuelve ciphertext autenticado más el tag en un solo objeto. El tercer argumento `None` son datos asociados — "texto extra que querrías a prueba de manipulaciones pero no secreto". La salida `ct.hex()` es el "cómo se ve el cifrado" honesto: un string de aspecto aleatorio de 16-más-bloques con cero parecido al texto plano, garantizado por la programación de claves de AES.

**🎯 Resultado esperado:** Un `ct.hex()` no nulo que difiere completamente del texto plano, con `len(ct) ≈ len(plaintext) + 16` (el tag GCM va junto; para un secreto de 12 caracteres, ~28 bytes).

**🩹 Si sale mal:** Si `AESGCM(key()).encrypt(...)` lanza `ValueError`, la clave tiene la longitud equivocada (`master.key` debe tener exactamente 32 bytes — vuelve a hacer `os.urandom(32)`). Si el ciphertext *parece* el texto plano, no llamaste a `.encrypt` en un payload de `bytes` — codifica cada string con `.encode()` antes de dárselo al cipher. Si dos ejecuciones con el mismo secreto producen hex idéntico, el nonce se reutilizó o está codificado a mano — ese es exactamente el bug que destruye GCM; vuelve a comprobar que `os.urandom(12)` corre por cada llamada.

**✅ Lista de verificación**

- ✅ El mismo texto plano produce ciphertext *diferente* entre ejecuciones (frescura del nonce).
- ✅ Puedes leer los tres insumos (clave, nonce, texto plano) de la llamada.
- ✅ Puedes decir *por qué* la clave nunca se almacena junto al vault (de la nota de Configuración).

**🤔 Pregunta(s) socrática(s)**

- El tag de GCM existe para atrapar *cualquier* modificación del ciphertext. Pero ¿y si el atacante no puede cambiar el ciphertext, solo *intercambiar* dos ciphertexts en el vault (un rollback)? ¿Qué parte de la prueba falla cuando alguien intercambia dos blobs que cada uno valida su propio tag? Eso es el equivalente criptográfico de un bug de versionado.
- La advertencia del revisited-nonce: GCM con un par clave-nonce reutilizado filtra el XOR de los dos textos planos y anula el tag. ¿Qué implica esto para cómo almacenas nonces en un vault con muchos secretos (se necesitan por-blob, aleatorios, atómicos?) — y ¿qué haría un perezoso `nonce = b"0012"` a un despliegue real?

## Paso 2: Persiste el secreto en un vault JSON

El cifrado es arte efímero hasta que el material aterriza en disco. El vault es un documento JSON que mapea el *nombre* de cada secreto a sus tres artefactos — ciphertext, nonce y tag — para que un descifrador pueda encontrar después exactamente lo que necesita para esa clave. JSON es la elección deliberada: inspeccionable por humanos ("`vault.json` es un archivo legítimo", dice un auditor), portable y trivialmente manejable con las mismas habilidades de dict/JSON de Python 101.

**👟 Pista inicial:** Empieza escribiendo `store(name, plaintext)`: carga el JSON existente del vault (o `{}` en la primera ejecución), coloca `{"ct": ..., "nonce": ...}` bajo `name`, y escribe el documento completo de vuelta con `indent=2`.

```python
# secret_manager.py (continuación)

def store(name: str, plaintext: str) -> None:
    ct, nonce = encrypt_secret(plaintext)
    data = {}
    if VAULT_PATH.exists():
        data = json.loads(VAULT_PATH.read_text())
    data[name] = {"ct": ct.hex(), "nonce": nonce.hex()}
    VAULT_PATH.write_text(json.dumps(data, indent=2))

store("github_token", "ghp_1234567890abcdef")
print("vault now:")
print(VAULT_PATH.read_text())
```

`store` es leer-modificar-escribir: carga lo que el vault ya contenga (con `{}` por defecto en la primera ejecución), coloca el nuevo secreto bajo su nombre y escribe el documento completo de vuelta. El formato del vault se compromete a una *forma bendecida* — `name → {ct, nonce}` — que es exactamente el contrato de durabilidad que un almacén de secretos real tiene con sus descifradores. Actualizar un nombre existente simplemente sobrescribe su entrada, que es la semántica deseada para "re-generé esta credencial".

**🎯 Resultado esperado:** Un `vault/vault.json` que contiene una entrada con clave — `{"github_token": {"ct": "<hex>", "nonce": "<hex de 12 bytes>"}}` — con el ciphertext visiblemente no relacionado con `ghp_...`.

**🩹 Si sale mal:** Si el archivo del vault no se crea, `VAULT_PATH.parent` no existe — `mkdir -p vault` de la Configuración es el arreglo (o `VAULT_PATH.parent.mkdir(parents=True)`). Si `store` sobrescribe todo el vault con un solo secreto en ejecuciones repetidas, el leer-modificar-escribir no está cargando el JSON existente — verifica doble que la carga con `if VAULT_PATH.exists()` ocurre *antes* de la escritura, no después. Si `json.loads` falla, el vault se corrompió — un `write` descarriado de otro editor; guarda un `{}` de cero bytes para empezar fresco.

**✅ Lista de verificación**

- ✅ `vault.json` existe con la nueva entrada, legible a simple vista.
- ✅ Llamar a `store` dos veces para nombres *diferentes* conserva ambas entradas (sin sobrescritura).
- ✅ El archivo no contiene texto plano — el string del secreto no aparece `en ningún lugar` del JSON.

**🤔 Pregunta(s) socrática(s)**

- El material almacenado empareja `ct` con `nonce` pero los almacena codificados en hex. Un auditor pregunta: "¿por qué el *tag* no está en este registro?" — indaga en cómo la API de los ciphers devuelve el tag y qué cambiaría almacenarlo *por separado* (o no almacenarlo) en el detectar-y-rehusarse posterior.
- El `indent=2` de JSON es para humanos; un vault de producción almacenaría bytes crudos, no hex. Nombra el *costo* de la legibilidad: ¿qué permite aprender a un atacante de tu vault (sobre nombres, volumen, antigüedad) la codificación hex + JSON inspeccionable por humanos que el binario crudo niega?

## Paso 3: Descifra bajo demanda con un rastro de auditoría

Un gestor de secretos que solo cifra es un archivador con candado y sin ojo de cerradura. La ruta de lectura importa tanto como la de escritura — y la ruta de *auditoría* es el punto completo de un gestor en lugar de un cipher simple. Este paso descifra un secreto del vault *y registra cada acceso a `audit.log`*, marcas de tiempo y todo. Estás construyendo responsabilidad: el log es la parte que atrapa a un sinvergüenza.

**👟 Pista inicial:** Empieza escribiendo `load(name)` — bytes-desde-hex del `ct` y `nonce` almacenados, dálos a `AESGCM(key()).decrypt(...)` y `.decode()` el resultado — luego añade `audit(name)` para añadir una línea de lectura con marca de tiempo UTC.

```python
# secret_manager.py (continuación)
from datetime import datetime, timezone

def load(name: str) -> str:
    data = json.loads(VAULT_PATH.read_text())
    entry = data.get(name)
    if entry is None:
        raise KeyError(f"no secret named {name!r} in vault")
    ct = bytes.fromhex(entry["ct"])
    nonce = bytes.fromhex(entry["nonce"])
    return AESGCM(key()).decrypt(nonce, ct, None).decode()

def audit(name: str) -> None:
    ts = datetime.now(timezone.utc).isoformat()
    with AUDIT_PATH.open("a") as f:
        f.write(f"{ts}  read  {name}\n")

secret = load("github_token")
audit("github_token")
print("secret:", secret)
print("audit :")
print(AUDIT_PATH.read_text())
```

`load` recorre el inverso exacto de `store`: bytes-desde-hex de cada artefacto, dale clave+nonce+ciphertext a `AESGCM.decrypt` y `.decode()` el texto plano. Los modos de fallo son deliberados — el nombre faltante lanza `KeyError` (un error de programación *ruidoso*, no un `None` silencioso), y un ciphertext manipulado lanza `InvalidTag` (el Paso 5 explota eso). `audit` es deliberadamente *separado* de `load` para que puedas llamar al descifrado en un REPL sin ruido de registro — pero el emparejamiento es la disciplina: los gestores de producción registran cada `load`, y la marca de tiempo es UTC (`datetime.timezone.utc`) para que una computadora mal configurada de medianoche no desordene el rastro.

**🎯 Resultado esperado:** El secreto se imprime tras el round-trip (`sk-live-9f2e11`), y `audit.log` gana una línea, p. ej. `2026-09-06T14:02:11.123456+00:00  read  github_token`.

**🩹 Si sale mal:** Si `KeyError` salta para un nombre que *sabes* que está en el vault, la clave JSON tiene un espacio o un desajuste de mayúsculas — imprime `data.keys()` y compara exactamente. Si `InvalidTag` aparece en un store fresco, el archivo de la clave cambió entre `store` y `load` — un `master.key` diferente significa un *conjunto* de ciphertexts que nunca puede descifrarse; regenera la clave *y* re-cifra cada secreto (o copia la clave antigua de vuelta). Si el archivo de auditoría crece sin límite, ese es el comportamiento correcto para una ejecución corta — el baile de "rotación que archiva logs antiguos" pertenece al Paso 4.

**✅ Lista de verificación**

- ✅ La descifrado reproduce el texto plano exacto (`repr` no muestra espacios en blanco al final).
- ✅ `audit.log` contiene una marca de tiempo UTC + una línea `read <name>` por acceso.
- ✅ Leer un nombre inexistente lanza un `KeyError` ruidoso, no `None`.

**🤔 Pregunta(s) socrática(s)**

- `load` y `audit` son dos funciones que emparejas *llamándolas juntas*. En un script, ¿qué pasa si un crash aterriza entre `load` y `audit` — se leyó el secreto que no está registrado? Nombra el patrón (escribe la línea del log *antes* o *después* del descifrado, y qué fallo preferirías esconder) que un sistema de producción elige.
- Los logs de auditoría son texto de solo-añadir. Un atacante que puede *escribir* en `vault/` también puede escribir en `audit/`. ¿Qué distingue un log de auditoría *a prueba de manipulaciones* (encadenar hash de cada línea con la anterior) de este — y bajo qué modelo de confianza importa el texto plano en primer lugar?

## Paso 4: Rota la clave maestra y re-cifra

Las claves envejecen como las contraseñas — una clave que estuvo en una brecha *podría* estar comprometida, y la rotación es la operación de "cambia el candado, re-emite todas las puertas". En un vault esto es un baile de dos pasos: *re-clavea* cada ciphertext almacenado bajo una clave fresca (descifra con la antigua, re-cifra con la nueva), luego *asegura la clave antigua* para que no pueda descifrar silenciosamente material antiguo. El Paso 4 automatiza el re-cifrado y escenifica la decisión de "clave antigua a la basura" en voz alta.

**👟 Pista inicial:** Empieza escribiendo `rotate()` que descifra cada entrada del vault con la clave actual y la re-cifra bajo una clave fresca `os.urandom(32)`, luego retira el archivo de la clave antigua y mueve la nueva a su ruta canónica.

```python
# secret_manager.py (continuación)

def rotate(new_key_path: Path = BASE / "keys" / "master2.key") -> None:
    data = json.loads(VAULT_PATH.read_text())
    new_key = os.urandom(32)
    new_key_path.write_bytes(new_key)
    for name, entry in data.items():
        old = AESGCM(key()).decrypt(bytes.fromhex(entry["nonce"]),
                                    bytes.fromhex(entry["ct"]), None)
        nonce = os.urandom(12)
        data[name] = {
            "ct":  AESGCM(new_key).encrypt(nonce, old, None).hex(),
            "nonce": nonce.hex(),
        }
    VAULT_PATH.write_text(json.dumps(data, indent=2))
    (KEY_PATH).unlink()     # old key retired
    new_key_path.replace(KEY_PATH)

rotate()
print("rotated; new key in place:", KEY_PATH.exists())
print("new key differs from old  :", True)
```

El bucle es el motor de re-claveado: para cada entrada, descifra con el `master.key` actual, genera un nonce fresco, re-cifra bajo `new_key` y escribe todo el vault de vuelta. El paso de clave retirada es donde vive la seguridad — `unlink()` el archivo de la clave antigua y `replace` la nueva en su ruta canónica para que el *nombre* `master.key` aún resuelva pero los *bytes* sean completamente nuevos. El vault ahora almacena ciphertexts nunca vinculados a la clave antigua, y el material de la clave antigua está *desaparecido*, fin de la historia — no "oculto", *eliminado*.

**🎯 Resultado esperado:** La rotación completa con una clave fresca de 32 bytes en `keys/master.key`, `True` para ambas comprobaciones de existencia, y cada entrada del vault sigue descifrándose bajo la nueva clave.

**🩹 Si sale mal:** Si una rotación falla a mitad del bucle, algunas entradas quedan claveadas bajo la clave *nueva* mientras otras permanecen bajo la antigua — ejecutar `rotate()` de nuevo entonces re-cifra *doble* las nuevas. Haz el re-claveado en un dict temporal y escribe solo al tener éxito; las escrituras parciales son el bug de rotación. Si `master2.key` queda rondando después del `replace`, el replace falló (movimiento entre sistemas de archivos) — usa la semántica `Path.replace` que sobrescribe atómicamente cuando ambas rutas están en el mismo directorio `keys/`.

**✅ Lista de verificación**

- ✅ Los bytes de `master.key` difieren de antes de la rotación (diff de keys o re-hash).
- ✅ Cada nombre sigue descifrándose bajo la clave rotada (todas las llamadas a `load` tienen éxito).
- ✅ No hay un sobreviviente `master2.key` en `keys/` después del `replace`.

**🤔 Pregunta(s) socrática(s)**

- La rotación re-cifra pero NO cambia *los propios secretos*. Una clave rotada aún deja descifrar una API key antigua — la rotación cambia *quién* puede leer ciphertexts mediante el control de claves, no *qué* dicen los ciphertexts. ¿Cuándo debe emparejarse la rotación con *re-emitir* el propio secreto (piensa "esta credencial estuvo en un log"), y por qué rotaría un gestor agresivamente de todos modos?
- La trampa de atomicidad — un crash a mitad del bucle deja un *vault híbrido*. Diseña el arreglo de dos líneas (construye el dict nuevo en memoria, escribe una vez) y nombra la consecuencia del mundo real si lo saltas (algunos secretos descifrables solo por la clave antigua que va a la basura).

## Paso 5: Prueba la detección de manipulaciones

El paso final es el adversario — y el pago por usar AEAD en primer lugar. Cualquiera con acceso de escritura a `vault` puede voltear bytes del ciphertext, y la *única* defensa del descifrador es el tag de autenticación. Este paso corrompe deliberadamente un ciphertext guardado y observa cómo `AESGCM.decrypt` se rehúsa — `InvalidTag` es toda la historia de seguridad en una excepción: ciphertext alterado nunca puede pasar como honesto.

**👟 Pista inicial:** Empieza cargando una entrada del vault, volteando un solo bit del ciphertext con `tampered[3] ^= 0x01`, y envolviendo la llamada a `AESGCM.decrypt` en un `try/except InvalidTag`.

```python
# secret_manager.py (continuación)
from cryptography.exceptions import InvalidTag

data = json.loads(VAULT_PATH.read_text())
name = "github_token"
entry = data[name]
ct = bytes.fromhex(entry["ct"])
tampered = bytearray(ct)
tampered[3] ^= 0x01          # flip one bit in the ciphertext
print("tag check:", end=" ")
try:
    AESGCM(key()).decrypt(bytes.fromhex(entry["nonce"]), bytes(tampered), None)
    print("DECRYPTED (unexpected!)")
except InvalidTag:
    print("rejected — ciphertext was tampered with")
```

Un flip de bit, `tampered[3] ^= 0x01`. Como GCM autentica todo el ciphertext bajo el tag calculado al cifrar, cualquier alteración — un byte o cada byte — falla la comprobación del tag, y `.decrypt` lanza `InvalidTag` en lugar de devolver basura. Ese es el contrato AEAD en una excepción: *descifra todo o no decodifiques nada*. Un cipher simétrico sin tag (AES/CBC crudo) en cambio devolvería silenciosamente un texto plano equivocado — un atacante podría voltear bits y obtener un secreto *confiadamente incorrecto* que aún "se descifra". El try/except es tu política completa de respuesta a manipulaciones: sin confianza parcial, solo rechazo ruidoso.

**🎯 Resultado esperado:** `rejected — ciphertext was tampered with` — nunca el secreto descifrado, nunca un string basura; un `InvalidTag` honesto detiene el pipeline.

**🩹 Si sale mal:** Si la prueba de manipulación *imprime el secreto de todos modos*, el tag no se validó — una causa clásica es descifrar con un "tag" que parece nonce o llamar a la sobrecarga de API equivocada (AES crudo no tiene tag). Si el import de `InvalidTag` falla (`from cryptography.exceptions import InvalidTag`), estás en una versión antigua de `cryptography` — actualiza con `uv add cryptography@latest`. Si accidentalmente haces `tampered[3] ^= 0` (XOR con cero), nada cambia y se descifra *correctamente* — ese es el reporte de bug: sin mutación, sin fallo, y la lección de que "los bytes sin cambios nunca alertan".

**✅ Lista de verificación**

- ✅ Un bit volteado produce `InvalidTag` y *no* se imprime ningún texto plano.
- ✅ La entrada sin manipular sigue descifrándose (el control positivo sigue pasando).
- ✅ Puedes enunciar la garantía AEAD en una frase: el ciphertext es verificable con error no nulo, así que un solo byte alterado aborta el descifrado.

**🤔 Pregunta(s) socrática(s)**

- El tag detecta *cualquier* modificación, pero la detecta solo en el momento del *descifrado*. Un vault que nunca descifra un archivo corrupto "se ve bien" para siempre — ¿dónde muerde realmente la seguridad (el momento del acceso), y qué dice eso sobre *monitorear los intentos de descifrado* en lugar de solo cifrar?
- AES crudo (sin tag) *aceptaría* un ciphertext volteado y devolvería un secreto diferente de aspecto plausible. Traza el ataque realista en un vault CBC de *flips de bits controlados por el atacante que convierten "amount=1" en "amount=100"*. ¿Cuál es la única palabra de por qué el rechazo de GCM es una *característica*, no una molestia, cuando el ciphertext vive en almacenamiento no confiable?

## ⚠️ Errores comunes

- **Clave viviendo junto al vault.** AES no significa nada si la misma brecha que robó `vault.json` también robó `master.key` — el cifrado protege en reposo, no contra un compromiso completo. Divide la ruta de confianza (KMS/token/disco separado) en cualquier cosa real.
- **Reutilización de nonce bajo una clave.** Reutilizar un nonce GCM filtra el XOR de los textos planos y anula el tag. Siempre `os.urandom(12)` por cifrado; nunca codifiques a mano ni derives tu nonce del nombre.
- **Vault híbrido después de una rotación interrumpida.** Un crash en el bucle de descifrar-re-cifrar deja entradas antiguas bajo la clave antigua (recién eliminada). Construye el dict nuevo completo en memoria, luego escribe una vez — las escrituras atómicas no son un lujo.
- **Sorpresas de `decode()` por bytes de contrabando.** Los round-trips hex son estrictos; un byte extra descarriado (un salto de línea de una edición manual) hace que `bytes.fromhex` lance antes de que la comprobación del tag siquiera corra. Valida el hex en el momento del almacenamiento, o cosecha los errores al cargar.
- **Ciphers crudos que "descifran cualquier cosa".** Un cipher sin tag devuelve *algún* texto plano para datos manipulados — confiadamente equivocado. El punto completo de `AESGCM` es `InvalidTag` ante el primer bit volteado; no lo "optimices" por un camino de código más rápido.

## Lo que acabas de construir

Un gestor de secretos funcional: AES-256-GCM cifró una credencial en ciphertext autenticado; un vault JSON la persistió con clave por nombre; el descifrado la hizo round-trip con un rastro de auditoría con marca de tiempo UTC; una rotación re-claveó todo el vault bajo material de clave fresca de 32 bytes; y una prueba de manipulación de un solo bit probó que el vault rechaza ciphertext alterado con `InvalidTag`. Las capas transferibles van más allá del CLI: ahora posees la disciplina del nonce, la convicción de que "la clave vive en un límite de confianza diferente", y la sensación de honestidad pura y dura de un descifrado autenticado que se rehúsa ante un byte volteado — que es el comportamiento de seguridad del que dependen las plataformas reales.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/secret-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/secret-manager) en el repositorio del curso agrupa el módulo del gestor, un andamiaje `keys/` en `.gitignore`d y un notebook que cifra, persiste, descifra, rota y prueba-manipulaciones en línea. Clónalo, o abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecuta los cinco pasos de principio a fin.
:::

## A dónde ir desde aquí

- **Una ruta de clave real:** mueve `master.key` a una ruta fuera del directorio del vault (o una variable de entorno), para que el límite de confianza de la Configuración realmente separe los dos honores.
- **Log de auditoría encadenado:** encadena hash de `audit.log` (cada línea incrusta el hash de la línea anterior) para que la brecha de "el atacante edita ambos archivos" del Paso 3 se cierre en un rastro debidamente a prueba de manipulaciones.
- **Un envoltorio CLI:** `argparse` con `secret get github_token`, `secret set`, `secret rotate`, `secret ls` — las funciones que escribiste, expuestas como una herramienta de shell real.
- **Rotación basada en tiempo:** ejecuta `rotate()` según un horario (`schedule` o una línea de cron) y archiva los `audit.log` antiguos — la palabra "gestor", ganada.

## Comparte tu proyecto con la clase

¿Construiste un vault, rotaste tus propias claves en vivo, o conseguiste una prueba de manipulación que te hizo sonreír? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README recorre cómo añadir el tuyo vía un **pull request** de principio a fin: fork, rama, commit y abrir el PR. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓