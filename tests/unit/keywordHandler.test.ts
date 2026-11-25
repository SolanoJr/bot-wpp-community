import { describe, expect, it, vi, beforeEach } from 'vitest';

const dbGet = vi.fn(async (_sql: string, _params: any[]) => ({ sarcasmo: 1 }));

vi.mock('../../src/services/databaseService', () => ({
  getDb: vi.fn(async () => ({ get: dbGet })),
}));

import { handleKeywords } from '../../src/services/keywordHandler';

const CTX_GRUPO = {
  chatId: 'wpp:120363419241913965@g.us',
  userId: '558898314322@c.us',
  platform: 'whatsapp' as const,
  reply: vi.fn(async (_t: string) => {}),
};

beforeEach(() => { vi.clearAllMocks(); dbGet.mockResolvedValue({ sarcasmo: 1 }); });

function mkMsg(body: string) {
  return {
    body, delete: vi.fn(), reply: vi.fn(),
    author: '558581344211@c.us', from: '558581344211@c.us',
  };
}

describe('keywordHandler — regra do dono', () => {
  it('detecta e remove mensagens de trollagem', async () => {
    const msg = {
      body: 'removeu você do grupo', delete: vi.fn(), reply: vi.fn(),
      author: '558581344211@c.us', from: '558581344211@c.us',
    };
    const result = await handleKeywords(msg, {} as any);
    expect(result).toBe(true);
    expect(msg.delete).toHaveBeenCalledWith(true);
  });

  it('"bot" solto dispara', async () => {
    const ctx = { ...CTX_GRUPO, reply: vi.fn(async (_t: string) => {}) };
    expect(await handleKeywords(mkMsg('bot'), ctx as any)).toBe(true);
    expect(ctx.reply).toHaveBeenCalled();
  });

  it('"bot no ar" e "o bot passa batom" disparam', async () => {
    for (const frase of ['bot no ar', 'o bot passa batom']) {
      const ctx = { ...CTX_GRUPO, reply: vi.fn(async (_t: string) => {}) };
      expect(await handleKeywords(mkMsg(frase), ctx as any)).toBe(true);
    }
  });

  it('NAO dispara quando bot é parte de outra palavra', async () => {
    for (const frase of ['botar', 'abotoar', 'boteco', 'a gente botandoele pra carrega']) {
      const ctx = { ...CTX_GRUPO, reply: vi.fn(async (_t: string) => {}) };
      expect(await handleKeywords(mkMsg(frase), ctx as any)).toBe(false);
    }
  });

  it('NÃO responde se flag sarcasmo=0 (evita disparo aleatório)', async () => {
    dbGet.mockResolvedValue({ sarcasmo: 0 });
    const msg = {
      body: 'bot socorro', delete: vi.fn(), reply: vi.fn(),
      author: '558581344211@c.us', from: '558581344211@c.us',
    };
    const result = await handleKeywords(msg, CTX_GRUPO as any);
    expect(result).toBe(false);
    expect(CTX_GRUPO.reply).not.toHaveBeenCalled();
  });

  it('NÃO responde em DM (só grupos)', async () => {
    const msg = {
      body: 'bot me ajuda', delete: vi.fn(), reply: vi.fn(),
      author: '558581344211@c.us', from: '558581344211@c.us',
    };
    const ctx = { ...CTX_GRUPO, chatId: 'wpp:558898314322@c.us', reply: vi.fn(async () => {}) };
    const result = await handleKeywords(msg, ctx as any);
    expect(result).toBe(false);
  });

  it('não processa comandos como menções de bot', async () => {
    const msg = {
      body: '$bot comando', delete: vi.fn(), reply: vi.fn(),
      author: '558581344211@c.us', from: '558581344211@c.us',
    };
    const result = await handleKeywords(msg, {} as any);
    expect(result).toBe(false);
  });

  it('retorna false para mensagens normais', async () => {
    const msg = {
      body: 'mensagem normal', delete: vi.fn(), reply: vi.fn(),
      author: '558581344211@c.us', from: '558581344211@c.us',
    };
    const result = await handleKeywords(msg, {} as any);
    expect(result).toBe(false);
  });
});
