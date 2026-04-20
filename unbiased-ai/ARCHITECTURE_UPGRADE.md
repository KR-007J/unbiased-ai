# 🏗️ TECHNICAL ARCHITECTURE UPGRADE

## Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  AnalyzePage │ ComparePage │ ChatPage │ Dashboard │ History   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
            ┌──────────────┴──────────────┐
            │                             │
    ┌───────▼────────────┐        ┌──────▼────────────┐
    │  Firebase Auth     │        │  Supabase Edge    │
    │  Firebase Hosting  │        │  PostgreSQL DB    │
    └────────────────────┘        └──────┬─────────────┘
                                         │
                                    ┌────▼────────────┐
                                    │ Gemini 1.5 Pro  │
                                    └─────────────────┘
```

### Current Capabilities
- 4 working backend functions
- Basic auth & database
- Simple UI pages
- Direct API calls
- No caching/optimization

### Current Limitations
- No real-time features
- Limited scalability
- No data persistence for long ops
- No background jobs
- Single tenant only

---

## Proposed Architecture (Winning Formula)

```
┌───────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + PWA)                         │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Pages: Analyze, Compare, Chat, Dashboard, History, Vision  │  │
│  │        Community Hub, Analytics, WebScan, Organization    │  │
│  │ Components: Leaderboard, UserProfile, AnalyticsChart      │  │
│  │ Store: Zustand (state management)                         │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│  │ Service Workers (offline, sync)                             │  │
│  │ Analytics SDK                                               │  │
└──┼────────────────────────────────────────────────────────────┘
   │ HTTPS + JWT
   │
   ├─────────────────────────────────────────────────┐
   │                                                 │
┌──▼──────────────────┐      ┌────────────────────┬─▼──────┐
│  Firebase          │      │  Supabase          │ Redis  │
│  - Auth            │      │  - PostgreSQL      │ (Cache)│
│  - Hosting         │      │  - Auth            │        │
│  - Realtime        │      │  - RLS Policies    │        │
└───────────────────┘      └────────────────────┴────────┘
                                       │
                    ┌──────────────────┼──────────────┐
                    │                  │              │
          ┌─────────▼──────────┐  ┌────▼────────┐  ┌▼──────────┐
          │ Edge Functions     │  │ Background  │  │ Message   │
          │ ┌────────────────┐ │  │ Workers     │  │ Queue     │
          │ │ detect-bias    │ │  │ ┌────────┐  │  │ (Bull)    │
          │ │ rewrite        │ │  │ │Forecast│  │  │           │
          │ │ compare        │ │  │ │Batch   │  │  │           │
          │ │ analyze        │ │  │ │Email   │  │  │           │
          │ │ chat           │ │  │ └────────┘  │  │           │
          │ │ web-scan       │ │  │             │  │           │
          │ │ forecast       │ │  │             │  │           │
          │ │ batch-analyze  │ │  │             │  │           │
          │ └────────────────┘ │  │             │  │           │
          └────────────┬────────┘  └─────────────┘  └───────────┘
                       │
          ┌────────────▼──────────┐
          │  AI Models            │
          │  ┌─────────────────┐  │
          │  │ Gemini 1.5 Pro  │  │
          │  └─────────────────┘  │
          │  ┌─────────────────┐  │
          │  │ Embeddings API  │  │
          │  └─────────────────┘  │
          └───────────────────────┘

        ┌────────────────────────────────┐
        │  Monitoring & Analytics        │
        │  - Sentry (errors)             │
        │  - LogRocket (UX)              │
        │  - Custom events               │
        └────────────────────────────────┘
```

### New Capabilities
- ✅ 8+ backend functions
- ✅ Real-time chat with context
- ✅ Web content scanning
- ✅ Predictive forecasting
- ✅ Batch processing
- ✅ Background jobs
- ✅ Caching layer
- ✅ Message queue
- ✅ Analytics & monitoring
- ✅ PWA/offline support

---

## Backend Function Architecture

### Current Functions (4)
```
├── detect-bias
│   ├── Input: content, type
│   ├── Process: Call Gemini
│   └── Output: bias analysis JSON
│
├── rewrite
│   ├── Input: text, biasTypes
│   ├── Process: Call Gemini
│   └── Output: rewritten text
│
├── compare
│   ├── Input: text1, text2
│   ├── Process: Compare biases
│   └── Output: diff analysis
│
└── analyze
    ├── Input: content
    ├── Process: Full analysis
    └── Output: comprehensive report
```

### NEW Functions to Add (4)
```
├── chat (ENABLE & ENHANCE)
│   ├── Input: message, conversationHistory
│   ├── Process: Multi-turn with context
│   ├── Store: Messages in DB
│   └── Output: conversational response + reasoning
│
├── web-scan (NEW - KILLER FEATURE)
│   ├── Input: URL
│   ├── Process: Extract content → Analyze → Cache
│   ├── Store: web_scans table (cache 24h)
│   └── Output: URL bias analysis + metadata
│
├── forecast-bias (NEW - ADVANCED)
│   ├── Input: user_id, period
│   ├── Process: Query history → Pattern analysis → Predict
│   ├── Store: forecasts table
│   └── Output: 30-day bias probability curve
│
└── batch-analyze (NEW - SCALABILITY)
    ├── Input: texts[] (CSV/JSON)
    ├── Process: Parallel processing (max 10)
    ├── Queue: Use Bull for job management
    └── Output: Batch report + webhook
