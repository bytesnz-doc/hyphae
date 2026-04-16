# Flows

All flows grouped by functional area. IDs are globally unique across `UF-###` (User Flow) and `SF-###` (Software Flow).

---

## Module Assembly

### Software Flows
- [x] SF-001: On startup, assemble modules from config

---

## Authentication

### User Flows
- [x] UF-001: User registers an account (local auth)
- [x] UF-002: User logs in with local auth
- [x] UF-003: User logs in via OAuth 2.0 / OIDC

### Software Flows
- [x] SF-002: On 5 consecutive login failures, lock account

---

## Access Control

### User Flows
- [x] UF-004: Admin assigns roles to users within a project

### Software Flows
- [x] SF-003: On every request, authenticate and authorise before storage access

---

## Project Management

### User Flows
- [x] UF-005: User lists all projects
- [x] UF-006: User views a project
- [x] UF-007: Admin creates a project
- [x] UF-008: Admin deletes a project

---

## Collection Management

### User Flows
- [x] UF-009: User lists collections in a project
- [x] UF-010: User views a collection
- [x] UF-011: Admin creates a collection with field definitions
- [x] UF-012: User requests a collection's schema

### Software Flows
- [x] SF-004: On collection load, resolve ontology terms for field definitions

---

## Record CRUD

### User Flows
- [x] UF-013: User creates a record via form
- [x] UF-014: User views a record
- [x] UF-015: User updates a record
- [x] UF-016: User deletes a record

### Software Flows
- [x] SF-005: On record mutation, fire action modules

---

## Search & Filtering

### User Flows
- [x] UF-017: User filters, sorts, and paginates records

---

## Content Negotiation

### Software Flows
- [x] SF-006: On request, negotiate content type and select renderer

---

## Complex View

### User Flows
- [x] UF-018: User toggles complex view to expose ontological detail

---

## Subscriptions

### User Flows
- [x] UF-019: Client subscribes to data changes via polling
- [x] UF-020: Client subscribes to data changes via WebSocket

### Software Flows
- [x] SF-007: On record change, notify subscribed clients

---

## Offline & Sync

### User Flows
- [x] UF-021: User creates and edits records while offline
- [x] UF-022: User resolves a sync conflict

### Software Flows
- [x] SF-008: On reconnection, replay queued mutations and reconcile state

---

## PWA

### User Flows
- [x] UF-023: User installs hyphae as a PWA on their device

---

## Reports

### User Flows
- [x] UF-024: User creates a saved report (query + field projection)
- [x] UF-025: Client fetches a public report in any format

---

## Data Explorer

### User Flows
- [x] UF-026: User explores record relationships via the data explorer

---

## Connectors

### User Flows
- [x] UF-027: Admin introspects an external data source via a connector
- [x] UF-028: Admin syncs external data into hyphae via a connector

---

## Security Module

### User Flows
- [x] UF-029: User sets up identity keypair with security password
- [x] UF-030: Admin grants a user access to a data encryption key

### Software Flows
- [x] SF-009: On record mutation with security enabled, sign record
- [x] SF-010: On record receipt with security enabled, verify signature
- [x] SF-011: On login with security enabled, decrypt DEKs from key vault

---

## Implementation Order

Tiers:
- **P0** — Foundation: required by many other flows; no standalone user value
- **P1** — Core: primary value-delivering flows; build these first
- **P2** — Supporting: enhances core flows; needed for completeness
- **P3** — Nice-to-have: lower urgency, lower dependency

