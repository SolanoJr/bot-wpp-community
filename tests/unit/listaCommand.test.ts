import { describe, expect, it, vi, beforeEach } from 'vitest';
import { loadCommands } from '../../src/bot/commands/index';
import { getList, listLists, saveList, deleteList } from '../../src/services/listsService';

vi.mock('../../src/services/listsService', () => ({
  getList: vi.fn(),
  listLists: vi.fn(),
  saveList: vi.fn(),
  deleteList: vi.fn(),
  initListsTable: vi.fn(),
}));

const GROUP = 'wpp:558581344211-123456@g.us';
const ID = `${GROUP}::compras`;

function makeCtx(args: string[], overrides: any = {}) {
  const reply = vi.fn().mockResolvedValue(undefined);
  return {
    msg: { mentions: [], raw: {} },
    client: {},
    args,
    platform: 'whatsapp',
    chatId: GROUP,
    userId: 'wpp:558899834322@c.us',
    userName: 'Solano',
    isGroup: true,
    isMaster: false,
    isAdmin: true,
    reply,
    replyPrivate: vi.fn(),
    getChat: vi.fn().mockResolvedValue({ isGroup: true, id: GROUP }),
    getUser: vi.fn(),
    ...overrides,
  };
}

async function run(args: string[], overrides: any = {}) {
  const commands = loadCommands();
  const ctx = makeCtx(args, overrides);
  await commands.get('lista')?.execute(ctx as any);
  return ctx;
}

describe('$lista — escrita persistente por grupo', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sem listas: mostra dica de como criar', async () => {
    vi.mocked(listLists).mockResolvedValue([] as any);
    const ctx = await run([]);
    expect(listLists).toHaveBeenCalledWith(GROUP);
    expect(ctx.reply.mock.calls[0][0]).toContain('Nenhuma lista');
  });

  it('add: cria lista com list_id namespaced por grupo', async () => {
    vi.mocked(getList).mockResolvedValue(null as any);
    const ctx = await run(['add', 'compras', 'leite', 'cafe']);
    expect(getList).toHaveBeenCalledWith(GROUP, ID);
    expect(saveList).toHaveBeenCalledWith(ID, GROUP, 'compras', ['leite', 'cafe']);
    expect(ctx.reply.mock.calls[0][0]).toContain('+2 item');
  });

  it('add: acumula e nao duplica itens existentes', async () => {
    vi.mocked(getList).mockResolvedValue({
      list_id: ID, group_id: GROUP, list_name: 'compras',
      items: JSON.stringify(['leite', 'acucar']), created_at: 1, updated_at: 1,
    } as any);
    const ctx = await run(['add', 'compras', 'leite', 'cafe']);
    expect(saveList).toHaveBeenCalledWith(ID, GROUP, 'compras', ['leite', 'acucar', 'cafe']);
    expect(ctx.reply.mock.calls[0][0]).toContain('+1 item');
  });

  it('show: lista os itens numerados', async () => {
    vi.mocked(getList).mockResolvedValue({
      list_id: ID, group_id: GROUP, list_name: 'compras',
      items: JSON.stringify(['leite', 'cafe']), created_at: 1, updated_at: 1,
    } as any);
    const ctx = await run(['show', 'compras']);
    expect(getList).toHaveBeenCalledWith(GROUP, ID);
    const out = ctx.reply.mock.calls[0][0];
    expect(out).toContain('1. leite');
    expect(out).toContain('2. cafe');
  });

  it('remove: remove apenas os itens pedidos', async () => {
    vi.mocked(getList).mockResolvedValue({
      list_id: ID, group_id: GROUP, list_name: 'compras',
      items: JSON.stringify(['leite', 'cafe', 'acucar']), created_at: 1, updated_at: 1,
    } as any);
    const ctx = await run(['remove', 'compras', 'cafe']);
    expect(saveList).toHaveBeenCalledWith(ID, GROUP, 'compras', ['leite', 'acucar']);
    expect(ctx.reply.mock.calls[0][0]).toContain('Restam 2');
  });

  it('del: apaga a lista do grupo', async () => {
    vi.mocked(getList).mockResolvedValue({
      list_id: ID, group_id: GROUP, list_name: 'compras',
      items: '[]', created_at: 1, updated_at: 1,
    } as any);
    const ctx = await run(['del', 'compras']);
    expect(deleteList).toHaveBeenCalledWith(GROUP, ID);
    expect(ctx.reply.mock.calls[0][0]).toContain('apagada');
  });

  it('nao-admin nao pode gravar', async () => {
    const ctx = await run(['add', 'compras', 'leite'], { isAdmin: false, isMaster: false });
    expect(saveList).not.toHaveBeenCalled();
    expect(ctx.reply.mock.calls[0][0]).toContain('Apenas administradores');
  });
});
