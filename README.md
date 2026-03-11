# مولّد الاختبارات العربي — Arabic Quiz Generator

## متطلبات التشغيل
- **Node.js** v18 أو أحدث — تحقق: `node -v`
- **npm** v9 أو أحدث
- **مفتاح Anthropic API** — من: https://console.anthropic.com

---

## 1. تثبيت الحزم

```bash
# من مجلد المشروع الجذر
npm install && npm run install:all
```

---

## 2. متغيرات البيئة

```bash
# server/.env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx   # ← ضروري
PORT=3001                                        # اختياري
MAX_FILE_SIZE_MB=20                              # اختياري
```

---

## 3. تشغيل التطبيق

```bash
# كلا الخادمين معاً
npm run dev

# أو منفصلَين
npm run dev:server   # Express على :3001
npm run dev:client   # Vite على :5173
```

افتح: **http://localhost:5173**

---

## كيف يتصل الـ Frontend بالـ Backend

```
React :5173  →  /api/*  →  vite proxy  →  Express :3001
```

لا CORS issues في وضع التطوير — Vite يعمل كـ reverse proxy.

---

## قائمة الاختبار

### Backend
- [ ] `GET :3001/api/health` → `{ status: "ok" }`
- [ ] رفع PDF → يرجع `{ text: "..." }`
- [ ] رفع DOCX → يرجع `{ text: "..." }`
- [ ] رفع PPTX → يرجع `{ text: "..." }`
- [ ] رفع .jpg → رسالة خطأ عربية
- [ ] generate بلا نص → رسالة خطأ عربية
- [ ] generate بنص صحيح → مصفوفة أسئلة JSON

### Frontend
- [ ] RTL صحيح في كل الصفحات
- [ ] Drag & drop يعمل
- [ ] Loader يظهر أثناء الرفع والتوليد
- [ ] MCQ: 4 خيارات عربية
- [ ] صح/خطأ: خياران
- [ ] إجابة قصيرة: textarea
- [ ] Dot navigator + previous/next
- [ ] بعد التسليم: أخضر ✓ أحمر ✗
- [ ] الشروحات تظهر بعد التسليم
- [ ] Score Ring يتحرك في صفحة النتائج
- [ ] "اختبار جديد" يعيد التهيئة

### حالات الخطأ
- [ ] ملف > 20MB → خطأ عربي
- [ ] API key خاطئ → "مفتاح API غير صحيح"
- [ ] PDF مسحوب ضوئياً → "لم يتم العثور على نص كافٍ"

---

## curl للاختبار السريع

```bash
# Health
curl http://localhost:3001/api/health

# رفع ملف
curl -X POST http://localhost:3001/api/upload -F "file=@test.pdf"

# توليد أسئلة
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"text":"النص...","questionCount":3,"questionType":"mcq","difficulty":"easy"}'
```
# aqg
