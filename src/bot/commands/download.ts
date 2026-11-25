import fs from 'fs';
import { ICommand } from './types';
import { groupTag } from './format';
import { logError } from '../../services/loggerService';
import { baixarVideo } from '../../services/videoDownloadService';

function extrairUrl(texto: string): string | null {
  const m = String(texto || '').match(/https?:\/\/[^\s<>"']+/i);
  return m ? m[0] : null;
}

/** $download (alias $dl) — aceita link no comando OU mensagem marcada com link. */
export const downloadCommand: ICommand = {
  name: 'download',
  aliases: ['dl'],
  description: 'Baixa vídeo de YouTube/TikTok/Instagram/X/Facebook e manda no grupo.',
  usage: '$download <link>  ou  marque uma mensagem com link e use $download',
  async execute(ctx) {
    let url = extrairUrl(String(ctx.args?.[0] || ''));
    if (!url) {
      const quoted = ctx.msg?.raw?.message?.contextInfo?.quotedMessage;
      const textoQuoted =
        quoted?.conversation ||
        quoted?.extendedTextMessage?.text ||
        quoted?.text ||
        '';
      url = extrairUrl(textoQuoted);
    }
    if (!url) {
      return ctx.reply(
        `📥 Manda o link do vídeo assim: $download <link>\n` +
        `Ou copia o link, manda no grupo, marca a mensagem e responde só $download.\n` +
        `Funciona com YouTube, TikTok, Instagram, X/Twitter, Facebook e vários outros.\n` +
        `Depois marca o vídeo e responde com $figurinha (sem som) ou $figurinhasom (com som).${groupTag(ctx)}`
      );
    }
    const chat = await ctx.getChat();
    const sock: any = (ctx.client as any)?.sock || (ctx.client as any)?.sender?.sock;
    if (!sock) {
      return ctx.reply(`⚠️ Sock do Baileys indisponível.${groupTag(ctx)}`);
    }
    await ctx.reply(`⏬ Baixando vídeo...${groupTag(ctx)}`);
    try {
      const video = await baixarVideo(url);
      await sock.sendMessage(chat.id, {
        video: fs.readFileSync(video.caminho),
        caption: `📥 Vídeo baixado. Marca ele e responde com $figurinha (sem som) ou $figurinhasom (com som).`,
      } as any);
      fs.rmSync(video.caminho, { force: true });
    } catch (e: any) {
      logError(`[download] falha: ${e?.message || e}`);
      const msg = String(e?.message || e);
      const amigavel = /private|sign in|login|age|restrict|geo/i.test(msg)
        ? 'Esse vídeo está protegido ou restrito — não dá pra baixar.'
        : /Nenhum vídeo|grande demais|inválida|interno/i.test(msg)
          ? msg
          : 'Não consegui baixar esse link. Tenta outro.';
      return ctx.reply(`❌ ${amigavel}${groupTag(ctx)}`);
    }
  },
};
