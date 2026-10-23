# Trasladar NeuroIA a Ubuntu (fase posterior)

Con Git, Node.js 20 o posterior y npm instalados, clona el proyecto. No copies node_modules desde Windows: las dependencias se instalan en el destino.

```sh
git clone https://github.com/dannysv777/NeuroIA.git
cd NeuroIA
node --version
npm install --omit=dev
npm start
```

Comprobar desde Ubuntu con `curl http://127.0.0.1:3000/health`.

Si el proyecto ya está clonado, entra a su carpeta y usa `git pull --ff-only` antes de instalar. Actualmente existe `pnpm-lock.yaml`, no `package-lock.json`. Si tienes pnpm, puedes instalar las versiones fijadas con `pnpm install --frozen-lockfile --ignore-scripts`. Si se incorpora `package-lock.json` al repositorio, consérvalo y sustituye la instalación con npm por `npm ci --omit=dev`.

Para cambiar el puerto: `PORT=3001 npm start`. Las variables se pasan desde la terminal o el futuro servicio systemd; no se carga `.env` automáticamente. Mantén el proceso activo durante la prueba; Ctrl+C lo detiene.

El servidor escucha en 127.0.0.1 por defecto, apropiado para un futuro Cloudflare Tunnel local. PORT permite cambiar el puerto; HOST permite cambiar la interfaz. No hace falta TensorFlow de Python, GPU ni una base de datos en Ubuntu.

Pendiente: configurar servicio systemd, un Tunnel independiente y la ruta neuro.dan-y.app → http://localhost:3000. No se ha creado ni publicado ningún túnel o dominio desde este proyecto.
