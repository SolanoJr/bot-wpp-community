## [2026-11-25 — welcome] Regra de gore no Figurinhas

- Adicionada (ADITIVO, nada apagado) ao welcome do Figurinhas: `• 🩸 Proibido qualquer conteúdo com gore (sangue, violência extrema) — sujeito a ban.`
- Validação: todos os trechos do texto anterior continuam integralmente presentes (521 → 606 chars). Banco `data/` é ignorado pelo git; mudança persistida no SQLite.


## [2026-11-25 — docs] Organização sem redundância

- Criado `docs/INDEX.md` com fonte canônica por assunto.
- `TECHNICAL.md` enxugado: seções 24/25/26 (estado/decisões/bugs) substituídas por ponteiros; 42,1 KB → 34,2 KB.
- 9 relatórios históricos movidos para `docs/ARCHIVE/` (auditorias antigas, diagnóstico de inconsistências, bug tracker, telemetria legada).
- 16 arquivos ativos; 0 duplicação de assunto.


## [2026-11-25 — leva final] Figurinhas, histórico nativo, download e rate limit

- **Textos oficiais** aplicados no Geek (welcome + apresentação), Figurinhas e Polemic. `#####` são comentários internos e nunca aparecem; menção padrão imutável preservada.
- **Figurinhas:** `$figurinha` / `$criar` (marque imagem/vídeo/figurinha → WebP 512) e `$figurinhasom` (marque vídeo → WebP + Opus, campo 26 injetado no `StickerMessage`). Sem marcação, o comando explica o uso.
- **Histórico nativo:** reprodução do botão "Enviar histórico" via `messageHistoryNotice` + `relayMessage`. Auto-envio silencioso no join, só grupos reais (`WPP_HISTORY_AUTO=1`).
- **Download:** `$download` / `$dl` via `yt-dlp` (múltiplas plataformas), aceita link no comando **ou** mensagem marcada com link. Limites 50 MB / 5 min / 720p.
- **Rate limit do feedback:** máx 10 PV/hora, 40/dia, 20 por grupo; excedente fica `pending`; circuit breaker de 24h ao detectar 401/restrição. Intervalo do worker passou de 6h para 1h.
- **Nomes dos grupos:** `community_groups.group_name` preenchido via `feedback_events`; `$syncnames` sincroniza via `groupMetadata`.
- **Incidente:** conta restrita 24h por volume de DMs (93 eventos de saída, 51 DMs no dia). Bot parado até liberação.
- **Verificação:** 1006 testes passed / 85 arquivos; build PASS. Detalhes em `docs/STATUS_2026-11-25.md`.


## [2026-11-25 — leva 2] Boas-vindas do Figurinhas

- Texto extra adicionado ao `$boasvindas` do Geek/Figurinhas: silenciar/arquivar, pedir figurinhas sem medo, proibição de teor sexual e de "50 linhas sem figurinha", e aviso de que o bot ainda não cria figurinhas automáticas (em breve).
- Composição ADITIVA preservada: validado via `composeWelcome` que a mensagem final **começa** com `Boas-vindas @novato 👋` (menção imutável) e mantém o link das regras. Texto final: 675 chars.


## [2026-11-25] Anti-Story + spike 001 (figurinha com áudio)

- **Anti-Story ( nova automação por grupo )**: `$antistory on|off` pune quem dispara "este grupo foi mencionado" em story — apaga SOMENTE a mensagem do aviso, bane e kicka, 1 ocorrência já dispara. Visível no `$automod status` e no `$menu`. Ativada no Geek/Figurinhas.
- **Spike 001 — backport do campo `audioMessage` (26) no `StickerMessage`**: `PARTIAL`. Serialização validada no rc14 via monkey-patch do `encode` (49 → 83 bytes, tag `0xD2 0x01`, áudio decodificado com mimetype/tamanho/segundos). Falta teste real no Grupo Teste para saber se o WhatsApp aceita. Nada disso entrou no bot de produção.
- **`#ligaoar`**: GIF trocado pelo vídeo enviado pelo dono (ar condicionado split, 62 KB/4s).


## [2026-11-24 — leva 3] Comandos `#` (fun/midia) + `$cobrarpresentacao`

