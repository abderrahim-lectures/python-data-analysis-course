---
title: "Gestor de Contraseñas"
description: "Genera, almacena y audita contraseñas con detección de brechas y uso compartido en equipo."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["security", "cryptography", "cli", "hashing"]
xpReward: 50
learningObjectives:
  - Genera contraseñas aleatorias seguras criptográficamente con conjuntos de caracteres personalizables
  - Calcula la entropía de la contraseña y asigna etiquetas de fortaleza
  - Verifica contraseñas contra la base de datos de filtraciones Have I Been Pwned usando k-anonimato
  - Almacena y recupera credenciales en un archivo de bóveda cifrado con AES
  - Construye una interfaz de línea de comandos con argparse
  - Rastrea la antigüedad de las contraseñas y marca las entradas vencidas
  - Genera informes de terminal con formato y colores
prerequisites:
  - Basic Python strings and functions
  - Understanding of lists and loops
  - Familiarity with pip/uv for installing packages
---

# Gestor de Contraseñas

Reutilizas la misma contraseña en todas partes porque inventar una nueva cada vez es tedioso. En este proyecto construirás una herramienta que hace la parte tediosa por ti: genera contraseñas fuertes, mide lo difíciles que son de descifrar, comprueba si ya han aparecido en una brecha de datos y las almacena en una bóveda cifrada que puedes desbloquear con una contraseña maestra.

Este proyecto solo asume conceptos básicos de nivel Python 101 — funciones, listas, diccionarios, bucles y formato de cadenas. Sin frameworks, sin bases de datos, sin servicios en la nube. Todo lo que necesitas proviene de la biblioteca estándar más un pequeño paquete de cifrado.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Generar contraseñas criptográficamente seguras con conjuntos de caracteres personalizables usando el módulo `secrets`.
2. Analizar la fortaleza de las contraseñas calculando la entropía — la medida matemática de la imprevisibilidad.
3. Comprobar contraseñas contra la base de datos de brechas Have I Been Pwned sin enviar nunca la contraseña completa (k-anonymity).
4. Construir una bóveda cifrada que almacena credenciales protegidas por una contraseña maestra usando AES-256.
5. Crear una interfaz CLI con `argparse` para que la herramienta funcione desde la línea de comandos.
6. Añadir un rastreador de caducidad de contraseñas que marca las entradas con más de 90 días.
7. Pulir la salida con formato de terminal de colores y un informe de resumen.

## Dónde ejecutar esto

- **Localmente con `uv` (recomendado).** Este proyecto necesita un paquete de terceros (`cryptography`) para el cifrado — un buen candidato para ejecutar Python en tu propia máquina. La sección Configuración abajo lo recorre.
- **Playground de JupyterLite.** Pega los bloques de código en celdas y ejecútalos en el navegador. El paso de verificación de brechas necesita una conexión de red; el paso de la bóveda crea archivos en el almacenamiento efímero del navegador.
- **Google Colab.** Haz clic en la insignia de Colab en la página del proyecto para ejecutarlo en un notebook en la nube. Ten en cuenta que los archivos de la bóveda creados en Colab no sobreviven entre sesiones.

## Configuración

`uv` es una sola herramienta que reemplaza la cadena habitual de "instala Python, luego pip, luego un entorno virtual, luego paquetes" — gestiona versiones de Python y dependencias juntas.

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

Después configura el proyecto:

```bash
uv init password-generator
cd password-generator
uv add secrets hashlib cryptography httpx
```

El módulo `secrets` viene con Python y proporciona números aleatorios criptográficamente fuertes. El paquete `cryptography` proporciona el cifrado AES para la bóveda. El paquete `httpx` maneja las solicitudes HTTP a la API de verificación de brechas. El módulo `hashlib` (también integrado) calcula los hashes SHA-1 para la búsqueda de k-anonymity.

## Paso 1: Genera contraseñas seguras

El primer bloque de construcción: una función que produce una contraseña aleatoria con exactamente los tipos de caracteres que quieres. La idea clave es *qué* módulo aleatorio usar — el módulo `random` de Python está diseñado para simulaciones, no para seguridad. Es determinista si conoces la semilla. El módulo `secrets` usa la fuente aleatoria real del sistema operativo y es la elección correcta para cualquier cosa relacionada con la seguridad.

### 1.1 Construye el conjunto de caracteres

**👟 Pista inicial :** Importa `secrets` y `string`. Escribe una función `generate_password` que acepte argumentos de palabra clave que controlen qué tipos de caracteres incluir (`use_uppercase`, `use_lowercase`, `use_digits`, `use_symbols`). Empieza construyendo una cadena `charset` a partir de los tipos que el llamador quiera.

```python
import secrets
import string

SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?"

def generate_password(
    length: int = 16,
    use_uppercase: bool = True,
    use_lowercase: bool = True,
    use_digits: bool = True,
    use_symbols: bool = True,
) -> str:
    """Generate a cryptographically secure random password."""
    charset = ""
    required = []

    if use_lowercase:
        charset += string.ascii_lowercase
        required.append(secrets.choice(string.ascii_lowercase))
    if use_uppercase:
        charset += string.ascii_uppercase
        required.append(secrets.choice(string.ascii_uppercase))
    if use_digits:
        charset += string.digits
        required.append(secrets.choice(string.digits))
    if use_symbols:
        charset += SYMBOLS
        required.append(secrets.choice(SYMBOLS))

    if not charset:
        raise ValueError("At least one character type must be selected")

    remaining = length - len(required)
    password_chars = required + [secrets.choice(charset) for _ in range(remaining)]

    # Shuffle so required characters are not clustered at the start
    secrets.SystemRandom().shuffle(password_chars)
    return "".join(password_chars)
```

