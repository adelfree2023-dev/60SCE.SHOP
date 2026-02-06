---
name: apex_defensive_forms
description: Implements double-gate form validation using Zod on both client (UX) and server (security) with React Hook Form.
---

# 🏗️ Defensive Form Architecture Protocol

**Philosophy**: Never trust the client. Always verify the server.

**Rule**: Every form must pass through **Double-Gate Validation**:
1. **Gate 1** (Client): Instant feedback for UX
2. **Gate 2** (Server): Strict security enforcement

---

## 🎯 The Double-Gate System

```
User Input
    ↓
┌─────────────────────────┐
│  Gate 1: Client (Zod)   │ → Immediate feedback, prevent typos
└─────────────────────────┘
    ↓
Submit to Server
    ↓
┌─────────────────────────┐
│  Gate 2: Server (Zod)   │ → Security enforcement, prevent malicious input
└─────────────────────────┘
    ↓
Database
```

**Key**: Use the **SAME Zod schema** on both sides!

---

## 📐 Schema-First Development

### Step 1: Define Schema (Shared)
```typescript
// shared/schemas/checkout.ts
import { z } from 'zod';

export const checkoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  
  address: z.object({
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code'),
    country: z.string().length(2, 'Use 2-letter country code'),
  }),
  
  paymentMethod: z.enum(['card', 'paypal', 'bank_transfer']),
  
  cardDetails: z.object({
    number: z.string().regex(/^\d{16}$/, 'Card number must be 16 digits'),
    expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format: MM/YY'),
    cvv: z.string().regex(/^\d{3,4}$/, 'CVV must be 3-4 digits'),
  }).optional(),
  
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to terms' })
  }),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
```

---

## 🎨 Gate 1: Client-Side Validation

