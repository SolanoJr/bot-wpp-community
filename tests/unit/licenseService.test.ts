import { describe, it, expect, afterEach } from 'vitest';
import { isFullEdition, isPremiumCommand, demoMessage, verifyLicense } from '../../src/services/licenseService';

const LICENSE_TESTE =
  'eyJoIjoiVEVTVEUgdW5pdGFyaW8iLCJlIjoxNzk4MjMwNjY2NzM5LCJmIjpbImZ1bGwiXX0.3w_bpULTVpnTX_pxN-P_sVTDv9EDEg6lCzt2-dqC2IbZMjP5OPd3DmHy6NAIDv9alhsvXJF_MJoXDzqy_R8BBQ';

describe('licenseService — gate demo/premium', () => {
  const originalEdition = process.env.WPP_EDITION;
  const originalKey = process.env.WPP_LICENSE_KEY;
  const originalContact = process.env.WPP_CONTACT;
  afterEach(() => {
    for (const [k, v] of [['WPP_EDITION', originalEdition], ['WPP_LICENSE_KEY', originalKey], ['WPP_CONTACT', originalContact]] as any) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it('demo por padrão', () => {
    delete process.env.WPP_EDITION;
    delete process.env.WPP_LICENSE_KEY;
    expect(isFullEdition()).toBe(false);
  });

  it('full apenas com WPP_EDITION=full', () => {
    process.env.WPP_EDITION = 'full';
    expect(isFullEdition()).toBe(true);
    process.env.WPP_EDITION = 'FULL ';
    expect(isFullEdition()).toBe(true);
    process.env.WPP_EDITION = 'demo';
    expect(isFullEdition()).toBe(false);
  });

  it('rejeita licença invalida', () => {
    expect(verifyLicense('')).toBeNull();
    expect(verifyLicense('abc.def')).toBeNull();
    expect(verifyLicense(LICENSE_TESTE + 'x')).toBeNull();
  });

  it('aceita licença assinada com a chave mestra', () => {
    const payload = verifyLicense(LICENSE_TESTE);
    expect(payload).not.toBeNull();
    expect(payload!.h).toBe('TESTE unitario');
    process.env.WPP_LICENSE_KEY = LICENSE_TESTE;
    expect(isFullEdition()).toBe(true);
  });

  it('comandos premium reconhecidos', () => {
    for (const c of ['antistory', 'download', 'dl', 'figurinha', 'criar', 'figurinhasom', 'syncnames', 'enviarhistorico']) {
      expect(isPremiumCommand(c)).toBe(true);
    }
    expect(isPremiumCommand('ping')).toBe(false);
  });

  it('mensagem de demo cita contato configurado', () => {
    process.env.WPP_CONTACT = '88998314322 / solanoccjr@hotmail.com';
    expect(demoMessage()).toContain('Versão demo');
    expect(demoMessage()).toContain('solanoccjr@hotmail.com');
  });
});
