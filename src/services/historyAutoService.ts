import fs from 'fs';
import path from 'path';
import logger from './loggerService';
import { sendHistoryNotice } from './historyNoticeService';

/** Grupo Teste — NUNCA recebe histórico automático. */
const LAB_GROUP = '120363410094452673@g.us';

/**
 * Auto-histórico — reproduz o botão nativo "Enviar histórico de mensagens"
 * silenciosamente quando um membro entra. Não posta nada visível no grupo:
 * o próprio WhatsApp já exibe o aviso "Você enviou o histórico...".
 *
 * Regras:
 *  - flag WPP_HISTORY_AUTO=1 (geral)
 *  - nunca no Grupo Teste
 *  - receiver = LID do membro que entrou
 *  - oldest/count = últimas mensagens do grupo no capture-store
 */
export async function sendAutoHistory(
  sock: any,
  groupId: string,
  receiverId: string,
): Promise<void> {
  if (process.env.WPP_HISTORY_AUTO !== '1') return;
  if (String(groupId || '').replace(/^wpp:/, '') === LAB_GROUP) return;
  if (!sock || !receiverId) return;

  let oldest = Math.floor(Date.now() / 1000) - 86400;
  let count = 100;
  try {
    const store = path.join(process.cwd(), 'laboratorio', 'captured-messages.jsonl');
    if (fs.existsSync(store)) {
      const linhas = fs.readFileSync(store, 'utf8').split('\n').filter(Boolean);
      const doGrupo: number[] = [];
      for (const linha of linhas) {
        if (!linha.includes(groupId)) continue;
        try {
          const d = JSON.parse(linha);
          const ts = Number(d?.timestamp || d?.rawPayloadSafe?.messageTimestamp || 0);
          if (ts > 0) doGrupo.push(Math.floor(ts / 1000));
        } catch { /* linha corrompida — ignora */ }
      }
      doGrupo.sort((a, b) => a - b);
      if (doGrupo.length) {
        const janela = doGrupo.slice(-100);
        oldest = janela[0];
        count = janela.length;
      }
    }
  } catch (e: any) {
    logger.warn('[autoHistory] capture-store indisponível, usando fallback', { error: e?.message });
  }

  try {
    await sendHistoryNotice(sock, groupId, {
      receivers: [receiverId],
      oldestMessageTimestamp: oldest,
      messageCount: count,
    });
    logger.info('[autoHistory] notice enviado', { groupId, receiverId, oldest, count });
  } catch (e: any) {
    logger.warn('[autoHistory] falha ao enviar notice', { groupId, receiverId, error: e?.message });
  }
}