| Order | ID | Name | Tier | Phase | Depends On | Parallel? |
|-------|----|------|------|-------|------------|-----------|
| 1 | SF-001 | On startup, assemble modules from config | P0 | 1 | None | — |
| 2 | SF-004 | On collection load, resolve ontology terms | P0 | 1 | SF-001 | — |
| 3 | SF-003 | On every request, authenticate and authorise | P0 | 1 | SF-001 | Yes (with SF-004) |
| 4 | UF-001 | User registers (local auth) | P1 | 1 | SF-003 | — |
| 5 | UF-002 | User logs in (local auth) | P1 | 1 | UF-001 | — |
| 6 | SF-002 | Account lockout after 5 failures | P2 | 1 | UF-002 | — |
| 7 | UF-003 | User logs in via OAuth / OIDC | P2 | 1 | SF-003 | Yes (with SF-002) |
| 8 | UF-004 | Admin assigns roles to users | P1 | 1 | UF-002 | — |
| 9 | SF-006 | On request, negotiate content type | P0 | 1 | SF-001 | Yes (with UF-004) |
| 10 | UF-005 | User lists all projects | P1 | 1 | SF-003, SF-006 | — |
| 11 | UF-006 | User views a project | P1 | 1 | UF-005 | — |
| 12 | UF-007 | Admin creates a project | P1 | 1 | SF-003 | Yes (with UF-005, UF-006) |
| 13 | UF-008 | Admin deletes a project | P2 | 1 | UF-007 | — |
| 14 | UF-009 | User lists collections in a project | P1 | 1 | UF-005 | Yes (with UF-008) |
| 15 | UF-010 | User views a collection | P1 | 1 | UF-009, SF-004 | — |
| 16 | UF-011 | Admin creates a collection | P1 | 1 | UF-007, SF-004 | — |
| 17 | UF-012 | User requests a collection's schema | P2 | 1 | UF-011 | — |
| 18 | UF-013 | User creates a record | P1 | 1 | UF-011, SF-003 | Yes (with UF-012) |
| 19 | UF-014 | User views a record | P1 | 1 | UF-013, SF-006 | — |
| 20 | UF-015 | User updates a record | P1 | 1 | UF-013, SF-003 | Yes (with UF-014) |
| 21 | UF-016 | User deletes a record | P1 | 1 | UF-013, SF-003 | Yes (with UF-015) |
| 22 | SF-005 | On record mutation, fire action modules | P2 | 1 | UF-013 | — |
| 23 | UF-017 | User filters, sorts, and paginates records | P2 | 1 | UF-010 | — |
| 24 | UF-018 | User toggles complex view | P2 | 2 | UF-014, SF-004 | — |
| 25 | UF-019 | Client subscribes via polling | P3 | 2 | UF-013 | — |
| 26 | SF-007 | On record change, notify subscribed clients | P3 | 2 | UF-019 | — |
| 27 | UF-020 | Client subscribes via WebSocket | P3 | 3 | SF-007 | — |
| 28 | UF-021 | User works offline | P2 | 3 | UF-013, UF-015 | — |
| 29 | SF-008 | On reconnection, replay queued mutations | P2 | 3 | UF-021 | — |
| 30 | UF-022 | User resolves a sync conflict | P2 | 3 | SF-008 | — |
| 31 | UF-023 | User installs hyphae as a PWA | P3 | 3 | UF-021 | — |
| 32 | UF-024 | User creates a saved report | P3 | 2 | UF-017 | — |
| 33 | UF-025 | Client fetches a public report | P3 | 2 | UF-024, SF-006 | — |
| 34 | UF-026 | User explores record relationships | P3 | 2 | UF-014 | — |
| 35 | UF-027 | Admin introspects external data source | P3 | 3 | UF-011 | — |
| 36 | UF-028 | Admin syncs external data into hyphae | P3 | 3 | UF-027 | — |
| 37 | UF-029 | User sets up identity keypair | P3 | 4 | UF-002 | — |
| 38 | SF-009 | On mutation with security, sign record | P3 | 4 | UF-029 | — |
| 39 | SF-010 | On receipt with security, verify signature | P3 | 4 | SF-009 | — |
| 40 | UF-030 | Admin grants user access to DEK | P3 | 4 | UF-029 | — |
| 41 | SF-011 | On login with security, decrypt DEKs | P3 | 4 | UF-030 | — |
