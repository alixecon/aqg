# دليل النشر للاختبار التجريبي — Beta Deployment Guide

## نظرة عامة على البنية

في وضع الإنتاج، يخدم Express كلاً من الـ API والـ React app من عملية واحدة:

```
Internet
   │
   ▼
Railway / Render  (منفذ واحد)
   │
   ├── /api/*        ←  Express routes
   └── /*            ←  React SPA (server/public/index.html)
```

---

## الخيار الأول: Railway (الأسرع — ~5 دقائق)

### 1. ارفع الكود على GitHub

```bash
cd arabic-quiz-generator
git init
git add .
git commit -m "initial commit"

# أنشئ مستودعاً جديداً على github.com ثم:
git remote add origin https://github.com/YOUR_USERNAME/arabic-quiz-generator.git
git push -u origin main
```

### 2. أنشئ مشروعاً على Railway

1. اذهب إلى **https://railway.app** وسجّل دخولك بحساب GitHub
2. اضغط **"New Project"** ← **"Deploy from GitHub repo"**
3. اختر مستودع `arabic-quiz-generator`
4. Railway سيكتشف `railway.json` تلقائياً

### 3. أضف متغيرات البيئة

في لوحة تحكم Railway ← **Variables** ← **Add Variable**:

| المتغير | القيمة |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-xxxxxxxxxxxxxxxx` |
| `NODE_ENV` | `production` |
| `MAX_FILE_SIZE_MB` | `20` |

### 4. انتظر البناء

Railway سيُشغّل تلقائياً:
```
npm install --prefix server
npm run build
  └── cd client && npm install && vite build
  └── node scripts/copy-build.js  (client/dist → server/public)
npm start
  └── NODE_ENV=production node server/index.js
```

### 5. احصل على الرابط

بعد اكتمال البناء، Railway يعطيك رابطاً مثل:
```
https://arabic-quiz-generator-production.up.railway.app
```

---

## الخيار الثاني: Render.com (مجاني تماماً)

### 1. ارفع الكود على GitHub (نفس الخطوات أعلاه)

### 2. أنشئ Web Service

1. اذهب إلى **https://render.com** ← **New** ← **Web Service**
2. اربطه بمستودع GitHub
3. Render سيقرأ `render.yaml` تلقائياً

### 3. أضف ANTHROPIC_API_KEY

في **Environment** ← **Add Environment Variable**:
```
ANTHROPIC_API_KEY = sk-ant-xxxxxxxxxxxxxxxx
```

### 4. اضغط "Create Web Service"

**ملاحظة:** الخطة المجانية في Render تُوقف التطبيق بعد 15 دقيقة من عدم النشاط،
وتستغرق ~30 ثانية للإيقاظ من جديد. مناسب للاختبار التجريبي.

---

## التحقق من نجاح النشر

بعد الحصول على الرابط، تحقق من:

```bash
# 1. Health check
curl https://YOUR-APP-URL/api/health
# المتوقع: {"status":"ok","env":"production"}

# 2. افتح المتصفح
open https://YOUR-APP-URL
```

---

## أوامر مفيدة (محلياً)

```bash
# اختبر البناء محلياً قبل النشر
npm run build
npm start
open http://localhost:3001

# تحقق من حجم الـ bundle
ls -lh server/public/assets/
```

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---|---|
| `server/public not found` | تأكد أن `npm run build` نجح وأن `copy-build.js` اكتمل |
| `ANTHROPIC_API_KEY` خطأ | تحقق من المتغير في لوحة التحكم — لا مسافات قبل/بعد القيمة |
| الصفحة تُعيد 404 | تأكد أن SPA fallback مُفعَّل (يكون تلقائياً إذا `NODE_ENV=production`) |
| رفع الملف يفشل | تأكد أن `server/uploads/` موجود — Railway ينشئه تلقائياً |
| بطء شديد (Render) | الخطة المجانية تُوقف التطبيق — الطلب الأول يستغرق 30 ثانية |

---

## إيقاف النشر التجريبي

**Railway:** في لوحة التحكم ← Settings ← **Delete Service**

**Render:** في لوحة التحكم ← Settings ← **Delete Web Service**

---

## ملاحظات الأمان للنشر التجريبي

- ✅ لا تُخزَّن الملفات — تُحذف فور استخراج النص
- ✅ النص يُخزَّن في الذاكرة فقط (sessionStore) وينتهي بعد 30 دقيقة
- ⚠️ لا يوجد rate limiting — أضفه قبل الإطلاق العام
- ⚠️ لا يوجد تحقق من هوية المستخدمين — مناسب للاختبار فقط
- ⚠️ شارك الرابط مع المختبِرين الموثوقين فقط
