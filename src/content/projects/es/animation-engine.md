---
title: "Motor de Animación"
description: "Componer puntos en movimiento: matemática de easing, sprites con velocidad y rebotes contra las paredes en una cuadrícula de lienzo, un motor de timestep fijo, trayectorias de movimiento con keyframes y exportaciones de fotogramas que puedes reproducir como una tira de película."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Creative", "Frontend", "Utility"]
prerequisites:
  - "Clases, métodos y estado de instancia de Python"
  - "Matemática: aritmética simple, clamping, razones"
  - "Leer y escribir archivos de texto"
learningObjectives:
  - "Modelar el easing con una curva smoothstep e interpolar entre números con lerp"
  - "Simular movimiento con velocidad e integración basada en dt, más rebotes contra paredes"
  - "Componer sprites en una cuadrícula 2D y renderizar escenas como fotogramas de texto"
  - "Seguir una trayectoria con keyframes mediante interpolación temporal con easing"
  - "Exportar una secuencia de fotogramas a archivos y reconstruir la tira de película a partir de ellos"
---

# 🛠️ 🎬 Construye un Motor de Animación

La animación parece magia porque cada fotograma es simple; la magia está en la *matemática de backstage* que conecta fotograma con fotograma. Este proyecto construye ese backstage en Python puro: easing `smoothstep` entre dos números, sprites que portan velocidad y rebotan contra las paredes de un lienzo de 30×10, un motor de timestep fijo que avanza toda la escena cada fotograma, trayectorias con keyframes e interpolación con easing, y fotogramas exportados como archivos de texto que puedes reproducir. El motor corre de manera determinista — los mismos puntos caen en las mismas celdas cada vez — así que puedes verificar cada afirmación de esta guía antes de hacer bailar a los puntos. Es un motor que prioriza el texto: el "video" es una pila de fotogramas `.txt` que puedes pegar en cualquier lugar.

Esto asume clases y métodos más aritmética básica con flotantes. Es un proyecto opcional y no calificado — consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Escribir los helpers de matemática: `clamp`, `lerp` y una curva de easing smoothstep.
2. Definir un `Sprite` que se mueve con velocidad y rebota contra los bordes del lienzo.
3. Construir una `Scene` que renderiza sprites en una cuadrícula de texto, y un `Engine` que avanza e imprime fotogramas.
4. Agregar trayectorias de movimiento con keyframes para que un sprite haga easing a lo largo de una ruta en lugar de derivar.
5. Exportar los fotogramas a archivos y reensamblarlos como una tira de película.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — el motor es Python puro (solo se necesita `pathlib`), así que `uv init` te da todo.

**Google Colab, Kaggle Notebooks y Binder** ejecutan cada paso sin modificar — el lienzo y el easing son solo matemática y cadenas, sin llamadas específicas de plataforma, y un notebook celda por celda se ajusta bien al diseño fotograma por fotograma.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/animation-engine/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/animation-engine/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fanimation-engine%2Fnotebook.ipynb)

## Configuración

Todo lo necesario antes de que exista el primer fotograma.

### Configura el proyecto

```bash
uv init animation-engine
cd animation-engine
```

Sin dependencias. El lienzo es una cuadrícula de cadenas; la exportación escribe archivos de texto plano.

**✅ Lista de verificación**

- ✅ `uv init animation-engine` crea el proyecto y un `main.py`.
- ✅ `uv run python3 -c "from pathlib import Path"` tiene éxito (pathlib es el único import).

**🤔 Pregunta(s) socrática(s)**

- Un lienzo de puntos con un personaje en movimiento es aburrido — pero todo motor de renderizado, desde este hasta el cine, es apenas "una cuadrícula, actualizada a una tasa fija". ¿Qué hace que la *matemática* entre actualizaciones, y no la cuadrícula, sea el motor real?
- El proyecto funciona en un notebook, y sin embargo exportas fotogramas como archivos de texto. ¿Qué te compra una *película* de 10 filas de puntos que un bucle de renderizado en vivo no puede — y qué perderías yendo en la dirección contraria?

## Paso 1: La matemática detrás del movimiento

Toda animación se reduce a preguntas numéricas diminutas: "mover de 0 a 10, pero ¿qué tan lejos voy a la mitad del camino?" El paso 1 escribe las tres respuestas que reutilizarás en todas partes.

### 1.1 Clamp, lerp y smoothstep

