## UF-012: User requests a collection's schema

**Type:** User Flow
**Actor:** Developer, Integrator, or any HTTP client
**Trigger:** HTTP request to `GET /:projectSlug/:collectionSlug` with `Accept: application/schema+json`

**Preconditions:**
- The project and collection exist
- SF-004 has resolved the collection's field definitions
- The caller has at least `read` permission on the project

**Steps:**
1. Client sends `GET /:projectSlug/:collectionSlug` with `Accept: application/schema+json`
2. Server authenticates and authorises the request (SF-003)
3. Server reads an optional `?v=N` query parameter to determine the requested schema version. Defaults to the latest version if omitted
4. Server retrieves the collection definition at the specified version from storage
5. Server resolves field metadata for the requested version (SF-004)
6. Server serialises the schema as a JSON Schema document, including all field definitions and `x-` properties
7. Server responds with `Content-Type: application/schema+json`

**Success Outcome:** The client receives the full JSON Schema for the collection at the requested version, including all field definitions, types, constraints, and `x-` properties.

**Error Outcomes:**
- Project or collection not found → `404 Not Found`
- Requested schema version `?v=N` does not exist → `404 Not Found` with a message stating the available version range
- Caller lacks read permission → `403 Forbidden`

**Data Involved:**
- Collection definition at the requested version: all field definitions, constraints, `x-` properties, schema version number
- Resolved ontology term metadata (included in field descriptions and type constraints)

**Depends On:** UF-011
