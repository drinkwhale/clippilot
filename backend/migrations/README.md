# Database Migrations

This directory contains SQL migration scripts for ClipPilot database schema changes.

## Running Migrations

### Using psql (Direct)

```bash
# Set your database connection string
export DATABASE_URL="postgresql://user:password@localhost:5432/clippilot"

# Run migration
psql $DATABASE_URL -f migrations/001_add_oauth_configs_and_is_admin.sql
```

### Using Supabase CLI

```bash
# If using Supabase, you can run migrations through the dashboard or CLI
supabase db push
```

### Using Python Script

```python
# backend/scripts/run_migration.py
import os
import psycopg2
from pathlib import Path

def run_migration(migration_file: str):
    """Run a SQL migration file"""
    db_url = os.getenv("DATABASE_URL")

    with psycopg2.connect(db_url) as conn:
        with conn.cursor() as cur:
            migration_path = Path(__file__).parent.parent / "migrations" / migration_file
            sql = migration_path.read_text()
            cur.execute(sql)
        conn.commit()

    print(f"✅ Migration {migration_file} completed successfully")

if __name__ == "__main__":
    run_migration("001_add_oauth_configs_and_is_admin.sql")
```

## Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| 001_add_oauth_configs_and_is_admin.sql | 2025-11-18 | Add oauth_configs table and is_admin field to users |

## Creating New Migrations

1. Create a new SQL file with naming convention: `NNN_description.sql`
2. Include both UP and DOWN (rollback) sections
3. Add comments for each major step
4. Test migration on a local database first
5. Update this README with migration details

## Rollback Instructions

Each migration file includes rollback instructions in comments. To rollback:

```bash
# Example rollback for 001_add_oauth_configs_and_is_admin.sql
psql $DATABASE_URL <<EOF
DROP TRIGGER IF EXISTS trigger_oauth_configs_updated_at ON oauth_configs;
DROP FUNCTION IF EXISTS update_oauth_configs_updated_at();
DROP TABLE IF EXISTS oauth_configs;
ALTER TABLE users DROP COLUMN IF EXISTS is_admin;
EOF
```

## Best Practices

- **Always backup** your database before running migrations
- **Test migrations** on a staging environment first
- **Use transactions** when possible (some DDL operations don't support transactions in PostgreSQL)
- **Document changes** thoroughly in comments
- **Keep migrations idempotent** using `IF EXISTS` and `IF NOT EXISTS` clauses
- **Version control** all migration files
