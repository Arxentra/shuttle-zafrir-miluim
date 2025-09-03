import os
import logging
from typing import Optional
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.asyncpg import AsyncPGInstrumentor
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION


class TelemetryConfig:
    def __init__(self):
        self.service_name = os.getenv("OTEL_SERVICE_NAME", "tzafrir-shuttle-api")
        self.service_version = os.getenv("OTEL_SERVICE_VERSION", "1.0.0")
        self.environment = os.getenv("NODE_ENV", "development")
        self.jaeger_endpoint = os.getenv("JAEGER_ENDPOINT", "http://localhost:14268/api/traces")
        self.otlp_endpoint = os.getenv("OTLP_ENDPOINT", "http://localhost:4317")
        self.enable_jaeger = os.getenv("ENABLE_JAEGER", "true").lower() == "true"
        self.enable_otlp = os.getenv("ENABLE_OTLP", "false").lower() == "true"
        self.enable_console = os.getenv("ENABLE_CONSOLE_EXPORT", "true").lower() == "true"

    def get_resource(self) -> Resource:
        return Resource.create({
            SERVICE_NAME: self.service_name,
            SERVICE_VERSION: self.service_version,
            "environment": self.environment
        })


def setup_telemetry() -> Optional[trace.Tracer]:
    config = TelemetryConfig()
    
    if not any([config.enable_jaeger, config.enable_otlp, config.enable_console]):
        return None

    resource = config.get_resource()
    
    tracer_provider = TracerProvider(resource=resource)
    
    if config.enable_jaeger:
        jaeger_exporter = JaegerExporter(
            agent_host_name="localhost",
            agent_port=6831,
        )
        tracer_provider.add_span_processor(BatchSpanProcessor(jaeger_exporter))

    if config.enable_otlp:
        otlp_exporter = OTLPSpanExporter(endpoint=config.otlp_endpoint, insecure=True)
        tracer_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))

    if config.enable_console and config.environment == "development":
        try:
            from opentelemetry.sdk.trace.export import ConsoleSpanExporter
            console_exporter = ConsoleSpanExporter()
            tracer_provider.add_span_processor(BatchSpanProcessor(console_exporter))
        except ImportError:
            pass

    trace.set_tracer_provider(tracer_provider)
    
    if config.enable_otlp:
        metric_reader = PeriodicExportingMetricReader(
            OTLPMetricExporter(endpoint=config.otlp_endpoint, insecure=True),
            export_interval_millis=5000,
        )
        meter_provider = MeterProvider(resource=resource, metric_readers=[metric_reader])
        metrics.set_meter_provider(meter_provider)

    return trace.get_tracer(__name__)


def instrument_app(app):
    FastAPIInstrumentor.instrument_app(app)
    SQLAlchemyInstrumentor().instrument()
    AsyncPGInstrumentor().instrument()


def cleanup_telemetry():
    tracer_provider = trace.get_tracer_provider()
    if hasattr(tracer_provider, 'shutdown'):
        tracer_provider.shutdown()
    
    meter_provider = metrics.get_meter_provider()
    if hasattr(meter_provider, 'shutdown'):
        meter_provider.shutdown()