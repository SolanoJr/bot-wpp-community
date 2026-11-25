# Arquivo — candidatos de modelo do Hermes (NAO é bot-wpp)

> Removido de `docs/BACKLOG.md` em 25/11: configuração de LLM do **Hermes**,
> sem relação com o Bot-WPP. Mantido só como histórico de auditoria.
> Em 25/11, 4 modelos foram testados de verdade e adicionados aos favoritos
> do Hermes (revision 37).

### Hermes config — candidatos não probados pelo rerank (ABERTO)
- thinkingmachines/inkling-small:free — 403 "only available on agentic
  harnesses": gate por app; o script (axios puro) não passa, mas o Hermes
  real pode passar. Testar via `hermes -z` se um dia interessar.
- Nous (longcat-2.5-preview, solar-mini4) — sem NOUS_PORTAL_API_KEY
  (OAuth, $0 de crédito): script não alcança. longcat segue na chain
  (pre-existente); solar-mini4 fora até ter key ou teste via hermes proxy.
- google/gemma-4-31b-it:free — 429×2 upstream (congestionado) no probe;
  re-probrar antes de reintroduzir na chain.
- NIM z-ai/glm-5.3-flash e google/gemma-4-31b-it — no catálogo, mas
  timeout 2×20s no probe; re-probrar fora de pico antes de considerar.
- aliases pesado/forte → nvidia/moonshotai/kimi-k3 — fora do catálogo NIM
  (morto). **RESOLVIDO 2026-10-17:** repontuados para
  openrouter/nvidia/nemotron-3-ultra-550b-a55b:free (rodada rápida, via
  hermes config set model.aliases).

