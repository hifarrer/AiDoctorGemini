# Mobile Chatbot API

A server-side API endpoint for AI-powered chat functionality with image and PDF support, designed specifically for mobile application integration.

## 🚀 Quick Start

**Endpoint URL:** `POST /api/mobile/chat`

**Base URL:** `https://healthconsultant.ai/api/mobile/chat`

## 📋 Overview

This API allows mobile applications to send chat messages to an AI assistant with optional image and PDF attachments. The endpoint provides the same AI capabilities as the web chatbot but optimized for mobile integration with user ID-based authentication.

## 🔐 Authentication

- **Required:** Yes
- **Method:** NextAuth.js session-based authentication + user_id validation
- **Headers:** Include session cookies in requests
- **User ID:** Must match authenticated user's database ID

## 📤 Request Format

### Content-Type
```
multipart/form-data
```

### Parameters

| Parameter | Type | Required | Description | Constraints |
|-----------|------|----------|-------------|-------------|
| `user_id` | string | Yes | User's database ID | Must match authenticated user |
| `prompt` | string | Yes | Chat message/prompt | Text content for AI |
| `image` | File | No | Image attachment | Max 10MB, image formats |
| `pdf` | File | No | PDF attachment | Max 10MB, PDF format |
| `pdf_text` | string | No | Pre-extracted PDF text | Optional fallback if server extraction fails |

### Example Request

#### JavaScript/Fetch (Simple - API handles PDF extraction)
```javascript
const formData = new FormData();
formData.append('user_id', 'user-uuid-here');
formData.append('prompt', 'Analyze this health report');

if (imageFile) {
  formData.append('image', imageFile);
}

if (pdfFile) {
  formData.append('pdf', pdfFile); // API extracts text automatically
}

const response = await fetch('/api/mobile/chat', {
  method: 'POST',
  body: formData,
  credentials: 'include' // Include session cookies
});

const result = await response.json();
```

#### React Native
```javascript
const formData = new FormData();
formData.append('user_id', userId);
formData.append('prompt', 'Analyze this medical report');

if (imageUri) {
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'medical_image.jpg'
  });
}

const response = await fetch('https://healthconsultant.ai/api/mobile/chat', {
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
  -F "user_id=user-uuid-here" \
  -F "prompt=What do you see in this image?" \
  -F "image=@medical_image.jpg" \
  https://healthconsultant.ai/api/mobile/chat
```

