import { ICommand } from './types';
import { getList, listLists, saveList, deleteList } from '../../services/listsService';
import { groupTag } from './format';
import { logError } from '../../services/loggerService';

/**
 * $lista — listas persistentes por grupo.
 *
 *   $lista                     → lista as listas do grupo
 *   $lista show <nome>         → mostra os itens de uma lista
 *   $lista add <nome> <itens>  → cria/acrescenta itens
 *   $lista remove <nome> <itens> → remove itens
 *   $lista del <nome>          → apaga a lista inteira
 *
 * O list_id é namespaced por grupo (`<groupId>::<slug>`) porque a PK da
 * tabela `lists` é global — sem isso, dois grupos com o mesmo nome de lista
 * sobrescreveriam um ao outro no INSERT OR REPLACE.
 */

const slug = (raw: string): string =>
  String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^[$@]+/, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');

const listId = (groupId: string, nome: string): string => `${groupId}::${nome}`;

const parseItems = (args: string[]): string[] =>
  args.map((a) => String(a).trim()).filter(Boolean);

const readItems = (items: string): string[] => {
  try {
    const arr = JSON.parse(items);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
};

export const listaCommand: ICommand = {
  name: 'lista',
  description: 'Listas persistentes do grupo: $lista [show|add|remove|del]',
  async execute(ctx) {
    const chat = await ctx.getChat();
    if (!chat.isGroup) {
      return ctx.reply(`⚠️ O comando $lista só funciona em grupos.${groupTag(ctx)}`);
    }
    if (!ctx.isMaster && !ctx.isAdmin) {
      return ctx.reply(`🚫 Apenas administradores podem gerenciar listas.${groupTag(ctx)}`);
    }

    const args = ctx.args || [];
    const sub = String(args[0] || '').toLowerCase();
    const nome = slug(args[1] || '');
    const itens = parseItems(args.slice(2));
    const groupId = chat.id;

    try {
      // ─── criar/acrescentar ───
      if (sub === 'add') {
        if (!nome || !itens.length) {
          return ctx.reply(`📋 Uso: \`$lista add <nome> <item1> <item2> ...\`${groupTag(ctx)}`);
        }
        const id = listId(groupId, nome);
        const atual = await getList(groupId, id);
        const arr = atual ? readItems(atual.items) : [];
        const novos = itens.filter((i) => !arr.includes(i));
        if (!novos.length) {
          return ctx.reply(`ℹ️ Nenhum item novo — todos já estão na lista *${nome}*.${groupTag(ctx)}`);
        }
        await saveList(id, groupId, nome, [...arr, ...novos]);
        return ctx.reply(
          `✅ Lista *${nome}*: +${novos.length} item(ns) — ${novos.join(', ')}. ` +
          `Total: ${arr.length + novos.length}.${groupTag(ctx)}`
        );
      }

      // ─── remover itens ───
      if (sub === 'remove') {
        if (!nome || !itens.length) {
          return ctx.reply(`📋 Uso: \`$lista remove <nome> <item1> <item2> ...\`${groupTag(ctx)}`);
        }
        const id = listId(groupId, nome);
        const atual = await getList(groupId, id);
        if (!atual) {
          return ctx.reply(`❌ Lista *${nome}* não existe neste grupo.${groupTag(ctx)}`);
        }
        const arr = readItems(atual.items);
        const restantes = arr.filter((i) => !itens.includes(i));
        const removidos = arr.length - restantes.length;
        if (!removidos) {
          return ctx.reply(`ℹ️ Nenhum item removido de *${nome}*.${groupTag(ctx)}`);
        }
        await saveList(id, groupId, nome, restantes);
        return ctx.reply(
          `✅ Removido(s) de *${nome}*: ${itens.filter((i) => arr.includes(i)).join(', ')}. ` +
          `Restam ${restantes.length}.${groupTag(ctx)}`
        );
      }

      // ─── apagar lista ───
      if (sub === 'del') {
        if (!nome) {
          return ctx.reply(`📋 Uso: \`$lista del <nome>\`${groupTag(ctx)}`);
        }
        const id = listId(groupId, nome);
        const atual = await getList(groupId, id);
        if (!atual) {
          return ctx.reply(`❌ Lista *${nome}* não existe neste grupo.${groupTag(ctx)}`);
        }
        await deleteList(groupId, id);
        return ctx.reply(`🗑️ Lista *${nome}* apagada.${groupTag(ctx)}`);
      }

      // ─── mostrar itens ───
      if (sub === 'show') {
        if (!nome) {
          return ctx.reply(`📋 Uso: \`$lista show <nome>\`${groupTag(ctx)}`);
        }
        const atual = await getList(groupId, listId(groupId, nome));
        if (!atual) {
          return ctx.reply(`❌ Lista *${nome}* não existe neste grupo.${groupTag(ctx)}`);
        }
        const arr = readItems(atual.items);
        const lines = arr.length ? arr.map((i, n) => `${n + 1}. ${i}`) : ['_(vazia)_'];
        return ctx.reply(`📋 *${atual.list_name || nome}*\n\n${lines.join('\n')}${groupTag(ctx)}`);
      }

      // ─── listar (padrão) ───
      const rows = await listLists(groupId);
      if (!rows.length) {
        return ctx.reply(
          `📋 Nenhuma lista neste grupo. Crie com \`$lista add <nome> <item>\`.${groupTag(ctx)}`
        );
      }
      const lines = rows.map((r: any) => {
        const count = readItems(r.items).length;
        return `• ${r.list_name || r.list_id} _(${count} item(ns))_`;
      });
      return ctx.reply(`📋 *Listas do grupo*\n\n${lines.join('\n')}${groupTag(ctx)}`);
    } catch (e: any) {
      logError(`[lista] erro: ${e?.message || e}`);
      return ctx.reply(`❌ Erro ao processar lista: ${e?.message || e}${groupTag(ctx)}`);
    }
  },
};
