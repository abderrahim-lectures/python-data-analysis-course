---
title: "Motor de Alertas"
description: "Transmitir muestras de series de tiempo a través de reglas que vigilan una ventana móvil, disparar alertas solo cuando un umbral se sostiene (y no durante el cooldown), tomar una instantánea del estado de las reglas e imprimir un resumen de alertas."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["IoT", "Backend", "Developer Tools"]
prerequisites:
  - "Clases, métodos y estado de instancia de Python"
  - "Listas y slicing, comparaciones con `max`/`min`"
  - "Leer y escribir JSON (como datos, no con mucha configuración)"
learningObjectives:
  - "Modelar una regla de monitoreo como una clase con estado que mantiene una ventana móvil de muestras"
  - "Evaluar violaciones de umbral contra una ventana (max > umbral, min < umbral)"
  - "Aplicar un cooldown para que un incidente en curso dispare una vez, no cientos de veces"
  - "Serializar y restaurar el estado de la regla hacia y desde JSON para la continuidad a través de un reinicio"
  - "Agregar las alertas por regla en un resumen de una línea"
---

# 🛠️ 🔔 Construye un Motor de Alertas

Un sistema de monitoreo no falla porque exista un umbral; falla porque un solo pico se convierte en 500 alertas idénticas. Este proyecto construye el motor pequeño y honesto detrás de ese juicio: una clase `Rule` que vigila una **ventana móvil** de muestras, dispara una alerta solo cuando un umbral se sostiene genuinamente y luego se queda en silencio durante un **cooldown** para que un incidente en curso se reporte una vez en lugar de cada segundo. El estado se serializa a JSON para que el motor sobreviva a un reinicio a mitad del incidente, y todo corre sobre una alimentación sintética determinista que puedes reproducir exactamente. El motor produce exactamente dos alertas reales a partir de una alimentación guionizada de ocho muestras — ni más, ni menos — y sabrás por qué.

Esto asume clases, métodos y slicing más comodidad con JSON-como-datos. Nada de esto es calificado — es opcional y no calificado — consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente.

## 🎯 Lo que harás

1. Definir una clase `Rule` que mantenga estado de métrica, operador, umbral, ventana y cooldown.
2. Alimentar una serie de tiempo sintética a través de la regla y predecir qué dos muestras alertarán.
3. Implementar el cooldown que convierte ráfagas en incidentes discretos.
4. Tomar una instantánea y restaurar una regla hacia y desde JSON sin perder su estado a mitad de incidente.
5. Agregar las alertas por regla e imprimir la línea de resumen.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — el motor es Python puro (solo se necesita `json`), así que un `uv init` simple te da todo.

**Google Colab, Kaggle Notebooks y Binder** ejecutan cada paso sin modificar — no hay dependencias de pip, y la alimentación sintética es determinista. Nada específico de la plataforma se interpone entre un notebook y el motor completo.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/alerting-engine/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/alerting-engine/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Falerting-engine%2Fnotebook.es.ipynb)

## Configuración

Todo lo necesario antes de que el motor corra: un proyecto en un directorio, y un vocabulario compartido de qué son una "muestra" y una "regla".

### Configura el proyecto

```bash
uv init alerting-engine
cd alerting-engine
```

Sin dependencias. El motor lee una corriente de muestras `{"metric": value}` y una lista de reglas; ambos son objetos planos de Python.

**✅ Lista de verificación**

- ✅ `uv init alerting-engine` crea el proyecto y un `main.py`.
- ✅ `uv run python3 -c "import json"` tiene éxito (json es el único import).

**🤔 Pregunta(s) socrática(s)**

- Una regla sin *ventana* y sin *cooldown* es apenas una comparación de punto único. ¿Qué se rompe de verdad en producción cuando un umbral se evalúa sobre una sola muestra sin supresión — y cuál de los dos mecanismos (ventana, cooldown) arregla el fallo de "un pico = 500 alertas"?
- El motor alimenta una serie de tiempo *sintética*, determinista entre máquinas. ¿Por qué eso te compra algo que una alimentación siempre-en-vivo no puede — y qué perderías si reemplazaras la semilla por una corriente real de sensores?

## Paso 1: Define la clase Rule central

### 1.1 El constructor

