import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const YTDLP = process.env.WPP_YTDLP || 'python3 -m yt_dlp';
const FFMPEG_DIR = path.join(process.env.HOME || '', 'tools/ffmpeg');
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export interface VideoBaixado {
  caminho: string;
  titulo: string;
  duracao: number;
}

/**
 * Baixa vídeo de YouTube/TikTok/Instagram/Twitter/Facebook/etc via yt-dlp.
 * Limite de 50 MB e 5 min pra não estourar a VPS de 2 GB.
 */
export async function baixarVideo(url: string): Promise<VideoBaixado> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('URL inválida');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Use um link http(s)');
  const host = parsed.hostname.toLowerCase();
  // Bloqueia alvos internos (SSRF)
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host)
  ) {
    throw new Error('Link interno não permitido');
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wpp-dl-'));
  const modelo = path.join(tmp, 'video.%(ext)s');
  const [bin, ...argsBase] = YTDLP.split(' ');
  const args = [
    ...argsBase,
    '--no-warnings',
    '--no-playlist',
    '--max-filesize', String(MAX_BYTES),
    '--match-filter', 'duration<=300',
    '-f', 'bv*[height<=720]+ba/b[height<=720]/bv*/b',
    '--merge-output-format', 'mp4',
    '--ffmpeg-location', FFMPEG_DIR,
    '-o', modelo,
    url,
  ];

  await execFileAsync(bin, args, {
    timeout: 180000,
    maxBuffer: 2 * 1024 * 1024,
  });

  const arquivos = fs.readdirSync(tmp).filter(f => /\.(mp4|webm|mkv|mov|m4v)$/i.test(f));
  if (!arquivos.length) throw new Error('Nenhum vídeo baixado');
  const caminho = path.join(tmp, arquivos[0]);
  const stats = fs.statSync(caminho);
  if (stats.size > MAX_BYTES) throw new Error('Vídeo grande demais (máx. 50 MB)');
  return { caminho, titulo: arquivos[0], duracao: 0 };
}
