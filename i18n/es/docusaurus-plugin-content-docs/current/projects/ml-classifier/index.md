---
id: ml-classifier
title: "Entrena tu Primer Modelo de Machine Learning"
sidebar_label: "Entrena un Clasificador de ML"
slug: /projects/ml-classifier
description: "Gradúate de describir datos a predecir a partir de ellos: entrena un clasificador binario real sobre el dataset del Titanic con scikit-learn."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Entrena tu Primer Modelo de Machine Learning

<ProjectPublishedDate projectId="ml-classifier" />

<ProjectGreeting />

Este proyecto asume que te sientes cómodo con pandas más o menos al nivel del track Normal de Data Analysis — filtrado, `.groupby()`, manejo de valores faltantes. De hecho, asume que hiciste específicamente el [EDA guiado del Titanic de la Semana 10](/docs/data-analysis/normal/week-10): ya cargaste ese dataset, lo limpiaste, e hiciste preguntas como "¿la tasa de supervivencia varió según la clase o el sexo?". Este proyecto es la secuela directa. Ya *describiste* este dataset. Ahora vas a *predecir* a partir de él — entrenando un modelo que mira a un pasajero que nunca ha visto y adivina si sobrevivió.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/docs/projects) para ver la lista completa, que sigue creciendo.

## 🎯 Qué harás

1. Instalar `uv` y configurar un proyecto local con `scikit-learn` y `pandas`.
2. Cargar el mismo dataset del Titanic de la Semana 10, y codificar sus columnas categóricas como números.
3. Dividir los datos en un conjunto de entrenamiento y uno de prueba, y entender por qué importa esa división.
4. Entrenar un clasificador `LogisticRegression` y usarlo para predecir la supervivencia.
5. Evaluarlo correctamente, y luego entrenar un segundo modelo (`RandomForestClassifier`) y comparar.

## Dónde ejecutar esto

Tres formas razonables de hacer este proyecto — elige la que se ajuste a tu configuración:

- **En local con `uv` (recomendado).** Este proyecto es pequeño y no necesita GPU, así que es un buen candidato para realmente instalar Python de verdad en tu propia máquina, igual que los otros Proyectos del mundo real. Los Pasos 1–5 de abajo asumen este camino.
- **GitHub Codespaces.** Abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) para obtener un entorno de desarrollo en la nube con Node, Python y `uv` ya instalados (mira [`.devcontainer/devcontainer.json`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/.devcontainer/devcontainer.json)) — exactamente los mismos comandos de abajo funcionan desde una pestaña del navegador, sin ninguna instalación local.
- **Google Colab o Kaggle Notebooks.** Un buen ajuste genuino aquí: entrenar `LogisticRegression` o `RandomForestClassifier` sobre un dataset de este tamaño (unos pocos cientos de filas como máximo) no necesita GPU, así que un entorno de notebook gratuito es más que suficiente. Ejecuta `!pip install scikit-learn pandas` en una celda, y luego pega y adapta el código de los pasos de abajo. **Kaggle Notebooks en particular** es una elección bonita que cierra el círculo — el dataset del Titanic es en sí mismo una de las competencias originales y más famosas para principiantes de Kaggle, así que estarías entrenando un modelo en la propia plataforma de Kaggle, sobre el propio dataset de Kaggle.

## Paso 1: Instalar `uv`

`uv` es una única herramienta que reemplaza la cadena habitual de "instala Python, luego instala pip, luego instala una herramienta de entorno virtual, luego instala paquetes" — puede instalar y gestionar versiones de Python por sí misma, junto con las dependencias de tu proyecto.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, y luego confirma que se instaló:

```bash
uv --version
```

Luego configura el proyecto:

```bash
uv init ml-classifier
cd ml-classifier
uv add scikit-learn pandas
```

## Paso 2: Carga y prepara los datos

El mismo dataset, las mismas columnas del EDA de la Semana 10 — esta vez cargado desde el archivo de dataset crudo del curso en lugar del sandbox del navegador:

```python
import pandas as pd

url = "https://raw.githubusercontent.com/abderrahim-lectures/python-data-analysis-course/main/static/datasets/titanic.csv"
df = pd.read_csv(url)
df.head()
```

Repaso rápido de la limpieza que la Semana 10 ya recorrió en profundidad — solo lo suficiente aquí para obtener un DataFrame limpio, no vuelto a enseñar:

```python
df["Age"] = df["Age"].fillna(df["Age"].median())
df["Embarked"] = df["Embarked"].fillna(df["Embarked"].mode()[0])
df = df.drop(columns=["PassengerId", "Name"])  # identifiers, not predictive signal
```

### Codificando columnas categóricas

