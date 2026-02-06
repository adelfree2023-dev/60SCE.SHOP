---
name: apex_semantic_search
description: Implements AI-powered vector search using pgvector for understanding user intent beyond literal keywords.
---

# 🔍 Semantic Vector Search Protocol

**Philosophy**: Users don't think in keywords—they think in concepts.

**Rule**: Product search must understand **user intent**, not just match text.

**Example**: Search "boil water" → Show kettles, even without the word "kettle"

---

## 🧬 Architecture Overview

```
User Query: "something to boil water"
    ↓
1. Generate Embedding (OpenAI/local model)
    ↓
2. Vector Similarity Search (pgvector)
    ↓
3. Rank Results (cosine similarity + metadata)
    ↓
Results: Kettles, Water Boilers, Electric Pots
```

---

## 🗄️ Database Schema

### Products Table with Vector Column:
```sql
-- Migration: Add vector search support
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE products 
ADD COLUMN embedding vector(1536); -- OpenAI ada-002 dimension

-- Index for fast similarity search
CREATE INDEX ON products 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Drizzle Schema:
```typescript
// packages/db/src/schema/products.ts
import { pgTable, uuid, text, real, vector } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  
  // Semantic search
  embedding: vector('embedding', { dimensions: 1536 }),
  
  // Traditional search (fallback)
  search_vector: text('search_vector'), // tsvector for full-text
});
```

---

## 🤖 Embedding Generation

### Option 1: OpenAI API (Recommended - Phase 2)
```typescript
// lib/embeddings/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  
  return response.data[0].embedding;
}

// Generate on product creation
export async function createProduct(data: ProductInput) {
  const searchText = `${data.name} ${data.description} ${data.category}`;
  const embedding = await generateEmbedding(searchText);
  
  return db.insert(products).values({
    ...data,
    embedding
  });
}
```

### Option 2: Local Model (Future - Phase 3+)
```typescript
// For cost optimization, consider local models:
// - sentence-transformers/all-MiniLM-L6-v2 (384 dims)
// - BAAI/bge-small-en-v1.5 (384 dims)
```

---

## 🔎 Search Implementation

### Hybrid Search (Semantic + Traditional):
```typescript
// app/api/search/route.ts
import { db } from '@apex/db';
import { products } from '@apex/db/schema';
import { generateEmbedding } from '@/lib/embeddings';
import { sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  
  if (!query) {
    return Response.json({ results: [] });
  }
  
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // Vector similarity search
  const results = await db.execute(sql`
    SELECT 
      id,
      name,
      description,
      price,
      image_url,
      (1 - (embedding <=> ${queryEmbedding}::vector)) as similarity
    FROM products
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT 20
  `);
  
  // Filter by similarity threshold (0.7 = 70% similar)
  const filtered = results.rows.filter(r => r.similarity > 0.7);
  
  return Response.json({ results: filtered });
}
```

### Hybrid Approach (Semantic + Keyword):
```typescript
export async function hybridSearch(query: string) {
  const queryEmbedding = await generateEmbedding(query);
  
  // Combine vector search with keyword boost
  const results = await db.execute(sql`
    WITH semantic AS (
      SELECT 
        id,
        (1 - (embedding <=> ${queryEmbedding}::vector)) * 0.7 as score
      FROM products
      WHERE embedding IS NOT NULL
    ),
    keyword AS (
      SELECT
        id,
        ts_rank(search_vector, plainto_tsquery(${query})) * 0.3 as score
      FROM products
      WHERE search_vector @@ plainto_tsquery(${query})
    )
    SELECT 
      p.*,
      COALESCE(s.score, 0) + COALESCE(k.score, 0) as final_score
    FROM products p
    LEFT JOIN semantic s ON p.id = s.id
    LEFT JOIN keyword k ON p.id = k.id
    WHERE COALESCE(s.score, 0) + COALESCE(k.score, 0) > 0.5
    ORDER BY final_score DESC
    LIMIT 20
  `);
  
  return results.rows;
}
```

---

## 🎨 Frontend Integration

### Search Component:
```typescript
// components/semantic-search.tsx
'use client';

