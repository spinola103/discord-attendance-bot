require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const express = require("express");

// Express server for UptimeRobot to ping
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint for UptimeRobot
app.get("/", (req, res) => {
  res.status(200).send({
    status: "Bot is running!",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    bot: client.readyAt ? "connected" : "disconnected",
    uptime: process.uptime()
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🌐 Express server running on port ${PORT}`);
});

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
    await axios.post(WEBHOOK_URL, payload, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log("✅ Data sent to n8n successfully");
  } catch (err) {
    console.error(`❌ Error sending to webhook (attempt ${retries + 1}): ${err.message}`);
    if (retries < MAX_RETRIES) {
      console.log(`🔄 Retrying in 2 seconds...`);
      setTimeout(() => sendToWebhook(payload, retries + 1), 2000);
    } else {
      console.error("❌ Failed to send after 3 attempts.");
    }
  }
}

client.on("ready", () => {
  console.log(`🤖 Bot logged in as ${client.user.tag}!`);
  console.log(`📺 Monitoring channel: ${TARGET_CHANNEL}`);
  console.log(`🔗 Webhook URL configured: ${WEBHOOK_URL ? 'Yes' : 'No'}`);
  
  // Set bot status
  client.user.setActivity('Attendance Tracking', { type: 'WATCHING' });
});

client.on("messageCreate", async (message) => {
  // Ignore bot messages
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
        id: message.author.id
      },
      channel: message.channel.name,
      timestamp: message.createdAt.toISOString()
    },
  };

  await sendToWebhook(payload);
});

// Error handling
client.on("error", (error) => {
  console.error("❌ Discord client error:", error);
});

client.on("disconnect", () => {
  console.log("🔌 Bot disconnected");
});

client.on("reconnecting", () => {
  console.log("🔄 Bot reconnecting...");
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT. Shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM. Shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

// Keep alive function for Replit
const keepAlive = () => {
  setInterval(() => {
    console.log(`💓 Heartbeat: ${new Date().toISOString()}`);
  }, 300000); // Every 5 minutes
};

// Start the bot
client.login(process.env.DISCORD_BOT_TOKEN).then(() => {
  keepAlive();
}).catch((error) => {
  console.error("❌ Failed to login:", error);
  process.exit(1);
});