**👟 Pista inicial :** Escribe `clamp(v, lo, hi)`, `lerp(a, b, t)` y `smoothstep(t)` — la última es la célebre curva ease-in-out `t²·(3 − 2t)`.

```python
# main.py
def clamp(v, lo, hi):
    return max(lo, min(hi, v))

def lerp(a, b, t):
    return a + (b - a) * t

def smoothstep(t):
    t = clamp(t, 0.0, 1.0)
    return t * t * (3 - 2 * t)

print("clamp(13, 0, 10)  =", clamp(13, 0, 10))
print("lerp(0, 10, 0.5)   =", lerp(0, 10, 0.5))
print("smoothstep(0, .25, .5, .75, 1):",
      smoothstep(0), smoothstep(0.25), smoothstep(0.5), smoothstep(0.75), smoothstep(1))
```

`lerp(a, b, t)` es el caballo de batalla: en `t=0` estás en `a`, en `t=1` en `b`, y linealmente en el medio. `smoothstep` es la personalidad del easing: sigue mapeando 0→0 y 1→1, pero gasta la mitad del movimiento *rápido* y el principio y el final *lentos* — `smoothstep(0.5)` devuelve exactamente `0.5`, y sin embargo `smoothstep(0.25)` es solo `0.15625`, así que se demora y luego se pone al día. Esa asimetría es lo que hace que el movimiento con easing se sienta vivo en lugar de mecánico.

**🎯 Resultado esperado :**

```
clamp(13, 0, 10)  = 10
lerp(0, 10, 0.5)   = 5.0
smoothstep(0, .25, .5, .75, 1): 0.0 0.15625 0.5 0.84375 1.0
```

**🩹 Si sale mal :** Si `smoothstep(0.5)` no es `0.5`, revisa el exponente — `t*t*(3-2*t)` y no `t*t*t`. Si los valores se imprimen como `0` sin decimales, los argumentos eran `int`s y la división entera se coló en alguna parte — alimenta flotantes.

### 1.2 Haz easing a toda una trayectoria

**👟 Pista inicial :** Encadena `smoothstep` dentro de `lerp` para que un movimiento siga la curva en lugar de una línea recta.

```python
# main.py (continued)
def eased_lerp(a, b, t):
    return lerp(a, b, smoothstep(t))

print("eased_lerp(0, 10, .5) =", eased_lerp(0, 10, 0.5))
print("eased_lerp(0, 10, .25) =", eased_lerp(0, 10, 0.25))
```

`eased_lerp` coincide con la muestra de smoothstep de arriba: en `t=0.25` solo has cubierto `1.5625` del tramo de 10 unidades, no 2.5. El punto arranca lento, acelera en la mitad y desacelera al final.

**🎯 Resultado esperado :**

```
eased_lerp(0, 10, .5) = 5.0
eased_lerp(0, 10, .25) = 1.5625
```

**🩹 Si sale mal :** Si `eased_lerp(0, 10, .25)` imprime `2.5`, llamaste a `lerp(a, b, t)` directamente, saltándote el easing.

### 1.3 Verifica la matemática

**✅ Lista de verificación**

- ✅ `clamp(13, 0, 10) == 10`, `clamp(-4, 0, 10) == 0`.
- ✅ `smoothstep` mapea 0→0, 1→1, 0.5→0.5 y es simétrica alrededor de la mitad.
- ✅ `eased_lerp` y los números puros de `smoothstep` coinciden.

**🤔 Pregunta(s) socrática(s)**

- `smoothstep` es simétrica: `smoothstep(0.25) == 1 - smoothstep(0.75)` (aquí `0.84375`). ¿Qué movimiento del mundo real se siente así — acelerar, navegar, frenar — y qué curva elegirías en su lugar para un *lanzamiento*, donde el arranque es rápido y el aterrizaje es un golpe?
- `clamp(t, 0, 1)` dentro de `smoothstep` arregla en silencio la entrada fuera de rango. ¿Por qué arreglar-en-silencio está bien para el easing de un punto, pero es peligroso si el mismo clamp ocultara un bug en, digamos, la animación *de un dial crítico para la seguridad*?

## Paso 2: Sprites — cosas que se mueven

La matemática mueve números; los sprites mueven *cosas*. El paso 2 le da a cada cosa una posición, una velocidad y un carácter, y dice "avánzame `dt` segundos".

### 2.1 La clase Sprite

