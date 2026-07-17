# Imperial Codex — Monitoring and Observability Guide

This guide covers monitoring and observability for Imperial Codex, including health checks, metrics, alerting, and troubleshooting.

---

## Overview

Imperial Codex implements comprehensive monitoring across all integrated services:

| Component | Monitoring Method |
|-----------|-------------------|
| **Application** | Structured JSON logging, HTTP request logging |
| **Database** | Supabase query performance, connection pool metrics |
| **Cache** | Redis hit/miss ratio, memory usage |
| **Vector Search** | Qdrant/Pinecone query latency, vector count |
| **External APIs** | OpenAI, Anthropic, GitHub API response times |
| **Infrastructure** | AWS CloudWatch, Vercel function logs |

---

## Health Checks

### Application Health

The `/api/health` route returns the health status of all integrated services:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T10:30:00Z",
  "services": {
    "supabase": {
      "status": "healthy",
      "latency_ms": 45
    },
    "redis": {
      "status": "healthy",
      "latency_ms": 2
    },
    "qdrant": {
      "status": "healthy",
      "latency_ms": 120
    },
    "pinecone": {
      "status": "healthy",
      "latency_ms": 85
    },
    "openai": {
      "status": "healthy",
      "latency_ms": 250
    },
    "anthropic": {
      "status": "healthy",
      "latency_ms": 300
    }
  }
}
```

### Service-Specific Health Checks

**Supabase:**
```bash
curl https://your-deployment.vercel.app/api/health/supabase
```

**Redis:**
```bash
curl https://your-deployment.vercel.app/api/health/redis
```

**Qdrant:**
```bash
curl https://your-deployment.vercel.app/api/health/qdrant
```

**Pinecone:**
```bash
curl https://your-deployment.vercel.app/api/health/pinecone
```

---

## Metrics

### Application Metrics

The `/api/metrics` route returns application metrics:

```json
{
  "timestamp": "2026-01-15T10:30:00Z",
  "request_rate": {
    "total": 1250,
    "per_second": 0.42
  },
  "error_rate": {
    "total": 15,
    "percentage": 1.2
  },
  "latency_percentiles": {
    "p50": 120,
    "p95": 450,
    "p99": 890
  },
  "by_endpoint": {
    "/api/status": {
      "count": 450,
      "p50": 15,
      "p95": 45,
      "p99": 80
    },
    "/api/strike": {
      "count": 120,
      "p50": 2500,
      "p95": 5000,
      "p99": 8000
    },
    "/api/agent/chat": {
      "count": 380,
      "p50": 1500,
      "p95": 3500,
      "p99": 6000
    }
  }
}
```

### Service-Specific Metrics

**Supabase:**
```json
{
  "timestamp": "2026-01-15T10:30:00Z",
  "queries_per_second": 15.2,
  "avg_query_latency_ms": 45,
  "connection_pool_usage": 0.65,
  "replication_lag_ms": 12
}
```

**Redis:**
```json
{
  "timestamp": "2026-01-15T10:30:00Z",
  "hit_rate": 0.87,
  "memory_usage_mb": 256,
  "memory_peak_mb": 512,
  "connected_clients": 45
}
```

**Qdrant:**
```json
{
  "timestamp": "2026-01-15T10:30:00Z",
  "collections": {
    "library-embeddings": {
      "vectors_count": 345,
      "memory_usage_mb": 128,
      "avg_query_latency_ms": 120
    }
  }
}
```

**Pinecone:**
```json
{
  "timestamp": "2026-01-15T10:30:00Z",
  "index": {
    "name": "imperial-codex-index",
    "vectors_count": 345,
    "storage_usage_gb": 0.5,
    "avg_query_latency_ms": 85
  }
}
```

---

## Alerting

### Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Error Rate | > 0.5% | > 1% |
| Latency (p95) | > 1000ms | > 2000ms |
| Latency (p99) | > 3000ms | > 5000ms |
| CPU Usage | > 70% | > 85% |
| Memory Usage | > 75% | > 90% |
| Database Connections | > 70% | > 85% |
| Cache Hit Rate | < 80% | < 60% |

### Alert Channels

- **Slack:** `#imperial-codex-alerts` channel
- **Email:** ops@dalizebo.holdings (critical only)
- **PagerDuty:** On-call rotation (critical only)

### Alert Examples

**Error Rate Alert:**
```json
{
  "alert_type": "error_rate",
  "severity": "critical",
  "message": "Error rate exceeded 1% threshold",
  "details": {
    "error_rate": 1.2,
    "threshold": 1.0,
    "period": "5m"
  }
}
```

**Latency Alert:**
```json
{
  "alert_type": "latency",
  "severity": "warning",
  "message": "P95 latency exceeded 1000ms threshold",
  "details": {
    "latency_ms": 1250,
    "threshold_ms": 1000,
    "endpoint": "/api/strike",
    "period": "5m"
  }
}
```

**Service Unavailable Alert:**
```json
{
  "alert_type": "service_unavailable",
  "severity": "critical",
  "message": "Supabase service is unavailable",
  "details": {
    "service": "supabase",
    "error": "Connection timeout",
    "retries": 3
  }
}
```

---

