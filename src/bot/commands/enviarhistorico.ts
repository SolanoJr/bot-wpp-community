import fs from 'fs';
import path from 'path';
import { ICommand } from './types';
import { groupTag } from './format';
import { logError } from '../../services/loggerService';
import { sendHistoryNotice } from '../../services/historyNoticeService';

const LAB_GROUP = '120363410094452673@g.us';

/**
 * #enviarhistorico — spike 002 real, LIBERADO SÓ via flag E no Grupo Teste.
 * Reproduz o botão nativo: messageHistoryNotice -> servidor gera o bundle.
 */
export const enviarhistoricoCommand: ICommand = {
  name: 'enviarhistorico',
  description: '[SPIKE] Reproduz o botão "Enviar histórico" (Grupo Teste).',
  async execute(ctx) {
    if (process.env.WPP_SPIKE_HISTORY_NOTICE !== '1') {
      return ctx.reply(`⚠️ Spike desligado (WPP_SPIKE_HISTORY_NOTICE).${groupTag(ctx)}`);
    }
    const chat = await ctx.getChat();
    const gid = String(chat.id || '').replace(/^wpp:/, '');
    if (gid !== LAB_GROUP) {
      return ctx.reply(`⚠️ Este spike só roda no Grupo Teste.${groupTag(ctx)}`);
    }
    const sock: any = (ctx.client as any)?.sock || (ctx.client as any)?.sender?.sock;
    if (!sock) {
      return ctx.reply(`⚠️ Sock do Baileys indisponível.${groupTag(ctx)}`);
    }
    try {
      // Último receiver real capturado no Grupo Teste (LID de um membro).
      let receiver = '';
      let oldest = Math.floor(Date.now() / 1000) - 86400;
      const store = path.join(process.cwd(), 'laboratorio', 'captured-messages.jsonl');
      if (fs.existsSync(store)) {
        const linhas = fs.readFileSync(store, 'utf8').split('\n').filter(Boolean).reverse();
        for (const linha of linhas) {
          if (!linha.includes('messageHistoryNotice')) continue;
          const d = JSON.parse(linha);
          if (String(d?.rawPayloadSafe?.key?.remoteJid || '').replace(/^wpp:/, '') !== gid) continue;
          const meta = d?.rawPayloadSafe?.message?.messageHistoryNotice?.messageHistoryMetadata;
          if (meta?.historyReceivers?.length) {
            receiver = meta.historyReceivers[meta.historyReceivers.length - 1];
            oldest = Number(meta.oldestMessageTimestamp?.low || oldest);
            break;
          }
        }
      }
      // Argumento opcional: #enviarhistorico 13866030173
      // Resolve o LID pelo metadata do grupo (participants: id @lid + phoneNumber).
      const arg = String((ctx as any).args?.[0] || '').replace(/\D/g, '');
      if (arg) {
        const meta = await sock.groupMetadata(chat.id);
        const hit = (meta?.participants || []).find(
          (p: any) => String(p?.phoneNumber || '').replace(/\D/g, '') === arg
        );
        if (!hit?.id) {
          return ctx.reply(`⚠️ LID não encontrado p/ ${arg} no metadata.${groupTag(ctx)}`);
        }
        receiver = hit.id;
      }
      if (!receiver) {
        return ctx.reply(`⚠️ Sem LID de receiver no capture-store.${groupTag(ctx)}`);
      }
      await sendHistoryNotice(sock, chat.id, {
        receivers: [receiver],
        oldestMessageTimestamp: oldest,
        messageCount: 100,
      });
      return ctx.reply(`✅ notice enviado p/ ${receiver} (oldest=${oldest}).${groupTag(ctx)}`);
    } catch (e: any) {
      logError(`[enviarhistorico] falha: ${e?.message || e}`);
      return ctx.reply(`❌ Falha: ${e?.message || e}${groupTag(ctx)}`);
    }
  },
};
