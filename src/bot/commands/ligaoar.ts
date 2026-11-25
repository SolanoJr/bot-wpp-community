import fs from 'fs';
import path from 'path';
import { ICommand } from './types';
import { groupTag } from './format';
import { logError } from '../../services/loggerService';

/** #ligaoar — zoeira: manda um GIF de ar condicionado funcionando. */
export const ligaoarCommand: ICommand = {
  name: 'ligaoar',
  description: '❄️ Liga o ar condicionado (GIF).',
  async execute(ctx) {
    const arquivo = path.join(process.cwd(), 'assets', 'fun', 'ar-condicionado.mp4');
    if (!fs.existsSync(arquivo)) {
      return ctx.reply(`⚠️ Ar condicionado fora de serviço.${groupTag(ctx)}`);
    }
    try {
      await (ctx.client as any).sendMedia(
        ctx.chatId,
        { type: 'video', data: arquivo, filename: 'ar-condicionado.mp4', mimetype: 'video/mp4' },
        '❄️ Ar ligado!',
        { gifPlayback: true }
      );
    } catch (e: any) {
      logError(`[ligaoar] fallback para imagem: ${e?.message || e}`);
      try {
        const gif = path.join(process.cwd(), 'assets', 'fun', 'ar-condicionado.gif');
        await (ctx.client as any).sendMedia(
          ctx.chatId,
          { type: 'image', data: gif, mimetype: 'image/gif' },
          '❄️ Ar ligado!'
        );
      } catch (e2: any) {
        return ctx.reply(`❌ Não consegui mandar o GIF: ${e2?.message || e2}${groupTag(ctx)}`);
      }
    }
  },
};
