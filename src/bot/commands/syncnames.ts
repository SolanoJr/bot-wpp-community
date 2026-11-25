import { ICommand } from './types';
import { groupTag } from './format';
import { logError } from '../../services/loggerService';
import { upsertCommunityGroup } from '../../services/welcomeService';

/** $syncnames — sincroniza os nomes reais dos grupos via groupMetadata. */
export const syncnamesCommand: ICommand = {
  name: 'syncnames',
  description: 'Sincroniza os nomes dos grupos do banco com o metadata do WhatsApp.',
  async execute(ctx) {
    const sock: any = (ctx.client as any)?.sock || (ctx.client as any)?.sender?.sock;
    if (!sock) {
      return ctx.reply(`⚠️ Sock do Baileys indisponível.${groupTag(ctx)}`);
    }
    const db = (await import('../../services/databaseService.js')).getDb;
    const database = await db();
    const rows: any[] = await database.all(
      `SELECT group_id, community_id FROM group_mod WHERE group_id LIKE '%@g.us'`
    );
    let ok = 0;
    let falhas = 0;
    for (const row of rows) {
      try {
        const meta: any = await sock.groupMetadata(row.group_id);
        const nome = String(meta?.subject || '').trim();
        if (!nome) continue;
        await upsertCommunityGroup(row.group_id, row.community_id || '', nome);
        ok++;
      } catch {
        falhas++;
      }
    }
    return ctx.reply(`✅ Nomes sincronizados: ${ok} ok, ${falhas} falhas.${groupTag(ctx)}`);
  },
};
