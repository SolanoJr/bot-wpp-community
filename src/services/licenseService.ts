import crypto from 'crypto';

/**
 * licenseService — controle de edição (demo vs completa).
 *
 * Duas vias de acesso:
 *  1. WPP_EDITION=full  → atalho do dono (ambiente dele).
 *  2. WPP_LICENSE_KEY   → licença assinada com Ed25519. O dono tem a chave
 *     PRIVADA (fora do repo); o cliente tem só a pública embutida aqui.
 *     Assim dá para dar acesso a um amigo sem entregar a chave mestra.
 */
const LICENSE_PUBLIC_KEY =
  'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUNvd0JRWURLMlZ3QXlFQWY4Y2w0SzlTNFpLVjNYbjZzbWQyVmtHUGh6MXhyVDcrckV3bHZvMXluK3c9Ci0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLQo=';

export const PREMIUM_COMMANDS = new Set([
  'antistory',
  'antistorymod',
  'download',
  'dl',
  'figurinha',
  'criar',
  'figurinhasom',
  'syncnames',
  'enviarhistorico',
]);

export interface LicensePayload {
  h: string;   // titular
  e: number;   // expira em ms (0 = sem expiração)
  f: string[]; // features
}

/** Verifica assinatura Ed25519 e validade da licença. */
export function verifyLicense(key: string): LicensePayload | null {
  try {
    const limpo = String(key || '').trim();
    const partes = limpo.split('.');
    if (partes.length !== 2) return null;
    const [payloadB64, assinaturaB64] = partes;
    const payload: LicensePayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    );
    if (payload.e && Date.now() > Number(payload.e)) return null;
    if (!Array.isArray(payload.f) || !payload.f.includes('full')) return null;
    const pub = crypto.createPublicKey({
      key: Buffer.from(LICENSE_PUBLIC_KEY, 'base64').toString('utf8'),
      format: 'pem',
    });
    const ok = crypto.verify(
      null,
      Buffer.from(payloadB64),
      pub,
      Buffer.from(assinaturaB64, 'base64url')
    );
    return ok ? payload : null;
  } catch {
    return null;
  }
}

export function isFullEdition(): boolean {
  if (String(process.env.WPP_EDITION || '').trim().toLowerCase() === 'full') return true;
  return verifyLicense(process.env.WPP_LICENSE_KEY || '') !== null;
}

export function isPremiumCommand(name: string): boolean {
  return PREMIUM_COMMANDS.has(String(name || '').toLowerCase());
}

export function demoMessage(): string {
  const contato = String(process.env.WPP_CONTACT || '').trim();
  return (
    '🔒 *Versão demo.* Este recurso é exclusivo da versão completa.\n' +
    (contato
      ? `Para liberar, fale com: ${contato}`
      : 'Para liberar, entre em contato com o desenvolvedor.')
  );
}
