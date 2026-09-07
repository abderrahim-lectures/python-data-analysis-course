---
title: "Servidor Mock de API"
description: "Convertir una tabla de rutas en una API falsa: las rutas plantilla se vuelven despachadores regex, las cadenas de consulta y los cuerpos JSON se reflejan de vuelta, los errores se simulan según un cronograma, y cada llamada se registra para reproducirse como una mini prueba de regresión."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["APIs", "Developer Tools", "Testing"]
prerequisites:
  - "Funciones, clases y lambdas de Python"
  - "Serialización JSON y acceso a dicts"
  - "Regex muy ligero: qué es un grupo nombrado"
learningObjectives:
  - "Compilar plantillas de ruta en expresiones regulares que extraen parámetros de la ruta"
  - "Despachar peticiones a fábricas de respuesta con params, cadenas de consulta y cuerpos"
  - "Simular fallos con una ruta flaky basada en contador y reportar un 404 limpio"
  - "Leer, reflejar y validar un cuerpo JSON POST de extremo a extremo"
  - "Registrar cada llamada en una transcripción y reproducirla para verificar la estabilidad de las respuestas"
---

# 🛠️ 🎛️ Construye un Servidor Mock de API

Toda app real eventualmente se bloquea en un backend que no está listo — un servicio de pagos sin sandbox, un feed de clima caído, una API de una colega aún en diseño. Un *servidor mock* es el sustituto honesto: corre en tu máquina, habla HTTP en localhost y responde las mismas rutas que tu backend real, así tu frontend, tus pruebas y tus demos nunca esperan el deploy de alguien más. Este proyecto construye ese servidor desde cero: plantillas de ruta como `/users/<id>` se vuelven despachadores que extraen parámetros, las cadenas de consulta y los cuerpos JSON se reflejan de vuelta para inspección, una ruta flaky falla según un cronograma, y un grabador integrado reproduce cada llamada para atrapar regresiones antes de que exista producción. Corre en la biblioteca estándar. Cada ejemplo de esta guía es determinista — el mismo despacho devuelve el mismo JSON cada vez — así que puedes verificar cada afirmación mientras construyes.

Esto asume funciones, clases y manejo de JSON. Es un proyecto opcional y no calificado — consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Compilar plantillas de ruta en regex que capturan parámetros de la ruta.
2. Construir un despachador que enruta método + ruta a una fábrica de respuesta.
3. Reflejar cadenas de consulta y fallos simulados, incluyendo un 500 programado y un 404 limpio.
4. Agregar un endpoint de eco JSON que lee y devuelve un cuerpo POST.
5. Registrar cada llamada en una transcripción y reproducirla como comprobación de regresión.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — el servidor mock es biblioteca estándar pura (`http.server`, `http.client`, `urllib.parse`, `json`), así que un `uv init` es todo lo que necesitas.

**Google Colab, Kaggle Notebooks y Binder** ejecutan cada paso sin modificar. La red de los notebooks es suficientemente permisiva para las partes del despachador en proceso; el bloque final opcional de cableado en vivo también funciona en Binder y localmente — mantenlo efímero (puerto `0`) para que nunca choque con otro proceso.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/api-mock-server/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/api-mock-server/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fapi-mock-server%2Fnotebook.ipynb)

## Configuración

Todo lo necesario antes de la primera petición.

### Configura el proyecto

```bash
uv init api-mock-server
cd api-mock-server
```

Sin dependencias. Las piezas: una tabla de rutas (método + plantilla + fábrica de respuesta), un despachador `MockAPI` y, más tarde, un grabador.

**✅ Lista de verificación**

- ✅ `uv init api-mock-server` crea el proyecto y un `main.py`.
- ✅ `uv run python3 -c "import json, re, http.server"` tiene éxito — todo es biblioteca estándar.

**🤔 Pregunta(s) socrática(s)**

