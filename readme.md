# Discord ↔︎ n8n Bridge

Puente ligero en Node.js que escucha el canal **#general** de tu servidor
de Discord y envía cada mensaje a un Webhook de n8n Cloud; la respuesta
(devuelta por GPT a través de n8n) se publica en el mismo canal.

## Despliegue en Railway

1. Haz fork o clona este repo.
2. Crea proyecto en https://railway.app y elige **Deploy from GitHub**.
3. Añade las variables:
   - `DISCORD_TOKEN`
   - `N8N_WEBHOOK_URL`
   - (`N8N_SECRET_HEADER` si tu Webhook lo requiere)
4. Deploy.  Verás en logs: `✅ Conectado como ReviBot#1234`.

> **Requisitos Discord**  
> - Bot con `MESSAGE CONTENT INTENT` activado  
> - Permisos: Read Messages · Send Messages · Read Message History
