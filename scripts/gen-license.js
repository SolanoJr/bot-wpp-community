#!/usr/bin/env node
/**
 * Gera uma licença assinada para a versão completa.
 *
 * Uso:
 *   WPP_LICENSE_PRIVATE_KEY=~/.bot-wpp-keys/license-private.pem \
 *     node scripts/gen-license.js "Nome do titular" [dias]
 *
 * A chave PRIVADA fica só no seu ambiente (fora do repo). Entregue a
 * WPP_LICENSE_KEY gerada para quem vai usar; ela não revela sua chave.
 */
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const holder = process.argv[2];
const dias = Number(process.argv[3] || 0);
if (!holder) {
  console.error('Uso: node scripts/gen-license.js "Titular" [dias (0=eterno)]');
  process.exit(1);
}

const caminho = (
  process.env.WPP_LICENSE_PRIVATE_KEY ||
  path.join(os.homedir(), 'bot-wpp-keys', 'license-private.pem')
).replace(/^~/, os.homedir());
const privada = crypto.createPrivateKey(fs.readFileSync(caminho, 'utf8'));

const payload = {
  h: holder,
  e: dias > 0 ? Date.now() + dias * 24 * 60 * 60 * 1000 : 0,
  f: ['full'],
};
const corpo = Buffer.from(JSON.stringify(payload)).toString('base64url');
const assinatura = crypto.sign(null, Buffer.from(corpo), privada).toString('base64url');

console.log(`${corpo}.${assinatura}`);
