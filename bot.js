const https = require('https');
const fs = require('fs');
const path = require('path');

// Use environment variables or default values
const host = process.env.ALERTS_HOST || 'www.oref.org.il';
const alertPath = process.env.ALERTS_PATH || '/warningMessages/alert/Alerts.json';
const port = process.env.ALERTS_PORT || 443;
const pollingInterval = process.env.POLLING_INTERVAL || 10000; // 10 seconds

const options = {
  hostname: host,
  port: port,
  path: alertPath,
  method: 'GET',
};

// Simple logging function
const logFile = path.join(__dirname, 'alerts.log');
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage);
}

function fetchAlerts() {
  const req = https.request(options, (res) => {
    let data = '';

    log(`Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        if (!data.trim()) {
          log('No alerts available or empty response from server.');
          return;
        }

        if (data.charCodeAt(0) === 0xFEFF) {
          data = data.slice(1);
        }

        const jsonData = JSON.parse(data);
        log(`Received Alert: ID: ${jsonData.id}, Title: ${jsonData.title}, Description: ${jsonData.desc}`);
        
        if (Array.isArray(jsonData.data)) {
          jsonData.data.forEach((item, index) => {
            log(`  Alert ${index + 1}: ${item}`);
          });
        } else {
          log('No alerts array found.');
        }
      } catch (error) {
        log(`Error parsing JSON: ${error.message}`);
      }
    });
  });

  req.on('error', (error) => {
    log(`Request error: ${error.message}`);
  });

  req.end();
}

// Poll at specified intervals
log('Starting alert polling...');
const interval = setInterval(fetchAlerts, pollingInterval);

// Graceful shutdown handling
process.on('SIGINT', () => {
  log('Shutting down gracefully...');
  clearInterval(interval);
  process.exit();
});

process.on('SIGTERM', () => {
  log('Received termination signal. Shutting down...');
  clearInterval(interval);
  process.exit();
});