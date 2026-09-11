---
title: 'Servidor MCP'
description: 'Construye un servidor MCP que exponga herramientas personalizadas para que Claude Code pueda usarlas en cualquier proyecto.'
difficulty: intermediate
estimatedMinutes: 120
learningObjectives:
  - Entender la arquitectura del Model Context Protocol (MCP)
  - Implementar herramientas MCP que Claude Code pueda invocar
  - Crear herramientas de lectura y escritura de archivos
  - Conectar el servidor MCP con Claude Desktop o Claude Code
  - Manejar autenticación y seguridad en herramientas MCP
prerequisites:
  - Python a nivel intermedio
  - Conocimiento básico de APIs y servidores
  - familiaridad con JSON y formato de mensajes
  - Claude Desktop o Claude Code instalado
---

- **Ejecútalo en el navegador.** Hay un cuaderno interactivo listo — ábrelo en Colab, Kaggle o Binder y sigue los pasos en orden.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-server/notebook.es.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-server/notebook.es.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmcp-server%2Fnotebook.es.ipynb)

## 🎯 Lo que harás

Vas a construir un servidor MCP (Model Context Protocol) que exponga herramientas personalizadas para Claude. Esto le permite a Claude interactuar con sistemas externos de forma segura y controlada.

**Objetivo principal:** Crear un servidor MCP funcional con herramientas que Claude pueda invocar para leer, escribir y manipular datos en tu sistema.

**Tu servidor podrá:**

- **Exponer herramientas** que Claude pueda invocar desde cualquier proyecto
- **Leer y escribir** archivos de forma segura
- **Validar parámetros** de entrada automáticamente
- **Manejar errores** de forma robusta
- **Conectar con Claude** Desktop o Claude Code

Pasos:

- Paso 1: Diseña la arquitectura del servidor MCP
- Paso 2: Implementa herramientas de lectura y escritura
- Paso 3: Conecta con Claude Code

Dónde ejecutar esto:

Trabaja desde la carpeta `projects/` de tu repo `pyda-course`.

## Configuración

1. Crea un entorno virtual:

```bash
cd projects/mcp-server
uv venv
source .venv/bin/activate
```

2. Instala las dependencias del SDK MCP:

```bash
uv pip install "mcp[cli]"
```

3. Verifica la instalación:

```bash
python -c "import mpc; print('MCP SDK listo')"
```

---

## Paso 1: Diseña la arquitectura del servidor MCP

Antes de escribir código, necesitas entender cómo funciona MCP y diseñar la estructura de tu servidor.

### 1.1 Entiende el protocolo MCP

MCP es un protocolo que permite a los modelos de lenguaje interactuar con herramientas externas a través de un servidor. El flujo básico es:

1. **Claude** envía una solicitud de herramienta al servidor MCP
2. **El servidor** valida los parámetros y ejecuta la herramienta
3. **El servidor** retorna el resultado a Claude
4. **Claude** usa el resultado para continuar su razonamiento

### 1.2 Crea la estructura del proyecto

```bash
mkdir -p tools config tests
```

### 1.3 Crea el archivo de configuración

Crea `config.py`:

```python
from pathlib import Path

BASE_DIR = Path(__file__).parent
TOOLS_DIR = BASE_DIR / "tools"
TESTS_DIR = BASE_DIR / "tests"

# Configuración del servidor
SERVER_NAME = "pyda-mcp-server"
SERVER_VERSION = "1.0.0"

# Configuración de seguridad
ALLOWED_DIRECTORIES = [
    Path.home() / "projects",
    Path.home() / "documents",
]
MAX_FILE_SIZE_MB = 10
BLOCKED_EXTENSIONS = [".exe", ".dll", ".so", ".dylib"]
```

### Verifica

- Los directorios se crean correctamente
- La configuración carga sin errores
- Las rutas son consistentes

### Checklist

- [ ] Estructura de directorios creada
- [ ] Configuración del servidor definida
- [ ] Directorios permitidos configurados
- [ ] Extensiones bloqueadas definidas

---

## Paso 2: Implementa herramientas de lectura y escritura

Ahora vamos a crear las herramientas que Claude podrá invocar.

### 2.1 Crea la herramienta de lectura de archivos

Crea `tools/file_tools.py`:

```python
from mcp.types import Tool, TextContent
from pathlib import Path
from config import ALLOWED_DIRECTORIES, MAX_FILE_SIZE_MB, BLOCKED_EXTENSIONS

async def read_file(path: str) -> list[TextContent]:
    """Lee el contenido de un archivo de forma segura."""
    file_path = Path(path).resolve()

    # Verificar que el archivo esté en un directorio permitido
    if not any(file_path.is_relative_to(d) for d in ALLOWED_DIRECTORIES):
        return [TextContent(type="text", text=f"Error: Acceso denegado a {path}")]

    # Verificar extensión
    if file_path.suffix in BLOCKED_EXTENSIONS:
        return [TextContent(type="text", text=f"Error: Extensión no permitida: {file_path.suffix}")]

    # Verificar tamaño
    if file_path.exists() and file_path.stat().st_size > MAX_FILE_SIZE_MB * 1024 * 1024:
        return [TextContent(type="text", text=f"Error: Archivo demasiado grande (máx {MAX_FILE_SIZE_MB}MB)")]

    try:
        content = file_path.read_text(encoding="utf-8")
        return [TextContent(type="text", text=content)]
    except FileNotFoundError:
        return [TextContent(type="text", text=f"Error: Archivo no encontrado: {path}")]
    except PermissionError:
        return [TextContent(type="text", text=f"Error: Sin permisos para leer: {path}")]
    except UnicodeDecodeError:
        return [TextContent(type="text", text=f"Error: No se pudo decodificar (encoding no soportado)")]

async def write_file(path: str, content: str) -> list[TextContent]:
    """Escribe contenido en un archivo de forma segura."""
    file_path = Path(path).resolve()

    # Verificar directorio permitido
    if not any(file_path.is_relative_to(d) for d in ALLOWED_DIRECTORIES):
        return [TextContent(type="text", text=f"Error: Acceso denegado a {path}")]

    # Verificar extensión
    if file_path.suffix in BLOCKED_EXTENSIONS:
        return [TextContent(type="text", text=f"Error: Extensión no permitida: {file_path.suffix}")]

    try:
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(content, encoding="utf-8")
        return [TextContent(type="text", text=f"Archivo escrito exitosamente: {path}")]
    except PermissionError:
        return [TextContent(type="text", text=f"Error: Sin permisos para escribir: {path}")]
```

### 2.2 Crea la herramienta de listado de directorios

```python
async def list_directory(path: str = ".") -> list[TextContent]:
    """Lista el contenido de un directorio."""
    dir_path = Path(path).resolve()

    # Verificar directorio permitido
    if not any(dir_path.is_relative_to(d) for d in ALLOWED_DIRECTORIES):
        return [TextContent(type="text", text=f"Error: Acceso denegado a {path}")]

    try:
        items = []
        for item in sorted(dir_path.iterdir()):
            prefix = "📁 " if item.is_dir() else "📄 "
            size = f" ({item.stat().st_size / 1024:.1f}KB)" if item.is_file() else ""
            items.append(f"{prefix}{item.name}{size}")

        return [TextContent(type="text", text="\n".join(items) if items else "Directorio vacío")]
    except PermissionError:
        return [TextContent(type="text", text=f"Error: Sin permisos para listar: {path}")]
```

### 2.3 Registra las herramientas en el servidor MCP

Crea `server.py`:

```python
from mcp.server.fastmcp import FastMCP
from tools.file_tools import read_file, write_file, list_directory
from config import SERVER_NAME, SERVER_VERSION

# Crear servidor MCP
mcp = FastMCP(SERVER_NAME, version=SERVER_VERSION)

# Registrar herramientas
@mcp.tool()
async def read_file_tool(path: str) -> str:
    """Lee el contenido de un archivo en el sistema.

    Args:
        path: Ruta completa al archivo a leer
    """
    result = await read_file(path)
    return result[0].text

@mcp.tool()
async def write_file_tool(path: str, content: str) -> str:
    """Escribe contenido en un archivo del sistema.

    Args:
        path: Ruta completa al archivo a escribir
        content: Contenido a escribir en el archivo
    """
    result = await write_file(path, content)
    return result[0].text

@mcp.tool()
async def list_directory_tool(path: str = ".") -> str:
    """Lista el contenido de un directorio.

    Args:
        path: Ruta al directorio a listar (por defecto: directorio actual)
    """
    result = await list_directory(path)
    return result[0].text

if __name__ == "__main__":
    mcp.run()
```

