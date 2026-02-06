-- Quick Demo Tenant Setup Script
-- Run this to create demo-store tenant with sample data

-- 1. Create tenant in public schema
INSERT INTO public.tenants (id, subdomain, name, status, created_at, updated_at)
VALUES (
    'demo-store-123',
    'demo-store',
    'Demo Store',
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (subdomain) DO NOTHING;

-- 2. Create tenant schema
CREATE SCHEMA IF NOT EXISTS tenant_demo_store_123;

-- 3. Create tables in tenant schema
CREATE TABLE IF NOT EXISTS tenant_demo_store_123.banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    cta_text VARCHAR(100),
    cta_url VARCHAR(255),
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_demo_store_123.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_demo_store_123.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    image_url TEXT,
    description TEXT,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_demo_store_123.promotions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_percent INTEGER,
    banner_url TEXT,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_demo_store_123.testimonials (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    product_name VARCHAR(255),
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_demo_store_123.order_items (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES tenant_demo_store_123.products(id),
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Insert sample data
-- Hero Banners
INSERT INTO tenant_demo_store_123.banners (title, subtitle, image_url, cta_text, cta_url, priority) VALUES
('Summer Sale 2026', 'Get up to 50% off on selected items', 'https://picsum.photos/1200/400?random=1', 'Shop Now', '/products', 1),
('New Arrivals', 'Check out our latest collection', 'https://picsum.photos/1200/400?random=2', 'Explore', '/new', 2);

-- Products
INSERT INTO tenant_demo_store_123.products (name, description, price, image_url, stock) VALUES
('Wireless Headphones', 'Premium sound quality with noise cancellation', 99.99, 'https://picsum.photos/300/300?random=10', 50),
('Smart Watch', 'Track your fitness and stay connected', 249.99, 'https://picsum.photos/300/300?random=11', 30),
('Laptop Bag', 'Durable and stylish laptop carrier', 49.99, 'https://picsum.photos/300/300?random=12', 100),
('USB-C Cable', 'Fast charging and data transfer', 19.99, 'https://picsum.photos/300/300?random=13', 200),
('Bluetooth Speaker', 'Portable speaker with amazing bass', 79.99, 'https://picsum.photos/300/300?random=14', 75),
('Wireless Mouse', 'Ergonomic design for comfort', 29.99, 'https://picsum.photos/300/300?random=15', 150),
('Keyboard', 'Mechanical keyboard for gaming', 89.99, 'https://picsum.photos/300/300?random=16', 60),
('Webcam HD', '1080p video quality', 69.99, 'https://picsum.photos/300/300?random=17', 40);

-- Categories
INSERT INTO tenant_demo_store_123.categories (name, slug, image_url, is_featured) VALUES
('Electronics', 'electronics', 'https://picsum.photos/200/200?random=20', true),
('Fashion', 'fashion', 'https://picsum.photos/200/200?random=21', true),
('Home & Living', 'home-living', 'https://picsum.photos/200/200?random=22', true),
('Beauty', 'beauty', 'https://picsum.photos/200/200?random=23', true),
('Sports', 'sports', 'https://picsum.photos/200/200?random=24', true),
('Books', 'books', 'https://picsum.photos/200/200?random=25', true);

-- Promotions
INSERT INTO tenant_demo_store_123.promotions (title, description, discount_percent, is_active, starts_at, ends_at) VALUES
('Flash Sale', '24 hours only - Limited stock!', 30, true, NOW(), NOW() + INTERVAL '1 day'),
('Clearance Deal', 'End of season sale', 50, true, NOW(), NOW() + INTERVAL '7 days'),
('Buy 1 Get 1 Free', 'Selected items only', 50, true, NOW(), NOW() + INTERVAL '3 days');

-- Testimonials
INSERT INTO tenant_demo_store_123.testimonials (customer_name, rating, review_text, product_name, is_published) VALUES
('John Doe', 5, 'Amazing quality and fast shipping! Highly recommend.', 'Wireless Headphones', true),
('Sarah Smith', 5, 'Best purchase I made this year. Love it!', 'Smart Watch', true),
('Mike Johnson', 4, 'Good product, worth the price.', 'Bluetooth Speaker', true),
('Emma Wilson', 5, 'Excellent customer service and great product.', 'Laptop Bag', true),
('David Brown', 5, 'Fast delivery and product exactly as described.', 'Wireless Mouse', true),
('Lisa Anderson', 4, 'Very satisfied with my purchase!', 'Keyboard', true);

-- Order items (simulate sales for best sellers)
INSERT INTO tenant_demo_store_123.order_items (product_id, quantity) 
SELECT id, (random() * 50 + 10)::int FROM tenant_demo_store_123.products;
