---
title: "Verificador de Síntomas"
description: "Construye un motor de triaje determinista a partir de una base de conocimiento de síntoma-condición: coincidencia ponderada, puntuación de urgencia, recomendaciones en lenguaje sencillo y una CLI interactiva segura con una exención de responsabilidad médica estricta."
difficulty: "advanced"
estimatedMinutes: 75
tags: ["health", "cli", "domain-modeling"]
learningObjectives:
  - Modelar una pequeña base de conocimiento de síntoma-condición como datos estructurados
  - Puntuación de condiciones por solapamiento ponderado de síntomas
  - Calcular un puntaje de urgencia acotado a partir de la severidad y la duración
  - Generar recomendaciones de cuidado en lenguaje sencillo por bandas
  - Construir una CLI interactiva con entrada de síntomas normalizada
prerequisites:
  - "Fundamentos de Python (funciones, bucles, diccionarios, conjuntos)"
  - "Comodidad con dataclasses o diccionarios simples para datos de dominio"
  - "Manejo básico de entrada CLI (input y sys.argv)"
---

# 🛠️ 🩺 Verificador de Síntomas

Los verificadores de síntomas tienen mala reputación por buenas razones: mezclan reglas de triaje reales con una página de inicio llena de los peores desenlaces. La versión que construyes aquí evita el drama haciendo la parte que un motor puede hacer *honestamente* — emparejar síntomas con condiciones mediante solapamiento ponderado, puntuar una banda de urgencia a partir de la severidad y la duración y convertir esa banda en próximos pasos en lenguaje sencillo. Es un motor de reglas sobre una pequeña base de conocimiento curada, y lo dice: sin IA, sin diagnóstico y con una exención de responsabilidad en cada salida.

Esto asume Python 101 más diccionarios y conjuntos básicos — no se requiere nada más allá de eso, y no hay paquetes externos. Es opcional y no se califica; consulta [Proyectos del Mundo Real](/docs/projects) para ver la lista completa y en crecimiento.

> **Solo con fines educativos.** La salida de este proyecto no es asesoramiento médico, no puede diagnosticar y siempre debe apuntar a un clínico real. La construcción enseña modelado de dominio y reglas por niveles — las afirmaciones médicas terminan donde empieza esta exención de responsabilidad.

## 🎯 Lo que harás

1. Codificar una base de conocimiento curada de síntoma-a-condición como datos, no como lógica.
2. Puntuar las condiciones por solapamiento ponderado de síntomas y clasificar las coincidencias.
3. Combinar severidad y duración en un único puntaje de urgencia acotado de 0–10.
4. Mapear una banda de urgencia a recomendaciones de cuidado en lenguaje sencillo.
5. Envolverlo en una CLI interactiva con entrada de síntomas normalizada y una exención de responsabilidad.

## Dónde ejecutar esto

**Localmente con `uv`** es la ruta principal. El motor es biblioteca estándar pura, así que `uv init` te pone en marcha de inmediato, y el modo interactivo `cli` necesita una terminal real (un script que ejecutes, no una celda que ejecutes) para leer `input()`.

**Google Colab, Kaggle Notebooks y Binder** ejecutan el motor de puntuación de forma idéntica — los cuatro pasos de puntuación son funciones simples sobre datos simples. La salvedad honesta: la interacción impulsada por `input()` es incómoda en un notebook, así que esos caminos ejecutan el modo *demo* sembrado (el predeterminado del Paso 5) en lugar de un Q&A en vivo. Usa las insignias para ver el motor funcionar de extremo a extremo, y cambia a `uv` local para la experiencia interactiva completa.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/symptom-checker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/symptom-checker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsymptom-checker%2Fnotebook.ipynb)

## Configuración

Crea el proyecto. El verificador solo necesita la biblioteca estándar.

```bash
uv init symptom-checker
cd symptom-checker
```

```bash
uv run python -c "import sys, typing; print('ok')"
```

`sys` lo usa el Paso 5 para alternar entre los modos demo e interactivo, y `typing` da las firmas de función más pequeñas (`dict[str, ...]`) que mantienen legibles los datos de dominio a medida que la base de conocimiento crece a través de los pasos.