El truco es la lista `required`: elegimos un carácter de cada tipo habilitado *primero*, luego llenamos el resto de la contraseña desde el conjunto completo. Esto garantiza que cada tipo solicitado aparezca al menos una vez. Después, `SystemRandom().shuffle` mezcla las posiciones para que la letra minúscula que garantizaste no sea siempre el carácter cero.

**🎯 Resultado esperado :** Genera algunos ejemplos e inspecciónalos:

```python
for i in range(3):
    pw = generate_password(length=20)
    print(f"  {pw}")
```

```
  k7G!mP2xQ#nR9wL@jT4f
  aB3$vN8&kD5*pY1!mW6h
  Rj4#Xp7!cF2@nM9&wL5s
```

Cada salida debería tener 20 caracteres y contener al menos una minúscula, una mayúscula, un dígito y un símbolo.

### 1.2 Verifica las garantías

**👟 Pista inicial :** Escribe una comprobación rápida que afirme que cada tipo de carácter está presente en la contraseña generada. Es una comprobación de cordura, no código de producción — solo confirma que tu lógica `required` funciona.

```python
def verify_password(pw: str) -> bool:
    """Check that a password contains at least one of each type."""
    checks = [
        any(c in string.ascii_lowercase for c in pw),
        any(c in string.ascii_uppercase for c in pw),
        any(c in string.digits for c in pw),
        any(c in SYMBOLS for c in pw),
    ]
    return all(checks)

# Generate 100 passwords and verify each one
for _ in range(100):
    pw = generate_password(length=16)
    assert verify_password(pw), f"Failed for: {pw}"
print("All 100 passwords passed verification.")
```

**🩹 Si sale mal :** Si falla una afirmación, el conjunto de tipos de caracteres probablemente está vacío para uno de los tipos. Comprueba que los bloques `if use_*` añadan cada uno a `charset` y a `required`. Si obtienes `ValueError: At least one character type must be selected`, los cuatro indicadores están en `False` — pasa `use_lowercase=True` como mínimo.

### 1.3 Confirma la corrección

**✅ Lista de verificación**

- `generate_password(length=20)` devuelve una cadena exactamente de 20 caracteres.
- Cada contraseña generada contiene al menos una minúscula, una mayúscula, un dígito y un símbolo.
- Generar 100 contraseñas en un bucle produce 100 resultados distintos (sin repeticiones).
- Pasar `use_symbols=False` produce contraseñas sin símbolos.
- Pasar `length=8` con todos los tipos habilitados devuelve una cadena de 8 caracteres.

**🤔 Pregunta(s) socrática(s) :** Si reemplazaras `secrets.choice` por `random.choice` en toda esta función, ¿la salida *parecería* diferente a un ojo humano? ¿Y a alguien que conociera la semilla? ¿Por qué importa esa distinción para las contraseñas?

## Paso 2: Analiza la fortaleza de la contraseña

Una cadena aleatoria solo es tan fuerte como el conjunto del que se obtuvo. La medida matemática es la **entropía** — el número de bits de información que un atacante necesitaría para adivinar la contraseña. Una contraseña obtenida de un conjunto de 70 caracteres, de 16 caracteres de largo, tiene log2(70^16) ≈ 97.4 bits de entropía. Ese es un número útil porque se traduce directamente en cuántos intentos necesita un atacante de fuerza bruta.

### 2.1 Calcula la entropía

**👟 Pista inicial :** Escribe `calculate_entropy(password)` que determine qué conjuntos de caracteres están presentes (minúsculas, mayúsculas, dígitos, símbolos), sume sus tamaños en un `charset_size` y devuelva `len(password) * math.log2(charset_size)`.

```python
import math

def calculate_entropy(password: str) -> float:
    """Calculate the entropy of a password in bits."""
    charset_size = 0
    if any(c in string.ascii_lowercase for c in password):
        charset_size += 26
    if any(c in string.ascii_uppercase for c in password):
        charset_size += 26
    if any(c in string.digits for c in password):
        charset_size += 10
    if any(c in SYMBOLS for c in password):
        charset_size += 30

    if charset_size == 0:
        return 0.0

    return len(password) * math.log2(charset_size)
```

**🎯 Resultado esperado :** Prueba algunos casos conocidos:

```python
print(calculate_entropy("abc"))          # short, lowercase only
print(calculate_entropy("password123"))  # common pattern
print(calculate_entropy(generate_password(16)))  # random, full pool
```

```
15.1
33.2
97.4
```

La contraseña aleatoria de 16 caracteres puntúa alrededor de 97 bits — muy por encima del umbral de 80 bits que la mayoría de las guías de seguridad consideran "muy fuerte".

### 2.2 Mapea la entropía a etiquetas legibles

Los números son precisos pero no intuitivos. Una función `strength_label` convierte la entropía en algo sobre lo que una persona puede actuar.

