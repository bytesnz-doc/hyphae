# UI Design Principles

## Core Philosophy

The UI has one job for most users: **get out of the way**.

Forms should feel like forms. Tables should feel like tables. The fact that every field is backed by an ontology term with a globally unique IRI should be completely invisible — unless the user wants to see it.

## Simple View (Default)

- Field labels are human-readable (from ontology term `rdfs:label` or custom override)
- No IRIs, no namespace prefixes, no ontology jargon
- Forms are generated from the collection's field definitions
- Help text is drawn from the ontology term's `rdfs:comment` / `skos:definition`
- Validation messages are plain language

**Example — Darwin Core observation form (simple view):**
```
Species name: [________________]  ← dwc:scientificName
Date observed: [date picker]      ← dwc:eventDate
Location: [map picker]            ← dwc:decimalLatitude + dwc:decimalLongitude
Notes: [text area]                ← dwc:occurrenceRemarks
```

## Complex View (Toggle)

Activated by a UI toggle, visible to users who want it. Adds:
- The full IRI for each field, displayed alongside the label
- The source ontology and term collection
- Term definition (from the ontology)
- Data type and cardinality constraints
- Links to the term's entry in its ontology registry (e.g. TDWG for DWC)
- Raw JSON-LD / Turtle view of the current record

**The same form in complex view:**
```
Species name [dwc:scientificName]
  http://rs.tdwg.org/dwc/terms/scientificName
  "The full scientific name, with authorship and date information if known."
  Type: string | Required: yes
[________________]
```

## Responsive Design

- Mobile-first: designed for use on phones in the field
- Works on tablet and desktop equally well
- Map picker is touch-friendly

## Accessibility

- Semantic HTML throughout
- WCAG 2.1 AA target
- Keyboard navigable
- Screen reader friendly labels (using ontology term descriptions as aria-describedby)

## Technology

- Framework: **Svelte** (small bundle size, no virtual DOM overhead — fits the "as small as possible" principle)
- Offline storage: **RxDB** or **Dexie.js**
- Maps: **Leaflet** (lightweight, FOSS)
- Design system: TBD — lean toward a minimal, utility-first approach (e.g. a small Tailwind CSS setup)

## Data Explorer

An interactive view for exploring relationships in the data. Starting from a collection or a single record, users can:

- Follow relationships to linked records (e.g. a species observation → location → survey)
- Expand the graph incrementally — each node can be explored further without reloading
- Switch between two layouts:
  - **Graph view** — nodes are records, edges are relationships; rendered as a force-directed or hierarchical graph
  - **List view** — expanding nested lists, one relationship level at a time

The data explorer respects the simple/complex view toggle: in simple view, nodes and edges display human-readable labels; in complex view, IRIs and term definitions are visible alongside.

## Reports

A report is a saved query combined with a defined projection (a subset of fields to expose). Reports can be made public — the public report URL returns only the specified fields, preventing unintended data disclosure.

Reports are rendered through the standard content negotiation mechanism: the same report URL returns HTML, JSON, CSV, or any other supported format depending on the `Accept` header. This means a public report can be linked to from a spreadsheet formula or consumed by an external API client without any extra configuration.
