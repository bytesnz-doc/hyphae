# API Design

## JSON:API + Content Negotiation

hyphae exposes a single set of URLs that serve different representations based on the HTTP `Accept` header. This means the same endpoint is usable by:
- A web browser (receives HTML)
- A JavaScript frontend (receives JSON or JSON:API)
- A semantic web tool (receives JSON-LD or Turtle)
- A legacy system (receives XML)
- A GIS tool or spreadsheet export (receives CSV)
- A GBIF-compatible tool (receives Darwin Core Archive)

### Content Type Mapping

| Accept Header | Renderer | Use Case |
|---|---|---|
| `text/html` | `@hyphae/renderer-html` | Web browser default |
| `application/json` | `@hyphae/renderer-json` | Generic API clients |
| `application/vnd.api+json` | `@hyphae/renderer-jsonapi` | JSON:API clients |
| `application/ld+json` | `@hyphae/renderer-jsonld` | Linked Data / semantic web |
| `text/turtle` | `@hyphae/renderer-turtle` | RDF tools |
| `application/rdf+xml` | `@hyphae/renderer-rdfxml` | Legacy RDF tools |
| `text/csv` | `@hyphae/renderer-csv` | Spreadsheets, data analysis |
| `application/zip` | `@hyphae/renderer-dwca` | Darwin Core Archive (GBIF) |

### Example

```http
GET /nz-birds/observations/rec-001
Accept: application/ld+json

HTTP/1.1 200 OK
Content-Type: application/ld+json

{
  "@context": {
    "dwc": "http://rs.tdwg.org/dwc/terms/"
  },
  "@id": "https://myinstance.org/nz-birds/observations/rec-001",
  "@type": "dwc:Occurrence",
  "dwc:scientificName": "Apteryx australis",
  "dwc:eventDate": "2026-04-09",
  "dwc:decimalLatitude": -43.532,
  "dwc:decimalLongitude": 172.636
}
```

The same request with `Accept: text/html` returns a rendered web page.

## JSON:API Structure

Collections and records follow the [JSON:API 1.1](https://jsonapi.org/) specification for consistency and tooling compatibility.

## URL Structure

Path segments beginning with `_` are reserved for hyphae.

```
GET    /_projects                                    → list all projects
GET    /:projectSlug                                 → project detail
GET    /:projectSlug/_collections                    → list collections in project
GET    /:projectSlug/:collectionSlug                 → collection detail + records
GET    /:projectSlug/:collectionSlug/:recordId       → single record
POST   /:projectSlug/:collectionSlug                 → create record
PATCH  /:projectSlug/:collectionSlug/:recordId       → update record
DELETE /:projectSlug/:collectionSlug/:recordId       → delete record
```

When a project has its own domain, the `/:projectSlug` prefix is omitted:

```
GET    /                             → project detail / collection list (configurable)
GET    /_collections                 → list collections
GET    /:collectionSlug              → collection detail + records
GET    /:collectionSlug/:recordId    → single record
POST   /:collectionSlug              → create record
PATCH  /:collectionSlug/:recordId    → update record
DELETE /:collectionSlug/:recordId    → delete record
```

All endpoints respond according to the `Accept` header.

## Pagination, Sorting

Standard JSON:API query parameters:
- `page[number]` / `page[size]` — pagination (default page size is configurable per collection via `x-default-page-size`)
- `sort` — comma-separated sort fields, prefix `-` for descending

## Filtering

Filtering uses a `filter[path][$op]=value` query parameter syntax, type-validated against the collection's field definitions.

### Operators

| Operator | Type | Description |
|---|---|---|
| `$eq` | any | Exact match |
| `$lt` | number, date | Less than |
| `$gt` | number, date | Greater than |
| `$lte` | number, date | Less than or equal |
| `$gte` | number, date | Greater than or equal |
| `$in` | any | Value is in a list (comma-separated) |
| `$has` | array fields | Array field contains value |
| `$like` | string | SQL-style wildcard match (`%`) |
| `$ilike` | string | Case-insensitive `$like` |
| `$fuzzy` | string | Fuzzy text match |
| `$starts` | string | Starts with |
| `$ends` | string | Ends with |

### Logic combinators

Multiple filter parameters are ANDed by default. Use `$or`, `$and`, and `$not` for compound logic:

```
GET /nz-birds/observations?filter[status][$eq]=verified&filter[$or][0][species][$eq]=Apteryx&filter[$or][1][species][$eq]=Kakapo
```

### Example

```http
GET /nz-birds/observations?filter[eventDate][$gte]=2024-01-01&filter[scientificName][$ilike]=apteryx%25
```

Filter values are coerced to the field's declared type before evaluation. An invalid value returns `400 Bad Request` with a description of the type mismatch.

## Schema Endpoint

`GET /:projectSlug/:collectionSlug` with `Accept: application/schema+json` returns the JSON Schema for a collection, including all field definitions and `x-` metadata properties.

Ontology definitions are also accessible via content negotiation on the same URL. A specific schema version is accessible via `?v=N`.

```http
GET /nz-birds/observations
Accept: application/schema+json

HTTP/1.1 200 OK
Content-Type: application/schema+json
```

## Subscriptions / Real-time

Clients can subscribe to data changes in three scopes:

| Scope | Description |
|---|---|
| Record IDs | Notified when any of a specific set of records changes |
| Filter | Notified when any record matching a filter expression is created, updated, or deleted |
| Collection | Notified on any change to the entire collection |

### Delivery mechanisms

| Mechanism | When to use |
|---|---|
| WebSocket | Connected clients; lowest latency |
| Push notifications | Mobile PWA; works when the app is backgrounded or offline |
| Polling (`?since=<ISO8601>`) | Fallback; works in any HTTP client |

The server emits a patch document (changed fields only) as the event payload, consistent with the patch-based sync model used by the offline client.
