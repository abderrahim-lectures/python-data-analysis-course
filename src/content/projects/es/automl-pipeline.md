---
title: "Pipeline AutoML"
description: "Un pequeño autopiloto: genera un dataset reproducible, envuelve un pipeline de preprocesamiento limpio de imputación y escalado, hace competir tres modelos con validación cruzada, ajusta hiperparámetros con una búsqueda de cuadrícula y exporta al ganador con joblib."
difficulty: "advanced"
estimatedMinutes: 120
xpReward: 100
tags: ["Machine Learning", "Developer Tools", "Pandas"]
prerequisites:
  - "pandas DataFrames y divisiones entrenamiento/prueba"
  - "Estimadores de scikit-learn y fit/predict"
  - "Conceptos básicos del rng de NumPy"
learningObjectives:
  - "Generar un dataset sintético reproducible con etiquetas invertidas con numpy y dividirlo con estratificación"
  - "Encadenar imputación y escalado dentro de un Pipeline de scikit-learn"
  - "Comparar tres estimadores con cross_val_score y leer la carrera con honestidad"
  - "Ajustar un modelo con GridSearchCV y discriminar las métricas seleccionadas por CV de las de prueba"
  - "Exportar el pipeline elegido con joblib y recargarlo como predictor plug-and-play"
---

# 🛠️ 🤖 Construye un Pipeline de ML Automatizado

El "aprendizaje automático automatizado" de los tutoriales vive en un servidor que rentas. Este proyecto corre la misma idea en tu laptop: un pequeño autopiloto que toma filas crudas, las limpia con un pipeline encadenado, hace competir un puñado de modelos con validación cruzada adecuada, ajusta los prometedores con una búsqueda de cuadrícula y exporta un ganador serializado que puedes recargar en cualquier lugar. En el camino enseña la disciplina que las bibliotecas de ML reales codifican: **la división entrenamiento/prueba se decide antes de cualquier ajuste**, el **imputador y el escalador aprenden solo de los datos de entrenamiento**, y una **búsqueda de cuadrícula ajustada en CV puede discrepar del conjunto de prueba**, este proyecto hace observables las tres con datos pequeños generados a mano. El dataset es sintético (estadísticas de tráfico de red que se correlacionan con un estado sano/no sano), así que cada número de esta guía es reproducible desde una semilla fija.

Esto asume pandas, sklearn básico y algo de numpy. Es un proyecto opcional y no calificado, consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente. Instala dos paquetes (`pandas`, `scikit-learn` en esta guía, `joblib` estándar), `uv` hace esto indoloro.

## 🎯 Lo que harás

1. Generar un dataset reproducible de 400 filas con ruido de etiquetas inyectado y dividirlo 75/25 con estratificación.
2. Envolver un pipeline de preprocesamiento de imputación por mediana y z-escalado y ajustarlo sobre las características de entrenamiento.
3. Hacer competir regresión logística, un árbol de decisión y k-NN con `cross_val_score`.
4. Ajustar los árboles y vecinos prometedores con `GridSearchCV` y compararlos con la base de CV.
5. Exportar el pipeline final con `joblib` y recargarlo como predictor con probabilidades.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado. Un comando instala todo:

```bash
uv init automl-pipeline && cd automl-pipeline
uv add pandas scikit-learn joblib
```

**Google Colab, Kaggle Notebooks y Binder** ejecutan cada paso sin modificar, ambas plataformas traen pandas y scikit-learn preinstalados. Los datos sintéticos y las semillas fijas hacen la salida del notebook idéntica entre máquinas.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/automl-pipeline/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/automl-pipeline/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fautoml-pipeline%2Fnotebook.es.ipynb)

## Configuración

Todo lo necesario antes de la primera fila.

### Configura el proyecto

```bash
uv init automl-pipeline
cd automl-pipeline
uv add pandas scikit-learn joblib
```

Los tres imports que usarás en todo el proyecto:

```python
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
```

**✅ Lista de verificación**

- ✅ `uv run python3 -c "import pandas, sklearn, joblib"` tiene éxito.
- ✅ Sabes qué métricas de sklearn vienen de `sklearn.metrics`, qué pipelines vienen de `sklearn.pipeline`, ambos se importan según se necesiten abajo.

**🤔 Pregunta(s) socrática(s)**

