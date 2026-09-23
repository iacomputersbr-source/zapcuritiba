const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const app = express();

let qrCodeData = null;
let isConnected = false;
let sockInstance = null;

async function connectWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["ZapCuritiba", "Chrome", "1.0"]
  });

  sockInstance = sock;
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if(qr){
      qrCodeData = await QRCode.toDataURL(qr);
      isConnected = false;
      console.log('QR Gerado');
    }
    if(connection === 'open'){
      isConnected = true;
      qrCodeData = null;
      console.log('✅ WhatsApp CONECTADO!');
    }
    if(connection === 'close'){
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      isConnected = false;
      if(shouldReconnect) {
        console.log('Reconectando...');
        setTimeout(connectWhatsApp, 2000);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({messages}) => {
    const msg = messages[0];
    if(!msg.message || msg.key.fromMe) return;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    if(!text) return;
    const from = msg.key.remoteJid;
    console.log('Mensagem recebida:', text);
    // IA AUTOMÁTICA
    await sock.sendMessage(from, {
      text: `Olá! 👋 Sou a *IA da ZapCuritiba*!\n\nRecebi sua mensagem: "${text}"\n\n✅ Já estou atendendo seu pedido!\n\n🟢 *Atendimento automático 24h*\n📍 Curitiba - PR\n\nUm atendente humano vai confirmar em breve!`
    });
  });
}

connectWhatsApp();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/qr', (req,res)=>{
  res.json({ qr: qrCodeData, connected: isConnected });
});

app.get('/api/validate', (req,res)=>{
  const key = (req.query.key || "").toUpperCase();
  if(key.startsWith('ZC-CUR-')){
    res.json({ valid: true, region: 'Curitiba - PR', license: key });
  } else {
    res.json({ valid: false });
  }
});

app.get('/api/status', (req,res)=>{
  res.json({ connected: isConnected, hasQr:!!qrCodeData });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=> console.log('ZapCuritiba LIVE na porta '+PORT));