**✅ Lista de verificación**

- ✅ `uv init symptom-checker` creó una carpeta con un `pyproject.toml`.
- ✅ `uv run python -c "import sys, typing"` imprime `ok` — cero paquetes añadidos.

## Paso 1: Modela la base de conocimiento de síntoma-condición

Todo lo que este verificador "sabe" vive en un diccionario. Mantener los hechos médicos como *datos* en lugar de sentencias `if` es lo que permite que la lógica de puntuación siga siendo genérica — añade una condición más tarde y el motor la puntúa sin cambios de código.

### 1.1 Codifica las condiciones y sus síntomas ponderados

**👟 Pista inicial :** Representa cada condición como un dict de `síntoma → peso`, y dale a cada síntoma una clave de máquina estable más una etiqueta legible por humanos que la CLI pueda imprimir.

```python
# checker.py
KNOWLEDGE: dict[str, dict[str, int]] = {
    "Common cold":   {"cough": 3, "runny_nose": 3, "sore_throat": 2, "sneezing": 2, "fatigue": 1},
    "Seasonal allergies": {"sneezing": 3, "itchy_eyes": 3, "runny_nose": 3, "headache": 1},
    "Flu":           {"fever": 3, "body_aches": 3, "fatigue": 3, "cough": 2, "headache": 2},
    "Strep throat":  {"sore_throat": 3, "fever": 2, "swollen_lymph": 2},
    "Food poisoning": {"nausea": 3, "vomiting": 3, "diarrhea": 3, "stomach_pain": 2},
    "Migraine":      {"headache": 3, "light_sensitivity": 2, "nausea": 2},
    "UTI":           {"burning_urination": 3, "frequent_urination": 3},
    "Dehydration":   {"dry_mouth": 3, "dizziness": 2, "fatigue": 2, "headache": 1},
}

SYMPTOM_LABELS = {
    "cough": "cough", "runny_nose": "runny nose", "sore_throat": "sore throat",
    "sneezing": "sneezing", "fatigue": "fatigue", "itchy_eyes": "itchy eyes",
    "headache": "headache", "fever": "fever", "body_aches": "body aches",
    "swollen_lymph": "swollen glands", "nausea": "nausea", "vomiting": "vomiting",
    "diarrhea": "diarrhea", "stomach_pain": "stomach pain",
    "light_sensitivity": "light sensitivity", "burning_urination": "burning urination",
    "frequent_urination": "frequent urination", "dry_mouth": "dry mouth",
    "dizziness": "dizziness",
}

ALL_SYMPTOMS = {s for weights in KNOWLEDGE.values() for s in weights}
print(f"conditions: {len(KNOWLEDGE)}  distinct symptoms: {len(ALL_SYMPTOMS)}")
```

Dos formas de datos hacen el trabajo real. El `weight` por síntoma (1–3) codifica *qué tan fuertemente* un síntoma apunta a una condición — un 3 significa "tan típico que casi lo define", un 1 significa "aparece pero es inespecífico" — así que una tos sola empuja hacia la gripe menos que la fiebre. `SYMPTOM_LABELS` mantiene una clave de máquina estable (`"burning_urination"`) mapeada a una frase humana, lo que significa que la CLI del Paso 5 puede imprimir y aceptar síntomas sin hacer nunca coincidencia de cadenas con las palabras que la gente podría escribir. `ALL_SYMPTOMS` se deriva de la propia base de conocimiento en lugar de mantenerse a mano, así que no puede desviarse de los datos.

**🎯 Resultado esperado :** `conditions: 8  distinct symptoms: 19`.

**🩹 Si sale mal :** Si el conteo es menor, falta un dict de condición o dos claves de condición chocan (espacio vs guion bajo). Si `ALL_SYMPTOMS` falla, un valor en `KNOWLEDGE` no es un dict — comprueba una cadena extraviada en una condición. Si los conteos son mayores, una condición contiene una clave de síntoma que no está en `SYMPTOM_LABELS`, que la CLI del Paso 5 se negará a imprimir.

### 1.2 Verifica el modelo

**✅ Lista de verificación**

