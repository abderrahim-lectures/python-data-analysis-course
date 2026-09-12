---
title: "Monitor de Energía del Hogar"
description: "Rastrea el consumo de energía del hogar con desglose por dispositivo y recomendaciones de ahorro."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["cli", "csv", "calculations"]
prerequisites:
  - "Fundamentos de Python (listas, diccionarios, bucles, funciones)"
  - "Leer archivos CSV"
learningObjectives:
  - "Convertir vatios y horas en kWh por dispositivo al día"
  - "Agregar un total mensual y la parte de cada dispositivo"
  - "Preciar la energía con una tarifa escalonada de dos tramos"
  - "Auditar el consumo en espera y generar sugerencias de ahorro basadas en reglas"
  - "Comparar dos escenarios de uso y reportar un delta de ahorro"
---

# ⚡ Construye un Monitor de Energía

Tu factura de electricidad es una caja negra: un solo número cada mes y un encogimiento de hombros. Este proyecto la abre de par en par. Leerás números reales de electrodomésticos, vatios, horas al día, de un CSV, calcularás energía en la unidad que las utilities realmente facturan (kWh), clasificarás dispositivos por su parte del total, preciarás una tarifa *escalonada* (el exceso cuesta más), auditarás qué queman los dispositivos solo por estar en espera, y puntuarás en dólares un escenario de "qué pasa si uso menos la calefacción". Las matemáticas son cuatro fórmulas aritméticas; la habilidad es convertir especificaciones dispersas en un reporte honesto y listo para decisiones.

Esto asume Python 101, listas, diccionarios, bucles, funciones, además de lectura cómoda de `csv`. Nada aquí necesita pandas. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente.

## 🎯 Lo que harás

1. Cargar especificaciones de electrodomésticos y calcular kWh por día y por mes para cada dispositivo.
2. Sumar el mes y clasificar cada dispositivo por su parte de la factura.
3. Preciar el total con una tarifa escalonada de dos tramos, por encima de 250 kWh cuesta más.
4. Auditar el consumo en espera y hacer que el código sugiera qué vale la pena desenchufar.
5. Comparar el uso "actual" contra el "optimizado" y reportar dólares ahorrados.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado, un monitor de energía es una CLI de archivo-en/archivo-fuera (CSV de entrada, reporte impreso de salida), y los archivos pertenecen a tu terminal.

**GitHub Codespaces** es una alternativa sin configuración: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node y Python ya están instalados) y ejecuta los mismos comandos desde una terminal del navegador.