import { useState, useEffect } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

export function SemanticSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then(data => {
        setResults(data.results);
        setLoading(false);
      });
  }, [debouncedQuery]);
  
  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="What are you looking for?"
        className="w-full px-4 py-2 border rounded"
      />
      
      {loading && <div>Searching...</div>}
      
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((product) => (
            <div key={product.id} className="p-4 border rounded">
              <h3>{product.name}</h3>
              <p className="text-sm text-gray-600">{product.description}</p>
              <p className="text-green-600">${product.price}</p>
              <span className="text-xs text-gray-400">
                Relevance: {(product.similarity * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🔄 Batch Embedding Generation

### For Existing Products:
```typescript
// scripts/generate-embeddings.ts
import { db } from '@apex/db';
import { products } from '@apex/db/schema';
import { generateEmbedding } from '@/lib/embeddings';
import { sql } from 'drizzle-orm';

async function generateAllEmbeddings() {
  const allProducts = await db.select().from(products);
  
  console.log(`Generating embeddings for ${allProducts.length} products...`);
  
  for (const product of allProducts) {
    const searchText = `${product.name} ${product.description || ''} ${product.category || ''}`;
    const embedding = await generateEmbedding(searchText);
    
    await db.update(products)
      .set({ embedding })
      .where(sql`id = ${product.id}`);
    
    console.log(`✓ ${product.name}`);
    
    // Rate limit to avoid API throttling
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('✅ All embeddings generated!');
}

generateAllEmbeddings();
```

---

## 📊 Performance Optimization

### 1. Index Tuning:
```sql
-- Adjust lists parameter based on dataset size
-- Rule: lists = rows / 1000 (for 10k products → 10 lists)

DROP INDEX IF EXISTS products_embedding_idx;

CREATE INDEX products_embedding_idx ON products 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Rebuild index periodically
REINDEX INDEX products_embedding_idx;
```

### 2. Caching Strategy:
```typescript
// Cache popular searches
import { redis } from '@apex/redis';

export async function cachedSearch(query: string) {
  const cacheKey = `search:${query.toLowerCase()}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Perform search
  const results = await hybridSearch(query);
  
  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(results));
  
  return results;
}
```

---

## 🧪 Testing Protocol

### Test 1: Semantic Understanding
```typescript
test('Finds kettles when searching for "boil water"', async () => {
  const results = await searchProducts('boil water');
  
  const kettleFound = results.some(p => 
    p.name.toLowerCase().includes('kettle') ||
    p.category === 'Kitchen Appliances'
  );
  
  expect(kettleFound).toBe(true);
});
```

### Test 2: Similarity Threshold
```typescript
test('Filters out low-relevance results', async () => {
  const results = await searchProducts('laptop');
  
  // All results should be tech-related, no kitchen items
  const irrelevant = results.some(p => 
    p.category === 'Kitchen' || p.category === 'Clothing'
  );
  
  expect(irrelevant).toBe(false);
});
```

---

## 💰 Cost Management

### OpenAI Pricing (ada-002):
- $0.0001 per 1K tokens
- Average product: ~100 tokens
- 10,000 products: ~$0.10

### Optimization Strategies:
1. **Generate Once**: Only on product create/update
2. **Batch Processing**: Use `/v1/embeddings` with multiple inputs
3. **Cache Queries**: Store embedding for common searches
4. **Local Fallback**: Use keyword search if embedding fails

---

## 🎯 Phase 2 Application

### Store-#37: Semantic Search
- Vector search with pgvector ✅
- Hybrid scoring (70% semantic + 30% keyword) ✅
- Real-time query debouncing ✅
- Relevance scoring display ✅

### Future Enhancements (Phase 3+):
- Product recommendations (similar products)
- Visual search (image embeddings)
- Multi-lingual search
- Local model deployment (cost reduction)

---

*Last Updated*: 2026-01-30  
*Phase*: 2 (Tenant MVP)  
*Status*: Active Protocol 🔍
