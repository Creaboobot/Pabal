# Azure Migration Notes

The foundation is designed to remain portable:

- Runtime configuration flows through environment variables.
- PostgreSQL is accessed through `DATABASE_URL`.
- The Dockerfile builds a production Next.js server that can run outside Vercel.
- External provider SDKs are not wired into product code.

Future Azure work should provision Azure Container Apps, Azure Database for
PostgreSQL Flexible Server, Azure Blob Storage, Key Vault, and monitoring before
moving runtime secrets out of local `.env` files.