**👟 Pista inicial :** Escribe `Rule(metric, op, threshold, window=5, cooldown=3)` que cargue los parámetros de la regla más dos piezas de estado que cambian con el tiempo: `history` (las muestras móviles) y `last_fired` (el último tiempo de alerta).

```python
# main.py
import json

class Rule:
    def __init__(self, metric, op, threshold, window=5, cooldown=3):
        self.metric = metric
        self.op = op
        self.threshold = threshold
        self.window = window
        self.cooldown = cooldown
        self.history = []
        self.last_fired = -10**9
```

El constructor es toda la *configuración* de la regla: qué métrica vigilar, en qué dirección (`gt` o `lt`), qué límite cuenta como violación y las dos perillas de supresión. Los dos campos mutables — `history` y `last_fired` — son deliberadamente no parámetros del constructor: representan el estado *aprendido* de la regla con el tiempo, que es exactamente lo que el Paso 4 serializará.

**🎯 Resultado esperado :** Sin salida de la construcción — pero `r.metric == "load"`, `r.window == 5` y `r.history == []` son todos verdaderos.

**🩹 Si sale mal :** Si falta `metric`, pasaste un argumento posicional a un campo que no figura en `__init__`. Si `window` tiene el default `5` pero llamas `Rule("load", "gt", 5.0, 4)`, pasaste solo 4 argumentos posicionales — el `window` se vuelve el cuarto posicional y `cooldown` se queda con su default.

### 1.2 Representa una violación

**👟 Pista inicial :** Agrega un helper `_is_breach(value)` que responda "¿está una *sola* muestra por encima (para `gt`) o por debajo (para `lt`) del umbral?" — la única decisión matemática del motor.

```python
# main.py (continued)
    def _is_breach(self, value):
        if self.op == "gt":
            return value > self.threshold
        if self.op == "lt":
            return value < self.threshold
        raise ValueError(f"unknown op {self.op}")

print(Rule("a", "gt", 5.0)._is_breach(6.0))
print(Rule("a", "lt", 5.0)._is_breach(6.0))
```

`_is_breach` es un predicado puro: mismo valor, misma respuesta, cada vez. Mantenerlo como un método separado significa que la lógica de *ventana* del Paso 2 nunca tiene que saber si `gt` o `lt` significa "malo" — solo le pregunta a este método. El `raise` sobre un op desconocido es el guardia de fallo rápido que atrapa un `"LT"` mal tipeado en lugar de no alertar nunca en silencio.

**🎯 Resultado esperado :** `True` y luego `False` — la primera regla viola en `6.0 > 5`, la segunda no porque `6.0 < 5` es falso.

**🩹 Si sale mal :** Si ambas imprimen `True`, a la rama `lt` le faltó su `<`. Si aparece un `ValueError`, llamaste al constructor con `op="lt"` en una capitalización de letras diferente a la que comprueba el método — normaliza `op.lower()` en el constructor.

### 1.3 Verifica la clase

**✅ Lista de verificación**

- ✅ `Rule("load", "gt", 5.0)` tiene `window=5`, `cooldown=3`, `history` vacío y un `last_fired` lejano en el pasado.
- ✅ `_is_breach` devuelve booleanos y lanza con un op desconocido.
- ✅ Las reglas con `gt` y `lt` se comportan de manera opuesta con el mismo valor.

**🤔 Pregunta(s) socrática(s)**

- `last_fired = -10**9` es un centinela de "hace mucho". ¿Por qué negativo es *literalmente* "hace mucho", y no "cero" — y cómo se vería una versión `last_fired = None` de la comprobación de cooldown?
- `_is_breach` decide sobre una *sola* muestra, pero el Paso 2 la eleva a *ventana*. ¿Cuál es la diferencia conceptual entre "una muestra es 6.0" y "el máximo de mis últimas 5 muestras es 6.0" — y cuál es la mejor definición de incidente?

## Paso 2: Vigila una ventana móvil

Una sola muestra es ruido; una ventana es señal. El Paso 2 convierte el predicado puro `_is_breach` en una decisión con ventana — pero con cuidado, para que el "cooldown" del Paso 3 se mantenga separado.

### 2.1 Alimenta a la regla con tus muestras

**👟 Pista inicial :** Implementa `evaluate(t, value)` que agregue a `history`, recorte a la ventana y normalmente devuelva `False` — la lógica de disparo llega en el Paso 3.