## Logging

### Structured Logging Format

All logs are output in JSON format with the following structure:

```json
{
  "timestamp": "2026-01-15T10:30:00.123Z",
  "level": "info",
  "message": "HTTP request completed",
  "context": {
    "method": "POST",
    "path": "/api/strike",
    "status_code": 200,
    "duration_ms": 2450,
    "user_id": "user_123",
    "clearance_level": 2
  }
}
```

### Log Levels

| Level | Purpose | Example |
|-------|---------|---------|
| `debug` | Detailed debugging information | SQL query execution details |
| `info` | Normal operational events | HTTP request completion |
| `warn` | Warning conditions | Cache miss, fallback invoked |
| `error` | Error conditions | Database query failure |
| `fatal` | Critical errors | Service unavailable |

### Log Destinations

- **Vercel:** Function logs (accessible via Vercel dashboard)
- **AWS CloudWatch:** Centralized logging (90-day retention)
- **Local Development:** Console output

---

## Tracing

### Request Tracing

Each request is assigned a unique trace ID that flows through all services:

```
Trace ID: req_abc123
├─ HTTP Request (Next.js)
│  ├─ Authentication (Clearance Gate)
│  ├─ Business Logic (Strike Output Engine)
│  ├─ Database Query (Supabase)
│  └─ HTTP Response
```

### Distributed Tracing

The system supports distributed tracing across services:

```
Trace ID: req_abc123
├─ Next.js (Vercel)
│  ├─ Supabase (PostgreSQL)
│  ├─ Redis (Cache)
│  ├─ Qdrant (Vector Search)
│  └─ OpenAI (LLM)
```

---

## Dashboard

### System Status Dashboard

The dashboard displays key metrics:

| Metric | Value | Status |
|--------|-------|--------|
| Kernel Version | v16.2 | Active |
| System Health | Healthy | Green |
| Active Recursive Loops | 104 | Normal |
| Error Rate (24h) | 0.3% | Normal |
| P95 Latency | 450ms | Normal |
| Cache Hit Rate | 87% | Normal |

### Service Health Dashboard

| Service | Status | Latency | Uptime |
|---------|--------|---------|--------|
| Supabase | Healthy | 45ms | 99.99% |
| Redis | Healthy | 2ms | 99.95% |
| Qdrant | Healthy | 120ms | 99.90% |
| Pinecone | Healthy | 85ms | 99.90% |
| OpenAI | Healthy | 250ms | 99.50% |
| Anthropic | Healthy | 300ms | 99.50% |

---

## Troubleshooting

### Common Issues

**1. High Error Rate**

- Check Vercel function logs for error patterns
- Review CloudWatch alarms for service-specific errors
- Verify API keys and credentials are valid
- Check for rate limiting on external services

**2. High Latency**

- Check database query performance
- Review Redis cache hit rate
- Verify vector search index size and query complexity
- Check network latency to external services

**3. Cache Misses**

- Verify Redis connection
- Check cache TTL settings
- Review cache invalidation logic
- Monitor Redis memory usage

**4. Database Connection Errors**

- Check connection pool size
- Review query performance
- Verify database instance size
- Check for connection leaks

### Diagnostic Commands

```bash
# Check system health
curl https://your-deployment.vercel.app/api/health

# Check application metrics
curl https://your-deployment.vercel.app/api/metrics

# Check service-specific health
curl https://your-deployment.vercel.app/api/health/supabase
curl https://your-deployment.vercel.app/api/health/redis

# Check cost summary
curl https://your-deployment.vercel.app/api/cost/summary

# Check security audit log
curl https://your-deployment.vercel.app/api/security/audit-log
```

---

## Cost Monitoring

### Cost Summary

The `/api/cost/summary` route returns estimated monthly costs:

```json
{
  "timestamp": "2026-01-15T10:30:00Z",
  "estimated_monthly_cost": 450.00,
  "breakdown": {
    "aws_ec2": 120.00,
    "aws_s3": 15.00,
    "aws_rds": 85.00,
    "supabase": 50.00,
    "vercel": 20.00,
    "qdrant": 45.00,
    "pinecone": 60.00,
    "redis": 55.00
  },
  "budget": 500.00,
  "utilization_percentage": 90.0
}
```

### Cost Optimization

The `/api/cost/optimization` route provides recommendations:

```json
{
  "timestamp": "2026-01-15T10:30:00Z",
  "recommendations": [
    {
      "service": "aws_ec2",
      "current": "t3.xlarge",
      "recommended": "t3.large",
      "estimated_savings": 40.00,
      "reason": "CPU utilization < 20% for 24 hours"
    },
    {
      "service": "supabase",
      "current": "Standard Plan",
      "recommended": "Pro Plan",
      "estimated_savings": 0.00,
      "reason": "Current plan underutilized, consider downgrading"
    }
  ]
}
```

---

## Next Steps

1. **Set up alerting** — Configure Slack notifications for critical alerts
2. **Create dashboards** — Set up Vercel and AWS CloudWatch dashboards
3. **Review logs** — Regularly review application and service logs
4. **Monitor costs** — Track service usage and optimize costs
5. **Test failover** — Verify disaster recovery procedures