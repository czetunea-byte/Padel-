# 🎾 Padel Liga

Web app para llevar el registro de nuestras jornadas de padel: 4 jugadores, 3 partidos rotando parejas
(todos juegan con todos), games + handicap, y una tabla histórica de quién va ganando.

## Cómo funciona

- **Jornada**: la app arma los 3 cruces (A+B vs C+D, A+C vs B+D, A+D vs B+C). Cargas los games de cada partido con los botones +/−.
- **Puntos del día** = games ganados en los 3 partidos + **handicap** del jugador (se suma una vez por día).
  Desempate: más partidos ganados; si sigue el empate, comparten el lugar.
- **Tabla general**: ordenada por **días ganados**. Desempate: más 2º lugares, luego mejor lugar promedio.
- **Extras**: podio 🥇🥈🥉, rachas 🔥, cuchara de madera 🥄 para el último, mejor y peor pareja, récords y gráfica de la evolución en la tabla.
- El handicap se guarda "congelado" en cada jornada: si lo cambias, las jornadas viejas no se alteran.

Pantallas: 🏆 Tabla · 📜 Historial (ver, editar, borrar) · ➕ Jornada · 📈 Stats · ⚙️ Jugadores (nombre, emoji, color, handicap, compartir enlace).

## Probarlo en tu compu

```bash
npm install
npm run dev      # abre http://localhost:5173
npm test         # tests de la lógica de puntuación
```

Sin configurar nada funciona en **modo demo**: los datos se guardan solo en ese navegador.

## Compartirlo con el grupo (Firebase, gratis)

1. Entra a <https://console.firebase.google.com>, crea un proyecto (puedes desactivar Analytics).
2. **Build → Authentication → Comenzar → Método de acceso → Anónimo → Habilitar.**
3. **Build → Firestore Database → Crear base de datos** (modo producción, cualquier región).
   En la pestaña **Reglas**, pega el contenido de [`firestore.rules`](firestore.rules) y publica.
4. **Configuración del proyecto (⚙️) → Tus apps → Web (`</>`)**: registra la app y copia los valores de `firebaseConfig`.
5. En local: copia `.env.example` a `.env.local` y pega los valores.
6. Para publicarla: en GitHub, **Settings → Secrets and variables → Actions**, crea un secret por cada variable
   `VITE_FIREBASE_*` de `.env.example`. Luego **Settings → Pages → Source: GitHub Actions**.
   Cada push a `main` publica la app en `https://<tu-usuario>.github.io/Padel-/`.
7. Abre la app, crea la liga, y desde ⚙️ Jugadores usa **Compartir enlace** para mandarlo al WhatsApp.
   Tip: en el celular, "Agregar a pantalla de inicio" para usarla como app.

> Seguridad: no hay cuentas; quien tenga el enlace de la liga puede ver y cargar resultados.
> El id de la liga es aleatorio, así que el enlace funciona como contraseña.
