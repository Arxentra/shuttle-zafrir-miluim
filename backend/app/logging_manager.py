import logging
import os
import sys
from typing import Optional, Dict, Any
from datetime import datetime
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode
from contextlib import contextmanager


class LoggingManager:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self._setup_logging()
            self.tracer = trace.get_tracer(__name__)
            LoggingManager._initialized = True

    def _setup_logging(self):
        log_level = os.getenv("LOG_LEVEL", "INFO").upper()
        log_format = os.getenv("LOG_FORMAT", "json")
        
        level = getattr(logging, log_level, logging.INFO)
        
        if log_format.lower() == "json":
            formatter = self._json_formatter()
        else:
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )

        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(formatter)

        logging.basicConfig(
            level=level,
            handlers=[handler],
            force=True
        )

        self.logger = logging.getLogger("tzafrir-shuttle")

    def _json_formatter(self):
        import json
        
        class JSONFormatter(logging.Formatter):
            def format(self, record):
                log_entry = {
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "level": record.levelname,
                    "logger": record.name,
                    "message": record.getMessage(),
                    "module": record.module,
                    "function": record.funcName,
                    "line": record.lineno
                }
                
                current_span = trace.get_current_span()
                if current_span.is_recording():
                    span_context = current_span.get_span_context()
                    log_entry["trace_id"] = format(span_context.trace_id, "032x")
                    log_entry["span_id"] = format(span_context.span_id, "016x")
                
                if hasattr(record, 'extra_data'):
                    log_entry.update(record.extra_data)
                
                return json.dumps(log_entry)
        
        return JSONFormatter()

    def log(self, level: str, message: str, extra_data: Optional[Dict[str, Any]] = None):
        log_record = self.logger.makeRecord(
            name=self.logger.name,
            level=getattr(logging, level.upper()),
            fn="",
            lno=0,
            msg=message,
            args=(),
            exc_info=None
        )
        
        if extra_data:
            log_record.extra_data = extra_data
        
        self.logger.handle(log_record)

    def info(self, message: str, extra_data: Optional[Dict[str, Any]] = None):
        self.log("INFO", message, extra_data)

    def error(self, message: str, extra_data: Optional[Dict[str, Any]] = None):
        self.log("ERROR", message, extra_data)
        
        current_span = trace.get_current_span()
        if current_span.is_recording():
            current_span.set_status(Status(StatusCode.ERROR, message))
            current_span.record_exception(Exception(message))

    def warning(self, message: str, extra_data: Optional[Dict[str, Any]] = None):
        self.log("WARNING", message, extra_data)

    def debug(self, message: str, extra_data: Optional[Dict[str, Any]] = None):
        self.log("DEBUG", message, extra_data)

    @contextmanager
    def span(self, name: str, attributes: Optional[Dict[str, Any]] = None):
        with self.tracer.start_as_current_span(name) as span:
            if attributes:
                for key, value in attributes.items():
                    span.set_attribute(key, str(value))
            
            try:
                yield span
            except Exception as e:
                span.set_status(Status(StatusCode.ERROR, str(e)))
                span.record_exception(e)
                self.error(f"Exception in span {name}: {str(e)}")
                raise

    def log_request(self, method: str, path: str, status_code: int, duration: float, 
                   extra_data: Optional[Dict[str, Any]] = None):
        log_data = {
            "method": method,
            "path": path,
            "status_code": status_code,
            "duration_ms": round(duration * 1000, 2),
            "type": "request"
        }
        
        if extra_data:
            log_data.update(extra_data)
        
        level = "ERROR" if status_code >= 500 else "WARNING" if status_code >= 400 else "INFO"
        message = f"{method} {path} - {status_code} - {duration:.3f}s"
        
        self.log(level, message, log_data)

    def log_database_operation(self, operation: str, table: str, duration: float,
                              extra_data: Optional[Dict[str, Any]] = None):
        log_data = {
            "operation": operation,
            "table": table,
            "duration_ms": round(duration * 1000, 2),
            "type": "database"
        }
        
        if extra_data:
            log_data.update(extra_data)
        
        message = f"DB {operation} on {table} - {duration:.3f}s"
        self.info(message, log_data)

    def log_websocket_event(self, event: str, connection_id: Optional[str] = None,
                           extra_data: Optional[Dict[str, Any]] = None):
        log_data = {
            "event": event,
            "type": "websocket"
        }
        
        if connection_id:
            log_data["connection_id"] = connection_id
        
        if extra_data:
            log_data.update(extra_data)
        
        message = f"WebSocket {event}"
        if connection_id:
            message += f" - Connection: {connection_id}"
        
        self.info(message, log_data)


logger_manager = LoggingManager()