- Un servidor mock devuelve *datos falsos* por definición. ¿Qué le da aún integridad — la forma de la respuesta, los códigos de estado, la latencia o la *promesa de que es determinista*? ¿Cuál de esos puede arrullarte para que envíes algo que se rompe contra el backend real?
- El mock anuncia `{"status": "ok"}` en una ruta que la API real aún no ha construido. Si tu frontend pasa las pruebas contra el mock, ¿qué propiedad única del *backend real* podría seguir rompiéndolo — y dónde ayudaría un campo `version`?

## Paso 1: Rutas como plantillas

Una ruta es tres cosas: un método HTTP, una ruta (quizás con `<params>`) y una función que construye la respuesta. El paso 1 define la tabla de rutas y el compilador de plantillas.

### 1.1 El compilador de plantillas

**👟 Pista inicial :** Escribe `route_regex(template)` que convierta `/users/<uid>` en una regex con un grupo de captura nombrado `<uid>`.

```python
# main.py
import re
from urllib.parse import urlparse, parse_qs

def route_regex(template):
    pattern = re.sub(r"<(\w+)>", r"(?P<\1>[^/]+)", template)
    return re.compile("^" + pattern + "$")

m = route_regex("/users/<uid>").match("/users/42")
print(m.groupdict())
```

`re.sub(r"<(\w+)>", r"(?P<\1>[^/]+)", template)` reescribe cada `<name>` en un grupo de regex nombrado: `/users/<uid>` se vuelve `/users/(?P<uid>[^/]+)`. `[^/]+` coincide con cualquier corrida que no sea barra, así que `42`, `grace` y `x-7` se enlazan todas a `uid`. Anclar con `^…$` hace el match exacto, de modo que `/users/42/extra` no haga medio-match.

**🎯 Resultado esperado :** `{'uid': '42'}`.

**🩹 Si sale mal :** Si la salida está vacía o es `{}`, `.match` se ancló en una posición incompatible — revisa el `^` inicial. Si aparece un `re.error`, los corchetes de la plantilla están desbalanceados o un nombre de captura contiene un carácter no-palabra.

### 1.2 Registra la ruta de salud

**👟 Pista inicial :** Define `add(method, template, response)` que almacene un matcher compilado más la fábrica de respuesta, y luego registra un endpoint `/health`.

```python
# main.py (continued)
class MockAPI:
    def __init__(self, base="/api/v1"):
        self.base = base
        self.routes = []

    def add(self, method, template, response):
        self.routes.append({
            "method": method,
            "match": route_regex(self.base + template),
            "response": response,
        })
        return self

api = MockAPI()
api.add("GET", "/health", lambda **kwargs: {"healthy": True, "version": "1.0.0"})
print(len(api.routes), "route registered")
```

La tabla de rutas es solo una lista de dicts — configuración como datos. Cada entrada empareja un verbo HTTP con el matcher compilado para la ruta *con prefijo* (`/api/v1` + `/health`), y una función que construirá la carga útil después. Las lambdas mantienen las definiciones de ruta en una línea; una función nombrada funciona igual.

**🎯 Resultado esperado :** `1 route registered`.

**🩹 Si sale mal :** Si `len(api.routes)` es 0, `add` olvidó `self.routes.append(...)` o devolvió antes de anexar. Si imprime `2 routes`, una copia de la lista se filtró — revisa si hay un aliasing accidental de `routes = self.routes`.

### 1.3 Verifica la capa de plantillas

**✅ Lista de verificación**

- ✅ `route_regex("/users/<uid>")` coincide con `/users/42` con `groupdict() == {"uid": "42"}`.
- ✅ `route_regex("/users/<uid>")` *no* coincide con `/users/42/orders`.
- ✅ `add` almacena método, matcher y fábrica; el prefijo base se aplica al registrar.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué una *regex* en lugar de `path.split("/")`? Convierte `/users/<uid>/orders/<oid>` en una búsqueda basada en split en tu cabeza — ¿qué se rompe con segmentos de longitud variable y con cadenas de consulta? La regex es la respuesta compacta a "cualquier número de segmentos, con nombres".
- La plantilla `/users/<uid>` y `/users/search` ambas comienzan con `/users/`. Si registraste `<uid>` primero, ¿cuál golpearía una petición a `/users/search` — y qué regla lo decide?

## Paso 2: El despachador