**👟 Pista inicial :** Escribe `Sprite(ch, x, y, vx=0.0, vy=0.0)` con un `update(dt)` que integra la posición: `x += vx · dt`.

```python
# main.py (continued)
class Sprite:
    def __init__(self, ch, x, y, vx=0.0, vy=0.0):
        self.ch = ch
        self.x, self.y = float(x), float(y)
        self.vx, self.vy = float(vx), float(vy)

    def update(self, dt):
        self.x += self.vx * dt
        self.y += self.vy * dt

s = Sprite("o", 0.0, 5.0, vx=4.0)
for _ in range(5):
    s.update(0.125)
print(round(s.x, 3), round(s.y, 3))
```

`x += vx * dt` es integración de Euler: la posición avanza por la velocidad por el tiempo transcurrido. `dt` pequeño = movimiento suave; `dt` es el timestep fijo que estandarizarás en el paso 3. La posición se mantiene como flotante aquí y solo se ajusta a las celdas de la cuadrícula al renderizar — ese flotante es la verdad "entre fotogramas" que la cuadrícula no puede contener.

**🎯 Resultado esperado :** `2.5 5.0` — cinco pasos de `0.125s` a `4 unidades/s` recorren `5 × 0.5 = 2.5` unidades, exactamente.

**🩹 Si sale mal :** Si la salida es `0.0 5.0`, `update` nunca corrió (bucle mal indentado) o nunca se configuró `vx`. Si es `40.0`, `dt` era `1.0` — pasaste el *conteo* de fotogramas como tiempo.

### 2.2 Rebotes contra paredes

**👟 Pista inicial :** Agrega límites fijos de lienzo (`W=30, H=10`) a `Sprite`; en `update`, ajusta la posición y revierte la velocidad al contactar.

```python
# main.py (continued)
class Sprite:
    W, H = 30, 10

    def __init__(self, ch, x, y, vx=0.0, vy=0.0):
        self.ch = ch
        self.x, self.y = float(x), float(y)
        self.vx, self.vy = float(vx), float(vy)

    def update(self, dt):
        self.x += self.vx * dt
        self.y += self.vy * dt
        self.x = clamp(self.x, 0.0, self.W - 1)
        self.y = clamp(self.y, 0.0, self.H - 1)
        if self.x == 0.0 or self.x == self.W - 1:
            self.vx = -self.vx
        if self.y == 0.0 or self.y == self.H - 1:
            self.vy = -self.vy

b = Sprite("*", 15.0, 2.0, vy=2.0)
for step in range(8):
    b.update(0.125)
    if step in (4, 7):
        print("step", step + 1, "y =", round(b.y, 3), "vy =", b.vy)
```

El clamping mantiene el sprite en el lienzo; probar *igualdad* con `0.0` o `W-1` voltea la velocidad exactamente una vez por contacto. El `*` baja desde `y=2.0`, y como recorre `0.25` unidades por fotograma, llega al suelo (`y=9`) limpiamente y se voltea a subir.

**🎯 Resultado esperado :**

```
step 5 y = 3.25 vy = 2.0
step 8 y = 4.0 vy = 2.0
```

(El rebote aterriza más tarde en el recorrido — la escena del paso 3 lo muestra.)

**🩹 Si sale mal :** Si `y` se detiene en `9.0` para siempre, `vy` se voltea pero luego se voltea *de nuevo* el siguiente fotograma — la comprobación de igualdad se activa cada fotograma mientras descansa contra la pared. La posición debe salir de la pared antes de que la comprobación se rearme (así es aquí, porque la velocidad se revierte).

### 2.3 Verifica el sprite

**✅ Lista de verificación**

- ✅ `Sprite("o", 0, 5, vx=4)` avanza `2.5` después de cinco pasos de `0.125`.
- ✅ Un sprite con `vx` negativa se mueve a la izquierda y limita en `x=0`.
- ✅ Al contactar una pared la velocidad se voltea exactamente una vez, y el sprite viaja de regreso hacia adentro.

**🤔 Pregunta(s) socrática(s)**

- El sprite solo colisiona con paredes, no con *otros* sprites. ¿Qué prueba extra necesita la colisión de dos sprites que la de pared no — y cuál de `x == 0` vs `abs(x - wall) < eps` querrías para ella?
- La posición es un flotante; el renderizado ajusta a celdas. Si la velocidad es `1` y `dt` es `0.125`, el punto parece "saltarse" cada 8 fotogramas. ¿Es suave o dentado a 8fps — y qué dos perillas podrías girar para hacerlo más suave?

