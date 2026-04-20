# Unbiased AI - Enterprise Documentation

## Overview

Unbiased AI is an enterprise-grade platform that leverages advanced AI to detect, analyze, and neutralize bias in digital content. Built with cutting-edge multimodal AI and designed for scalability, security, and compliance.

## Key Features

- **Advanced Bias Detection**: Identifies 8+ types of bias with 95%+ accuracy
- **Real-time Analysis**: Process content in milliseconds with enterprise caching
- **Multi-tenant Architecture**: Complete organization and team management
- **GDPR Compliance**: Full data protection and privacy controls
- **Enterprise Security**: SOC 2 compliant with advanced threat protection
- **API-First Design**: RESTful APIs with OpenAPI specification
- **Real-time Collaboration**: WebSocket-powered chat and notifications

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- Supabase account (for backend)
- Firebase account (for frontend hosting)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/unbiased-ai.git
cd unbiased-ai

# Install frontend dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

### Basic Usage

```javascript
// Detect bias in text
const response = await fetch('/api/detect-bias', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    content: 'He is a great leader and she supports him well',
    type: 'text'
  })
});

const result = await response.json();
console.log(result.data.biasInstances);
```

## API Reference

### Authentication

All API requests require authentication using Bearer tokens:

```
Authorization: Bearer <your-jwt-token>
```

### Rate Limits

- **Free Tier**: 1,000 requests/month
- **Pro Tier**: 10,000 requests/month
- **Enterprise**: Custom limits

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

### Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "status": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Content is required",
    "details": { "field": "content" }
  }
}
```

## Analysis APIs

### Detect Bias

Analyze text content for various types of bias.

**Endpoint**: `POST /api/detect-bias`

**Request**:
```json
{
  "content": "Text to analyze",
  "type": "text",
  "metadata": {
    "language": "en",
    "category": "social_media"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "detected": true,
    "biasInstances": [
      {
        "phrase": "he is a doctor",
        "biasType": "gender",
        "severity": "medium",
        "explanation": "Uses male pronoun as default",
        "suggestion": "they are a doctor"
      }
    ],
    "overallAssessment": "Contains gender bias"
  },
  "meta": {
    "processingTime": 1250,
    "model": "gemini-2.5-flash",
    "cached": false
  }
}
```

### Rewrite Text

Generate unbiased alternatives to biased content.

**Endpoint**: `POST /api/rewrite`

**Request**:
```json
{
  "text": "Original biased text",
  "biasTypes": ["gender", "political"],
  "tone": "neutral"
}
```

### Compare Texts

Compare two pieces of content for objectivity.

**Endpoint**: `POST /api/compare`

**Request**:
```json
{
  "textA": "First text to compare",
  "textB": "Second text to compare"
}
```

### Comprehensive Analysis

Deep analysis with detailed bias breakdown.

**Endpoint**: `POST /api/analyze`

**Request**:
```json
{
  "text": "Content to analyze deeply",
  "includeRecommendations": true,
  "severity": "detailed"
}
```

## Organization Management

### Creating Organizations

```javascript
const response = await fetch('/api/organizations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    name: 'Acme Corp',
    slug: 'acme-corp',
    description: 'Leading tech company',
    industry: 'technology',
    size: 'large'
  })
});
```

### Managing Members

```javascript
// Invite a user
await fetch('/api/organizations/org-123/invite', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    email: 'user@company.com',
    role: 'editor'
  })
});

// Update member role
await fetch('/api/organizations/org-123/members/member-456', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    role: 'admin'
  })
});
```

## Batch Processing

### Large-Scale Analysis

```javascript
const response = await fetch('/api/batch-analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    texts: [
      { id: '1', content: 'First text...' },
      { id: '2', content: 'Second text...' }
    ],
    webhookUrl: 'https://your-app.com/webhook',
    priority: 1
  })
});

const { batchId } = await response.json();

// Check status
const statusResponse = await fetch(`/api/batch/${batchId}/status`);
const status = await statusResponse.json();
```

### Webhook Integration

Set up webhooks to receive batch completion notifications:

```javascript
// Webhook endpoint in your application
app.post('/webhook/batch-complete', (req, res) => {
  const { batchId, results, summary } = req.body;

  console.log(`Batch ${batchId} completed:`, summary);
  // Process results...

  res.sendStatus(200);
});
```

## Real-Time Features

### Chat API

```javascript
// Send a message
const response = await fetch('/api/chat/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    message: 'How can I write more objectively?',
    conversationId: 'conv-123'
  })
});

