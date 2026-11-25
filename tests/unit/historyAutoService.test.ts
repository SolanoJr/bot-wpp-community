import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/services/historyNoticeService', () => ({
  sendHistoryNotice: vi.fn(async () => 'ok'),
}));

import { sendAutoHistory } from '../../src/services/historyAutoService';
import { sendHistoryNotice } from '../../src/services/historyNoticeService';

describe('historyAutoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WPP_HISTORY_AUTO = '1';
  });

  it('nunca envia no Grupo Teste', async () => {
    await sendAutoHistory({}, '120363410094452673@g.us', '123@lid');
    expect(sendHistoryNotice).not.toHaveBeenCalled();
  });

  it('não envia com a flag desligada', async () => {
    process.env.WPP_HISTORY_AUTO = '0';
    await sendAutoHistory({}, '120363419033272638@g.us', '123@lid');
    expect(sendHistoryNotice).not.toHaveBeenCalled();
  });

  it('envia silenciosamente em grupo real', async () => {
    await sendAutoHistory({}, '120363419033272638@g.us', '123@lid');
    expect(sendHistoryNotice).toHaveBeenCalledTimes(1);
    const args = (sendHistoryNotice as any).mock.calls[0];
    expect(args[1]).toBe('120363419033272638@g.us');
    expect(args[2].receivers).toEqual(['123@lid']);
    expect(args[2].messageCount).toBeGreaterThan(0);
  });
});