### Verifica

- Las herramientas registran correctamente con `@mcp.tool()`
- Cada herramienta tiene docstrings descriptivos
- Los parámetros tienen anotaciones de tipo
- El servidor se inicia sin errores

### Checklist

- [ ] `read_file` valida permisos y extensiones
- [ ] `write_file` crea directorios si no existen
- [ ] `list_directory` muestra archivos y carpetas
- [ ] El servidor MCP registra todas las herramientas
- [ ] Los errores se manejan de forma robusta

---

## Paso 3: Conecta con Claude Code

El último paso es configurar Claude Code para que use tu servidor MCP.

### 3.1 Configura el servidor en Claude Desktop

Crea o edita el archivo de configuración de Claude Desktop:

**En macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**En Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pyda-mcp": {
      "command": "python",
      "args": ["/ruta/a/tu/proyecto/server.py"],
      "env": {}
    }
  }
}
```

### 3.2 Configura para Claude Code

Para Claude Code, crea un archivo `.mcp.json` en la raíz de tu proyecto:

```json
{
  "mcpServers": {
    "pyda-mcp": {
      "command": "python",
      "args": ["/ruta/a/tu/proyecto/server.py"],
      "env": {}
    }
  }
}
```

### 3.3 Prueba la conexión

1. Reinicia Claude Desktop o Claude Code
2. Verifica que las herramientas aparezcan en la interfaz
3. Prueba con un comando como: "Lee el archivo /ruta/a/archivo.txt"

### 3.4 Agrega autenticación (opcional)

Para producción, agrega validación de tokens:

```python
import os
from functools import wraps

def require_auth(func):
    """Decorator para requerir autenticación."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        token = os.environ.get("MCP_AUTH_TOKEN")
        if not token:
            return [TextContent(type="text", text="Error: Token de autenticación no configurado")]
        return await func(*args, **kwargs)
    return wrapper

@mcp.tool()
@require_auth
async def secure_read_file(path: str) -> str:
    """Versión segura de read_file con autenticación."""
    result = await read_file(path)
    return result[0].text
```

### Verifica

- Claude Desktop/Code detecta el servidor MCP
- Las herramientas aparecen disponibles
- Claude puede invocar las herramientas correctamente
- Los errores se muestran de forma clara

### Checklist

- [ ] La configuración del servidor es correcta
- [ ] Claude detecta las herramientas disponibles
- [ ] Las herramientas funcionan correctamente
- [ ] Los errores se manejan de forma robusta
- [ ] (Opcional) La autenticación funciona

---

## 🩹 Si sale mal

**Claude no detecta el servidor MCP:**
Verifica que la ruta en la configuración sea correcta. Asegúrate de que el servidor pueda ejecutarse sin errores ejecutando `python server.py` directamente.

**Las herramientas no aparecen en Claude:**
Reinicia Claude Desktop completamente. Verifica que el JSON de configuración sea válido (sin comas extra).

**Error de permisos al acceder a archivos:**
Verifica que `ALLOWED_DIRECTORIES` incluya las rutas que necesitas. Los directorios home están bloqueados por defecto por seguridad.

---

## 🧠 Preguntas socráticas

- ¿Qué tipos de herramientas MCP serían útiles para tu flujo de trabajo diario?
- ¿Cómo balancearías seguridad y funcionalidad en las herramientas MCP?
- ¿Qué pasaría si pudieras conectar múltiples servidores MCP en paralelo?
- ¿Cómo monitorearías el uso de herramientas MCP en producción?

---

## 🎓 ¿Qué sigue?

Tu servidor MCP está funcionando. Ahora puedes:

- **Agregar más herramientas**: Conectar APIs externas, bases de datos, servicios web
- **Mejorar la seguridad**: Implementar rate limiting, logging, auditoría
- **Crear herramientas de ML**: Exponer modelos de predicción como herramientas MCP
- **Documentar tus herramientas**: Crear documentación automática de las herramientas disponibles

Si quieres crear herramientas más sofisticadas, revisa la skill de **AI Agent** para aprender a construir agentes autónomos que usen tus herramientas MCP.