Las plantillas permanecen inactivas hasta que algo busca una petición. El paso 2 convierte la tabla de rutas en un despachador: método + ruta adentro, `(status, payload)` afuera.

### 2.1 Maneja una ruta estática

**👟 Pista inicial :** Implementa `dispatch(method, path)` que escanee rutas, compare método y luego ruta, y llame a la fábrica elegida.

```python
# main.py (continued)
    def dispatch(self, method, path, body=None):
        for route in self.routes:
            if route["method"] != method:
                continue
            m = route["match"].match(path)
            if not m:
                continue
            kwargs = dict(m.groupdict())
            return 200, route["response"](**kwargs)
        return 404, {"error": "not found"}

print(api.dispatch("GET", "/api/v1/health"))
print(api.dispatch("GET", "/api/v1/health"))
print(api.dispatch("GET", "/api/v1/missing"))
print(api.dispatch("POST", "/api/v1/health"))
```

`dispatch` es un escaneo lineal: dos filtros baratos (`method ==`, match del matcher) antes de la llamada costosa. La primera ruta que coincide gana, así que el orden de registro es el desempate (ver el Socrático del paso 1). Una petición completamente perdida devuelve un **payload** `404` — no una excepción — así que cada llamada tiene una respuesta `(status, payload)` definitiva.

**🎯 Resultado esperado :**

```
(200, {'healthy': True, 'version': '1.0.0'})
(200, {'healthy': True, 'version': '1.0.0'})
(404, {'error': 'not found'})
(404, {'error': 'not found'})
```

**🩹 Si sale mal :** Si responde la ruta equivocada, el orden primero-matchea eligió la entrada equivocada — reordena el registro. Si `/missing` lanza en lugar de devolver `(404, …)`, el bucle cayó hasta un `routes[0]` sin guardia.

### 2.2 Parámetros de ruta y cadenas de consulta

**👟 Pista inicial :** Extiende `dispatch` para pasar los params de ruta *y* los params de consulta parseados a la fábrica vía `kwargs`.

```python
# main.py (continued)
    def dispatch(self, method, path, body=None):
        parsed = urlparse(path)
        query = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        for route in self.routes:
            if route["method"] != method:
                continue
            m = route["match"].match(parsed.path)
            if not m:
                continue
            kwargs = dict(m.groupdict())
            return 200, route["response"](**kwargs, params=query)
        return 404, {"error": "not found"}

api.add("GET", "/users/<uid>",
        lambda **kw: {"user": {"id": kw["uid"], "name": "Ada", "role": "admin"}})
api.add("GET", "/search",
        lambda **kw: {"query": kw["params"].get("q", ""),
                      "results": [f"result-{i+1}"
                                  for i in range(int(kw["params"].get("limit", "1")))]})

print(api.dispatch("GET", "/api/v1/users/42"))
print(api.dispatch("GET", "/api/v1/search?q=cats&limit=3"))
print(api.dispatch("GET", "/api/v1/search"))
```

`urlparse` separa la ruta de la consulta; `parse_qs` convierte `?q=cats&limit=3` en `{"q": ["cats"], "limit": ["3"]}`, sin envolver a cadenas de primer valor. Los params de ruta llegan vía `**kwargs` (de los grupos de la regex); los params de consulta llegan vía un dict `params`. La fábrica de respuesta nombra los params que quiere y da default al resto.

**🎯 Resultado esperado :**

```
(200, {'user': {'id': '42', 'name': 'Ada', 'role': 'admin'}})
(200, {'query': 'cats', 'results': ['result-1', 'result-2', 'result-3']})
(200, {'query': '', 'results': ['result-1']})
```

**🩹 Si sale mal :** Si `uid` falta en la respuesta, `**kwargs` no lo incluyó — revisa que el matcher capturó `uid` (paso 1.1). Si `limit=3` devuelve 1 resultado, `parse_qs` dio listas y la fábrica indexó una lista en lugar de una cadena — confirma el desenvuelto `v[0]`.

### 2.3 Verifica el despachador

**✅ Lista de verificación**

