const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let sock = null;
let qrCodeData = null;
let isConnected = false;
let lastQRTime = 0;

async function startBaileys() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: ['ZapCuritiba', 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('QR Gerado!');
      qrCodeData = await qrcode.toDataURL(qr);
      lastQRTime = Date.now();
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      console.log('Conexão fechada, reconectando:', shouldReconnect);
      isConnected = false;
      qrCodeData = null;
      if (shouldReconnect) {
        setTimeout(startBaileys, 3000);
      }
    } else if (connection === 'open') {
      console.log('✅ CONECTADO!');
      isConnected = true;
      qrCodeData = null;
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    console.log('Mensagem recebida:', text);

    await sock.sendMessage(from, {
      text: `Olá! 👋 Sou a IA da ZapCuritiba!\n\nRecebi sua mensagem: "${text}"\n\nEm breve um atendente vai te responder. Atendemos 24h em Curitiba! 🚀\n\n> Licença: ZC-CUR-2026-BATEL-001\n> IA: ATIVA`
    });
  });
}

startBaileys();

// APIs RÁPIDAS
app.get('/api/qr', (req, res) => {
  res.json({ qr: qrCodeData, connected: isConnected, age: Date.now() - lastQRTime });
});

app.get('/api/status', (req, res) => {
  res.json({ status: isConnected? 'CONECTADO' : 'AGUARDANDO QR', connected: isConnected, hasQR:!!qrCodeData });
});

app.get('/api/validate', (req, res) => {
  const { key } = req.query;
  if (key && key.startsWith('ZC-CUR-')) {
    res.json({ valid: true, plan: 'premium' });
  } else {
    res.json({ valid: false });
  }
});

// Keep Alive para não dormir
setInterval(() => {
  fetch('https://zapcuritiba.onrender.com/api/status').catch(()=>{});
  console.log('Keep alive ping');
}, 5 * 60 * 1000); // a cada 5 min

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`ZapCuritiba rodando na porta ${PORT}`));