### Component: Checkout Form
```typescript
// app/checkout/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, type CheckoutFormData } from '@/shared/schemas/checkout';
import { useState } from 'react';

export default function CheckoutPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onBlur' // Validate on blur for better UX
  });
  
  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    setServerError('');
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Checkout failed');
      }
      
      const { orderId } = await response.json();
      
      // Redirect to success page
      window.location.href = `/orders/${orderId}/success`;
    } catch (error) {
      setServerError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          type="email"
          id="email"
          {...register('email')}
          className={`mt-1 block w-full rounded border ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>
      
      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium">
          Full Name
        </label>
        <input
          type="text"
          id="fullName"
          {...register('fullName')}
          className={`mt-1 block w-full rounded border ${
            errors.fullName ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
        )}
      </div>
      
      {/* Address Fields */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-medium">Shipping Address</legend>
        
        <input
          type="text"
          placeholder="Street Address"
          {...register('address.street')}
          className="block w-full rounded border border-gray-300"
        />
        {errors.address?.street && (
          <p className="text-sm text-red-600">{errors.address.street.message}</p>
        )}
        
        {/* ...other address fields... */}
      </fieldset>
      
      {/* Terms Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="terms"
          {...register('agreedToTerms')}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="terms" className="ml-2 text-sm">
          I agree to the Terms and Conditions
        </label>
      </div>
      {errors.agreedToTerms && (
        <p className="text-sm text-red-600">{errors.agreedToTerms.message}</p>
      )}
      
      {/* Server Error */}
      {serverError && (
        <div className="rounded bg-red-50 p-4 text-red-800">
          {serverError}
        </div>
      )}
      
      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {isSubmitting ? 'Processing...' : 'Complete Order'}
      </button>
    </form>
  );
}
```

---

## 🛡️ Gate 2: Server-Side Validation

### API Route: Checkout
```typescript
// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { checkoutSchema } from '@/shared/schemas/checkout';
import { db } from '@apex/db';
import { orders } from '@apex/db/schema';
import { getServerSession } from 'next-auth';

export async function POST(req: Request) {
  // ===== GATE 2A: Schema Validation =====
  const body = await req.json();
  
  const validation = checkoutSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: 'Validation failed',
        details: validation.error.format()
      },
      { status: 400 }
    );
  }
  
  const data = validation.data;
  
  // ===== GATE 2B: Business Logic Validation =====
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Verify user belongs to this tenant (S2)
  const tenantId = getTenantIdFromRequest(req);
  if (session.user.tenantId !== tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // ===== GATE 2C: Additional Checks =====
  // Check if cart is not empty
  const cart = await getCart(session.user.id);
  if (cart.items.length === 0) {
    return NextResponse.json(
      { error: 'Cart is empty' },
      { status: 400 }
    );
  }
  
  // Verify stock availability
  const stockCheck = await verifyStock(cart.items);
  if (!stockCheck.available) {
    return NextResponse.json(
      { error: `Out of stock: ${stockCheck.unavailableItems.join(', ')}` },
      { status: 409 }
    );
  }
  
  // ===== Create Order =====
  try {
    const order = await db.transaction(async (tx) => {
      // Create order
      const [newOrder] = await tx.insert(orders).values({
        userId: session.user.id,
        tenantId,
        email: data.email,
        fullName: data.fullName,
        shippingAddress: data.address,
        total: cart.total,
        status: 'pending',
      }).returning();
      
      // Create order items (from cart)
      // ...
      
      // Clear cart
      await clearCart(session.user.id);
      
      // Audit log (S4)
      await logAudit({
        userId: session.user.id,
        action: 'ORDER_CREATED',
        tenantId,
        resourceId: newOrder.id,
      });
      
      return newOrder;
    });
    
    // Process payment (Stripe, etc.)
    // ...
    
    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Checkout failed. Please try again.' },
      { status: 500 }
    );
  }
}
```

---

## 📤 Bulk Import Form (Admin-#21)

### Schema:
```typescript
// shared/schemas/bulk-import.ts
export const productImportSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 5_000_000, 'File size must be less than 5MB')
    .refine(
      file => ['text/csv', 'application/vnd.ms-excel'].includes(file.type),
      'Only CSV files are allowed'
    ),
  
  options: z.object({
    skipFirstRow: z.boolean().default(true),
    updateExisting: z.boolean().default(false),
    validateOnly: z.boolean().default(false),
  }),
});

// Row schema for CSV validation
export const productRowSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  price: z.coerce.number().positive('Price must be positive'),
  stock: z.coerce.number().int().nonnegative('Stock must be non-negative'),
  category: z.string().optional(),
});
```

### Client:
```typescript
// app/admin/import/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productImportSchema } from '@/shared/schemas/bulk-import';

export default function BulkImportPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(productImportSchema)
  });
  
  const onSubmit = async (data: any) => {
    const formData = new FormData();
    formData.append('file', data.file[0]);
    formData.append('options', JSON.stringify(data.options));
    
    const response = await fetch('/api/admin/import', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('Import result:', result);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="file" {...register('file')} accept=".csv" />
      {errors.file && <p className="text-red-600">{errors.file.message}</p>}
      
      <label>
        <input type="checkbox" {...register('options.skipFirstRow')} />
        Skip first row (headers)
      </label>
      
      <button type="submit">Import</button>
    </form>
  );
}
```

### Server:
```typescript
// app/api/admin/import/route.ts
import { productImportSchema, productRowSchema } from '@/shared/schemas/bulk-import';
import Papa from 'papaparse';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const options = JSON.parse(formData.get('options') as string);
  
  // Validate file
  const validation = productImportSchema.safeParse({ file, options });
  if (!validation.success) {
    return Response.json({ error: validation.error }, { status: 400 });
  }
  
  // Parse CSV
  const text = await file.text();
  const { data: rows } = Papa.parse(text, { header: true });
  
  // Validate each row
  const errors: any[] = [];
  const validRows: any[] = [];
  
  rows.forEach((row, index) => {
    const result = productRowSchema.safeParse(row);
    if (!result.success) {
      errors.push({ row: index + 1, errors: result.error.format() });
    } else {
      validRows.push(result.data);
    }
  });
  
  if (errors.length > 0) {
    return Response.json({
      error: 'Validation failed',
      errors,
      validCount: validRows.length,
      errorCount: errors.length
    }, { status: 400 });
  }
  
  // Import valid rows
  // ...
  
  return Response.json({ imported: validRows.length });
}
```

---

## 🧪 Testing Protocol

### Test 1: Client Validation
```typescript
test('Shows validation error on invalid email', async ({ page }) => {
  await page.goto('/checkout');
  await page.fill('[name="email"]', 'invalid-email');
  await page.fill('[name="fullName"]', 'John Doe');
  await page.blur('[name="email"]');
  
  await expect(page.locator('text=Invalid email address')).toBeVisible();
});
```

### Test 2: Server Rejects Invalid Data
```typescript
test('Server rejects tampered data', async () => {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      fullName: 'x', // Too short - should fail
      // ... other fields
    })
  });
  
  expect(response.status).toBe(400);
  const error = await response.json();
  expect(error.details.fullName._errors).toContain('Name must be at least 2 characters');
});
```

---

## 📏 Form Architecture Rules

### ✅ DO:
- Use same Zod schema on client + server
- Validate on blur (not on every keystroke)
- Show field-level errors inline
- Disable submit button while processing
- Handle server errors gracefully

### ❌ DON'T:
- Skip server validation ("client is enough")
- Use different schemas on client vs server
- Trust client-generated IDs or calculations
- Allow form resubmission without clearing state

---

## 🎯 Phase 2 Application

### Store-#06: Checkout
- Double-gate validation ✅
- Real-time client feedback ✅
- Server security enforcement ✅
- Transaction integrity ✅

### Admin-#21: Bulk Import
- CSV file validation ✅
- Row-by-row schema check ✅
- Error reporting with line numbers ✅
- Rollback on failure ✅

---

*Last Updated*: 2026-01-30  
*Phase*: 2 (Tenant MVP)  
*Status*: Active Protocol 🏗️