Esta parte es nueva. `Sex` y `Embarked` son strings ("male"/"female", "S"/"C"/"Q") — el `.groupby()` de la Semana 10 agrupaba felizmente por una columna de strings, pero los modelos de scikit-learn no lo hacen: cada modelo de este proyecto está, por debajo, haciendo aritmética con números, así que cada columna que entra tiene que ser ya numérica. `pd.get_dummies` maneja esto convirtiendo una columna categórica en varias columnas de 0/1, una por categoría:

```python
df = pd.get_dummies(df, columns=["Sex", "Embarked"], drop_first=True)
df.head()
```

`drop_first=True` elimina una categoría por columna (p. ej. mantiene `Sex_male` pero no `Sex_female`) porque la categoría eliminada está completamente implicada por que las demás sean 0 — mantener ambas sería redundante. `Sex` se convierte en una columna (`Sex_male`, 1 o 0); `Embarked` se convierte en dos (`Embarked_Q`, `Embarked_S`, ambas en 0 significando "C"). Esta es la misma forma de transformación que `pd.cut` en la Semana 10 — convertir una columna en una forma más fácil de consumir para el siguiente paso — solo que yendo de texto a números en lugar de de continuo a agrupado en bins.

Finalmente, separa las columnas desde las que estás prediciendo (las features, `X`) de la columna que estás prediciendo (el target, `y`):

```python
X = df.drop(columns=["Survived"])
y = df["Survived"]
```

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`df.isna().sum()` muestra cero valores faltantes en cada columna que estás a punto de entregarle al modelo.</StepChecklistItem>
<StepChecklistItem>`X.dtypes` no muestra ninguna columna `object` restante — todo es numérico.</StepChecklistItem>
<StepChecklistItem>`X` no contiene la columna `Survived`; `y` no contiene nada más.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

`pd.get_dummies` se aplicó a `Sex` y `Embarked`, pero no a `Pclass` (1, 2, o 3) — se dejó como una sola columna numérica. `Pclass` también es una categoría (no hay ningún sentido significativo en el que la clase 2 sea "el doble" de la clase 1), pero dejarla tal cual es una elección defendible que hacen algunos análisis reales. ¿Puedes pensar en un argumento para codificar `Pclass` de la misma forma que `Sex`, y un argumento para dejarla en paz?

## Paso 3: Divide en conjuntos de entrenamiento y prueba

Esta es la idea central sobre la que se construye este paso: **la puntuación de un modelo en datos con los que fue entrenado casi no te dice nada sobre cómo le irá con datos que nunca ha visto.** Un modelo puede — y, con suficiente libertad, lo hará — simplemente memorizar las filas de entrenamiento en lugar de aprender un patrón genuino. Imagina calificar a un estudiante usando las mismas preguntas para las que se le entregó la hoja de respuestas de antemano: una puntuación perfecta no te diría si entendió la materia o simplemente memorizó esas respuestas específicas. Evaluar un modelo con sus propios datos de entrenamiento tiene el mismo defecto. Para obtener una medida honesta de cómo se desempeña el modelo con pasajeros que nunca ha visto, tienes que reservar algunos datos y nunca dejar que el modelo entrene con ellos.

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
```

`test_size=0.2` reserva el 20% de las filas para pruebas, entrenando con el 80% restante. `random_state=42` fija la mezcla aleatoria usada para elegir qué filas van a dónde — sin él, obtendrías una división *distinta* (y por lo tanto una puntuación de precisión ligeramente distinta) cada vez que vuelvas a ejecutar el script, dificultando saber si un cambio en tu código realmente ayudó o simplemente tuviste una división más afortunada.

:::tip[Fuga de datos: prepara, luego divide — no al revés]
La codificación del Paso 2 se hizo sobre el dataset *completo*, antes de esta división, lo cual está bien aquí porque `pd.get_dummies` solo mira la propia categoría de cada fila, no la de ninguna otra fila. Pero es fácil equivocarse en esto con transformaciones que *sí* miran entre filas — por ejemplo, escalar una columna usando su media y desviación estándar. Si calculas esa media/desviación estándar sobre el dataset completo y luego divides, el conjunto de entrenamiento ha "visto" en silencio información del conjunto de prueba (sus filas contribuyeron a esa media). Esto se llama **fuga de datos** (data leakage), y es uno de los errores más comunes en el mundo real del machine learning aplicado — la solución es calcular siempre cualquier cosa que resuma los datos (medias, desviaciones estándar, listas de categorías) usando solo el conjunto de *entrenamiento*, y luego aplicar esa misma transformación al conjunto de prueba.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`X_train.shape` y `X_test.shape` muestran aproximadamente una división 80/20 del total de filas.</StepChecklistItem>
<StepChecklistItem>Volver a ejecutar la división con el mismo `random_state` reproduce exactamente las mismas filas en `X_test` cada vez.</StepChecklistItem>
<StepChecklistItem>`y_train` y `y_test` son ambos una mezcla de 0s y 1s, no todo un solo valor.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

Si entrenaras un modelo y lo evaluaras con `X_train`/`y_train` en lugar de `X_test`/`y_test` por error, ¿esperarías que la precisión se viera *mejor* o *peor* que el número honesto — y por qué?

## Paso 4: Entrena un clasificador

`LogisticRegression`, a pesar del nombre, es un clasificador, no un modelo de regresión en el sentido habitual. La idea: para cada pasajero, calcula una suma ponderada de sus features (edad, tarifa, sexo, clase, ...) — la misma forma de cálculo que una ecuación lineal ordinaria — y luego aplasta esa suma a través de una función (la función logística/sigmoide) que mapea cualquier número a un valor entre 0 y 1. Esa salida se interpreta como una *probabilidad* estimada de supervivencia. "Ajustar el modelo" significa encontrar el conjunto de pesos que hace que esas probabilidades estimadas se alineen lo más posible con los resultados reales de 0/1 en los datos de entrenamiento. Una predicción es entonces simplemente "probabilidad ≥ 0.5 → predice sobrevivió".

```python
from sklearn.linear_model import LogisticRegression

