# Visa Knowledge Folder

This folder contains structured visa knowledge for RANIA.

## Purpose

- Store country-specific visa rules in JSON.
- Keep visa logic out of worker code.
- Add new countries by adding new JSON files only.

## Schema

Main fields in each file:
- `destination_country`
- `destination_iso`
- `destination_name` (tet/id/en/pt)
- `destination_keywords` (optional language variants)
- `alt_names` (optional synonyms)
- `passport_keywords` (optional nationality aliases)
- `disclaimer`
- `embassy_in_dili` (optional contact info)
- `visa_rules` array

Each `visa_rules` entry should include:
- `passport_country`
- `passport_iso`
- `visa_required`
- `visa_type`
- `visa_on_arrival`
- `e_visa_available`
- `duration_days`
- `processing_days`
- `fee_usd` / `fee_eur` / `fee_gbp`
- `documents_required`
- localized `notes`

## How the worker uses this folder

- `lib/visa-knowledge.cjs` loads all JSON files.
- `rania-current/worker.js` routes visa questions using the loaded data.
- New country support only requires adding a new JSON file.
