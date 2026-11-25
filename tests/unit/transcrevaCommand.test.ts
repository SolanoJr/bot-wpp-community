import { describe, expect, it, vi, beforeEach } from 'vitest';
import { loadCommands } from '../../src/bot/commands/index';
import { getAudio } from '../../src/services/audioCacheService';
import { transcribeAudioFile } from '../../src/services/transcriptionService';

vi.mock('../../src/services/audioCacheService', () => ({
  getAudio: vi.fn(),
  saveAudio: vi.fn(),
  audioPath: vi.fn(),
  initAudioCache: vi.fn(),
}));
vi.mock('../../src/services/transcriptionService', () => ({
  transcribeAudioFile: vi.fn(),
}));

const GROUP = 'wpp:120363419241913965@g.us';
const MSG_ID = '3EB0DD22226F90282D9B7A';

function makeCtx(msg: any = {}) {
  const reply = vi.fn().mockResolvedValue(undefined);
  return {
    msg: { mentions: [], raw: {}, replyToMessageId: MSG_ID, ...msg },
    client: {},
    args: [],
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
  };
}

async function run(msg: any = {}) {
  const commands = loadCommands();
  const ctx = makeCtx(msg);
  await commands.get('transcreva')?.execute(ctx as any);
  return ctx;
}

describe('$transcreva — áudio marcado', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sem mensagem marcada: explica como usar', async () => {
    const ctx = await run({ replyToMessageId: undefined, raw: {} });
    expect(getAudio).not.toHaveBeenCalled();
    expect(ctx.reply.mock.calls[0][0]).toContain('Marque');
  });

  it('resolve o id do quoted.stanzaId quando nao ha replyToMessageId', async () => {
    vi.mocked(getAudio).mockReturnValue('/tmp/audio.ogg' as any);
    vi.mocked(transcribeAudioFile).mockResolvedValue('olá mundo');
    const ctx = await run({
      replyToMessageId: undefined,
      raw: { quoted: { stanzaId: MSG_ID } },
    });
    expect(getAudio).toHaveBeenCalledWith(MSG_ID);
    expect(ctx.reply.mock.calls[0][0]).toContain('olá mundo');
  });

  it('resolve o stanzaId cru e remove o prefixo do replyToMessageId', async () => {
    vi.mocked(getAudio).mockReturnValue('/tmp/audio.ogg' as any);
    vi.mocked(transcribeAudioFile).mockResolvedValue('texto do áudio marcado');
    const ctx = await run({
      replyToMessageId: `whatsapp:${MSG_ID}`,
      raw: {
        message: {
          extendedTextMessage: { contextInfo: { stanzaId: MSG_ID } },
        },
      },
    });
    expect(getAudio).toHaveBeenCalledWith(MSG_ID);
    expect(ctx.reply.mock.calls[0][0]).toContain('texto do áudio marcado');
  });

  it('cache ausente: avisa para reenviar', async () => {
    vi.mocked(getAudio).mockReturnValue(null as any);
    const ctx = await run();
    expect(transcribeAudioFile).not.toHaveBeenCalled();
    expect(ctx.reply.mock.calls[0][0]).toContain('Não achei');
  });

  it('transcreve e responde com o texto', async () => {
    vi.mocked(getAudio).mockReturnValue('/tmp/audio.ogg' as any);
    vi.mocked(transcribeAudioFile).mockResolvedValue('não coube no meu orçamento');
    const ctx = await run();
    expect(transcribeAudioFile).toHaveBeenCalledWith('/tmp/audio.ogg');
    expect(ctx.reply.mock.calls[0][0]).toContain('Transcrição');
    expect(ctx.reply.mock.calls[0][0]).toContain('não coube no meu orçamento');
  });

  it('erro do motor: responde falha sem quebrar', async () => {
    vi.mocked(getAudio).mockReturnValue('/tmp/audio.ogg' as any);
    vi.mocked(transcribeAudioFile).mockRejectedValue(new Error('modelo indisponível'));
    const ctx = await run();
    expect(ctx.reply.mock.calls[0][0]).toContain('Falha ao transcrever');
  });
});
