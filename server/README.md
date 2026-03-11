# Arabic Quiz Generator — الخادم (Backend)

## متطلبات التشغيل
- Node.js v18 أو أحدث
- مفتاح Anthropic API (من https://console.anthropic.com)

## التثبيت والتشغيل

```bash
cd server
npm install
cp .env.example .env
# أضف مفتاح API الخاص بك في ملف .env
npm run dev
```

الخادم يعمل على: `http://localhost:3001`

## نقاط النهاية (API Endpoints)

### GET /api/health
تحقق من حالة الخادم.

### POST /api/upload
رفع الملف واستخراج النص.
- **Body**: `multipart/form-data` — حقل `file` (PDF / DOCX / PPTX)
- **Response**: `{ success, fileName, fileType, charCount, text }`

### POST /api/generate
توليد الأسئلة من النص المستخرج.
- **Body** (JSON):
  ```json
  {
    "text": "...",
    "questionCount": 5,
    "questionType": "mcq",
    "difficulty": "medium"
  }
  ```
- **Response**: `{ success, questions: [...] }`

## أنواع الأسئلة المدعومة
| القيمة | النوع |
|--------|-------|
| `mcq` | اختيار من متعدد |
| `truefalse` | صح أم خطأ |
| `shortanswer` | إجابة قصيرة |

## مستويات الصعوبة
| القيمة | المستوى |
|--------|---------|
| `easy` | سهل |
| `medium` | متوسط |
| `hard` | صعب |
