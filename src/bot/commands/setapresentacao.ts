import { ICommand } from './types';
import { isMaster } from '../../services/permissions';
import { findParticipant } from '../../services/groupAdmin';
import {
  getPresentationMessage,
  setPresentationMessage,
  composePresentationMessage,
  DEFAULT_PRESENTATION_MESSAGE,
} from '../../services/welcomeService';
import { groupTag } from './format';
import { logInfo } from '../../services/loggerService';

/**
 * $setapresentacao — texto EXTRA do aviso de apresentação, por grupo.
 *
 * Espelha o $setwelcome (composição ADITIVA: o padrão SEMPRE abre, a menção
 * ao novato nunca se perde).
 *
 *   $setapresentacao                → mostra o aviso atual
 *   $setapresentacao <texto>        → padrão + "\n\n" + texto (ADITIVO)
 *   $setapresentacao --full <txt>   → template completo, sem prepender
 *   $setapresentacao reset          → volta ao padrão puro (default|reset)
 */
export const setapresentacaoCommand: ICommand = {
  name: 'setapresentacao',
  description: 'Configura o aviso de apresentação do grupo (Apenas Admins).',
  async execute(ctx) {
    const chat = await ctx.getChat();
    if (!chat.isGroup) {
      await ctx.reply('❌ Este comando só pode ser usado em grupos.');
      return;
    }

    const isUserMaster = isMaster(ctx.userId);
    let isGroupAdmin = false;
    if (!isUserMaster) {
      const member = findParticipant(chat, ctx.userId);
      isGroupAdmin = Boolean(member && (member.isAdmin || member.isSuperAdmin));
      logInfo(`🛡️ [ADMIN-CHECK] ${ctx.userId} é Admin? ${isGroupAdmin ? 'SIM' : 'NÃO'}`);
    }
    if (!isUserMaster && !isGroupAdmin) {
      logInfo(`🚫 [AUTH-FAIL] $setapresentacao negado para ${ctx.userId}`);
      await ctx.reply('❌ Apenas administradores do grupo ou o MASTER do bot podem usar este comando.');
      return;
    }

    const groupId = chat.id;
    const args = ctx.args || [];
    const primeiro = String(args[0] || '').toLowerCase();

    if (primeiro === 'reset' || primeiro === 'default') {
      await setPresentationMessage(groupId, null);
      await ctx.reply(`✅ Aviso de apresentação resetado para o padrão:\n\n${DEFAULT_PRESENTATION_MESSAGE}${groupTag(ctx)}`);
      return;
    }

    if (args.length === 0) {
      const custom = await getPresentationMessage(groupId);
      const atual = composePresentationMessage(custom ?? '');
      const origem = custom === null ? '_(padrão do sistema)_' : '_(personalizado)_';
      await ctx.reply(
        `📋 *Aviso de apresentação atual* ${origem}\n\n${atual}\n\n` +
        `Adicionar texto: \`$setapresentacao <texto>\`\n` +
        `Template completo: \`$setapresentacao --full <texto>\`\n` +
        `Restaurar: \`$setapresentacao reset\``
      );
      return;
    }

    const isFull = String(args[0]) === '--full';
    const texto = (isFull ? args.slice(1) : args).join(' ').trim();
    if (!texto) {
      await ctx.reply('❌ Texto vazio. Use `$setapresentacao <texto>`, `--full <texto>` ou `reset`.');
      return;
    }

    const novo = isFull ? texto : composePresentationMessage(texto);
    await setPresentationMessage(groupId, novo);
    await ctx.reply(`✅ Aviso de apresentação atualizado.${groupTag(ctx)}\n\n${novo}`);
  },
};
