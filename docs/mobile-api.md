# Mobile PDF Extraction API

## Overview
This API endpoint provides PDF text extraction functionality for mobile applications. It accepts PDF files via multipart/form-data and returns the extracted text content using the same PDF parsing method as the health report analysis system.

## Endpoint
```
POST /api/mobile/pdf-extract
```

## Authentication
- **Required**: Yes
- **Method**: NextAuth.js session-based authentication
- **Headers**: Standard session cookies

## Request Format

### Content-Type
```
multipart/form-data
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | PDF file to extract text from |

### File Requirements
- **Type**: `application/pdf`
- **Max Size**: 10MB
- **Format**: Standard PDF files

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "filename": "document.pdf",
  "fileSize": 1024000,
  "pageCount": 5,
  "extractedText": "Full extracted text content...",
  "characterCount": 5000
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

#### 400 Bad Request
```json
{
  "error": "No file provided"
}
```

```json
{
  "error": "File must be a PDF"
}
```

```json
{
  "error": "File size must be less than 10MB"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to extract text from PDF",
  "details": "Specific error message"
}
```

## Usage Examples

### JavaScript/Fetch
```javascript
const formData = new FormData();
formData.append('file', pdfFile);

const response = await fetch('/api/mobile/pdf-extract', {
  method: 'POST',
  body: formData,
  credentials: 'include' // Include session cookies
});

const result = await response.json();
```

### React Native
```javascript
const formData = new FormData();
formData.append('file', {
  uri: pdfUri,
  type: 'application/pdf',
  name: 'document.pdf'
});

const response = await fetch('https://your-domain.com/api/mobile/pdf-extract', {
  method: 'POST',
  body: formData,
  headers: {
    'Content-Type': 'multipart/form-data',
    'Authorization': 'Bearer your-auth-token'
  }
});
```

### cURL
```bash
curl -X POST \
  -H "Authorization: Bearer your-auth-token" \
  -F "file=@document.pdf" \
  https://your-domain.com/api/mobile/pdf-extract
```

## Technical Details

### PDF Processing
- Uses `pdfjs-dist` library with dynamic imports for server-side compatibility
- Extracts text from all pages sequentially
- Handles various PDF formats and encodings
- Cleans and normalizes extracted text
- No worker dependencies for server-side deployment

### Performance
- Processes PDFs up to 10MB
- Extracts text from all pages sequentially
- Returns full text content with page count
- Optimized for mobile network conditions
- Server-side processing for better reliability

### Error Handling
- Comprehensive error messages
- File validation (type, size)
- PDF parsing error recovery
- Authentication verification

## CORS Support
The API includes CORS headers for cross-origin requests:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Rate Limiting
- Subject to the same rate limiting as other authenticated endpoints
- Consider implementing additional rate limiting for mobile clients if needed

## Security Considerations
- Authentication required for all requests
- File type validation prevents malicious uploads
- File size limits prevent abuse
- Input sanitization on extracted text

## Testing
Use the provided test script:
```bash
node scripts/test-mobile-pdf-api.js
```

Make sure to place a test PDF file in the `public/` directory before running the test.
