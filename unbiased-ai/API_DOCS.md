# 📚 Unbiased AI - Complete API Documentation

## Overview

Unbiased AI provides a comprehensive REST API for detecting, analyzing, and mitigating bias in digital content. All endpoints are built on Google's Gemini 1.5 Pro model and deployed via Supabase Edge Functions.

**Base URL**: `https://<your-supabase-project>.supabase.co/functions/v1`

**Authentication**: Include Firebase JWT token in Authorization header
```
Authorization: Bearer <firebase_jwt_token>
```

---

## 📋 API Endpoints

### 1. Detect Bias
Identifies biased language and bias types in provided content.

**Endpoint**: `POST /detect-bias`

**Request**:
```json
{
  "content": "The CEO is a woman and she's quite competent for a woman in tech.",
  "type": "text"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "detected": true,
    "biasInstances": [
      {
        "phrase": "quite competent for a woman in tech",
        "biasType": "gender",
        "severity": "medium",
        "explanation": "This phrase implies lower baseline expectations for women in tech",
        "suggestion": "She is an excellent CEO with deep expertise in technology."
      }
    ],
    "overallAssessment": "The text contains moderate gender bias",
    "confidenceScore": 0.92
  },
  "meta": {
    "processingTime": 1234,
    "model": "gemini-1.5-pro",
    "cached": false
  }
}
```

**Error Response** (429 - Rate Limited):
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "30 requests per minute limit exceeded",
    "retryAfter": 15
  }
}
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| content | string | Yes | Text to analyze (max 5000 chars) |
| type | string | No | Content type: 'text', 'email', 'social' (default: 'text') |

**Bias Types**:
- `gender` - Gender-based stereotypes or discrimination
- `racial` - Racial or ethnic bias
- `political` - Political lean or bias
- `age` - Age-based stereotyping
- `religious` - Religious discrimination
- `cultural` - Cultural insensitivity
- `socioeconomic` - Class or wealth-based bias
- `ableist` - Disability-related bias

**Severity Levels**:
- `low` - Minor bias, likely unintentional
- `medium` - Moderate bias with clear impact
- `high` - Strong bias that promotes discrimination

---

### 2. Rewrite Text
Rewrites content to eliminate bias while preserving meaning and tone.

**Endpoint**: `POST /rewrite`

**Request**:
```json
{
  "text": "The CEO is a woman and she's quite competent for a woman in tech.",
  "biasTypes": ["gender"]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "rewritten": "The CEO brings deep expertise and strong leadership to the technology sector.",
    "explanation": "Removed gendered qualifications and assumptions. Focused on actual competence and role.",
    "changesCount": 2,
    "biasRemoved": [
      "Removed gendered qualifier 'for a woman'",
      "Replaced diminishing phrase 'quite competent' with 'deep expertise'"
    ]
  },
  "meta": {
    "processingTime": 1567,
    "model": "gemini-1.5-pro"
  }
}
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| text | string | Yes | Text to rewrite (max 5000 chars) |
| biasTypes | array | No | Specific bias types to focus on |

---

### 3. Compare Content
Side-by-side comparison of bias levels in two pieces of content.

**Endpoint**: `POST /compare`

**Request**:
```json
{
  "text1": "The attractive female employee handles HR perfectly.",
  "text2": "The employee brings strong HR expertise to the team."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "text1": {
      "biasScore": 0.72,
      "biasTypes": ["gender", "appearance"],
      "instances": 2,
      "severity": "medium"
    },
    "text2": {
      "biasScore": 0.12,
      "biasTypes": [],
      "instances": 0,
      "severity": "none"
    },
    "comparison": {
      "moreBiased": "text1",
      "differenceScore": 0.60,
      "recommendation": "Text2 is significantly more objective. Use it as a reference for improving Text1."
    }
  },
  "meta": {
    "processingTime": 1823,
    "model": "gemini-1.5-pro"
  }
}
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| text1 | string | Yes | First text to compare |
| text2 | string | Yes | Second text to compare |

---

### 4. Analyze Content
Comprehensive analysis with detailed metrics and recommendations.

**Endpoint**: `POST /analyze`

**Request**:
```json
{
  "content": "Our diverse team includes two women engineers among our 20 person team."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "overallBiasScore": 0.45,
    "summary": "Moderate bias detected. Language suggests tokenization rather than true inclusion.",
    "biasBreakdown": {
      "gender": {
        "score": 0.65,
        "instances": 1,
        "severity": "medium"
      },
      "other": {
        "score": 0.25,
        "instances": 0,
        "severity": "low"
      }
    },
    "keyFindings": [
      {
        "finding": "Tokenization language",
        "explanation": "Highlighting women's presence as notable suggests they're being 'added' rather than valued",
        "suggestion": "Use inclusive language: 'Our team has strong representation...'"
      }
    ],
    "recommendations": [
      "Focus on capabilities, not demographics",
      "Avoid 'diversity metrics' language that reduces people to numbers",
      "Emphasize inclusion through actions, not mentions"
    ],
    "objectivityScore": 0.55,
    "inclusivityScore": 0.48
  },
  "meta": {
    "processingTime": 2145,
    "model": "gemini-1.5-pro"
  }
}
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| content | string | Yes | Content to analyze deeply |

---

### 5. Chat - Conversational AI Arbiter
Interactive multi-turn conversation for bias analysis and ethical guidance.

**Endpoint**: `POST /chat`

**Request**:
```json
{
  "message": "How can I make my job posting less biased?",
  "conversationId": "conv_123abc",
  "conversationHistory": [
    {
      "role": "user",
      "content": "I want to improve my writing"
    },
    {
      "role": "assistant",
      "content": "I'd be happy to help! What would you like to improve?"
    }
  ]
}
```

**Response** (200 OK - Server-Sent Events Stream):
```
data: {"token": "Job"}
data: {"token": " postings"}
data: {"token": " often"}
data: {"token": " contain"}
data: {"complete": true, "conversationId": "conv_123abc", "fullMessage": "Job postings often contain age bias..."}
```

Or as JSON (if streaming not supported):
```json
{
  "success": true,
  "data": {
    "conversationId": "conv_123abc",
    "response": "Job postings often contain age bias through language like 'digital native' or 'energetic.' Instead, focus on required skills. For example, replace 'young, energetic team' with 'collaborative, results-driven team.' I recommend scanning job posts through our Bias Detector first.",
    "suggestions": [
      "Remove age-coded language (digital native, etc.)",
      "Focus on skills required, not demographics",
      "Use our Web Scan feature to check job postings from major sites"
    ]
  },
  "meta": {
    "processingTime": 2567,
    "model": "gemini-1.5-pro",
    "tokensUsed": 145
  }
}
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| message | string | Yes | User message |
| conversationId | string | No | Maintain conversation continuity |
| conversationHistory | array | No | Previous messages for context |

---

### 6. Web Scan - Analyze URLs
Scan and analyze bias in web content from URLs (news, articles, social posts).

**Endpoint**: `POST /web-scan`

**Request**:
```json
{
  "url": "https://news-site.com/article-about-women-in-tech"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "url": "https://news-site.com/article-about-women-in-tech",
    "cached": false,
    "cachedAt": null,
    "contentMetadata": {
      "title": "Why Women Struggle in Tech",
      "source": "Tech News Daily",
      "publishedAt": "2026-04-15",
      "author": "Jane Smith",
      "wordCount": 1245
    },
    "biasAnalysis": {
      "detected": true,
      "biasScore": 0.58,
      "biasTypes": ["gender", "framing"],
      "instances": 4,
      "summary": "Article uses deficit framing regarding women in tech"
    },
    "keyBiases": [
      {
        "phrase": "Why Women Struggle",
        "type": "framing",
        "severity": "medium",
        "explanation": "Title frames issue as women's problem rather than systemic"
      }
    ],
    "credibilityScore": 0.62,
    "recommendations": [
      "Check source credibility",
      "Look for systemic analysis vs. individual responsibility framing",
      "Compare with other sources on same topic"
    ]
  },
  "meta": {
    "processingTime": 3456,
    "model": "gemini-1.5-pro",
    "cacheInfo": "Not cached - fresh analysis"
  }
}
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| url | string | Yes | Valid HTTP/HTTPS URL to scan |

**Cache Behavior**: Results cached for 24 hours. Repeated requests return cached data with `"cached": true`.

---

### 7. Batch Analyze
Process multiple texts in a single request for efficiency.

**Endpoint**: `POST /batch-analyze`

**Request**:
```json
{
  "texts": [
    {
      "id": "text_1",
      "content": "First text to analyze..."
    },
    {
      "id": "text_2",
      "content": "Second text to analyze..."
    },
    {
      "id": "text_3",
      "content": "Third text to analyze..."
    }
  ],
  "webhookUrl": "https://yourapp.com/webhook/batch-results"
}
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "data": {
    "batchId": "batch_abc123xyz",
    "status": "processing",
    "totalItems": 3,
    "processedItems": 0,
    "estimatedTime": "45 seconds",
    "webhookUrl": "https://yourapp.com/webhook/batch-results"
  }
}
```

**Webhook Response** (When processing completes):
```json
{
  "batchId": "batch_abc123xyz",
  "status": "completed",
  "totalItems": 3,
  "results": [
    {
      "id": "text_1",
      "biasScore": 0.45,
      "biasDetected": true
    },
    {
      "id": "text_2",
      "biasScore": 0.12,
      "biasDetected": false
    },
    {
      "id": "text_3",
      "biasScore": 0.78,
      "biasDetected": true
    }
  ],
  "summary": {
    "totalBiasDetected": 2,
    "averageBiasScore": 0.45,
    "processingTime": 42000
  }
}
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| texts | array | Yes | Array of {id, content} objects (max 100) |
| webhookUrl | string | No | URL to send results when complete |

**Limits**:
- Maximum 100 items per batch
- Maximum 500 chars per item
- Processing: ~1 second per item

---

### 8. News Bias Scanner
Compares news coverage from Left, Right, and Center sources on a given topic.

**Endpoint**: `POST /news-bias`

**Request**:
```json
{
  "topic": "Universal Basic Income"
}
```

**Response** (200 OK):
```json
{
  "topic": "Universal Basic Income",
  "overallBiasAssessment": "Coverage is highly polarized between economic individualism and social welfare perspectives.",
  "sourceAnalysis": [
    {
      "sourceType": "Left",
      "exampleHeadline": "UBI: A Necessary Safety Net for the 21st Century",
      "neutralVersion": "The role of Universal Basic Income in modern social security",
      "angle": "Focuses on poverty reduction and human rights",
      "potentialBias": "Strongly pro-redistribution",
      "keyPhrases": ["safety net", "essential rights", "human dignity"]
    }
  ],
  "tipsForReaders": ["Look for data on long-term funding models..."]
}
```

---

### 9. Bias Battle
Gamified comparison of two texts to determine which is more biased.

**Endpoint**: `POST /bias-battle`

**Request**:
```json
{
  "textA": "Text content A",
  "textB": "Text content B"
}
```

**Response** (200 OK):
```json
{
  "winner": "B",
  "scoreA": 85,
  "scoreB": 95,
  "verdict": "Text B used significantly more neutral framing regarding the subject matter.",
  "improvementTips": ["Avoid emotional adjectives in Text A", "Ensure source attribution in Text B"]
}
```

---

### 10. Bias Fingerprint
Analyzes an individual writer's unique bias profile and writing style.

**Endpoint**: `POST /bias-fingerprint`

**Request**:
```json
{
  "content": "A large sample of the user's writing..."
}
```

**Response** (200 OK):
```json
{
  "fingerprint": {
    "style": "analytical",
    "tone": "neutral",
    "archetype": "Objective Observer",
    "emoji": "🧠"
  },
  "characteristics": {
    "objectivity": 88,
    "inclusivity": 92,
    "neutrality_score": 90
  }
}
```

## 🔐 Authentication & Authorization

### Firebase Authentication
All endpoints require a valid Firebase JWT token:

```bash
# Get token from Firebase client
const token = await user.getIdToken();

# Use in request
curl -H "Authorization: Bearer $token" \
  https://<project>.supabase.co/functions/v1/detect-bias
```

### Rate Limiting
- Free tier: 30 requests per minute
- Pro tier: 300 requests per minute
- Enterprise: Custom limits

Rate limit info in response headers:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 28
X-RateLimit-Reset: 1234567890
```

### CORS
All endpoints support CORS. Requests from browsers are allowed.

---

## 📊 Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "specific field info"
    }
  },
  "timestamp": "2026-04-18T10:30:00Z",
  "requestId": "req_xyz123"
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| INVALID_INPUT | 400 | Missing/invalid parameters |
| UNAUTHORIZED | 401 | Missing or invalid auth token |
| RATE_LIMIT_EXCEEDED | 429 | Rate limit hit |
| CONTENT_TOO_LONG | 413 | Content exceeds max length |
| INVALID_URL | 400 | URL format invalid or unreachable |
| API_ERROR | 500 | Internal Gemini API error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily down |

---

## 💡 Code Examples

### JavaScript/Node.js

```javascript
// Using fetch API
async function detectBias(content) {
  const token = await firebase.auth().currentUser.getIdToken();
  
  const response = await fetch(
    'https://your-project.supabase.co/functions/v1/detect-bias',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content,
        type: 'text'
      })
    }
  );
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.error.message);
  return data.data;
}

// Usage
try {
  const result = await detectBias('Some potentially biased text...');
  console.log('Bias Score:', result.confidenceScore);
  console.log('Instances:', result.biasInstances);
} catch (error) {
  console.error('Error:', error.message);
}
```

### React Hook

```javascript
import { useState } from 'react';
import { useAuth } from './firebase'; // Your auth hook

export function useBiasDetection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  const detectBias = async (content) => {
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/detect-bias`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content })
        }
      );
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error.message);
      }
      
      return await res.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { detectBias, loading, error };
}
```

### Python

```python
import requests
import json

class UnbiasedAIClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def detect_bias(self, content, content_type='text'):
        response = requests.post(
            f'{self.base_url}/detect-bias',
            headers=self.headers,
            json={
                'content': content,
                'type': content_type
            }
        )
        response.raise_for_status()
        return response.json()
    
    def rewrite(self, text, bias_types=None):
        response = requests.post(
            f'{self.base_url}/rewrite',
            headers=self.headers,
            json={
                'text': text,
                'biasTypes': bias_types or []
            }
        )
        response.raise_for_status()
        return response.json()

# Usage
client = UnbiasedAIClient('https://your-project.supabase.co/functions/v1', token)
result = client.detect_bias('Text to analyze...')
print(f"Bias detected: {result['data']['detected']}")
```

---

## 📈 Best Practices

### 1. Error Handling
Always check for errors and handle rate limits:
```javascript
try {
  const result = await detectBias(text);
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Wait and retry
    setTimeout(() => retry(), error.retryAfter * 1000);
  } else {
    // Handle other errors
  }
}
```

### 2. Caching
Cache results to reduce API calls:
```javascript
const cache = new Map();

async function detectBiasWithCache(content) {
  const key = `bias:${hashContent(content)}`;
  
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = await detectBias(content);
  cache.set(key, result);
  return result;
}
```

### 3. Batch Operations
For multiple texts, use batch endpoint:
```javascript
// Instead of looping:
for (let text of texts) {
  await detectBias(text); // ❌ Slow, rate-limited
}

// Use batch:
const result = await batchAnalyze(texts); // ✅ Fast, efficient
```

### 4. WebSocket for Chat
Use server-sent events for streaming responses:
```javascript
const eventSource = new EventSource(
  `${API_BASE}/chat?token=${token}&message=...`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.complete) {
    console.log('Done:', data.fullMessage);
    eventSource.close();
  } else {
    console.log('Token:', data.token);
  }
};
```

---

## 🧪 Testing the API

### Using cURL

```bash
# Detect bias
curl -X POST https://your-project.supabase.co/functions/v1/detect-bias \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "That girl is good at math",
    "type": "text"
  }'

# Web scan
curl -X POST https://your-project.supabase.co/functions/v1/web-scan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/article"
  }'
```

### Postman Collection
Import this into Postman:
```json
{
  "info": {
    "name": "Unbiased AI API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Detect Bias",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"content\": \"Sample text\",\n  \"type\": \"text\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/detect-bias",
          "host": ["{{base_url}}"],
          "path": ["detect-bias"]
        }
      }
    }
  ]
}
```

---

## 📞 Support & Resources

- **Documentation**: [GitHub Wiki](https://github.com/KR-007J/unbiased-ai/wiki)
- **Issues**: [GitHub Issues](https://github.com/KR-007J/unbiased-ai/issues)
- **Email**: support@unbiased-ai.dev
- **Discord**: [Community Server](https://discord.gg/unbiased-ai)

---

**Last Updated**: April 18, 2026
**API Version**: v1
**Status**: Production Ready