- El "ML automatizado" promete elegir el mejor modelo. Pero un pipeline que ajusta sobre los *mismos* datos sobre los que informa es optimista. ¿Dónde, en el flujo de este proyecto, debe aparecer y reaparecer el conjunto de prueba, y por qué cambia la respuesta si se filtra al ajuste?
- El dataset es sintético: dos cúmulos nublados en `(bytes_in, bytes_out)` más un volteo aleatorio de 5% de etiquetas. ¿Qué te enseña el *volteo* que un conjunto sintético perfectamente limpio ocultaría?

## Paso 1: Construye el dataset reproducible

Cada número posterior depende de este bloque, así que debe ser sembrado, documentado y dividido con cuidado.

### 1.1 Genera los datos de cúmulos

**👟 Pista inicial :** Usa `np.random.default_rng(7)` para dibujar 200 filas por clase de dos nubes, y luego voltea el 5% de las etiquetas al azar.

```python
# main.py
import numpy as np
import pandas as pd

rng = np.random.default_rng(7)
n = 400
X0 = rng.normal([2.0, 2.0], 1.6, size=(n // 2, 2))   # "unhealthy" cluster
X1 = rng.normal([6.0, 6.0], 1.6, size=(n // 2, 2))   # "healthy" cluster
X = np.vstack([X0, X1])
y = np.array([0] * (n // 2) + [1] * (n // 2))
flip = rng.random(n) < 0.05
y = np.where(flip, 1 - y, y)                          # 5% label noise

df = pd.DataFrame(X, columns=["bytes_in", "bytes_out"])
df["ok"] = y
print("shape:", df.shape)
print("balance:", df["ok"].value_counts().to_dict())
print(df.head(3).round(2).to_string(index=False))
```

`default_rng(7)` es la API moderna de numpy, una semilla fija significa dibujos idénticos en cada máquina. `flip = rng.random(n) < 0.05` elige ~5% de las filas y `1 - y` las invierte, así que las clases son genuinamente difíciles de separar en el límite, como los datos de red reales. Nota que el balance ya no es exactamente 200/200, los volteos mueven etiquetas a través, dejando un leve desbalance honesto.

**🎯 Resultado esperado :**

```
shape: (400, 3)
balance: {1: 208, 0: 192}
 bytes_in  bytes_out  ok
     2.00       2.48   0
     1.56       0.58   0
     1.27       0.41   0
```

**🩹 Si sale mal :** Si el balance es exactamente 200/200, la línea de volteo de etiquetas no corrió (o `rng.random(n)` se reemplazó por un RNG fresco). Si `head` muestra decimales diferentes, tu semilla de numpy o la línea `np.vstack` difieren, re-visa `default_rng(7)`.

### 1.2 Divide primero entrenamiento de prueba

**👟 Pista inicial :** Divide con `train_test_split(..., test_size=0.25, random_state=7, stratify=df["ok"])`, la división ocurre *antes* de que algo aprenda.

```python
# main.py (continued)
from sklearn.model_selection import train_test_split

train, test = train_test_split(df, test_size=0.25, random_state=7,
                               stratify=df["ok"])
print("train/test:", len(train), len(test))
print("test balance:", test["ok"].value_counts().to_dict())
```

Dividir una vez, desde el inicio, es la disciplina que mantiene honesto el resto del proyecto: cada imputador, escalador, pliegue de CV y búsqueda posterior ve **solo** `train`. `stratify` mantiene la razón de clases similar en ambos lados incluso con el desbalance 208/192, un shuffle plano podría dar un conjunto de prueba desafortunado.

**🎯 Resultado esperado :**

```
train/test: 300 100
test balance: {1: 52, 0: 48}
```

**🩹 Si sale mal :** Si los tamaños están volteados 75/25, el `test_size` se configuró en `0.75`. Si el balance de prueba está cerca de 50/50 pero no es exacto, esa es la aproximación estratificada de sklearn y está bien.

### 1.3 Verifica los datos + la división

**✅ Lista de verificación**

- ✅ `df.shape == (400, 3)`; balance `{1: 208, 0: 192}` desde la semilla 7.
- ✅ `train_test_split` da 300/100 con estratificación.
- ✅ Ejecutar el bloque dos veces produce DataFrames idénticos (¡semilla!).

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué el volteo de etiquetas *agrega* problema en lugar de restar? ¿Qué haría parecer artificialmente perfecto a un dataset de 0% ruido (imagina la puntuación de CV en un dataset donde las dos nubes nunca se superponen), y por qué te engañaría sobre un despliegue real?
- `stratify` opera sobre etiquetas de clase. Si esto fuera una regresión (`ok` continuo), stratify no aplicaría. ¿Qué propiedad del objetivo necesitarías entonces resguardar, y qué argumento de sklearn la proporciona?

