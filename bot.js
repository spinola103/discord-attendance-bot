// Load environment variables
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const express = require("express");

// --- Keep-alive server for Replit ---
const app = express();
app.get("/", (req, res) => {
  res.send("✅ Bot is running and ready to receive Discord messages!");
});
app.listen(3000, () => {
  console.log("🌐 Keep-alive server started on port 3000");
});

// --- Discord Bot Setup ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const TARGET_CHANNEL_ID = "1380143480717840525"; // reporting-channel
const MAX_RETRIES = 3;

async function sendToWebhook(payload, retries = 0) {
  try {
    await axios.post(WEBHOOK_URL, payload);
    console.log("✅ Data sent to n8n successfully");
  } catch (err) {
    console.error(
      `❌ Error sending to webhook (attempt ${retries + 1}): ${err.message}`
    );
    if (retries < MAX_RETRIES) {
      setTimeout(() => sendToWebhook(payload, retries + 1), 2000);
    } else {
      console.error("❌ Failed after 3 attempts.");
    }
  }
}

client.on("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}!`);
  console.log(`📺 Monitoring channel ID: ${TARGET_CHANNEL_ID}`);

  // Display all servers the bot is connected to
  console.log(`🌐 Connected to ${client.guilds.cache.size} server(s):`);
  client.guilds.cache.forEach((guild) => {
    console.log(`   🏠 Server: ${guild.name} (ID: ${guild.id})`);
    console.log(`   👥 Members: ${guild.memberCount}`);
    console.log(`   📋 Channels: ${guild.channels.cache.size}`);
    console.log(`   ────────────────────────────`);
  });

  // Check if bot can access the target channel
  const targetChannel = client.channels.cache.get(TARGET_CHANNEL_ID);
  if (targetChannel) {
    console.log(
      `✅ Can access channel: ${targetChannel.name} in server: ${targetChannel.guild.name}`
    );
  } else {
    console.log(`❌ Cannot access channel with ID: ${TARGET_CHANNEL_ID}`);
    console.log(`🔍 Available channels across all servers:`);
    client.guilds.cache.forEach((guild) => {
      console.log(`\n🏠 Server: ${guild.name}`);
      guild.channels.cache.forEach((channel) => {
        if (channel.type === 0) {
          console.log(`   - ${channel.name} (ID: ${channel.id})`);
        }
      });
    });
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  console.log(
    `🔍 Received message in channel: ${message.channel.name} (ID: ${message.channel.id})`
  );

  if (message.channel.id !== TARGET_CHANNEL_ID) {
    console.log(`📝 Message from ${message.channel.name} (ignored)`);
    return;
  }

  console.log(`📨 Message in the target channel: ${message.content}`);
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

// Error handling
client.on("error", (error) => {
  console.error("❌ Discord client error:", error);
});
client.on("warn", (warning) => {
  console.warn("⚠️ Discord client warning:", warning);
});
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled promise rejection:", error);
});

// Login bot
client.login(process.env.DISCORD_BOT_TOKEN).catch((error) => {
  console.error("❌ Failed to login:", error);
});
