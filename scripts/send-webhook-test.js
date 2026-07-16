const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const argv = require('yargs/yargs')(process.argv.slice(2)).options({
  url: { type: 'string', demandOption: true, describe: 'Target webhook URL (eg https://<ngrok>/webhook)' },
  provider: { type: 'string', default: 'twilio', describe: 'twilio|meta' },
  msisdn: { type: 'string', default: '27785929455', describe: 'MSISDN to simulate (digits only)' },
}).argv;

async function sendTwilio(url, msisdn) {
  const body = new URLSearchParams();
  body.set('From', `whatsapp:+${msisdn}`);
  body.set('To', `whatsapp:+0695831160`);
  body.set('Body', 'Automated Twilio-style test');
  body.set('MessageSid', `SM_${Date.now()}`);

  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  console.log('status', res.status);
  console.log('body', await res.text());
}

async function sendMeta(url, msisdn) {
  const payload = {
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: '0695831160' },
              messages: [
                { from: msisdn, id: `wamid.${Date.now()}`, text: { body: 'Automated Meta-style test' } },
              ],
            },
          },
        ],
      },
    ],
  };

  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  console.log('status', res.status);
  console.log('body', await res.text());
}

(async () => {
  try {
    console.log('Sending', argv.provider, 'to', argv.url, 'msisdn', argv.msisdn);
    if (argv.provider === 'meta') {
      await sendMeta(argv.url, argv.msisdn);
    } else {
      await sendTwilio(argv.url, argv.msisdn);
    }
    console.log('done');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