## Paso 2: El pipeline de preprocesamiento

Los números crudos no alimentan un modelo; los números limpios y escalados sí. El paso 2 elimina valores faltantes y reescala sin tocar nunca el conjunto de prueba.

### 2.1 Introduce y localiza la ausencia

**👟 Pista inicial :** Copia las características de entrenamiento, perfora huecos del 10% y cuéntalos, un escenario realista de "el sensor soltó lecturas".

```python
# main.py (continued)
feat = train[["bytes_in", "bytes_out"]].copy()
miss = np.random.default_rng(1).random(feat.shape) < 0.10   # ~10% holes
feat[miss] = np.nan
print("NaNs  bytes_in:", feat["bytes_in"].isna().sum(),
      " bytes_out:", feat["bytes_out"].isna().sum())
```

Los huecos se inyectan **después** de la división, sobre una copia, para que los marcos reales `train`/`test` se mantengan enteros, aquí es donde un pipeline propenso a fugas imputaría felizmente desde datos de prueba y entrenaría en silencio sobre las 400 filas. `default_rng(1)` es una semilla *diferente* a la del paso 1, así que los datos mismos se mantienen fijos mientras la ausencia es reproducible por sí sola.

**🎯 Resultado esperado :**

```
NaNs  bytes_in: 23  bytes_out: 34
```

**🩹 Si sale mal :** Si los conteos difieren, la semilla del RNG o el comparador `.random(feat.shape)` cambiaron. Si `feat` lee entero después del print, la asignación de `np.nan` no se quedó, revisa que `miss` sea booleano y de misma forma.

### 2.2 Encadena imputar → escalar

**👟 Pista inicial :** Construye `Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())])` y haz `fit_transform` sobre las características agujereadas.

```python
# main.py (continued)
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

clean = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])
S = clean.fit_transform(feat)
print("scaled mean:", np.round(S.mean(axis=0), 4))
print("scaled std :", np.round(S.std(axis=0), 4))
print("imputed medians:", np.round(clean.steps[0][1].statistics_, 3))
```

El pipeline es una *secuencia de transformaciones que aprende solo de aquello en lo que lo haces `fit`*. `SimpleImputer(strategy="median")` llena cada hueco con la mediana de esa columna, aprendida de `feat`; `StandardScaler` luego hace z-escalado: media→0, std→1. Pregunta **por qué la mediana y no la media** para la imputación, la mediana es robusta a los picos inyectados, la media se movería bajo ellos. Después de imputar+escalar, la matriz de características está lista para cualquier modelo basado en distancia o regularizado.

**🎯 Resultado esperado :**

```
scaled mean: [ 0. -0.]
scaled std : [1. 1.]
imputed medians: [3.999 3.608]
```

**🩹 Si sale mal :** Si la media escalada no es ~0, el imputador corrió antes que el escalador *o* el escalador se ajustó sobre un marco diferente. Si `statistics_` da error, el imputador no se ha ajustado, olvidaste `fit_transform` y solo transformaste.

### 2.3 Verifica el pipeline

**✅ Lista de verificación**

- ✅ Conteos `bytes_in: 23, bytes_out: 34` desde los huecos sembrados.
- ✅ La salida fit-transformada tiene media ≈ 0, std ≈ 1 por columna.
- ✅ `.steps[0][1].statistics_` sostiene las medianas por columna usadas para la imputación.

**🤔 Pregunta(s) socrática(s)**

- El escalador aprende media/std de `train` **solo**. Si aprendiera de las 400 filas, ¿seguiría produciendo z-puntajes válidos? Sí, válidos pero *ajustados sobre datos futuros*, que es exactamente la fuga que infla las puntuaciones de CV. ¿Qué se filtra, precisamente, cuando el conjunto de prueba contribuye al `mean_` del escalador?
- La mediana imputada `3.999` está cerca del centro del cúmulo 0. Si una fila *de prueba* termina con `bytes_in` faltante, ¿qué número aprendido la llena, y por qué llenar desde la mediana de train es estrictamente mejor que llenar desde la propia clase de la fila, que el modelo no conoce en el momento de la inferencia?

