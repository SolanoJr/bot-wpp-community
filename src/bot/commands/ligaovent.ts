import fs from 'fs';
import path from 'path';
import { ICommand } from './types';
import { groupTag } from './format';
import { logError } from '../../services/loggerService';

/**
 * #ligaovent — zoeira: manda o som de um ventilador ligado.
 *
 * O Baileys v7 RC14 ainda não tem o campo de "figurinha de áudio" no proto;
 * o mais próximo é audioMessage com ptt (mensagem de voz).
 */
export const ligaoventCommand: ICommand = {
  name: 'ligaovent',
  description: '🌀 Liga o ventilador (áudio).',
  async execute(ctx) {
    const arquivo = path.join(process.cwd(), 'assets', 'fun', 'ventilador.wav');
    if (!fs.existsSync(arquivo)) {
      return ctx.reply(`⚠️ Ventilador fora de serviço.${groupTag(ctx)}`);
    }
    try {
      await (ctx.client as any).sendMedia(
        ctx.chatId,
        { type: 'audio', data: arquivo, filename: 'ventilador.wav', mimetype: 'audio/wav' },
        undefined,
        { sendAudioAsVoice: true }
      );
    } catch (e: any) {
      logError(`[ligaovent] falha: ${e?.message || e}`);
      return ctx.reply(`❌ Não consegui ligar o ventilador: ${e?.message || e}${groupTag(ctx)}`);
    }
  },
};
