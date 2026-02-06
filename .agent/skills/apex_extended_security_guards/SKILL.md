---
name: apex_extended_security_guards
description: Implements tenant-scoped routing guards with auth and tenant validation for all protected routes.
---

# 🛡️ Extended Security Guards Protocol

**Philosophy**: Security is not just in the database—it's in every route.

**Rule**: Every protected page must pass **2-gate validation**: Auth + Tenant Scope.

---

## 🎯 The Two-Gate System

### Gate 1: Authentication
> "Is the user logged in?"

### Gate 2: Tenant Scoping
> "Does this user belong to THIS tenant, not another?"

**Example Attack Vector**:
- User from `tenant-a.apex.com` tries to access `tenant-b.apex.com/admin`
- Without Gate 2, they might see Tenant B's data!

---

## 🏗️ Implementation Architecture

### Middleware Chain:
```
Request → [Auth Check] → [Tenant Check] → [Route Handler]
           ↓ Fail           ↓ Fail
        Redirect Login   Return 403
```

---

## 🔐 Guard Implementation

### File: `middleware.ts` (Next.js 16)
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;
  
  // Extract tenant subdomain
  const subdomain = hostname.split('.')[0];
  
  // Protected routes pattern
  const protectedPaths = [
    '/account',
    '/orders',
    '/admin',
    '/checkout'
  ];
  
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));
  
  if (!isProtected) {
    return NextResponse.next();
  }
  
  // ===== GATE 1: Authentication =====
  const token = await getToken({ req: request, secret: process.env.JWT_SECRET });
  
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // ===== GATE 2: Tenant Scoping =====
  const userTenant = token.tenantSubdomain as string; // From JWT
  
  if (userTenant !== subdomain) {
    console.warn(`[SECURITY] Tenant mismatch: user=${userTenant}, requested=${subdomain}`);
    return new NextResponse('Forbidden: Cross-tenant access denied', { status: 403 });
  }
  
  // ===== GATE 3: Role-Based Access (Admin routes) =====
  if (pathname.startsWith('/admin')) {
    const userRole = token.role as string;
    
    if (userRole !== 'admin' && userRole !== 'owner') {
      return new NextResponse('Forbidden: Admin access required', { status: 403 });
    }
  }
  
  // All gates passed ✅
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/account/:path*',
    '/orders/:path*',
    '/admin/:path*',
    '/checkout/:path*'
  ]
};
```

---

## 🔑 JWT Token Structure

### Required Claims:
```typescript
interface ApexJWT {
  userId: string;
  email: string;
  tenantId: string;            // Database ID
  tenantSubdomain: string;     // For domain matching
  role: 'customer' | 'staff' | 'admin' | 'owner';
  iat: number;
  exp: number;
}
```

### Token Generation (NextAuth):
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { AuthOptions } from 'next-auth';

export const authOptions: AuthOptions = {
  providers: [/* ... */],
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.tenantId = user.tenantId;
        token.tenantSubdomain = user.tenant.subdomain;
        token.role = user.role;
      }
      return token;
    },
    
    async session({ session, token }) {
      session.user.id = token.userId;
      session.user.tenantId = token.tenantId;
      session.user.role = token.role;
      return session;
    }
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  }
};

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

## 🎯 Route-Level Guards

### Server Component Guard:
```typescript
// app/account/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login?redirect=/account');
  }
  
  // Session is guaranteed here
  return (
    <div>
      <h1>Welcome, {session.user.email}</h1>
      {/* ... */}
    </div>
  );
}
```

### Client Component Guard (Hook):
```typescript
// hooks/use-require-auth.ts
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useRequireAuth(redirectUrl = '/login') {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push(`${redirectUrl}?redirect=${window.location.pathname}`);
    }
  }, [session, status, router, redirectUrl]);
  
  return session;
}

// Usage:
export function AccountSettings() {
  const session = useRequireAuth();
  
  if (!session) {
    return <LoadingSpinner />;
  }
  
  return <div>{/* Settings UI */}</div>;
}
```

---

## 🧪 Security Testing Protocol

### Test 1: Unauthenticated Access
```typescript
test('Redirects to login when accessing protected page', async ({ page }) => {
  await page.goto('/account');
  
  await page.waitForURL(/\/login/);
  expect(page.url()).toContain('/login?redirect=/account');
});
```

### Test 2: Cross-Tenant Access Prevention
```typescript
test('Blocks cross-tenant access', async ({ page, context }) => {
  // Login as user from tenant-a
  await page.goto('https://tenant-a.apex.local/login');
  await page.fill('[name="email"]', 'user-a@example.com');
  await page.click('button:text("Login")');
  
  // Try to access tenant-b
  const response = await page.goto('https://tenant-b.apex.local/account');
  
  expect(response.status()).toBe(403);
  expect(await page.textContent('body')).toContain('Forbidden');
});
```

### Test 3: Admin Route Protection
```typescript
test('Blocks non-admin from admin pages', async ({ page }) => {
  // Login as regular customer
  await page.goto('/login');
  await page.fill('[name="email"]', 'customer@example.com');
  await page.click('button:text("Login")');
  
  const response = await page.goto('/admin');
  
  expect(response.status()).toBe(403);
});
```

---

## 🔒 Additional Security Layers

### CSRF Protection:
```typescript
// Use NextAuth's built-in CSRF tokens
// Already handled by NextAuth for API routes
```

### Rate Limiting (S6 Integration):
```typescript
// middleware.ts (add after tenant check)
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function middleware(request: NextRequest) {
  // ... auth & tenant checks ...
  
  // Rate limit by IP + Tenant
  const identifier = `${request.ip}-${subdomain}`;
  
  try {
    await limiter.check(identifier, 100); // 100 req/min per IP/tenant
  } catch {
    return new NextResponse('Too Many Requests', { status: 429 });
  }
  
  return NextResponse.next();
}
```

---

## 📋 Guard Checklist (Phase 2)

### Store-#15: My Account
- [x] Auth guard (Gate 1)
- [x] Tenant scope guard (Gate 2)
- [x] Session validation
- [x] CSRF protection

### Admin-#01: Inventory Management
- [x] Auth guard
- [x] Tenant scope guard
- [x] Role-based guard (admin only)
- [x] Audit logging (S4)

### Store-#06: Checkout
- [x] Auth guard (optional - allow guest checkout)
- [x] Tenant scope guard
- [x] Rate limiting (prevent abuse)

---

## 🚫 Common Vulnerabilities PREVENTED

✅ **Session Hijacking**: JWT in HttpOnly cookies  
✅ **Cross-Tenant Data Leak**: Middleware tenant check  
✅ **CSRF Attacks**: NextAuth CSRF tokens  
✅ **Brute Force**: Rate limiting (S6)  
✅ **SQL Injection**: Tenant isolation (S2) + Zod validation (S3)  

---

## 🎯 Constitutional Enforcement

**Hard Gate**: No route can be deployed without:
1. Documented guard logic
2. Test coverage for auth + tenant checks
3. Audit log entry for sensitive actions (S4)

**Security Review Required**: For any middleware changes.

---

*Last Updated*: 2026-01-30  
*Phase*: 2 (Tenant MVP)  
*Status*: Active Protocol 🛡️
