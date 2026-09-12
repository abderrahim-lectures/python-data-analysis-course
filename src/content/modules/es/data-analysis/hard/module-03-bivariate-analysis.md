---
title: "Análisis Bivariado y Multivariado"
description: "Explora las relaciones entre variables con dispersogramas, gráficos de pares y matrices de correlación."
order: 3
section: "data-analysis"
track: "hard"
difficulty: "advanced"
estimatedHours: 5
lessonCount: 2
tags: ["bivariate", "correlation", "scatter-plots", "pair-plots"]
prerequisites: ["module-02-univariate-analysis"]
icon: "🔗"
---

## Por qué importa

Las variables rara vez viven aisladas. El insight real de cualquier conjunto de datos emerge cuando examinas cómo interactúan dos o más variables. Un hospital conoce la edad del paciente, pero la pregunta que importa es: ¿cómo se relaciona la edad con el tiempo de recuperación? Una escuela conoce las calificaciones, pero el insight accionable es: ¿cómo difieren las calificaciones entre métodos de enseñanza? El análisis bivariado y multivariado es donde las columnas individuales se convierten en historias.

El peligro de saltarse este paso es enorme. Un equipo de marketing podría notar que las tasas de apertura de correos aumentaron tras un rediseño de campaña. Pero sin verificar la relación entre la tasa de apertura y el segmento de clientes, no detectan que el aumento vino enteramente de nuevos suscriptores, los clientes existentes en realidad se desengancharon. El pensamiento de una variable los llevó a una conclusión equivocada. El pensamiento de dos variables habría atrapado el problema.

El análisis de correlación añade rigor cuantitativo. La correlación de Pearson te dice si dos variables se mueven juntas linealmente. La de Spearman captura relaciones monótonas que Pearson pasa por alto. Pero ambas pueden engañar, la correlación no implica causalidad, y una correlación fuerte puede emerger de variables de confusión. Este módulo te enseña a ver las relaciones visualmente e interpretarlas estadísticamente, manteniendo un escepticismo saludable sobre lo que esas relaciones realmente significan.

La extensión multivariada, gráficos de pares, mapas de calor de correlación y comparaciones agrupadas, te permite examinar muchas relaciones simultáneamente. Aquí es donde descubres la multicolinealidad antes de que rompa un modelo de regresión, y donde encuentras los subgrupos ocultos que los promedios simples ocultan.

## Qué aprenderás

- Crea dispersogramas, gráficos de regresión y gráficos conjuntos para relaciones numérico-numéricas
- Construye gráficos de caja agrupados, de enjambre y de violín para comparaciones numérico-categóricas
- Calcula y visualiza matrices de correlación de Pearson y Spearman con mapas de calor
- Identifica multicolinealidad, variables de confusión y la paradoja de Simpson en vistas multivariadas
- Distingue correlación de causalidad usando conocimiento de dominio y diseño de estudio

## La derivación

El problema central que aborda el análisis bivariado es este: conocer dos variables de forma independiente no te dice nada sobre cómo se relacionan. El enfoque ingenuo es mirar dos estadísticas resumidas lado a lado, salario medio de hombres y salario medio de mujeres. Pero esto oculta la distribución. Quizás los hombres tienen mayor dispersión. Quizás el solapamiento es enorme. Quizás hay una tercera variable (años de experiencia) explicando toda la brecha.

Los dispersogramas resuelven esto graficando cada observación como un punto en un espacio bidimensional. El eje x es una variable, el eje y otra. Los patrones emergen al instante: una pendiente positiva sugiere una relación positiva, una pendiente negativa sugiere una relación inversa, una nube sin dirección sugiere que no hay relación lineal. Añadir una línea de regresión cuantifica la tendencia. Añadir un intervalo de confianza muestra su incertidumbre.

Ahora considera los pares numérico-categóricos. No puedes graficar una variable continua contra categorías con un dispersograma. En cambio, los gráficos de caja agrupados o de violín te permiten comparar distribuciones entre grupos. Esto revela si las categorías explican la variación de la variable continua, el fundamento del ANOVA y las pruebas t.

Las matrices de correlación comprimen todas las relaciones por pares en una sola tabla. Cada celda contiene un coeficiente de −1 (negativa perfecta) a +1 (positiva perfecta), donde 0 significa ausencia de relación lineal. Visualizada como mapa de calor, puedes detectar al instante qué variables están fuertemente correlacionadas, cuáles son independientes y cuáles podrían ser redundantes. Esto es esencial antes de construir cualquier modelo de regresión: la multicolinealidad alta infla los errores estándar y vuelve poco confiables los coeficientes.

El insight final es la paradoja de Simpson: una tendencia que aparece en datos agregados puede invertirse cuando miras subgrupos. Las calificaciones pueden parecer más altas para el Grupo A en general, pero dentro de cada rango de edad, el Grupo B califica más alto. La agregación ocultó la verdad. El análisis bivariado en múltiples niveles la revela.

## Gamificación

- **Recompensa de XP**: +60 XP por lección completada (120 XP en total para este módulo)
- **Desafíos**: Construye un mapa de calor de correlación desde cero, detecta la paradoja de Simpson en un conjunto de datos, identifica multicolinealidad y propón una corrección, crea un panel de comparación por pares
- **Progreso**: completa ambas lecciones para terminar este módulo
- **Bono de racha**: +15 XP extra por día cuando tu racha supera los 3 días
- **Desbloqueo del capstone**: Tus habilidades bivariadas son esenciales para el capstone del Módulo 5

## Proyectos que puedes construir

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 🏠 **Predictor de precios inmobiliarios**, explora las relaciones entre características y precios de venta
- 🩺 **Analizador de resultados clínicos**, examina cómo se correlacionan los factores de los pacientes con los resultados del tratamiento
- 📈 **Correlacionador de tendencias de mercado**, analiza las relaciones entre indicadores económicos
- 🎓 **Mapeador de resultados educativos**, estudia cómo se relacionan los factores demográficos con el rendimiento académico
- 🏋️ **Correlacionador de rendimiento fitness**, explora cómo se relacionan las variables de entrenamiento con las ganancias de rendimiento

## Lecciones

1. Análisis Bivariado Numérico, Dispersogramas, líneas de regresión, gráficos conjuntos y estrategias de agrupación
2. Análisis de Correlación, Pearson vs. Spearman, visualización con mapa de calor y detección de multicolinealidad