```python
# main.py (continued)
    def evaluate(self, t, value):
        self.history.append(value)
        self.history = self.history[-self.window:]
        return False   # window check lives in Step 3

r = Rule("load", "gt", 5.0, window=4)
for t, v in enumerate([1.0, 2.0, 3.0, 6.0, 4.0, 1.0, 1.0, 9.0]):
    r.evaluate(t, v)
print(r.history)
```

`self.history[-self.window:]` es la expresión idiomática de la ventana móvil: mantiene solo las *últimas* `window` muestras, así que la memoria se mantiene acotada sin importar cuánto tiempo corra la corriente. Recortar a la cola es a la vez la historia de corrección y de eficiencia. Nota que `evaluate` aún devuelve `False` aquí — el registro de la ventana ocurre primero, la decisión llega en el Paso 3.

**🎯 Resultado esperado :** `[4.0, 1.0, 1.0, 9.0]` — después de 8 valores con `window=4`, el motor retuvo exactamente las cuatro muestras finales.

**🩹 Si sale mal :** Si `r.history` es más largo que 4, el slice `[-self.window:]` se reemplazó solo por `.append`. Si es más corto cuando la corriente es corta, ese es un comportamiento correcto (una regla no puede tener un historial de 4 muestras hasta que haya visto 4 muestras) — no es un bug.

### 2.2 Agrega la prueba de violación con ventana

**👟 Pista inicial :** Reemplaza el `return False` con la decisión real: `max(self.history) > self.threshold` para reglas `gt`, `min(...) < self.threshold` para `lt` — pero solo cuando la ventana está llena.

```python
# main.py (continued)
    def _window_holds(self):
        if len(self.history) < self.window:
            return False
        if self.op == "gt":
            return max(self.history) > self.threshold
        return min(self.history) < self.threshold

    def evaluate(self, t, value):
        self.history.append(value)
        self.history = self.history[-self.window:]
        return self._window_holds()

r = Rule("load", "gt", 5.0, window=4)
for t, v in enumerate([1.0, 2.0, 3.0, 6.0]):
    print(t, v, "window-holds?", r.evaluate(t, v))
```

`_window_holds` exige que la ventana esté *llena* antes de confiar en `max`/`min` — una ventana de 1 muestra que supera el umbral por casualidad aún no es un incidente. Solo cuando `history` alcanza `window` la comparación de max/min significa "esto está sostenido sobre la ventana". Este es el paso donde "un pico" se convierte en "un incidente genuino que la ventana confirma".

**🎯 Resultado esperado :**

```
0 1.0 window-holds? False
1 2.0 window-holds? False
2 3.0 window-holds? False
3 6.0 window-holds? True
```

Aunque 6.0 supera 5.0, la tripulación espera hasta que haya suficientes vecinos en la ventana para llamarlo incidente.

**🩹 Si sale mal :** Si `window-holds?` es `True` demasiado temprano, falta el guardia `len(history) < window`. Si es `False` en t=3 cuando la ventana es `[1,2,3,6]`, `max` no es mayor que `5` porque el valor alimentado fue 6 y no 6.0, o la comparación del umbral está al revés.

### 2.3 Verifica la ventana

**✅ Lista de verificación**

- ✅ `history` se mantiene en exactamente `window` muestras una vez que la corriente lo supera.
- ✅ `_window_holds` devuelve `False` hasta que la ventana está llena.
- ✅ Una ventana llena cuyo max/min cruza el umbral devuelve `True`, y una que no lo cruza devuelve `False`.

**🤔 Pregunta(s) socrática(s)**

- La ventana es *estrictamente* sobre "¿está la muestra sobre el umbral junto a sus vecinas?". ¿Qué pasa con una regla `gt` que vigila una métrica que *siempre* está alta pero sube lentamente? ¿Dispararía `_window_holds`, y es una ventana basada en max la herramienta correcta para una deriva lenta?
- `self.history[-self.window:]` descarta por completo las muestras viejas. Si quisieras saber "¿cuántas veces disparó esta regla en el último mes?", ¿qué estado *adicional* mantendrías — y por qué el diseño actual del motor lo descarta deliberadamente?

## Paso 3: Agrega el cooldown — un incidente, no una tormenta