- **Prefixo `#` em registry separado**: `PlatformManager` agora detecta `$` (uteis) e `#` (fun/midia) com `funCommandRegistry` proprio — os comandos de zoeira nao misturam com os uteis. `PlatformMessage.commandPrefix` registra qual foi usado.
- **`#ligaoar`**: envia GIF de ar condicionado funcionando (Wikimedia Commons, 551 KB) com `gifPlayback: true`; fallback para imagem se o Baileys rejeitar o video.
- **`#ligaovent`**: envia som de ventilador gerado localmente (pink noise + LFO de helice, 4s/126 KB) como mensagem de voz. O Baileys v7 RC14 **nao tem campo de figurinha de audio no proto** — o mais proximo e `audioMessage` com `ptt`.
- **`$cobrarpresentacao @membro`** (ou `<numero>`): admin reenvia o aviso de apresentacao com mencao real para quem entrou e nao se apresentou. Se o membro ja tem apresentacao salva, nao reenvia e avisa. A resposta substitui a anterior (`ON CONFLICT ... DO UPDATE`) e edita a mensagem no Telegram em vez de duplicar.
- **Menu**: secao `#` e `$cobrarpresentacao` adicionadas.
- **Verificacao**: 995 testes passed / 83 arquivos; build PASS.


## [2026-11-24 — leva 2] Sarcasmo controlado + aviso de apresentação + `$setapresentacao`

- **Sarcasmo**: `handleKeywords` agora só responde quando a mensagem contém "bot" **E** o grupo tem `group_mod.sarcasmo=1` (gate via `getDb`). Antes, religar o handler fazia o sarcasmo disparar em qualquer grupo. `sarcasmo` desligado no Grupo Teste e no Geek.
- **Aviso padrão de apresentação** (`DEFAULT_PRESENTATION_MESSAGE`): agora marca o novato (`@novato`), manda **responder a mensagem**, inclui o link `https://t.me/Fortaleza_085/2` e o alerta de que a apresentação é **opcional**, mas gera assunto, deixa todo mundo mais à vontade e permite participar livremente dos encontros presenciais e online.
- **`$setapresentacao`** (novo, espelha `$setwelcome`): `on` implícito via texto extra aditivo, `--full <texto>` template cru, `reset`/`default` restaura o padrão, sem args mostra o atual. 5 testes novos. Adicionado ao `$menu`.
- **Configuração de grupos**: `presentation_enabled=1` no Grupo Teste e no Geek Fortaleza 085; textos extras de boas-vindas e apresentação do Geek gravados em `group_mod` (`welcome_message` 257 chars, `presentation_message` 246 chars).
- **Decisão de produto**: opção **A** confirmada pelo dono — destino das apresentações permanece como está (Grupo Teste → PV do dono; grupos da Comunidade 085 → tópico Fortaleza/2).



## [2026-11-24] Manutenção 3 ambientes + `$lista` write path + `$transcreva` (STT local)

- **Auditoria Hermes/bot-wpp/PC** (read-only): fallback chain 10 → 8 entradas. Removidos `qwen/qwen4-max:free` (404 "free period ended"), `cohere/north-mini-code:free` (404 "no provider serves this model") e `google/gemma-4-31b-it` (timeout em 2 tentativas). Todos os 13 modelos/provedores foram sondados com chamada real antes de qualquer exclusão. Aliases legados (`gem`, `north`, `qwen`, `gemma`) removidos; favoritos da UI sincronizados (revision 36); compressão → `solar-mini4:free`.
- **Infra do host Linux**: 27 core dumps (1,2 GB) removidos; `npm update` (25 add / 24 remove / 87 alterados) com build e testes verdes; logrotate dedicado para `~/bot-wpp/logs/*.log` via cron de usuário (03:30, 14 rotações, `copytruncate`); sudo do dono aplicou libssh-4/tzdata/Chrome.
- **`$lista` write path** (`782d87ea`): `add`/`remove`/`del`/`show` persistidos via `saveList`/`getList`/`deleteList`; `list_id` namespaced por grupo (`<groupId>::<slug>`) evitando colisão de PK global. 7 testes novos; `docs/BACKLOG.md` marcado como RESOLVIDO (`be4da2d0`).
- **Correção de teste legado** (`371f97e6`): `$ban` esperava `wpp:` no `banParticipant`, mas `getMentionedIds()` normaliza o ID — expectativa alinhada.
- **`$transcreva`** (`13d6ac27`, `ea260838`): responda a um áudio e use `$transcreva`. Cache local em `data/audio_cache/<messageId>.ogg` (TTL 2h, máx 100 arquivos, limpeza no boot) + faster-whisper `small` local (pt-BR, CPU int8, sem API externa). 6 testes. Corrigida a extração do ID: priorizar `raw.message.extendedTextMessage.contextInfo.stanzaId` e remover o prefixo `whatsapp:` do `replyToMessageId`.
- **Keywords religadas** (`13d6ac27`): `handleKeywords` voltou a ser chamado no `PlatformManager` (estava órfão). Saudação em DM ("oi"/"olá"/"bom dia") e sarcasmo com "bot" em grupos.
- **Menu**: `$transcreva` adicionado em 🔧 UTILITÁRIOS.
- **Verificação final**: `npm run build` PASS; suíte **980 passed / 3 skipped (80 arquivos)**; PM2 online, WhatsApp conectado; **E2E via `/lab/inject-message` com `quotedStanzaId`** → transcrição entregue no Grupo Teste em 26s.

