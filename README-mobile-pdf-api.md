# Mobile PDF Extraction API

A server-side API endpoint for extracting text content from PDF files, designed specifically for mobile application integration.

## 🚀 Quick Start

**Endpoint URL:** `POST /api/mobile/pdf-extract`

**Base URL:** `https://healthconsultant.ai/api/mobile/pdf-extract`

## 📋 Overview

This API allows mobile applications to upload PDF files and receive extracted text content. The endpoint is optimized for server-side processing and provides reliable PDF text extraction without client-side dependencies.

## 🔐 Authentication

- **Required:** Yes
- **Method:** NextAuth.js session-based authentication
- **Headers:** Include session cookies in requests

## 📤 Request Format

### Content-Type
```
multipart/form-data
```

### Parameters

| Parameter | Type | Required | Description | Constraints |
|-----------|------|----------|-------------|-------------|
| `file` | File | Yes | PDF file to extract text from | Max 10MB, PDF format only |

### Example Request

#### JavaScript/Fetch
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

#### React Native
```javascript
const formData = new FormData();
formData.append('file', {
  uri: pdfUri,
  type: 'application/pdf',
  name: 'document.pdf'
});

const response = await fetch('https://healthconsultant.ai/api/mobile/pdf-extract', {
  method: 'POST',
  body: formData,
  headers: {
    'Content-Type': 'multipart/form-data',
    'Authorization': 'Bearer your-auth-token'
  }
});
```

#### cURL
```bash
curl -X POST \
  -H "Authorization: Bearer your-auth-token" \
  -F "file=@document.pdf" \
  https://healthconsultant.ai/api/mobile/pdf-extract
```

## 📥 Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "filename": "document.pdf",
  "fileSize": 1024000,
  "pageCount": 5,
  "extractedText": "PDF file successfully loaded: document.pdf\n\nFile Information:\n- Pages: 5\n- Size: 1000.00 KB\n- Type: application/pdf\n\nNote: Text extraction from PDF content requires a specialized PDF parsing library. The PDF structure has been successfully read, but text content extraction needs additional implementation.",
  "characterCount": 200
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the request was successful |
| `filename` | string | Original filename of the uploaded PDF |
| `fileSize` | number | File size in bytes |
| `pageCount` | number | Number of pages in the PDF |
| `extractedText` | string | Extracted text content (currently placeholder) |
| `characterCount` | number | Number of characters in extracted text |

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

#### 400 Bad Request - No File
```json
{
  "error": "No file provided"
}
```

#### 400 Bad Request - Invalid File Type
```json
{
  "error": "File must be a PDF"
}
```

#### 400 Bad Request - File Too Large
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

## 🧪 Testing

### Using the Test Form

1. Navigate to: `https://healthconsultant.ai/test-pdf-extract.html`
2. Select a PDF file
3. Click "Extract Text"
4. View the results

### Using cURL

```bash
# Test with a sample PDF
curl -X POST \
  -H "Cookie: your-session-cookie" \
  -F "file=@sample.pdf" \
  https://healthconsultant.ai/api/mobile/pdf-extract
```

### Using Postman

1. Set method to `POST`
2. Set URL to your endpoint
3. Go to Body → form-data
4. Add key `file` with type `File`
5. Select a PDF file
6. Include authentication headers
7. Send request

## 📱 Mobile Integration Examples

### React Native with Expo

```javascript
import * as DocumentPicker from 'expo-document-picker';

const pickAndExtractPDF = async () => {
  try {
    // Pick PDF file
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      const file = result.assets[0];
      
      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: 'application/pdf',
        name: file.name,
      });

      // Send to API
      const response = await fetch('https://healthconsultant.ai/api/mobile/pdf-extract', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Extracted text:', data.extractedText);
        console.log('Page count:', data.pageCount);
      } else {
        console.error('Error:', data.error);
      }
    }
  } catch (error) {
    console.error('Error picking or processing PDF:', error);
  }
};
```

### Flutter/Dart

