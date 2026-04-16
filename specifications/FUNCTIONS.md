# Functions

Everything hyphae needs to do — raw brain-dump, processed into flows.
New items can be added at any time. Unprocessed items have no `[x]` or `→ ID`.

---

## Module Assembly & Startup

- [x] server loads and registers modules from config at startup → SF-001
- [x] server assembles ontology registry from loaded ontology modules and term collections → SF-001
- [x] server indexes renderers by MIME type at startup → SF-001
- [x] server registers OIDC groups resolver modules (built-in strategies or optional provider-specific modules) → SF-001

## Authentication

- [x] server admin configures available authentication methods (local auth and/or OAuth 2.0 / OIDC providers) → UF-031
- [x] user registers an account (local auth) → UF-001
- [x] user logs in with username and password → UF-002
- [x] user logs in via OAuth 2.0 / OIDC provider → UF-003
- [x] OIDC provider config includes a groups claim path and a groups resolver strategy → UF-031
- [x] on OIDC login, extract raw group identifiers from the configured claim in the ID token → SF-013
- [x] on OIDC login, normalise raw group identifiers to stable hyphae group names via the configured resolver → SF-013
- [x] on OIDC login, sync the user's hyphae group memberships to match the resolved groups (JIT — no background job) → SF-013
- [x] if auto-create is enabled, automatically create hyphae groups for unknown OIDC group identifiers on first encounter → SF-013
- [x] admin maps a specific OIDC group identifier to an existing hyphae group (overrides auto-create for that group) → UF-036
- [x] on 5 consecutive login failures, lock the account → SF-002

## Access Control

- [x] project owner or project admin assigns roles to individual users or groups within a project → UF-004
- [x] on every request, authenticate the caller and enforce RBAC before storage access → SF-003
- [x] permissions are scoped at server level and project level → SF-003
- [x] unauthenticated (open) access configurable per project → SF-003
- [x] collection management permissions (create, edit, delete collection definitions) are a distinct permission tier from record-editing permissions → SF-003
- [x] project owner role is assigned automatically when a user creates a project → SF-012
- [x] a user's effective permissions are the union of all roles assigned directly to them and all roles assigned to their groups → SF-003
- [x] project owner can delegate collection management rights to specific users or groups without granting full project admin → UF-035

## Group Management

- [x] server admin creates a named group → UF-032
- [x] server admin adds or removes users from a group manually → UF-032
- [x] server admin deletes a group → UF-032
- [x] manually managed groups have no OIDC dependency — membership is set entirely by the admin → UF-032
- [x] project owner or project admin assigns a role to a group on a project → UF-004
- [x] a group can optionally be linked to an OIDC group identifier; if linked, membership is synced from OIDC on login while still allowing manual additions → UF-036
- [x] unlinking a group from OIDC does not affect its existing membership — it simply reverts to fully manual management → UF-036
- [x] server admin configures OIDC group sync behaviour per provider: auto-create, map-only, or auto-create with manual overrides → UF-036
- [x] server admin maps a specific OIDC group identifier to an existing manually created group → UF-036

## OIDC Groups Resolvers

- [x] built-in resolver strategy 'as-is' — uses OIDC group claim values directly as hyphae group names (Okta, Authentik, most simple providers) → SF-013
- [x] built-in resolver strategy 'path-last-segment' — extracts the final segment from a slash-delimited path (Keycloak default) → SF-013
- [x] built-in resolver strategy 'path-full' — normalises a slash-delimited path to a hyphae group name, preserving hierarchy (Keycloak, when full path is needed) → SF-013
- [x] optional module @hyphae/oidc-groups-azure resolves Azure AD group GUIDs to display names via Microsoft Graph API → SF-013
- [x] optional module @hyphae/oidc-groups-google fetches group memberships via Google Workspace Admin SDK (groups are not in the token) → SF-013

## Project Management

- [x] server admin lists all projects on the instance → UF-005
- [x] user lists all projects on the instance they have access to → UF-005
- [x] user views a project's detail → UF-006
- [x] any authenticated user creates a new project and becomes its owner → UF-007
- [x] project owner or project admin configures project access settings (open access flag, auth requirements, role definitions) → UF-035
- [x] server admin configures access to any project → UF-035
- [x] server admin deletes any project → UF-008
- [x] project owner deletes their own project → UF-008
- [x] server admin configures available ontologies, storage adapter, and renderers for a project → UF-007

## Collection Management

- [x] user lists collections within a project → UF-009
- [x] user views a collection (fields and records) → UF-010
- [x] project owner or collection manager creates a collection with field definitions backed by ontology terms → UF-011
- [x] user/client fetches the JSON Schema for a collection → UF-012
- [x] collection fields inherit metadata from ontology term IRI (label, description, type, cardinality) → SF-004
- [x] on collection load, resolve all field term IRIs via the ontology registry → SF-004
- [x] collection schema versioning via ?v=N → UF-012
- [x] schema inheritance — a collection can extend parent collections → UF-011

## Record CRUD

