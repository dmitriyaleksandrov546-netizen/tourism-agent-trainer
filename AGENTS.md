# Tourism Platform — Agent Rules

This workspace belongs to the `tourismdev` Hermes profile.

## Product context

Build a tourism SaaS platform that helps agencies and managers:
- hire tourist agents faster,
- train and test agents,
- keep hotel knowledge current,
- reduce routine work for agents/managers,
- improve sales conversion and revenue.

## Initial product roles

- Owner/admin
- Agency manager
- Tourist agent
- Candidate tourist agent
- Trainer/methodologist
- QA/content verifier for hotel data

## MVP bias

Prioritize sellable workflows:
1. Hiring CRM + candidate scoring.
2. Training/tests for tourist agents.
3. Hotel intelligence cards with sources/date/confidence.
4. Agent copilot for comparing hotels and drafting client replies.

Avoid building a huge generic CRM before validating the core paid workflow.

## Data integrity rules for hotels

Hotel facts must include:
- source URL/name where possible,
- last checked date,
- confidence level,
- distinction between verified fact, review-derived signal, and AI inference.

Never present uncertain hotel info as a verified fact.

## Engineering rules

- Use branch `ai/<task>` for code changes when git is initialized.
- Do not push to `main` unless explicitly instructed.
- Add or update tests for non-trivial logic.
- Run available tests/build/lint before declaring completion.
- Keep UX simple, mobile-friendly, and operator-first.

## Communication style

Russian, concise, direct, no bloated copy.
