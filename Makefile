SHELL := /bin/bash
.ONESHELL:
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

RELAY_DIR ?= relay
RELAY_BIN ?= ./renderkit-relay

PORT ?=

.PHONY: help
help:
	@echo "renderKit Makefile"
	@echo
	@echo "Relay (SSR sidecar):"
	@echo "  make relay-init [PORT=8787]   Create relay/.env + print wp-config.php snippet"
	@echo "  make relay-up                 Start relay"
	@echo "  make relay-down               Stop relay"
	@echo "  make relay-restart            Restart relay"
	@echo "  make relay-logs               Tail relay logs"
	@echo "  make relay-status             Show relay container status"
	@echo "  make relay-health             Check relay health endpoint"
	@echo "  make relay-metrics            Show Prometheus metrics"
	@echo "  make relay-wp-config          Print wp-config.php constants"
	@echo
	@echo "Monitoring (Grafana + Prometheus):"
	@echo "  make monitoring-up            Start Grafana + Prometheus"
	@echo "  make monitoring-down          Stop Grafana + Prometheus"
	@echo "  make monitoring-open          Open Grafana in browser"
	@echo
	@echo "Development:"
	@echo "  make dev                      Start full stack + watch/build assets"
	@echo "  make build                    Build production assets"
	@echo "  make stop                     Stop all Docker services"

.PHONY: relay-init relay-up relay-down relay-restart relay-logs relay-status relay-health relay-metrics relay-wp-config
relay-init:
	@cd "$(RELAY_DIR)"
	@$(RELAY_BIN) init $(if $(PORT),--port $(PORT),)

relay-up:
	@cd "$(RELAY_DIR)"
	@$(RELAY_BIN) up

relay-down:
	@cd "$(RELAY_DIR)"
	@$(RELAY_BIN) down

relay-restart:
	@cd "$(RELAY_DIR)"
	@$(RELAY_BIN) restart

relay-logs:
	@cd "$(RELAY_DIR)"
	@$(RELAY_BIN) logs

relay-status:
	@cd "$(RELAY_DIR)"
	@$(RELAY_BIN) status

relay-health:
	@cd "$(RELAY_DIR)"
	@$(RELAY_BIN) health

relay-wp-config:
	@cd "$(RELAY_DIR)"
	@$(RELAY_BIN) wp-config

relay-metrics:
	@cd "$(RELAY_DIR)"
	@$(RELAY_BIN) metrics

.PHONY: monitoring-up monitoring-down monitoring-open
monitoring-up:
	@cd "$(RELAY_DIR)" && docker compose up -d prometheus grafana
	@echo "Grafana: http://127.0.0.1:3001 (admin / renderkit)"
	@echo "Prometheus: http://127.0.0.1:9090"

monitoring-down:
	@cd "$(RELAY_DIR)" && docker compose stop prometheus grafana

monitoring-open:
	@xdg-open http://127.0.0.1:3001 2>/dev/null || open http://127.0.0.1:3001 2>/dev/null || echo "Open http://127.0.0.1:3001 in your browser"

.PHONY: dev build stop
dev:
	@echo "Starting Relay + Monitoring stack..."
	@cd "$(RELAY_DIR)" && docker compose up -d
	@echo ""
	@echo "Services running:"
	@echo "  Relay:      http://127.0.0.1:8787"
	@echo "  Grafana:    http://lumetric.cloud:3001"
	@echo "  Prometheus: http://127.0.0.1:9090"
	@echo ""
	@npm run dev

build:
	@npm run build

stop:
	@echo "Stopping all services..."
	@cd "$(RELAY_DIR)" && docker compose down
	@echo "All services stopped."
