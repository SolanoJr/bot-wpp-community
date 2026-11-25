import { describe, it, expect, vi, beforeEach } from 'vitest';

const MASTER = '558898314322@c.us';
const GRUPO = '120363410094452673@g.us';

const store = new Map<string, string | null>();

vi.mock('../../src/services/welcomeService', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getPresentationMessage: vi.fn(async (g: string) => store.get(g) ?? null),
    setPresentationMessage: vi.fn(async (g: string, t: string | null) => { store.set(g, t); }),
  };
});

vi.mock('../../src/services/permissions', async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, isMaster: vi.fn((id: string) => id === MASTER) };
});

vi.mock('../../src/services/loggerService', () => ({
  default: { info: () => {}, warn: () => {}, error: () => {} },
  logInfo: () => {}, logWarning: () => {}, logError: () => {},
}));

const { setapresentacaoCommand } = await import('../../src/bot/commands/setapresentacao');
const { DEFAULT_PRESENTATION_MESSAGE } = await import('../../src/services/welcomeService');

function makeCtx(args: string[], userId = MASTER) {
  return {
    userId,
    args,
    getChat: async () => ({ isGroup: true, id: GRUPO, participants: [] }),
    reply: vi.fn(async (_t: string) => {}),
  } as any;
}

beforeEach(() => { store.clear(); vi.clearAllMocks(); });

describe('$setapresentacao — aditivo', () => {
  it('texto extra entra ABAIXO do padrão', async () => {
    const ctx = makeCtx(['📸', 'Uma', 'foto']);
    await setapresentacaoCommand.execute(ctx);
    expect(store.get(GRUPO)).toBe(`${DEFAULT_PRESENTATION_MESSAGE}\n\n📸 Uma foto`);
    expect(String(ctx.reply.mock.calls[0][0])).toContain('atualizado');
  });

  it('reset limpa para NULL', async () => {
    store.set(GRUPO, 'custom antigo');
    const ctx = makeCtx(['reset']);
    await setapresentacaoCommand.execute(ctx);
    expect(store.get(GRUPO)).toBeNull();
    expect(String(ctx.reply.mock.calls[0][0])).toContain('resetado');
  });

  it('--full salva o template cru, sem prepender', async () => {
    const ctx = makeCtx(['--full', 'Texto', 'completo']);
    await setapresentacaoCommand.execute(ctx);
    expect(store.get(GRUPO)).toBe('Texto completo');
  });

  it('sem args mostra o aviso atual', async () => {
    const ctx = makeCtx([]);
    await setapresentacaoCommand.execute(ctx);
    expect(String(ctx.reply.mock.calls[0][0])).toContain('Aviso de apresentação atual');
    expect(String(ctx.reply.mock.calls[0][0])).toContain('https://t.me/Fortaleza_085/2');
  });

  it('nao-admin nao pode alterar', async () => {
    const ctx = makeCtx(['texto'], '558000000000@c.us');
    await setapresentacaoCommand.execute(ctx);
    expect(store.has(GRUPO)).toBe(false);
    expect(String(ctx.reply.mock.calls[0][0])).toContain('Apenas administradores');
  });
});
