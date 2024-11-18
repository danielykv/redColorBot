const https = require('https');
const host = 'www.oref.org.il';
const path = '/warningMessages/alert/Alerts.json';
const port = 443;

const options = {
  hostname: host,
  port: port,
  path: path,
  method: 'GET',
};

let lastAlertId = null; // Store the last processed alert ID

function fetchAlerts() {
  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        if (!data.trim()) {
          // No data received; skip processing silently
          return;
        }

        if (data.charCodeAt(0) === 0xFEFF) {
          data = data.slice(1);
        }

        const jsonData = JSON.parse(data);

        // Log the full JSON response for inspection
        console.log('Full Response:', JSON.stringify(jsonData, null, 2));

        if (jsonData.id !== lastAlertId) {
          lastAlertId = jsonData.id; // Update the last processed alert ID
          console.log(`[NEW ALERT] ID: ${jsonData.id}`);
          console.log(`Title: ${jsonData.title}`);
          console.log(`Description: ${jsonData.desc}`);
          console.log(`Alerts:`);
          jsonData.data.forEach((alert, index) => {
            console.log(`  Alert ${index + 1}: ${alert}`);
          });

          // Add any further processing logic here, e.g., notify users
        } else {
          console.log('[Duplicate Alert] Same as the last alert.');
        }
      } catch (error) {
        console.error('Error parsing JSON:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error.message);
  });

  req.end();
}

// Poll the API at intervals
setInterval(fetchAlerts, 300); // Adjust the interval as needed (10 seconds here)