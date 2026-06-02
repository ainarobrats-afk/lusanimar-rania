---
name: RANIA V20 Stabilization
description: V20 architecture decisions, what was added, and key invariants to maintain going forward.
---

## What was implemented in V20

**Backend (artifacts/api-server/src/routes/rania.ts):**
1. `ActiveSearch` interface expanded — added `flights?: any[]` and `requestId?: string` to the SSOT
2. `reqId` extracted from `x-request-id` header (or generated) at chat handler entry: stored in `activeSearch.requestId`
3. `v20ValidateReplyText(reply, activeSearch)` — post-process AI reply for follow-ups:
   - Strips hallucinated prices outside ±15% of real card range (replaces with lowest real price)
   - Strips hallucinated airline names not in the activeSearch.airlines list
   - Applied ONLY on `isFollowUp && sessionState.activeSearch` (not on fresh searches)
4. `updateSessionState` now stores `flights: flights.slice(0, 6)` and `requestId: reqId` in activeSearch

**Frontend (artifacts/rania-chat/src/pages/Home.tsx):**
1. `getOrCreateSessionId()` — generates UUID once, persists to `localStorage["rania_session_id"]`, survives page refresh
2. `sessionIdRef` (useRef) holds stable session ID for the overlay lifetime
3. `x-session-id` header sent with every `/rania/chat` POST
4. `activeSearch` React state tracks `{from, to, date}` from API responses
5. `v20FilterCards(cards, from, to)` — client-side direction validator (final safety net before render)
   - Filters to only cards with exact `card.from === expectedFrom && card.to === expectedTo`
   - Falls back to all cards if none match (prevents empty state)
   - Applied on both primary and fallback flight fetch paths

## Key invariants (must NOT break)

- `sessionId` must always come from `x-session-id` header first, IP second — never default to session-less
- `activeSearch.flights[]` is the SSOT for prices; the AI system prompt already injects price/airline locks from `activeSearch` for follow-ups
- Direction validation happens in THREE layers (all must stay): backend ROUTE_LOCK → backend P1 card filter → frontend `v20FilterCards`
- `v20ValidateReplyText` only fires on `isFollowUp === true` — do NOT apply on fresh search replies (would corrupt legitimate prices)

## Test results (V20 baseline)

- 30/30 built-in accuracy tests pass (100%)
- OTA status: WORLD_CLASS (100% flight accuracy)
- Anti-hallucination layer: ACTIVE
- Smart date resolver: ACTIVE
- Tokyo→Seoul: NRT→ICN correct, 0 DIL leaks
- No greeting mid-conversation: confirmed
- Context isolation (no route bleeding): confirmed

**Why:**
All of these prevent the "AI hallucination" problem where RANIA would quote prices/airlines/routes that contradicted the flight cards shown to the user. The SSOT pattern ensures the AI text reply is always grounded in real search data.
