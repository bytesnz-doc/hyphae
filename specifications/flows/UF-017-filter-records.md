## UF-017: User filters, sorts, and paginates records

**Type:** User Flow
**Actor:** Any authenticated user with at least `read` permission on the project
**Trigger:** User applies filter, sort, or page parameters to a collection request

**Preconditions:**
- The project and collection exist
- SF-004 has resolved the collection's field definitions (required for type-coercing filter values)
- The user has at least `read` permission

**Steps:**
1. User (or API client) sends `GET /:projectSlug/:collectionSlug` with one or more of:
   - `filter[fieldId][$op]=value` — filter on a field
   - `filter[$or][0][fieldId][$op]=value` — compound OR filter
   - `sort=fieldId` or `sort=-fieldId` (descending)
   - `page[number]=N` and `page[size]=N`
2. Server parses the `filter` parameters into a typed `FilterExpression` tree, coercing each value to the declared type of the referenced field
3. Server validates all filter operators against the referenced field types (e.g. `$fuzzy` only on string fields)
4. Server translates the `FilterExpression` into the storage adapter's native query language
5. Server executes the query with the storage adapter, applying filter, sort, and pagination
6. Server resolves the returned records against the collection's field definitions (attaching ontology metadata)
7. Server renders the result via SF-006, including pagination metadata (total count, current page, page size)

**Success Outcome:** The user receives a filtered, sorted, paginated list of records matching the query. Pagination metadata indicates the total record count and navigation information.

**Error Outcomes:**
- A filter references an unknown field ID → `400 Bad Request` identifying the unknown field
- A filter value cannot be coerced to the field's declared type → `400 Bad Request` with a type mismatch description
- An operator is not valid for the field type → `400 Bad Request` identifying the incompatible operator
- `page[size]` exceeds the server maximum → `400 Bad Request`; the maximum is included in the error

**Data Involved:**
- Filter parameters: field IDs, operators, values
- Sort: field ID(s), direction(s)
- Pagination: page number, page size (defaulting to `x-default-page-size` or server default)
- `FilterExpression` tree (typed internal representation)

**Depends On:** UF-010
