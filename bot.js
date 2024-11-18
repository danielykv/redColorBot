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

let lastAlertId = null; // Store the last processed alert ID

const host = "www.oref.org.il";
const path = "/warningMessages/alert/Alerts.json";
const port = 443;

const options = {
  hostname: host,
  port: port,
  path: path,
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
        if (!data.trim()) {
          return; // Skip empty responses
        }

        if (data.charCodeAt(0) === 0xFEFF) {
          data = data.slice(1); // Remove BOM if present
        }

        const jsonData = JSON.parse(data);

        // Log the full JSON response for debugging
        console.log("Full Response:", JSON.stringify(jsonData, null, 2));

        if (jsonData.id !== lastAlertId) {
          lastAlertId = jsonData.id; // Update the last processed alert ID

          const alertMessage = createAlertMessage(jsonData);
          console.log("[NEW ALERT]", alertMessage);

          // Send alert to all defined chats
          chats.forEach((id) => {
            client
              .sendMessage(id, alertMessage)
              .then(() => {
                console.log(`Message sent successfully to: ${id}`);
              })
              .catch((error) => {
                console.error("Error sending message:", error);
              });
          });
        } else {
          console.log("[Duplicate Alert] Same as the last alert.");
        }
      } catch (error) {
        console.error("Error parsing JSON:", error.message);
      }
    });
  });

  req.on("error", (error) => {
    console.error("Request error:", error.message);
  });

  req.end();
}

// Function to create the alert message
function createAlertMessage(alert) {
  const { title, desc, data } = alert;

  const alertMessage = 
    `🚨 *${title}* (${moment().format("HH:mm:ss")}):\n` +
    `${desc}\n\n` +
    `Locations: ${data.join(", ")}`;

  return alertMessage;
}

// Poll the API for alerts at regular intervals
setInterval(fetchAlerts, 300); // Adjust interval as needed (10 seconds)

// Initialize WhatsApp client
client
  .initialize()
  .then(() => {
    console.log("Client initialized successfully");
  })
  .catch((err) => {
    console.error("Error initializing client", err);
  });