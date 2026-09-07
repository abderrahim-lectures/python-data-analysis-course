---
title: "Kit de Herramientas de Cifrado"
description: "Cifra y descifra archivos y mensajes con AES-256, RSA e intercambio seguro de claves."
difficulty: "intermediate"
estimatedMinutes: 80
tags: ["cli", "cryptography", "files", "security"]
prerequisites:
  - "Fundamentos de Python (funciones, archivos, bytes)"
  - "Comodidad editando y ejecutando scripts en la terminal"
learningObjectives:
  - "Cifrar y descifrar un mensaje con una clave simétrica"
  - "Derivar una clave fuerte de una contraseña con PBKDF2 y una sal aleatoria"
  - "Cifrar y descifrar archivos en disco, probando la integridad del viaje de ida y vuelta"
  - "Cifrar una clave de sesión compartida con pares públicos/privados RSA"
  - "Firmar un mensaje y verificarlo contra una copia alterada"
---

# 🔐 Construye un Kit de Herramientas de Cifrado

"Keystore file. Build the it." — un equipo real pidió exactamente esto: un archivo Python que bloquea secretos de servicio en reposo. Este proyecto construye ese kit desde cero: un mensaje en texto plano → texto cifrado, una contraseña convertida en una clave real, un archivo que atraviesa el cifrado sin que cambie un solo byte, RSA bloqueando una clave de sesión para que dos lados puedan compartir un secreto simétrico sin compartir el secreto en sí, y una firma que prueba que un mensaje está sin modificar y fue enviado por quien posee una clave privada. Al final tendrás las cinco primitivas que toda librería de seguridad incluye, usadas correctamente.

Esto asume Python 101 — listas, dicts, funciones, archivos — además de comodidad con bytes y `with open(...)`. La única dependencia es `cryptography`, una librería de seguridad de primera parte (usada por pip, TLS y las herramientas de GitHub) que no le concede nada a `openssl` para fines de aprendizaje — cifrado autenticado, derivación de claves y RSA, todo en uno.

## 🎯 Lo que harás

1. Generar una clave Fernet y hacer un viaje de ida y vuelta de un mensaje, texto cifrado y de regreso.
2. Derivar una clave determinista de una contraseña con PBKDF2 + sal aleatoria — y ver cómo una contraseña equivocada produce basura que no puede desbloquear.
3. Cifrar un archivo a `.enc` y restaurarlo byte por byte.
4. Envolver una clave de sesión Fernet con RSA para que la clave pública de un destinatario la desbloquee, pero solo su clave privada pueda leerla jamás.
5. Firmar un mensaje con tu clave privada y verificar tanto una copia intacta como una alterada.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — la derivación de claves y el cifrado de archivos son herramientas CLI locales, y `uv` maneja la dependencia`cryptography` con precisión.

**GitHub Codespaces** es una alternativa sin configuración: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node y Python ya están instalados) y ejecuta los mismos comandos desde una terminal del navegador.