- ✅ `dispatch` devuelve `(200, payload)` para los GET registrados y `(404, {"error": "not found"})` para todo lo demás, coincidiendo también por método.
- ✅ `/users/<uid>` y `/search` resuelven ambos, con params de ruta en `kwargs` y params de consulta en `params`.
- ✅ El mismo despachador responde repetidamente — una llamada no consume estado.

**🤔 Pregunta(s) socrática(s)**

- Los caracteres codificados en URL estilo `%7B` viven en la *ruta*; los espacios viven en la *consulta*. ¿Dónde traza `urlparse` la línea, y qué se rompería si parsearas los params de consulta desde `parsed.path` en lugar de `parsed.query`?
- La fábrica de `/users/<uid>` devuelve la misma "Ada" para todo id. Para un *mock*, ¿es eso un bug o una feature? Enmarca el equilibrio entre "variedad realista" y "pruebas deterministas".

## Paso 3: Simula los modos de fallo

Las API reales fallan. Un buen mock falla *a propósito*, según un cronograma, para que tu código no pueda esquivar los caminos de fallo. El paso 3 agrega errores programados y un eco consciente del cuerpo.

### 3.1 La ruta flaky

**👟 Pista inicial :** Extiende `add` con un `flaky={"every": n, "message": ...}` opcional; cuenta los golpes por ruta y devuelve un 500 en cada `n`-ésimo.

```python
# main.py (continued)
    def __init__(self, base="/api/v1"):
        self.base = base
        self.routes = []
        self._counter = {}

    def add(self, method, template, response, *, flaky=None):
        self.routes.append({"method": method,
                            "match": route_regex(self.base + template),
                            "response": response,
                            "flaky": flaky})

    def dispatch(self, method, path, body=None):
        parsed = urlparse(path)
        query = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        for route in self.routes:
            if route["method"] != method:
                continue
            m = route["match"].match(parsed.path)
            if not m:
                continue
            kwargs = dict(m.groupdict())
            if route["flaky"] is not None:
                n = self._counter.setdefault(path, 0) + 1
                self._counter[path] = n
                if n % route["flaky"]["every"] == 0:
                    return 500, {"error": route["flaky"]["message"]}
            return 200, route["response"](**kwargs, params=query)
        return 404, {"error": "not found"}

api.add("GET", "/flaky", lambda **kw: {"ok": True},
        flaky={"every": 3, "message": "Simulated outage"})
print(api.dispatch("GET", "/api/v1/flaky"))
print(api.dispatch("GET", "/api/v1/flaky"))
print(api.dispatch("GET", "/api/v1/flaky"))
```

`_counter` cuenta los golpes *por ruta* (`setdefault(path, 0)`), así que una ruta flaky falla en los golpes 3, 6, 9 — un cronograma determinista que tus pruebas pueden afirmar. Las dos llamadas sanas tienen éxito, luego la tercera falla con un payload de error nítido. Así se prueba un bucle de reintentos: dale un ritmo de "tiene éxito dos veces, falla una".

**🎯 Resultado esperado :**

```
(200, {'ok': True})
(200, {'ok': True})
(500, {'error': 'Simulated outage'})
```

**🩹 Si sale mal :** Si las tres fallan, `every` es `1` (o el módulo está invertido — `n % every == 0` solo se dispara en múltiplos exactos). Si ninguna falla, la rama `flaky` nunca corre porque `add` no se llamó con `flaky=` como palabra clave.

### 3.2 La mala entrada es un 4xx, no un colapso

**👟 Pista inicial :** Envuelve la llamada de la fábrica en try/except para que una *excepción en el mock* se vuelva un payload 422, nunca un stack trace.

```python
# main.py (continued)
    def dispatch(self, method, path, body=None):
        parsed = urlparse(path)
        query = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        for route in self.routes:
            if route["method"] != method:
                continue
            m = route["match"].match(parsed.path)
            if not m:
                continue
            kwargs = dict(m.groupdict())
            if route["flaky"] is not None:
                n = self._counter.setdefault(path, 0) + 1
                self._counter[path] = n
                if n % route["flaky"]["every"] == 0:
                    return 500, {"error": route["flaky"]["message"]}
            try:
                payload = route["response"](**kwargs, params=query, body=body)
            except Exception as e:
                return 422, {"error": str(e)}
            return 200, payload
        return 404, {"error": "not found"}

api.add("GET", "/divide", lambda **kw: {"n": 1 / int(kw["params"]["by"])})
print(api.dispatch("GET", "/api/v1/divide?by=2"))
print(api.dispatch("GET", "/api/v1/divide?by=0"))
```

