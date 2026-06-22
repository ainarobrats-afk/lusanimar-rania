# Tetun Corpus

Tetun language corpus untuk RANIA - Timor-Leste Travel Assistant.

## Objective

Build a comprehensive Tetun language knowledge base to make RANIA the most Tetun-literate travel assistant globally.

## Contents

- `tetun_dictionary.json` - Core Tetun vocabulary for travel context
- `tetun_phrases.json` - Common Tetun phrases for travelers
- `tetun_travel_phrases.json` - Travel-specific Tetun expressions
- `tetun_intents.json` - Tetun user intents & expected responses
- `tetun_common_questions.json` - FAQ in Tetun with travel context
- `labadain_articles.json` - Curated Tetun articles from Labadain

## Strategy

**Phase 1 (Manual Bootstrap):**
- Extract vocabulary from Labadain news articles
- Build QA dataset from travel scenarios
- Create phrase library for common traveler needs

**Phase 2 (Automated Filtering):**
- Use tetun-lid package to validate Tetun text
- Filter crawled content for quality

**Phase 3 (Continuous Crawling):**
- Integrate labadain-crawler to continuously ingest new articles
- Expand corpus weekly

## Related Resources

- GitHub: [gabriel-de-jesus/tetun-lid](https://github.com/borulilitimornews/tetun-lid)
- GitHub: [gabriel-de-jesus/labadain-crawler](https://github.com/gabriel-de-jesus/labadain-crawler)
- Source: [Labadain.com](https://www.labadain.com)
