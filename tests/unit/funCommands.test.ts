import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/services/loggerService', () => ({
  default: { info: () => {}, warn: () => {}, error: () => {} },
  logInfo: () => {}, logWarning: () => {}, logError: () => {},
}));

const { loadFunCommands } = await import('../../src/bot/commands/index');

function ctx() {
  return {
    chatId: 'wpp:120363410094452673@g.us',
    args: [],
    msg: {},
    client: { sendMedia: vi.fn(async () => ({})) },
    reply: vi.fn(async (_t: string) => {}),
  } as any;
}

beforeEach(() => vi.clearAllMocks());

describe('comandos # (fun/midia)', () => {
  it('loadFunCommands traz so os dois de zoeira', () => {
    const map = loadFunCommands();
    expect([...map.keys()].sort()).toEqual(['enviarhistorico', 'ligaoar', 'ligaovent']);
  });

  it('#ligaoar envia GIF com gifPlayback', async () => {
    const cmd = loadFunCommands().get('ligaoar')!;
    const c = ctx();
    await cmd.execute(c);
    expect(c.client.sendMedia).toHaveBeenCalledTimes(1);
    const [chat, media, caption, opts] = c.client.sendMedia.mock.calls[0];
    expect(chat).toBe(c.chatId);
    expect(media.type).toBe('video');
    expect(opts).toMatchObject({ gifPlayback: true });
    expect(String(caption)).toContain('Ar ligado');
  });

  it('#ligaovent envia audio como mensagem de voz', async () => {
    const cmd = loadFunCommands().get('ligaovent')!;
    const c = ctx();
    await cmd.execute(c);
    const [chat, media, _caption, opts] = c.client.sendMedia.mock.calls[0];
    expect(chat).toBe(c.chatId);
    expect(media.type).toBe('audio');
    expect(opts).toMatchObject({ sendAudioAsVoice: true });
  });
});
