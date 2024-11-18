const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const https = require("https");
const moment = require("moment");

const chats = [
  // "972507788163-1421054084@g.us", // hot group
  // "972522435363-1444244865@g.us", // hazira
  // "120363187558257665@g.us", // cops
  // "120363046232734410@g.us", // avrham
      "120363194848023280@g.us", // cinema
  
];

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: "/usr/bin/google-chrome-stable",
  },
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});

let lastAlertId = null;

const options = {
  hostname: "www.oref.org.il",
  port: 443,
  path: "/warningMessages/alert/Alerts.json",
  method: "GET",
};

function fetchAlerts() {
  const req = https.request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        if (!data.trim()) return;

        if (data.charCodeAt(0) === 0xFEFF) {
          data = data.slice(1); // Remove BOM
        }

        const jsonData = JSON.parse(data);
        console.log("Full Response:", JSON.stringify(jsonData, null, 2));

        if (jsonData.id !== lastAlertId) {
          lastAlertId = jsonData.id;
          const alertMessage = createAlertMessage(jsonData);
          chats.forEach((id) => {
            client.sendMessage(id, alertMessage)
              .then(() => console.log(`Message sent successfully to: ${id}`))
              .catch((error) => console.error("Error sending message:", error));
          });
        } else {
          console.log("[Duplicate Alert] Same as the last alert.");
        }
      } catch (error) {
        console.error("Error parsing JSON or handling response:", error.message);
      }
    });
  });

  req.on("error", (error) => {
    console.error("Request error:", error.message);
    retryRequest(fetchAlerts, 3, 2000); // Retry on request error
  });

  req.on("timeout", () => {
    console.error("Request timed out");
    req.destroy();
  });

  req.end();
}

function createAlertMessage(alert) {
  const { title, desc, data } = alert;
  return `🚨 *${title}* (${moment().format("HH:mm:ss")}):\n${desc}\n\nLocations: ${data.join(", ")}`;
}

// Random console log to keep the bot alive
function randomConsoleLog() {
  const messages = [
    "Bot is running smoothly...",
    "Still monitoring for alerts...",
    "All systems operational.",
    "Waiting for new alerts...",
    "Bot heartbeat: I'm alive!",
    "Checking for updates...",
  ];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  console.log(`[BOT STATUS]: ${randomMessage}`);
}

// Retry logic to prevent crashing on request failure
function retryRequest(fn, retries, delay) {
  if (retries > 0) {
    setTimeout(() => {
      console.log(`Retrying... (${4 - retries} attempt)`);
      fn();
      retryRequest(fn, retries - 1, delay);
    }, delay);
  } else {
    console.error("Max retries reached. Request failed.");
  }
}

// Add a check command that responds to '!check'
client.on("message", (message) => {
  if (message.body.toLowerCase() === "!check") {
    message.reply("✅ Bot is running fine and Netanel is gay!");
    console.log("[CHECK COMMAND]: Replied to a health check request.");
  }
});

// Poll the API for alerts and schedule random logs
setInterval(fetchAlerts, 300); // Fetch alerts every 10 seconds
setInterval(randomConsoleLog, 300000); // Log status every 5 minutes

client.initialize();