**Google Colab, Kaggle Notebooks o Binder** funcionan, el notebook en [`examples/energy-monitor/notebook.es.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/energy-monitor/notebook.es.ipynb) ejecuta el mismo reporte sobre los electrodomésticos de muestra incluidos, en memoria.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/energy-monitor/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/energy-monitor/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fenergy-monitor%2Fnotebook.es.ipynb)

## Configuración

`uv` es una sola herramienta que reemplaza "instala Python, luego pip, luego una herramienta de entorno virtual", y este proyecto es biblioteca estándar pura.

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
uv init energy-monitor
cd energy-monitor
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `energy-monitor/` existe con un `pyproject.toml`.
- ✅ `python -c "import csv"` tiene éxito, sin paquetes de terceros.

## Paso 1: kWh por dispositivo

La energía se factura en **kWh**, kilovatios-hora, la potencia de un dispositivo de 1000 vatios funcionando durante una hora. Las etiquetas de los electrodomésticos dan *vatios* y tus hábitos dan *horas*, de modo que la conversión es `watts / 1000 * hours`. Una calefacción de 1500 W encendida 3 horas consume `1.5 × 3 = 4.5 kWh` al día, y nunca lo adivinarías por la etiqueta sola. Este paso convierte las especificaciones en el único número que importa.

### 1.1 Escribe el cargador de electrodomésticos y el conversor

**👟 Pista inicial :** Conserva las columnas CSV crudas, luego *deriva* `kwh_per_day` y `kwh_per_month` en el mismo bucle:

```bash
cat > appliances.csv <<'EOF'
device,device_type,watts,avg_hours_per_day
fridge,kitchen,150,24
tv,living_room,120,5
router,network,10,24
heater,bedroom,1500,3
ps5,gaming,200,2
EOF
```

```python
# energy.py
import csv

def load_appliances(path: str = "appliances.csv") -> list[dict]:
    with open(path, newline="") as f:
        rows = list(csv.DictReader(f))
    for row in rows:
        row["watts"] = float(row["watts"])
        row["avg_hours_per_day"] = float(row["avg_hours_per_day"])
        row["kwh_per_day"] = row["watts"] / 1000 * row["avg_hours_per_day"]
        row["kwh_per_month"] = row["kwh_per_day"] * 30
    return rows

if __name__ == "__main__":
    for a in load_appliances():
        print(f"{a['device']:<9} {a['device_type']:<11} {a['watts']:>5.0f} W "
              f"{a['avg_hours_per_day']:>5.1f} h/d  {a['kwh_per_day']:>6.2f} kWh/d "
              f"{a['kwh_per_month']:>7.2f} kWh/mo")
```

`list(csv.DictReader(f))` toma una instantánea de todas las filas de una vez, el bucle que las enriquece nunca vuelve a leer el archivo. Cada campo derivado es una *función pura de las columnas crudas* dentro de la misma fila, agregado justo donde nace la fila. El `30` como mes es un proxy deliberado; explícitamente un mes redondeado, no 31 ni fraccionario, de modo que los números sean estables y reproducibles, un auditor de energía dice "mes de 30 días" en voz alta en lugar de fingir que el calendario es uniforme.

**🎯 Resultado esperado :**

```
fridge    kitchen       150 W  24.0 h/d    3.60 kWh/d   108.00 kWh/mo
tv        living_room   120 W   5.0 h/d    0.60 kWh/d    18.00 kWh/mo
router    network        10 W  24.0 h/d    0.24 kWh/d     7.20 kWh/mo
heater    bedroom      1500 W   3.0 h/d    4.50 kWh/d   135.00 kWh/mo
ps5       gaming        200 W   2.0 h/d    0.40 kWh/d    12.00 kWh/mo
```

**🩹 Si sale mal :** Si un dispositivo imprime `0.00 kWh`, `watts` o `avg_hours_per_day` seguía siendo una cadena al dividir, falta `float()` en uno de ellos. Si la calefacción muestra `1500 W` pero `4.50` nunca escapa a la derecha, un error tipográfico en el encabezado de columna (`watts` vs `watt`) hizo que `row["watts"]` fuera una clave de cadena nueva, imprime `row.keys()` para comparar con la fila de encabezado.

### 1.2 Verifica la conversión

**✅ Lista de verificación**

- ✅ Cada `kwh_per_day` derivado equivale a `watts / 1000 × hours` a mano (fridge: `150/1000×24 = 3.6`).
- ✅ `kwh_per_month` es exactamente 30× `kwh_per_day`, sin calendario de mentira, sin holgura.
- ✅ El enriquecimiento con `float()` cubre ambas columnas numéricas crudas, de modo que `sum(...)` nunca concatena cadenas.

**🤔 Pregunta(s) socrática(s)**

- El `avg_hours_per_day` de la nevera es 24, siempre encendida. ¿Cómo se vería una diferencia de *nevera nueva* contra *refrigerador de cerveza viejo* en este modelo, y cuál es la segunda entrada que un monitor real agregaría en lugar de un solo promedio?
- La calefacción es 1500 W según la etiqueta. Nombra un número del mundo real que es *menor* que la etiqueta en promedio (cicla, no siempre está encendida) y uno que es *mayor* (calor resistivo en atenuador que resiste al modelo). ¿Qué dirección hace que `kwh` exceda, y cuál que quede corto?

## Paso 2: Total y parte

Una tabla por dispositivo es un menú; el total y la *parte* de cada dispositivo son la historia. Con `total = sum(...)`, la calefacción en ~48% salta a la vista como "la mitad de tu factura", mientras que el router por debajo del 3% queda revelado como insignificante. Este paso imprime el índice sobre el que se toman las decisiones.

### 2.1 Escribe el reporte de partes

**👟 Pista inicial :** `sum(a["kwh_per_day"] for a in appliances)` una vez, luego `share = device_kwh / total * 100` dentro del bucle de impresión:

```python
# report.py
import energy
from pathlib import Path

appliances = energy.load_appliances()
total_day = sum(a["kwh_per_day"] for a in appliances)
total_month = total_day * 30

print(f"{'device':<9} {'type':<11} {'kWh/d':>6} {'kWh/mo':>8} {'share':>6}")
for a in sorted(appliances, key=lambda a: a["kwh_per_day"], reverse=True):
    share = a["kwh_per_day"] / total_day * 100
    print(f"{a['device']:<9} {a['device_type']:<11} {a['kwh_per_day']:>6.2f} "
          f"{a['kwh_per_month']:>8.2f} {share:>5.1f}%")

print(f"\ntotal: {total_day:.2f} kWh/day = {total_month:.2f} kWh/month")
```

`sum(a["kwh_per_day"] for a in appliances)` es un generador, sin lista intermedia, una pasada, y el total *no puede* desviarse de los valores por fila porque se calcula del mismo campo. `sorted(..., reverse=True)` reordena estrictamente para la visualización; la lista subyacente de dicts queda intacta, de modo que el Paso 3 reutiliza las mismas filas. La parte es `parte / total × 100`, y el denominador viene de los datos, nunca de una constante mágica.

**🎯 Resultado esperado :**

```
device    type        kWh/d   kWh/mo   share
heater    bedroom      4.50   135.00   48.2%
fridge    kitchen      3.60   108.00   38.5%
tv        living_room  0.60    18.00    6.4%
ps5       gaming       0.40    12.00    4.3%
router    network      0.24     7.20    2.6%

total: 9.34 kWh/day = 280.20 kWh/month
```

**🩹 Si sale mal :** Si el orden sube mágicamente, falta `reverse=True` en `sorted`. Si TODAS las partes muestran `100.0%` (cada dispositivo dividido por sí mismo), la variable de bucle `a` se está usando *tanto* como la fila y como `total_day`, la expresión de suma debe calcularse antes del bucle, fuera de él.

### 2.2 Verifica la clasificación

**✅ Lista de verificación**

- ✅ Total de filas: `9.34 × 30 = 280.20`, consistente con las filas del Paso 1.
- ✅ Las partes suman 100.0% (el todo o está o no está en la factura; sin desviación de redondeo por encima de una décima).
- ✅ La calefacción es primera y el router es último, y la brecha se ve como se comportan (termóstato ≠ equipo de red siempre encendido).

**🤔 Pregunta(s) socrática(s)**

- Las partes son *porcentaje de energía*, no *porcentaje de factura*, los dos son iguales solo bajo una tarifa plana. El Paso 3 introduce una tarifa escalonada. ¿Qué parte de dispositivo *se encogerá* bajo el escalonamiento, y por qué, los últimos ~30 kWh se facturan a la tarifa premium, pero no todos los dispositivos los generaron?
- El total es 280.20 kWh/mes, un número doméstico plausible. ¿Dónde diferiría la gráfica de un hogar *real* de la de este CSV (pico vs noche, temporada de calefacción, carga del EV)? ¿Cuál es la primera columna que haría estacional este modelo?

## Paso 3: Precia una tarifa escalonada

Las utilities rara vez facturan una tarifa plana por kWh: por debajo del tramo, la energía es barata; por encima, cada kWh extra cuesta más. Este paso precia los 280.2 kWh con una tarifa de **primeros 250 kWh a $0.20, todo lo de arriba a $0.35**, y muestra la prima que los últimos 30.2 kWh agregan silenciosamente.

### 3.1 Escribe el calculador de factura escalonada

**👟 Pista inicial :** `bill_for(kwh)` devuelve el costo base para `kwh <= 250` y divide lo de arriba en dos tramos:

```python
# tariff.py
import energy

BASE_RATE = 0.20      # $/kWh for the first 250 kWh
BRACKET = 250         # kWh
HIGH_RATE = 0.35      # $/kWh above the bracket

def bill_for(kwh_month: float) -> float:
    if kwh_month <= BRACKET:
        return kwh_month * BASE_RATE
    base_cost = BRACKET * BASE_RATE
    high_cost = (kwh_month - BRACKET) * HIGH_RATE
    return base_cost + high_cost

if __name__ == "__main__":
    appliances = energy.load_appliances()
    total_month = sum(a["kwh_per_day"] for a in appliances) * 30

    for a in sorted(appliances, key=lambda a: a["kwh_per_day"], reverse=True):
        flat = a["kwh_per_day"] * 30 * BASE_RATE
        print(f"{a['device']:<9} flat-rate cost {flat:>6.2f} $/mo")

    flat_total = total_month * BASE_RATE
    tiered = bill_for(total_month)
    print(f"\nflat rate:  {total_month:.2f} kWh @ ${BASE_RATE:.2f} -> ${flat_total:.2f}")
    print(f"tiered:     first {BRACKET} kWh @ ${BASE_RATE:.2f}, then ${HIGH_RATE:.2f} -> ${tiered:.2f}")
    print(f"tiering premium: ${tiered - flat_total:.2f}")
```

`bill_for` es una función de dos ramas: bajo el tramo, una multiplicación; sobre él, los *primeros 250* se precian a la tasa base y el *resto* a la premium. Las constantes viven en la parte superior del archivo, de modo que "cambia la tarifa a 275 kWh" es editar tres números, no cazar una fórmula. La demo imprime tanto un costo plano por dispositivo (para la vista "qué dispositivo vale la pena perseguir") como la prima, que es exactamente los $4.53 que la estructura de tarifas agrega a una factura que la fijación de precios sentía que debería haber sido plana.

**🎯 Resultado esperado :**

```
heater      flat-rate cost  27.00 $/mo
fridge      flat-rate cost  21.60 $/mo
tv          flat-rate cost   3.60 $/mo
ps5         flat-rate cost   2.40 $/mo
router      flat-rate cost   1.44 $/mo

flat rate:  280.20 kWh @ $0.20 -> $56.04
tiered:     first 250 kWh @ $0.20, then $0.35 -> $60.57
tiering premium: $4.53
```

**🩹 Si sale mal :** Si la factura escalonada equivale a la plana, `kwh_month <= BRACKET` está comparando un *decimal contra un entero redondeado* en el lado equivocado, verifica que `bill_for(280.2)` devuelva 60.57, no 56.04. Si las facturas de alto uso salen *más baratas* que las de bajo uso, falta el subtotal `- BRACKET`, por encima del tramo estás cobrando todo el mes a la premium.

### 3.2 Verifica la tarifa

**✅ Lista de verificación**

- ✅ `bill_for(280.2) == 250×0.20 + 30.2×0.35 == 60.57` a mano.
- ✅ `bill_for(249.9) == 49.98` y es *más barata por kWh* que `bill_for(280.2)`, el tramo realmente muerde.
- ✅ La línea por dispositivo sigue usando la tarifa plana, etiquetada honestamente, la clasificación de dispositivos y el precio de la tarifa son preguntas separadas.

**🤔 Pregunta(s) socrática(s)**

- La prima es $4.53 (8% de la factura) pero los kWh del tramo son 10.8% del uso. ¿Por qué los dispositivos *por debajo* del tramo sigan implícitamente "a tasa base", y qué cambiaría en las líneas de costo por dispositivo si preciaras la *parte de exceso* de cada dispositivo?
- La tarifa publica dos umbrales. Una utility real tiene ventanas de *tiempo de uso* (la noche más barata que la tarde). ¿Cómo cambiaría `bill_for` si el precio se volviera `price(hour)`, y qué le hace eso al modelo `avg_hours_per_day`?

## Paso 4: Audita el desperdicio en espera

La mayor parte de una factura no son los dispositivos *encendidos*, son los dispositivos *apagados pero enchufados*: el LED del TV, la electrónica de la calefacción, la consola esperando una señal. El consumo en espera es pequeño por dispositivo y enorme en agregado, y la auditoría de este paso lo encuentra: carga los vatios de espera, convierte a kWh mensuales, y *sugiere* qué vale la pena desenchufar con una regla de umbral.

### 4.1 Escribe la auditoría de espera

**👟 Pista inicial :** La espera es `watts/1000 × 24` (un día nunca se detiene); la lista de sugerencias solo se dispara cuando un dispositivo supera un `WASTE_THRESHOLD_KWH`:

```bash
cat > standby.csv <<'EOF'
device,standby_watts
tv,4
heater,20
ps5,7
router,8
EOF
```

```python
# standby.py
import csv

WASTE_THRESHOLD_KWH = 5.0  # monthly alert level

def load_standby(path: str = "standby.csv") -> list[dict]:
    with open(path, newline="") as f:
        rows = list(csv.DictReader(f))
    for row in rows:
        row["standby_watts"] = float(row["standby_watts"])
        row["kwh_per_day"] = row["standby_watts"] / 1000 * 24
        row["kwh_per_month"] = row["kwh_per_day"] * 30
    return rows

if __name__ == "__main__":
    standby = load_standby()
    for s in sorted(standby, key=lambda s: s["kwh_per_month"], reverse=True):
        print(f"{s['device']:<9} standby {s['standby_watts']:>5.1f} W  "
              f"waste {s['kwh_per_month']:>6.2f} kWh/mo")

    total_month = sum(s["kwh_per_month"] for s in standby)
    print(f"\ntotal standby waste: {total_month:.2f} kWh/mo")
    print(f"cost at $0.20/kWh: ${total_month * 0.20:.2f}/mo")

    print("\n== savings hints ==")
    for s in standby:
        if s["kwh_per_month"] >= WASTE_THRESHOLD_KWH:
            print(f" - unplug {s['device']} at night "
                  f"(saves {s['kwh_per_month']:.1f} kWh/mo)")
```

El rasgo definitorio de la espera es el `24`, sin entrada de horas, porque "apagado y enchufado" nunca duerme. El umbral hace el trabajo de juicio: un dispositivo que desperdicia 5+ kWh/mes sale a la superficie como un verbo de acción ("unplug ..."), mientras que el TV en 2.88 kWh queda como una nota al pie en lugar de una voz molesta. El reporte de auditoría *separa la medición del consejo*: la tabla de números es la verdad cruda, las sugerencias son una regla que puede ajustarse a 10 kWh o a 1, los mismos datos, un umbral distinto, una lista distinta.

**🎯 Resultado esperado :**

```
heater    standby  20.0 W  waste  14.40 kWh/mo
router    standby   8.0 W  waste   5.76 kWh/mo
ps5       standby   7.0 W  waste   5.04 kWh/mo
tv        standby   4.0 W  waste   2.88 kWh/mo

total standby waste: 28.08 kWh/mo
cost at $0.20/kWh: $5.62/mo

== savings hints ==
 - unplug heater at night (saves 14.4 kWh/mo)
 - unplug ps5 at night (saves 5.0 kWh/mo)
 - unplug router at night (saves 5.8 kWh/mo)
```

**🩹 Si sale mal :** Si la lista de sugerencias está vacía, `>=` se convirtió en `>` y el ps5 de 5.04 kWh se desliza por debajo de la barra, o `WASTE_THRESHOLD_KWH` es una cadena de una config, comparada incorrectamente contra floats. Si el desperdicio en espera de un dispositivo se imprime en *vatios* (`0.20 kWh/mo` para la calefacción), falta el `/1000`, los vatios aún no son kWh.

### 4.2 Verifica la auditoría

**✅ Lista de verificación**

- ✅ La calefacción encabeza a 14.4 kWh/mo, el TV queda atrás a 2.88, el reverso del orden coincide con la realidad.
- ✅ El umbral 5.0 admite exactamente 3 de 4 dispositivos; cambiarlo a 6 excluye al ps5 y cambia la lista, no las matemáticas.
- ✅ Total = 28.08 kWh/mo, preciado a $5.62, la misma tarifa plana que usó el Paso 3, deliberadamente.

**🤔 Pregunta(s) socrática(s)**

- "Desenchufa la calefacción por la noche" es el consejo de la *regla*, pero la electrónica de espera de la calefacción existe para mantener vivos su horario y su reloj de seguridad. ¿Cuál es la compensación que la cifra de $5.62 no puede ver, y qué agregaría una columna de costo-beneficio antes de que tires del enchufe?
- El router desperdicia 5.76 kWh/mo y es discutiblemente *siempre vale la pena alimentarlo* (el internet de tu casa depende de él). ¿Qué es peligroso de dejar que el umbral de la auditoría sea la única voz, y cuál es la segunda entrada (prioridad de dispositivo, seguridad, necesidad) que una herramienta de grado decisional necesita?

## Paso 5: Compara escenarios de uso

La habilidad final es el *qué pasaría si*: "si reduzco la calefacción de 3 a 2 horas y el TV de 5 a 3, ¿qué pasa con la factura?" Una función `scenario(hours_map)` toma el CSV de electrodomésticos, *anula* las horas de los dispositivos elegidos, recalcula los kWh mensuales, y precia ambos mundos, el actual y el optimizado, con la misma tarifa escalonada. La salida, $14.97 ahorrados, un recorte de 18.6%, es el punto entero del monitor: las preguntas de energía se convierten en preguntas de dólares.

### 5.1 Escribe el comparador de escenarios

**👟 Pista inicial :** `hours_map.get(device, avg_hours_per_day)` retrocede a las horas del CSV para cualquier cosa que no esté en el mapa:

```python
# scenarios.py
import csv
from tariff import bill_for

def scenario(hours_map: dict) -> float:
    total_kwh = 0.0
    with open("appliances.csv", newline="") as f:
        for a in csv.DictReader(f):
            watts = float(a["watts"])
            hours = hours_map.get(a["device"], float(a["avg_hours_per_day"]))
            total_kwh += watts / 1000 * hours
    return total_kwh * 30

if __name__ == "__main__":
    current = scenario({})
    optimized = scenario({"heater": 2.0, "tv": 3.0})

    print(f"current:    {current:.1f} kWh/mo -> ${bill_for(current):.2f}")
    print(f"optimized:  {optimized:.1f} kWh/mo -> ${bill_for(optimized):.2f}")
    saved_kwh = current - optimized
    print(f"savings:    {saved_kwh:.1f} kWh/mo = ${bill_for(current) - bill_for(optimized):.2f} "
          f"({100 * saved_kwh / current:.1f}% cut)")
```

`scenario({})` envía un mapa vacío → cada dispositivo conserva las horas del CSV → eso *es* el "actual", reutilizando la misma función en lugar de fijar 280.2 en el código. El mapa de anulación es aditivo, no un fork: solo cambian `heater` y `tv`, todo lo demás vuelve a leer sus horas del CSV, de modo que el modelo no puede olvidarse de la nevera. La comparación re-precía *ambos* mundos a través de `bill_for`, que es lo que hace que la cifra de ahorro sea consciente de la tarifa: una factura aplanada habría "ahorrado" $10.44, bajo el escalonamiento, los dólares reales son $14.97, porque los kWh baratos fueron exprimidos del exceso.

**🎯 Resultado esperado :**

```
current:    280.2 kWh/mo -> $60.57
optimized:  228.0 kWh/mo -> $45.60
savings:    52.2 kWh/mo = $14.97 (18.6% cut)
```

**🩹 Si sale mal :** Si `optimized` equivale a `current`, las claves de anulación no coinciden con los valores exactos de `device` del CSV, `"Heater"` (con H mayúscula) nunca coincide con `"heater"`, de modo que el retroceso se lo traga. Si el porcentaje de ahorro parece el recorte de *kWh* en lugar de un 18.6%, el print ya divide `saved_kwh` por `current` correctamente, pero verifica que estés dividiendo los términos correctos, no `optimized/current`.

### 5.2 Verifica el escenario

**✅ Lista de verificación**

- ✅ `optimized(228.0) < current(280.2)` y ambos fluyen a través del `bill_for` escalonado (228 se queda bajo el tramo; 280.2 paga la prima).
- ✅ Matemática de ahorro: `52.2 kWh` eliminados → `$60.57 − $45.60 = $14.97`; `52.2/280.2 = 18.6%`.
- ✅ Una entrada de mapa extra hipotética (ej. `{"router": 0}`) se fusiona limpiamente, el mapa es la única perilla que cambia.

**🤔 Pregunta(s) socrática(s)**

- El escalonamiento muerde las excepciones: cortar exactamente los kWh de *exceso* ahorra $0.35 cada uno, mientras que cortar kWh de la tasa base ahorra $0.20. Con `optimized = 228 kWh`, ¿este escenario ya ha *seleccionado* qué kWh cortar, y cómo diferiría en resultado una variante de "ahorrar los 52 kWh superiores sin importar el dispositivo"?
- Los mapas de horas no juzgan la *comodidad*, "calefacción a 2 horas" es una premisa sin precio. ¿Cuál es la forma honesta de presentar una sugerencia que ahorra dinero pero enfría la habitación: imprimir la compensación como un *par*, o enterrar la premisa?

## ⚠️ Errores comunes

- **Vatios sin el /1000.** kWh es `watts/1000 × hours`. Omitir la conversión del kilo- precia una calefacción de 1500 W como 45 kWh/día en lugar de 4.5, un fantasma diez veces mayor en la factura.
- **Dividir una cadena.** Las celdas CSV llegan como texto; `float(...)` antes de la aritmética o `sum` concatena silenciosamente y llena el reporte de NaN. Enriquece la fila una vez, en la carga, no en cada consumidor.
- **Un `30` mágico haciendo doble trabajo.** Multiplica *una vez* en `load_appliances`. Si un segundo `* 30` se cuela en un reporte, el mes se convierte en 900 días. Defínelo una vez y coméntalo como "mes de 30 días".
- **Calcular totales dentro de un bucle.** `total = sum(...)` recalculado por fila es O(n²) y, peor, la parte de cada fila divide contra un total *parcial*. Total una vez, fuera.
- **Desviación de mayúsculas o espacios en los nombres de dispositivos.** Un mapa claveado por un nombre CSV que difiere por un espacio (`"heater "` vs `"heater"`) retrocede silenciosamente a las horas predeterminadas, el escenario "no puede ver" el cambio. Coincide con el mayúsculado exacto del CSV.

## Lo que acabas de construir

Un monitor de energía que se lee como un reporte por el que un casero pagaría: vatios → kWh, totales + partes, una tarifa que muerde en el exceso, una auditoría de espera con umbrales ajustables, y un golpe de escenario que muestra dólares reales. El hilo conductor es la *disciplina de derivación*: cada número es una función pura de las entradas CSV más constantes explícitas (`30`, `0.20`, `250`, `5.0`), dos declaraciones de impresión nunca discrepan, y la historia, la calefacción es la mitad de la factura; la espera es $5.62; cortar horas y TV es $14.97, viene de los datos, no de una vibra.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/energy-monitor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/energy-monitor) en el repositorio del curso tiene los scripts completos además del `appliances.csv` y el `standby.csv` de muestra. O abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Agrega **precios de tiempo de uso**: reemplaza los tramos planos por rangos `price(hour)` y pasa un `hours_map` por dispositivo *por hora* (horario de día, horario de noche), el modelo se vuelve estacional gratis.
- Haz que **`scenario` devuelva dólares**, no kWh: refactoriza el Paso 5 para comparar `bill_for(scenario(map_a))` contra `bill_for(scenario(map_b))` e imprime *tanto* el delta de kWh como el de dólares, como una función `compare(map_a, map_b)`.
- Carga un **archivo de lecturas reales**: reemplaza `avg_hours_per_day` por números reales de energía por hora (de un medidor de enchufe o del portal de la utility) y deja que `kwh_per_day` venga del archivo en lugar de vatios×horas, el mismo reporte, datos reales.
- Persiste el reporte: serializa la tabla de partes a `monthly_report.csv` y recárgala en una tabla markdown, la auditoría se convierte en un artefacto que puedes adjuntar al hilo del correo del casero.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