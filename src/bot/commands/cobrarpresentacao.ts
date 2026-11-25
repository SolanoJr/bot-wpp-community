import { ICommand } from './types';
import { isMaster } from '../../services/permissions';
import { findParticipant } from '../../services/groupAdmin';
import { getDb } from '../../services/databaseService';
import { resolvePresentationMessage } from '../../services/welcomeService';
import { groupTag } from './format';
import { logInfo, logError } from '../../services/loggerService';

/**
 * $cobrarpresentacao — reenvia o aviso de apresentação para um membro que
 * entrou, não se apresentou e precisa ser cobrado novamente.
 *
 *   $cobrarpresentacao @membro
 *   $cobrarpresentacao 55999999999999
 *
 * O membro responde ao aviso reenviado e a apresentação é substituída
 * (ON CONFLICT ... DO UPDATE no presentationService).
 */
export const cobrarpresentacaoCommand: ICommand = {
  name: 'cobrarpresentacao',
  description: 'Cobra a apresentação de um membro novamente (Apenas Admins).',
  async execute(ctx) {
    const chat = await ctx.getChat();
    if (!chat.isGroup) {
      return ctx.reply(`⚠️ Este comando só funciona em grupos.${groupTag(ctx)}`);
    }

    const isUserMaster = isMaster(ctx.userId);
    if (!isUserMaster) {
      const membro = findParticipant(chat, ctx.userId);
      if (!membro || !(membro as any).isAdmin && !(membro as any).isSuperAdmin) {
        return ctx.reply(`🚫 Apenas administradores podem cobrar apresentações.${groupTag(ctx)}`);
      }
    }

    const args = ctx.args || [];
    const mencionado = (ctx.msg as any)?.mentions?.[0];
    const alvoBruto = mencionado
      ? String((mencionado as any).id || mencionado)
      : String(args[0] || '').replace(/^[@$#]/, '');
    const numero = alvoBruto.replace(/^wpp:/, '').split('@')[0].replace(/\D/g, '');
    if (!numero) {
      return ctx.reply(`📋 Uso: \`$cobrarpresentacao @membro\` ou \`$cobrarpresentacao <numero>\`.${groupTag(ctx)}`);
    }

    try {
      const db = await getDb();
      const grupo = String(chat.id || '').replace(/^wpp:/, '');
      const participantes: any[] = (chat as any).participants || [];
      const encontrado = participantes.find((p) => {
        const id = String(p.id || p.jid || '');
        const phone = String(p.phoneNumber || '');
        return id.replace(/\D/g, '').endsWith(numero) || phone.replace(/\D/g, '').endsWith(numero);
      });
      const userId = encontrado
        ? String(encontrado.id || encontrado.jid)
        : `${numero}@s.whatsapp.net`;

      const ja = await db.get(
        `SELECT presentation_id, nome, status FROM presentations WHERE group_id = ? AND user_id = ? ORDER BY updated_at DESC LIMIT 1`,
        [grupo, userId]
      );
      if (ja) {
        return ctx.reply(
          `ℹ️ Esse membro já tem apresentação salva (_${(ja as any).nome || 'sem nome'}_). ` +
          `Se quiser substituir, peça pra ele responder ao aviso novamente.${groupTag(ctx)}`
        );
      }

      const { text } = await resolvePresentationMessage(grupo, {
        nome: numero,
        numero,
        handle: `@${numero}`,
        grupo: (chat as any).name || 'o grupo',
      });
      const mentions = [userId.includes('@') ? userId : `${numero}@s.whatsapp.net`];
      await (ctx.client as any).sendMessage(ctx.chatId, text, { mentions });
      logInfo(`[cobrarpresentacao] aviso reenviado para ${userId}`);
      return ctx.reply(`📢 Apresentação cobrada de @${numero}.${groupTag(ctx)}`);
    } catch (e: any) {
      logError(`[cobrarpresentacao] falha: ${e?.message || e}`);
      return ctx.reply(`❌ Falha ao cobrar: ${e?.message || e}${groupTag(ctx)}`);
    }
  },
};
