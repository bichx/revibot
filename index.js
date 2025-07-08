// index.js – puente Discord → n8n
import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

const {
  DISCORD_TOKEN,        // ***** ponlo en Railway *****
  N8N_WEBHOOK_URL,      // https://tu-espacio.n8n.cloud/webhook/discord-general
  N8N_SECRET_HEADER     // (opcional) si protegiste el webhook
} = process.env;

if (!DISCORD_TOKEN || !N8N_WEBHOOK_URL) {
  console.error('⛔ Falta DISCORD_TOKEN o N8N_WEBHOOK_URL');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.once('ready', () => {
  console.log(`✅ Conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
  // Solo canal #general, ignora bots
  // Responder SOLO a canales-ticket y SOLO a humanos
  const TICKET_REGEX = /^(ticket|reseñas|soporte|pago)-\d+$/i;
  if (!TICKET_REGEX.test(m.channel.name) || m.author.bot) return;

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_SECRET_HEADER && { 'x-secret': N8N_SECRET_HEADER })
      },
      body: JSON.stringify({
        guildId:   msg.guildId,
        channelId: msg.channel.id,
        authorId:  msg.author.id,
        isBot:     false,
        content:   msg.content
      })
    });

    const reply = await res.text();         // n8n devuelve texto plano
    if (reply.trim()) await msg.channel.send(reply);
  } catch (err) {
    console.error('💥 Error al llamar a n8n →', err);
  }
});

client.login(DISCORD_TOKEN);
