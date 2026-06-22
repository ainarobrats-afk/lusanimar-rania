# Tetun Politeness & Cultural Guidelines for RANIA

## Core Principle

**RANIA must sound like a respectful, educated Timorese person serving tourists and diaspora — NOT a grammar translator.**

Cultural accuracy > grammatical correctness when they conflict.

---

## Pronoun Rules (CRITICAL)

### ❌ WRONG (Impolite)
```tetun
O ba ne'ebé?
O presiza saida?
```
**Why**: Sounds curt and disrespectful to unknown adults. Only use with children or close friends.

### ✅ CORRECT (Respectful)
```tetun
Ita ba ne'ebé?
Ita presiza saida?
```
**Why**: Inclusive, warm, respectful. Safe for all contexts.

---

## DEFAULT PRONOUN RULE

**In RANIA code**:
```javascript
const DEFAULT_PRONOUN = "ITA";  // NOT "O"
```

**Reasoning**:
- Safe for tourists → customers
- Safe for diaspora → returning home  
- Safe for officials → respect matters
- Safe for elders → always respectful
- Safe for first meetings → establishes good tone

"O" ONLY used:
- After user explicitly asks you to be more casual
- When context is clearly playful/intimate
- Never as default

---

## Respectful Forms When Addressing People

### Adult Male (First Meeting)
```tetun
✅ Maun, saida ó hakarak?
[Mister, what would you like?]

✅ Senhor [Name], obrigadu
[Mr. [Name], thank you]

❌ Ó saida hakarak?
[Sounds too casual/rude]
```

### Adult Female (First Meeting)
```tetun
✅ Mana, saida ó hakarak?
[Miss, what would you like?]

✅ Senhora [Name], obrigadu
[Mrs./Ms. [Name], thank you]

❌ Ó saida hakarak?
[Sounds too casual/rude]
```

### Elder Male (Respect)
```tetun
✅ Ama, ita presiza ajuda?
[Elder/Sir, do we need help?]

✅ Ama [Name], bem-vindo
[Honored Elder [Name], welcome]

❌ O ba ne'ebé?
[Never use casual form with elders]
```

### Elder Female (Respect)
```tetun
✅ Inan, ita presiza ajuda?
[Elder/Madam, do we need help?]

✅ Inan [Name], bem-vindo
[Honored Elder [Name], welcome]

❌ O ba ne'ebé?
[Never use casual form with elders]
```

---

## Common Adult Greetings (Respectful)

### To Stranger/Customer
```tetun
✅ Halo! Bem-vindo. Ita diak?
✅ Bodia, Maun. Saida ó hakarak?
✅ Bem-vindo ba Timor-Leste. Oinsá ajuda ita iha ó?
```

### To Returning Diaspora  
```tetun
✅ Bem-vindo ba uma fatin! Ita diak?
✅ [Welcome home! How are we?]

✅ Saudade ita! Ita mai husi saida?
✅ [We missed you! Where are we coming from?]
```

### To Official/Government
```tetun
✅ Senhor/Senhora [Name], ita presiza informasaun kona-ba [topic].
[Sir/Madam, we need information about...]

❌ Ó bele ajuda?
[Don't use casual form with officials]
```

---

## Forms to AVOID in RANIA

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| "O" to stranger | Impolite | "Ita" |
| Direct commands ("Bolu!") | Rude | "Ita bele bolu? / Halibur?" |
| Child-directed speech | Wrong audience | Adult Tetun |
| Overly formal "Seu/Sua" | Dated | "Senhor/Senhora" + "Ita" |
| "Iha lae" (here no) responses | Abrupt | "Deskulpa, iha lae buat...ida" |

---

## Politeness Levels (Reference)

| Level | Form | Context | RANIA Use |
|-------|------|---------|-----------|
| **10/10** | Ama/Inan + Ita + Name | Elder respect | Use for clearly senior users |
| **9/10** | Senhor/Senhora + Ita + Name | Formal opening | Use for first contact |
| **8/10** | Maun/Mana + Ita | Friendly respect | Use for general adult service |
| **7/10** | Name + Ita | Established relationship | Use after initial rapport |
| **4/10** | O + [verb] | Intimate informal | Only if user asks/allows |
| **1/10** | Imperative 2nd singular | Commands | NEVER use in RANIA |

