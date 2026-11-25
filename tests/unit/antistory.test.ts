import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/services/loggerService', () => ({
  default: { info: () => {}, warn: () => {}, error: () => {} },
  logInfo: () => {}, logWarning: () => {}, logError: () => {},
}));

const { isStoryMentionMessage } = await import('../../src/services/autoModEngine');
const { antistoryModCommand } = await import('../../src/bot/commands/modToggle');

function msg(texto: string, extra: any = {}) {
  return {
    key: { id: 'x', remoteJid: '120363419241913965@g.us', participant: '558@lid' },
    message: { extendedTextMessage: { text: texto } },
    ...extra,
  } as any;
}

describe('Anti-Story — detector', () => {
  it('detecta "Este grupo foi mencionado"', () => {
    expect(isStoryMentionMessage(msg('@Este grupo foi mencionado.'))).toBe(true);
  });

  it('detecta variantes e inglês', () => {
    expect(isStoryMentionMessage(msg('Esse grupo foi mencionado'))).toBe(true);
    expect(isStoryMentionMessage(msg('This group was mentioned'))).toBe(true);
  });

  it('detecta em caption de imagem', () => {
    expect(isStoryMentionMessage({
      key: { id: 'y' },
      message: { imageMessage: { caption: 'Este grupo foi mencionado' } },
    } as any)).toBe(true);
  });

  it('nao dispara para mensagem normal', () => {
    expect(isStoryMentionMessage(msg('Oi galera, tudo bem?'))).toBe(false);
    expect(isStoryMentionMessage(msg('Segue o link do server'))).toBe(false);
  });
});

describe('$antistory — toggle por grupo', () => {
  function ctx(args: string[]) {
    return {
      args,
      isMaster: true,
      isAdmin: true,
      chatId: '120363419241913965@g.us',
      reply: vi.fn(async (_t: string) => {}),
    } as any;
  }

  it('comando existe e tem descricao', () => {
    expect(antistoryModCommand.name).toBe('antistory');
    expect(antistoryModCommand.description).toContain('Anti-Story');
  });

  it('valida uso', async () => {
    const c = ctx([]);
    await antistoryModCommand.execute(c);
    expect(String(c.reply.mock.calls[0][0])).toContain('Uso');
  });
});
