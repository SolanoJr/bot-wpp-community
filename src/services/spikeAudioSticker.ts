import fs from 'fs';
import os from 'os';
import path from 'path';
import { proto } from '@whiskeysockets/baileys';

/**
 * Figurinha com áudio — o proto do rc14 não tem o campo, então injetamos
 * o campo 26 (audioMessage) no StickerMessage via monkey-patch do encoder.
 * O WhatsApp aceita e gera o bundle; o decoder do rc14 não enxerga o campo.
 */
let aplicado = false;

export function applyAudioStickerPatch(): boolean {
  if (aplicado) return true;
  const S: any = (proto.Message as any).StickerMessage;
  const A: any = (proto.Message as any).AudioMessage;

  if (!('audioMessage' in S.prototype)) {
    const origEncode = S.encode;
    const origFromObject = S.fromObject;
    S.fromObject = function (o: any, ...rest: any[]) {
      const m = origFromObject.call(this, o, ...rest);
      if (o && o.audioMessage) m.audioMessage = A.fromObject(o.audioMessage);
      return m;
    };
    S.encode = function (message: any, writer: any, length: any) {
      const w = origEncode.call(this, message, writer, length);
      if (message && message.audioMessage) {
        const audio = message.audioMessage instanceof A
          ? message.audioMessage
          : A.fromObject(message.audioMessage);
        const buf = A.encode(audio).finish();
        w.uint32((26 << 3) | 2);
        w.bytes(buf);
      }
      return w;
    };
  }
  aplicado = true;
  return true;
}

/** Envia figurinha WebP com áudio Opus já prontos (buffers). */
export async function sendStickerComSom(
  sock: any,
  jid: string,
  webp: Buffer,
  opus: Buffer,
): Promise<void> {
  applyAudioStickerPatch();
  const baileys: any = await import('@whiskeysockets/baileys');
  const prepare = baileys.prepareWAMessageMedia;
  if (typeof prepare !== 'function') throw new Error('prepareWAMessageMedia indisponível');

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wpp-sticker-som-'));
  const webpPath = path.join(tmp, 's.webp');
  const opusPath = path.join(tmp, 's.ogg');
  fs.writeFileSync(webpPath, webp);
  fs.writeFileSync(opusPath, opus);

  const uploadOpts: any = { upload: sock.waUploadToServer };
  const audio: any = await prepare(
    { audio: fs.readFileSync(opusPath), mimetype: 'audio/ogg; codecs=opus' } as any,
    uploadOpts
  );

  const S: any = (proto.Message as any).StickerMessage;
  const anterior = S.prototype.audioMessage;
  S.prototype.audioMessage = audio.audioMessage;
  try {
    await sock.sendMessage(jid, { sticker: { url: webpPath } } as any);
  } finally {
    if (anterior === undefined) delete S.prototype.audioMessage;
    else S.prototype.audioMessage = anterior;
  }
}

/** Compat: versão antiga com caminhos (usada pelo spike manual). */
export async function sendAudioSticker(
  sock: any,
  jid: string,
  stickerPath: string,
  audioPath: string,
): Promise<void> {
  return sendStickerComSom(sock, jid, fs.readFileSync(stickerPath), fs.readFileSync(audioPath));
}
