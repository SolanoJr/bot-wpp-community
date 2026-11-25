import { describe, it, expect, vi, beforeEach } from 'vitest';

const dbGet = vi.fn();
vi.mock('../../src/services/databaseService', () => ({
  getDb: vi.fn(async () => ({ get: dbGet })),
}));
vi.mock('../../src/services/welcomeService', () => ({
  resolvePresentationMessage: vi.fn(async () => ({ text: '📝 aviso de apresentação', isDefault: true })),
}));
vi.mock('../../src/services/permissions', async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, isMaster: vi.fn((id: string) => id === 'MASTER') };
});
vi.mock('../../src/services/groupAdmin', () => ({ findParticipant: vi.fn(() => ({ isAdmin: true })) }));
vi.mock('../../src/services/loggerService', () => ({
  default: { info: () => {}, warn: () => {}, error: () => {} },
  logInfo: () => {}, logWarning: () => {}, logError: () => {},
}));

const { cobrarpresentacaoCommand } = await import('../../src/bot/commands/cobrarpresentacao');

function ctx(args: string[] = ['55999999999999']) {
  return {
    userId: 'MASTER',
    args,
    msg: {},
    chatId: 'wpp:120363410094452673@g.us',
    client: { sendMessage: vi.fn(async () => ({})) },
    getChat: vi.fn(async () => ({ isGroup: true, id: 'wpp:120363410094452673@g.us', participants: [], name: 'Teste' })),
    reply: vi.fn(async (_t: string) => {}),
  } as any;
}

beforeEach(() => { vi.clearAllMocks(); dbGet.mockResolvedValue(null); });

describe('$cobrarpresentacao', () => {
  it('sem numero: mostra uso', async () => {
    const c = ctx([]);
    await cobrarpresentacaoCommand.execute(c);
    expect(String(c.reply.mock.calls[0][0])).toContain('Uso');
    expect(c.client.sendMessage).not.toHaveBeenCalled();
  });

  it('se ja apresentou: nao reenvia e avisa', async () => {
    dbGet.mockResolvedValue({ presentation_id: 'x', nome: 'Alberto', status: 'published' });
    const c = ctx();
    await cobrarpresentacaoCommand.execute(c);
    expect(String(c.reply.mock.calls[0][0])).toContain('já tem apresentação salva');
    expect(c.client.sendMessage).not.toHaveBeenCalled();
  });

  it('se nao apresentou: reenvia aviso com mention real', async () => {
    const c = ctx();
    await cobrarpresentacaoCommand.execute(c);
    expect(c.client.sendMessage).toHaveBeenCalledTimes(1);
    const [chat, text, opts] = c.client.sendMessage.mock.calls[0];
    expect(chat).toBe(c.chatId);
    expect(text).toContain('aviso de apresentação');
    expect(opts.mentions[0]).toContain('55999999999999');
    expect(String(c.reply.mock.calls[0][0])).toContain('cobrada');
  });
});
