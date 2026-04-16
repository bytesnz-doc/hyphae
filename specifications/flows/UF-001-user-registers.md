## UF-001: User registers an account (local auth)

**Type:** User Flow
**Actor:** Field User, Power User, or Admin
**Trigger:** User submits the registration form with a username, email, and password

**Preconditions:**
- Local auth is enabled for the deployment
- Registration is open (or the user has a valid registration invitation)

**Steps:**
1. User navigates to the registration page
2. User enters their desired username, email address, and a password
3. User submits the form
4. Server validates the input: username and email are present and correctly formatted; password meets minimum requirements
5. Server checks that the username and email are not already in use
6. Server hashes the password
7. Server creates the user account with a `pending` or `active` status depending on deployment configuration
8. If email verification is required, server sends a verification email and shows a "check your email" message
9. If email verification is not required, server logs the user in automatically and redirects to the home page

**Success Outcome:** A new user account is created. The user is either logged in (no verification required) or shown instructions to verify their email.

**Error Outcomes:**
- Username already taken → Form re-displays with a "username not available" message
- Email already registered → Form re-displays with a "email already in use" message
- Password does not meet requirements → Form re-displays with password requirement guidance
- Email is malformed → Form re-displays with a field-level validation error
- Registration is closed → User sees an informational message explaining that registrations are not currently accepted

**Data Involved:**
- Username, email address, password (plaintext input), hashed password (stored)
- User account: ID, username, email, hashed password, status, created timestamp

**Depends On:** SF-003
