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
  "characterCount": 5000,
  "metadata": {
    "title": "Document Title",
    "author": "Author Name",
    "subject": "Document Subject",
    "creator": "Creator Application",
    "producer": "PDF Producer",
    "creationDate": "2024-01-01T00:00:00.000Z",
    "modificationDate": "2024-01-01T00:00:00.000Z"
  }
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
- Uses `pdf-parse` library for server-side PDF parsing
- Extracts text from all pages in a single operation
- Handles various PDF formats and encodings
- Cleans and normalizes extracted text
- Extracts PDF metadata (title, author, creation date, etc.)

### Performance
- Processes PDFs up to 10MB
- Extracts text from all pages in a single operation
- Returns full text content and PDF metadata
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