```

### Optimized Function Stack
```typescript
// Base functions remain lean (15-20 lines each)
// New cross-cutting concerns:

// 1. Caching layer
const getCachedAnalysis = (contentHash) => redis.get(`analysis:${hash}`)
const setCachedAnalysis = (hash, result, ttl) => redis.setex(...)

// 2. Rate limiting
const checkRateLimit = (userId, limit=30, window=60) => redis.incr(...)

// 3. Error handling
const handleError = (error, context) => ({
  code: error.code || 'INTERNAL_ERROR',
  message: error.message,
  details: context,
  timestamp: new Date().toISOString(),
  requestId: generateId()
})

// 4. Logging & monitoring
const logEvent = (type, data, userId) => supabase.from('logs').insert(...)

// 5. Response formatting
const formatResponse = (data) => ({
  success: true,
  data,
  timestamp: new Date().toISOString()
})
```

---

## Database Schema Evolution

### Current (1 table)
```sql
analyses
├── id (uuid)
├── user_id (text)
├── original_text (text)
├── bias_score (float)
├── confidence (float)
├── findings (jsonb)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### Enhanced Schema (10+ tables)

```sql
-- Core
analyses (enhanced)
├── + language
├── + content_category
├── + is_public
├── + liked_by (jsonb)
└── + comment_count

-- User Management
user_profiles
├── id
├── user_id (unique)
├── display_name
├── avatar_url
├── bio
├── contribution_level
├── badges (jsonb)
├── created_at

-- Social Features
badges
├── id
├── user_id
├── badge_type (first_analysis, bias_buster, 100_analyses)
├── earned_at

leaderboards
├── id
├── user_id
├── rank
├── total_analyses
├── month
├── created_at

-- Collaboration
messages (for chat)
├── id
├── user_id
├── analysis_id
├── message_content
├── role (user|assistant)
├── metadata (jsonb)
├── created_at

-- Data Insights
web_scans (cache)
├── id
├── url_hash
├── original_url
├── content
├── bias_analysis
├── cached_at (for TTL)

forecasts
├── id
├── user_id
├── bias_type
├── probability_30day (float)
├── severity_trend
├── created_at

-- Audit & Logging
audit_logs
├── id
├── user_id
├── action
├── target_table
├── changes (jsonb)
├── timestamp

-- Search & Analytics
user_stats (view - already exists)
content_index (materialized view)
```

---

## Data Flow Examples

### Current: Simple Analysis Flow
```
User Input
    ↓
API Call to detect-bias
    ↓
Gemini Response
    ↓
Save to analyses table
    ↓
Return to Frontend
```

### NEW: Chat with Context Flow
```
User Message
    ↓
Retrieve Conversation History
    ↓
Build context-aware prompt
    ↓
Stream response from Gemini
    ↓
Save message + response to messages table
    ↓
Update user analytics
    ↓
Stream to Frontend (WebSocket)
```

### NEW: Web Scan with Cache
```
URL Input
    ↓
Check Redis Cache (url_hash)
    ↓
IF cached → Return cached
ELSE:
    ├─ Extract content (jsdom/cheerio)
    ├─ Run bias analysis
    ├─ Store in web_scans
    ├─ Cache in Redis (24h)
    └─ Return result
    ↓
Display to User
```

### NEW: Predictive Forecast
```
Trigger: User requests forecast
    ↓
Query last 30 analyses for user
    ↓
Send pattern data + prompt to Gemini
    ↓
Gemini returns trend analysis
    ↓
Store in forecasts table
    ↓
Return visualization data
    ↓
Display 30-day probability curves
```

---

## API Contract Evolution

### Current: Simple Request/Response
```typescript
// Simple bias detection
POST /detect-bias
{
  "content": "string",
  "type": "text|url|email"
}

Response:
{
  "detected": boolean,
  "biasInstances": [{
    "phrase": "string",
    "biasType": "string",
    "severity": "low|medium|high"
  }]
}
```

