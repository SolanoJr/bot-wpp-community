import fs from 'fs';
import path from 'path';
import { logWarning } from './loggerService';

/**
 * audioCacheService — cache local de áudios recebidos, por messageId.
 *
 * Necessário porque o Baileys v7 RC14 não mantém store de mensagens antigas:
 * quando o usuário responde a um áudio com $transcreva, o payload original
 * (mediaKey/url) não está mais disponível. O buffer é salvo no momento do
 * messages.upsert e conservado por TTL curto.
 */
const CACHE_DIR = process.env.AUDIO_CACHE_DIR
  ? path.resolve(process.env.AUDIO_CACHE_DIR)
  : path.join(process.cwd(), 'data', 'audio_cache');
const TTL_MS = 2 * 60 * 60 * 1000; // 2 horas
const MAX_FILES = 100;

const safeId = (id: string): string =>
  String(id || '')
    .replace(/^(whatsapp|wpp|telegram|tg|discord|dc):/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 120);

export function audioPath(messageId: string): string {
  return path.join(CACHE_DIR, `${safeId(messageId)}.ogg`);
}

function prune(): void {
  try {
    const now = Date.now();
    const list = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith('.ogg'));
    for (const f of list) {
      const full = path.join(CACHE_DIR, f);
      const st = fs.statSync(full);
      if (now - st.mtimeMs > TTL_MS) fs.unlinkSync(full);
    }
    const rest = fs.readdirSync(CACHE_DIR)
      .filter((f) => f.endsWith('.ogg'))
      .map((f) => ({ f, t: fs.statSync(path.join(CACHE_DIR, f)).mtimeMs }))
      .sort((a, b) => a.t - b.t);
    while (rest.length > MAX_FILES) {
      const old = rest.shift();
      if (old) fs.unlinkSync(path.join(CACHE_DIR, old.f));
    }
  } catch (e: any) {
    logWarning(`[audioCache] prune falhou: ${e?.message || e}`);
  }
}

export function initAudioCache(): void {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    prune();
  } catch (e: any) {
    logWarning(`[audioCache] init falhou: ${e?.message || e}`);
  }
}

export async function saveAudio(messageId: string, buffer: Buffer): Promise<boolean> {
  if (!messageId || !buffer || !buffer.length) return false;
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(audioPath(messageId), buffer);
    return true;
  } catch (e: any) {
    logWarning(`[audioCache] falha ao salvar ${messageId}: ${e?.message || e}`);
    return false;
  }
}

/** Retorna o caminho do áudio em cache, ou null se ausente/expirado. */
export function getAudio(messageId: string): string | null {
  try {
    const full = audioPath(messageId);
    if (!fs.existsSync(full)) return null;
    const st = fs.statSync(full);
    if (Date.now() - st.mtimeMs > TTL_MS) {
      fs.unlinkSync(full);
      return null;
    }
    return full;
  } catch {
    return null;
  }
}
