# Mobile Chat Conversations API

## Overview
This API provides endpoints for mobile applications to manage chat conversation history. It allows mobile apps to fetch, save, and delete chat conversations using user ID-based authentication.

## Endpoints

### 1. Get Chat Conversations

Retrieves all chat conversations for a specific user.

```
GET /api/mobile/chat-conversations?user_id={userId}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | UUID of the user |

#### Response Format

**Success Response (200)**
```json
{
  "success": true,
  "conversations": [
    {
      "id": "uuid",
      "title": "Chat title",
      "messages": [
        {
          "id": "message-id",
          "role": "user",
          "content": "User message content"
        },
        {
          "id": "message-id",
          "role": "assistant",
          "content": "Assistant response"
        }
      ],
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "user_id": "user-uuid",
  "count": 5
}
```

**Error Responses**

- **400 Bad Request**: Missing `user_id` parameter
- **404 Not Found**: User not found
- **500 Internal Server Error**: Database error or table doesn't exist

---

### 2. Save Chat Conversation

Saves a new chat conversation or updates an existing one.

```
POST /api/mobile/chat-conversations
```

#### Request Body

```json
{
  "user_id": "user-uuid",
  "messages": [
    {
      "id": "message-id",
      "role": "user",
      "content": "User message"
    },
    {
      "id": "message-id",
      "role": "assistant",
      "content": "Assistant response"
    }
  ],
  "title": "Optional conversation title"
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | UUID of the user |
| `messages` | array | Yes | Array of message objects with `id`, `role`, and `content` |
| `title` | string | No | Optional title (auto-generated from first user message if not provided) |

#### Response Format

**Success Response (200)**
```json
{
  "success": true,
  "conversation": {
    "id": "conversation-uuid",
    "user_id": "user-uuid",
    "title": "Chat title",
    "messages": [...],
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  },
  "user_id": "user-uuid"
}
```

**Error Responses**

- **400 Bad Request**: Missing required parameters or invalid message format
- **404 Not Found**: User not found
- **500 Internal Server Error**: Database error

---

### 3. Delete Chat Conversation

Deletes a specific chat conversation.

```
DELETE /api/mobile/chat-conversations/{conversationId}?user_id={userId}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationId` | string | Yes | UUID of the conversation (path parameter) |
| `user_id` | string | Yes | UUID of the user (query parameter) |

#### Response Format

**Success Response (200)**
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

**Error Responses**

- **400 Bad Request**: Missing `user_id` parameter
- **403 Forbidden**: Conversation doesn't belong to user
- **404 Not Found**: User or conversation not found
- **500 Internal Server Error**: Database error

---

## Authentication

- **Method**: User ID-based authentication (not session-based)
- **Validation**: User ID is validated against the database
- **Security**: Users can only access their own conversations

## CORS Support

The API includes CORS headers for cross-origin requests:
- Supports localhost:8081 (Expo development)
- Supports Expo tunnel URLs (.exp.direct)
- Includes `Access-Control-Allow-Credentials: true`

## Usage Examples

### React Native - Fetch Conversations

```javascript
const fetchConversations = async (userId) => {
  try {
    const response = await fetch(
      `https://your-domain.com/api/mobile/chat-conversations?user_id=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    if (data.success) {
      console.log('Conversations:', data.conversations);
      return data.conversations;
    } else {
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

### React Native - Save Conversation

```javascript
const saveConversation = async (userId, messages, title) => {
  try {
    const response = await fetch(
      'https://your-domain.com/api/mobile/chat-conversations',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          messages: messages,
          title: title
        }),
      }
    );

    const data = await response.json();
    if (data.success) {
      console.log('Conversation saved:', data.conversation);
      return data.conversation;
    } else {
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

### React Native - Delete Conversation

```javascript
const deleteConversation = async (userId, conversationId) => {
  try {
    const response = await fetch(
      `https://your-domain.com/api/mobile/chat-conversations/${conversationId}?user_id=${userId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    if (data.success) {
      console.log('Conversation deleted');
      return true;
    } else {
      console.error('Error:', data.error);
      return false;
    }
  } catch (error) {
    console.error('Network error:', error);
    return false;
  }
};
```

### cURL Examples

**Get Conversations:**
```bash
curl -X GET \
  "https://your-domain.com/api/mobile/chat-conversations?user_id=user-uuid" \
  -H "Content-Type: application/json"
```

**Save Conversation:**
```bash
curl -X POST \
  "https://your-domain.com/api/mobile/chat-conversations" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "content": "Hello"
      },
      {
        "id": "msg-2",
        "role": "assistant",
        "content": "Hi there!"
      }
    ],
    "title": "Test Conversation"
  }'
```

**Delete Conversation:**
```bash
curl -X DELETE \
  "https://your-domain.com/api/mobile/chat-conversations/conversation-uuid?user_id=user-uuid" \
  -H "Content-Type: application/json"
```

## Message Format

Each message in the `messages` array should have the following structure:

```typescript
{
  id: string;           // Unique message ID
  role: 'user' | 'assistant';  // Message role
  content: string;      // Message content
  hasImage?: boolean;   // Optional: indicates if message had an image
  document?: {          // Optional: document metadata
    name: string;
  };
  healthReport?: {      // Optional: health report metadata
    id: string;
    title: string;
    reportType: string;
  };
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information (if available)"
}
```

## Rate Limiting

- Subject to the same rate limiting as other mobile API endpoints
- Consider implementing additional rate limiting for mobile clients if needed

## Security Considerations

- User ID validation ensures users can only access their own conversations
- Conversation ownership is verified before deletion
- CORS headers are configured for mobile app origins only
- Input validation on all request parameters

## Database Requirements

The `chat_conversations` table must exist in the database. Run the migration:
```sql
-- See db/migration-add-chat-conversations.sql
```

## Notes

- Conversations are automatically saved by the web app when users chat
- Mobile apps can save conversations after chat sessions complete
- Title is auto-generated from the first user message if not provided
- Messages are stored as JSONB in the database for flexibility

