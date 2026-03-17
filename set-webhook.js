const fetch = require('node-fetch') || global.fetch;

async function run() {
  try {
    const res = await fetch('http://localhost:8080/instance/fetchInstances', {
      headers: { apikey: 'teste123api' }
    });
    const instances = await res.json();

    for (const inst of instances) {
      const name = inst.name || inst.instanceName;
      if (name === 'aero-lanches') {
        const payload = {
          webhook: {
            enabled: true,
            url: "http://localhost:3001/webhook",
            byEvents: false,
            base64: false,
            events: ["MESSAGES_UPSERT", "MESSAGES_CREATE"]
          }
        };

        console.log(`Setting webhook for ${name}...`);

        // try v1 format
        let wRes = await fetch('http://localhost:8080/webhook/set/' + name, {
          method: 'POST',
          headers: {
            'apikey': 'teste123api',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        let result = await wRes.text();
        console.log('Result:', result);

        // Check if v2 specific format is needed
        if (!wRes.ok) {
          console.log("Failed v1 format, trying v2 format...");
          const payloadV2 = {
            url: "http://localhost:3001/webhook",
            webhook_by_events: false,
            webhook_base64: false,
            events: ["MESSAGES_UPSERT"]
          };
          wRes = await fetch('http://localhost:8080/webhook/set/' + name, {
            method: 'POST',
            headers: {
              'apikey': 'teste123api',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payloadV2)
          });
          result = await wRes.text();
          console.log('Result V2:', result);
        }
      }
    }
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
