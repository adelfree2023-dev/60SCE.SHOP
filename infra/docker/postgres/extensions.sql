-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pgcrypto for cryptographic functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify extensions are installed
DO $$
BEGIN
  RAISE NOTICE 'Extensions installed successfully:';
  RAISE NOTICE '  - vector: %', (SELECT installed_version FROM pg_available_extensions WHERE name = 'vector');
  RAISE NOTICE '  - pgcrypto: %', (SELECT installed_version FROM pg_available_extensions WHERE name = 'pgcrypto');
END $$;