- ✅ `uv run python checker.py` imprime `conditions: 8  distinct symptoms: 19`.
- ✅ Cada clave de síntoma en `KNOWLEDGE` también aparece como una clave en `SYMPTOM_LABELS`.
- ✅ Puedes describir, con tus propias palabras, qué *significa* el `3` junto a un síntoma como una decisión de modelado.

**🤔 Pregunta(s) socrática(s)**

- Un estornudo apunta a las alergias y al resfriado aproximadamente por igual. Ambos están puntuados con 3 arriba — ¿qué cambio de modelado expresaría "aparece en ambos, pero no los desambigua"?
- Los pesos son enteros. ¿Qué gana usar 1–3 sobre una simple lista binaria de síntomas sí/no, y qué *problema* crea una tabla de pesos curada por expertos como esta para un producto médico real cuando llega nueva evidencia?

## Paso 2: Puntúa las condiciones por solapamiento ponderado

Ahora el motor decide: dada una pequeña colección de síntomas presentes, ¿a qué condiciones apunta la evidencia? La puntuación es un cociente de la evidencia típica de esa condición que coincidió, así que una coincidencia parcial se clasifica por debajo de una completa.

### 2.1 Clasifica las condiciones por evidencia coincidente

**👟 Pista inicial :** Para cada condición, suma los pesos de los síntomas que el usuario tiene, divide por el peso total de la condición y ordena descendente — una comprensión, sin lógica enrevesada.

```python
# checker.py (continuación)
def score_conditions(present: set[str]) -> list[tuple[str, float]]:
    ranked = []
    for condition, symptom_weights in KNOWLEDGE.items():
        covered = sum(w for s, w in symptom_weights.items() if s in present)
        total = sum(symptom_weights.values())
        ratio = covered / total if total else 0.0
        ranked.append((condition, round(ratio, 2)))
    ranked.sort(key=lambda item: item[1], reverse=True)
    return ranked

demo = {"fever", "cough", "body_aches", "fatigue"}
for condition, ratio in score_conditions(demo):
    print(f"{ratio:>4.2f}  {condition}")
```

El cociente es todo el algoritmo. `covered` cuenta los pesos de los síntomas *coincidentes*, `total` es la firma completa de la condición, así que un usuario que coincide con cada síntoma ponderado de una condición puntúa exactamente `1.0` y una coincidencia parcial aterriza en el medio. Esa normalización es la decisión clave: una condición con una firma grande (gripe) se juzga por cuánta de *su propia* evidencia aparece, no por el conteo bruto de síntomas — de lo contrario, la condición con más síntomas listados siempre ganaría. `sorted(... reverse=True)` convierte los pares puntuados en una lista clasificada que el resto del pipeline consume.

**🎯 Resultado esperado :** `Flu` primero en `1.00` (fiebre, dolor corporal, fatiga, tos son exactamente sus cuatro principales), `Common cold` segundo, el resto por debajo.

**🩹 Si sale mal :** Si la gripe no se clasifica primero para ese conjunto exacto, un peso en el dict de la gripe está mal escrito (p. ej., `cough` accidentalmente 1). Si *todo* puntúa `1.00`, `s in present` está coincidiendo mal porque `present` contiene etiquetas mientras que las claves de `KNOWLEDGE` son claves de máquina — mantén `demo` en claves de máquina. Si las puntuaciones parecen diminutas, dividiste por el total equivocado y `covered`/`total` están intercambiados.

### 2.2 Verifica la puntuación

**✅ Lista de verificación**

- ✅ El conjunto demo clasifica `Flu` en `1.00`, `Common cold` segundo.
- ✅ Un conjunto de un síntoma (`{"headache"}`) puntúa *por debajo* de 1.0 para cada condición que lista dolor de cabeza.
- ✅ Puedes explicar por qué la normalización (dividir por el total de cada condición) importa más cuando las condiciones difieren en el tamaño de la firma.

**🤔 Pregunta(s) socrática(s)**

- `{"runny_nose", "sneezing", "itchy_eyes"}` debería clasificar las alergias por encima del resfriado, que comparte dos de esos síntomas. Trabaja la matemática del cociente y di dónde divergen las dos condiciones — y por qué una firma *más corta* puede superar a una más larga.
- Esta puntuación ignora cuánto tiempo han durado los síntomas. ¿Qué tipo de llamada equivocada hace un clasificador ciego a la duración, y es ese un problema de puntuación o un problema de puntuación-más-urgencia?