```python
def strength_label(entropy: float) -> str:
    """Return a human-readable strength label."""
    if entropy < 28:
        return "Very Weak"
    elif entropy < 36:
        return "Weak"
    elif entropy < 60:
        return "Moderate"
    elif entropy < 80:
        return "Strong"
    else:
        return "Very Strong"
```

### 2.3 Imprime una barra de fortaleza visual

Combina todo en una función `analyze_password` que imprima un informe formateado.

```python
def analyze_password(password: str) -> dict:
    """Full strength analysis of a password."""
    entropy = calculate_entropy(password)
    label = strength_label(entropy)
    bar_len = min(int(entropy / 4), 30)
    bar = "\u2588" * bar_len + "\u2591" * (30 - bar_len)

    print(f"\n  Password: {'*' * len(password)}")
    print(f"  Length:    {len(password)} characters")
    print(f"  Entropy:   {entropy:.1f} bits")
    print(f"  Strength:  [{bar}] {label}")

    return {"password": password, "entropy": entropy, "label": label}
```

**🎯 Resultado esperado :**

```python
for pw in ["abc", "password123", generate_password(16), generate_password(24)]:
    analyze_password(pw)
```

```
  Password: ***
  Length:    3 characters
  Entropy:   15.1 bits
  Strength:  [███░░░░░░░░░░░░░░░░░░░░░░░░░░░] Very Weak

  Password: ***********
  Length:    11 characters
  Entropy:   33.2 bits
  Strength:  [████████░░░░░░░░░░░░░░░░░░░░░░] Weak

  Password: ****************
  Length:    16 characters
  Entropy:   97.4 bits
  Strength:  [██████████████████████████████] Very Strong

  Password: ************************
  Length:    24 characters
  Entropy:   146.1 bits
  Strength:  [██████████████████████████████] Very Strong
```

La barra se llena proporcionalmente: un bloque por ~4 bits de entropía, con tope de 30 bloques para el ancho de la barra.

**🩹 Si sale mal :** Si una contraseña claramente aleatoria muestra "Weak", comprueba que `calculate_entropy` detecte los cuatro conjuntos de caracteres. Un bug común es codificar la cadena de símbolos en lugar de reutilizar la constante `SYMBOLS` — si la cadena codificada difiere aunque sea en un carácter, la comprobación de símbolos pasa por alto silenciosamente algunas contraseñas. Si `entropy` es `NaN`, el `charset_size` es cero, lo que significa que `calculate_entropy` no encontró ninguno de los cuatro conjuntos — asegúrate de que la contraseña no esté vacía.

### 2.4 Verifica el análisis

**✅ Lista de verificación**

- `"abc"` (3 caracteres, solo minúsculas) se etiqueta como "Very Weak" con entropía menor de 20 bits.
- `"password123"` (patrón común) se etiqueta como "Weak" a pesar de tener 11 caracteres, porque su conjunto de caracteres es pequeño.
- Una contraseña aleatoria de 16 caracteres del Paso 1 se etiqueta como "Very Strong" con entropía superior a 95 bits.
- Una contraseña aleatoria de 24 caracteres muestra mayor entropía que la versión de 16.
- La visualización de la barra se llena más para contraseñas más fuertes.

**🤔 Pregunta(s) socrática(s) :** ¿Por qué `"password123"` tiene entropía baja a pesar de tener 11 caracteres? Si un atacante sabe que la gente tiende a elegir palabras del diccionario más dígitos, ¿cómo cambia eso el tamaño *efectivo* del conjunto comparado con lo que asume `calculate_entropy`?

## Paso 3: Comprueba contra bases de datos de brechas

Incluso una contraseña de alta entropía es inútil si ya apareció en una brecha de datos. La API Have I Been Pwned (HIBP) te permite comprobarlo — pero nunca deberías enviar tu contraseña real a un servidor de terceros. La solución es la **k-anonymity**: envías solo los primeros 5 caracteres del hash SHA-1 de la contraseña y recibes una lista de sufijos de hash coincidentes. Tu contraseña completa nunca abandona tu máquina.

### 3.1 Entiende el protocolo de k-anonymity

El flujo funciona así:

1. Hashea la contraseña con SHA-1: `SHA1("password123") = "CBFDAC6008F9CAB4083784CBD1874F76618D2A97"`
2. Envía los primeros 5 caracteres (`CBFDA`) a `https://api.pwnedpasswords.com/range/CBFDA`
3. La API responde con miles de líneas, cada una siendo un sufijo de hash y un conteo: `C6008F9CAB4083784CBD1874F76618D2A97:42`
4. Busca en la respuesta tu sufijo de hash completo (`C6008F9CAB4083784CBD1874F76618D2A97`). Si se encuentra, tu contraseña ha estado en `42` brechas.
5. El servidor conoce solo un prefijo de 5 caracteres que coincide con millones de contraseñas posibles — no puede determinar qué contraseña específica estás comprobando.

### 3.2 Implementa el verificador de brechas

**👟 Pista inicial :** Necesitas `hashlib` (integrado) para SHA-1 y `httpx` para la solicitud HTTP. El cuerpo de la respuesta es texto plano con un sufijo de hash por línea.