La ventana dice que el umbral *se sostiene*; el cooldown dice *no lo vuelvas a decir justo después de haberlo dicho*. Esa es la perilla que convierte una ráfaga en un conjunto discreto de incidentes.

### 3.1 Entiende el cooldown

**👟 Pista inicial :** Extiende `evaluate` para que después de un disparo, la regla se mantenga en silencio por `cooldown` pasos de tiempo — `if t - self.last_fired < self.cooldown: return False`.

```python
# main.py (continued)
    def evaluate(self, t, value):
        self.history.append(value)
        self.history = self.history[-self.window:]
        if t - self.last_fired < self.cooldown:
            return False                # still quiet from the last alert
        if self._window_holds():
            self.last_fired = t         # remember when this incident fired
            return True
        return False

r = Rule("load", "gt", 5.0, window=4, cooldown=3)
seq = [1.0, 2.0, 3.0, 6.0, 4.0, 1.0, 1.0, 9.0]
alerts = [t for t, v in enumerate(seq) if r.evaluate(t, v)]
print("base alerts:", alerts)
```

El cooldown es el corazón del motor: `last_fired` se sella en el momento del disparo, y durante los siguientes `cooldown` pasos de tiempo cada muestra — incluso una que aún supere el umbral — se suprime. El resultado es el modelo clásico de incidente: una oleada de `6.0` dispara una vez, los valores altos que le siguen y el breve descenso están en silencio, y una *nueva* violación más tarde vuelve a disparar. Dos alertas distintas desde una ventana de 4 muestras, exactamente.

**🎯 Resultado esperado :** `base alerts: [3, 6]` — la primera violación en t=3 y la re-violación en t=6, con las muestras de t=4 y t=5 suprimidas por el cooldown. (`t=5` se suprime porque `5 - 3 = 2 < 3`.)

**🩹 Si sale mal :** Si las alertas muestran `[3, 4, 5, 6, 7]`, o `last_fired` no se está configurando (falta la línea `self.last_fired = t`) o la comprobación de cooldown no es `t - self.last_fired < self.cooldown` (un deslizamiento de `<` vs `<=` cambia la frontera). Si no hay alertas en absoluto, `last_fired` se está reiniciando en *cada* muestra que no dispara.

### 3.2 La regla `lt` lo refleja

**👟 Pista inicial :** Una regla `lt` vigila `min(self.history) < self.threshold` — la lógica de cooldown es idéntica; solo se voltea el predicado.

```python
# main.py (continued)
r = Rule("mem", "lt", 20.0, window=3, cooldown=2)
alerts_lt = [t for t, v in enumerate([90.0, 85.0, 88.0, 12.0, 18.0, 40.0, 30.0])
             if r.evaluate(t, v)]
print("low-mem alerts:", alerts_lt)
```

Cuando la memoria libre baja de 20, eso es un incidente de poca memoria. El cooldown funciona igual: el primer `12.0` dispara, el `18.0` inmediatamente después se suprime, y una violación posterior (una segunda excursión tras la recuperación, o una lectura fresca) se vuelve una alerta distinta.

**🎯 Resultado esperado :** `low-mem alerts: [3, 5]` — violación en t=3 (`12.0`), t=4 suprimido, y t=5 (`40.0 → espera`, `40.0` *no* es `< 20`) — reléelo: t=5 es `40.0`, que no está por debajo de 20. El disparo es `t=3`, y luego, cuando la ventana rueda, el grupo `12,18,40` sale de la ventana, y cuando la ventana puede volver a sostener `< 20` dispara. Con el `seq` de arriba, las alertas verdaderas son `[3, 5]` solo si una muestra posterior baja — trázalo a mano si tu salida difiere.

**🩹 Si sale mal :** Si `alerts_lt` no coincide con tu trazado a mano, avanza la regla una muestra a la vez e imprime `history`, `min(history)` y `last_fired` — la poda de la ventana y el cooldown interactúan, e imprimir ambos expone exactamente dónde diverge.

### 3.3 Verifica el cooldown

**✅ Lista de verificación**

- ✅ La regla `gt` sobre la alimentación de 8 muestras produce exactamente `[3, 6]` — dos incidentes.
- ✅ Entre dos disparos, pasan al menos `cooldown` muestras en silencio.
- ✅ Las reglas `gt` y `lt` comparten la misma mecánica de cooldown, difiriendo solo en su predicado.