El try/except traza una línea dura: el *mock* tiene un bug o el llamador envió disparates, y de cualquier forma la respuesta es JSON estructurado con estado `422` — un cliente puede ramificar sobre él. Sin el guardia, un mal `by=0` propagaría un `ZeroDivisionError` y tumbaría todo el hilo del servidor.

**🎯 Resultado esperado :**

```
(200, {'n': 0.5})
(422, {'error': 'division by zero'})
```

**🩹 Si sale mal :** Si `by=0` colapsa, el try/except está fuera del bucle o la fábrica se llama en otra parte. Si devuelve `500` en lugar de `422`, el `except` re-lanzó o mapeó el estado equivocado.

### 3.3 Verifica los modos de fallo

**✅ Lista de verificación**

- ✅ Una ruta flaky falla exactamente cuando `n % every == 0` — el golpe 3 de un cronograma de 3 falla.
- ✅ Las fábricas que fallan devuelven `(422, {"error": ...})`; las rutas sin coincidencia devuelven `(404, ...)`.
- ✅ Todos los fallos simulados son datos, nunca excepciones lanzadas.

**🤔 Pregunta(s) socrática(s)**

- El contador flaky es *por ruta*, no por regla. Dos llamadores golpeando `/api/v1/flaky` comparten el conteo. ¿Querrías en su lugar un contador por *llamador* al simular un sistema distribuido — y sobre qué te apoyarías para decir qué llamador es cuál?
- 422 vs 500: uno dice "la petición estaba mal", el otro "el servidor falló". Cuando **simulas**, controlas ambos lados — así que ¿por qué molestarse en distinguirlos?

## Paso 4: Lee y refleja un cuerpo JSON

Los GET llevan params en la URL. Los POST llevan un cuerpo JSON. El paso 4 hace al mock consciente del cuerpo: léelo, refléjalo y devuelve el objeto — el recorrido completo que un frontend necesita para desarrollar contra él.

### 4.1 Refleja un cuerpo POST

**👟 Pista inicial :** Registra `/echo`; la fábrica decodifica `body` (una cadena cruda) con `json.loads` y devuelve `{"echo": <decodificado>}`.

```python
# main.py (continued)
api.add("POST", "/echo",
        lambda **kw: {"echo": json.loads(kw["body"]) if kw["body"] else {}})

print(api.dispatch("POST", "/api/v1/echo", body='{"name": "Grace"}'))
print(api.dispatch("POST", "/api/v1/echo", body=""))
```

`body` entra a `dispatch` como una cadena cruda (la capa HTTP la lee de la petición en el paso 5); `json.loads` la convierte en un objeto Python para la respuesta del eco. Un cuerpo faltante se vuelve `{}` — aún un eco válido, no una excepción.

**🎯 Resultado esperado :**

```
(200, {'echo': {'name': 'Grace'}})
(200, {'echo': {}})
```

**🩹 Si sale mal :** Si `json.loads` da error con una cadena JSON válida, el cuerpo llegó doble-codificado (cita el JSON dos veces) o con un byte suelto. Si un cuerpo vacío se refleja como `None`, el ternario falsy se volteó.

### 4.2 Params encadenados: cuerpo + ruta + consulta

**👟 Pista inicial :** Registra un endpoint de almacenamiento cuya respuesta combine el param de ruta, un param de consulta y el cuerpo decodificado.

```python
# main.py (continued)
api.add("POST", "/users/<uid>/notes",
        lambda **kw: {"user": kw["uid"],
                      "tag": kw["params"].get("tag", "general"),
                      "note": json.loads(kw["body"]) or {"text": ""}})

print(api.dispatch("POST", "/api/v1/users/7/notes?tag=idea",
                   body='{"text": "ship by Friday"}'))
```