## 📥 Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "response": "I can see this is a medical image showing... [AI response]",
  "user_id": "user-uuid-here",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "attachments": {
    "image": {
      "name": "medical_image.jpg",
      "size": 1024000,
      "type": "image/jpeg"
    },
    "pdf": null
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the request was successful |
| `response` | string | AI-generated response text |
| `user_id` | string | Confirmed user ID |
| `timestamp` | string | ISO timestamp of the response |
| `attachments` | object | Information about attached files |
| `attachments.image` | object\|null | Image file details (if provided) |
| `attachments.pdf` | object\|null | PDF file details (if provided) |

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

#### 400 Bad Request - Missing Parameters
```json
{
  "error": "user_id is required"
}
```

```json
{
  "error": "prompt is required"
}
```

#### 400 Bad Request - Invalid File
```json
{
  "error": "Invalid image file type"
}
```

```json
{
  "error": "Image file too large (max 10MB)"
}
```

#### 403 Forbidden - User ID Mismatch
```json
{
  "error": "user_id does not match authenticated user"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to process chat request",
  "details": "Specific error message"
}
```

## 📄 PDF Processing

The API handles PDF text extraction automatically on the server-side. Mobile developers simply need to upload the PDF file - no client-side processing required.

### How It Works

1. **Upload PDF**: Include PDF file in your request
2. **Server Processing**: API extracts text automatically using `pdfjs-dist` library (same as dashboard)
3. **AI Analysis**: Extracted text is sent to AI for analysis
4. **Response**: Get full AI analysis of the PDF content

### Simple Usage

```javascript
// Just upload the PDF file - that's it!
if (pdfFile) {
  formData.append('pdf', pdfFile);
}
```

The API will handle all the complexity of PDF text extraction and provide the same quality analysis as the dashboard chatbot.

## 🧪 Testing

### Using the Test Form

1. Navigate to: `https://healthconsultant.ai/test-mobile-chat.html`
2. Enter your user ID
3. Type your message
4. Optionally attach an image or PDF (PDF text extraction is automatic)
5. Click "Send Message"
6. View the AI response with full PDF analysis

### Using cURL

```bash
# Test with text only
curl -X POST \
  -H "Cookie: your-session-cookie" \
  -F "user_id=your-user-id" \
  -F "prompt=Hello, how are you?" \
  https://healthconsultant.ai/api/mobile/chat

# Test with image
curl -X POST \
  -H "Cookie: your-session-cookie" \
  -F "user_id=your-user-id" \
  -F "prompt=What do you see in this image?" \
  -F "image=@test_image.jpg" \
  https://healthconsultant.ai/api/mobile/chat
```

## 📱 Mobile Integration Examples

### React Native with Expo

```javascript
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const sendChatMessage = async (userId, prompt, imageUri = null, pdfUri = null) => {
  try {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('prompt', prompt);
    
    if (imageUri) {
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg'
      });
    }
    
    if (pdfUri) {
      // Simply upload the PDF - the API will extract text automatically
      formData.append('pdf', {
        uri: pdfUri,
        type: 'application/pdf',
        name: 'document.pdf'
      });
    }

    const response = await fetch('https://healthconsultant.ai/api/mobile/chat', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('AI Response:', data.response);
      return data.response;
    } else {
      console.error('Error:', data.error);
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
};

// Usage example
const handleSendMessage = async () => {
  try {
    const response = await sendChatMessage(
      'user-uuid-here',
      'What can you tell me about this medical image?',
      'file://path/to/image.jpg'
    );
    setChatResponse(response);
  } catch (error) {
    setError(error.message);
  }
};
```

### Flutter/Dart

```dart
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';

class MobileChatAPI {
  static const String baseUrl = 'https://healthconsultant.ai/api/mobile/chat';
  
  static Future<String> sendMessage({
    required String userId,
    required String prompt,
    String? imagePath,
    String? pdfPath,
    required String authToken,
  }) async {
    try {
      var request = http.MultipartRequest('POST', Uri.parse(baseUrl));
      
      // Add required fields
      request.fields['user_id'] = userId;
      request.fields['prompt'] = prompt;
      
      // Add headers
      request.headers['Authorization'] = 'Bearer $authToken';
      
      // Add image if provided
      if (imagePath != null) {
        request.files.add(
          await http.MultipartFile.fromPath('image', imagePath),
        );
      }
      
      // Add PDF if provided
      if (pdfPath != null) {
        request.files.add(
          await http.MultipartFile.fromPath('pdf', pdfPath),
        );
      }
      
      // Send request
      var response = await request.send();
      var responseData = await response.stream.bytesToString();
      var jsonData = json.decode(responseData);
      
      if (jsonData['success']) {
        return jsonData['response'];
      } else {
        throw Exception(jsonData['error']);
      }
    } catch (e) {
      throw Exception('Chat request failed: $e');
    }
  }
}

// Usage example
Future<void> sendChatMessage() async {
  try {
    final response = await MobileChatAPI.sendMessage(
      userId: 'user-uuid-here',
      prompt: 'Analyze this medical report',
      imagePath: '/path/to/image.jpg',
      authToken: 'your-auth-token',
    );
    
    print('AI Response: $response');
  } catch (e) {
    print('Error: $e');
  }
}
```

### Swift (iOS)

```swift
import Foundation

class MobileChatAPI {
    static let baseURL = "https://healthconsultant.ai/api/mobile/chat"
    
    static func sendMessage(
        userId: String,
        prompt: String,
        imageURL: URL? = nil,
        pdfURL: URL? = nil,
        authToken: String,
        completion: @escaping (Result<String, Error>) -> Void
    ) {
        let url = URL(string: baseURL)!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        
        // Add user_id
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"user_id\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(userId)\r\n".data(using: .utf8)!)
        
        // Add prompt
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"prompt\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(prompt)\r\n".data(using: .utf8)!)
        
        // Add image if provided
        if let imageURL = imageURL {
            let imageData = try! Data(contentsOf: imageURL)
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"image\"; filename=\"image.jpg\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
            body.append(imageData)
            body.append("\r\n".data(using: .utf8)!)
        }
        
        // Add PDF if provided
        if let pdfURL = pdfURL {
            let pdfData = try! Data(contentsOf: pdfURL)
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"pdf\"; filename=\"document.pdf\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: application/pdf\r\n\r\n".data(using: .utf8)!)
            body.append(pdfData)
            body.append("\r\n".data(using: .utf8)!)
        }
        
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let data = data {
                do {
                    let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                    if let success = json?["success"] as? Bool, success {
                        let responseText = json?["response"] as? String ?? ""
                        completion(.success(responseText))
                    } else {
                        let errorMessage = json?["error"] as? String ?? "Unknown error"
                        completion(.failure(NSError(domain: "ChatAPI", code: 0, userInfo: [NSLocalizedDescriptionKey: errorMessage])))
                    }
                } catch {
                    completion(.failure(error))
                }
            } else if let error = error {
                completion(.failure(error))
            }
        }.resume()
    }
}

// Usage example
MobileChatAPI.sendMessage(
    userId: "user-uuid-here",
    prompt: "What do you see in this image?",
    imageURL: imageFileURL,
    authToken: "your-auth-token"
) { result in
    switch result {
    case .success(let response):
        print("AI Response: \(response)")
    case .failure(let error):
        print("Error: \(error.localizedDescription)")
    }
}
```

## ⚙️ Configuration

### Environment Variables

The API uses the following environment variables:

- `NEXTAUTH_SECRET` - Required for session authentication
- `NEXTAUTH_URL` - Your application URL
- `GOOGLE_VERTEX_PROJECT` - Google Cloud project ID
- `GOOGLE_VERTEX_LOCATION` - Google Cloud location (default: us-central1)
- Database connection variables (for user authentication)

### File Size Limits

- **Maximum file size:** 10MB per file
- **Supported image formats:** JPEG, PNG, GIF, WebP
- **Supported PDF format:** PDF only
- **Validation:** Automatic file type and size checking

## 🔧 Technical Details

### AI Processing

- **Model:** Google VertexAI Gemini 2.5 Pro
- **Image Analysis:** Full image understanding and description
- **PDF Processing:** Full text extraction and analysis (hybrid client/server approach)
- **Text Processing:** Natural language understanding and generation

### Performance

- **Response time:** 2-10 seconds depending on content complexity
- **Image processing:** Optimized for medical and general images
- **Concurrent requests:** Handles multiple simultaneous chats
- **Usage tracking:** Automatic interaction logging

### Security

- **Authentication:** Session-based + user ID validation
- **File validation:** Type and size checking
- **Input sanitization:** Safe handling of all inputs
- **User isolation:** Users can only access their own data

## 📊 Usage Tracking

The API automatically tracks usage for analytics:

- **Interaction types:** text_chat, image_chat, document_chat
- **Token estimation:** Rough calculation for billing
- **Timestamp logging:** For usage analytics
- **User attribution:** Linked to specific user accounts

## 🚨 Current Limitations

### PDF Processing

**Automatic Server-Side Extraction:** The API automatically extracts text from uploaded PDF files using server-side processing. Simply upload the PDF file and the API will:

1. **Extract text content** from the PDF automatically
2. **Send to AI** for analysis and response
3. **Handle errors gracefully** if extraction fails

Mobile apps just need to upload the PDF file - no client-side processing required. This provides the same AI analysis quality as the dashboard chatbot with zero complexity for mobile developers.

### What Works:
- ✅ Text chat with AI
- ✅ Image analysis and description
- ✅ PDF text extraction and analysis
- ✅ User authentication and validation
- ✅ Usage tracking and analytics
- ✅ File upload and validation

### What's In Progress:
- 🔄 Advanced medical image analysis
- 🔄 Conversation history and context
- 🔄 Health report specific analysis features

## 🔮 Future Enhancements

1. **Conversation Context:** Multi-turn conversation support
2. **Medical Specialization:** Enhanced medical image analysis
3. **Voice Input:** Audio message support
4. **Real-time Streaming:** Streaming responses for better UX
5. **Custom Models:** Specialized models for different use cases
6. **Health Report Integration:** Direct integration with health report analysis features

## 📞 Support

For issues or questions:

1. Check the test form: `/test-mobile-chat.html`
2. Review error messages in API responses
3. Verify authentication and user ID
4. Check file size limits (10MB max per file)

## 📄 License

This API is part of the MedGemma health application system.

---

**Last Updated:** January 2025  
**Version:** 1.1.0  
**Status:** Fully Functional (text chat, image analysis, PDF text extraction and analysis)
ok