- [x] user creates a record via a web form → UF-013
- [x] user views a single record → UF-014
- [x] user updates a record → UF-015
- [x] user deletes a record → UF-016
- [x] on record mutation (create/update/delete), fire registered action modules → SF-005

## Search & Filtering

- [x] user filters records by field values using filter[path][$op]=value syntax → UF-017
- [x] user sorts records by one or more fields → UF-017
- [x] user paginates through records (page[number] / page[size]) → UF-017
- [x] support filter operators: $eq, $lt, $gt, $lte, $gte, $in, $has, $like, $ilike, $fuzzy, $starts, $ends → UF-017
- [x] support logical combinators: $and (default), $or, $not → UF-017
- [x] filter values are coerced to the field's declared type; invalid values return 400 → UF-017

## Content Negotiation

- [x] on request, inspect Accept header and select the matching renderer → SF-006
- [x] same URL serves HTML, JSON, JSON:API, JSON-LD, Turtle, RDF/XML, CSV depending on Accept → SF-006
- [x] renderer selection uses standard q-value priority → SF-006

## Complex View

- [x] user toggles complex view to expose IRIs, definitions, data types, and term sources → UF-018
- [x] complex view shows raw JSON-LD / Turtle representation of current record → UF-018

## Subscriptions / Real-time

- [x] client subscribes to record changes via polling (?since=<ISO8601>) → UF-019
- [x] client subscribes via WebSocket for low-latency push → UF-020
- [x] on record change, notify subscribed clients via registered delivery mechanism → SF-007
- [x] subscription scopes: specific record IDs, filter expression, or entire collection → UF-019

## Offline & Sync

- [x] user creates and edits records while offline; changes stored locally → UF-021
- [x] on reconnection, replay queued mutations to the server (patch-based sync) → SF-008
- [x] conflict detection using record version numbers → SF-008
- [x] user resolves a detected sync conflict → UF-022
- [x] tombstone mapping — local temporary IDs replaced with server-assigned IDs after sync → SF-008
- [x] sync configurable at app level and user level (subset filters) → UF-021
- [x] sync runs in a Web Worker off the main thread → SF-008

## PWA

- [x] user installs hyphae as a PWA on their device (add to home screen) → UF-023
- [x] service worker pre-caches the application shell and static assets → UF-023
- [x] background sync queues offline mutations and replays on reconnect → SF-008

## Reports

- [x] user creates a saved report, with a collection of queries, field projections and display mechanisms → UF-024
- [x] reports have their own access control — visibility can be restricted to specific users or groups, or made public if the server admin permits public reports → UF-037
- [x] client fetches a public report URL in any format via content negotiation → UF-025

## Data Explorer

- [x] user explores record relationships starting from a collection or single record → UF-026
- [x] graph view (nodes = records, edges = relationships) for data explorer → UF-026
- [x] list view (expanding nested lists by relationship) for data explorer → UF-026

## Connectors

- [x] admin introspects an external data source via a connector module to get proposed collection schemas → UF-027
- [x] connector can be configured in pass-through mode — data is read and written directly to the external source; hyphae holds no local copy → UF-028
- [x] connector can be configured in two-way sync mode — data is mirrored between the external source and hyphae storage, with conflict detection → UF-028

## Security Module

- [x] user sets up identity keypair with a separate security password → UF-029
- [x] on record mutation with security enabled, sign the record with the user's private key → SF-009
- [x] on record receipt, verify the record's signature against the attached public key → SF-010
- [x] admin grants another user access to a data encryption key (DEK) → UF-030
- [x] on login with security enabled, decrypt DEKs from the user's key vault → SF-011
- [x] selective field encryption — fields required for server-side filtering stay plaintext → SF-011

## File Upload

- [x] server admin configures which storage adapters are available for file attachments on the server → UF-031
- [x] storage adapters support per-project configuration (e.g. S3 bucket, prefix, region) set when the project is created or updated → UF-007
- [x] project admin creates or edits a collection with one or more attachment fields → UF-038
- [x] project admin configures allowed MIME types and maximum file size per attachment field → UF-038
- [x] user uploads a file attachment when creating or editing a record → UF-039
- [x] server admin configures one or more file scanners (e.g. antivirus) to run on all uploaded files → UF-040
- [x] on file upload, run all configured file scanners; reject and quarantine the file if any scanner fails → SF-014
- [x] file attachment URLs are access-controlled — a user must have read permission on the record to retrieve its attachments → SF-003

## Actions

- [x] project admin creates and configures project-level actions that trigger on record events (create, update, delete) → UF-041
- [x] project admin specifies whether an action runs on the server only, or on both server and client; server-only actions have access to capabilities unavailable in the browser (e.g. sending email, calling internal APIs) → UF-041
- [x] server admin configures which action types and capabilities are permitted on the instance (e.g. allow/deny outbound HTTP, email, scripts) → UF-042
- [x] on record event, run all project-configured actions that match the event type, subject to server-level permission restrictions → SF-015
- [x] project-configured actions are distinct from developer-registered action modules (SF-005) — both may fire on the same event → SF-015