## Paso 3: Escenas y el bucle del motor

Un solo sprite es un rebote. Muchos sprites en una cuadrícula, avanzados juntos a una tasa fija, es una animación. El paso 3 agrega la `Scene` (cuadrícula + sprites) y el `Engine` (controlador de timestep fijo).

### 3.1 Renderiza una escena a texto

**👟 Pista inicial :** Escribe `Scene.render()` que devuelva una lista de cadenas — una cuadrícula llena de puntos con cada sprite estampado en su celda (redondeada).

```python
# main.py (continued)
class Scene:
    def __init__(self, W=30, H=10):
        self.W, self.H = W, H
        self.sprites = []

    def add(self, sprite):
        sprite.W, sprite.H = self.W, self.H
        self.sprites.append(sprite)
        return self

    def step(self, dt):
        for sprite in self.sprites:
            sprite.update(dt)

    def render(self):
        grid = [["."] * self.W for _ in range(self.H)]
        for sprite in self.sprites:
            gx, gy = int(sprite.x + 0.5), int(sprite.y + 0.5)
            grid[gy][gx] = sprite.ch
        return ["".join(row) for row in grid]

scene = Scene()
scene.add(Sprite("o", 0.0, 5.0, vx=4.0))
print("\n".join(scene.render()))
```

`int(x + 0.5)` es el ajuste de redondeo-a-la-mitad-hacia-arriba: los flotantes en el límite de la pared aterrizan en la celda más cercana de manera determinista. `Scene.add` asigna su propio `W`/`H` a cada sprite para que los límites de rebote siempre coincidan con el lienzo, sin importar con qué se construyó el sprite.

**🎯 Resultado esperado :**

```
..............................
..............................
..............................
..............................
..............................
o.............................
..............................
..............................
..............................
..............................
```

**🩹 Si sale mal :** Si `o` está en otra parte, su `y` no es `5.0`. Si la cuadrícula muestra 10 filas de 30 puntos, la escena está bien — ese es el lienzo vacío.

### 3.2 El motor de timestep fijo

**👟 Pista inicial :** Escribe `Engine(scene, fps=8)` cuyo `play(frames)` avanza la escena por `dt = 1/fps` y devuelve una lista de fotogramas renderizados.

```python
# main.py (continued)
class Engine:
    def __init__(self, scene, fps=8):
        self.scene = scene
        self.fps = fps
        self.dt = 1.0 / fps

    def play(self, frames):
        out = []
        for _ in range(frames):
            self.scene.step(self.dt)
            out.append(self.scene.render())
        return out

scene = Scene().add(Sprite("o", 0.0, 5.0, vx=4.0)).add(Sprite("*", 15.0, 2.0, vy=2.0))
frames = Engine(scene).play(12)
print("\n".join(frames[4]))
print("-" * 30)
print("\n".join(frames[11]))
```

`play` es todo el carrete: `fps` fija `dt`, así que 8 fotogramas = 1 segundo, y la misma escena reproducida con los mismos parámetros produce los mismos fotogramas — determinismo que puedes probar. El fotograma 5 es justo antes y el fotograma 12 es un momento emblemático para ambos sprites.

**🎯 Resultado esperado :** el fotograma 5 (`frames[4]`) muestra `o` en la columna 3 (después de `4 × 0.5 = 2.0 → 2.5 → ajusta a 3`) y `*` en la fila 3; el fotograma 12 (`frames[11]`) muestra `o` en la columna 6 y `*` en la fila 5.

**🩹 Si sale mal :** Si los dos sprites se superponen en una celda inesperada, uno de ellos tiene una contradicción en la dirección de la velocidad. Si los fotogramas vuelven obsoletos, `scene.step` está mutando una copia de la escena, no el mismo objeto.

### 3.3 Verifica el motor

**✅ Lista de verificación**

- ✅ `play(12)` con la escena de arriba devuelve 12 fotogramas; el fotograma 5 y el 12 coinciden con las columnas/filas esperadas.
- ✅ `Engine(scene, fps=8).dt == 0.125`.
- ✅ Ejecutar `play` dos veces sobre una escena fresca produce fotogramas byte-idénticos.

**🤔 Pregunta(s) socrática(s)**