### NEW: Enhanced with Standards
```typescript
// 1. Standardized request
POST /api/v1/detect-bias
{
  "content": "string",
  "type": "text|url|email",
  "requestId": "uuid", // idempotency
  "metadata": {
    "language": "en",
    "category": "news"
  }
}

// 2. Standardized response
{
  "success": true,
  "status": 200,
  "timestamp": "2026-04-18T...",
  "requestId": "uuid",
  "data": {
    "detected": boolean,
    "biasInstances": [],
    "overallAssessment": "string",
    "confidence": 0.95
  },
  "meta": {
    "processingTime": 234, // ms
    "model": "gemini-1.5-pro",
    "cached": false
  }
}

// 3. Error response
{
  "success": false,
  "status": 429,
  "timestamp": "2026-04-18T...",
  "requestId": "uuid",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "30 requests per minute limit exceeded",
    "details": {
      "limit": 30,
      "window": 60,
      "retryAfter": 15
    }
  }
}

// 4. Chat with streaming
POST /api/v1/chat
{
  "message": "string",
  "conversationId": "uuid",
  "requestId": "uuid"
}

Response (Server-Sent Events):
data: {"token": "The"}
data: {"token": " bias"}
data: {"token": " here"}
data: {"complete": true, "conversationId": "uuid"}

// 5. Web scan
POST /api/v1/web-scan
{
  "url": "https://...",
  "requestId": "uuid"
}

Response:
{
  "success": true,
  "data": {
    "url": "https://...",
    "cached": true,
    "cachedAt": "2026-04-17T...",
    "analysis": {
      "detected": true,
      "biasInstances": [],
      "credibilityScore": 0.75
    },
    "metadata": {
      "title": "Article Title",
      "source": "Publisher",
      "publishedAt": "2026-04-18"
    }
  }
}
```

---

## Performance Targets

### Current Performance
- Detect-bias: ~2-3 seconds
- API response: ~500-800ms
- Page load: ~3-4 seconds

### Target Performance (Winning)
| Metric | Current | Target | Method |
|--------|---------|--------|--------|
| Detect-bias | 2-3s | <1.5s | Caching + optimization |
| Chat response | N/A | <2s | Streaming + prefetch |
| Web scan | N/A | <3s (cache <0.5s) | Redis cache |
| Page load | 3-4s | <2s | Code splitting, lazy load |
| API response | 500-800ms | <300ms | Caching, CDN |
| Chat latency | N/A | <100ms | WebSocket |

---

## Scalability Architecture

### Current: Single-user
- Sequential processing
- Limited to one request at a time
- Simple database queries

### Target: Enterprise Scale
```
Load Balancer
    │
    ├─ Instance 1 (API Server)
    ├─ Instance 2 (API Server)
    └─ Instance 3 (API Server)
    
Message Queue (Bull/Redis)
    ├─ forecast_queue
    ├─ batch_queue
    ├─ email_queue
    └─ webhook_queue
    
Workers (Background Jobs)
    ├─ Forecast Worker (processing)
    ├─ Batch Worker (bulk analysis)
    ├─ Email Worker (notifications)
    └─ Webhook Worker (integrations)
    
Database (Read replicas)
    ├─ Primary (write)
    ├─ Replica 1 (read analytics)
    └─ Replica 2 (read reports)
    
Cache Layer (Redis Cluster)
    ├─ Analysis cache
    ├─ User session cache
    └─ Rate limit bucket
```

### Concurrency & Throughput
- Current: ~10 concurrent users
- Target: ~1000 concurrent users (100x scale)
- Batch: 1000+ items processed in <5 minutes

---

## Security Architecture

### Current
- Firebase Auth
- Basic RLS policies
- CORS enabled

### Enhanced
```
┌─────────────────────────────────┐
│  CloudFlare DDoS Protection     │
└────────────┬────────────────────┘
             │ (Blocked malicious traffic)
┌────────────▼────────────────────┐
│  WAF Rules                       │
│  - Input validation              │
│  - Rate limiting                 │
│  - IP blocklist                  │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│  API Authentication              │
│  - JWT verification              │
│  - API key validation            │
│  - CORS checking                 │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│  Authorization (RLS)             │
│  - User isolation                │
│  - Row-level policies            │
│  - Attribute-based access        │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│  Data Protection                 │
│  - Encryption in transit (TLS)   │
│  - Encryption at rest (DB)       │
│  - Secrets management (Vault)    │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│  Audit & Logging                 │
│  - All actions logged             │
│  - Timestamp & user tracked       │
│  - Compliance ready               │
└─────────────────────────────────┘
```

---

## Deployment Architecture

### Current: Firebase + Supabase
```
Git Push
  ↓
Firebase auto-deploy
  ↓
Live (single region)
```

### Enhanced: Multi-stage with CI/CD
```
Git Push
  ↓
GitHub Actions Workflow
  ├─ Lint & Format Check
  ├─ Unit Tests Run
  ├─ Build & Verify
  ├─ Security Scan (SAST)
  └─ Code Coverage Check
  ↓ (If all pass)
Deploy to Staging
  ├─ Firebase Staging
  ├─ Supabase Staging
  └─ Run E2E Tests
  ↓ (If tests pass)
Manual Approval (or auto on main)
  ↓
Deploy to Production
  ├─ Firebase Multi-region
  ├─ Supabase Production
  ├─ CDN Cache Invalidation
  └─ Health Check
  ↓
Monitoring & Alerts
  ├─ Sentry Error Tracking
  ├─ Performance Monitoring
  ├─ Availability Tracking
  └─ Alert on Anomalies
```

---

**This architecture positions Unbiased AI as a production-grade, enterprise-ready platform worthy of 1st place at Google Hackathon!**