```python
import hashlib
import httpx

def check_breach(password: str) -> tuple[bool, int]:
    """Check if a password appears in known breaches using HIBP k-anonymity."""
    sha1 = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]

    try:
        response = httpx.get(
            f"https://api.pwnedpasswords.com/range/{prefix}",
            timeout=10,
        )
        response.raise_for_status()

        for line in response.text.splitlines():
            hash_suffix, count = line.split(":")
            if hash_suffix == suffix:
                return True, int(count)

        return False, 0
    except Exception as e:
        print(f"Breach check failed: {e}")
        return False, 0
```

**🎯 Resultado esperado :** Prueba con una contraseña que sepas que ha sido comprometida, y una que acabas de generar:

```python
is_breached, count = check_breach("password123")
if is_breached:
    print(f"This password appeared in {count:,} breaches. Do not use it.")
else:
    print("This password was not found in known breaches.")
```

```
This password appeared in 3,862,431 breaches. Do not use it.
```

```python
fresh = generate_password(20)
is_breached, count = check_breach(fresh)
print(f"Fresh password: breached={is_breached}, count={count}")
```

```
Fresh password: breached=False, count=0
```

Una contraseña aleatoria recién generada nunca debería aparecer en la base de datos de brechas. Si lo hace, la fuente aleatoria está rota — vuelve al Paso 1 y confirma que estás usando `secrets`, no `random`.

**🩹 Si sale mal :** Si obtienes `Breach check failed: ...`, tu red podría estar bloqueando la solicitud o la API está temporalmente caída — la función devuelve `False, 0` en caso de fallo para que la herramienta no se bloquee. Si obtienes `ConnectionError`, comprueba tu conexión a internet. Si obtienes `403`, la API limita la velocidad de las solicitudes — espera un momento e inténtalo de nuevo. Si una contraseña de brecha conocida como `"password123"` vuelve como no comprometida, comprueba que el hash SHA-1 esté en mayúsculas y que la comparación del sufijo sea exacta (sin espacios en blanco extra, sin necesidad de `.strip()` en el lado derecho del `split(":")`).

### 3.3 Verifica el verificador de brechas

**✅ Lista de verificación**

- `"password123"` devuelve `True` con un conteo en los millones.
- `"123456"` devuelve `True` con un conteo muy alto.
- Una contraseña recién generada del Paso 1 devuelve `False, 0`.
- La función maneja errores de red con elegancia — sin traceback, solo una advertencia y `False, 0`.
- La contraseña completa nunca aparece en ninguna declaración print ni registro.

**🤔 Pregunta(s) socrática(s) :** La API devuelve resultados para millones de hashes de contraseñas que comparten el mismo prefijo de 5 caracteres. Si el prefijo de tu contraseña es `CBFDA`, ¿de cuántas *otras* contraseñas le estás filtrando información al servidor al hacer la solicitud? ¿Por qué es aceptable en este diseño?

## Paso 4: Construye una bóveda cifrada

Generar contraseñas fuertes es solo la mitad del valor — también necesitas almacenarlas en algún lugar. Escribirlas en un archivo de texto plano anula el propósito. En su lugar, cifraremos la bóveda con **AES-256** usando la implementación Fernet del paquete `cryptography`. La bóveda se descifra en tiempo de ejecución con una contraseña maestra que escribes una vez.

### 4.1 Deriva una clave de cifrado de la contraseña maestra

Fernet necesita una clave de 32 bytes codificada en base64 apta para URLs. La derivamos de la contraseña maestra usando SHA-256 (en producción usarías PBKDF2 o argon2 para una derivación de clave más lenta, pero esto demuestra el flujo de trabajo).

**👟 Pista inicial :** Hashea la contraseña maestra con SHA-256, luego codifica el resultado en base64.

```python
from cryptography.fernet import Fernet
import base64

def derive_key(master_password: str) -> bytes:
    """Derive an AES key from a master password."""
    key = hashlib.sha256(master_password.encode()).digest()
    return base64.urlsafe_b64encode(key)
```

### 4.2 Guarda la bóveda

**👟 Pista inicial :** Escribe `save_vault(vault, master_password, filepath)` que convierta el dict de la bóveda en una cadena, lo cifre con Fernet y escriba el texto cifrado en disco.

```python
def save_vault(vault: dict, master_password: str, filepath: str = "vault.enc"):
    """Encrypt and save the vault to disk."""
    key = derive_key(master_password)
    f = Fernet(key)
    data = str(vault).encode()
    encrypted = f.encrypt(data)

    with open(filepath, "wb") as file:
        file.write(encrypted)
    print(f"Vault saved to {filepath}")
```

### 4.3 Carga la bóveda

**👟 Pista inicial :** Escribe `load_vault(master_password, filepath)` que lea el texto cifrado, lo descifre y convierta la cadena de vuelta a un dict. Maneja los dos casos de fallo: archivo no encontrado (empezar desde cero) y contraseña incorrecta (descifrado corrupto).

```python
def load_vault(master_password: str, filepath: str = "vault.enc") -> dict:
    """Load and decrypt the vault from disk."""
    key = derive_key(master_password)
    f = Fernet(key)

    try:
        with open(filepath, "rb") as file:
            encrypted = file.read()
        decrypted = f.decrypt(encrypted)
        return eval(decrypted.decode())
    except FileNotFoundError:
        print("No vault file found. Starting fresh.")
        return {}
    except Exception:
        print("Wrong master password or corrupted vault.")
        return {}
```

**🎯 Resultado esperado :** Crea una bóveda con dos entradas, guárdala, recárgala y verifica:

```python
vault = {
    "github": {"username": "alice", "password": generate_password(20)},
    "email": {"username": "alice@example.com", "password": generate_password(20)},
}

save_vault(vault, "my-master-password")
loaded = load_vault("my-master-password")
print(f"Vault loaded with {len(loaded)} entries.")
for service, creds in loaded.items():
    print(f"  {service}: {creds['username']}")
```

```
Vault saved to vault.enc
Vault loaded with 2 entries.
  github: alice
  email: alice@example.com
```

Ahora prueba a cargar con la contraseña incorrecta:

```python
loaded_bad = load_vault("wrong-password")
```

```
Wrong master password or corrupted vault.
```

La contraseña incorrecta produce un dict vacío y un mensaje de error claro — sin traceback, sin bloqueo.

**🩹 Si sale mal :** Si obtienes `InvalidToken` con un traceback en lugar del mensaje amigable, el bloque `except Exception` no está capturando el error de Fernet. Comprueba que `from cryptography.fernet import Fernet` esté en la parte superior de tu archivo — si falta la importación, `Fernet` no está definido y el bloque `except` falla antes de poder manejar el error. Si el archivo de la bóveda siempre está vacío tras recargar, la conversión `str(vault)` podría estar produciendo algo que `eval()` no puede analizar — comprueba que el dict de la bóveda contenga solo cadenas, no objetos ni funciones.

:::warning[eval() en producción es peligroso]
`eval()` ejecuta código Python arbitrario. Esto es aceptable para un proyecto de aprendizaje personal donde controlas el archivo de la bóveda, pero en producción deberías usar `json.loads()` en lugar de `eval()` para la deserialización. El formato de la bóveda necesitaría usar tipos compatibles con JSON (sin tuplas, sin conjuntos, sin objetos personalizados).
:::

### 4.4 Verifica la bóveda

**✅ Lista de verificación**

- Guardar una bóveda con dos entradas crea un archivo `vault.enc` en disco.
- Cargar con la contraseña maestra correcta devuelve ambas entradas con sus nombres de usuario y contraseñas intactos.
- Cargar con una contraseña maestra incorrecta imprime un error y devuelve un dict vacío.
- Cargar cuando no existe ningún archivo de bóveda imprime un mensaje y devuelve un dict vacío.
- El contenido del archivo `vault.enc` es texto cifrado binario, no texto legible.

**🤔 Pregunta(s) socrática(s) :** Si alguien roba tu archivo `vault.enc`, ¿cuántos intentos necesitaría para descifrarlo? ¿Cómo cambia ese número si saben que tu contraseña maestra es solo 8 letras minúsculas en lugar de una contraseña aleatoria de 20 caracteres del Paso 1?

## Paso 5: Interfaz CLI

La herramienta funciona en un shell de Python, pero las herramientas reales viven en la línea de comandos. Lo envolveremos todo en `argparse` para que los usuarios puedan generar, comprobar, almacenar y listar contraseñas sin abrir Python.

### 5.1 Configura argparse

**👟 Pista inicial :** Usa subcomandos con `add_subparsers` — uno para `generate`, uno para `check`, uno para `store`, uno para `list`. Cada subcomando obtiene sus propias banderas.

```python
import argparse
import sys

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Password Generator — create, analyze, and store secure passwords."
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # generate
    gen = sub.add_parser("generate", help="Generate a new password")
    gen.add_argument("-l", "--length", type=int, default=16, help="Password length (default: 16)")
    gen.add_argument("-n", "--count", type=int, default=1, help="Number of passwords to generate")
    gen.add_argument("--no-symbols", action="store_true", help="Exclude symbols")
    gen.add_argument("--no-uppercase", action="store_true", help="Exclude uppercase letters")
    gen.add_argument("--no-digits", action="store_true", help="Exclude digits")

    # check
    chk = sub.add_parser("check", help="Check password strength and breach status")
    chk.add_argument("password", nargs="?", help="Password to check (will prompt if omitted)")

    # store
    sto = sub.add_parser("store", help="Store a credential in the encrypted vault")
    sto.add_argument("service", help="Service name (e.g. github)")
    sto.add_argument("-u", "--username", required=True, help="Username or email")
    sto.add_argument("-p", "--password", help="Password (will generate if omitted)")
    sto.add_argument("--master", required=True, help="Master password for the vault")

    # list
    lst = sub.add_parser("list", help="List all entries in the vault")
    lst.add_argument("--master", required=True, help="Master password for the vault")

    return parser
```

### 5.2 Conecta los comandos

**👟 Pista inicial :** Escribe una función `main()` que analice los argumentos y despache a las funciones apropiadas de los Pasos 1-4.

```python
def main():
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "generate":
        for _ in range(args.count):
            pw = generate_password(
                length=args.length,
                use_uppercase=not args.no_uppercase,
                use_symbols=not args.no_symbols,
                use_digits=not args.no_digits,
            )
            print(pw)

    elif args.command == "check":
        password = args.password
        if not password:
            password = input("Enter password to check: ").strip()
        analyze_password(password)
        is_breached, count = check_breach(password)
        if is_breached:
            print(f"  WARNING: Found in {count:,} breaches!")
        else:
            print("  Not found in known breaches.")

    elif args.command == "store":
        vault = load_vault(args.master)
        pw = args.password or generate_password(20)
        vault[args.service] = {"username": args.username, "password": pw}
        save_vault(vault, args.master)
        print(f"Stored {args.service} for {args.username}.")

    elif args.command == "list":
        vault = load_vault(args.master)
        if not vault:
            print("Vault is empty.")
        else:
            print(f"\n  {'Service':<15} {'Username':<25} {'Password':<20}")
            print(f"  {'-'*15} {'-'*25} {'-'*20}")
            for service, creds in vault.items():
                print(f"  {service:<15} {creds['username']:<25} {creds['password']:<20}")

if __name__ == "__main__":
    main()
```