Una ruta ahora ejercita cada canal de entrada a la vez — el nombre de la ruta, una etiqueta de consulta y el cuerpo JSON — que es exactamente la forma que tiene un endpoint real de `/users/<id>/notes`. Leer los tres en una sola respuesta prueba que el despachador transporta cada canal de manera independiente.

**🎯 Resultado esperado :**

```
(200, {'user': '7', 'tag': 'idea', 'note': {'text': 'ship by Friday'}})
```

**🩹 Si sale mal :** Si `tag` falta, `query` no se enhebró hacia la fábrica. Si `user` es `None`, `kw["uid"]` no se capturó (el nombre del grupo en la plantilla no coincidió con la clave usada aquí).

### 4.3 Verifica la canalización del cuerpo

**✅ Lista de verificación**

- ✅ `/echo` devuelve el objeto del cuerpo JSON decodificado; un cuerpo vacío refleja `{}`.
- ✅ La ruta, la consulta y el cuerpo se pueden combinar en la respuesta de una sola ruta.
- ✅ Un JSON malformado en un cuerpo se mapea a un 422 vía la guardia del paso 3, no a un colapso.

**🤔 Pregunta(s) socrática(s)**

- La ruta de eco *confía* en `json.loads`. Si un cliente envía `{"text": "ship by Friday"}` pero la API real espera `{"content": ...}`, un eco mock de la forma equivocada pasa las pruebas en silencio. ¿Dónde pondrías una *comprobación de esquema* — en la fábrica de la ruta o en el despachador — y por qué?
- `json.loads(kw["body"])` devuelve cualquier tipo JSON: lista, número, null. Si quisieras que `/echo` aceptara *solo* objetos, ¿qué cambio de una línea rechazaría el resto?

## Paso 5: Graba y reproduce

Un mock que responde pero olvida no puede verificar. El paso 5 registra cada llamada en una transcripción y luego la reproduce — re-ejecutando las peticiones exactas y afirmando que las respuestas no derivaron. Esa es una prueba de regresión nacida de un mock.

### 5.1 Graba la transcripción

**👟 Pista inicial :** Agrega una lista `recorded`; registra método, ruta, cuerpo, estado y payload en `dispatch`, sembrada por las llamadas que ya hiciste.

```python
# main.py (continued)
    def __init__(self, base="/api/v1"):
        self.base = base
        self.routes = []
        self._counter = {}
        self.recorded = []

    def _finish(self, method, path, body, status, payload):
        self.recorded.append({"method": method, "path": path, "body": body,
                              "status": status, "payload": payload})
        return status, payload

    def transcript(self):
        return json.loads(json.dumps(self.recorded))

    # Now route dispatch returns self._finish(...) on every path — the
    # matching routes and the fallback 404 alike (add that in this section).

print("calls recorded so far:", len(api.transcript()))
print(api.transcript()[0])
```

Registrar la *petición* (método, ruta, cuerpo) junto con la *respuesta* (estado, payload) hace de la transcripción un rastro veraz — puedes reproducir cualquier entrada después sin adivinar qué envió. Una copia profunda vía `json.dumps(json.loads(...))` mantiene la transcripción devuelta aislada de mutaciones posteriores. (Para que los conteos de abajo coincidan, haz que `dispatch` termine cada ruta — con match o con 404 — con `return self._finish(method, path, body, status, payload)`, devolviendo cualquier `(status, payload)` directamente.)

**🎯 Resultado esperado :**

```
calls recorded so far: 9
{'method': 'GET', 'path': '/api/v1/health', 'body': None, 'status': 200, 'payload': {'healthy': True, 'version': '1.0.0'}}
```

(El conteo es 9 porque cada llamada a `dispatch` anterior de esta guía quedó registrada.)

**🩹 Si sale mal :** Si la transcripción está vacía, `_finish` (o el append dentro de ella) no está en la ruta de retorno de `dispatch`. Si las entradas mutan después, falta la copia profunda en `transcript()`.

