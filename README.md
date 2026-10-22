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
- **Temporadas** por trimestre (Ene–Mar, Abr–Jun, Jul–Sep, Oct–Dic): la tabla se puede ver por temporada o histórica,
  y el Salón de la fama guarda a cada campeón.
- **Dinero 💰**: el 1º del día cobra $300 (el 3º paga $100 y el 4º $200; el 2º ni paga ni cobra). En empates se reparte.
  En un **zapato** 👟 (la pareja perdedora hace 0 games, automático) o una **remontada** 🔄 (se marca a mano),
  cada perdedor le paga $100 a un ganador. La pantalla de Cuentas lleva el saldo, dice quién le paga a quién
  y tiene el botón "Ya pagamos" para dejar todo en $0.
- **Perfil** de cada jugador (toca su nombre en la tabla): récord contra cada rival, mejor compañero, némesis e insignias.
- **Handicap sugerido** (en ⚙️): la mitad de los games que a cada quien le faltan para el mejor promedio de las últimas 8 jornadas.
- **Compartir en WhatsApp** el resultado del día, con podio, marcadores, dinero y carrilla.

Pantallas: 🏆 Tabla · 📜 Historial (ver, editar, borrar, compartir) · ➕ Jornada · 💰 Cuentas · 📈 Stats ·
⚙️ Jugadores (nombre, emoji, color, handicap, handicap sugerido, compartir enlace).

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
4. **Configuración del proyecto (⚙️) → Tus apps → Web (`</>`)**: registra la app y copia los valores de `firebaseConfig`
   en [`.env.production`](.env.production) (ya está con los de `padel-cuates`). No son secretos: los datos los protegen las reglas.
5. Para probar contra Firebase en local, copia esos valores a `.env.local` (sin él, `npm run dev` usa el modo demo).
6. Para publicarla: en GitHub, **Settings → Pages → Source: GitHub Actions**.
   Cada push a `main` publica la app en `https://<tu-usuario>.github.io/Padel-/`.
7. Abre la app, crea la liga, y desde ⚙️ Jugadores usa **Compartir enlace** para mandarlo al WhatsApp.
   Tip: en el celular, "Agregar a pantalla de inicio" para usarla como app.

> Seguridad: no hay cuentas; quien tenga el enlace de la liga puede ver y cargar resultados.
> El id de la liga es aleatorio, así que el enlace funciona como contraseña.