- `dt` es `1/fps`, pero el bucle avanza la escena y luego imprime. Una vez que avanzaste, ¿el fotograma 1 es "el estado después de 0.125s" o "en el tiempo 0"? Elige la semántica y defiende el off-by-one que adoptaste.
- El motor devuelve los fotogramas como una lista, nunca los imprime. ¿Por qué el *dato* (fotogramas) es el producto aquí, y la *pantalla* solo un consumidor — qué te permite reemplazar luego esa separación?

## Paso 4: Trayectorias con keyframes

La velocidad te da líneas rectas y rebotes. La animación real bloquea el movimiento en *keyframes* — poses en momentos elegidos — y llena los intermedios con interpolación con easing. El paso 4 agrega el seguidor de trayectoria.

### 4.1 Muestrea a lo largo de una trayectoria

**👟 Pista inicial :** Escribe `Keyframed(ch, keys)` donde `keys` es una lista de paradas `(t, (x, y))`; `sample(t)` encuentra el segmento que contiene `t` y aplica easing a través de él.

```python
# main.py (continued)
class Keyframed:
    def __init__(self, ch, keys):
        self.ch = ch
        self.keys = keys
        self.x, self.y = keys[0][1]

    def sample(self, t):
        for i in range(len(self.keys) - 1):
            t0, p0 = self.keys[i]
            t1, p1 = self.keys[i + 1]
            if t0 <= t <= t1:
                u = smoothstep((t - t0) / (t1 - t0))
                self.x = lerp(p0[0], p1[0], u)
                self.y = lerp(p0[1], p1[1], u)
                return (self.x, self.y)
        return self.keys[-1][1]

node = Keyframed("A", [(0.0, (0, 0)), (1.0, (10, 2)), (2.0, (10, 8))])
print("t=0.5 ", node.sample(0.5))
print("t=1.0 ", node.sample(1.0))
print("t=2.0 ", node.sample(2.0))
```

El escaneo de segmentos encuentra los dos keyframes que encierran a `t`, reescala `t` dentro de ese segmento (`u`), aplica easing a `u` y hace lerp de ambas coordenadas. Una trayectoria es *dato* — una lista de `(tiempo, posición)` — y `sample` es la función pura que convierte el tiempo en una pose. Después de `t=1.0` la ruta se dobla de moverse-a-la-derecha a moverse-hacia-abajo, y `sample` maneja el traspaso.

**🎯 Resultado esperado :**

```
t=0.5  (5.0, 1.0)
t=1.0  (10.0, 2.0)
t=2.0  (10.0, 8.0)
```

**🩹 Si sale mal :** Si `t=0.5` devuelve `(5.0, 0.0)`, el segmento `y` cruzó keyframes demasiado temprano. Si las muestras después de `t=2.0` dan error, `sample` cae a `self.keys[-1][1]` solo cuando el bucle no encuentra ningún segmento — confirma que el tiempo del keyframe final es `2.0`, no `< 2.0`.

### 4.2 Renderiza una trayectoria como carrete

**👟 Pista inicial :** Haz bucle `t = 0 … 2` al `dt` del motor, muestrea la trayectoria, estampa el nodo en una cuadrícula fresca y colecciona fotogramas.

```python
# main.py (continued)
frames = []
for f in range(17):
    _x, _y = node.sample(f * 0.125)
    grid = [["."] * 30 for _ in range(10)]
    grid[int(_y + 0.5)][int(_x + 0.5)] = node.ch
    frames.append(["".join(r) for r in grid])

print("\n".join(frames[0]))
print("-" * 30)
print("\n".join(frames[16]))
```

El fotograma 0 es la pose en `t=0`: `A` en la esquina superior izquierda. El fotograma 17 es `t=2.0`: `A` en la fila 8, columna 10. Como `sample` hizo easing en ambos segmentos, el nodo se demora en las esquinas y se lanza por los tramos rectos.

**🎯 Resultado esperado :** el fotograma 0 tiene `A` en la parte superior izquierda; el fotograma 16 tiene `A` en la fila 8 (de 0–9), columna 10.

**🩹 Si sale mal :** Si `A` nunca sale de la esquina superior izquierda, `sample` se recorrió con `t` como índice de fotograma en lugar de `f * dt`. Si aterriza en `(10, 2)` y se detiene, el tiempo final del segundo segmento superó el rango de `t` del bucle.

### 4.3 Verifica la trayectoria

