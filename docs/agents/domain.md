# Domain Docs

## Layout and reading rules

This project has one domain context. Before exploring, read root `GLOSSARY.md` and any relevant decisions in `docs/adr/`.

If a document or directory does not exist, proceed silently. Create glossary terms and architecture decision records lazily through domain modeling when a term is resolved or a substantive decision warrants a record.

## Use the glossary vocabulary

Use the canonical domain terms in issues, specifications, code, and tests. Respect the glossary's avoided synonyms. If a needed concept is absent, establish whether it represents a real domain gap before adding it.

## Respect architecture decisions

Read applicable ADRs before proposing or implementing a change. Surface a conflict with an ADR explicitly and explain why it should be reconsidered; do not silently override it.