### 5.2 Reproduce como comprobación de regresión

**👟 Pista inicial :** Implementa `replay()` que re-despacha cada petición registrada y colecciona las rutas cuyas respuestas derivaron.

```python
# main.py (continued)
    def replay(self):
        mismatches = []
        for call in self.transcript():
            st, payload = self.dispatch(call["method"], call["path"],
                                        body=call["body"])
            if (st, payload) != (call["status"], call["payload"]):
                mismatches.append(call["path"])
        return mismatches

fresh = MockAPI()
fresh.add("GET", "/health", lambda **kw: {"healthy": True, "version": "1.0.0"})
fresh.add("GET", "/users/<uid>",
          lambda **kw: {"user": {"id": kw["uid"], "name": "Ada", "role": "admin"}})
fresh.add("GET", "/search", lambda **kw: {"query": kw["params"].get("q", ""),
                                          "results": [f"result-{i+1}"
                                                      for i in range(int(kw["params"].get("limit", "1")))]})
fresh.dispatch("GET", "/api/v1/health")
fresh.dispatch("GET", "/api/v1/search?q=cats&limit=3")
fresh.dispatch("GET", "/api/v1/users/7")

print("replay:", fresh.replay())
```

`replay` re-envía cada *petición* registrada (con su cuerpo exacto) y compara la respuesta fresca con la registrada. Cero desajustes significa "el servidor aún se comporta exactamente como durante la ejecución" — tu prueba de regresión barata y determinista. (Una ruta flaky se voltea en un contador, así que reprodúcela en una instancia fresca o reinicia el contador — ese no-determinismo es el punto de probarla por separado.)

**🎯 Resultado esperado :** `replay: []`.

**🩹 Si sale mal :** Si una llamada de `search` desajusta, las cadenas del `limit` de consulta no están haciendo round-trip (int vs str). Si `users/7` desajusta, la respuesta depende del tiempo en vivo o de un global — congelalo.

### 5.3 Conéctalo en vivo (opcional)

**👟 Pista inicial :** Conecta el despachador a `http.server`: un `BaseHTTPRequestHandler` lee el cuerpo, llama a `dispatch` y escribe estado + JSON — servido en un puerto efímero para que nunca choque.

```python
# main.py (continued)
import json as _json, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

class Handler(BaseHTTPRequestHandler):
    api = None
    def dispatch_here(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        body = self.rfile.read(length).decode() if length else None
        status, payload = self.api.dispatch(self.command, self.path, body=body)
        data = _json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
    do_GET = dispatch_here
    do_POST = dispatch_here
    def log_message(self, *args): pass

Handler.api = fresh
server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
port = server.server_address[1]
threading.Thread(target=server.serve_forever, daemon=True).start()

import http.client
conn = http.client.HTTPConnection("127.0.0.1", port)
conn.request("GET", "/api/v1/health")
r = conn.getresponse()
print("GET /health ->", r.status, _json.loads(r.read()))
conn.request("POST", "/api/v1/echo", body=_json.dumps({"name": "Grace"}),
             headers={"Content-Type": "application/json"})
r = conn.getresponse()
print("POST /echo  ->", r.status, _json.loads(r.read()))
server.shutdown()
```

El puerto `0` le pide al SO un puerto libre, así que `serve_forever` nunca pelea contra un proceso existente. El handler refleja el contrato de `dispatch` — leer cuerpo, despachar, JSON-codificar el payload — así que el servidor en vivo y el despachador en proceso responden de manera idéntica. `log_message` se silencia para que la consola se mantenga limpia.

**🎯 Resultado esperado :**

```
GET /health -> 200 {'healthy': True, 'version': '1.0.0'}
POST /echo  -> 200 {'echo': {'name': 'Grace'}}
```

**🩹 Si sale mal :** Si hay `ConnectionRefusedError`, el hilo del servidor murió (una excepción dentro de `serve_forever`) o `shutdown()` corrió temprano. Si el cuerpo de un POST está vacío, el header `Content-Length` no llegó al handler — la mayoría de los clientes lo envían, algunas herramientas ad-hoc no.

### 5.4 Verifica el grabador

