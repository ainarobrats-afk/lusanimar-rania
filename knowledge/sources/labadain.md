# Labadain - Tetun Knowledge Source

## Overview

**Labadain** is the premier online news and knowledge portal for Tetun language content.

- **URL**: https://www.labadain.com
- **Language**: Tetun (native)
- **Format**: News articles, cultural content, topical coverage
- **Availability**: Online + Mobile apps (iOS/Android)
- **Status**: Active and maintained (2026)

## Source Type

- **Knowledge Portal**: Tetun news and articles
- **Tetun Language Corpus**: High-quality written Tetun
- **Timor-Leste Knowledge Base**: Local affairs, culture, economy, tourism
- **Vocabulary Source**: Current and natural Tetun usage

## Content Categories

- Tetun language content (100%)
- Local news and events
- Cultural and historical content
- Economy and business news
- Tourism information
- Travel-related articles

## Usage for RANIA

### Direct Integration

1. **Tetun Corpus Building**
   - Extract articles for language training
   - Build Tetun vocabulary from real usage
   - Create QA pairs from news content

2. **Tetun Language Understanding**
   - Analyze sentence structure and grammar
   - Learn natural Tetun phrasing
   - Understand cultural context

3. **RAG Knowledge Source**
   - Index Labadain articles in vector store
   - Retrieve Tetun context for user queries
   - Provide grounded answers in Tetun

4. **Current Affairs Knowledge**
   - Stay updated on Timor-Leste news
   - Understand local context for travel
   - Provide timely travel advisories

### Automated Crawling

Strategy: Combine with `labadain-crawler` (GitHub: gabriel-de-jesus/labadain-crawler)

**Phase 1**: Manual ingest of 50-100 key articles
**Phase 2**: Automated daily crawling via adapted crawler
**Phase 3**: Continuous knowledge base updates

## Technical Integration

### Filtering
Use **tetun-lid** (https://github.com/borulilitimornews/tetun-lid) to:
- Validate crawled content is Tetun
- Remove mixed-language artifacts
- Quality score each article

### Indexing
- Store articles in `knowledge/tetun_corpus/labadain_articles.json`
- Use `loadKnowledge()` to integrate with worker

### Crawling Tools
- **Puppeteer/Cheerio**: Simple daily scraper
- **labadain-crawler**: Full Apache Nutch + Solr pipeline
- **API**: Check for Labadain API availability

## Legal Considerations

- **License**: Verify Labadain content permissions
- **Terms of Service**: Check robots.txt and crawling policy
- **Attribution**: Credit Labadain as knowledge source
- **Fair Use**: For travel assistance and information purposes

## Strategic Value

**Usefulness Score**: 10/10

Why Labadain is critical for RANIA:
1. **Only Tetun-native source** - No AI generation, real Tetun content
2. **Travel-relevant** - News covers tourism, transportation, culture
3. **Maintained** - Active platform with mobile apps
4. **Crawlable** - Web content accessible for automated ingestion
5. **Competitive advantage** - No other OTA has this Tetun depth

## Contact & Attribution

- **Website**: https://www.labadain.com
- **researcher/crawler**: Gabriel de Jesus (mestregabrieldejesus@gmail.com)
- **Citation**: "Data Collection Pipeline for Low-Resource Languages" (LREC-COLING 2024)

## Related Resources

- **tetun-lid**: Language identification https://github.com/borulilitimornews/tetun-lid
- **labadain-crawler**: Web crawler https://github.com/gabriel-de-jesus/labadain-crawler
- **FCT**: Portuguese Science Foundation (research funding)
