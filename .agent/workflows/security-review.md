---
description: Mandatory Security Review to ensure code adheres to S1-S8 security protocols before server upload.
---

# 🛡️ MANDATORY SECURITY REVIEW WORKFLOW

> ⚠️ **هذا المشروع يخدم ملايين المستخدمين. لا يمكن قبول أي تقصير أمني.**

هذا الإجراء يجب تنفيذه **قبل كل رفع للخادم**. عدم الالتزام يعني مسؤولية هندسية كاملة.

---

## 🔐 المرحلة 1: فحص SQL Injection (S2)

### اختبار 1.1: منع حقن SQL في تبديل المستأجرين
```bash
// turbo
grep -r "SET search_path" apps/api --include="*.ts" | grep -v "pg-format"
```
**المتوقع**: لا نتائج. كل `SET search_path` يجب أن يستخدم `pg-format`.

### اختبار 1.2: كشف SQL Interpolation
```bash
// turbo
grep -rn "\${tenant" apps/api --include="*.ts" | grep -E "(SELECT|INSERT|UPDATE|DELETE|FROM)"
```
**المتوقع**: لا نتائج. منع استخدام `${tenantSchema}` في استعلامات SQL.

### اختبار 1.3: التحقق من استخدام pg-format
```bash
// turbo
grep -rn "import.*pg-format" apps/api --include="*.ts" packages --include="*.ts"
```
**المتوقع**: يجب وجود الاستيراد في أي ملف يتعامل مع dynamic schemas.

---

## 🔑 المرحلة 2: التشفير والأسرار (S7)

### اختبار 2.1: رفض الـ Salt الثابت
```bash
// turbo
grep -rn "STATIC_SALT\|HARDENED" packages/encryption --include="*.ts"
```
**المتوقع**: لا نتائج. Salt يجب أن يكون عشوائي `crypto.randomBytes(16)`.

### اختبار 2.2: التحقق من استخدام Argon2id
```bash
// turbo
grep -rn "argon2id\|argon2.hash" packages/encryption --include="*.ts"
```
**المتوقع**: يجب أن يوجد استخدام Argon2id لاشتقاق المفاتيح.

### اختبار 2.3: التأكد من JWT_SECRET الآمن
```bash
// turbo
grep -rn "JWT_SECRET" packages/config packages/encryption --include="*.ts"
```
**المتوقع**: يجب وجود validation يمنع `< 32 characters`.

---

## 🛡️ المرحلة 3: التحقق من المدخلات (S3)

### اختبار 3.1: فحص تطهير المدخلات العالمي
```bash
// turbo
grep -rn "DOMPurify\|sanitize" apps/api/src/common/pipes --include="*.ts"
```
**المتوقع**: ZodValidationPipe يستخدم DOMPurify لتطهير المدخلات.

### اختبار 3.2: التحقق من استخدام Zod في Controllers
```bash
// turbo
grep -rn "@UsePipes\|ZodValidation" apps/api/src/modules --include="*.controller.ts" | wc -l
```
**المتوقع**: رقم > 0. جميع Controllers الحساسة تستخدم ZodValidation.

---

## 📊 المرحلة 4: سجلات التدقيق (S4)

### اختبار 4.1: التحقق من توقيع HMAC
```bash
// turbo
grep -rn "createHmac\|signature" packages/audit --include="*.ts"
```
**المتوقع**: يجب وجود توقيع HMAC-SHA256 في AuditLoggerInterceptor.

### اختبار 4.2: التحقق من عدم قابلية التعديل
```
يجب التأكد من وجود trigger في قاعدة البيانات:
audit_immutable - لمنع UPDATE/DELETE على audit_logs
```

---

## ⏱️ المرحلة 5: Rate Limiting (S6)

### اختبار 5.1: تأكيد Rate Limiting على Auth
```bash
// turbo
grep -rn "@Throttle" apps/api/src/modules/auth --include="*.ts"
```
**المتوقع**: `/auth/login` يحتوي على `@Throttle` decorator.

### اختبار 5.2: التحقق من حظر IP التصاعدي
```bash
// turbo
grep -rn "violation\|block" packages/security/src/middlewares --include="*.ts"
```
**المتوقع**: يجب وجود منطق حظر IP تصاعدي.

---

## 🌐 المرحلة 6: CORS والأمان الخارجي (S8)

### اختبار 6.1: فحص إعدادات CORS
```bash
// turbo
grep -rn "localhost" apps/api/src/main.ts
```
**المتوقع في Production**: لا يجب وجود `localhost` في allowed origins.

### اختبار 6.2: التحقق من Helmet Headers
```bash
// turbo
grep -rn "unsafe-inline" apps/api --include="*.ts"
```
**المتوقع**: لا نتائج أو استخدام محدود مع nonce.

---

## ✅ المرحلة 7: التحقق من البيئة (S1)

### اختبار 7.1: فحص متطلبات Production
```bash
// turbo
grep -rn "NODE_ENV.*production" packages/config --include="*.ts"
```
**المتوقع**: يجب وجود checks تمنع أسرار افتراضية في production.

---

## 🚫 قائمة الرفض الفوري (Zero Tolerance)

| النمط | السبب |
|-------|-------|
| `${tenantSchema}` في SQL | حقن SQL |
| `STATIC_SALT` أو `HARDENED` | Salt ثابت يبطل التشفير |
| `sameSite: 'none'` | ثغرة CSRF |
| `password` column (بدون `_hash`) | تخزين غير آمن |
| Missing `@Throttle` on `/auth/login` | Brute force attack |

---

## 📋 نموذج التوقيع قبل الرفع

```
[ ] أكدت عدم وجود SQL Interpolation
[ ] أكدت استخدام Argon2id للتشفير
[ ] أكدت وجود Rate Limiting على Auth
[ ] أكدت توقيع سجلات التدقيق
[ ] أكدت تطهير المدخلات بـ DOMPurify
[ ] أكدت عدم وجود أسرار افتراضية

التاريخ: ____________
الاسم: ____________
```

---

> **الجودة ليست رفاهية. الأمان ليس اختياريًا. هذا المشروع يخدم ملايين البشر.**