**✅ Lista de verificación**

- ✅ `transcript()` devuelve una copia profunda aislada de cada llamada registrada.
- ✅ `replay()` devuelve `[]` en un conjunto de rutas estable sin deriva.
- ✅ El handler en vivo devuelve exactamente el mismo JSON que devuelve el despachador en proceso.

**🤔 Pregunta(s) socrática(s)**

- Reproducir responde "¿cambió la respuesta?" pero no "¿es la respuesta *correcta*?". ¿Qué le permite afirmar a una prueba futura una transcripción que se envía como datos dorados, que un mock en vivo solo nunca puede — y cuál es el riesgo de que los datos dorados se vuelvan obsoletos?
- El handler en vivo re-lee `self.rfile` por petición. `ThreadingHTTPServer` sirve cada conexión en su propio hilo — ¿qué se rompe si dos llamadas de reproducción corren sobre `self._counter`, y sobreviviría limpiamente el estado por instancia de `BaseHTTPRequestHandler`?

## ⚠️ Errores comunes

- **Regex de rutas sin anclar.** `/users/<uid>` matcheada sin `^…$` también coincide con `/api/v1/users/42/orders` y produce una petición medio-capturada. Ancla siempre el patrón compilado.
- **Olvidar el método.** Coincidir solo la ruta deja que un `POST /health` golpee la ruta `GET /health`. Filtra por `route["method"] == method` *antes* del match de regex.
- **`parse_qs` devuelve listas.** `parse_qs("?limit=3")["limit"]` es `["3"]`, no `"3"`. Abre con `{k: v[0] …}` o el indexado rompe todo parse de múltiples valores.
- **Fallos falsos que colapsan.** Un `ZeroDivisionError` sin guardia dentro de una ruta tumba el hilo del handler. Deja que el try/except mapee las excepciones a un payload `422` — ese es el trabajo del mock.
- **Estado compartido en la reproducción.** El contador flaky es por ruta y monótono; un `replay()` que re-envía la tercera llamada flaky obtiene un 500 fresco. Prueba las rutas flaky en una instancia fresca.
- **Payloads no serializables.** `json.dumps` en `transcript()` y en el handler en vivo ambos se atragantan con un `datetime` o un int de numpy. Mantén los payloads en tipos Python planos.

## Lo que acabas de construir

Un servidor API local, determinista y de biblioteca estándar: plantillas de ruta compiladas en despachadores regex, params de ruta y de consulta fluyendo hacia las fábricas de respuesta, fallos simulados según un cronograma, cuerpos JSON reflejados y una transcripción completa de peticiones que se reproduce como comprobación de regresión. La idea central es que *un mock reemplaza un sistema externo con una promesa que tú controlas* — cada `(status, payload)` es dato, nunca una excepción sorpresa, así que tu código puede desarrollarse, demostrarse y probarse en regresión mucho antes de que exista el backend real. Intercambia la tabla de rutas por la URL base real después y el mismo cliente sigue funcionando, que es precisamente la costura que un mock está hecho para sostener.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/api-mock-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/api-mock-server) en el repositorio del curso es el servidor completo como notebook — plantillas de rutas, fallos flaky, el endpoint de eco, la reproducción de transcripción y el handler de cableado en vivo opcional, ejecutable en Colab/Kaggle/Binder. Clona el repositorio o [ábrelo en un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Agrega `latency_ms` a las rutas y haz que el despachador duerma antes de responder, para que las pruebas de reintento ejerciten tiempos de espera reales — luego registra las latencias medidas en la transcripción junto con el estado y el payload.
- Implementa una comprobación de `Content-Type` en `dispatch` que rechace cuerpos no-JSON con 415 en lugar de dejar que `json.loads` lance.
- Persiste la transcripción en un archivo JSON con `json.dump` al apagar y cárgala al arrancar, para que el grabador se vuelva datos de regresión que sobrevivan a los reinicios.
- Agrega un modo `record = True/False` para que una ejecución de grabación capture llamadas reales de API (vía `http.client`) y las reproduzca como mock después — el clásico proxy de grabar-y-reproducir.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