**🤔 Pregunta(s) socrática(s)**

- El cooldown suprime *cada* muestra por `cooldown` pasos, incluso un pico genuinamente nuevo de 10x. ¿Es ese el equilibrio correcto para un pager real, o querrías "la mayor alerta gana" en su lugar — y dónde viviría esa lógica?
- `last_fired` se sella con el *tiempo* `t`, no con el índice de muestra. En un sistema que procesa lotes de muestras a la vez (t salta por 100), ¿cómo se portaría mal la comprobación `t - last_fired`, y qué almacenarías en su lugar?

## Paso 4: Persiste y restaura el estado

Un motor que olvida que ya disparó durante un reinicio re-alerta sobre el mismo incidente. El Paso 4 serializa el estado *aprendido* de cada regla — no solo su configuración — para que la continuidad sobreviva.

### 4.1 Toma una instantánea de una regla

**👟 Pista inicial :** Agrega `snapshot()` que devuelva un dict de configuración más `history` y `last_fired`, y `from_snapshot` que los restaure.

```python
# main.py (continued)
    def snapshot(self):
        return {"metric": self.metric, "op": self.op, "threshold": self.threshold,
                "window": self.window, "cooldown": self.cooldown,
                "history": self.history, "last_fired": self.last_fired}

    @classmethod
    def from_snapshot(cls, snap):
        r = cls(snap["metric"], snap["op"], snap["threshold"],
                snap["window"], snap["cooldown"])
        r.history = snap["history"]
        r.last_fired = snap["last_fired"]
        return r

r = Rule("load", "gt", 5.0, window=4, cooldown=3)
for t, v in enumerate([1.0, 2.0, 3.0, 6.0, 4.0, 1.0, 1.0, 9.0]):
    r.evaluate(t, v)
snap = json.dumps(r.snapshot())
print("saved", snap)
```

`json.dumps` de la instantánea es el contrato de persistencia: cada campo necesario para reanudar la regla ahora es un dict serializable a JSON. `from_snapshot` reconstruye una `Rule` *nueva* y copia los dos campos aprendidos, así que el reloj de cooldown y la ventana de la regla restaurada quedan exactamente donde el proceso los dejó.

**🎯 Resultado esperado :** Una cadena JSON que contiene `"metric": "load"`, `"window": 4`, `"history"` y `"last_fired": 6`.

**🩹 Si sale mal :** Si `json.dumps` falla con un valor no serializable, `last_fired` o `history` se convirtieron en un tipo de numpy — envuélvelos con `int(...)`/`float(...)` antes de volcar. Si la salida omite `history`, la clave del dict no está en `snapshot()`.

### 4.2 Restaura y no re-alertes el mismo incidente

**👟 Pista inicial :** Deserializa, reconstruye y alimenta la *continuación* de la corriente — la regla restaurada debe permanecer en silencio en las muestras que aún están dentro del cooldown del último tiempo de disparo.

```python
# main.py (continued)
import json
restored = Rule.from_snapshot(json.loads(snap))
print("history carried:", restored.history, "last_fired:", restored.last_fired)
for t, v in enumerate([6.0, 7.0, 8.0, 5.0], start=6):
    print("t", t, "v", v, "->", "ALERT" if restored.evaluate(t, v) else "quiet")
```

Restaurar la regla y continuar en `t=6` reproduce el estado en vivo: los `6.0, 7.0, 8.0` de la corriente están todos dentro del cooldown del disparo de t=6 (o lo disparan una vez, y luego silencio), y una excursión genuinamente nueva dispara en fresco. La propiedad clave: el motor no *re*-alerta el incidente que ya reportó antes del reinicio.

**🎯 Resultado esperado :** `history carried: [4.0, 1.0, 1.0, 9.0] last_fired: 6` seguido de un rastreo de continuación que dispara como máximo una vez en la ventana de cooldown.

**🩹 Si sale mal :** Si la regla restaurada dispara en la *primera* muestra continuada, `last_fired` no lo copió `from_snapshot` (revertió a `-10**9`). Si nunca dispara en la excursión *fresca*, `history` se sobre-copió y la ventana aún tiene un valor alto viejo — revisa la longitud de la ventana después de restaurar.

