const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');

// 🔐 Auth File
const { state, saveState } = useSingleFileAuthState('./auth.json');

// 🌐 Bot Setup
const startSock = () => {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  // 🧠 Save auth state on changes
  sock.ev.on('creds.update', saveState);

  // 📥 On receiving messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

    console.log(`📩 Message from ${from}: ${text}`);

    // 🔥 Reply logic
    if (text?.toLowerCase() === 'hi' || text?.toLowerCase() === 'hello') {
      await sock.sendMessage(from, { text: '🔥 Hello! Welcome to Blaze WhatsApp Bot.' });
    } else {
      await sock.sendMessage(from, { text: `You said: ${text}` });
    }
  });

  // ❌ On disconnect
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log('❌ Disconnected:', reason);
      if (reason !== DisconnectReason.loggedOut) {
        startSock(); // Restart bot
      }
    } else if (connection === 'open') {
      console.log('✅ Blaze Bot Connected');
    }
  });

};

startSock();
