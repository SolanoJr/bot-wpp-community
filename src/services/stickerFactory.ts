import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

const execFileAsync = promisify(execFile);
const FFMPEG = process.env.WPP_FFMPEG || path.join(process.env.HOME || '', 'tools/ffmpeg/ffmpeg');

export interface MidiaMarcada {
  buffer: Buffer;
  mime: string;
  tipo: 'image' | 'video' | 'sticker' | 'document';
}

/** Extrai a mídia da mensagem marcada (contextInfo.quotedMessage). */
export async function getMidiaMarcada(
  sock: any,
  rawMsg: any,
): Promise<MidiaMarcada | null> {
  const quoted = rawMsg?.message?.contextInfo?.quotedMessage;
  if (!quoted) return null;
  const content =
    quoted.ephemeralMessage?.message ||
    quoted.viewOnceMessage?.message ||
    quoted;
  const map: Array<[string, MidiaMarcada['tipo']]> = [
    ['imageMessage', 'image'],
    ['videoMessage', 'video'],
    ['stickerMessage', 'sticker'],
    ['documentMessage', 'document'],
  ];
  for (const [key, tipo] of map) {
    if (!content[key]) continue;
    const wrapper = {
      key: {
        ...(rawMsg?.key || {}),
        id: rawMsg?.message?.contextInfo?.stanzaId || 'quoted-media',
      },
      message: content,
    };
    try {
      const buffer: any = await downloadMediaMessage(wrapper as any, 'buffer', {});
      return { buffer: Buffer.from(buffer), mime: String(content[key]?.mimetype || ''), tipo };
    } catch {
      return null;
    }
  }
  return null;
}

/** Converte imagem/vídeo/figurinha em WebP 512x512 (padrão de sticker). */
export async function paraWebP(midia: MidiaMarcada): Promise<Buffer> {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wpp-sticker-'));
  const ext = midia.tipo === 'video' ? 'mp4' : 'img';
  const inp = path.join(tmp, `in.${ext}`);
  const out = path.join(tmp, 'out.webp');
  fs.writeFileSync(inp, midia.buffer);
  await execFileAsync(FFMPEG, [
    '-y', '-loglevel', 'error', '-i', inp,
    '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2',
    '-frames:v', '1', '-c:v', 'libwebp', '-quality', '90', out,
  ]);
  return fs.readFileSync(out);
}

/** Extrai o áudio de um vídeo e converte para Opus mono (usado no sticker com som). */
export async function paraOpus(midia: MidiaMarcada): Promise<Buffer> {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wpp-sticker-audio-'));
  const inp = path.join(tmp, 'in.mp4');
  const out = path.join(tmp, 'out.ogg');
  fs.writeFileSync(inp, midia.buffer);
  await execFileAsync(FFMPEG, [
    '-y', '-loglevel', 'error', '-i', inp,
    '-vn', '-c:a', 'libopus', '-ac', '1', '-avoid_negative_ts', 'make_zero', out,
  ]);
  return fs.readFileSync(out);
}
