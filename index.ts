import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "baileys";
import logger from "pino";
import QR from "qrcode-terminal";
import Boom from "boom";
import { rmdirSync } from "fs";

async function run() {
  console.log("Iniciando baileys");

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

    if (connection === "open") {
      console.log("Baileys conectado");
    }

    if (connection === "close") {
      
      const error = lastDisconnect?.error as Boom;
      const errorStatusCode = error?.output?.statusCode;
      
      console.log(`Baileys desconectado. Razão: ${errorStatusCode}`)

      // if (errorStatusCode === DisconnectReason.restartRequired) {
      //   run();
      // }

      if (errorStatusCode === DisconnectReason.loggedOut) {
        rmdirSync("sessions");
      }

      run();
    }
  });

  waSock.ev.on("creds.update", saveCreds);

  waSock.ev.on("messages.upsert", (m) => {
    for (const msg of m.messages) {
      const text = msg.message?.conversation;
      if (text) {
        console.log("Mensagem recebida:", text);
      }
    }
  });
}

run();
