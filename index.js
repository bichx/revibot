// index.js – puente Discord → n8n (Assistant API + threads)
import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

const {
  DISCORD_TOKEN,        // tu token de bot
  N8N_WEBHOOK_URL,      // https://tu-espacio.n8n.cloud/webhook/discord-tickets
  N8N_SECRET_HEADER     // (opcional) si activaste Header Auth
} = process.env;

if (!DISCORD_TOKEN || !N8N_WEBHOOK_URL) {
  console.error('⛔ Falta DISCORD_TOKEN o N8N_WEBHOOK_URL en las variables de entorno');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Memoria en caliente para mantener un threadId por canal-ticket
const threadsByChannel = new Map();

client.once('ready', () => {
  console.log(`✅ Conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
  // Escuchamos SOLO canales-ticket y SOLO humanos
  const TICKET_REGEX = /^(ticket|reseñas|soporte|pago)-\d+$/i;
  if (!TICKET_REGEX.test(msg.channel.name) || msg.author.bot) return;

  console.log('↘ Mensaje recibido:', {
    channel: msg.channel.name,
    content: msg.content,
    author: `${msg.author.username}#${msg.author.discriminator}`,
  });

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_SECRET_HEADER && { 'x-secret': N8N_SECRET_HEADER }),
      },
      body: JSON.stringify({
        guildId:   msg.guildId,
        channelId: msg.channel.id,
        authorId:  msg.author.id,
        isBot:     false,
        content:   msg.content,
        threadId:  threadsByChannel.get(msg.channel.id) || null, // ← hilo previo (si existe)
      }),
    });

    console.log('→ POST a n8n status:', res.status);

    // n8n responde con JSON { output: "...", threadId: "..." }
    const data = await res.json().catch(() => ({}));
    console.log('Respuesta de n8n:', data);

    if (data.output?.trim()) {
      await msg.channel.send(data.output);
    }

    // Guarda el threadId devuelto para los siguientes turnos
    if (data.threadId) {
      threadsByChannel.set(msg.channel.id, data.threadId);
    }
  } catch (err) {
    console.error('💥 Error al llamar a n8n →', err);
  }
});

client.login(DISCORD_TOKEN);
