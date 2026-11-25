import { ICommand } from './types';
import { CommandContext } from '../../platforms/base/PlatformTypes';
import { isMaster, cleanId } from '../../services/permissions';
import { isBotGroupAdmin, isSenderGroupAdmin, findParticipant, adapterProvidesParticipants } from '../../services/groupAdmin';
import { getMentionedIds } from './targetResolver';
import { groupTag, getTargetDisplayName } from './format';
import { logInfo, logWarning, logError } from '../../services/loggerService';

export const banCommand: ICommand = {
  name: 'ban',
  description: 'Bane um usuário do grupo, remove e bloqueia (WhatsApp, Telegram e Discord).',

  async execute(ctx: CommandContext) {
    try {
      const chat = await ctx.getChat();
      if (!chat.isGroup) {
        await ctx.reply('❌ Este comando só funciona em grupos.');
        return;
      }

      const participants = chat.participants || [];

      // Autorização: fonte única (groupAdmin) — mesma lógica do $kick.
      const botAdmin = isBotGroupAdmin(chat, ctx.client.userId);
      if (!botAdmin.verified) {
        // INC-004: mesma condição do $kick — metadata falhou AGORA (timeout do
        // groupMetadata) → isPermissionsVerified:false. Retry curto, não a
        // mensagem de "plataforma sem lista".
        if (chat.isPermissionsVerified === false) {
          await ctx.reply('⏳ Não consegui carregar a lista de membros agora. Tente novamente em alguns segundos.');
          return;
        }
        await ctx.reply(
          adapterProvidesParticipants(chat)
            ? '❌ Não foi possível identificar o bot na lista de membros. Tente novamente.'
            : '❌ Este comando exige a lista de membros do grupo, que não está disponível nesta plataforma.'
        );
        return;
      }
      if (!botAdmin.isAdmin) {
        await ctx.reply('❌ O bot precisa ser administrador para usar este comando.');
        return;
      }

      const senderIsAdmin = isSenderGroupAdmin(chat, ctx.userId) || isMaster(ctx.userId);
      if (!senderIsAdmin) {
        await ctx.reply('❌ Você precisa ser administrador para usar este comando.');
        return;
      }

      // Resolver alvo: menção real (Baileys) OU número digitado no texto
      // (ex.: "$ban @127848559972419" quando o WhatsApp não gerou menção real).
      const mentionedIds = getMentionedIds(ctx);
      let userToBan = mentionedIds.length > 0 ? mentionedIds[0] : '';

      // Fallback: extrair número do texto do comando (ex.: "$ban @127848559972419")
      if (!userToBan) {
        const textMatch = ctx.msg.text.match(/@\s*(\d{8,})/);
        if (textMatch) {
          const num = textMatch[1];
          // BUG 3 fix: consultar participants para achar o JID real.
          // Se não achar, o número não é membro do grupo → responder erro.
          const participant = participants.find((p: any) => {
            const pid = String(p.id || p.jid || '');
            const numPart = pid.split('@')[0].split(':')[0];
            const phonePart = String(p.phoneNumber || '').split('@')[0].split(':')[0];
            return numPart === num || phonePart === num;
          });
          if (participant) {
            // Preferir phoneNumber (PN é mais aceito pelo Baileys) se disponível
            userToBan = (participant as any).phoneNumber || participant.id || `${num}@s.whatsapp.net`;
          } else {
            // Tentar com @lid e @s.whatsapp.net como fallback
            userToBan = `${num}@lid`;
          }
        }
      }

      if (!userToBan) {
        await ctx.reply('❌ Marque o usuário a ser banido com @usuario.');
        return;
      }
      const userToBanClean = cleanId(userToBan);

      const userPart = findParticipant(chat, userToBan);
      if (userPart?.isAdmin || userPart?.isSuperAdmin) {
        await ctx.reply('❌ Não é possível banir administradores.');
        return;
      }

      // Tentar apagar última mensagem do usuário (WhatsApp suporta; demais ignoram silenciosamente)
      let deletedCount = 0;
      try {
        if (ctx.platform === 'whatsapp' && ctx.msg.raw?.chat?.fetchMessages) {
          const messages = await ctx.msg.raw.chat.fetchMessages({ limit: 50 });
          const last = messages.find(
            (m: any) => cleanId(m.author || m.from || '') === userToBanClean && !m.fromMe
          );
          if (last) {
            await last.delete(true);
            deletedCount = 1;
          }
        }
      } catch (delErr) {
        logWarning('[ban] Falha ao apagar mensagem (não crítico):', delErr);
      }

      await ctx.client.banParticipant(ctx.chatId, userToBan);

      // Nome da pessoa banida (busca contato real; WWebJS @lid nao traz name no participant)
      const bannedName = await getTargetDisplayName(ctx.client, userToBan, participants);

      // Salvar no banco de banidos (persistência - impede re-entrada)
      try {
        const { banUser } = await import('../../services/databaseService.js');
        await banUser({
          groupId: ctx.chatId,
          userId: userToBan,
          bannedBy: ctx.userId,
          reason: 'Banido por comando'
        });
      } catch (dbErr) {
        logWarning('[ban] Falha ao salvar banido no DB (não crítico):', dbErr);
      }

      const numeroBan = String(userToBan).replace('@c.us', '').replace('@lid', '');
      // No WhatsApp o nome aparece via MENÇÃO (@numero + mentions, igual ao welcome do novato).
      // Garantimos o nome também no TEXTO (se o WA não renderizar) usando bannedName.
      await ctx.reply(
        ctx.platform === 'whatsapp'
          ? `✅ ${bannedName || '@' + numeroBan} foi banido com sucesso!${groupTag(ctx)}\n` +
            `🗑️ ${deletedCount > 0 ? 'Última mensagem apagada' : 'Nenhuma mensagem encontrada'}\n` +
            `🚫 Contato bloqueado`
          : `✅ ${bannedName || numeroBan} foi banido com sucesso!${groupTag(ctx)}\n` +
            `🗑️ ${deletedCount > 0 ? 'Última mensagem apagada' : 'Nenhuma mensagem encontrada'}\n` +
            `🚫 Contato bloqueado`,
        {
          ...(ctx.platform === 'whatsapp' ? { mentions: [userToBan] } : {}),
        } as any
      );
    } catch (error: any) {
      logError('[ban] Erro:', error);
      await ctx.reply(`❌ Erro ao banir usuário: ${error.message}`);
    }
  },
};