## Paso 3: Calcula un puntaje de urgencia acotado

Alcanzar una lista clasificada no es alcanzar una decisión de triaje. Este paso añade las dos columnas que necesita una evaluación real — qué tan severo se siente cada síntoma y cuánto tiempo ha durado — y colapsa todo en un puntaje de urgencia acotado de 0–10 sobre el que las bandas de recomendación del Paso 4 pueden actuar.

### 3.1 Mezcla severidad y duración en un número

**👟 Pista inicial :** Comienza desde el cociente superior, añade pequeñas penalizaciones por síntomas severos y por síntomas que duran más de una semana, y pon un tope al resultado en 10 — mantén cada contribución lo suficientemente pequeña para que la severidad alta por sí sola nunca anule todo lo demás.

```python
# checker.py (continuación)
WARNING_SYMPTOMS = {"difficulty_breathing", "chest_pain", "confusion", "faintish"}

def urgency_score(present: set[str], severities: dict[str, str],
                  durations_days: dict[str, float]) -> float:
    top_ratio = score_conditions(present)[0][1]
    base = top_ratio * 5
    severe_bonus = sum(1 for s in present if severities.get(s) == "severe") * 0.5
    chronic_bonus = sum(1 for s, d in durations_days.items() if d > 7) * 0.3
    warning_bonus = 4 if present & WARNING_SYMPTOMS else 0
    return round(min(10, base + severe_bonus + chronic_bonus + warning_bonus), 1)

demo_dur = {"fever": 2, "cough": 3, "body_aches": 1, "fatigue": 10}
demo_sev = {"fever": "high", "body_aches": "severe", "fatigue": "moderate"}
print("urgency:", urgency_score({"fever", "cough", "body_aches", "fatigue"},
                                demo_sev, demo_dur))
```

Cada término se gana su lugar a través de sus pares. `base` escala con qué tan fuertemente coincide la evidencia (el cociente del Paso 2 × 5, así que una coincidencia perfecta empieza en 5); `severe_bonus` y `chronic_bonus` añaden pequeños incrementos por síntomas marcados `severe` o por durar más de una semana — deliberados y modestos para que empujen, no dominen; y `warning_bonus` es grande (4 puntos) porque los cuatro `WARNING_SYMPTOMS` se traducen en "busca atención urgente" independientemente de cualquier coincidencia de condición. El tope `min(10, …)` es lo que hace que la salida sea un *puntaje acotado* en el que las bandas pueden confiar. Observa que `present & WARNING_SYMPTOMS` reutiliza la intersección de conjuntos — no se necesita un bucle para preguntar "¿tenemos algún síntoma de bandera roja?"

**🎯 Resultado esperado :** Un solo puntaje entre 0 y 10 — para el demo de arriba, alrededor de `7.0–8.0`, ya que una coincidencia perfecta de gripe más dos señales severas/adyacentes a bandera roja aterriza en la banda alta.

**🩹 Si sale mal :** Si el puntaje excede 10, falta el tope `min(10, …)`. Si se mantiene diminuto a pesar de los síntomas `severe`, `severities.get(s)` está buscando etiquetas de *síntoma* mientras que `present` contiene claves de máquina. Si un caso *crónico pero leve* (un síntoma durante 12 días) supera a uno urgente, no se está añadiendo `warning_bonus` — comprueba que las claves de `WARNING_SYMPTOMS` coincidan con claves de máquina reales.

### 3.2 Verifica el puntaje de urgencia

**✅ Lista de verificación**

- ✅ El demo devuelve un número estrictamente entre 0 y 10.
- ✅ Añadir `"chest_pain"` a `present` eleva el puntaje del mismo caso en al menos 3.
- ✅ Los mismos síntomas con duraciones más cortas puntúan más bajo que con duraciones más largas.

**🤔 Pregunta(s) socrática(s)**

