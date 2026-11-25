import { ICommand } from './types';
import { groupTag } from './format';
import { logError } from '../../services/loggerService';
import { getMidiaMarcada, paraWebP, paraOpus } from '../../services/stickerFactory';
import { sendStickerComSom } from '../../services/spikeAudioSticker';

/** $figurinhasom — marque um vídeo e eu viro figurinha com som. */
export const figurinhasomCommand: ICommand = {
  name: 'figurinhasom',
  description: 'Marque um vídeo e eu viro figurinha com som.',
  usage: '$figurinhasom (marcando um vídeo)',
  async execute(ctx) {
    const sock: any = (ctx.client as any)?.sock || (ctx.client as any)?.sender?.sock;
    if (!sock) {
      return ctx.reply(`⚠️ Sock do Baileys indisponível.${groupTag(ctx)}`);
    }
    const midia = await getMidiaMarcada(sock, ctx.msg?.raw).catch(() => null);
    if (!midia || midia.tipo !== 'video') {
      return ctx.reply(
        `🔊 Pra figurinha com som, marque um **vídeo** e me envie:\n` +
        `→ $figurinhasom marcando o vídeo.\n` +
        `Eu pego o áudio dele e viro figurinha com som. Sem vídeo marcado, não tem áudio pra extrair :)${groupTag(ctx)}`
      );
    }
    const chat = await ctx.getChat();
    try {
      const [webp, opus] = await Promise.all([paraWebP(midia), paraOpus(midia)]);
      await sendStickerComSom(sock, chat.id, webp, opus);
    } catch (e: any) {
      logError(`[figurinhasom] falha: ${e?.message || e}`);
      return ctx.reply(`❌ Não consegui converter esse vídeo. Tenta outro mais curto.${groupTag(ctx)}`);
    }
  },
};
