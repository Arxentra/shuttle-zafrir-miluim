{{/*
Expand the name of the chart.
*/}}
{{- define "back.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "back.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "back.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "back.labels" -}}
helm.sh/chart: {{ include "back.chart" . }}
{{ include "back.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "back.selectorLabels" -}}
app.kubernetes.io/name: {{ include "back.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "back.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "back.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Database host helper
*/}}
{{- define "back.database.host" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "%s-postgres-primary.%s.svc.cluster.local" (include "back.fullname" .) .Release.Namespace }}
{{- else }}
{{- .Values.config.database.host }}
{{- end }}
{{- end }}

{{/*
Database connection string helper
*/}}
{{- define "back.database.connectionString" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "postgresql://%s:$(DB_PASSWORD)@%s:%s/%s" .Values.config.database.user (include "back.database.host" .) .Values.config.database.port .Values.config.database.name }}
{{- else }}
{{- printf "postgresql://%s:$(DB_PASSWORD)@%s:%s/%s" .Values.config.database.user .Values.config.database.host .Values.config.database.port .Values.config.database.name }}
{{- end }}
{{- end }}
