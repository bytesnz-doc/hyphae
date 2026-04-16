## SF-002: On 5 consecutive login failures, lock account

**Type:** Software Flow
**Actor:** hyphae authentication system
**Trigger:** A local-auth login attempt fails and the user's consecutive failure count reaches 5

**Preconditions:**
- The user account exists
- Local auth is enabled for the deployment
- The user has already failed 4 previous consecutive login attempts

**Steps:**
1. Server records the failed login attempt, incrementing the user's consecutive failure counter
2. Server checks whether the counter has reached the configured threshold (default: 5)
3. Server marks the account as locked and records the lockout timestamp
4. Server returns a `401 Unauthorized` response indicating the account is now locked
5. While locked, all subsequent login attempts for this account return `423 Locked` without checking the password
6. An admin can manually unlock the account, or a configurable lock duration elapses and the account is automatically unlocked

**Success Outcome:** The account is locked. No further login attempts are processed until the account is unlocked. The lock is recorded with a timestamp and the reason.

**Error Outcomes:**
- Account is already locked → Subsequent attempts return `423 Locked` immediately without incrementing the counter

**Data Involved:**
- User account: consecutive failure count, locked flag, lock timestamp
- Deployment config: lockout threshold (default 5), optional auto-unlock duration

**Depends On:** UF-002