// Get conversation history
const history = await fetch('/api/chat/history?conversationId=conv-123');
const { messages } = await history.json();
```

### WebSocket Connections (Future)

```javascript
// Real-time message updates
const ws = new WebSocket('wss://api.unbiased-ai.com/chat');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'new_message') {
    displayMessage(data.message);
  }
};
```

## GDPR Compliance

### Data Export

```javascript
// Request data export
const response = await fetch('/api/gdpr/export', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

// Download the data
const blob = await response.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'gdpr-export.json';
a.click();
```

### Data Deletion

```javascript
// Request account deletion
await fetch('/api/gdpr/delete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    confirmDeletion: true,
    reason: 'User requested deletion'
  })
});
```

### Consent Management

```javascript
// Check current consent
const consent = await fetch('/api/gdpr/consent');
const { consents } = await consent.json();

// Update consent preferences
await fetch('/api/gdpr/consent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    consentType: 'analytics',
    granted: true
  })
});
```

## Security Best Practices

### API Security

1. **Always use HTTPS** in production
2. **Validate all input** data thoroughly
3. **Implement rate limiting** to prevent abuse
4. **Use parameterized queries** to prevent SQL injection
5. **Sanitize HTML content** to prevent XSS attacks

### Authentication

1. **Use JWT tokens** with appropriate expiration
2. **Implement refresh token rotation**
3. **Enable multi-factor authentication** for sensitive operations
4. **Log authentication events** for security monitoring

### Data Protection

1. **Encrypt sensitive data** at rest and in transit
2. **Implement data retention policies**
3. **Regular security audits** and penetration testing
4. **Monitor for data breaches** and unauthorized access

## Monitoring & Analytics

### System Health

```javascript
// Get system dashboard
const dashboard = await fetch('/api/monitoring/dashboard?period=24h');
const metrics = await dashboard.json();

console.log('System Health:', metrics.health);
console.log('Active Users:', metrics.users.activeUsers);
console.log('API Performance:', metrics.performance);
```

### Alert Management

```javascript
// Get active alerts
const alerts = await fetch('/api/monitoring/alerts?severity=high');
const { alerts: activeAlerts } = await alerts.json();

// Resolve an alert
await fetch('/api/monitoring/alerts/alert-123/resolve', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    resolution: 'Issue resolved by updating configuration'
  })
});
```

## Deployment & Scaling

### Environment Setup

1. **Development**: Local development with hot reload
2. **Staging**: Automated deployment for testing
3. **Production**: Full production deployment with monitoring

### Scaling Configuration

```javascript
// Check scaling recommendations
const scaling = await fetch('/api/scaling/status');
const { recommendations } = await scaling.json();

// Apply scaling action
if (recommendations.some(r => r.action === 'scale_up')) {
  await fetch('/api/scaling/scale-up', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      service: 'api_functions',
      reason: 'High load detected'
    })
  });
}
```

## Troubleshooting

### Common Issues

1. **Rate Limiting**: Wait for the reset period or upgrade your plan
2. **Authentication Errors**: Check token expiration and refresh if needed
3. **Large Payloads**: Break large requests into smaller batches
4. **Webhook Failures**: Verify webhook URL and implement retry logic

### Support

- **Documentation**: https://docs.unbiased-ai.dev
- **API Status**: https://status.unbiased-ai.dev
- **Support Email**: support@unbiased-ai.dev
- **Community Forum**: https://community.unbiased-ai.dev

## SDKs & Libraries

### JavaScript SDK

```bash
npm install @unbiased-ai/sdk
```

```javascript
import { UnbiasedAI } from '@unbiased-ai/sdk';

const client = new UnbiasedAI({
  apiKey: 'your-api-key'
});

// Detect bias
const result = await client.detectBias('Text to analyze');
```

### Python SDK

```bash
pip install unbiased-ai
```

```python
from unbiased_ai import Client

client = Client(api_key='your-api-key')
result = client.detect_bias('Text to analyze')
```

### Go SDK

```bash
go get github.com/unbiased-ai/go-sdk
```

```go
import "github.com/unbiased-ai/go-sdk"

client := sdk.NewClient("your-api-key")
result, err := client.DetectBias("Text to analyze")
```

## Changelog

### Version 1.0.0 (Current)
- Complete rewrite with enterprise architecture
- Multi-tenant organization support
- Advanced AI models (Gemini 2.5 Flash)
- Real-time chat and collaboration
- GDPR compliance features
- Comprehensive API with OpenAPI spec
- Advanced monitoring and scaling

### Version 0.9.0 (Previous)
- Basic bias detection functionality
- Single-tenant architecture
- Limited API features

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

**Unbiased AI** - Promoting objective communication through advanced AI technology.