- `warning_bonus` es un +4 plano independientemente de qué síntoma de advertencia aparezca. ¿Ponderar cada advertencia (p. ej., `difficulty_breathing` vale más que `faintish`) mejoraría la honestidad de las bandas, y qué costaría en simplicidad?
- El puntaje es una suma de términos diseñados independientemente. ¿Qué puntaje obtendría un usuario con *ninguna* condición coincidente pero un síntoma severo de advertencia, y es esa la respuesta que quieres que produzca una banda de triaje?

## Paso 4: Mapea los puntajes a recomendaciones en lenguaje sencillo

Un puntaje sin mensaje es un número sobre el que una persona preocupada no puede actuar. Este paso agrupa el rango 0–10 en cuatro bandas, cada una atada a un próximo paso concreto, y genera un resumen legible desde la condición mejor clasificada más la banda.

### 4.1 Escribe el bandeo de cuidado y el resumen

**👟 Pista inicial :** Define las bandas por límite superior en una lista ordenada, recórrela para encontrar la banda en la que aterriza el puntaje y luego compón un resumen de un párrafo desde la condición superior, el puntaje y esa banda.

```python
# checker.py (continuación)
BANDS = [
    (8.0, "Seek urgent or emergency care now. Call your local emergency line."),
    (5.0, "Book an appointment with a doctor within 24 hours."),
    (3.0, "Monitor for 24-48 hours. Hydrate and rest; book a visit if it worsens."),
    (0.0, "Likely self-care. Rest, hydrate, and re-check if symptoms change."),
]

def recommendation(score: float) -> str:
    for cutoff, message in BANDS:
        if score >= cutoff:
            return message
    return BANDS[-1][1]

def summarize(present: set[str], severities: dict[str, str],
              durations_days: dict[str, float]) -> str:
    ranked = score_conditions(present)
    top_condition, _ = ranked[0]
    score = urgency_score(present, severities, durations_days)
    lines = [
        f"Top match: {top_condition}",
        f"Urgency score: {score}/10",
        "Next step: " + recommendation(score),
        "Consult a qualified health professional before acting on this.",
    ]
    return "\n".join(lines)

print(summarize(demo, demo_sev, demo_dur))
```

El bandeo mantiene la cautela médica *en los datos*, no dispersa a través de `if`s. Cada banda declara un límite inferior y una acción; `for` recorre la lista en orden descendente y el primer límite que el puntaje supera gana — así que 9.5 llega al cuidado urgente, 4.2 a "dentro de 24 horas" y 2.5 aterriza en monitor/autocuidado. La línea final de exención de responsabilidad en `summarize` es deliberada, no decorativa: cada camino fuera de este motor — banda alta o baja — la lleva, porque el motor de reglas que clasificó las condiciones tiene exactamente cero autoridad médica.

**🎯 Resultado esperado :** Un bloque de 4 líneas que nombra `Flu`, un puntaje sobre 10, un mensaje de banda única que coincida y la exención de responsabilidad de consulta.

**🩹 Si sale mal :** Si un puntaje de 9.9 se enruta a "self-care", la lista `BANDS` está ordenada ascendente y `score >= cutoff` golpea el límite bajo primero. Si el puntaje se muestra pero el mensaje dice `None`, `recommendation` cayó sin devolver — comprueba que el bucle cubra cada puntaje posible, con la línea `(0.0, …)` como suelo. Si la condición superior se ve mal, `ranked[0]` está desempaquetando una lista no ordenada.

### 4.2 Verifica el bandeo

**✅ Lista de verificación**

- ✅ Los puntajes ≥ 8 se mapean a cuidado urgente, ≥ 5 a una cita de 24 horas, ≥ 3 a monitoreo, por debajo a autocuidado.
- ✅ El resumen siempre termina con la línea de exención de responsabilidad de consulta.
- ✅ Puedes explicar qué compra la estructura de bandas sobre un puntaje desnudo.

**🤔 Pregunta(s) socrática(s)**

- Las bandas tienen límites nítidos, así que 4.9 dice "reserva una cita" y 5.0 dice lo mismo — pero 5.0 también dispara el *mismo* texto que 7.9. ¿En qué información necesitan diferir realmente esos dos usuarios, y una banda más lo arreglaría?
- Los sistemas de triaje reales usan combinaciones `AND`/`OR` (fiebre Y erupción) en lugar de puntajes puros. ¿Dónde en este pipeline insertarías una regla que *anule* el puntaje, y por qué la lógica médica de nivel superior debería vivir fuera del bandeo numérico?

