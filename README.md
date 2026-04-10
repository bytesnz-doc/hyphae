# hyphae

> A modular, ontology-aware data management platform — making structured data standards like Darwin Core accessible to everyone.

Like the threads of a fungal network, each module in hyphae is a hypha: small, purposeful, and interoperable. Together they form a living architecture for structured, semantic data.

## The Problem

Ontology standards like [Darwin Core](https://dwc.tdwg.org/) exist to make data interoperable and meaningful. But they're built for data scientists, not for the bird watcher or the conservation field officer. The same is true of ontologies in general — rich, precise, and utterly impenetrable to the people who most need them.

**hyphae** bridges that gap.

## What It Is

A FOSS, offline-capable web application and API platform for collecting, storing, and exploring structured data — backed by ontologies, but invisible to end users unless they want to see them.

- **For end users:** Simple forms, search pages, and reports. No ontology knowledge required.
- **For power users:** Toggle a "complex view" to expose ontological references, IRIs, term definitions, and data lineage.
- **For developers:** A fully modular, JavaScript-based platform with pluggable ontology modules, storage adapters, and renderers.
- **For integrators:** A content-negotiated JSON:API — the same URL serves HTML, JSON, JSON-LD, Turtle, XML, and more depending on the `Accept` header.

## Key Concepts

| Concept | Description |
|---|---|
| **Project / Collection / Set** | The user's unit of work — a dataset backed by one or more ontologies |
| **Ontology Module** | A plugin that understands a specific ontology format (OWL, SKOS, JSON Schema, etc.) |
| **Term Collection** | A curated set of terms from a specific standard (Darwin Core, Schema.org, etc.) |
| **Storage Adapter** | A plugin for a specific backend (SQLite, PostgreSQL, CouchDB, RDF triple store, graph DB, external API) |
| **Renderer** | A plugin that serialises data to a specific format (HTML, JSON-LD, Turtle, CSV, DwC-A, XML) |

## Use Cases

- 🐦 **Conservation (DoC NZ):** Field officers recording species observations using Darwin Core — they just see a form asking for species, location, date, and notes.
- 🔥 **Urban Search and Rescue:** Teams logging incidents, resources, and personnel — backed by a custom ontology, but presented as a simple operational interface.
- Any domain where structured, interoperable data matters but the people collecting it shouldn't need a PhD in knowledge engineering.

## Architecture

See the [`architecture/`](./architecture/) folder — each document is itself a hypha, together forming the full picture.

## Status

🌱 Early design phase. See [`architecture/ROADMAP.md`](./architecture/ROADMAP.md) for the plan.

## License

[AGPL-3.0](./LICENSE)
