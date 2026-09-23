const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let sock = null;
let qrCodeData = null;
let isConnected = false;

async function startBaileys() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  sock = makeWASocket({ auth: state, printQRInTerminal: false, browser: ['ZapCuritiba', 'Chrome', '1.0.0'] });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) qrCodeData = await qrcode.toDataURL(qr);
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      isConnected = false; qrCodeData = null;
      if (shouldReconnect) setTimeout(startBaileys, 3000);
    } else if (connection === 'open') {
      isConnected = true; qrCodeData = null;
      console.log('✅ CONECTADO!');
    }
  });
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    await sock.sendMessage(from, { text: `Olá! 🤖 IA ZapCuritiba 24h ativa!\n\nRecebi: "${text}"\n\nSua licença ZC-CUR-2026-BATEL-001 está funcionando!` });
  });
}
startBaileys();

app.get('/api/qr', (req, res) => res.json({ qr: qrCodeData, connected: isConnected }));
app.get('/api/status', (req, res) => res.json({ connected: isConnected, hasQr:!!qrCodeData }));

// NUEVO: Código sin QR
app.get('/api/pairing-code', async (req, res) => {
  let { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'Falta?phone=55419...' });
  if (!sock) return res.status(500).json({ error: 'Baileys iniciando...' });
  try {
    phone = phone.replace(/[^0-9]/g, '');
    const code = await sock.requestPairingCode(phone);
    res.json({ pairingCode: code });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Rodando ' + PORT));