```dart
import 'package:http/http.dart' as http;
import 'package:file_picker/file_picker.dart';

Future<void> extractPDFText() async {
  try {
    // Pick PDF file
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
    );

    if (result != null) {
      PlatformFile file = result.files.first;
      
      // Create multipart request
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('https://healthconsultant.ai/api/mobile/pdf-extract'),
      );
      
      // Add file
      request.files.add(
        await http.MultipartFile.fromPath('file', file.path!),
      );
      
      // Add headers
      request.headers['Authorization'] = 'Bearer $authToken';
      
      // Send request
      var response = await request.send();
      var responseData = await response.stream.bytesToString();
      var jsonData = json.decode(responseData);
      
      if (jsonData['success']) {
        print('Extracted text: ${jsonData['extractedText']}');
        print('Page count: ${jsonData['pageCount']}');
      } else {
        print('Error: ${jsonData['error']}');
      }
    }
  } catch (e) {
    print('Error: $e');
  }
}
```

### Swift (iOS)

```swift
import Foundation

func extractPDFText(fileURL: URL) {
    let url = URL(string: "https://healthconsultant.ai/api/mobile/pdf-extract")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
    
    let boundary = UUID().uuidString
    request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
    
    var body = Data()
    
    // Add file data
    body.append("--\(boundary)\r\n".data(using: .utf8)!)
    body.append("Content-Disposition: form-data; name=\"file\"; filename=\"document.pdf\"\r\n".data(using: .utf8)!)
    body.append("Content-Type: application/pdf\r\n\r\n".data(using: .utf8)!)
    body.append(try! Data(contentsOf: fileURL))
    body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
    
    request.httpBody = body
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        if let data = data {
            do {
                let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                if let success = json?["success"] as? Bool, success {
                    print("Extracted text: \(json?["extractedText"] ?? "")")
                    print("Page count: \(json?["pageCount"] ?? 0)")
                } else {
                    print("Error: \(json?["error"] ?? "Unknown error")")
                }
            } catch {
                print("JSON parsing error: \(error)")
            }
        }
    }.resume()
}
```

## ⚙️ Configuration

### Environment Variables

The API uses the following environment variables:

- `NEXTAUTH_SECRET` - Required for session authentication
- `NEXTAUTH_URL` - Your application URL
- Database connection variables (for user authentication)

### File Size Limits

- **Maximum file size:** 10MB
- **Supported format:** PDF only
- **Validation:** Automatic file type and size checking

## 🔧 Technical Details

### PDF Processing

- **Library:** pdf-lib for PDF structure reading
- **Text Extraction:** Currently returns placeholder text
- **Server-Side:** No client-side dependencies
- **Compatibility:** Works in all server environments

### Performance

- **Processing time:** Varies by file size
- **Memory usage:** Optimized for server environments
- **Concurrent requests:** Handles multiple simultaneous uploads
- **Error recovery:** Graceful handling of parsing failures

### Security

- **Authentication:** Session-based security
- **File validation:** Type and size checking
- **Input sanitization:** Safe handling of file data
- **Error handling:** No sensitive information in error messages

## 🚨 Current Limitations

### Text Extraction Status

**Note:** The API currently returns placeholder text instead of actual extracted content. This is due to server-side compatibility challenges with PDF text extraction libraries.

### What Works:
- ✅ File upload and validation
- ✅ PDF structure reading
- ✅ Page count extraction
- ✅ File metadata
- ✅ Authentication and security

### What's In Progress:
- 🔄 Full text content extraction
- 🔄 Advanced PDF parsing
- 🔄 OCR for image-based PDFs

## 🔮 Future Enhancements

1. **Full Text Extraction:** Implement complete PDF text parsing
2. **OCR Support:** Handle image-based PDFs
3. **Batch Processing:** Support multiple file uploads
4. **Progress Tracking:** Real-time upload progress
5. **Caching:** Store extracted text for repeated access
6. **Format Support:** Additional document formats

## 📞 Support

For issues or questions:

1. Check the test form: `/test-pdf-extract.html`
2. Review error messages in API responses
3. Verify authentication and file format
4. Check file size limits (10MB max)

## 📄 License

This API is part of the MedGemma health application system.

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** Functional (with placeholder text extraction)