## Paso 3: Haz competir el zoológico de modelos

El preprocesamiento es un pipeline fijo; el modelo es una elección. `cross_val_score` hace competir tres candidatos honestos solo sobre los pliegues de entrenamiento.

### 3.1 Puntúa tres modelos

**👟 Pista inicial :** Construye un dict `zoo` de pipelines/estimadores y reporta `cross_val_score(...).mean()` por modelo sobre `train`.

```python
# main.py (continued)
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import cross_val_score

zoo = {
    "logistic": make_pipeline(StandardScaler(),
                              LogisticRegression(max_iter=1000, random_state=1)),
    "tree": DecisionTreeClassifier(max_depth=4, random_state=1),
    "knn": KNeighborsClassifier(n_neighbors=15),
}
for name, est in zoo.items():
    scores = cross_val_score(est, train[["bytes_in", "bytes_out"]], train["ok"], cv=5)
    print(name, "-> mean", round(scores.mean(), 3))
```

Nota que el conjunto de prueba está **ausente aquí**: cada puntuación es validación cruzada de 5 pliegues sobre las 300 filas de entrenamiento, así que cada modelo entrena sobre 240 y puntúa sobre los 60 retenidos, cinco veces. El `zoo` de `main.py` mezcla un pipeline escalado (logística, que quiere características escaladas) con estimadores crudos (árbol y kNN, los árboles agnósticos al escalado lo ignoran, y kNN efectivamente re-escala por sí mismo vía distancia). Ni el árbol ni kNN ven datos faltantes, porque toman las columnas crudas *sin imputar*, para el zoológico la comparación más limpia es características tal cual, con una nota de que un autopiloto real alimentaría a cada modelo el mismo pipeline imputado.

**🎯 Resultado esperado :**

```
logistic -> mean 0.927
tree -> mean 0.9
knn -> mean 0.917
```

**🩹 Si sale mal :** Si los tres están en ≈0.5, el volteo de etiquetas consumió la señal (revisa el `flip` de la semilla 7). Si solo el árbol es mucho peor, `max_depth=4` está subajustando ese modelo mientras los otros se adaptan.

### 3.2 Lee la carrera con honestidad

**👟 Pista inicial :** Imprime también la varianza a nivel de pliegue, una media oculta un modelo ruidoso.

```python
# main.py (continued)
for name, est in zoo.items():
    scores = cross_val_score(est, train[["bytes_in", "bytes_out"]], train["ok"], cv=5)
    print(name, "->", [round(s, 3) for s in scores])
```

Una media de 5 pliegues es un resumen; los cinco números por pliegue son la sustancia. Un modelo cuyos pliegues son `[0.93, 0.90, 0.92, 0.91, 0.95]` dice "estable", mientras `[1.0, 0.75, 0.98, 0.80, 1.0]` dice "frágil" incluso con la misma media. Clientes discretos, splits de árbol y kNN en el límite se pliegan diferente, ver los cinco valores te dice qué media de qué modelo puedes confiar.

**🎯 Resultado esperado :** 5 puntuaciones por modelo cuya media coincide con el paso 3.1 (ej. los cinco pliegues de la logística promedian `0.927`, los valores exactos de pliegue varían por versión de sklearn; la *media* y el ranking no).

**🩹 Si sale mal :** Si las puntuaciones de pliegue se imprimen con envoltorios `np.float64`, eso es cosmético, conviértelos a float para una salida ordenada. Si el conteo de pliegues ≠ 5, `cv=` se cambió.

### 3.3 Verifica el zoológico

**✅ Lista de verificación**

- ✅ Tres modelos puntuados por CV de 5 pliegues sobre `train` solo; el conjunto de prueba no se toca.
- ✅ Ranking en esta ejecución: logística (0.927) > kNN (0.917) > árbol (0.900).
- ✅ Puntuaciones a nivel de pliegue impresas para no confiar las medias a ciegas.

**🤔 Pregunta(s) socrática(s)**

- La logística gana *a pesar de* querer características escaladas y de que el árbol las ignore, la señal es aproximadamente separable linealmente, y la logística la explota mejor. Si el límite verdadero fuera sinusoidal, ¿cuál de los tres ganaría probablemente, y qué dice eso sobre "el mejor modelo" como *propiedad de los datos* vs de la biblioteca?
- El `n_neighbors=15` de kNN se eligió por adivinanza. El paso 4 lo ajustará, pero ajustar *todos* los modelos desperdicia horas. ¿Qué te dice quién es el ganador de este zoológico, y qué hace que ajustar al subcampeón siga valiendo la pena?

