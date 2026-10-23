# NeuroIA

Laboratorio educativo de aprendizaje automático real. HTML, CSS y módulos JavaScript; Express sirve archivos, TensorFlow.js entrena una red neuronal dentro de un Web Worker y Chart.js presenta las métricas.

## Ejecutar localmente

Requiere Git, Node.js 20 o posterior y npm. Los siguientes comandos sirven en Windows y Ubuntu:

```sh
git clone https://github.com/dannysv777/NeuroIA.git
cd NeuroIA
npm install
npm start
```

Abrir http://localhost:3000. Si ya tienes el proyecto, entra a su carpeta y omite `git clone` y `cd NeuroIA`.

- `npm start`: inicia el servidor.
- `npm run dev`: reinicia el servidor automáticamente al cambiar archivos.
- `npm test`: ejecuta las pruebas matemáticas del aprendizaje.

Actualmente se conserva `pnpm-lock.yaml` y no existe `package-lock.json`. Por eso la primera instalación con npm usa `npm install`, no `npm ci`. Si se adopta npm como gestor, conserva y sube el `package-lock.json` que genere; después usa `npm ci` para instalaciones reproducibles. No borres un archivo de bloqueo existente. Para reproducir las versiones ya fijadas con pnpm, usa `pnpm install --frozen-lockfile --ignore-scripts` y `pnpm start`.

En Windows también puedes abrir `iniciar.cmd` con doble clic después de instalar las dependencias. Es un lanzador opcional; Ubuntu utiliza `npm start` y no depende de ese archivo ni de Codex.

Las librerías se sirven desde node_modules: después de la instalación no hace falta internet. No abrir index.html directamente, porque el Worker necesita HTTP. Mantén la terminal del servidor abierta; Ctrl+C lo detiene.

## Puerto y Ubuntu

El puerto predeterminado es 3000 y se puede cambiar con `PORT`. El servidor escucha en `127.0.0.1`, apropiado para Cloudflare Tunnel en el mismo servidor.

Ubuntu:

```sh
PORT=3001 npm start
```

PowerShell:

```powershell
$env:PORT = '3001'
npm start
```

Para comprobar el servicio, abre `/health` en el puerto elegido. En Ubuntu: `curl http://127.0.0.1:3000/health` si usas el puerto predeterminado. Las variables se leen del entorno; el servidor no carga archivos `.env` automáticamente. Para escuchar en otras interfaces se puede establecer `HOST=0.0.0.0`; no es necesario para un túnel local.

Consulta [el procedimiento de Ubuntu](docs/deployment.md). No copies `node_modules` de Windows: instala las dependencias en Ubuntu. El entrenamiento se realiza en el navegador; no hace falta GPU en el servidor.

## Primera demostración

1. Abre el laboratorio y selecciona **Explorar con puntos**. Pulsa **Entrenar modelo** sobre los dos grupos iniciales.
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

Incluye inicio, clasificación, edición de datos, entrenamiento, parada, métricas, predicciones, prueba lógica guiada y código educativo con cálculo de neuronas y aprendizaje de suma. No hay cuentas, base de datos, envío de puntos al servidor ni ejecución arbitraria de código del usuario. Reconocimiento de dibujos pendiente para una fase posterior. Cloudflare no está configurado en esta etapa.

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

El repositorio ya está inicializado en la rama `main` y conectado a https://github.com/dannysv777/NeuroIA.git. No es necesario repetir `git init` ni `git remote add`.

Para subir cambios desde la carpeta del proyecto:

```sh
git status
git add .gitignore README.md docs/deployment.md
git diff --cached
git commit -m "Documentar instalacion y preparar despliegue en Ubuntu"
git push origin main
```

`.gitignore` excluye dependencias, variables de entorno, archivos comunes de credenciales y claves privadas, registros y temporales. Permite plantillas `.env.example` y `.env.sample`, que deben contener solo valores ficticios. Las exclusiones no detectan contraseñas escritas dentro del código ni dejan de rastrear archivos ya versionados: revisa el diff antes de publicar. Esta aplicación no necesita contraseñas ni tokens para funcionar.