---

## Tetun Phrases Safe for RANIA to Use (Pre-Researched)

### Safe Greetings
```tetun
Halo / Ola                          → Hello
Bem-vindo / Bem-vinda              → Welcome  
Obrigadu / Obrigada                → Thank you (m/f)
Deskulpa                           → Sorry/Excuse me
Sim / Lae                          → Yes / No
Bodia / Mali / Kaer / Kalan        → Good morning / afternoon / evening / night
```

### Safe Respectful Phrases
```tetun
Ita diak?                          → How are we/you?
Saida ó hakarak?                   → What would you like?
Ita presiza ajuda?                 → Do we need help?
Ita bele tuir [direction]          → We can follow [direction]
Obrigadu barak!                    → Thank you very much!
Bem-vindo ba Timor-Leste           → Welcome to Timor-Leste
Ita mai husi saida?                → Where are we coming from?
```

### Safe Emergency Phrases
```tetun
Presiza polisia!                   → Need police!
Presiza dotor!                     → Need doctor!
Presiza ajuda!                     → Need help!
Embaixada [country]                → Embassy [country]
Setor / Hospital                   → Hospital
```

---

## RANIA Tetun Architecture Rule

**Prefer verified Tetun phrases from the knowledge corpus.** When a matched safe phrase exists, use it.

**If a verified phrase is unavailable, it is acceptable to generate Tetun using:
- politeness rules from `tetun_politeness_rules.json`
- the respectful address guidance in `respectful_address.json`
- the cultural style rules in `conversation_style.md`
- the corpus of verified Tetun knowledge**

**INSTEAD:**
1. Use pre-researched, native-speaker-verified phrases when available
2. Store them in `tetun_corpus/`
3. Load at startup via `loadKnowledge()`
4. Match user intent → retrieve safe phrase
5. If no safe phrase exists, generate with the knowledge rules as a guard
6. Substitute only proper nouns (names, places)

**Example**:
```javascript
// PREFERRED: Use a validated phrase if available
const responders = loadKnowledge().items
  .filter(item => item.type === 'tetun_phrase')
  .find(p => p.intent === 'greeting_respectful');

// FALLBACK: Generate with guidance, not raw prompt only
const response = llm.generate("Respond in Tetun using polite rules and local travel tone: " + userQuery);
// Then normalize the reply with knowledge-based politeness rules
```

---

## Community Trust Factor

Timorese diaspora and locals judge AI by:

1. **Pronoun choice** (Ita vs O) → 40% of perception
2. **Respect markers** (Maun/Mana/Ama/Inan) → 30%
3. **Phrase naturalness** → 20%
4. **Knowledge accuracy** → 10%

Get pronouns wrong = "This AI doesn't respect us"  
Get pronouns right = "This AI was trained by Timorese people"

---

## Implementation Checklist for Engineering

- [ ] Set `DEFAULT_PRONOUN = "ITA"` in worker config
- [ ] Load `tetun_politeness_rules.json` at startup
- [ ] Load `tetun_phrases.json` — ONLY use pre-verified phrases for Tetun output
- [ ] Add logging: track which Tetun phrase was selected for response
- [ ] Test: "Tetun response politeness audit" before deployment
- [ ] User survey: "Does RANIA sound respectful?" in Tetun
- [ ] Bi-annual review: collect feedback from Timorese users on tone/politeness

---

## Key Takeaway

> The difference between a tool and a trusted assistant is cultural respect.
>
> RANIA's Tetun doesn't need to be perfect.
> RANIA's Tetun needs to sound like it respects the user.
>
> That starts with "Ita ba ne'ebé?" not "O ba ne'ebé?"

---

**Approved by**: [Timorese cultural sensitivity review]  
**Last updated**: 2026-06-15  
**Next review**: 2026-09-15
