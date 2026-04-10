# Access Control

See also: hyphae issue #2.

## Authentication

Authentication is pluggable. hyphae supports:

- **External providers** via OAuth 2.0 / OIDC (e.g. GitHub, Google, Keycloak, any OIDC-compatible IdP). The server validates tokens and maps provider identity to a hyphae user.
- **Local auth** — simple username/password authentication for small or fully-offline deployments. Credentials are stored hashed (bcrypt) in the project database.
- **Open access** — unauthenticated requests are permitted. Full open access (read and write) is unlikely to be appropriate in practice, but read-only open access is a reasonable option for public-facing deployments (e.g. a public species observation dataset). Configured per project or at the server level.

The authentication method is configured per deployment. Multiple providers can be active simultaneously.

## RBAC Model

Permissions are role-based and scoped at two levels:

- **Server level** — applies across all projects on the instance. Used to control who can create projects, manage users, or access admin functions. Configured in the server/deployment config.
- **Project level** — applies within a specific project. Roles and permissions are defined in the project configuration; users are assigned one or more roles per project.

A user may have different roles on different projects, and server-level roles can be overridden or supplemented by project-level roles.

### Permissions

Each role grants a set of permissions. Permissions are defined across two dimensions: **operation** (create, read, update, delete) and **scope** (own records, all records, collections, project).

| Scope | Create | Read | Update | Delete |
|---|---|---|---|---|
| Own records | Can create records attributed to self | Can read own records | Can update own records | Can delete own records |
| All records | Can create records for any user | Can read all records | Can update any record | Can delete any record |
| Collections | Can create new collections | Can read collection definitions | Can modify collection definitions | Can delete collections |
| Project | — | Can view project config | Can modify project config | Can delete project |

A typical role set for a field data project:

| Role | Permissions |
|---|---|
| `viewer` | Read own records, read all records |
| `contributor` | `viewer` + create own records, update own records |
| `editor` | `contributor` + update all records, delete own records |
| `admin` | All permissions |

### Org-level namespacing

For multi-tenant deployments, roles and collections can be namespaced by organisation, allowing different organisations to share a hyphae instance without seeing each other's data.

## Implementation

Access control is enforced in the server layer, inside the Project / Collection / Record Manager, before any storage adapter call. Storage adapters are not responsible for access decisions.

The check order for a request is:
1. Authenticate the request (validate token / session)
2. Resolve the user's roles for the target project
3. Evaluate the required permission against the user's role set
4. If denied, return `403 Forbidden` before touching storage
