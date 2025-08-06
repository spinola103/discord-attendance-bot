require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const TARGET_CHANNEL = "reporting-channel"; // Channel name to monitor
const MAX_RETRIES = 3;

async function sendToWebhook(payload, retries = 0) {
  try {
    await axios.post(WEBHOOK_URL, payload);
    console.log("✅ Data sent to n8n successfully");
  } catch (err) {
    console.error(`❌ Error sending to webhook (attempt ${retries + 1}): ${err.message}`);
    if (retries < MAX_RETRIES) {
      setTimeout(() => sendToWebhook(payload, retries + 1), 2000); // Retry after 2 sec
    } else {
      console.error("❌ Failed after 3 attempts.");
    }
  }
}

client.on("ready", () => {
  console.log(`🤖 Bot logged in as ${client.user.tag}!`);
  console.log(`📺 Monitoring channel: ${TARGET_CHANNEL}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Only process messages from the specific channel
  if (message.channel.name !== TARGET_CHANNEL) {
    console.log(`📝 Message from ${message.channel.name} (ignored) - only monitoring ${TARGET_CHANNEL}`);
    return;
  }

  console.log(`📨 Message from ${TARGET_CHANNEL}:`, message.content);
  console.log(`👤 Author: ${message.author.username}`);

  const payload = {
    body: {
      content: message.content,
      author: {
        username: message.author.username,
      },
    },
  };

  await sendToWebhook(payload);
});

client.login(process.env.DISCORD_BOT_TOKEN);