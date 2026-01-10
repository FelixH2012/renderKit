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
	@echo "  make relay-wp-config          Print wp-config.php constants"
	@echo
	@echo "Build:"
	@echo "  make dev                      Watch/build assets"
	@echo "  make build                    Build production assets"

.PHONY: relay-init relay-up relay-down relay-restart relay-logs relay-status relay-health relay-wp-config
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

.PHONY: dev build
dev:
	@npm run dev

build:
	@npm run build

