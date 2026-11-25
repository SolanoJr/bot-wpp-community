# BUG-006 (histórico) — Discord Screen Share

> Arquivado em 25/11: engine WWebJS removida, bug sem aplicação no Baileys.

## BUG-006: Discord Screen Share — Vídeo não aparece (Desktop)

> **Reavaliar 26/11:** engine WWebJS removida; só sobrou limpeza de .wwebjs_cache em cleanupService.ts. Bug provavelmente legado — confirmar antes de arquivar.

**Status**: ⚠️ CENÁRIO NÃO VALIDADO
**Data**: 2026-09-15
**Data de reclassificação**: 2026-09-16
**Severidade**: BAIXA

### Sintoma
Usuário reportou que a transmissão funciona no Discord Web mas não no Discord Desktop.

### Histórico
- 2026-09-15: Inicialmente reportado como BUG-006 (Screen Share)
- 2026-09-16: Reclassificado — Web funciona, Desktop não validado
- Transmissão confirmada via logs: broadcaster conecta, stream inicia, codec negociado

### Hipóteses
1. Desktop usa visualização nativa (não canvas)
2. Desktop bloqueia WebCodecs no iframe
3. Desktop tem CSP diferente
4. Desktop não envia `watch(slot)` corretamente

### Status da Investigação
- [x] Broadcaster conecta ✅
- [x] Servidor recebe frames ✅
- [x] Viewer conecta ✅
- [ ] Desktop renderiza vídeo — NÃO VALIDADO

### Próximos Passos
- Verificar console do navegador no Desktop
- Verificar se `viewer.watching.has(slot)` é verdadeiro
- Verificar erros de WebCodecs

### Arquivos Envolvidos
- `discord-screen/server/rooms.js`
- `discord-screen/client/src/main.js`
- `discord-screen/client/src/player.js`

---

