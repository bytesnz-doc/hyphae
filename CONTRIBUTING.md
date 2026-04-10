# Contributing to Hyphae

Thank you for your interest in contributing to Hyphae! This project aims to make structured data standards accessible to everyone — from conservation scientists to search and rescue teams. Every contribution, large or small, helps grow the network.

## License

By contributing to this project, you agree that your contributions will be licensed under the **GNU Affero General Public License v3.0** (AGPL-3.0). See [LICENSE](./LICENSE) for the full text.

This means:
- Your contributions remain open source and freely available to all
- Anyone who modifies and deploys Hyphae (including as a hosted service) must publish their changes under the same license
- No one can take Hyphae closed-source or build a proprietary product from it

## Ways to Contribute

- **Bug reports** — open an issue with clear reproduction steps
- **Feature requests** — open an issue describing the use case and the problem it solves
- **Documentation** — the `architecture/` folder is a great place to start
- **Code** — new modules (ontology adapters, storage adapters, renderers), core features, tests, and bugfixes
- **Ontology collections** — curated term collections for specific domains (biodiversity, emergency management, etc.)
- **Use case examples** — real-world projects in `examples/` that help others understand how to configure Hyphae

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/hyphae.git`
3. Create a branch: `git checkout -b my-feature`
4. Make your changes
5. Commit with a clear message: `git commit -m "feat: add Darwin Core renderer module"`
6. Push and open a Pull Request

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new ontology adapter interface
fix: resolve content negotiation for JSON-LD
docs: clarify storage adapter contract in MODULES.md
chore: update dependencies
```

## Module Contributions

Hyphae is built around modules — if you're contributing a new module (ontology adapter, storage adapter, renderer, ontology collection), please:

1. Follow the relevant interface defined in [`architecture/MODULES.md`](./architecture/MODULES.md)
2. Include a `README.md` in the module package explaining what it does, its dependencies, and any configuration options
3. Add an entry in [`architecture/MODULES.md`](./architecture/MODULES.md) under the appropriate section

## Architecture Discussions

Changes to the core architecture or module interfaces should be discussed as an Architecture Decision Record (ADR). Add a new entry to [`architecture/DECISIONS.md`](./architecture/DECISIONS.md) and open a PR for discussion before implementation.

## Code of Conduct

This project is for everyone. Be kind, be constructive, and assume good intent. Contributions that demean or exclude others will not be accepted.

## Questions?

Open an issue tagged `question` — there are no silly questions here.