**✅ Lista de verificación**

- ✅ `sample(0.5)` en la trayectoria de dos segmentos devuelve `(5.0, 1.0)` — el punto medio con easing del segmento uno.
- ✅ `sample(1.5)` yace sobre el segundo segmento (entre `(10, 2)` y `(10, 8)`).
- ✅ Muestrear más allá del último keyframe devuelve la pose final, sin colapsar.

**🤔 Pregunta(s) socrática(s)**

- La trayectoria no tiene velocidades — solo tiempos y poses. ¿Por qué un keyframe de solo-poses es más fácil de autorar que uno de solo-velocidad, y cuál es el equilibrio para un movimiento donde *quieres* una velocidad de entrada explícita?
- Smoothstep se aplica por segmento, así que el nodo "hace easing" en ambos extremos de la ruta completa. Observa la esquina en `t=1.0`: ¿*alguna vez* se mueve a velocidad máxima, y eso coincide con cómo una cámara real corta entre tomas?

## Paso 5: Exporta el carrete

Una lista de cuadrículas en memoria está bien; un directorio de fotogramas numerados es un *entregable*. El paso 5 escribe los fotogramas y los reensambla como tira de película.

### 5.1 Guarda fotogramas en archivos

**👟 Pista inicial :** Usa `pathlib` para escribir cada fotograma como `frame_000.txt`, con relleno a tres dígitos, y devuelve el conteo.

```python
# main.py (continued)
import pathlib

def save_frames(frames, outdir):
    outdir = pathlib.Path(outdir)
    outdir.mkdir(exist_ok=True)
    for i, frame in enumerate(frames):
        (outdir / f"frame_{i:03d}.txt").write_text("\n".join(frame) + "\n")
    return len(frames)

count = save_frames(frames, "reel")
print("wrote", count, "files")
print(list(pathlib.Path("reel").glob("frame_*.txt"))[:3])
```

`f"frame_{i:03d}"` es el relleno de ceros que hace que los archivos ordenen correctamente (`frame_009` antes que `frame_010`), así que cualquier glob o `ls` reproduce el orden cronológico. El conteo devuelto permite que una canalización verifique la escritura: 17 fotogramas entran, 17 archivos salen.

**🎯 Resultado esperado :**

```
wrote 17 files
[PosixPath('reel/frame_000.txt'), PosixPath('reel/frame_001.txt'), PosixPath('reel/frame_002.txt')]
```

**🩹 Si sale mal :** Si una segunda ejecución dice "ya hay 17 archivos", falta `mkdir(exist_ok=True)` (o quedan fotogramas viejos y se duplican). Si el glob está vacío, el cwd difiere de `outdir` — revisa en qué directorio escribió realmente `save_frames`.

### 5.2 Reensambla una tira de película

**👟 Pista inicial :** Escribe `read_reel(outdir)` que cargue los fotogramas numerados de vuelta en orden y los concatene con separadores `|` para que una mirada muestre el movimiento a través del tiempo.

```python
# main.py (continued)
def read_reel(outdir):
    outdir = pathlib.Path(outdir)
    files = sorted(outdir.glob("frame_*.txt"))
    frames = [f.read_text().splitlines() for f in files]
    rows_in = len(frames[0])
    return ["   ".join(frames[i][row] for i in range(len(frames)))
            for row in range(rows_in)]

film = read_reel("reel")
print("\n".join(film))
```

La tira de película transpone las filas: la fila superior de *cada* fotograma en la línea 1, luego la siguiente fila de cada fotograma en la línea 2 — así que un carrete de 17 fotogramas se renderiza como una banda ancha que puedes desplazar horizontalmente y ver el punto viajar de izquierda a derecha. `sorted` sobre los nombres con relleno de ceros garantiza el orden de los fotogramas sin lógica de ordenamiento propia.

**🎯 Resultado esperado :** una tira de película de 10 filas y ~510 columnas donde una `A` se desliza del extremo izquierdo al extremo derecho a través de los segmentos, con separadores tipo `.|` manteniendo los fotogramas distintos.

**🩹 Si sale mal :** Si los fotogramas salen en orden revuelto, los archivos se nombraron sin el relleno de ceros y `sorted` puso `frame_10` antes de `frame_2`. Si cada fila de fotograma está desalineada, `splitlines` descartó un salto de línea final y la última fila se rellenó de manera desigual.

### 5.3 Verifica la exportación