## Paso 5: Construye la CLI interactiva

El último paso conecta todo con una persona: la CLI lista el catálogo, deja que el usuario elija síntomas desde un menú numerado, recolecta la severidad y la duración de cada uno, ejecuta todo el pipeline e imprime el resumen. Un predeterminado `demo` mantiene el script ejecutable sin escribir.

### 5.1 Añade el manejo de entrada y un demo predeterminado

**👟 Pista inicial :** Numera los `SYMPTOM_LABELS` para el menú, acepta números separados por comas, tradúcelos de vuelta a claves de máquina y luego llama a `summarize`. Protege el camino interactivo detrás de un argumento `cli` explícito para que la ejecución predeterminada se mantenga no interactiva.

```python
# checker.py (continuación)
import sys

def run_cli() -> None:
    order = sorted(SYMPTOM_LABELS)
    print("Which symptoms? Enter numbers, comma-separated:")
    for i, key in enumerate(order, 1):
        print(f"  {i:>2}. {SYMPTOM_LABELS[key]}")

    raw = input("> ")
    try:
        picks = [int(x.strip()) for x in raw.split(",")]
    except ValueError:
        print("Please enter numbers like: 1, 3, 7"); return

    present = {order[p - 1] for p in picks if 1 <= p <= len(order)}
    if not present:
        print("No valid symptoms selected. Nothing to score."); return

    severities = {}
    durations_days = {}
    for key in present:
        sev = input(f"{SYMPTOM_LABELS[key]} severity (mild/moderate/severe): ").strip().lower()
        dur = input(f"{SYMPTOM_LABELS[key]} duration in days: ").strip()
        severities[key] = sev if sev in {"mild", "moderate", "severe"} else "moderate"
        try:
            durations_days[key] = float(dur)
        except ValueError:
            durations_days[key] = 1.0

    print("\n" + summarize(present, severities, durations_days))

def run_demo() -> None:
    severity = {"fever": "high", "body_aches": "severe", "fatigue": "moderate", "cough": "moderate"}
    duration = {"fever": 2, "cough": 3, "body_aches": 1, "fatigue": 10}
    print(summarize(demo, severity, duration))

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "cli":
        run_cli()
    else:
        run_demo()
```

El menú hace la *saneamiento* de entrada en tres puntos deliberados: `int(x.strip())` convierte los números escritos e ignora los espacios en blanco, `if 1 <= p <= len(order)` descarta en silencio las elecciones fuera de rango en lugar de bloquearse, y las respuestas malas de severidad/duración caen a valores predeterminados registrados (`moderate`, `1 day`) en lugar de abortar la sesión. El camino `demo` existe porque un notebook, una ejecución de CI o una primera lectura necesitan una forma de ejercitar todo el pipeline sin entrada — el modo interactivo `cli` necesita un humano real en un teclado real.

**🎯 Resultado esperado :** Ejecutar `uv run python checker.py` imprime el resumen demo (sin necesidad de entrada). Ejecutar `uv run python checker.py cli` muestra el menú numerado, recolecta tus respuestas e imprime un resumen para los síntomas que elegiste.

**🩹 Si sale mal :** Si el modo `cli` se bloquea con una elección no numérica, falta el guard `except ValueError` alrededor de la comprensión de lista. Si las claves del menú no coinciden con los síntomas puntuados, `order` (de `SYMPTOM_LABELS`) y las claves de máquina de `KNOWLEDGE` no coinciden — la comprobación del Paso 1 debería haberlo detectado. Si `input()` se bloquea para siempre en un notebook, estás en el camino interactivo sin teclado — quédate en el demo sin argumentos ahí.

### 5.2 Verifica la CLI de extremo a extremo

**✅ Lista de verificación**

- ✅ `uv run python checker.py` imprime el resumen demo sin ninguna entrada.
- ✅ `uv run python checker.py cli` lista un menú numerado, acepta elecciones separadas por comas e imprime un resumen.
- ✅ La entrada basura como `abc` o `99` no bloquea la CLI — advierte y continúa.
- ✅ Ejecutar ambos modos termina con la exención de responsabilidad de consulta.