**Google Colab, Kaggle Notebooks o Binder** funcionan — el notebook en [`examples/encryption-toolkit/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/encryption-toolkit/notebook.ipynb) pre-instala `cryptography` y ejecuta cada paso en memoria.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/encryption-toolkit/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/encryption-toolkit/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fencryption-toolkit%2Fnotebook.ipynb)

## Configuración

`uv` es una sola herramienta que reemplaza "instala Python, luego pip, luego una herramienta de entorno virtual" — y la única dependencia de terceros, `cryptography`, se instala en segundos.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, luego confirma que se instaló:

```bash
uv --version
```

Luego configura el proyecto con el paquete cryptography:

```bash
uv init encryption-toolkit
cd encryption-toolkit
uv add cryptography
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `uv add cryptography` termina con "Prepared ... cryptography" en el registro.
- ✅ `uv run python -c "from cryptography.fernet import Fernet"` tiene éxito.

## Paso 1: Viaje de ida y vuelta simétrico con una clave Fernet

El cifrado es una puerta: la *clave* la abre, el *texto cifrado* es lo que la puerta esconde. Fernet es el "predeterminado sensato" de `cryptography` — AES-128-CBC más un MAC, codificado en base64, un objeto cuyos `encrypt` y `decrypt` hacen todo el trabajo. El invariante del viaje de ida y vuelta — `decrypt(encrypt(x)) == x` — es la propiedad sobre la que se apoyan todos los pasos posteriores, de modo que tu primera demo lo prueba.

### 1.1 Pon a prueba Fernet

**👟 Pista inicial :** `Fernet.generate_key()` crea una clave nueva; el mismo objeto `Fernet(key)` tanto cifra como descifra:

```python
# symmetric.py
from cryptography.fernet import Fernet

key = Fernet.generate_key()
print("key:", key.decode())

fernet = Fernet(key)
message = b"top secret: launch at midnight"
token = fernet.encrypt(message)
print("token:", token.decode())

plain = fernet.decrypt(token)
print("round-trip ok:", plain == message)
print("key bytes:", len(key))
print("token bytes:", len(token))
```

Ejecútalo:

```bash
uv run symmetric.py
```

`key` y `token` son texto base64 seguro para URL que podrías meter en una config YAML o en una línea de registro — *parecen* presentables y son exactamente tan alocados: `key` son los 32 bytes aleatorios que Fernet necesita, `token` es texto cifrado más un MAC más una marca de tiempo, y ninguno se parece al mensaje de ninguna forma humana. `decrypt` también verifica integridad: un token mutado lanza `InvalidToken` en lugar de devolver basura — el MAC hace que la detección de falsificación sea gratis en cada lectura.

**🎯 Resultado esperado :** (los bytes de `key`/`token` difieren en tu máquina — aleatorio nuevo en cada ejecución)

```
key: mlELRCZYDLnXiLKv6S3s0stB92jE_qVhxx6-R3AycKk=
token: gAAAAABqndOYC911dXqRml78PYZngKgnwQTQbqes0eTFGn7fd7H7ZbVrplSQ406cDYBvxK2D6yG64eKtpOy5Cni5n5i2C1bgjWzSdpCrM9vC9c_W7A7WfN4=
round-trip ok: True
key bytes: 44
token bytes: 120
```

**🩹 Si sale mal :** Si `round-trip ok: False`, una de las dos operaciones no está usando la misma clave — verifica que no haya un segundo `Fernet(...)` construyendo una clave nueva. Si `decrypt` lanza `InvalidToken`, el `token` se escribió después de `encrypt` (editar la imagen quitando un `=` final rompe el base64), o descifraste un token de una ejecución *anterior* con una clave *nueva* — la puerta necesita la misma clave que la cerró.

### 1.2 Verifica el viaje de ida y vuelta

**✅ Lista de verificación**

- ✅ `key` tiene 44 caracteres (32 bytes, base64) y `token` 120 caracteres para un mensaje de 25 bytes.
- ✅ `plain == message` — el descifrado devuelve los bytes originales exactos.
- ✅ Corromper un carácter de `token` (cambiar `A` por `B`) hace que `decrypt` lance `InvalidToken`, no que devuelva texto equivocado.

**🤔 Pregunta(s) socrática(s)**

- La clave se almacena — ¿dónde? Si este script escribe `key` en un archivo junto al texto cifrado, la cerradura es decorativa: un atacante lee ambos. ¿Qué regla mínima de almacenamiento hace que la clave sea realmente secreta (archivo separado, variable de entorno, gestor de secretos)?
- Fernet es cifrado *autenticado*: el descifrado de un token alterado falla en voz alta. ¿Por qué ese único comportamiento importa más para "archivos de configuración en reposo" que para una demo de juguete — qué bug de la alternativa silenciosa previene?

## Paso 2: Deriva una clave de una contraseña

Nadie recuerda 32 bytes aleatorios; todos recuerdan una contraseña. PBKDF2 estira una contraseña débil hasta convertirla en una clave fuerte — *y* un hash, de modo que `"correct-horse-battery-staple"` + la misma sal siempre produce la misma clave de 32 bytes, mientras que `"correct-horse-battery-staple"` + una sal distinta produce algo sin relación. La sal es la ayuda de memoria: almacenada junto al hash, nunca secreta, delimita cada derivación a las claves de este único usuario.

### 2.1 Deriva con PBKDF2

**👟 Pista inicial :** `PBKDF2HMAC(hashes.SHA256(), length=32, salt=..., iterations=600_000).derive(password)` — la misma sal, la misma derivación, la misma clave:

```python
# keys.py
import os
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

def derive_key(password: bytes, salt: bytes, length: int = 32) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=length,
                     salt=salt, iterations=600_000)
    return kdf.derive(password)

password = b"correct-horse-battery-staple"
salt = os.urandom(16)

key1 = derive_key(password, salt)
key2 = derive_key(password, salt)
key_wrong = derive_key(b"wrong-password", salt)

print("same password + salt -> same key:", key1 == key2)
print("wrong password -> different key:", key1 != key_wrong)
print("key bytes:", len(key1))
print("salt bytes:", len(salt))
```

Ejecútalo:

```bash
uv run keys.py
```

La función es deliberada en lo que omite: toma una *contraseña* y una *sal* y devuelve exactamente `length` bytes — sin persistencia, sin escribir archivos, de modo que quien llama decide qué almacenar. El `iterations=600_000` de PBKDF2 es el "reductor de velocidad": cada derivación hace 600 mil rondas de HMAC-SHA256, de modo que forzar por fuerza bruta una contraseña le cuesta al atacante seiscientas mil veces más de lo que te cuesta a ti. Las sales `os.urandom(16)` no se repiten en la práctica, matando las tablas de arcoíris — y el precio de repetir una sal es que cada clave derivada colapsa en una sola.

**🎯 Resultado esperado :**

```
same password + salt -> same key: True
wrong password -> different key: True
key bytes: 32
salt bytes: 16
```

**🩹 Si sale mal :** Si `same password + salt -> same key: False`, la llamada a `derive` atrapó una copia de `salt` que cambió entre llamadas (`os.urandom` dentro de la función también haría esto — la sal debe ser un valor pasado). Si falta `iterations`, bienvenido al mundo de las alarmas de clave débil: la demo aún pasa, pero el costo de fuerza bruta de la clave acaba de caer seis órdenes de magnitud.

### 2.2 Verifica la derivación

**✅ Lista de verificación**

- ✅ El mismo par `(password, salt)` produce claves byte- idénticas en dos llamadas separadas.
- ✅ Una contraseña con una palabra equivocada produce una clave distinta de 32 bytes incluso con la misma sal.
- ✅ Una sal nueva `os.urandom(16)` con la misma contraseña rompe la clave anterior — las sales delimitan las claves.

**🤔 Pregunta(s) socrática(s)**

- La sal *no* es un secreto, y aun así quitarla debilita el sistema. ¿Contra qué protege exactamente la sal — y por qué reutilizar una misma sal en todos los usuarios es el equivalente al credential stuffing?
- `600_000` iteraciones es un número de un benchmark, no una ley. ¿Qué lo empuja hacia arriba en un servidor real (avances en CPU, rigs de cracking GPU), y cuál es el costo de elegir un valor demasiado alto (cada arranque de app, cada inicio de sesión)?

## Paso 3: Cifra y descifra archivos

Ahora el kit se vuelve práctico: cifra `secret.txt` a `secret.txt.enc`, luego restáuralo a `restored.txt`. El viaje de ida y vuelta es *todo el contrato* — texto plano de entrada, texto cifrado en disco, texto plano byte por byte de vuelta — y la ganancia "el texto cifrado oculta el texto plano" es lo que un escéptico abre del archivo `.enc` para comprobar.

### 3.1 Escribe el cifrador de archivos

**👟 Pista inicial :** Las funciones de servicio toman `src/dst/key` y devuelven tamaños; la demo las impulsa con un texto plano de 32 bytes y una clave Fernet:

```python
# encrypt_file.py
from cryptography.fernet import Fernet

def encrypt_file(src, dst, key):
    fernet = Fernet(key)
    with open(src, "rb") as f:
        ciphertext = fernet.encrypt(f.read())
    with open(dst, "wb") as f:
        f.write(ciphertext)
    return len(ciphertext)

def decrypt_file(src, dst, key):
    fernet = Fernet(key)
    with open(src, "rb") as f:
        plaintext = fernet.decrypt(f.read())
    with open(dst, "wb") as f:
        f.write(plaintext)
    return len(plaintext)

if __name__ == "__main__":
    from pathlib import Path
    key = Fernet.generate_key()

    Path("secret.txt").write_bytes(b"meeting moved to the labs at 9pm")
    before = Path("secret.txt").read_bytes()

    size_enc = encrypt_file("secret.txt", "secret.txt.enc", key)
    restored = decrypt_file("secret.txt.enc", "restored.txt", key)

    print(f"plaintext size:  {len(before):4d} bytes")
    print(f"ciphertext size: {size_enc:4d} bytes")
    print(f"restored matches: {Path('restored.txt').read_bytes() == before}")
    print(f"ciphertext hides plaintext: {b'labs' not in Path('secret.txt.enc').read_bytes()}")
```

Ejecútalo:

```bash
uv run encrypt_file.py
```

Dos funciones espejo (encrypt lee texto, escribe texto cifrado; decrypt lee texto cifrado, escribe texto) hacen que el pipeline se lea de izquierda a derecha antes de siquiera ejecutarlo. `Path.write_bytes`/`read_bytes` esconden el boilerplate del `with` y mantienen corta la demo; los archivos reales viven en disco, de modo que *tú* puedes `cat secret.txt.enc` después y confirmar que nada legible sobrevive. El texto cifrado es 140 bytes contra 32 de texto plano — el MAC de Fernet más su bloque de versión — el impuesto que pagas por el cifrado autenticado, y vale enteramente la pena.

**🎯 Resultado esperado :**

```
plaintext size:   32 bytes
ciphertext size:  140 bytes
restored matches: True
ciphertext hides plaintext: True
```

**🩹 Si sale mal :** Si `restored matches: False`, el `src` del decrypt apuntó al archivo *original* (sin `.enc`) o la clave difiere entre las dos llamadas — descifra el texto cifrado con la misma clave que lo produjo. Si los tamaños vuelven `0`, el script escribió bytes a `secret.txt.enc` usando `open(dst, "w")` (modo texto) — el cifrado necesita `"wb"`/`"rb"`, modo binario en ambas direcciones.

### 3.2 Verifica el viaje de ida y vuelta del archivo

**✅ Lista de verificación**

- ✅ `secret.txt.enc` existe, es 108 bytes más grande que la fuente, y `cat` muestra solo galimatías base64.
- ✅ `restored.txt` es byte-idéntico a `secret.txt` (la verificación `==`, no a ojo de buen cubero).
- ✅ Borrar `restored.txt` y volver a ejecutar solo `decrypt_file` lo reproduce — lecturas idempotentes.

**🤔 Pregunta(s) socrática(s)**

- `encrypt_file` comprime todo el archivo en un solo token Fernet — bien para una nota de 32 bytes. Para un backup de 2 GB, un token único significa que un solo fallo de MAC mata todo el archivo sin descifrar nada. ¿Cuál es la forma operativa de un cifrador *por streaming*, y por qué una herramienta real podría aun así elegir archivo completo para cargas de tamaño config?
- La extensión `.enc` y el nombre `texto cifrado de barril` es una convención, no una garantía. ¿Dónde en este kit *probarías* (no implicarías) que una pareja que descifra tiene la clave correcta — antes de que confíen en los bytes "restaurados"?

## Paso 4: Envuelve una clave de sesión con RSA (cifrado híbrido)

RSA cifra como máximo ~245 bytes de una clave de 2048 bits — inútil para un archivo de 2 GB, ideal para la *clave de sesión* que usa el Fernet de tu archivo. Esto es cifrado híbrido, la arquitectura detrás de TLS: cifra el payload con Fernet simétrico rápido, envuelve la pequeña clave simétrica con RSA lento pero compartible, y transfiere solo la clave envuelta. La clave *pública* del destinatario cifra; solo su clave *privada* descifra.

### 4.1 Cifra un payload, envuelve la clave

**👟 Pista inicial :** Genera un par RSA, cifra el mensaje con una clave Fernet nueva, luego `public_key.encrypt(session_key, padding.OAEP(...))` — y desenvuelve en el lado privado:

```python
# hybrid.py
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
public_key = private_key.public_key()
print("RSA key size (bits):", private_key.key_size)

message = b"launch at midnight; team Tango is clear to deploy"
session_key = Fernet.generate_key()
fernet = Fernet(session_key)

ciphertext = fernet.encrypt(message)

wrapped = public_key.encrypt(
    session_key,
    padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()),
                 algorithm=hashes.SHA256(), label=None),
)
print("wrapped key length (bytes):", len(wrapped))

unwrapped = private_key.decrypt(
    wrapped,
    padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()),
                 algorithm=hashes.SHA256(), label=None),
)
print("hybrid round-trip ok:", Fernet(unwrapped).decrypt(ciphertext) == message)
```

Ejecútalo:

```bash
uv run hybrid.py
```

Cada lado de la entrega hace exactamente un trabajo: `public_key.encrypt` envuelve la *clave* (RSA de 2048 bits, de modo que la clave de sesión de ~32 bytes cabe con padding OAEP — por eso la longitud envuelta es 256, el tamaño del módulo RSA). El *payload* se queda en Fernet, que es por qué el texto del mensaje nunca toca RSA. Descifrar significa reconstruir la clave de sesión primero — `unwrapped` se alimenta directo de vuelta a `Fernet(...)` y el viaje se cierra. No hay forma de leer el mensaje solo con la clave privada o solo con la clave de sesión; la criptografía es un Y, y este código lo hace visible.

**🎯 Resultado esperado :**

```
RSA key size (bits): 2048
wrapped key length (bytes): 256
hybrid round-trip ok: True
```

**🩹 Si sale mal :** Si `public_key.encrypt` lanza `ValueError: too large`, tu `session_key` excedió la capacidad de ~245 bytes de OAEP — eso es esperado para payloads reales y exactamente por qué el esquema es híbrido (Fernet lleva el mensaje, RSA solo la clave). Si el descifrado falla con un padding de aspecto igual, la combinación `MGF1`/`algorithm` de un lado difiere — los parámetros de padding deben coincidir con precisión entre cifrar y descifrar.

### 4.2 Verifica la entrega híbrida

**✅ Lista de verificación**

- ✅ La clave envuelta es de 256 bytes (módulo RSA) sin importar la longitud del mensaje — RSA lleva la clave, Fernet lleva el mensaje.
- ✅ Un payload de hasta ~16 KB sobrevive; RSA nunca ve el payload.
- ✅ Simular al "destinatario" — mantener `session_key` como un secreto compartido solo entre cifrador y desenvolvedor — produce `True` solo cuando ambas mitades lo usan.

**🤔 Pregunta(s) socrática(s)**

- La demo genera el par RSA *y* la clave de sesión en un único script — un jugador con dos sombreros. En una entrega real, ¿quién posee `private_key`, quién envía `wrapped` (y cómo), y qué *nunca* ve el destinatario (la clave de sesión en sí)?
- El padding OAEP tiene un aspecto obligatorio y es fácil de copiar. ¿Cuál es el fallo cuando una pareja Java/TLS reemplaza OAEP por `PKCS1v15` — y por qué "es el mismo RSA" rompe el contrato silenciosamente?

## Paso 5: Firma y verifica — prueba que es tuyo, sin modificar

El cifrado prueba el secreto; las firmas prueban *identidad e integridad*: "quién escribió esto, y ¿cambió en el camino?" Firmar usa tu clave privada sobre el hash del mensaje; verificar usa tu clave pública y *falla en voz alta* si incluso un byte del mensaje difiere. Dos claves, dos direcciones, una propiedad cada una.

### 5.1 Firma una nota de versión y atrapa la alteración

**👟 Pista inicial :** `private_key.sign(message, padding.PSS(...), hashes.SHA256())`, luego dos llamadas `public_key.verify` — una contra los bytes prístinos, otra contra una marca de tiempo de un segundo después:

```python
# signverify.py
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

message = b"release v2.4 to production at 18:00 UTC"

private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
public_key = private_key.public_key()

signature = private_key.sign(
    message,
    padding.PSS(mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH),
    hashes.SHA256(),
)
print("signature length (bytes):", len(signature))

def verify(m: bytes) -> bool:
    try:
        public_key.verify(
            signature, m,
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()),
                        salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256(),
        )
        return True
    except Exception:
        return False

print("verify(original):", verify(message))
print("verify(tampered):", verify(b"release v2.4 to production at 18:01 UTC"))
```

Ejecútalo:

```bash
uv run signverify.py
```

El helper `verify` envuelve al que lanza `public_key.verify` — la convención de `cryptography` es *no lanzar nada* en éxito y `InvalidSignature` en fallo, de modo que atrapar lo convierte en un booleano. `hashes.SHA256()` hace doble tarea: PSS sala el hash y la firma cubre solo el digest, de modo que firmar un archivo de 2 GB cuesta lo mismo que firmar esta nota de 45 bytes. La lección de la demo es la segunda línea: la marca de tiempo cambió un minuto, la firma vive mutablemente sin cambios, y la verificación dice **no** — porque la verificación siempre es contra *los bytes reales frente a ti*, no el mensaje que alguien afirmó haber enviado.

**🎯 Resultado esperado :**

```
signature length (bytes): 256
verify(original): True
verify(tampered): False (raised InvalidSignature)
```

**🩹 Si sale mal :** Si `verify(original): False`, la `signature` se construyó desde un objeto `message` *distinto* (una nueva línea final o un cambio de mayúsculas) — firmar y verificar deben hacer hash de los bytes idénticos. Si `verify(tampered)` también devuelve `True`, la función que editaste no es la que se está probando (una copia `bytes(...)` contra el literal), o `verify` se traga la excepción y devuelve `True` en el `except`.

### 5.2 Verifica la lógica de la firma

**✅ Lista de verificación**

- ✅ El mensaje intacto verifica `True`; una diferencia de un byte verifica `False`.
- ✅ Claves distintas → `False`: la clave de firma y la de verificación deben ser el par que coincide.
- ✅ La firma tiene 256 bytes para cualquier tamaño de mensaje (RSA de 2048 bits hace hash del digest del mensaje, no del mensaje).

**🤔 Pregunta(s) socrática(s)**

- Firmar usa la clave *privada*, verificar la *pública* — la imagen espejo del cifrado RSA. ¿Por qué ese intercambio tiene todo el sentido para "publico mi clave, todos verifican mis versiones" y convierte las subidas cifradas a un servidor en la misma matemática con las direcciones volteadas?
- Una firma prueba que los bytes están sin modificar *para quien posee la clave pública*. ¿Qué único fallo a escala humana (subir una clave privada a un repositorio, publicar la clave pública equivocada) convierte todo el esquema en teatro — y cuál es la regla de "entonces haz esto en su lugar"?

## ⚠️ Errores comunes

- **Reutilizar una clave para todo.** Las claves Fernet son baratas; las sales son gratis. Re-derivar una clave con una sal obsoleta, o compartir el mismo archivo de clave entre máquinas, es cómo un archivo comprometido filtra a los demás.
- **Almacenar la clave de veras.** Un archivo `.enc` junto a `key.txt` en la misma carpeta es teatro de cifrado. La clave pertenece fuera del árbol del texto cifrado — un volumen separado, una variable de entorno o un gestor de secretos.
- **Modo binario o GTFO.** `open(dst, "w")` corrompe los bytes cifrados mediante la traducción de nuevas líneas y los supuestos de UTF-8. Es `"wb"` y `"rb"`, siempre.
- **Intercambiar padding silenciosamente.** OAEP vs PKCS1v15 parecen intercambiables y no lo son. Un padding o hash que no coincide entre cifrar/descifrar (o firmar/verificar) falla en el peor momento: en producción, contra la implementación de una pareja.
- **Firmar la narrativa, no los bytes.** "El mensaje que envié" vs. `message` en memoria son objetos diferentes. Firma/verifica los bytes exactos transferidos, o estás verificando una cadena de bytes que cambió hace dos minutos.

## Lo que acabas de construir

Cinco primitivas, cada una una herramienta de criptografía completa y funcional: viaje de ida y vuelta simétrico Fernet, derivación contraseña→clave con una sal, cifrado de archivos que restaura byte por byte, entrega de clave de sesión envuelta con RSA, y firma de clave privada con fallo ruidoso ante la alteración. El hilo conductor es arquitectura, no matemática: autentica tu texto cifrado, sala cada derivación, nunca almacenes una clave junto a lo que bloquea, envuelve material de clave pequeño en RSA mientras Fernet lleva los payloads, y siempre verifica los bytes frente a ti.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/encryption-toolkit/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/encryption-toolkit) en el repositorio del curso tiene los scripts completos (simétrico, claves, viaje de ida y vuelta de archivos, híbrido, firma/verificación) juntos. O abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- La entrega híbrida es un keystore a distancia: genera un `key.json` por entorno, guarda la clave privada RSA por separado, y descifra una config en el momento en que la app arranca. Esa es una v1 de producción de 40 líneas del archivo que pidió el equipo.
- Agrega **persistencia PEM** del par del Paso 4: `private_bytes(PublishingFormat.PKCS8, NoEncryption())` y `public_bytes(...)` a `private.pem`/`public.pem`, luego cárgalos de vuelta con `load_pem_private_key` — el puente de una demo en memoria a archivos en disco.
- **Rota el keystore**: re-cifra `secret.txt` con una clave Fernet nueva y una sal nueva, conserva el `.enc` viejo hasta que todo lector esté en la clave nueva, y registra la rotación. La rotación es la operación que la seguridad de producción realmente ejecuta a diario.
- Para una bóveda genuinamente segura, exige la contraseña *en tiempo de ejecución* (nunca la fijes en el código) y alimenta `derive_key` en las funciones de archivo del Paso 3 — las dos mitades finalmente se unen.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