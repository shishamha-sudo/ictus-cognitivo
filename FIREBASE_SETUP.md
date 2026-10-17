# Configuración Firebase - ICTUS Cognitivo v3.0

La rama `feature/multiusuario-google` incorpora autenticación Google y datos multiusuario.

## 1. Crear proyecto Firebase
1. Abrir https://console.firebase.google.com/
2. Crear un proyecto, por ejemplo `ictus-cognitivo`.
3. Añadir una aplicación Web.

## 2. Copiar configuración web
En Project settings > Your apps > SDK setup and configuration, copiar los valores a `firebase-config.js`.

La configuración web de Firebase es pública por diseño; la seguridad depende de Authentication y de las reglas de Firestore.

## 3. Authentication
En Authentication > Sign-in method:
- Activar Google.
- Añadir `shishamha-sudo.github.io` como dominio autorizado si no aparece automáticamente.

## 4. Firestore
Crear una base de datos Cloud Firestore y publicar las reglas contenidas en `firestore.rules`.

## 5. Administrador
El administrador inicial está fijado en:
`shishamha@gmail.com`

Los demás usuarios que entren con Google se crean automáticamente con rol `user`.

## Datos
- `users/{uid}`: perfil, rol, fechas de alta/último acceso.
- `users/{uid}/results/{resultId}`: histórico privado del usuario.
- `usageLogs/{logId}`: login, logout, inicio/finalización de test y accesos de administración.

No guardar diagnósticos ni información clínica sensible en el log.
