const { makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const fs = require('fs');

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

const startSock = () => {
  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('connection closed due to', lastDisconnect.error, ', reconnecting:', shouldReconnect);
      if (shouldReconnect) {
        startSock();
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp connected');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    console.log('📩 New message', messages[0]);
    const msg = messages[0];
    if (!msg.message) return;
    if (msg.key.fromMe) return;

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

    if (text.toLowerCase() === 'hi') {
      await sock.sendMessage(msg.key.remoteJid, { text: 'Hello! I am Blaze Bot 🔥' });
    }
  });
};

startSock();