**✅ Lista de verificación**

- ✅ `save_frames` devuelve 17 y escribe 17 archivos nombrados `frame_000.txt` … `frame_016.txt`.
- ✅ `read_reel` reproduce frames[0] y frames[16] exactamente desde el disco.
- ✅ Cambiar la velocidad de un sprite cambia los archivos de fotograma, probando que el carrete refleja estado, no arte fijo codificado.

**🤔 Pregunta(s) socrática(s)**

- La tira de película es una vista de *rebanada de tiempo*. ¿Qué información te muestra sobre la animación que la pila fotograma-por-fotograma oculta — y qué modismo de movimiento (rotación, escala) capturaría *nunca* una banda 2D fila-por-tiempo?
- La exportación escribe archivos de texto que podrías entregar a una herramienta no-Python. ¿Cuál es el "formato de intercambio abierto" equivalente en tu herramienta de video favorita, y cuál es el valor de mantener la salida del motor en un formato que nada más en tu pila necesite traducir?

## ⚠️ Errores comunes

- **División entera en el easing.** `t / (t1 - t0)` en Python 3 es flotante — pero `t // (t1 - t0)` o argumentos enteros completos truncarán en silencio y congelarán tu curva. Alimenta flotantes a los helpers de matemática.
- **Redondeo-a-la-mitad-hacia-arriba vs redondeo de banquero.** `int(x + 0.5)` siempre redondea `.5` hacia arriba; `round(x)` en Python redondea `.5` al par, así que un sprite en `x=2.5` aterriza en `2` con `round` y en `3` con `int(x+0.5)` — y la deriva de flotante vuelve esto no determinista en la práctica. Elige uno y mantenlo en todas partes.
- **Clamps de pared espalda con espalda.** Si la comprobación de rebote usa `>=`/`<=` sobre el valor *ajustado* cada fotograma, un sprite en reposo contra una pared voltea la velocidad cada actualización y vibra para siempre. Exige *cruzar* el límite o revisa la posición previa al clamp.
- **Off-by-one en los fotogramas.** `for f in range(17)` produce 17 fotogramas hasta `t = 16×dt`; para cubrir `t=0` hasta `t=2.0` inclusive necesitas 17 *pasos*, no 16. Decide si los fotogramas cuentan pasos de tiempo o fotogramas de reloj de pared.
- **Exportaciones desordenadas.** Los nombres de archivo sin relleno de ceros ordenan `frame_10` antes de `frame_2`. Rellena a un ancho fijo (`:03d`) o la tira de película se revuelve.
- **Mutar la escena dentro de play.** `scene.step` debe cambiar el estado del sprite en su lugar; recrear la escena por fotograma pierde la velocidad y los rebotes para siempre.

## Lo que acabas de construir

Un motor de animación que prioriza el texto: matemática de easing, sprites impulsados por velocidad con rebotes contra paredes, un bucle de renderizado de timestep fijo, trayectorias de movimiento con keyframes y un carrete basado en archivos. La idea esencial es que el movimiento se *decide con funciones pequeñas y componibles* — `clamp` custodia los límites, `lerp` viaja, `smoothstep` agrega personalidad, y una clase envuelve cada una como estado. Enmarca cualquier problema de movimiento como "¿qué número animo con easing, y hacia qué" y estas cinco piezas lo responden — la misma forma impulsa las transiciones CSS, los caminos de sprites en juegos y los dollies de cámara en video.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/animation-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/animation-engine) en el repositorio del curso es el motor completo como notebook — rebotes de sprites, la trayectoria de keyframes con easing y la exportación de tira de película, ejecutable en Colab/Kaggle/Binder. Clona el repositorio o [ábrelo en un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Agrega una capa de `Distorsión Temporal`: en lugar de un solo `dt` global, dale a cada sprite su propio multiplicador de `speed` para que un `*` derive perezosamente mientras una `o` se dispara.
- Modela un rebote elástico de dos sprites — cuando los sprites colisionan, intercambian velocidades y agregan una oscilación en `vx` para squash-and-stretch.
- Extiende `Keyframed` para sostener una función de easing por segmento (lineal para el primer tramo, smoothstep para el segundo) como parte de los datos del keyframe.
- Escribe los fotogramas como imágenes PPM (P6) y cóselos en un GIF con un escritor diminuto de Python puro, o alimenta la tira de película en el scrollback de tu terminal para una "película".

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