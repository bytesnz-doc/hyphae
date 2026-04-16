## SF-005: On record mutation, fire action modules

**Type:** Software Flow
**Actor:** hyphae core (Record Manager)
**Trigger:** A record is successfully created, updated, or deleted

**Preconditions:**
- SF-001 has completed — action modules are registered and indexed by event type
- The record mutation has been committed to storage without error

**Steps:**
1. Record Manager identifies the event type: `create`, `update`, or `delete`
2. Record Manager looks up all action modules registered for that event type
3. For each matching action module, Record Manager constructs a `RecordEvent` payload containing:
   - The event type
   - The affected record (full record for `create`/`update`; record ID + collection context for `delete`)
   - The project and collection context
   - The user identity that triggered the mutation
4. Record Manager invokes each matching action module's `run` function with the event payload
5. Action modules run sequentially in registration order
6. If an action module throws an error, the error is logged but does not reverse the committed mutation

**Success Outcome:** All matching action modules have been invoked with the event payload. The record mutation remains committed regardless of individual action outcomes.

**Error Outcomes:**
- An action module throws an unhandled error → Error is logged with the action module ID and event details; remaining action modules still run; the original HTTP response to the client is not affected
- No action modules are registered for the event type → Flow completes silently with no side effects

**Data Involved:**
- Record event: type, affected record data, project/collection context, user identity
- Action module registry (keyed by event type)

**Depends On:** UF-013