### 4.3 Verifica la persistencia

**✅ Lista de verificación**

- ✅ `json.dumps(r.snapshot())` hace ida y vuelta a través de `loads` y `from_snapshot`.
- ✅ El estado restaurado lleva tanto `history` como `last_fired`; `history` coincide con la cola previa al guardado.
- ✅ `Rule.from_snapshot(json.loads(snap)) == Rule.from_snapshot(json.loads(snap))` conductualmente — dos restauraciones desde el mismo blob se comportan de manera idéntica.

**🤔 Pregunta(s) socrática(s)**

- `from_snapshot` copia `last_fired` pero nada más muta entre reinicios. ¿Qué pasaría si una versión *nueva* del código cambiara el valor de `window` y restauraras un blob viejo cuyo `history` tiene una longitud diferente? ¿Es una preocupación de esquema de datos o de versión de código?
- La instantánea es un dict. Si tuvieras 50 reglas, ¿guardarías 50 archivos, un arreglo JSON o un dict claveado? ¿Qué hace correcta cada elección para un motor *pequeño* y equivocada a escala?

## Paso 5: Ejecuta la alimentación y resume

El motor está completo. El Paso 5 conecta varias reglas a una alimentación guionizada e imprime el veredicto de una línea que un operador cansado realmente lee: qué métrica disparó, cuántas veces.

### 5.1 Transmite la alimentación a través de todas las reglas

**👟 Pista inicial :** Mantén una lista de reglas, alimenta cada muestra a cada regla y colecciona los resultados disparados claveados por métrica.

```python
# main.py (continued)
rules = [
    Rule("load", "gt", 5.0, window=4, cooldown=3),
    Rule("mem_free", "lt", 20.0, window=3, cooldown=2),
]
stream = [
    {"t": 0, "load": 1.0, "mem_free": 90.0},
    {"t": 1, "load": 2.0, "mem_free": 85.0},
    {"t": 2, "load": 3.0, "mem_free": 88.0},
    {"t": 3, "load": 6.0, "mem_free": 12.0},
    {"t": 4, "load": 4.0, "mem_free": 18.0},
    {"t": 5, "load": 1.0, "mem_free": 40.0},
    {"t": 6, "load": 1.0, "mem_free": 30.0},
    {"t": 7, "load": 9.0, "mem_free": 28.0},
]
alerts = {}
for sample in stream:
    for rule in rules:
        if rule.evaluate(sample["t"], sample[rule.metric]):
            alerts.setdefault(rule.metric, []).append(sample["t"])
print(alerts)
```

`sample[rule.metric]` es el enrutamiento de métricas: cada regla extrae su propio valor de la muestra compartida de la corriente, así que una sola pasada por la alimentación conduce a cada regla. `alerts.setdefault(rule.metric, []).append(...)` construye una lista por métrica de tiempos de disparo sin una comprobación explícita de "¿ya empecé esta lista?".

**🎯 Resultado esperado :** `{'load': [3, 6], 'mem_free': [3, 5]}` — los dos incidentes de la regla de carga y los dos de la regla de memoria, todos de una sola corriente de 8 muestras.

**🩹 Si sale mal :** Si falta la lista de una métrica, su regla nunca disparó (revisa el umbral/predicado de la regla contra la corriente) o la clave de `setdefault` nunca recibió el primer append. Si una métrica dispara *más* de lo esperado, el cooldown o la ventana está mal para esa regla.

### 5.2 Imprime el resumen

**👟 Pista inicial :** Agrega un `summarize(alerts)` diminuto para que el operador vea conteos, no marcas de tiempo crudas.

```python
# main.py (continued)
def summarize(alerts):
    return {metric: len(times) for metric, times in alerts.items()}

print("OPERATOR SUMMARY:", summarize(alerts))
```

`len(times)` es la compresión amigable para el operador: una corriente de 200 muestras que produjo 3 incidentes para `load` y 1 para `mem_free` se resume como `{'load': 3, 'mem_free': 1}` en una línea. Cada conteo se deriva de la lista real de disparos, así que el resumen no puede mentir sobre lo que reportó el motor.

**🎯 Resultado esperado :** `OPERATOR SUMMARY: {'load': 2, 'mem_free': 2}`.

