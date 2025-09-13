# Mobile Chatbot API Documentation

A simple HTTP interface for the mobile app to chat with the AI, with optional image and PDF attachments. The API extracts PDF text server-side and sends it to the AI.

## Endpoint
- Method: POST
- URL: `https://healthconsultant.ai/api/mobile/chat`
- Content-Type: `multipart/form-data`
- Auth: Session cookie or Bearer token (deployment-specific)

## Parameters (multipart/form-data)
- `user_id` (string, required): The user UUID (matches `users.id` in DB)
- `prompt` (string, required): The user message/prompt
- `image` (file, optional): Image file (max 10MB). `image/*`
- `pdf` (file, optional): PDF file (max 10MB). `application/pdf`

Notes:
- PDF text is extracted automatically server-side. If extraction fails, the API may include the PDF inline for the AI to inspect or return a helpful error message.
- `user_id` must match the authenticated user's id, otherwise a 403 is returned.

---

## cURL Examples

### 1) Text-only
```bash
curl -X POST "https://healthconsultant.ai/api/mobile/chat" \
  -H "Cookie: YOUR_SESSION_COOKIE_HERE" \
  -F "user_id=YOUR_USER_ID_UUID" \
  -F "prompt=Analyze this health report summary: CBC shows elevated WBC and mild anemia."
```

### 2) With image
```bash
curl -X POST "https://healthconsultant.ai/api/mobile/chat" \
  -H "Cookie: YOUR_SESSION_COOKIE_HERE" \
  -F "user_id=YOUR_USER_ID_UUID" \
  -F "prompt=What do you see in this image?" \
  -F "image=@/absolute/path/to/image.jpg;type=image/jpeg"
```

### 3) With PDF (server extracts text automatically)
```bash
curl -X POST "https://healthconsultant.ai/api/mobile/chat" \
  -H "Cookie: YOUR_SESSION_COOKIE_HERE" \
  -F "user_id=YOUR_USER_ID_UUID" \
  -F "prompt=Please analyze the attached health report." \
  -F "pdf=@/absolute/path/to/Health_Report_John_Doe.pdf;type=application/pdf"
```

---

## Success Response (200)
Matches the live API shape.
```json
{
  "success": true,
  "response": "I analyzed the content...",
  "user_id": "YOUR_USER_ID_UUID",
  "timestamp": "2025-09-13T02:16:00.000Z",
  "attachments": {
    "image": {
      "name": "image.jpg",
      "size": 1024000,
      "type": "image/jpeg"
    },
    "pdf": {
      "name": "Health_Report_John_Doe.pdf",
      "size": 4760,
      "type": "application/pdf"
    }
  }
}
```

Note: If no file is included, the corresponding `attachments.image` or `attachments.pdf` field will be `null`.

---

## Error Responses

### 400 Bad Request
- Missing required fields
```json
{ "error": "user_id is required" }
```
```json
{ "error": "prompt is required" }
```
- Invalid file type or size
```json
{ "error": "Invalid image file type" }
```
```json
{ "error": "Image file too large (max 10MB)" }
```
```json
{ "error": "Invalid PDF file type" }
```
```json
{ "error": "PDF file too large (max 10MB)" }
```

### 401 Unauthorized
```json
{ "error": "Unauthorized" }
```

### 403 Forbidden (user mismatch)
```json
{ "error": "user_id does not match authenticated user" }
```

### 404 Not Found
```json
{ "error": "User not found" }
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to process chat request",
  "details": "Specific error message"
}
```

---

## Limits & Validation
- Max file size per file: 10MB
- Supported images: JPEG, PNG, GIF, WebP
- Supported PDFs: `application/pdf`
- CORS: `OPTIONS` supported; `Access-Control-Allow-Origin: *`

---

## Testing
- Browser test page: `https://healthconsultant.ai/test-mobile-chat.html`
- Ensure you are authenticated (session cookie) and `user_id` matches your DB id

---

## Changelog
- 2025-09-13: Server-side PDF extraction via `pdfjs-dist` legacy + `disableWorker: true`; inline base64 fallback for AI inspection
