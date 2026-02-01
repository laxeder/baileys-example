import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "baileys";
import QR from "qrcode-terminal";
import Boom from "boom";
import logger from "pino";

async function run() {
  const { state, saveCreds } = await useMultiFileAuthState("sessions");
  const waSock = makeWASocket({
    auth: state,
    logger: logger({ level: "silent" }),
  });

  waSock.ev.on("connection.update", (update) => {
    const { qr, connection, lastDisconnect } = update;

    if (qr) {
      QR.generate(qr, { small: true });
    }

    if (connection === "close") {
      const error = lastDisconnect?.error as Boom;
      const errorStatusCode = error?.output?.statusCode;

      if (errorStatusCode === DisconnectReason.restartRequired) {
        run();
      }
    }
  });

  waSock.ev.on("creds.update", () => {
    saveCreds();
  });

  waSock.ev.on("messages.upsert", (m) => {
    for (const msg of m.messages) {
      console.log("Mensagem recebida:", msg.message?.conversation);
    }
  });
}

run();