**🤔 Pregunta(s) socrática(s)**

- Los usuarios escribirán el mismo síntoma como "sore throat", "Sore Throat" y "throat". El menú evita esto con números — ¿cuál es el costo de esa limpieza, y cómo introduciría un matcher de texto difuso *nuevos* riesgos que los números no tienen?
- El camino demo es el predeterminado y el camino interactivo es opt-in. En una herramienta adyacente a la seguridad, ¿por qué predeterminar al camino menos interactivo y determinista es la elección defendible — y qué te tentaría a invertirlo?

## ⚠️ Errores comunes

- **Mezclar etiquetas humanas y claves de máquina.** Los usuarios escriben "itchy eyes", la base de conocimiento almacena `itchy_eyes`; emparejar `s in present` contra una e imprimir la otra produce coincidencias nulas en silencio. Solución: mantén `SYMPTOM_LABELS` como la única traducción humano↔máquina y nunca pases texto de usuario crudo a la puntuación.
- **Puntajes que exceden 10 o se desvían sin límite.** Cada término en `urgency_score` debe ser cubierto por un tope `min(10, …)`, o un caso de larga duración + severo supera el rango diseñado del bandeo y un "puntaje" de 12.4 coincide en silencio con la banda urgente.
- **Una clasificación que ignora la duración.** Un `{"headache"}` durante 9 días se clasifica como un `{"headache"}` fresco — el puntaje no puede explicar lo crónico de *cualquier* cosa. El término `chronic_bonus` existe precisamente para que "dura más de una semana" mueva el puntaje.
- **Límites de banda ordenados mal.** Si `BANDS` es ascendente, un puntaje alto golpea la banda equivocada (la primera). Mantenlos descendentes y deja que el primer `score >= cutoff` gane, como en el Paso 4.
- **Tratar el cociente superior como un diagnóstico.** El motor empareja síntomas con patrones conocidos; el solapamiento no equivale a causalidad, y la línea de exención de responsabilidad debe sobrevivir a cada camino de código. Elimínala de cualquier resumen y habrás sobrepasado lo que un motor de reglas puede afirmar.

## Lo que acabas de construir

Un motor de triaje de síntomas funcional con un modelo de datos real — una base de conocimiento ponderada, puntajes de coincidencia normalizados, un puntaje de urgencia acotado que mezcla severidad y duración, cuatro bandas de cuidado y una CLI interactiva saneada, todo en Python puro con una exención de responsabilidad detrás de cada recomendación. La habilidad transferible es *convertir el conocimiento de dominio en estructuras de datos puntuadas*: el mismo patrón de solapamiento-ponderado-y-bandas se generaliza a la coincidencia de trabajos, la calificación de cuestionarios, la activación de funciones y cualquier lugar donde un producto deba clasificar opciones contra evidencia parcial.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/symptom-checker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/symptom-checker) en el repo del curso es una versión más completa del código anterior, con un catálogo de síntomas más rico y el demo CLI pre-ejecutado en el notebook. Clónalo, o abre todo el repo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## Hacia dónde ir desde aquí

- Añade una pestaña de *historial* de síntomas: rastrea los puntajes del usuario durante la última semana de respuestas y muestra "mejorando / empeorando" como una banda propia.
- Deja que los usuarios escriban una ubicación del cuerpo (cabeza, garganta, estómago) y filtra el menú a los síntomas en esa zona — un campo de categoría simple en cada condición.
- Persiste las condiciones en un `conditions.json` separado que el motor carga al arrancar, de modo que añadir una condición nunca requiera editar el código de puntuación.
- Escribe un pequeño `test_checker.py` que fije el puntaje de cinco casos elegidos a mano (incluidos los dos ejemplos de las preguntas del Paso 3), de modo que una refactorización futura no pueda cambiar en silencio los resultados del triaje.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo, apto para principiantes, para añadir el tuyo mediante un **pull request**, incluso si nunca has usado git antes: hacer fork del repo, crear una rama, hacer commit de tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
