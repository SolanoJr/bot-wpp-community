import { ICommand } from './types';
import { getAudio } from '../../services/audioCacheService';
import { transcribeAudioFile } from '../../services/transcriptionService';
import { groupTag } from './format';
import { logError, logInfo } from '../../services/loggerService';

/**
 * $transcreva — transcreve o áudio marcado (reply/quote).
 *
 * Uso: responda a uma mensagem de áudio com `$transcreva`.
 * O áudio é recuperado do cache local preenchido no momento do recebimento
 * (o Baileys v7 RC14 não mantém store de mensagens antigas).
 */
export const transcrevaCommand: ICommand = {
  name: 'transcreva',
  description: 'Transcreve o áudio marcado (responda ao áudio e use $transcreva).',
  async execute(ctx) {
    const msg: any = ctx.msg;
    const rawMsg = msg?.raw || {};
    const contextInfo =
      rawMsg?.message?.extendedTextMessage?.contextInfo ||
      rawMsg?.contextInfo ||
      {};
    const quoted = rawMsg?.quoted || contextInfo || {};
    const limpo = (v: unknown): string =>
      String(v || '').replace(/^(whatsapp|wpp|telegram|tg|discord|dc):/i, '').trim();
    // Ordem importa: o stanzaId do payload cru é o ID real do áudio marcado.
    // replyToMessageId vem do normalizador COM prefixo de plataforma.
    const messageId: string =
      limpo(contextInfo?.stanzaId) ||
      limpo(quoted?.stanzaId) ||
      limpo(quoted?.key?.id) ||
      limpo(msg?.quotedId) ||
      limpo(msg?.replyToMessageId) ||
      '';

    if (!messageId) {
      return ctx.reply(
        `🎙️ Marque (responda) a mensagem de áudio e envie \`$transcreva\`.${groupTag(ctx)}`
      );
    }

    const arquivo = getAudio(messageId);
    if (!arquivo) {
      return ctx.reply(
        `⚠️ Não achei esse áudio no cache (expirou após 2h ou chegou antes do deploy). ` +
        `Reenvie o áudio e tente de novo.${groupTag(ctx)}`
      );
    }

    try {
      logInfo(`[transcreva] transcrevendo ${messageId}`);
      const texto = await transcribeAudioFile(arquivo);
      if (!texto) {
        return ctx.reply(`⚠️ O áudio parece vazio ou não foi possível entender.${groupTag(ctx)}`);
      }
      const corte = texto.length > 4000 ? texto.slice(0, 4000) + '…' : texto;
      return ctx.reply(`🎙️ *Transcrição:*\n\n${corte}${groupTag(ctx)}`);
    } catch (e: any) {
      logError(`[transcreva] falha: ${e?.message || e}`);
      return ctx.reply(`❌ Falha ao transcrever: ${e?.message || e}${groupTag(ctx)}`);
    }
  },
};
