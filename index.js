const { default: makeWASocket, DisconnectReason } = require('@whiskeysockets/baileys');
const { useSingleFileAuthState, default: makeWASocket } = require('@whiskeysockets/baileys');
const P = require('pino');
const { state, saveState } = useSingleFileAuthState('./auth_info.json');
function startSock() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: P({ level: 'silent' })
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const messageType = Object.keys(msg.message)[0];
        const text = msg.message.conversation || msg.message[messageType]?.text || '';

        console.log(`📩 Message from ${from}: ${text}`);

        if (text.toLowerCase() === 'hi' || text.toLowerCase() === 'hello') {
            await sock.sendMessage(from, { text: '👋 Hello! I am Blaze Bot.' });
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('🔁 Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) {
                startSock();
            }
        } else if (connection === 'open') {
            console.log('✅ Connected to WhatsApp!');
        }
    });

    sock.ev.on('creds.update', saveState);
}

startSock();
