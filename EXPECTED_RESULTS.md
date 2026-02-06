# Store-#01 Expected Results Guide

## 🌐 What Should Appear on Each URL

### 1. **Storefront Homepage**: http://34.102.116.215:3002

**Expected View**: Next.js Landing Page

Since no tenant is specified in the URL, you should see a **fallback landing page** with:

```
┌─────────────────────────────────────┐
│   Apex V2 Storefront                │
│                                     │
│   Navigate to /[tenantId] to view  │
│   a tenant storefront               │
│                                     │
│   Example: /demo-store              │
└─────────────────────────────────────┘
```

**To see the actual storefront**, navigate to:
- `http://34.102.116.215:3002/demo-store` (requires tenant to exist)

---

### 2. **Tenant Storefront**: http://34.102.116.215:3002/demo-store

**Expected View**: Full E-commerce Home Page

If tenant "demo-store" exists in database, you should see:

#### **Header Section**
- Tenant logo (if configured)
- Store name: "Demo Store"
- Navigation: Home | Products | Categories | Cart

#### **Hero Banner** (if banners exist)
- Full-width background image
- Large heading text
- Subtitle (optional)
- Call-to-Action button

#### **Best Sellers Section** (if products exist)
- Grid layout (4 columns on desktop)
- Product cards showing:
  - Product image
  - Product name
  - Description
  - Price in large text
  - "Add to Cart" button

#### **Featured Categories** (if categories exist)
- 6-column grid
- Category images
- Category names
- Product count

#### **Promotions Section** (if active promos exist)
- 3 promotional cards
- Gradient backgrounds
- Discount percentages
- Optional banner images

#### **Testimonials Section** (if reviews exist)
- 3-column grid
- Customer reviews
- 5-star ratings
- Customer names

#### **Footer**
- Store information
- Quick links (About, Contact, Terms)
- Customer service links (FAQs, Shipping, Returns)
- Social media links
- Copyright notice

**⚠️ Current Issue**: 
If tenant doesn't exist, you'll see **404 Not Found** page.

---

### 3. **Backend API Root**: http://34.102.116.215:3001

**Expected Response**: HTTP Error or Welcome Message

Since no route is defined at root (`/`), you'll likely see:

```json
{
  "statusCode": 404,
  "message": "Cannot GET /",
  "error": "Not Found"
}
```

**OR** if there's a root controller:

```json
{
  "status": "ok",
  "message": "Apex V2 API Server",
  "version": "1.0.0"
}
```

---

### 4. **Backend API - Home Data**: http://34.102.116.215:3001/storefront/demo-store/home

**Expected Response**: JSON with tenant home page data

```json
{
  "tenant": {
    "id": "tent_123abc",
    "name": "Demo Store",
    "subdomain": "demo-store",
    "logoUrl": "https://example.com/logo.png",
    "primaryColor": "#3B82F6"
  },
  "sections": {
    "hero": [
      {
        "id": "banner_1",
        "title": "Summer Sale 2026",
        "subtitle": "Get up to 50% off on selected items",
        "image_url": "https://example.com/banner.jpg",
        "cta_text": "Shop Now",
        "cta_url": "/products",
        "priority": 1
      }
    ],
    "bestSellers": [
      {
        "id": "prod_1",
        "name": "Wireless Headphones",
        "description": "Premium sound quality",
        "price": 99.99,
        "image_url": "https://example.com/headphones.jpg",
        "stock": 50,
        "total_sold": 245
      }
    ],
    "categories": [
      {
        "id": "cat_1",
        "name": "Electronics",
        "slug": "electronics",
        "image_url": "https://example.com/electronics.jpg",
        "product_count": 125
      }
    ],
    "promotions": [
      {
        "id": "promo_1",
        "title": "Flash Sale",
        "description": "24 hours only",
        "discount_percent": 30,
        "starts_at": "2026-01-30T00:00:00Z",
        "ends_at": "2026-01-31T23:59:59Z"
      }
    ],
    "testimonials": [
      {
        "id": "test_1",
        "customer_name": "John Doe",
        "rating": 5,
        "review_text": "Amazing quality and fast shipping!",
        "product_name": "Wireless Headphones",
        "created_at": "2026-01-25T10:30:00Z"
      }
    ]
  },
  "metadata": {
    "lastUpdated": "2026-01-30T15:25:00.000Z",
    "cacheTTL": 300
  }
}
```

**⚠️ Current Issue**:
If tenant doesn't exist:
```json
{
  "statusCode": 404,
  "message": "Tenant demo-store not found",
  "error": "Not Found"
}
```

---

## 🔧 Current Service Status

Based on checks:
- ✅ **Docker Services**: All running (PostgreSQL, Redis, MinIO, Traefik)
- ⏳ **Backend API (port 3001)**: Needs verification
- ✅ **Storefront (port 3002)**: Running

---

## 🎯 To Test Properly

### Option 1: Create Test Tenant First
```bash
# On server
cd ~/apex-v2
bun scripts/provision-tenant.ts --subdomain demo-store --name "Demo Store"
```

### Option 2: Test with Existing Tenant
If you already have a tenant, use that subdomain instead of "demo-store"

### Option 3: View Fallback Pages Only
- Storefront root: http://34.102.116.215:3002 (should work)
- Backend 404: http://34.102.116.215:3001 (expected error)

---

**Next Steps**:
1. Check if ports 3001 and 3002 are accessible from your location
2. Provision a test tenant if needed
3. Test with actual tenant subdomain

