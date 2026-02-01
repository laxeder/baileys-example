# Baileys Example – Passo a passo

> Exemplo simples em TypeScript usando Baileys para conectar no WhatsApp Web, mostrar QR Code no terminal, salvar sessão em disco, reiniciar automaticamente e receber mensagens.

---

## 1. Criar o projeto Node

No diretório vazio do projeto:

```bash
npm init -y
```

Isso cria o `package.json` básico.

---

## 2. Instalar o Baileys

```bash
npm install baileys
```

Depois, instale também o TypeScript e tipos básicos (opcional, mas recomendado):

```bash
npm install --save-dev typescript @types/node
npx tsc --init
```

---

## 3. Criar o arquivo `index.ts`

Crie o arquivo `index.ts` na raiz do projeto com os imports principais:

```ts
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "baileys";
import QR from "qrcode-terminal";
import Boom from "boom";
import logger from "pino";
```

Depois, defina a função principal `run`:

```ts
async function run() {
	// código virá aqui
}

run();
```

---

## 4. Criar a sessão (auth state)

Dentro da função `run`, use o `useMultiFileAuthState` para gerenciar a sessão em disco (pasta `sessions`):

```ts
async function run() {
	const { state, saveCreds } = await useMultiFileAuthState("sessions");

	const waSock = makeWASocket({
		auth: state,
		logger: logger({ level: "silent" }),
	});

	// ...demais eventos
}
```

Isso fará o Baileys salvar/ler as credenciais na pasta `sessions/` automaticamente.

---

## 5. Instalar o `qrcode-terminal`

Para imprimir o QR Code no terminal (e escanear com o WhatsApp do celular):

```bash
npm install qrcode-terminal
```

No arquivo `index.ts`, importe o pacote:

```ts
import QR from "qrcode-terminal";
```

E no evento de atualização da conexão, mostre o QR Code quando estiver disponível:

```ts
waSock.ev.on("connection.update", (update) => {
	const { qr } = update;

	if (qr) {
		QR.generate(qr, { small: true });
	}
});
```

---

## 6. Instalar e usar o `ts-node-dev` para rodar o app

Instale o `ts-node-dev` em ambiente de desenvolvimento:

```bash
npm install --save-dev ts-node-dev
```

No `package.json`, adicione um script para rodar o projeto em modo watch:

```json
"scripts": {
	"dev": "ts-node-dev --respawn --transpile-only index.ts"
}
```

Agora você pode iniciar a aplicação com:

```bash
npm run dev
```

Quando rodar pela primeira vez, será exibido o QR Code; escaneie com o WhatsApp do seu celular.

---

## 7. Implementar o restart automático (Boom)

Para reiniciar o socket quando for necessário, usaremos o `Boom` para inspecionar o código de erro.

1. Instale o Boom e os tipos:

```bash
npm install boom
npm install --save-dev @types/boom
```

2. Importe o `Boom` e o `DisconnectReason`:

```ts
import Boom from "boom";
import { DisconnectReason } from "baileys";
```

3. No evento `connection.update`, trate o fechamento da conexão e reinicie quando o motivo for `restartRequired`:

```ts
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
```

Assim, quando o Baileys indicar que é necessário reiniciar, sua função `run` será chamada novamente.

---

## 8. Salvar credenciais automaticamente

Para que o login não seja perdido sempre que você reiniciar a aplicação, salve as credenciais sempre que forem atualizadas:

```ts
waSock.ev.on("creds.update", () => {
	saveCreds();
});
```

Isso garantirá que a pasta `sessions/` tenha os dados mais recentes de autenticação.

---

## 9. Adicionar exemplo de receber mensagem

Por fim, adicione um listener para o evento `messages.upsert` para ver as mensagens recebidas em texto simples:

```ts
waSock.ev.on("messages.upsert", (m) => {
	for (const msg of m.messages) {
		console.log("Mensagem recebida:", msg.message?.conversation);
	}
});
```

Esse código percorre as mensagens recebidas e imprime apenas o conteúdo da conversa. A partir dele, você pode filtrar, responder automaticamente, criar bots, etc.

---
