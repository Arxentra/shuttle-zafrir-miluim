# Logging and Observability

This document describes the logging and OpenTelemetry observability implementation in the Tzafrir Shuttle System.

## Overview

The application implements comprehensive structured logging with OpenTelemetry integration for distributed tracing and observability.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OTEL_SERVICE_NAME` | `tzafrir-shuttle-api` | Service name for telemetry |
| `OTEL_SERVICE_VERSION` | `1.0.0` | Service version |
| `ENABLE_JAEGER` | `true` | Enable Jaeger tracing export |
| `ENABLE_OTLP` | `false` | Enable OTLP export |
| `ENABLE_CONSOLE_EXPORT` | `true` | Enable console span export (dev only) |
| `JAEGER_ENDPOINT` | `http://localhost:14268/api/traces` | Jaeger endpoint |
| `OTLP_ENDPOINT` | `http://localhost:4317` | OTLP endpoint |
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `LOG_FORMAT` | `json` | Log format (json or text) |

### Example Configuration

```bash
# Development
ENABLE_JAEGER=true
ENABLE_CONSOLE_EXPORT=true
LOG_LEVEL=DEBUG
LOG_FORMAT=json

# Production
ENABLE_JAEGER=true
ENABLE_OTLP=true
ENABLE_CONSOLE_EXPORT=false
LOG_LEVEL=INFO
LOG_FORMAT=json
```

## Logging Features

### Structured JSON Logs

All logs are output in structured JSON format with:

- **timestamp**: ISO 8601 timestamp with timezone
- **level**: Log level (INFO, WARNING, ERROR, DEBUG)
- **logger**: Logger name
- **message**: Human-readable message
- **module**, **function**, **line**: Code location
- **trace_id**, **span_id**: OpenTelemetry correlation IDs (when available)
- **Custom fields**: Operation-specific metadata

Example log entry:
```json
{
  "timestamp": "2025-09-02T20:00:33.929496Z",
  "level": "INFO",
  "logger": "tzafrir-shuttle",
  "message": "Login successful",
  "module": "auth",
  "function": "login",
  "line": 61,
  "trace_id": "c1a9193065fe391d245d2fcf2052fa4d",
  "span_id": "cac75dcac2f75c57",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "role": "admin"
}
```

### OpenTelemetry Integration

- **Automatic instrumentation** for FastAPI, SQLAlchemy, and AsyncPG
- **Custom spans** for business logic operations
- **Trace correlation** in logs via trace_id and span_id
- **Multiple exporters** supported (Jaeger, OTLP, Console)

## Logging Coverage

### HTTP Requests
- All HTTP requests with method, path, status code, duration
- User agent and additional metadata
- Error responses with detailed context

### Authentication
- Login attempts with email (sanitized)
- Success/failure outcomes with user context
- Authorization failures with role information

### Database Operations
- Connection pool events
- Operation metrics with duration tracking

### WebSocket Events
- Connection establishment/closure
- Message sending and broadcasting
- Connection count metrics
- Error handling for failed connections

### Business Operations
- Company, shuttle, schedule, registration CRUD operations
- CSV import operations with file metadata
- Admin user management with permission checks

## Usage Examples

### Basic Logging

```python
from app.logging_manager import logger_manager

# Basic logging
logger_manager.info("Operation completed", {"user_id": user_id})
logger_manager.error("Operation failed", {"error_code": "ERR_001"})
```

### Span Logging

```python
# With OpenTelemetry span
with logger_manager.span("user_authentication", {"method": "password"}) as span:
    # Operation code
    span.set_attribute("auth.result", "success")
    span.set_attribute("user.id", str(user_id))
```

### Specialized Logging

```python
# Request logging
logger_manager.log_request("GET", "/api/users", 200, 0.123, {"user_id": user_id})

# Database logging
logger_manager.log_database_operation("SELECT", "users", 0.045, {"count": 5})

# WebSocket logging
logger_manager.log_websocket_event("connect", connection_id, {"user_agent": ua})
```

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Error Rates**: Monitor ERROR level logs
2. **Response Times**: Track duration_ms in request logs
3. **Authentication Failures**: Monitor failed login attempts
4. **Database Performance**: Track database operation durations
5. **WebSocket Connections**: Monitor connection counts and failures

### Recommended Alerts

- High error rate (>5% of requests)
- Slow responses (>2s for API endpoints)
- Authentication failure spikes
- Database connection failures
- WebSocket connection drops

## Jaeger Setup

To view traces in Jaeger:

1. Run Jaeger locally:
```bash
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 14268:14268 \
  jaegertracing/all-in-one:latest
```

2. Access Jaeger UI at http://localhost:16686
3. Search for service "tzafrir-shuttle-api"

## Performance Considerations

- JSON logging has minimal overhead
- Jaeger export is asynchronous and batched
- Console export should be disabled in production
- Log level should be INFO or higher in production
- Consider log rotation for high-volume deployments