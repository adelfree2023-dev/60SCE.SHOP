# 🎨 FRONTEND LAW: NEXT.JS 16 + RADIX + TAILWIND

## 1. FRAMEWORK (NEXT.JS 14)
*   Use **App Router** exclusively.
*   Leverage **Server Actions** for all form mutations (Experimental/Stable).
*   Strict TypeScript implementation.

## 2. STYLING & COMPONENTS
*   **TailwindCSS:** NO inline styles. Use utility classes.
*   **Radix UI:** Use for all accessible primitives (Modals, Dropdowns).
*   **NativeWind:** Ensure styles are compatible with Mobile Strategy (Architecture.md).

## 3. STATE & DATA FETCHING
*   **Zustand:** Use for global client-side state (Cart, User session).
*   **Server Components:** Fetch data as high as possible in the tree.
*   **Suspense:** All data-heavy pages must have a `loading.tsx` skeleton.

## 4. TENANT BRANDING
*   Colors and Logos MUST be fetched from the `tenant-config` API.
*   Never hardcode brand assets.
