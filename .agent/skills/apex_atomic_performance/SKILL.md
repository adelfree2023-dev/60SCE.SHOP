# ⚡ Atomic Performance & Component Logic (v2.0)

**Focus**: Performance Optimization (6) & Front-end Component Logic (11).

---

## 🎯 The Performance Constitution
In a million-user system, speed is not a luxury—it's constitutional law. Any Storefront component must pass the **1.5-second loading test**.

## 🚀 Root Solutions (Performance)
- **Zero-JS Delivery**: Utilize Next.js 16 Server Components by default to deliver 0KB of JavaScript for static/read-only parts of the page.
- **Resource Budgeting**: 
    - Initial JS: < 100KB
    - Total JS: < 200KB
    - LCP: < 1.5s (Hard Limit)
- **Strategic Caching**: Mandatory ISR (Incremental Static Regeneration) or Edge Caching for product catalogs.

## 🧱 Front-end Component Logic (Requirement 11)
- **Complex State Management**: Utilize Zustand for global client-side state and React Query for server-cache state. Avoid `useState` for complex business logic.
- **Lifecycle Mastery**: Ensure proper cleanup of WebSockets, event listeners, and timers in `useEffect`.
- **Progressive Interactivity**: Use "Islands Architecture" pattern—keep components server-side until interaction is strictly required.

## 🧪 Verification Protocol
1. **Lighthouse Score**: Must achieve > 90 Performance.
2. **Bundle Analysis**: Run `bun build --analyze` to identify and cut bloating dependencies.
3. **FMA (Failure Mode Analysis)**: Components must handle "API Down" and "Slow 3G" modes gracefully with skeletons or stale data.
