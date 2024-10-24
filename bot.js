const qrcode = require("qrcode-terminal");
const axios = require("axios");
const { Client, LocalAuth } = require("whatsapp-web.js");
const moment = require("moment");
const chats = [
  "972507788163-1421054084@g.us", //hot group
  //"120363024822071760@g.us", //klaaim
  // "972525485555-1394709211@g.us", //bts
  "972522435363-1444244865@g.us", // hazira
  "120363187558257665@g.us", // cops
  "120363046232734410@g.us", //avrham
  //"120363194848023280@g.us",
];
const wwebVersion = "2.2412.54/2.2411.2";

// const client = new Client({
//   authStrategy: new LocalAuth(), // your authstrategy here
//   puppeteer: {
//     // puppeteer args here
//   },
//   // locking the wweb version
//   webVersionCache: {
//     type: "remote",
//     remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
//   },
// });

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

var pikudHaoref = require("pikud-haoref-api");
// const { log } = require("console");
var interval = 1000;
// Keep track of recently alerted cities to avoid notifying multiple times for the same alert
let recentlyAlertedCities = {};
// Define polling function
var poll = function () {
  // Optional Israeli proxy if running outside Israeli borders
  var options = {
    // proxy: 'http://user:pass@hostname:port/'
  };

  pikudHaoref.getActiveAlert(function (err, alert) {
    // Schedule next poll after X milliseconds
    setTimeout(poll, interval);

    // Log and handle errors
    if (err) {
      return console.log("Retrieving active alert failed: ", err);
    }

    // If no alert or alert type is 'none', return early
    if (!alert || alert.type === "none") {
      return console.log("No active alert or alert type is none");
    }

    // Extract new cities that haven't been alerted in the past 3 minutes
    alert.cities = extractNewCities(alert.cities);

    // If there are no new cities to alert, return
    if (alert.cities.length === 0) {
      return console.log("No new cities to alert.");
    }

    // Log the active alert
    console.log("Currently active alert:", alert);

    // Generate the WhatsApp message based on alert type
    const message = createAlertMessage(alert);

    // Send the message to all defined chats
    chats.forEach((id) => {
      client
        .sendMessage(id, message)
        .then(() => {
          console.log("Message sent successfully to:", id);
        })
        .catch((error) => {
          console.error("Error sending message:", error);
        });
    });
  }, options);
};

// Helper function to create WhatsApp alert message
function createAlertMessage(alert) {
  const { type, cities, instructions } = alert;

  let alertTypeMessage = "";

  switch (type) {
    case "missiles":
      alertTypeMessage = "🔴 *צבע אדום*";
      break;
    case "hostileAircraftIntrusion":
      alertTypeMessage = "✈️ *חדירת כלי טיס עוין*";
      break;
    case "terroristInfiltration":
      alertTypeMessage = "🔒 *חשש לחדירת מחבלים*";
      break;
    default:
      alertTypeMessage = "🚨 *Alert*";
  }

  // Construct the full message
  const citiesList = cities.join(", ");
  const message =
    `${alertTypeMessage} ` +
    `*(${moment().format("HH:mm:ss")}):* ` +
    `${citiesList}`;

  return message;
}
// Helper function to extract cities that haven't been alerted recently
function extractNewCities(alertCities) {
  const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
  const newCities = [];

  for (const city of alertCities) {
    // If the city hasn't been alerted in the past 3 minutes (180 seconds), add it
    if (
      !recentlyAlertedCities[city] ||
      recentlyAlertedCities[city] < now - 180
    ) {
      newCities.push(city);
      recentlyAlertedCities[city] = now; // Update the alert timestamp for this city
    }
  }

  return newCities; // Return the list of new cities to be alerted
}

async function pollAlerts() {
  const url = "https://www.oref.org.il/WarningMessages/alerts.json";

  while (true) {
    // Infinite loop to keep checking for alerts
    try {
      const response = await axios.get(url);
      console.log("Alerts:", response.data);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }

    await new Promise((resolve) => setTimeout(resolve, 1500)); // Wait for 5 seconds before polling again
  }
}

// Initialize WhatsApp client and start polling for alerts
client
  .initialize()
  .then(() => {
    console.log("Client initialized successfully");
  })
  .catch((err) => {
    console.error("Error initializing client", err);
  });
poll();

// pollAlerts();