## [2026-10-25 · noite] HANDOFF + PENDENCIAS-USUARIO + Dependabot r2 + $promover E2E (INC-022)

- `HANDOFF.md` (0b37419, 295 linhas): bíblia de continuidade — 10 seções (contexto, estado, features com status, INC-001→022, pendências, perguntas, regras, comandos, arquivos-chave, checklist F0). Atualizado a cada mudança de estado.
- `PENDENCIAS-USUARIO.md` (novo): tudo que SÓ o dono faz — testes visuais, manuais no Grupo Teste, decisões de produto (Fortaleza A/B), infra, carga. Consultar quando o projeto estiver "liso liso".
- Dependabot round 2 (4d496ab): `npm audit fix` → **0 vulns em produção** na VPS (body-parser high DoS zerado; restam 3 dev-only breaking — vite/tinypool, cosmético). LIÇÃO: `npm ci --omit=dev` remove o typescript e MATA o build da VPS — build exige devDeps; corrigido com `npm ci` completo.
- `/lab/promote-member` (7143873) + **INC-022**: prova E2E do `$promover` no Grupo Teste — candidato conta-de-teste (PN 639474500179) promovido 18:50:33 via `promoteParticipant` real e confirmado admin no `/lab/group-info`. Proteções idênticas ao remove-member (MASTER/bot/já-admin/bot-não-admin/sem-adapter). Reversão manual pelo WhatsApp (sem demote — decisão). 2 testes de rota; suite 945/0/3.
- Auditoria de comandos × adapters (2B): 65 comandos, 8 métodos da interface em uso — 7 implementados nos 3 adapters, `promoteParticipant` WhatsApp-only por design, **0 métodos fantasmas** (o $promover era o único).
- Consistência de docs (2C): INC-016 ganhou bloco próprio no BUGS.md (era pendência do INC-005 implementada sem registro); PERMISSIONS.md verificado correto (2 papéis + bot protegido, ADMIN de .env removido).
- Cleanup VPS: `.env.bak` ×2 + `nl.js` (script de inject avulso) movidos para /tmp (recuperáveis) — working tree 100% limpa.
- Estado final: GitHub=VPS=local sincronizados; backup diário rodando (4 snapshots 25/10, rotação 7); pm2 online estável; 3 pernas verdes.

## [2026-10-25] Auditoria 3 ambientes + P1 backup diário + P2 limpeza — auditoria mandato técnico

### Contexto (matriz dos 3 ambientes):
- Windows `main@7951d12d` clean · GitHub `main@7951d12d` · Linux `main@7951d12d` (deploy 24/out 23:59). Ambientes alinhados; `.env` de produção contém o contrato INC-021 (LAB_*/TELEGRAM_PRESENTATION_*).

### Implementado (P1 — Integridade dos dados):
- `backupService` (novo): snapshot diário do SQLite via `VACUUM INTO` (materializa o WAL — lição do incidente 14/out) + gzip + rotação `BACKUP_KEEP` (default 7) em `BACKUP_DIR` (default ./backups). Roda no boot + a cada 24h, best-effort (falha loga, não derruba).
- Plugado no boot do `multiPlatform` ao lado dos demais schedulers.
- `backupDatabase()` existia desde 14/out, mas NENHUM scheduler o chamava — backups eram manuais e voláteis em /tmp.

### Implementado (P2 — anti-overengineering):
- `PlatformTypes`: removidos `mute?/unmute?/promote?/demote?` — abstração fantasma comprovada: 0 adapters implementavam, 0 callers (grep). Caminhos reais: `$mute` Map in-memory, `$promover` via `groupParticipantsUpdate` (exige chatId — assinatura que a interface nunca teve). TODOs rodada-3 resolvidos por remoção.
- `.env.example`: documentados os envs do INC-021 (LAB_GROUP_ID, LAB_PRESENTATION_CHAT_ID, TELEGRAM_PRESENTATION_CHAT_ID/THREAD_ID) e os novos BACKUP_DIR/BACKUP_KEEP.