## Paso 4: Barre los hiperparámetros

Los ganadores del zoológico reciben una pequeña búsqueda de cuadrícula. Aquí es donde el ajuste debe permanecer sobre los pliegues de entrenamiento *y* ser juzgado contra el CV, no contra la prueba.

### 4.1 Ajusta el árbol y los vecinos

**👟 Pista inicial :** `GridSearchCV(estimator, param_grid, cv=5)` sobre una cuadrícula compacta, y luego imprime `best_params_` y `best_score_`.

```python
# main.py (continued)
from sklearn.model_selection import GridSearchCV

gs_tree = GridSearchCV(DecisionTreeClassifier(random_state=1),
                       param_grid={"max_depth": [2, 3, 5],
                                   "min_samples_leaf": [1, 5, 10]},
                       cv=5)
gs_tree.fit(train[["bytes_in", "bytes_out"]], train["ok"])
print("tree best:", gs_tree.best_params_, "cv score", round(gs_tree.best_score_, 3))

gs_knn = GridSearchCV(KNeighborsClassifier(),
                      param_grid={"n_neighbors": [3, 5, 9],
                                  "weights": ["uniform", "distance"]},
                      cv=5)
gs_knn.fit(train[["bytes_in", "bytes_out"]], train["ok"])
print("knn best:", gs_knn.best_params_, "cv score", round(gs_knn.best_score_, 3))
```

`GridSearchCV` es CV automatizada *dentro de ti*: 3×3 = 9 configuraciones de árbol y 3×2 = 6 de kNN, cada una puntuada con CV de 5 pliegues sobre train, la búsqueda elige la configuración con la mejor puntuación media de CV. De manera crucial, **la mejor configuración se elige por validación cruzada de `train`**, no por exactitud de prueba. Un tester que "mejorara" el modelo para rendir mejor sobre el conjunto de prueba estaría ajustando con la clave de respuestas.

**🎯 Resultado esperado :**

```
tree best: {'max_depth': 3, 'min_samples_leaf': 1} cv score 0.903
knn best: {'n_neighbors': 3, 'weights': 'uniform'} cv score 0.937
```

**🩹 Si sale mal :** Si `best_params_` muestra extremos de la cuadrícula (ej. `max_depth: 5`), la cuadrícula es demasiado gruesa en esa dirección. Si `cv score` supera `0.94`, la ponderación `distance` de kNN está arrasando a la versión uniforme en este conjunto de pliegues, revisa `best_params_`.

### 4.2 La tensión CV-vs-prueba

**👟 Pista inicial :** Puntúa los dos ganadores ajustados sobre el *conjunto de prueba retenido* y compara con sus mejores puntuaciones de CV.

```python
# main.py (continued)
from sklearn.metrics import accuracy_score

for gs, name in [(gs_tree, "tree"), (gs_knn, "knn")]:
    acc = accuracy_score(test["ok"], gs.best_estimator_.predict(
        test[["bytes_in", "bytes_out"]]))
    print(name, "cv", round(gs.best_score_, 3), "-> test", round(acc, 3))
```

Esta es la brecha de honestidad que enseña todo el proyecto: el CV del árbol ajustado dice `0.903`, su prueba dice `0.91`; el CV de kNN dice `0.937`, su prueba `0.91`. Ni CV ni prueba están "mal", el CV promedia sobre 5 divisiones basadas en entrenamiento, la prueba mide un conjunto dibujado, pero **el número de prueba es el que cuenta para un informe**, y el número de CV es el que usaste para elegir. Reportar públicamente "0.937 en CV" lo sobrevendería.

**🎯 Resultado esperado :**

```
tree cv 0.903 -> test 0.91
knn cv 0.937 -> test 0.91
```

**🩹 Si sale mal :** Si la exactitud de prueba se imprime en lugar de `0.91`, el `best_estimator_` difiere de la mejor configuración de la cuadrícula (ajustaste un estimador fresco). Si CV y prueba divergen salvajemente, las semillas de pliegue están volviendo el CV sobre-optimista, márcalo en lugar de ocultarlo.

### 4.3 Verifica el barrido

**✅ Lista de verificación**

