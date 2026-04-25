# Security

The scaffold establishes secure defaults but does not implement auth, RBAC,
tenant isolation, audit logging, or privacy controls yet.

Foundation rules:

- Do not commit secrets.
- Keep runtime secrets in environment variables.
- Keep external providers behind server-side adapters.
- Do not add tenant-owned data models before tenant isolation is implemented.
- Future sensitive operations must be audit-logged.
