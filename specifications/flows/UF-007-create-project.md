## UF-007: Admin creates a project

**Type:** User Flow
**Actor:** Admin (server-level admin role)
**Trigger:** Admin submits a new project form with at minimum a label and a slug

**Preconditions:**
- The user holds the server-level admin role
- The chosen slug is not already in use

**Steps:**
1. Admin navigates to the new project page
2. Admin enters: project label, slug, optional description
3. Admin selects a storage adapter (or accepts the default)
4. Admin selects which ontology modules and term collections to enable for this project
5. Admin selects which renderers to enable
6. Admin optionally configures open access (unauthenticated read permitted)
7. Admin submits the form
8. Server validates the input: slug is URL-safe, slug is unique, required fields are present, referenced modules are registered
9. Server creates the project record in storage
10. Server confirms creation and redirects admin to the new project's detail page

**Success Outcome:** A new project is created and immediately accessible. The admin is redirected to the project detail page.

**Error Outcomes:**
- Slug already in use → Form re-displays with a "slug not available" message
- Slug contains invalid characters → Form re-displays with a format error
- Referenced module (storage adapter, ontology, renderer) is not registered → Validation error identifying the unknown module
- Caller lacks server-level admin permission → `403 Forbidden`

**Data Involved:**
- Project: label, slug, description, storage adapter ID, storage config, ontology module IDs, term collection IDs, renderer IDs, open-access flag
- New project record stored with a generated ID, created and updated timestamps

**Depends On:** SF-003