### Auditoria sem ação necessária (evidência):
- Telemetria de comandos: `command_usage_events` já cobre command/alias/platform/bot/chat/user/outcome/permission/duration/correlation + 3 índices + retenção 180d.
- Segurança SQL: todos os pontos dinâmicos usam bind `?` ou escape (VACUUM INTO escapa aspas); zero secrets em logs.
- `platform ===` no core/services: apenas 4 ocorrências — abstração de adapters é real.
- Comandos: 65 arquivos, todos registrados no index; nenhum órfão evidenciado.

### Testes:
- `tests/unit/backupService.test.ts` (novo, 3 testes): .db.gz válido com dado restaurado, rotação por mtime, falha alta com dir inválido. Suite: ver gates do commit.

## [2026-10-05] Fase 3-4 (Feedback + Sarcasmo) + Health Fix (BUG-017/020) — d153f10

### Implementado (verificado no código real + testes):
- `feedbackService`: registro de saída (`recordExitEvent`), agrupamento (`consolidatePending`), expiração (`listExpired`/`markExpired`), consulta (`listFeedback`/`stats`), mensagem formatada (`formatFeedbackRequest`/`formatTelegramNotification`). SQLite = fonte oficial. Telegram = espelho.
- `feedback_events` tabela + índices (`user`, `group`, `status`). Migration aplicada no Linux (DB atualizado).
- `feedback` flag em `group_mod`. Default OFF para grupos novos.
- Comando `$feedback` (on/off/status/lista/recentes/grupo/estatisticas) implementado e testado (26 testes).
- `sarcasmoService`: `containsBotWord` (palavra, não substring), `referencesWarriorBlack` (determinística: nome, reply, menção, "bot" palavra), `shouldRespond` (proteções: fromMe=false, isGroup=true, anti-loop via cooldown), `canRespond` (cooldown por grupo+usuário + global 5s), `markResponded`.
- Comando `$sarcasmo` (on/off/status) implementado e testado (32 testes).
- `sarcasmo` flag em `group_mod`. Default OFF.
- Integração no `BaileysMessageNormalizer`: detecta "bot" no texto da mensagem; respeita config `sarcasmo`; envia resposta diretamente via `sock?.sendMessage`.
- `BaileysHealth.syncToStore()`: atualiza `healthStore` proativamente no construtor, `setReady`, `setQrPending`. Corrige BUG-017/020 (health endpoint mostrando `awaiting-qr` quando conectado).
- `BaileysAdapter.getHealth()`: removida duplicação `setWppHealth` (agora só retorna, já que `BaileysHealth` sincroniza).

### Corrigido (verificado):
- BUG-017/020: `health` endpoint (`http://127.0.0.1:3001/health`) retorna `{"status":"healthy","wpp":"connected"}` quando WhatsApp está conectado. Antes retornava `awaiting-qr`.

### Testes (verificados no código real):
- `tests/unit/feedbackService.test.ts`: 26 testes (PASS).
- `tests/unit/sarcasmoService.test.ts`: 32 testes (PASS).
- `tests/unit/noGhostCommands.test.ts`: anti-regressão para comandos fantasmas (PASS).
- Total atual: 576 testes, 38 arquivos (PASS em Windows).

### Build + Deploy (verificados):
- `npm run build`: PASS (Windows e Linux).
- `git push origin main`: `d153f10` no GitHub.
- `git pull` + `npm run build` + `pm2 restart bot-wpp`: PASS no Linux (`online`, WhatsApp/Telegram/Discord conectados, PID 3143633).

### Documentação (atualizada com evidência real):
- `docs/KNOWN_ISSUES.md`: adicionada tabela de status pós-auditoria (PASS/⏳ PENDENTE) com referências ao código.
- Não registrado como resolvido: Welcome real (não testado com entrada real), Apresentações Telegram (não publicado real), Foto (não integrada), Rate limit (em memória), Pipeline AutoMod E2E (não validado com mensagem real de bot).

### Pendente (explicitamente não escondido):
- Welcome real com entrada de membro (requer acesso ao grupo).
- Apresentação real publicada no Telegram (requer membro + apresentação).
- Foto de apresentação (não implementada).
- Rate limit por grupo (cooldown global + per-user existe; rate limit ainda memória).
- Pipeline AutoMod E2E com delete real (requer grupo autorizado + mensagem real de bot).

## [INVENTÁRIO 2026-10-05] Listas ($lista1/$lista2/$lista3)
- Nenhum arquivo físico, nenhuma tabela SQLite, nenhum código, nenhum arquivo removido no git.
- Arquitetura do bot (group_mod, presentationService, feedback_events, databaseService, captureStore) SUPORTA listas.
- Decisão: NÃO implementar nesta fase (não é expansão); NÃO declarar morto — apenas 'não existente, arquitetura suportada'.
- Nenhuma alteração no código atual necessária para futura ativação.
