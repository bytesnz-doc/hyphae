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
GET /projects/nz-birds/observations/rec-001
Accept: application/ld+json

HTTP/1.1 200 OK
Content-Type: application/ld+json

{
  "@context": {
    "dwc": "http://rs.tdwg.org/dwc/terms/"
  },
  "@id": "https://myinstance.org/projects/nz-birds/observations/rec-001",
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

## Pagination, Filtering, Sorting

Standard JSON:API query parameters:
- `page[number]` / `page[size]` — pagination
- `filter[field]` — field-level filtering
- `sort` — comma-separated sort fields, prefix `-` for descending
