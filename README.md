# NeuroIA

Laboratorio educativo de aprendizaje automático real. HTML, CSS y módulos JavaScript; Express sirve archivos, TensorFlow.js entrena una red neuronal dentro de un Web Worker y Chart.js presenta las métricas.

## Ejecutar localmente

En esta computadora las dependencias ya están instaladas. Puedes abrir `iniciar.cmd` con doble clic y visitar http://localhost:3000. El lanzador usa Node.js del sistema o el runtime local de Codex si está disponible. Si ya hay un servidor abierto en ese puerto, utiliza la instancia existente.

Requiere Node.js 20 o posterior y npm (incluido en la instalación estándar de Node.js).

```sh
npm install
npm start
```

Abrir http://localhost:3000. Para desarrollar con reinicio automático del servidor: `npm run dev`. Para pruebas: `npm test`. También se puede usar `pnpm install --ignore-scripts` y `pnpm start`; se incluye pnpm-lock.yaml para fijar dependencias transitivas. Las dependencias usadas no requieren scripts de instalación.

Las librerías se sirven desde node_modules: después de la instalación no hace falta internet. No abrir index.html directamente, porque el Worker necesita HTTP. Mantén la terminal del servidor abierta; Ctrl+C lo detiene.

## Primera demostración

1. Abre el laboratorio y pulsa **Entrenar modelo** sobre los dos grupos iniciales.
2. Observa pérdida, precisión y fondo del plano durante las 200 épocas.
3. Selecciona **Probar** y toca nuevas posiciones para obtener P(A) y P(B).
4. Carga **XOR** o **Círculos**, entrena y observa una frontera no lineal.
5. Agrega o borra ejemplos y vuelve a entrenar. Cambiar datos o parámetros invalida el modelo anterior.

**Detener** conserva el modelo de la última época. **Reiniciar** elimina el modelo y las métricas conservando los puntos. Cada entrenamiento comienza desde pesos nuevos determinados por la semilla. **Cargar ejemplos** usa la semilla actual para generar datos reproducibles. Máximo: 500 puntos, 32 neuronas y 1000 épocas.

## Arquitectura

```text
server.js                 Servidor de archivos, librerías y /health
public/index.html         Inicio, laboratorio y explicación
public/css/styles.css     Diseño adaptable y movimiento reducido
public/js/app.js          Interfaz y ciclo de vida del Worker
public/js/dataset.js      Generador con semilla y validaciones
public/js/model.js        Creación, entrenamiento y predicción
public/js/worker.js       TensorFlow.js en hilo separado
public/js/canvas.js       Puntos y probabilidades del plano
public/js/charts.js       Métricas de cada época
tests/model.test.js       Aprendizaje, repetibilidad, parada y memoria
docs/deployment.md        Traslado futuro a Ubuntu
```

## Qué se está midiendo

Red: dos coordenadas normalizadas en [-1,1] → capa densa tanh → salida sigmoid. Optimización Adam, pérdida binary cross-entropy, lotes completos y sin barajado. Backend CPU dentro del Worker para compatibilidad y bajo consumo. La interfaz permanece en otro hilo.

La pérdida y precisión se evalúan sobre todos los ejemplos después de cada época. La frontera calcula predicciones en una cuadrícula de 40 × 40, cada cinco épocas y al finalizar. El diagrama de neuronas muestra la arquitectura; no inventa activaciones ni pesos. Los datos son ejemplos sintéticos o introducidos por el usuario, y todas las métricas proceden del entrenamiento real.

La precisión es de entrenamiento, no de validación. Las probabilidades no están calibradas ni garantizan aciertos fuera de los ejemplos. La semilla fija datos y pesos iniciales; no se promete igualdad bit a bit entre dispositivos o versiones. Los datos y el modelo viven en memoria: recargar la página los reinicia.

## Alcance

MVP local: inicio, clasificación, edición de datos, entrenamiento, parada, métricas y predicciones. No hay cuentas, base de datos, envío de puntos al servidor ni ejecución de código del usuario. Laboratorio de programación y reconocimiento de dibujos pendientes para fases posteriores. Cloudflare no está configurado en esta etapa.

## Prueba lógica guiada

El laboratorio abre ahora con un reto XOR: dos interruptores y una lámpara encendida cuando sus posiciones difieren. Se entrenan cuatro ejemplos, con 8 neuronas y 200 épocas. Las entradas 0/1 se codifican como -0.7/+0.7. Los interruptores seleccionan qué caso observar sin modificar los datos.

El panel reúne respuesta correcta, predicción, activaciones, pesos, época, error y aciertos. Las activaciones se calculan aplicando las capas del mismo modelo; las conexiones muestran pesos reales. La lectura inicial corresponde a la época cero. Los ritmos Visible y Paso lento agregan una pausa entre épocas para facilitar la explicación, sin alterar el aprendizaje. La gráfica conserva el historial por cada caso. La tabla evalúa ejemplos de entrenamiento, no generalización. El modo libre sigue disponible en «Explorar con puntos».

## Dentro de la IA

- **Una neurona paso a paso:** entradas, pesos y sesgo editables; productos, suma y tanh calculados en JavaScript. Resalta el código de cada operación. Es cálculo manual, no entrenamiento.
- **Enséñale a sumar:** una neurona lineal de TensorFlow.js aprende con 64 pares reproducibles en [-10,10], durante 180 épocas con Adam. Se normalizan entradas por 10 y etiquetas por 20. El resultado exacto de la calculadora se compara con la predicción calculada usando los pesos actuales. Puedes cambiar los números durante el entrenamiento.
- **Validación:** 24 pares distintos, generados con otra semilla, no intervienen en el ajuste. Se muestra error absoluto medio en unidades originales, no una precisión de clasificación.
- **Código:** fragmentos educativos de datos, modelo, entrenamiento y predicción, más lectura del archivo real `public/js/arithmetic.js`. No hay eval ni ejecución arbitraria. `arithmetic-worker.js` mantiene el entrenamiento fuera del hilo de interfaz.

Pruebas del navegador opcionales: con Playwright disponible, ejecutar `node tests/inside-check.cjs`, `node tests/guided-check.cjs` y `node tests/browser-check.cjs` con el servidor iniciado. Los scripts utilizan Microsoft Edge; PLAYWRIGHT_PATH permite indicar una instalación externa de Playwright. Las pruebas matemáticas se ejecutan con `npm test`.

## GitHub

NeuroIA tiene su propio repositorio local en esta carpeta. No se ha configurado un remoto ni publicado. Al crear un repositorio vacío en GitHub, comparte su URL para conectarlo y subirlo. No incluyas node_modules, .env, registros ni capturas de pruebas: ya están excluidos por .gitignore.
