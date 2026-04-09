# Vision

## Problem Statement

Ontologies and data standards like Darwin Core, Schema.org, and domain-specific vocabularies are powerful tools for making data interoperable and meaningful across systems. However, they are designed for knowledge engineers and data scientists — not for the people who most need to collect and use that data.

A conservation field officer at the Department of Conservation NZ should not need to understand what an IRI is to record a kiwi sighting. An urban search and rescue team leader should not need to know RDF to log a resource deployment.

**hyphae** is built on the premise that the complexity of ontologies should be invisible by default, and discoverable by choice.

## Goals

1. **Accessible by default** — end users interact with simple, domain-appropriate forms and views. No ontology knowledge required.
2. **Semantically rich underneath** — all data is grounded in ontology terms. Records are interoperable with the broader semantic web.
3. **Fully modular** — every subsystem (ontology handling, storage, rendering) is a replaceable plugin. No monolithic lock-in.
4. **Offline-capable** — works without internet connectivity. Syncs when available. Suitable for field use.
5. **Standards-compliant output** — data can be exported and served in any format: JSON-LD, Turtle, Darwin Core Archive, CSV, XML.
6. **FOSS** — free, open source, self-hostable, forkable.
7. **JavaScript throughout** — maximum code reuse between server and client; single language for contributors.
8. **As small as possible** — lean core, optional modules. A deployment for bird watching should not carry the weight of a deployment for hospital records.

## Guiding Principles

- **Complexity is opt-in, not opt-out.** Simple view is the default. Complex view is a toggle.
- **Modules are hyphae.** Each plugin is small, purposeful, and composable. The system is the network.
- **Data belongs to the user.** No vendor lock-in. Export anytime in open formats.
- **The API is the truth.** The web UI is just one renderer. The JSON:API endpoint is the canonical interface.
- **Offline is a first-class citizen.** Not an afterthought. Field workers in remote areas are a primary user.
