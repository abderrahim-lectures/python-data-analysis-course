---
id: 2027-webcam-object-counter
title: "Cuenta Objetos en Tiempo Real con una Cámara Web"
sidebar_label: "Contador de Objetos con Cámara Web"
slug: /projects/webcam-object-counter
description: "Cuenta objetos en vivo desde el feed de una cámara web con OpenCV y un modelo YOLO11n preentrenado — o ejecuta la misma detección sobre una imagen o video de muestra incluido sin ninguna cámara."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Cuenta Objetos en Tiempo Real con una Cámara Web

<ProjectPublishedDate projectId="2027-webcam-object-counter" />

<ProjectGreeting />

Este proyecto asume que te sientes cómodo con Python 101 — funciones, bucles e instalación de paquetes — y no necesita ningún conocimiento previo de análisis de datos o aprendizaje automático. Es la primera incursión de este curso en la visión por computadora: en lugar de cargar un modelo preentrenado que lee texto o filas tabulares, cargarás uno que lee píxeles, y lo usarás para responder una pregunta genuinamente práctica en tiempo real — "¿cuántos de *esto* hay frente a la cámara ahora mismo?"

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Instalar `uv` y configurar un proyecto local con OpenCV y un modelo de detección de objetos preentrenado.
2. Ejecutar la detección sobre una sola imagen de muestra incluida y dibujar cuadros delimitadores alrededor de lo que encuentra.
3. Contar objetos de una clase objetivo (p. ej. `person`) e imprimir un total acumulado.
4. Procesar un breve video de muestra incluido cuadro por cuadro.
5. Conectar el mismo bucle de detección a tu propia cámara web para conteo en vivo y en tiempo real.

## Dónde ejecutar esto

**Localmente con `uv` es la única manera de obtener la experiencia completa de cámara web en vivo.** Una cámara web física conectada a tu computadora es hardware — no hay ruta desde una pestaña del navegador corriendo en la nube hasta una cámara sentada en tu escritorio. Los pasos 1–5 de abajo asumen este camino, y el Paso 5 específicamente simplemente no funcionará en ningún otro lugar.