- ✅ Árbol ajustado a `max_depth=3, min_samples_leaf=1`; kNN a `n_neighbors=3, uniform`.
- ✅ Tanto las puntuaciones de CV como la exactitud de prueba independiente se imprimen y comparan.
- ✅ La decisión de exportar usó el resultado de *prueba*, no el techo de CV.

**🤔 Pregunta(s) socrática(s)**

- El CV de kNN (0.937) sobrepasó su prueba (0.91), mientras el árbol coincidió (0.903≈0.91). Dado que el CV de un modelo miente sobre el futuro, ¿cómo cambiaría un conjunto de *holdout* secundario, ajustar en train, elegir en dev, informar en test, qué número confías al desplegar?
- `GridSearchCV` corrió 9 configuraciones de árbol antes de que eligieras una. Cada configuración miró los mismos pliegues; elegir el mejor CV significa que efectivamente "probaste" 9 modelos. ¿Cuál es el nombre del sesgo optimista de esto, y cómo lo mantiene honesto un CV anidado o un conjunto de dev fijo?

## Paso 5: Exporta y carga al ganador

El producto final del autopiloto es un artefacto recargable: mismo pipeline, mismo estado, listo para puntuar tráfico nuevo en otro proceso. El paso 5 congela la elección.

### 5.1 Ajusta y guarda el pipeline final

**👟 Pista inicial :** Define el `Pipeline` final (escalador → logística), ajusta sobre `train`, puntúa sobre `test`, y luego `joblib.dump`.

```python
# main.py (continued)
import joblib

final = Pipeline([("scaler", StandardScaler()),
                  ("model", LogisticRegression(max_iter=1000, random_state=1))])
final.fit(train[["bytes_in", "bytes_out"]], train["ok"])
acc = accuracy_score(test["ok"], final.predict(test[["bytes_in", "bytes_out"]]))
print("final logistic test accuracy:", round(acc, 3))

joblib.dump(final, "autopilot.joblib")
print("saved", __import__("pathlib").Path("autopilot.joblib").stat().st_size, "bytes")
```

La logística es la ganadora del zoológico y la búsqueda de cuadrícula no la superó en prueba, así que el artefacto final es la logística escalada simple y bien entendida, la versión de ML de "la solución aburrida que funciona". Guardar con `joblib` serializa el *objeto ajustado* (coeficientes, medias del escalador, nombres de características) en un blob nativo de la plataforma, no solo una lista de pesos, sino todo lo necesario para predecir sobre tráfico de ayer en un proceso fresco.

**🎯 Resultado esperado :**

```
final logistic test accuracy: 0.91
saved 1665 bytes
```

**🩹 Si sale mal :** Si la exactitud ≠ 0.91, la semilla o el `test_size` derivaron del paso 1. Si `saved` imprime un tamaño mayor y un `.joblib` de 0 bytes, `joblib.dump` corrió antes de `fit` o sobre un objeto diferente, vuelca después de un `final` ajustado.

### 5.2 Carga y predice sobre tráfico nuevo

**👟 Pista inicial :** En un snippet fresco (o celda nueva), `joblib.load` el blob y puntúa un pequeño lote, incluyendo `predict_proba`.

```python
# main.py — the reload, as if a new process
import joblib
model = joblib.load("autopilot.joblib")

batch = [[2.0, 2.5], [6.0, 6.0], [4.0, 4.0]]
print("labels:", model.predict(batch).tolist())
print("probas:\n", model.predict_proba(batch).round(3))
```

El modelo recargado es el *mismo objeto*, las medias del escalador y los coeficientes de la logística volvieron intactos, así que `score` sobre el conjunto de prueba reproduce `0.91`. `predict_proba` te entrega confianza, no votos: una fila `[0.966, 0.034]` es un "no sano" fuerte, `[0.251, 0.749]` es un "sano" suave cerca del límite, exactamente lo que un humano en el circuito necesita antes de actuar sobre una decisión cerrada.

**🎯 Resultado esperado :**

```
labels: [0, 1, 0]
probas:
 [[0.966 0.034]
 [0.991 0.009]
 [0.251 0.749]]
```

**🩹 Si sale mal :** Si `joblib.load` da error por desajuste de versión, el blob lo volcó un nivel de parche de sklearn diferente, re-vuelca con el entorno de carga. Si `predict` devuelve clases no-enteras, tu `y` era una columna de cadenas; mantén el objetivo numérico.

