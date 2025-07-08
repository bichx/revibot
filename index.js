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
  // Patrón de canales-ticket
  const TICKET_REGEX = /^(ticket|reseñas|soporte|pago)-\d+$/i;
  if (!TICKET_REGEX.test(msg.channel.name) || msg.author.bot) return;

  console.log('↘ Mensaje recibido:', {
    channel: msg.channel.name,
    content: msg.content,
    author:  `${msg.author.username}#${msg.author.discriminator}`
  });

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

    console.log('→ POST a n8n status:', res.status);

    const reply = await res.text();
    if (reply.trim()) await msg.channel.send(reply);
  } catch (err) {
    console.error('💥 Error al llamar a n8n →', err);
  }
});


client.login(DISCORD_TOKEN);
