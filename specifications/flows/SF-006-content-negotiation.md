## SF-006: On request, negotiate content type and select renderer

**Type:** Software Flow
**Actor:** hyphae server (Fastify onRequest hook)
**Trigger:** Any inbound HTTP request to a resource endpoint

**Preconditions:**
- SF-001 has completed — renderers are registered and indexed by MIME type
- The request has passed or is about to pass authentication (SF-003)

**Steps:**
1. Server reads the `Accept` header from the request. If absent, defaults to `text/html`
2. Server parses the `Accept` header into an ordered list of MIME types with `q`-value priorities
3. Server iterates the ordered list and finds the first MIME type that matches a registered renderer
4. Server attaches the selected renderer to the request context
5. After the route handler retrieves and resolves the data, the server invokes the selected renderer with the `ResolvedResource` and a `RenderContext`
6. The renderer serialises the resource to its format and returns the output
7. Server sets the `Content-Type` response header to the renderer's MIME type and writes the output to the response

**Success Outcome:** The response is serialised in the format the client requested. `Content-Type` matches the selected renderer's primary MIME type.

**Error Outcomes:**
- No registered renderer matches any MIME type in the `Accept` header → `406 Not Acceptable`; the response body lists the available MIME types
- The renderer throws during serialisation → `500 Internal Server Error`; error is logged with the renderer ID and resource details

**Data Involved:**
- Request `Accept` header
- Renderer registry (MIME type → renderer module)
- `ResolvedResource` produced by the route handler
- `RenderContext` (request metadata, project config, simple/complex view preference)

**Depends On:** SF-001
