# MONETIZAÇÃO — modelo híbrido (demo + completa)

> Plano aprovado em 25/11. Objetivo: permitir alugar/vender sem entregar
> o código premium a quem clonar o repositório público.

## 1. Divisão de funcionalidades

### Básico (demo — funciona em qualquer clone)
- Comandos utilitários: `$ping`, `$alive`, `$help`, `$menu`, `$ondeestou`
- Bem-vindo e apresentação configuráveis (`$bemvindo`, `$setwelcome`, `$apresentacao`)
- AutoMod simples: `$antispam`, `$antilink`, `$antibot`, `$anticassino`, `$antiestrangeiro`
- Administração: `$ban`, `$kick`, `$mute`, `$promover`, `$grupos`, `$banidos`
- Zoeira/mídia: `#ligaoar`, `#ligaovent`
- Laboratório (`/lab/...`) e logs locais

### Premium (versão completa — exige `WPP_EDITION=full`)
- `$antistory` — punição de menção em story
- Histórico nativo (`messageHistoryNotice`) e `$enviarhistorico` / auto-histórico
- `$figurinha` / `$criar` — mídia marcada → figurinha
- `$figurinhasom` — vídeo marcado → figurinha com som
- `$download` / `$dl` — download de vídeos (yt-dlp)
- `$syncnames` — sincronização de nomes via `groupMetadata`

## 2. Como o gate funciona

`src/services/licenseService.ts` expõe `isFullEdition()`:

```ts
process.env.WPP_EDITION === 'full'
```

- **Sem** `WPP_EDITION=full`: é demo. Comando premium responde:

> 🔒 **Versão demo.** Este recurso é exclusivo da versão completa.
> Para liberar, entre em contato com o desenvolvedor.

- **Com** `WPP_EDITION=full` (somente no seu ambiente): tudo funciona normalmente.

O gate fica no `PlatformManager`, antes do `execute()` — um único ponto,
não espalhado por cada comando.

## 3. Chaves por cliente (Ed25519)

O "acesso especial" não é só a sua variável — dá para emitir licenças
individuais **sem revelar sua chave mestra**:

- **Chave privada** (só sua): `~/bot-wpp-keys/license-private.pem`, chmod 600,
  fora do repositório. Nunca vai para o git nem para o clone de ninguém.
- **Chave pública**: embutida em `src/services/licenseService.ts`.
- Gerar licença:
  ```bash
  node scripts/gen-license.js "Nome do titular" 30   # 30 dias; 0 = eterno
  ```
  Saída: `payload.assinatura` (base64url). Entregue essa string ao titular.
- Ele usa: `WPP_LICENSE_KEY=<string>` no `.env` dele.
- Validação: assinatura Ed25519 + prazo de expiração + feature `full`.

Contato exibido na demo (`WPP_CONTACT`):
`(88) 99831-4322 / solanoccjr@hotmail.com`.

> Para dividir com um amigo: rode o comando acima com o nome dele e mande a
> chave gerada. Ele não precisa da sua chave privada, nem do seu `WPP_EDITION`.

## 4. Contadores de uso (decisão de what fica na demo)

Existem duas fontes:
- `command_logs`: comando, usuário, grupo e timestamp (195 registros,
  18 usuários, 8 grupos).
- `command_usage_events`: plataforma, chat, usuário, `duration_ms`, outcome,
  `permission_result`, `correlation_id` (183 eventos).

Exemplo medido: `enviarhistorico` média **7,0 s** (pico 9,4 s),
`figurinhasom` média **2,2 s**. Comandos caros assim ficam **premium** —
não compensa entregar de graça na demo.

## 5. Modelo híbrido no GitHub (próximos passos)

1. Criar repo público `bot-wpp-community` com o core acima.
2. Tornar `Bot-WPP-WB` privado. **Atenção:** o fork existente (1 fork) continua
   público e independente — privatizar o original não apaga o fork.
3. Mover os módulos premium para pacote privado `@solanojr/bot-wpp-premium`
   (npm scoped) ou repo privado via submodule.
4. Seu clone puxa o privado usando `NPM_TOKEN` / GitHub PAT que **só você tem**.
   Esse token nunca vai para o repo público — fica no `.env` local e GitHub Secrets.
5. Evitar "proteção" por `if (chave)` no código público: é editável em uma linha.

## 6. Termos / limites por plano (a definir)

| Plano | Grupos | Mensagens/dia | Suporte |
|---|---|---|---|
| Demo | 1 | limitado | comunidade |
| Básico | 3 | a definir | issue |
| Pro | ilimitado | a definir | direto |

> Valores ainda a acertar com o dono antes de publicar.

## 7. Estado atual

- [x] Gate de demo implementado no `PlatformManager` + mensagem amigável
- [x] Licenças Ed25519 por cliente + `scripts/gen-license.js`
- [x] `WPP_EDITION=full` no `.env` de produção (dono não perde nada)
- [ ] Repo `community` separado
- [ ] Repo atual tornado privado
- [ ] Pacote premium privado
- [ ] Servidor de licença / heartbeat
- [ ] Termos e preços fechados