**🎯 Resultado esperado :** Ejecuta desde la terminal:

```bash
python password_generator.py generate --length 20 --count 3
```

```
k7G!mP2xQ#nR9wL@jT4f
aB3$vN8&kD5*pY1!mW6h
Rj4#Xp7!cF2@nM9&wL5s
```

```bash
python password_generator.py check "password123"
```

```
  Password: ***********
  Length:    11 characters
  Entropy:   33.2 bits
  Strength:  [████████░░░░░░░░░░░░░░░░░░░░░░] Weak
  WARNING: Found in 3,862,431 breaches!
```

```bash
python password_generator.py store github -u alice --master "my-master-password"
python password_generator.py list --master "my-master-password"
```

```
  Service         Username                  Password
  --------------- ------------------------- --------------------
  github          alice                     k7G!mP2xQ#nR9wL@jT4f
```

**🩹 Si sale mal :** Si obtienes `error: the following arguments are required`, olvidaste pasar una bandera obligatoria (como `--master` o `-u`). Si obtienes `unrecognized arguments`, comprueba el orden del subcomando — `generate` viene antes de las banderas, no después. Si `generate` no imprime nada, `--count` podría estar puesto a 0. Si `list` muestra texto corrupto, tu bóveda se guardó con el formato `str()` de una versión diferente de Python — regenérala.

### 5.3 Verifica el CLI

**✅ Lista de verificación**

- `generate --length 20 --count 3` imprime tres contraseñas de 20 caracteres, una por línea.
- `generate --no-symbols` produce contraseñas sin símbolos.
- `check "password123"` muestra "Weak" y "Found in ... breaches."
- `store github -u alice --master X` crea o actualiza el archivo de la bóveda.
- `list --master X` muestra todas las entradas almacenadas en una tabla formateada.
- Ejecutar `list` con la contraseña maestra incorrecta imprime un error, no un traceback.

**🤔 Pregunta(s) socrática(s) :** ¿Por qué `generate` imprime a stdout en lugar de guardar en un archivo? ¿Qué ventaja le da eso a una herramienta CLI comparada con escribir siempre en disco?

## Paso 6: Rastreador de caducidad de contraseñas

Las contraseñas envejecen. Una contraseña generada hace 90 días podría estar comprometida ahora. Añadiendo una marca de tiempo a cada entrada de la bóveda, podemos marcar las contraseñas antiguas y recordarle al usuario que las rote.

### 6.1 Añade marcas de tiempo a las entradas de la bóveda

**👟 Pista inicial :** Al almacenar una credencial, incluye una clave `"created_at"` con la marca de tiempo ISO actual. Al listar entradas, compara la antigüedad contra un umbral.

```python
from datetime import datetime, timedelta

MAX_PASSWORD_AGE_DAYS = 90

def store_credential(vault: dict, service: str, username: str, password: str) -> dict:
    """Add a credential entry with a creation timestamp."""
    vault[service] = {
        "username": username,
        "password": password,
        "created_at": datetime.now().isoformat(),
    }
    return vault
```

### 6.2 Comprueba contraseñas caducadas

**👟 Pista inicial :** Escribe `check_expiry(vault, max_age_days)` que devuelva una lista de tuplas `(service, created_at, days_old)` para las entradas más antiguas que el umbral.

```python
def check_expiry(vault: dict, max_age_days: int = MAX_PASSWORD_AGE_DAYS) -> list[tuple[str, str, int]]:
    """Find passwords older than max_age_days."""
    now = datetime.now()
    expired = []

    for service, creds in vault.items():
        created_str = creds.get("created_at")
        if not created_str:
            continue
        created = datetime.fromisoformat(created_str)
        days_old = (now - created).days
        if days_old > max_age_days:
            expired.append((service, created_str, days_old))

    return expired
```

### 6.3 Muestra la caducidad en la vista de lista

**👟 Pista inicial :** Actualiza el comando `list` para mostrar la antigüedad de cada entrada y marcar las caducadas con un símbolo de advertencia.

```python
def list_vault_with_expiry(vault: dict):
    """List vault entries with password age indicators."""
    now = datetime.now()

    print(f"\n  {'Service':<15} {'Username':<20} {'Age':<10} {'Status'}")
    print(f"  {'-'*15} {'-'*20} {'-'*10} {'-'*20}")

    for service, creds in vault.items():
        username = creds["username"]
        created_str = creds.get("created_at")

        if created_str:
            created = datetime.fromisoformat(created_str)
            days_old = (now - created).days
            age_str = f"{days_old}d"
            status = "EXPIRED" if days_old > MAX_PASSWORD_AGE_DAYS else "OK"
        else:
            age_str = "unknown"
            status = "no timestamp"

        marker = " [!]" if status == "EXPIRED" else ""
        print(f"  {service:<15} {username:<20} {age_str:<10} {status}{marker}")

    expired = check_expiry(vault)
    if expired:
        print(f"\n  {len(expired)} password(s) older than {MAX_PASSWORD_AGE_DAYS} days. Rotate them.")
```