- **GitHub Codespaces** te da un entorno de desarrollo en la nube de configuración cero (Node, Python y `uv` ya instalados — ver [`.devcontainer/devcontainer.json`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/.devcontainer/devcontainer.json)), y los Pasos 1–4 (imagen de muestra, conteo, video de muestra) funcionan bien ahí. El Paso 5 no — un Codespace corre en un servidor remoto sin acceso a tu cámara web local tampoco.
- **Google Colab, Kaggle Notebooks o Binder** son buenos para la variante **solo-imagen-de-muestra** de este proyecto, no la cámara web en vivo. Un notebook real y ejecutable que descarga las imágenes de muestra incluidas y ejecuta el mismo código de detección vive en [`examples/webcam-object-counter/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/webcam-object-counter/notebook.ipynb) (apuntará a `main` una vez fusionado). Haz clic en una insignia para lanzarlo directamente:

  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/webcam-object-counter/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/webcam-object-counter/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwebcam-object-counter%2Fnotebook.ipynb)

  Sé honesto contigo mismo sobre lo que esto te da: solo detección de imágenes de muestra, no un feed de cámara en vivo. Es una forma genuinamente buena de ver el modelo funcionar con cero instalación, pero no es el mismo proyecto que el Paso 5.

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
uv init webcam-object-counter
cd webcam-object-counter
uv add opencv-python ultralytics
```

No se necesita clave de API en ningún lugar de este proyecto — la detección corre completamente en local, sin servicio externo involucrado. Sé consciente del tamaño, sin embargo: `opencv-python` y `ultralytics` (que arrastra PyTorch) son una descarga real — espera que este `uv add` tome unos minutos y unos cientos de megabytes de espacio en disco la primera vez.

:::tip[Dos maneras de detectar objetos — elige la que encaje]
OpenCV trae integradas las **cascadas de Haar** — pequeñas, rápidas, sin descarga adicional, pero limitadas: cada cascada está entrenada para una cosa específica (el ejemplo clásico es `haarcascade_frontalface_default.xml` para rostros de frente) y funciona mejor en una vista frontal bastante limpia. Este proyecto en cambio usa **YOLO11n** a través del paquete `ultralytics` — un modelo de detección de objetos pequeño (unos pocos megabytes) pero genuinamente moderno, preentrenado sobre las 80 clases de objetos cotidianos del conjunto de datos COCO (persona, auto, perro, autobús, silla y más), que reconoce mucho más que rostros y maneja escenas del mundo real más desordenadas mucho mejor. La compensación honesta: YOLO11n es una instalación más grande y un poco más lento por cuadro que una cascada de Haar, pero detecta objetos reales, no solo rostros, que es todo el punto de un proyecto de "contar objetos" de propósito general. Si solo necesitas detectar rostros, una cascada de Haar es una alternativa perfectamente razonable y más ligera que vale la pena conocer.
:::

## Paso 1: Detecta objetos en una sola imagen de muestra

Cada script de abajo reutiliza esta misma idea central. `yolo11n.pt` es un punto de control preentrenado — `ultralytics` lo descarga automáticamente la primera vez que construyes `YOLO(...)`, y lo almacena en caché localmente después:

```python
# detect_image.py
import cv2
from ultralytics import YOLO

model = YOLO("yolo11n.pt")

results = model("samples/street.jpg")
result = results[0]

print(f"Detected {len(result.boxes)} object(s):")
for box in result.boxes:
    class_name = model.names[int(box.cls)]
    confidence = float(box.conf)
    print(f"  - {class_name} ({confidence:.0%} confidence)")

annotated = result.plot()  # draws boxes + labels on a copy of the image
cv2.imwrite("output_street.jpg", annotated)
```

```bash
uv run python detect_image.py
```

`model(image_path)` ejecuta todo el pipeline de detección en una sola llamada: redimensiona la imagen, la pasa por la red, y convierte la salida cruda en una lista de cuadros, cada uno con una etiqueta de clase y un puntaje de confianza. `result.boxes` es esa lista — `box.cls` es un índice de clase dentro de `model.names` (un dict de los 80 nombres de clases COCO), y `box.conf` es la confianza del modelo de que el cuadro realmente contiene esa clase. `result.plot()` es un método de conveniencia que dibuja todo eso de vuelta en la imagen por ti, para que no tengas que escribir tu propio bucle de dibujo de cuadros con `cv2.rectangle`.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Ejecutar el script imprime al menos un objeto detectado con un nombre de clase y un puntaje de confianza.</StepChecklistItem>
<StepChecklistItem>`output_street.jpg` existe y, abierto en un visor de imágenes, muestra cuadros dibujados alrededor de objetos reales en la imagen.</StepChecklistItem>
<StepChecklistItem>Puedes explicar, en una oración, qué representan cada uno de `box.cls` y `box.conf`.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

El modelo devuelve un puntaje de confianza para cada cuadro, no solo un sí/no de "objeto aquí". Si filtraras cualquier cuadro con confianza por debajo del 90%, ¿esperarías ver más detecciones falsas o más detecciones perdidas — y cuál de esos dos errores importa más para un proyecto cuyo punto central es un *conteo* preciso?

## Paso 2: Cuenta una clase objetivo y mantén un total acumulado

Detectarlo todo es un buen comienzo, pero "contar objetos" usualmente significa contar *un tipo* de cosa — personas caminando por una puerta, autos en un estacionamiento, y así:

```python
# count_class.py
from ultralytics import YOLO

model = YOLO("yolo11n.pt")

target_class = "person"
image_paths = ["samples/street.jpg", "samples/people.jpg"]

running_total = 0
for image_path in image_paths:
    result = model(image_path, verbose=False)[0]
    count = sum(1 for box in result.boxes if model.names[int(box.cls)] == target_class)
    running_total += count
    print(f"{image_path}: {count} {target_class}(s) -- running total: {running_total}")

print(f"\nTotal {target_class}(s): {running_total}")
```

```bash
uv run python count_class.py
```

El conteo es solo un filtro-y-suma sobre `result.boxes`, comparando el nombre de clase de cada cuadro contra el que te importa. `verbose=False` silencia el registro por llamada de `ultralytics` para que tus propias declaraciones `print` no queden enterradas debajo.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>El script imprime un conteo por imagen y un total acumulado que solo sube.</StepChecklistItem>
<StepChecklistItem>Cambiar `target_class` a una clase COCO diferente (p. ej. `"bus"`) cambia los conteos impresos en consecuencia.</StepChecklistItem>
<StepChecklistItem>Entiendes por qué esto reutiliza `model.names[int(box.cls)]` en lugar de codificar un número de índice de clase.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

Si dos personas en una foto están paradas tan juntas que sus cuadros delimitadores casi se superponen por completo, ¿hay alguna manera realista de que este enfoque de conteo las cuente de menos o de más? ¿Qué mirarías en `result.boxes` para verificar?

## Paso 3: Procesa un breve video de muestra cuadro por cuadro

Un video es solo una secuencia de imágenes — el mismo código de detección por imagen de los Pasos 1–2, ejecutado una vez por cuadro en un bucle:

```python
# detect_video.py
import cv2
from ultralytics import YOLO

model = YOLO("yolo11n.pt")
target_class = "person"

cap = cv2.VideoCapture("samples/sample_street.mp4")
fps = cap.get(cv2.CAP_PROP_FPS) or 15
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
writer = cv2.VideoWriter("output_video.mp4", cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))

while True:
    ok, frame = cap.read()
    if not ok:
        break  # end of the video file, not a broken camera

    result = model(frame, verbose=False)[0]
    count = sum(1 for box in result.boxes if model.names[int(box.cls)] == target_class)

    annotated = result.plot()
    cv2.putText(annotated, f"{target_class}s: {count}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    writer.write(annotated)

cap.release()
writer.release()
```

```bash
uv run python detect_video.py
```

`cv2.VideoCapture` lee un archivo de video (o, en el Paso 4, una cámara en vivo) un cuadro a la vez vía `.read()`, que devuelve `(ok, frame)` — `ok` es `False` una vez que no hay más cuadros. `cv2.VideoWriter` es la misma idea a la inversa: acumula los cuadros que le das en un nuevo archivo de video. Nota que el `if not ok: break` aquí significa "el archivo terminó" — el Paso 4 reutiliza exactamente esta misma verificación, pero allí significa algo importante y diferente.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`output_video.mp4` existe y se reproduce, mostrando cuadros delimitadores y un conteo en vivo superpuesto en cada cuadro.</StepChecklistItem>
<StepChecklistItem>Puedes explicar qué devuelve `cap.read()` y por qué el bucle verifica `ok` antes de usar `frame`.</StepChecklistItem>
<StepChecklistItem>Has notado que el conteo puede parpadear entre cuadros incluso cuando nada en la escena cambió visiblemente.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

El conteo que imprimes es una instantánea por cuadro, no un total por video — pasar a la misma persona frente a la cámara durante tres segundos podría contarla en cada cuadro. ¿Qué requeriría "contar cuántas personas *distintas* cruzaron el cuadro", más allá de lo que este script hace actualmente?

## Paso 4: Ve en vivo con tu cámara web

Mismo bucle, una línea diferente: cambia la ruta del archivo de video por `0`, el índice de la cámara predeterminada de tu computadora:

```python
# detect_webcam.py
import cv2
from ultralytics import YOLO

model = YOLO("yolo11n.pt")
target_class = "person"

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Could not open the webcam. Check that one is connected, that no other "
          "app is using it, and that this program has camera permission.")
else:
    print("Webcam opened. Press 'q' in the video window to quit.")
    while True:
        ok, frame = cap.read()
        if not ok:
            print("Lost the camera feed. Stopping.")
            break

        result = model(frame, verbose=False)[0]
        count = sum(1 for box in result.boxes if model.names[int(box.cls)] == target_class)

        annotated = result.plot()
        cv2.putText(annotated, f"{target_class}s: {count}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.imshow("Webcam Object Counter (press q to quit)", annotated)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
```

```bash
uv run python detect_webcam.py
```

`cv2.VideoCapture(0)` abre tu cámara predeterminada de la misma manera que `VideoCapture("some_file.mp4")` abrió un archivo en el Paso 3 — el mismo bucle `.read()`, la misma forma `(ok, frame)`. Las dos diferencias importantes: `.isOpened()` se verifica *de antemano* aquí, ya que "sin cámara web disponible" es un fallo real y común que debería producir un mensaje claro en lugar de un colapso confuso en el fondo del bucle; y una vez corriendo, que `ok` se vuelva `False` a mitad del bucle significa que la conexión de la cámara se perdió (desconectada, permiso revocado), no "se llegó al final", ya que una cámara en vivo no tiene final. `cv2.imshow` abre una ventana en vivo — una ventana GUI real, así que este script no producirá salida visible en una terminal remota simple sin pantalla.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Se abre una ventana mostrando tu feed de cámara en vivo con cuadros delimitadores y un conteo en ejecución dibujados en él.</StepChecklistItem>
<StepChecklistItem>Sostener un número diferente del objeto objetivo (p. ej. tú mismo, luego tú y una segunda persona) cambia el conteo impreso/en pantalla en consecuencia.</StepChecklistItem>
<StepChecklistItem>Desconectar o cubrir la cámara a mitad de ejecución produce el mensaje de "se perdió el feed de la cámara", no un cuelgue silencioso.</StepChecklistItem>
<StepChecklistItem>Presionar "q" cierra la ventana limpiamente en lugar de necesitar un forzar-salida.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

Los Pasos 3 y 4 usan `if not ok: break` en exactamente el mismo lugar del código, pero esa línea significa algo diferente en cada uno ("fin de archivo" vs. "problema de cámara"). ¿Por qué vale la pena escribir un mensaje distinto para cada caso en código real, en lugar de tratar ambos como el mismo error genérico?

## ⚠️ Errores comunes

- **Permiso de cámara web denegado.** macOS y Windows piden acceso a la cámara la primera vez que una app intenta usarla — si descartaste ese aviso (o apareció detrás de otra ventana), `cv2.VideoCapture(0).isOpened()` devolverá `False` incluso con una cámara perfectamente funcional. Revisa la configuración de privacidad de la cámara de tu sistema operativo para tu app de terminal o intérprete de Python específicamente.
- **La primera ejecución es lenta y necesita una conexión a internet.** `ultralytics` descarga `yolo11n.pt` desde los servidores de Ultralytics la primera vez que construyes `YOLO(...)` — después se almacena en caché localmente (típicamente bajo `~/.cache` o el directorio actual) y cada ejecución posterior es completamente offline. Si la primera ejecución parece colgarse, probablemente todavía está descargando, no atascada.
- **Confundir "ningún objeto detectado" con "la cámara no funciona".** Estos se ven idénticos a primera vista — un conteo vacío de cualquier manera — pero tienen soluciones completamente diferentes. Verifica `cap.isOpened()` y si `cv2.imshow` muestra una imagen en vivo en absoluto *antes* de preocuparte por qué el conteo es cero; un feed funcional con un conteo genuinamente vacío (nada que coincida con tu clase objetivo está en el cuadro) no es un bug.
- **Desajustes de índice de cámara en máquinas con más de una cámara.** `VideoCapture(0)` abre la cámara que tu sistema operativo considera la predeterminada, que no siempre es la que esperas en una laptop con una cámara web externa conectada — prueba `1`, `2`, etc. si `0` abre la equivocada.

## Lo que acabas de construir

Un pipeline de visión por computadora real y funcional: carga un modelo preentrenado, ejecútalo sobre píxeles en lugar de filas o texto, y convierte su salida cruda (cuadros, índices de clase, puntajes de confianza) en algo que una persona realmente quiere — un conteo en vivo de un tipo específico de objeto. La misma forma de tres pasos (detección por imagen → filtrar a una clase → bucear sobre cuadros) escala desde una sola foto hasta un feed de cámara genuinamente en vivo con solo el origen de entrada cambiando.

:::tip[Esto se generaliza más allá de "contar objetos"]
Todo aquí — un detector preentrenado, un bucle sobre cuadros, un conteo en ejecución — es también la columna vertebral de cosas como sensores de conteo de personas en entradas de tiendas, cámaras básicas de conteo de tráfico, y contadores de especies en cámaras trampa de vida silvestre. La lógica de conteo en el Paso 2 es deliberadamente simple (sin seguimiento de objetos entre cuadros, así que una persona parada quieta durante diez cuadros se cuenta en los diez), que es una simplificación honesta, no un bug oculto — ver la sección "A dónde ir desde aquí" para lo que los sistemas reales añaden encima.
:::

## A dónde ir desde aquí

- **Seguimiento de objetos, no solo detección.** La pregunta socrática del Paso 3 apunta al vacío real: este proyecto cuenta objetos *por cuadro*, no objetos distintos *a través* de un video. Librerías como el modo de seguimiento integrado del propio `ultralytics` (`model.track(...)`, usando algoritmos como ByteTrack) asignan un ID persistente a cada objeto a través de los cuadros, así que "cuántas personas *distintas* cruzaron el cuadro" se vuelve respondible en lugar de solo "cuántas están en el cuadro ahora mismo".
- **Un modelo más grande y más preciso.** `yolo11n.pt` ("n" de nano) intercambia algo de precisión por velocidad y tamaño. `ultralytics` trae puntos de control más grandes (`yolo11s.pt`, `yolo11m.pt` y más) que detectan más confiablemente, especialmente en objetos pequeños o parcialmente ocultos, al costo de necesitar más cómputo por cuadro — vale la pena probarlos si los conteos en vivo del Paso 4 se sienten poco confiables en tu configuración particular.
- **Una clase personalizada, no solo las 80 de COCO.** YOLO11n solo reconoce lo que fue entrenado para reconocer. El ajuste fino de un modelo YOLO en tus propias imágenes etiquetadas (una versión mucho más pequeña de la misma idea que el [proyecto Fine-tune a Small Language Model](/docs/projects/finetune-llm-unsloth)) te permite contar algo que COCO nunca incluyó — un producto específico en un estante, una herramienta específica, cualquier cosa de la que puedas etiquetar unos cientos de ejemplos.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="2027-webcam-object-counter" />
