## SF-001: On startup, assemble modules from config

**Type:** Software Flow
**Actor:** hyphae server process
**Trigger:** Server process starts

**Preconditions:**
- A valid `hyphae.config.ts` (or equivalent) is present and specifies at minimum one storage adapter, one ontology module, and one renderer

**Steps:**
1. Server reads the configuration and collects the declared module set (storage adapter, ontology modules, term collections, renderers, optional action modules, optional connector modules)
2. Server connects the storage adapter (e.g. opens the SQLite database file)
3. Server loads and registers each ontology module into the ontology registry
4. Server loads and registers each term collection, linking it to the appropriate ontology module(s)
5. Server indexes each renderer by the MIME types it handles
6. Server registers optional action modules, each declaring which record events (`create`, `update`, `delete`) they listen to
7. Server marks itself as ready to accept requests

**Success Outcome:** All declared modules are loaded and registered. The ontology registry, renderer index, and action module registry are fully populated. The server begins accepting HTTP requests.

**Error Outcomes:**
- Storage adapter fails to connect (e.g. file not found, wrong credentials) → Server exits with a clear error message naming the adapter and the failure reason
- Ontology module fails to load → Server exits with a clear error message naming the module
- A renderer declares a MIME type already claimed by another renderer → Server exits with a conflict error
- Configuration file is absent or malformed → Server exits with a validation error describing what is missing or incorrect

**Data Involved:**
- Configuration: declared module IDs, storage connection config, ontology source URLs or file paths
- Renderer MIME type registry (in-memory)
- Ontology registry (in-memory)
- Action module registry (in-memory, keyed by event type)

**Depends On:** None
