## UF-002: User logs in with local auth

**Type:** User Flow
**Actor:** Field User, Power User, or Admin
**Trigger:** User submits the login form with a username/email and password

**Preconditions:**
- Local auth is enabled for the deployment
- A user account exists for the provided credentials

**Steps:**
1. User navigates to the login page
2. User enters their username (or email) and password
3. User submits the form
4. Server looks up the account by username or email
5. Server verifies the submitted password against the stored hash
6. Server resets the consecutive failure counter for the account
7. Server issues a signed JWT containing the user identity and role claims
8. Server sets the JWT as a session cookie (or returns it in the response body for API clients)
9. User is redirected to the page they were trying to reach, or to the home page

**Success Outcome:** The user is authenticated. A JWT is issued and stored as a session cookie. The user's subsequent requests carry the token and are recognised as authenticated.

**Error Outcomes:**
- Username or email not found → Generic "incorrect username or password" message (no disclosure of which field was wrong)
- Password incorrect → Generic "incorrect username or password" message; consecutive failure counter incremented (see SF-002)
- Account is locked → `423 Locked` response with a message explaining the lockout
- Account is pending email verification → Message directing the user to verify their email before logging in

**Data Involved:**
- Submitted username/email and password (plaintext, never stored)
- User account: hashed password, consecutive failure count, locked status
- Issued JWT: user ID, username, server-level role, issued-at and expiry timestamps

**Depends On:** UF-001