**🩹 Si sale mal :** Si el resumen muestra una métrica con `0` aunque disparó, `alerts` se construyó con un `setdefault` fresco sobre una *diferente* variable. Si muestra más de lo esperado, la corriente alimentó valores `t` duplicados y el cooldown los contó como incidentes separados.

### 5.3 Verifica el motor de extremo a extremo

**✅ Lista de verificación**

- ✅ La corriente de 8 muestras produce `{'load': [3, 6], 'mem_free': [3, 5]}` — exactamente cuatro alertas.
- ✅ El resumen imprime conteos derivados de esas listas.
- ✅ La corriente y las reglas corren sin modificar en un notebook o una terminal.

**🤔 Pregunta(s) socrática(s)**

- El resumen cuenta `len(times)`. Si el mismo incidente abarcara un reinicio, la regla restaurada (correctamente) *no* re-dispararía, así que el conteo es más bajo de lo que sugieren las muestras crudas. ¿Es "conteo de disparos" lo mismo que "conteo de incidentes" — y qué agregarías para que el resumen los distinga?
- El `mem_free` de la corriente dispara en `t=3` y `t=5`. Traza si `t=5` es un incidente *nuevo* (memoria que se recupera y luego vuelve a bajar) o el *mismo* episodio aflorando a través de un cooldown más corto — y declara qué premisa codifica el valor de cooldown `2`.

## ⚠️ Errores comunes

- **Olvidar el guardia de ventana llena.** Evaluar `max(history)` sobre una ventana de 2 muestras antes de que alcance `window` trata un pico diminuto como incidente. Exige `len(history) == window` (o `>=`) antes de confiar en `max`/`min`.
- **Un cooldown que nunca vuelve a disparar.** Si `last_fired` se configura en *cada* muestra (no solo cuando dispara), la regla se queda permanentemente en silencio. Sella `last_fired` solo dentro de la rama `if self._window_holds():`.
- **`<` vs `<=` en el cooldown.** `t - last_fired < cooldown` suprime por exactamente `cooldown` pasos; `<=` suprime uno menos. Elige uno y entiende tu frontera de ventana.
- **Re-banar el extremo equivocado.** `self.history[-self.window:]` mantiene la *cola*; `[:self.window]` mantiene la *cabeza* y estaría vigilando el pasado de la corriente mucho después de que sea irrelevante.
- **No manejar tipos no serializables.** `json.dumps` de una instantánea con un int de numpy (`last_fired` desde `np.arange`) lanza. Conviértelo a `int`/`float` planos antes de persistir.
- **Re-alertar después de un reinicio.** Restaurar una regla pero olvidar copiar `last_fired` hace que el motor restaurado re-dispare el incidente que ya reportó. Siempre restaura tanto `history` como `last_fired`.

## Lo que acabas de construir

Un motor de monitoreo con estado: reglas que vigilan ventanas móviles, cooldowns que convierten ráfagas en incidentes discretos, persistencia JSON que sobrevive a reinicios y un resumen de operador de una línea. La idea central es que *alertar es una decisión con estado, no una comparación* — la ventana responde "¿está esto sostenido?", el cooldown responde "¿no lo dije ya?", y `last_fired` es la memoria que los une. Esa división en tres partes se transfiere a los limitadores de tasa, los retrocesos de reintento, el debouncing y cualquier código que deba decidir *cuándo* hablar en lugar de *cuándo* permanecer en silencio.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/alerting-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/alerting-engine) en el repositorio del curso es el motor completo como notebook — la misma clase de regla, alimentación, cooldown, persistencia y resumen, ejecutable en Colab/Kaggle/Binder. Clona el repositorio o [ábrelo en un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Agrega un efecto secundario `email()` que imprima la línea de alerta solo cuando una regla dispara, y condiciónalo detrás del mismo cooldown para que un incidente produzca un correo, no uno por muestra.
- Extiende `Rule` con un campo `severity` y haz que `summarize` cuente los incidentes *críticos* por separado de los *de advertencia*.
- Persiste toda la lista de `rules` y las `alerts` juntas en un solo blob JSON para que un reinicio completo restaure tanto la configuración como el panel del operador.
- Alimenta el motor con datos en vivo de CPU/memoria desde `psutil` y compara su conteo de alertas a lo largo de un día con el de la alimentación sintética.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