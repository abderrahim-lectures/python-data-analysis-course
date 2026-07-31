---
id: 2027-dependency-freshness-checker
title: "Construye un Verificador de Frescura de Dependencias"
sidebar_label: "Verificador de Frescura de Dependencias"
slug: /projects/dependency-freshness-checker
description: "Construye una herramienta CLI real que lee un pyproject.toml, verifica en PyPI versiones más nuevas de cada dependencia, y reporta qué está desactualizado — sin clave de API necesaria."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Verificador de Frescura de Dependencias

<ProjectPublishedDate projectId="2027-dependency-freshness-checker" />

<ProjectGreeting />

Cada proyecto Python real acumula dependencias, y cada dependencia eventualmente se queda atrás — sale una corrección de seguridad, se parchea un bug, llega una nueva característica, y tu `pyproject.toml` simplemente... no lo sabe. Este proyecto construye la herramienta que te lo dice: un CLI real que lee un `pyproject.toml`, le pregunta a la API pública de PyPI cuál es realmente la versión actual de cada dependencia, y reporta en cuáles estás atrasado — la misma categoría de herramienta que `pip list --outdated`, pero una que entiendes completamente porque la construiste tú mismo.

Esto es opcional y no calificado — un buen ajuste una vez que hayas terminado Python 101 (no se necesita experiencia de Análisis de Datos ni de claves de API, este proyecto no usa ningún servicio pagado o restringido en absoluto). Consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Analizar un archivo `pyproject.toml` real y extraer su lista de dependencias.
2. Consultar la API JSON pública de PyPI para encontrar la versión publicada actual de cada dependencia.
3. Comparar tu versión fijada/instalada contra la más reciente, usando análisis real de versión semántica — no comparación ingenua de cadenas.
4. Imprimir un reporte de frescura limpio y categorizado (actualizado / desactualizado / no se pudo verificar).

## Dónde ejecutar esto

**Localmente con `uv`** es el camino que siguen los pasos de esta lección, y el recomendado — lo apuntarás a un `pyproject.toml` real (el propio repositorio de este curso tiene varios, o usa cualquier proyecto tuyo). La sección de Configuración de abajo explica cómo instalarlo.

**GitHub Codespaces** es una alternativa de configuración cero si prefieres no instalar nada localmente todavía: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados) y ejecuta los mismos comandos `uv` exactos desde una terminal en tu pestaña del navegador — además tendrás muchos archivos `pyproject.toml` reales cerca para apuntar la herramienta.

**Google Colab, Kaggle Notebooks, o Binder** también funcionan, ya que este proyecto no necesita clave de API ni GPU — una versión real y ejecutable en notebook vive en [`examples/dependency-freshness-checker/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-freshness-checker/notebook.ipynb). Haz clic en una insignia para lanzarlo directamente, sin instalación local en absoluto:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-freshness-checker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-freshness-checker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdependency-freshness-checker%2Fnotebook.ipynb)

Sé honesto contigo mismo sobre la compensación, sin embargo: un notebook solo puede verificar cualquier contenido de `pyproject.toml` de ejemplo que pegues en él, no apuntar a una carpeta de proyecto real en disco como puede hacerlo el CLI local.

## Configuración

`uv` es una sola herramienta que reemplaza la cadena habitual de "instala Python, luego instala pip, luego instala una herramienta de entorno virtual, luego instala paquetes" — puede instalar y gestionar versiones de Python por sí misma, junto con las dependencias de tu proyecto.

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

Luego configura el proyecto:

```bash
uv init dependency-checker
cd dependency-checker
uv add requests packaging
```

No se necesita ninguna clave de API en ningún lugar de este proyecto — la API JSON de PyPI (`https://pypi.org/pypi/<package>/json`) es pública, gratuita, y no requiere registro ni autenticación. `requests` maneja las llamadas HTTP; `packaging` te da un análisis real y correcto de versión semántica (`packaging.version.Version`) en lugar de comparar cadenas de versión carácter por carácter, lo cual se rompe en el momento en que comparas `"2.9"` contra `"2.10"` como texto plano.

:::tip[¿Por qué no simplemente comparar las versiones como cadenas?]
`"2.10.0" > "2.9.0"` es `True` matemáticamente, pero como cadenas simples, `"2.10.0" < "2.9.0"` — porque `"1" < "9"` carácter por carácter, Python nunca llega lo suficientemente lejos como para notar que `10 > 9`. La comparación real de versiones tiene que analizar cada parte como un número primero. La librería `packaging` (la misma que `pip` usa internamente) hace esto correctamente, incluyendo versiones pre-lanzamiento como `2.0.0rc1`.
:::

## Paso 1: Analiza un `pyproject.toml` real

Python 3.11+ incluye `tomllib` en la biblioteca estándar — no se necesita instalación para *leer* TOML (solo haría falta `uv add` de un paquete si necesitaras *escribir* TOML, lo cual este proyecto no hace).

```python
# parse_deps.py
import tomllib
from pathlib import Path


def load_dependencies(pyproject_path: str) -> list[str]:
    """Read a pyproject.toml and return its raw dependency specifier strings,
    e.g. ["requests>=2.31", "packaging"]."""
    with Path(pyproject_path).open("rb") as f:
        data = tomllib.load(f)
    return data.get("project", {}).get("dependencies", [])


if __name__ == "__main__":
    deps = load_dependencies("pyproject.toml")
    for dep in deps:
        print(dep)
```

```bash
uv run python parse_deps.py
```

<StepChecklist>
  <StepChecklistItem>Ejecutar esto contra el `pyproject.toml` de tu propio proyecto imprime la cadena de especificador cruda de cada dependencia.</StepChecklistItem>
  <StepChecklistItem>Puedes explicar por qué `tomllib` necesita que el archivo se abra en modo binario (`"rb"`), no en modo texto.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**: La lista `dependencies` de un `pyproject.toml` contiene cadenas como `"requests>=2.31"` — no solo nombres de paquete. ¿Cuál es el *nombre* por sí solo, separado de cualquier restricción de versión adjunta? Necesitarás separarlos limpiamente en el siguiente paso, y una cadena de dependencia real puede ser más descuidada de lo que parece (espacios extra, extras como `"requests[socks]>=2.31"`, fijación exacta `==` en lugar de `>=`) — ¿cuáles de esos romperían un `.split(">=")` ingenuo?

## Paso 2: Busca la versión actual de cada paquete en PyPI

```python
# check_pypi.py
import re

import requests


def parse_package_name(specifier: str) -> str:
    """Extract just the package name from a specifier like 'requests>=2.31'
    or 'requests[socks]==2.31.0'."""
    match = re.match(r"^[A-Za-z0-9_.-]+", specifier.strip())
    if not match:
        raise ValueError(f"Could not parse a package name from {specifier!r}")
    return match.group(0)


def get_latest_version(package_name: str) -> str | None:
    """Query PyPI's public JSON API for a package's current published
    version. Returns None if the package isn't found (a typo, or a private
    package not on PyPI)."""
    url = f"https://pypi.org/pypi/{package_name}/json"
    response = requests.get(url, timeout=10)
    if response.status_code == 404:
        return None
    response.raise_for_status()
    return response.json()["info"]["version"]


if __name__ == "__main__":
    for specifier in ["requests>=2.31", "packaging", "not-a-real-package-xyz"]:
        name = parse_package_name(specifier)
        latest = get_latest_version(name)
        print(f"{name}: latest is {latest!r}")
```

```bash
uv run python check_pypi.py
```

Nota el `"not-a-real-package-xyz"` deliberadamente roto en la lista de prueba — debería imprimir `latest is None`, no fallar. Una herramienta real tiene que manejar con elegancia un nombre de paquete con typo o privado, no asumir que cada nombre en un `pyproject.toml` se resuelve.

<StepChecklist>
  <StepChecklistItem>Los paquetes reales imprimen su versión real y actual de PyPI — puedes verificar cruzadamente uno contra pypi.org en tu navegador.</StepChecklistItem>
  <StepChecklistItem>El nombre de paquete falso imprime `None` en lugar de fallar el script.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**: `response.raise_for_status()` se ejecuta *después* de la verificación explícita de 404 arriba de él — ¿por qué distinguir específicamente el 404 en lugar de dejar que `raise_for_status()` maneje cada estado no-2xx de la misma forma? ¿Qué le pasaría al flujo de control de este script si esa verificación de 404 no estuviera ahí?

## Paso 3: Compara versiones correctamente

```python
# compare.py
from packaging.version import InvalidVersion, Version


def is_outdated(current: str, latest: str) -> bool | None:
    """Compare two version strings properly. Returns None (not True/False)
    if either string isn't a version packaging can parse -- e.g. a git URL
    or a local path used as a 'version', which pyproject.toml permits."""
    try:
        return Version(current) < Version(latest)
    except InvalidVersion:
        return None


if __name__ == "__main__":
    print(is_outdated("2.9.0", "2.10.0"))  # True -- real semantic comparison
    print(is_outdated("2.10.0", "2.9.0"))  # False
    print(is_outdated("2.10.0", "2.10.0"))  # False -- equal, not outdated
    print(is_outdated("not-a-version", "2.10.0"))  # None -- can't compare
```

```bash
uv run python compare.py
```

<StepChecklist>
  <StepChecklistItem>`is_outdated("2.9.0", "2.10.0")` imprime `True`, probando que esto no es comparación ingenua de cadenas.</StepChecklistItem>
  <StepChecklistItem>Una cadena de versión no analizable devuelve `None`, no un fallo o un `True`/`False` silenciosamente incorrecto.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**: ¿Por qué devuelve `is_outdated` tres resultados posibles (`True`, `False`, `None`) en lugar de solo dos? ¿Qué situación real y no hipotética en un `pyproject.toml` haría de `None` la *única* respuesta honesta?

## Paso 4: Júntalo todo en un reporte de frescura real

```python
# freshness_report.py
from dataclasses import dataclass

from check_pypi import get_latest_version, parse_package_name
from compare import is_outdated
from parse_deps import load_dependencies


@dataclass
class DependencyStatus:
    name: str
    current_specifier: str
    latest: str | None
    outdated: bool | None


def build_report(pyproject_path: str) -> list[DependencyStatus]:
    report = []
    for specifier in load_dependencies(pyproject_path):
        name = parse_package_name(specifier)
        latest = get_latest_version(name)
        # A specifier with no pinned version (just "requests") has nothing
        # concrete to compare against -- treat that case as "unknown" too.
        pinned = specifier[len(name) :].lstrip(">=<~! ")
        outdated = is_outdated(pinned, latest) if pinned and latest else None
        report.append(DependencyStatus(name, specifier, latest, outdated))
    return report


def print_report(report: list[DependencyStatus]) -> None:
    outdated = [d for d in report if d.outdated is True]
    fresh = [d for d in report if d.outdated is False]
    unknown = [d for d in report if d.outdated is None]

    if outdated:
        print(f"⚠️  {len(outdated)} outdated:")
        for d in outdated:
            print(f"   {d.name}: pinned {d.current_specifier!r}, latest is {d.latest}")
    if fresh:
        print(f"✅ {len(fresh)} up to date: {', '.join(d.name for d in fresh)}")
    if unknown:
        print(f"❓ {len(unknown)} could not be checked: {', '.join(d.name for d in unknown)}")


if __name__ == "__main__":
    import sys

    path = sys.argv[1] if len(sys.argv) > 1 else "pyproject.toml"
    print_report(build_report(path))
```

```bash
uv run python freshness_report.py pyproject.toml
```

Intenta apuntarlo a un `pyproject.toml` de un proyecto real y más antiguo que tengas por ahí (o los propios archivos `examples/*/pyproject.toml` de este repositorio del curso) — ahí es donde realmente verás el bucket de "desactualizado" poblarse con resultados reales, no solo dependencias actualizadas que añadiste hace cinco minutos.

<StepChecklist>
  <StepChecklistItem>Ejecutar el reporte contra el propio `pyproject.toml` de tu proyecto imprime un resumen categorizado ✅/⚠️/❓.</StepChecklistItem>
  <StepChecklistItem>Apuntarlo a un `pyproject.toml` intencionalmente más antiguo muestra al menos una dependencia realmente desactualizada.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**: Este script hace una solicitud HTTP por dependencia, una tras otra. Para un `pyproject.toml` con 40 dependencias, ¿cuál es el costo experimentado por el usuario de eso — y cuál sería una forma concreta de acelerarlo (pista: estas solicitudes no dependen en absoluto de los resultados de las demás)?

## ⚠️ Errores comunes

- **Comparación ingenua de versiones como cadenas.** `"2.9" > "2.10"` como cadenas simples — este es el bug único más común en un verificador de versiones hecho a mano. Siempre analiza con `packaging.version.Version`, nunca compares cadenas de versión directamente.
- **Asumir que cada nombre de dependencia se resuelve en PyPI.** Paquetes privados/internos, typos, y "dependencias" de URL git son todas cosas reales que `pyproject.toml` permite — tu script tiene que degradarse con elegancia (un bucket `None`/"desconocido"), no fallar todo el reporte por una entrada inusual.
- **Tratar una dependencia sin fijar (`"requests"` sin ninguna versión) como "desactualizada".** No hay nada contra qué comparar — ese es un caso diferente y honesto de "desconocido", no un falso positivo.
- **Martillar PyPI sin un timeout.** Siempre pasa `timeout=...` a `requests.get()` — una sola solicitud colgada sin uno puede congelar toda la herramienta indefinidamente.

## Lo que acabas de construir

Un CLI real de verificación de frescura — la misma idea central detrás de `pip list --outdated`, Dependabot de GitHub, y Renovate, construido desde primeros principios: analizar un manifiesto, consultar una API pública real, comparar versiones *correctamente*, y reportar el resultado claramente. Nada aquí estuvo oculto detrás de una librería que hace la comparación de versiones por ti — ahora sabes exactamente por qué la comparación ingenua de cadenas se rompe y cómo evitarla, un detalle que hace tropezar a bastantes herramientas hechas a mano en la práctica.

## A dónde ir desde aquí

- Acelérala con solicitudes concurrentes (`concurrent.futures.ThreadPoolExecutor` o `asyncio` + `httpx`) — la pregunta socrática de arriba es tu punto de partida.
- Añade un modo `--fix` que reescriba automáticamente las restricciones de versión del `pyproject.toml` a las versiones más recientes (cuidado: siempre muestra un diff o requiere confirmación antes de escribir a un archivo real — el mismo principio de seguridad usado en otros lugares de los proyectos de este curso).
- Verifica la fecha de lanzamiento de PyPI, no solo el número de versión, y marca cualquier cosa sin tocar por más de un año como posiblemente abandonada — una señal genuinamente diferente y complementaria a "está esto desactualizado".
- Compara también contra las versiones realmente instaladas de `uv.lock`, no solo los especificadores de `pyproject.toml` — los dos pueden legítimamente discrepar.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="2027-dependency-freshness-checker" />
