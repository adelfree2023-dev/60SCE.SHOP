# ⚡ PERFORMANCE & COMPONENT LOGIC (v1.0)

Speed is a Core Feature.

## 1. 🚀 STOREFRONT BUDGETS
*   **LCP (Largest Contentful Paint):** < 1.5s (Strong Rule).
*   **JS Bundle:** < 100KB initial, < 200KB total per page.
*   **Strategy:** Server Components by default. Use `"use client"` ONLY for interactive islands.

## 2. 🐻 STATE MANAGEMENT
*   **Client State:** Use **Zustand**. Partition stores by domain (Cart, UI, Auth).
*   **Server State:** Use **React Query** (or Next.js cache) for server data.
*   **Decoupling:** NEVER put raw server data in Zustand. Keep them separate.

## 3. 🔄 PROGRESSIVE INTERACTIVITY
*   Use `Suspense` with skeletons for all async data.
*   Implement **Optimistic UI** for high-frequency actions (Add to Cart).
