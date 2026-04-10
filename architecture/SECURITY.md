# Security

The security module is **optional** and implemented as `@hyphae/security`. It is off by default. When enabled it provides two independent capabilities: **identity-bound signing** (for record provenance and offline integrity) and **client-side data encryption** (for IndexedDB at rest). Neither capability requires changes to the core server or storage adapters.

---

## Overview

Normal authentication (OAuth2/OIDC or local auth) is handled by the access control layer — see [ACCESS-CONTROL.md](./ACCESS-CONTROL.md). The security module extends this with an additional in-browser step that produces a user identity keypair and, optionally, data encryption keys. The server never holds plaintext encryption keys and never performs cryptographic operations on behalf of the user.

This design is motivated by the **multi-user device** scenario (e.g. a USAR tablet shared between team members): records created or modified offline must be attributable to a specific user even after the device has been handed to someone else.

---

## Identity Keypair

After the standard authentication flow completes, the security module (if enabled) prompts the user for a **separate security password**. This password is used only to protect the locally-stored private key — it is never sent to the server.

```
security password + salt
         │
         ▼  PBKDF2
  wrapping key (AES-GCM)
         │
         ▼  wraps
  user private key  ──────────────────► stored encrypted in IndexedDB
  user public key   ──────────────────► sent to server → stored on user/session
         │
         ▼
  server issues JWT
  (contains public key in payload)
```

1. The browser generates an **asymmetric keypair** (ECDSA P-256) using the Web Crypto API.
2. A wrapping key is derived from the security password using PBKDF2 with a per-user salt.
3. The private key is wrapped (encrypted) with the wrapping key and stored in IndexedDB. It is never extractable and never leaves the browser in plaintext.
4. The public key is sent to the server, which stores it against the user session.
5. The server returns an **identity JWT** containing the user's public key. This JWT is the portable proof of identity used across the system.

The security password is only re-entered when the private key needs to be unwrapped (e.g. after clearing the browser, or on first login on a shared device).

---

## Record Signing

With the keypair in place, the private key is used to **sign record mutations** (create, update, delete). The signature is attached to the record's metadata.

```typescript
record.meta.signature = {
  userId: string;       // user ID
  publicKeyJwt: string; // the identity JWT (contains public key)
  signature: string;    // base64 ECDSA signature over the record content hash
  signedAt: string;     // ISO 8601 timestamp
}
```

When the server receives a mutation (online or as part of a sync replay after offline use), it:
1. Extracts the public key from the attached identity JWT
2. Verifies the JWT is authentic (signed by the hyphae server's own key)
3. Verifies the record signature against the public key

This ensures that even if records were created offline on a shared device, each record's author is cryptographically verifiable and cannot be spoofed.

---

## Client-Side Data Encryption

Data encryption is separate from signing and is also optional (can be enabled independently). Encryption happens entirely in the browser — the server stores only ciphertext.

### Data Encryption Keys (DEKs)

Data is encrypted per collection (or per field) using a **symmetric DEK** (AES-GCM). DEKs are role-scoped: a `supervisor` role and a `contributor` role may have access to different DEKs, controlling which records each role can decrypt.

Each DEK is stored in a **per-user key vault**: a set of DEK entries, each encrypted with that user's public key. A user retrieves the DEKs for their roles from the server on login, decrypts them with their private key, and holds them in memory for the session.

```
role DEK (AES-GCM key)
      │
      ▼  encrypted with user's public key
per-user key vault entry  ──────────────────► stored server-side
      │
      ▼  decrypted at login using private key
DEK in memory  ──────────────────────────────► used to encrypt/decrypt IndexedDB records
```

Other users can be granted access to a DEK by encrypting it with their public key (obtained from their identity JWT) and adding it to their key vault. No plaintext key exchange is needed.

### Selective Encryption

Not all fields need to be encrypted. Fields required for server-side filtering or indexing are left in plaintext. The plaintext fields are listed explicitly in the collection's encryption manifest; all other fields are encrypted.

### Offline Implications

- Encrypted records are stored as ciphertext in IndexedDB — the offline store never holds plaintext for encrypted fields.
- DEKs must be cached in memory (not persisted) for offline operation. If the session ends, the user must re-authenticate and re-enter their security password to regain access to encrypted records.

---

## Module Boundary

All of the above is implemented in `@hyphae/security` and does not modify the behaviour of `@hyphae/core`, `@hyphae/server`, or any storage adapter. The module:

- Hooks into the authentication flow to run the keypair setup step
- Intercepts record mutations to attach signatures before they reach the storage adapter
- Intercepts record reads to verify signatures and decrypt fields
- Adds key vault management endpoints to the server (`/_security/...`)