**🎯 Resultado esperado :**

```
  Service         Username             Age        Status
  --------------- -------------------- ---------- --------------------
  github          alice                95d        EXPIRED [!]
  email           alice@example.com    12d        OK

  1 password(s) older than 90 days. Rotate them.
```

**🩹 Si sale mal :** Si todas las entradas muestran antigüedad "unknown", la clave `created_at` no se añadió durante el almacenamiento — vuelve a la función `store_credential` y asegúrate de que se esté llamando en lugar de construir el dict manualmente. Si el cálculo de antigüedad parece incorrecto, comprueba que `datetime.now()` y `datetime.fromisoformat()` usen la misma conciencia de zona horaria (ambos naive, o ambos aware — no los mezcles).

### 6.4 Verifica el rastreador de caducidad

**✅ Lista de verificación**

- Una entrada recién almacenada muestra estado "OK" con antigüedad de 0d.
- Una entrada con `created_at` puesto a hace 100 días muestra estado "EXPIRED [!]".
- Una entrada sin clave `created_at` muestra antigüedad "unknown", no un bloqueo.
- La línea de resumen al final cuenta solo las entradas caducadas.

**🤔 Pregunta(s) socrática(s) :** ¿Qué pasa si el usuario retrocede su reloj del sistema 100 días después de almacenar una contraseña? ¿Seguiría funcionando correctamente la comprobación de caducidad? ¿Qué problema del mundo real revela esto sobre las comprobaciones de seguridad basadas en marcas de tiempo del lado del cliente?

## Paso 7: Pule la salida

El texto crudo es funcional pero difícil de escanear. Añadir color a la salida de la terminal hace que las contraseñas fuertes frente a débiles, comprometidas frente a limpias, y caducadas frente a frescas sean visualmente distintas de un vistazo.

### 7.1 Añade códigos de color ANSI

**👟 Pista inicial :** Define constantes de color usando secuencias de escape ANSI. Envuélvelas en texto solo para la salida de la terminal — no escribas códigos de escape en archivos.

```python
class Color:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"

def colored(text: str, color: str) -> str:
    """Wrap text in an ANSI color code."""
    return f"{color}{text}{Color.RESET}"
```

### 7.2 Colorea la barra de fortaleza

**👟 Pista inicial :** Actualiza `analyze_password` para colorear la barra según la etiqueta de fortaleza — rojo para débil, amarillo para moderada, verde para fuerte.

```python
def analyze_password_colored(password: str) -> dict:
    """Full strength analysis with colored output."""
    entropy = calculate_entropy(password)
    label = strength_label(entropy)
    bar_len = min(int(entropy / 4), 30)

    if entropy < 36:
        bar_color = Color.RED
    elif entropy < 60:
        bar_color = Color.YELLOW
    else:
        bar_color = Color.GREEN

    filled = colored("\u2588" * bar_len, bar_color)
    empty = colored("\u2591" * (30 - bar_len), Color.DIM)

    print(f"\n  {colored('Password:', Color.BOLD)} {'*' * len(password)}")
    print(f"  {colored('Length:', Color.BOLD)}    {len(password)} characters")
    print(f"  {colored('Entropy:', Color.BOLD)}   {entropy:.1f} bits")
    print(f"  {colored('Strength:', Color.BOLD)} [{filled}{empty}] {label}")

    return {"password": password, "entropy": entropy, "label": label}
```

### 7.3 Colorea la comprobación de brechas

```python
def check_breach_colored(password: str) -> tuple[bool, int]:
    """Check breach status with colored output."""
    is_breached, count = check_breach(password)
    if is_breached:
        print(colored(f"  WARNING: Found in {count:,} breaches!", Color.RED))
    else:
        print(colored("  Not found in known breaches.", Color.GREEN))
    return is_breached, count
```

### 7.4 Construye un informe de resumen

**👟 Pista inicial :** Escribe `print_report` que tome una lista de contraseñas, analice cada una e imprima una tabla de resumen con conteos por nivel de fortaleza y entropía promedio.

```python
def print_report(passwords: list[str]):
    """Print a formatted strength report for a list of passwords."""
    results = [analyze_password_colored(pw) for pw in passwords]

    # Summary
    labels = {}
    for r in results:
        labels[r["label"]] = labels.get(r["label"], 0) + 1

    avg_entropy = sum(r["entropy"] for r in results) / len(results) if results else 0

    print(f"\n  {colored('Summary', Color.BOLD)}")
    print(f"  {'─' * 40}")
    for label in ["Very Weak", "Weak", "Moderate", "Strong", "Very Strong"]:
        count = labels.get(label, 0)
        print(f"  {label:<15} {count}")
    print(f"  {'─' * 40}")
    print(f"  {'Avg entropy:':<15} {avg_entropy:.1f} bits")
    print(f"  {'Total:':<15} {len(results)}")
```

**🎯 Resultado esperado :**

```python
passwords = ["abc", "password123", generate_password(12), generate_password(16), generate_password(24)]
print_report(passwords)
```

