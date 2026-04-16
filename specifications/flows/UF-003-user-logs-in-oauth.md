## UF-003: User logs in via OAuth 2.0 / OIDC

**Type:** User Flow
**Actor:** Field User, Power User, or Admin
**Trigger:** User selects an external identity provider (e.g. GitHub, Google, Keycloak) on the login page

**Preconditions:**
- At least one OAuth 2.0 / OIDC provider is configured for the deployment
- The user has an account with the chosen provider

**Steps:**
1. User navigates to the login page and selects an external provider
2. Server redirects the user to the provider's authorisation endpoint with the appropriate OAuth parameters
3. User authenticates with the provider (this flow is handled entirely by the provider)
4. Provider redirects the user back to hyphae's callback URL with an authorisation code
5. Server exchanges the code for an identity token (OIDC `id_token`) and validates it (signature, issuer, audience, expiry)
6. Server extracts the user's identity (provider subject ID, email, display name) from the token claims
7. Server looks up or creates a hyphae user account linked to this provider identity
8. Server issues a hyphae JWT for the user and sets it as a session cookie
9. User is redirected to the page they were trying to reach, or to the home page

**Success Outcome:** The user is authenticated via the external provider. A hyphae JWT is issued. The user's subsequent requests are recognised as authenticated.

**Error Outcomes:**
- Provider returns an error (user denied access, provider error) → User is shown an error page with guidance to try again or use a different login method
- Identity token fails validation (bad signature, expired, wrong audience) → `401 Unauthorized`; error logged
- Provider identity is linked to a suspended or locked hyphae account → User is shown an account status message

**Data Involved:**
- OAuth authorisation code (transient)
- OIDC identity token: subject ID, email, display name, issuer, expiry
- hyphae user account: provider identity link, email, display name, status
- Issued JWT: user ID, display name, server-level role, issued-at and expiry timestamps

**Depends On:** SF-003
