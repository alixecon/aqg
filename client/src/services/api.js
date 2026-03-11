// client/src/services/api.js
const BASE_URL = "/api";

/**
 * Uploads a file to the backend and returns extracted + normalized text.
 * @param {File} file
 * @param {(pct: number) => void} onProgress  — optional progress callback (0-100)
 * @returns {Promise<{ fileName, fileType, charCount, text }>}
 */
export async function uploadFile(file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      let body;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        return reject(new Error("استجابة غير صالحة من الخادم."));
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body);
      } else {
        reject(new Error(body.error || "فشل رفع الملف. يرجى المحاولة مرة أخرى."));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("تعذّر الاتصال بالخادم. تأكد من أن الخادم يعمل على المنفذ 3001."))
    );

    xhr.addEventListener("abort", () =>
      reject(new Error("تم إلغاء رفع الملف."))
    );

    xhr.open("POST", `${BASE_URL}/upload`);
    xhr.send(formData);
  });
}

/**
 * Sends extracted text + quiz config to Claude and returns questions.
 * @param {{ text, questionCount, questionType, difficulty }} payload
 * @returns {Promise<{ questions: Array }>}
 */
export async function generateQuiz(payload) {
  const res = await fetch(`${BASE_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => {
    throw new Error("استجابة غير صالحة من خدمة التوليد.");
  });

  if (!res.ok) {
    throw new Error(body.error || "فشل توليد الأسئلة. يرجى المحاولة مرة أخرى.");
  }

  return body;
}