model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

predictions = model.predict(X_test)
```

`.fit(X_train, y_train)` es donde ocurre el aprendizaje — nunca ve `X_test` ni `y_test`. `max_iter=1000` eleva el tope de cuántos pasos de optimización da el solver para converger; el valor por defecto a veces no alcanza para estos datos y scikit-learn te avisará si se detiene antes de tiempo.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`model.fit(...)` se ejecuta sin advertencia de convergencia (o subiste `max_iter` hasta que dejó de aparecer).</StepChecklistItem>
<StepChecklistItem>`predictions` es un array de la misma longitud que `y_test`, conteniendo solo 0s y 1s.</StepChecklistItem>
<StepChecklistItem>Puedes imprimir `model.predict_proba(X_test)[:5]` y ver que devuelve probabilidades reales, no solo la decisión final de 0/1.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

`predict_proba` podría devolver algo como 0.51 para un pasajero y 0.98 para otro — ambos se redondean a la misma predicción final (1), pero representan niveles de confianza muy distintos. ¿Qué decisión del mundo real podría cambiar si tuvieras acceso a esa probabilidad, en lugar de solo la predicción final de sí/no?

## Paso 5: Evalúa y compara modelos

El único número con el que empezar es la precisión (accuracy) — la fracción de predicciones del conjunto de prueba que coincidió con el resultado real:

```python
from sklearn.metrics import accuracy_score, confusion_matrix

accuracy = accuracy_score(y_test, predictions)
print(f"Logistic Regression accuracy: {accuracy:.1%}")
```

La precisión sola oculta *qué tipo* de errores comete el modelo. Una matriz de confusión desglosa eso:

```python
cm = confusion_matrix(y_test, predictions)
print(cm)
```

El resultado es una cuadrícula de 2×2. Leyéndola en términos simples: cuenta, por separado, cuántos pasajeros que realmente murieron fueron correctamente predichos como muertos, cuántos que realmente murieron fueron incorrectamente predichos como sobrevivientes (un **falso positivo** de "sobrevivió"), cuántos que realmente sobrevivieron fueron incorrectamente predichos como muertos (un **falso negativo**), y cuántos que realmente sobrevivieron fueron correctamente predichos como sobrevivientes. Dos modelos con precisión idéntica pueden cometer *tipos* de errores muy distintos — algo que vale la pena saber, especialmente en dominios donde un tipo de error (digamos, un diagnóstico médico no detectado) es mucho más costoso que el otro.

Ahora entrena un segundo modelo, de tipo distinto, sobre exactamente la misma división, y compara honestamente:

```python
from sklearn.ensemble import RandomForestClassifier

rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)
rf_predictions = rf_model.predict(X_test)

