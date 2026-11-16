# Publicar la app en Google Play y en la App Store

La app ya está preparada con **Capacitor**: la misma app web se empaqueta como app de Android y de iPhone.
Todo lo que cambia en la web se pasa a las apps volviendo a armarlas (no hay que programar dos veces).

## Qué cuesta

| | Google Play (Android) | App Store (iPhone) |
|---|---|---|
| Cuenta | 25 USD, **un solo pago** | 99 USD **por año** (las ONG pueden pedir que se lo perdonen, según el país) |
| ¿Hace falta una Mac? | No | No: la app se arma en una Mac de GitHub, gratis porque el repositorio es público |
| Tiempo de revisión | De horas a unos días | De 1 a 3 días |

## Recomendación: cuenta de organización, no personal

- **Google Play** a las cuentas *personales* nuevas les exige una prueba cerrada con **12 personas durante 14 días** antes de publicar. Las cuentas de **organización** no tienen ese requisito.
- Las dos tiendas piden para las organizaciones un **número D-U-N-S** (gratis, lo da Dun & Bradstreet; tarda entre unos días y un par de semanas). Se pide en https://www.dnb.com/duns/get-a-duns.html o desde el formulario de Apple: https://developer.apple.com/enroll/duns-lookup/
- Con cuenta de organización, en la tienda aparece "Akãhatã" como quien publica, y no el nombre de una persona.

## Pasos

### 1. Lo que hace Akãhatã (una sola vez)
1. Pedir el número D-U-N-S con los datos legales de la organización (nombre legal, dirección, teléfono, sitio web).
2. Crear la cuenta de **Google Play Console** como organización: https://play.google.com/console/signup (25 USD, con tarjeta).
3. Crear la cuenta de **Apple Developer** como organización: https://developer.apple.com/programs/enroll/ (99 USD/año). Apple llama por teléfono para verificar.
4. Revisar la política de privacidad: https://fdelio.github.io/AKAHATARED/privacidad.html (las tiendas la piden).
5. Crear una cuenta de prueba en la app (correo y contraseña) para que las tiendas puedan revisarla por dentro.

### 2. Android
1. Probar la app en un celular Android: en GitHub → Actions → "Apps para celular" → descargar `android-apk-de-prueba` e instalarlo.
2. Crear la clave de firma y cargarla en GitHub como secretos (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`). Claude puede prepararla. **Guardarla bien: sin ella no se pueden publicar actualizaciones.**
3. Con los secretos cargados, el mismo botón arma `android-para-google-play` (archivo `.aab`), que se sube en Play Console.
4. Completar la ficha en Play Console: descripción, capturas, ícono, categoría, cuestionario de contenido, "Seguridad de los datos" y el enlace para borrar la cuenta: https://fdelio.github.io/AKAHATARED/privacidad.html#borrar-cuenta

### 3. iPhone
1. Con la cuenta de Apple activa, crear una **clave de API de App Store Connect** (Users and Access → Integrations) y cargarla en GitHub como secretos.
2. Claude agrega la parte del proceso que firma la app y la sube a App Store Connect (TestFlight) desde la Mac de GitHub.
3. Completar la ficha en App Store Connect: descripción, capturas, privacidad, cuenta de prueba, y enviar a revisión.

## Datos técnicos
- Identificador de la app (no se puede cambiar después de publicar): `org.akahataorg.radar`
- Nombre en el celular: "Radar Akãhatã"
- Íconos y pantalla de inicio: se generan desde `assets/` con `npx @capacitor/assets generate --android --ios`.
- Después de cambiar la web, para actualizar las carpetas nativas: `npm run build && npx cap sync`.
- Los enlaces de los correos (confirmar cuenta, recuperar contraseña) abren la versión web; después se entra a la app con correo y contraseña.