```
  Password: ***
  Length:    3 characters
  Entropy:   15.1 bits
  Strength:  [███░░░░░░░░░░░░░░░░░░░░░░░░░░░] Very Weak
  ...
  Summary
  ────────────────────────────────────────
  Very Weak      1
  Weak           1
  Strong         1
  Very Strong    2
  ────────────────────────────────────────
  Avg entropy:   72.3 bits
  Total:         5
```

**🩹 Si sale mal :** Si los colores no aparecen, tu terminal podría no soportar códigos ANSI — prueba con `export TERM=xterm-256color` antes de ejecutar. Si ves secuencias de escape crudas como `[91m` en la salida, los caracteres de escape no se están interpretando — asegúrate de usar `\033[` (el carácter ESC real), no la cadena literal barra-cero-tres-tres.

### 7.5 Verifica la salida pulida

**✅ Lista de verificación**

- La barra de fortaleza es roja para contraseñas débiles, amarilla para moderadas y verde para fuertes.
- La advertencia de brecha es roja cuando una contraseña se encuentra en brechas.
- La tabla de resumen muestra los conteos correctos para cada nivel de fortaleza.
- El cálculo de la entropía promedio es correcto.
- Ejecutar la herramienta en una terminal que soporte códigos ANSI muestra colores; redirigir a un archivo no incluye secuencias de escape.

**🤔 Pregunta(s) socrática(s) :** ¿Por qué la función `colored()` debería usarse solo para la salida de terminal y no para escribir archivos de registro? ¿Qué pasa si haces pipe de la salida coloreada a `less` o la rediriges a un archivo?

## ⚠️ Errores comunes

- **Usar `random` en lugar de `secrets`.** El módulo `random` es determinista y predecible. Para cualquier cosa relacionada con la seguridad — contraseñas, tokens, claves — usa siempre `secrets`. Esta es la decisión más importante de todo este proyecto.
- **Olvidar mezclar los caracteres requeridos.** Si añades los caracteres requeridos primero y luego llenas el resto, los primeros caracteres son siempre uno de cada tipo en un orden fijo. Un prefijo como "aB1!" es un patrón que los atacantes saben comprobar primero. Mezcla siempre.
- **Enviar la contraseña completa a la API de brechas.** El diseño de k-anonymity de HIBP existe específicamente para evitar esto. Solo los primeros 5 caracteres del hash SHA-1 deberían abandonar alguna vez tu máquina.
- **Usar `eval()` en código de producción.** `eval()` ejecuta Python arbitrario. Para un proyecto de aprendizaje personal es una forma rápida de deserializar la bóveda, pero en producción usa `json.loads()` con un formato de bóveda compatible con JSON.
- **Guardar la bóveda solo al salir.** Si el programa falla a mitad de sesión, se pierden los cambios sin guardar. Guarda después de cada mutación — la llamada a `save_vault` en `store` ya hace esto.
- **Mezclar datetime con y sin zona horaria.** `datetime.now()` devuelve un datetime naive (sin zona horaria). Si lo comparas contra uno aware de `datetime.now(timezone.utc)`, obtendrás un `TypeError`. Mantenlos consistentes.

## Lo que acabas de construir

Una herramienta completa de gestión de contraseñas en Python puro: generación de contraseñas criptográficamente seguras, análisis de fortaleza basado en entropía, detección de brechas contra una base de datos pública usando k-anonymity, una bóveda cifrada con AES-256, una interfaz de línea de comandos, seguimiento de caducidad de contraseñas y salida de terminal de colores. Cada pieza se construye sobre fundamentos de Python 101 — cadenas, listas, diccionarios, bucles, funciones — aplicados a un problema real que enfrentas todos los días.

Los patrones de seguridad aquí aplican mucho más allá de las contraseñas: la k-anonymity se usa en datos de salud y privacidad de ubicación, el cifrado AES es el estándar para datos en reposo, y el cálculo de entropía es la base de todas las métricas de fortaleza. Entender *por qué* funcionan (no solo cómo llamarlos) es lo que separa un script de una herramienta en la que puedes confiar.

## A dónde ir desde aquí

- **Usa un KDF real.** Reemplaza la derivación de clave SHA-256 por PBKDF2 (`cryptography.hazmat.primitives.kdf.pbkdf2`) o argon2 para resistencia a fuerza bruta. Un hash SHA-256 es rápido — un atacante puede probar miles de millones por segundo. PBKDF2 con 600,000 iteraciones lo ralentiza en un factor de 600,000.
- **Añade un comando de copia al portapapeles.** Un subcomando `copy` que ponga una contraseña en el portapapeles y la borre después de 30 segundos es más práctico que imprimir a stdout.
- **Implementa detección de reutilización de contraseñas.** Antes de almacenar una nueva credencial, comprueba si la contraseña ya aparece en otra entrada — una contraseña fuerte reutilizada sigue siendo un punto único de fallo.
- **Añade formato de bóveda JSON.** Migra de `eval()`/`str()` a `json.dumps()`/`json.loads()` para interoperabilidad y seguridad. JSON no soporta tuplas ni conjuntos de Python, pero la bóveda solo necesita cadenas.
- **Construye un comando `rotate`.** Genera una nueva contraseña para una entrada existente, actualiza la marca de tiempo y, opcionalmente, copia la nueva contraseña al portapapeles — todo en un comando.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