rf_accuracy = accuracy_score(y_test, rf_predictions)
print(f"Random Forest accuracy: {rf_accuracy:.1%}")
print(confusion_matrix(y_test, rf_predictions))
```

Un bosque aleatorio (random forest) entrena muchos árboles de decisión pequeños, cada uno sobre un subconjunto aleatorio ligeramente distinto de los datos y las features, y los hace votar sobre la predicción final — una idea subyacente distinta al enfoque de suma ponderada más probabilidad de la regresión logística. Compara los dos números de precisión que ahora tienes. No asumas que el más alto es automáticamente "el mejor modelo" — mira el error común de abajo.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Tienes dos números de precisión, calculados sobre el *mismo* `X_test`/`y_test`, uno por modelo.</StepChecklistItem>
<StepChecklistItem>Has impreso ambas matrices de confusión y puedes decir, en una oración, qué tipo de errores cometió cada modelo.</StepChecklistItem>
<StepChecklistItem>No has declarado un "ganador" sin considerar qué tan pequeña es realmente la brecha entre ellos.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si tu modelo obtiene 95% de precisión pero el dataset es 95% de una sola clase, ¿qué te dice realmente ese número? (Verifica: ¿qué fracción de los pasajeros del Titanic realmente sobrevivió — está cerca de 50/50, o sesgada?)
- Los dos puntajes de precisión de los modelos probablemente difieren solo por unos pocos puntos porcentuales, calculados sobre un conjunto de prueba de apenas unas 20 filas (la versión de este curso del dataset tiene alrededor de 100 filas en total, más pequeño que el dataset original del Titanic de Kaggle, de ~900). ¿Qué tan seguro deberías estar de que esta brecha específica se mantendría en una división aleatoria distinta del 20% de prueba?

## ⚠️ Errores comunes

- **Codificar los conjuntos de entrenamiento y prueba de forma inconsistente.** Si divides primero y luego ejecutas `pd.get_dummies` por separado en cada mitad, una categoría presente en entrenamiento pero ausente en prueba (o viceversa) puede producir columnas no coincidentes entre `X_train` y `X_test`, rompiendo `.fit()`/`.predict()` o produciendo silenciosamente resultados incorrectos. Codifica antes de dividir cuando la codificación solo mira los propios valores de cada fila (como aquí), o ajusta el codificador solo con datos de entrenamiento y aplícalo a los datos de prueba, nunca al revés.
- **Fuga de datos (data leakage)** — ajustar cualquier transformación que resuma el *dataset completo* (un escalador, un codificador con estadísticas entre filas) antes de dividir, en lugar de después. Mira el consejo del Paso 3; este es uno de los errores más comunes en el mundo real del machine learning aplicado, y infla silenciosamente tu precisión de prueba a un número demasiado optimista.
- **Sobreinterpretar una pequeña diferencia de precisión.** Con un conjunto de prueba tan pequeño (unas 20 filas, ya que el dataset de este curso tiene solo unas 100 filas en total), una brecha de 2-3 puntos porcentuales — a menudo solo una o dos predicciones invertidas — está bien dentro del rango que esperarías de ruido aleatorio en *qué* filas terminaron en la división de prueba, no necesariamente evidencia de que un modelo sea genuinamente mejor. La validación cruzada (ver abajo) es la forma estándar de obtener una comparación más confiable, y importa aún más en un dataset de este tamaño.
- **Olvidar `random_state`.** Sin él, tu división (y la aleatoriedad interna de algunos modelos) cambia en cada ejecución, haciendo imposible saber si un cambio que hiciste realmente mejoró algo o simplemente obtuviste una división aleatoria distinta.

## Lo que acabas de construir

Tomaste un dataset que ya habías explorado y resumido con pandas, y lo llevaste un paso más allá: un modelo que generaliza de los ejemplos que vio a una predicción sobre ejemplos que no vio. Nada aquí es exótico — `LogisticRegression` y `RandomForestClassifier` son dos de los clasificadores más usados en la práctica — pero la forma del flujo de trabajo (preparar datos, dividir honestamente, ajustar, evaluar, comparar) es la misma forma usada para modelos mucho más sofisticados.

:::tip[Revisa la documentación actual de scikit-learn]
scikit-learn es una biblioteca madura y estable, pero su API sí cambia ocasionalmente entre versiones mayores — los valores por defecto de parámetros cambian, y las funciones se marcan obsoletas en favor de otras nuevas. Antes de confiar en este código más allá de un proyecto de curso, hojea la [documentación actual de scikit-learn](https://scikit-learn.org/stable/) para la versión que realmente tienes instalada (`uv pip show scikit-learn`).
:::

## A dónde ir desde aquí

- **Ingeniería de features.** La columna `Name` se eliminó en el Paso 2, pero no es inútil — títulos como "Mr.", "Mrs.", "Miss." y "Master." (incrustados en el string del nombre) se correlacionan fuertemente con la edad y el sexo, y extraerlos como una nueva columna categórica es una mejora clásica para este dataset exacto.
- **Validación cruzada.** Una sola división train/test da un único número de precisión que depende en parte de la suerte (qué filas cayeron dónde). `sklearn.model_selection.cross_val_score` repite el ciclo de dividir-entrenar-evaluar varias veces sobre distintos cortes y promedia el resultado — una forma más confiable de comparar dos modelos que la comparación única del Paso 5.
- **Un dataset completamente distinto.** Kaggle aloja cientos de datasets pequeños y bien documentados para principiantes, similares en espíritu al del Titanic — un buen próximo paso una vez que este flujo de trabajo se sienta rutinario.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes para agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, hacer commit de tus archivos, y abrir el PR, un paso a la vez. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="ml-classifier" />
