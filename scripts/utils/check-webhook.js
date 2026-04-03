const fetch = require('node-fetch') || global.fetch;

async function run() {
  try {
    const res = await fetch('http://localhost:8080/instance/fetchInstances', {
      headers: { apikey: 'teste123api' }
    });
    const instances = await res.json();

    for (const inst of instances) {
      const name = inst.name || inst.instanceName;
      console.log('Instance Name:', name);

      const wRes = await fetch('http://localhost:8080/webhook/find/' + name, {
        headers: { apikey: 'teste123api' }
      });
      const webhook = await wRes.json();
      console.log('Webhook Config:', JSON.stringify(webhook, null, 2));
    }
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