### 5.3 Verifica la exportación

**✅ Lista de verificación**

- ✅ El pipeline ajustado puntúa `0.91` sobre la prueba retenida antes y después de un round-trip.
- ✅ `joblib.load` devuelve un `Pipeline` funcional con un `score` y `predict_proba` funcionales.
- ✅ Las filas de `batch` predicen con sensatez: clase 0 del extremo izquierdo con fuerza, clase 1 del extremo derecho con fuerza, el centro ambiguo.

**🤔 Pregunta(s) socrática(s)**

- El artefacto pesa 1.6 KB para 300 filas de entrenamiento. ¿Dónde vive realmente el "modelo", en los coeficientes y las medias del escalador, o en los datos de entrenamiento? Si los datos nunca viajan con el artefacto, ¿qué significa eso para la privacidad y para reentrenar después?
- `predict` dio clases duras y `predict_proba` dio confianzas. Un dashboard que consulta "0.24 de chance de fallo" para la fila 3, ¿alertarías en `> 0.5`? Enmarca qué *variable de umbral de decisión* agregaría al pipeline más allá del modelo.

## ⚠️ Errores comunes

- **Filtrar el conjunto de prueba al preprocesamiento.** Ajusta el imputador/escalador solo sobre `train`; llamar `fit_transform` sobre todas las 400 filas entrena sobre los datos que después "predecirás". La división viene primero, siempre.
- **Ajustar sobre el conjunto de prueba.** `GridSearchCV` con `test` en el fit agarra conocimiento de la clave de respuestas. Busca sobre `train`; prueba `test` solo una vez, al final.
- **`value_counts` después del volteo.** El ruido de etiquetas del 5% hace el balance `{1: 208, 0: 192}`, no 200/200. Afirmar igualdad exacta es afirmar que el ruido no corrió.
- **Imputar con `fit` vs `fit_transform`.** En un evaluador de streaming en vivo debes `transform` con el imputador *ajustado*, `fit` sobre una sola fila re-aprendería la mediana a partir de ella y explotaría.
- **Dos semillas RNG mezcladas.** `default_rng(7)` controla los datos, `default_rng(1)` controla la ausencia. Intercámbialas y *todos* los números posteriores cambian; mantenlas documentadas.
- **Desviación de versión de `joblib`.** Un blob volcado por sklearn 1.4 cargado en 1.6 normalmente funciona, pero las garantías entre versiones se aplican a los mismos paquetes instalados; `joblib.dump`/`load` en el mismo entorno es el round-trip seguro.

## Lo que acabas de construir

Un bucle de autopiloto real en una laptop: datos sintéticos sembrados, división estratificada, un pipeline de imputar-y-escalar que aprende solo con train, una carrera honesta de tres modelos vía validación cruzada, una búsqueda de cuadrícula cuyos números de CV y prueba divergen visiblemente, y un ganador serializado con `joblib` que puedes recargar en cualquier proceso. Las ideas que sobreviven el contacto con producción son las *fronteras*: división entrenamiento/prueba primero, preprocesadores que aprenden solo de train, modelos elegidos por validación cruzada pero reportados por un conjunto de prueba intacto, y un ajuste medido dos veces (una para elegir, una para reportar). Esa es la diferencia entre "mi modelo puntuó 0.93" y "mi modelo puntuó 0.91, y aquí está el número de CV que usé para elegir la configuración".

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/automl-pipeline/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/automl-pipeline) en el repositorio del curso es el pipeline completo como notebook, dataset, preprocesamiento, zoológico, barrido y exportación, ejecutable en Colab/Kaggle/Binder. Clona el repositorio o [ábrelo en un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Agrega un conjunto "dev" de tercer holdout: ajusta en train, elige la configuración en dev e informa en test, la forma documentada de frenar el optimismo del ajuste sin CV anidado.
- Alimenta a cada modelo del zoológico el *mismo* pipeline imputado+escalado (no características crudas) y registra si la ventaja de la logística es el preprocesamiento o el modelo.
- Grafica las puntuaciones de pliegue de CV como un box plot en tu biblioteca de gráficos favorita, la dispersión te dice qué modelo es frágil antes de que se envíe.
- Envuelve el blob exportado en una CLI diminuta: `uv run autopilot.py --model autopilot.joblib <bytes_in> <bytes_out>` imprime la etiqueta predicha y la confianza.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