# Trasladar NeuroIA a Ubuntu (fase posterior)

Copiar el proyecto sin node_modules: las dependencias se instalan en el destino.

```sh
cd /ruta/a/NEUROIA
node --version
npm install --omit=dev
npm start
```

Comprobar desde Ubuntu con `curl http://127.0.0.1:3000/health`.

El servidor escucha en 127.0.0.1 por defecto, apropiado para un futuro Cloudflare Tunnel local. PORT permite cambiar el puerto; HOST permite cambiar la interfaz. No hace falta TensorFlow de Python, GPU ni una base de datos en Ubuntu.

Pendiente: configurar servicio systemd, un Tunnel independiente y la ruta neuro.dan-y.app → http://localhost:3000. No se ha creado ni publicado ningún túnel o dominio desde este proyecto.
