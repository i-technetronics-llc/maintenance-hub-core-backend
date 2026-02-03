# Maintenance Hub Backend - Deployment Makefile
# Server: root@208.84.101.90

# Configuration
SERVER_USER := root
SERVER_HOST := 208.84.101.90
SERVER_PATH := /opt/maintenance-backend
SSH_TARGET := $(SERVER_USER)@$(SERVER_HOST)
DOCKER_IMAGE := maintenance-api
COMPOSE_FILE := docker-compose.yml
DOCKER_COMPOSE := docker compose

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

.PHONY: help deploy deploy-quick build push logs logs-api ssh shell restart stop start status health verify env-show env-edit env-add-cors db-shell db-backup clean setup-server rebuild migrate seed

help: ## Show this help message
	@echo "Maintenance Hub Backend - Deployment Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

deploy: ## Full deployment: sync files, build and restart on server
	@echo "$(YELLOW)Starting full deployment to $(SERVER_HOST)...$(NC)"
	@echo "$(GREEN)Step 1: Syncing files to server...$(NC)"
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'uploads' \
		-e ssh ./ $(SSH_TARGET):$(SERVER_PATH)/
	@echo "$(GREEN)Step 2: Building and starting containers on server...$(NC)"
	ssh $(SSH_TARGET) "cd $(SERVER_PATH) && $(DOCKER_COMPOSE) down && $(DOCKER_COMPOSE) build --no-cache && $(DOCKER_COMPOSE) up -d"
	@echo "$(GREEN)Deployment complete!$(NC)"
	@$(MAKE) status

deploy-quick: ## Quick deployment: sync files and restart (no rebuild)
	@echo "$(YELLOW)Starting quick deployment to $(SERVER_HOST)...$(NC)"
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'uploads' \
		-e ssh ./ $(SSH_TARGET):$(SERVER_PATH)/
	ssh $(SSH_TARGET) "cd $(SERVER_PATH) && $(DOCKER_COMPOSE) up -d --build"
	@echo "$(GREEN)Quick deployment complete!$(NC)"
	@$(MAKE) status

build: ## Build Docker image locally
	@echo "$(YELLOW)Building Docker image locally...$(NC)"
	docker build -t $(DOCKER_IMAGE) .

push: ## Push code to server (no restart)
	@echo "$(YELLOW)Pushing code to server...$(NC)"
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'uploads' \
		-e ssh ./ $(SSH_TARGET):$(SERVER_PATH)/
	@echo "$(GREEN)Code synced to server$(NC)"

logs: ## View container logs on server
	ssh $(SSH_TARGET) "cd $(SERVER_PATH) && $(DOCKER_COMPOSE) logs -f --tail=100"

logs-api: ## View API container logs only
	ssh $(SSH_TARGET) "docker logs -f --tail=100 maintenance-api"

ssh: ## SSH into the server
	ssh $(SSH_TARGET)

shell: ## Open shell in API container on server
	ssh $(SSH_TARGET) "docker exec -it maintenance-api sh"

restart: ## Restart containers on server
	@echo "$(YELLOW)Restarting containers...$(NC)"
	ssh $(SSH_TARGET) "cd $(SERVER_PATH) && $(DOCKER_COMPOSE) restart"
	@echo "$(GREEN)Containers restarted$(NC)"

stop: ## Stop containers on server
	@echo "$(YELLOW)Stopping containers...$(NC)"
	ssh $(SSH_TARGET) "cd $(SERVER_PATH) && $(DOCKER_COMPOSE) down"
	@echo "$(GREEN)Containers stopped$(NC)"

start: ## Start containers on server
	@echo "$(YELLOW)Starting containers...$(NC)"
	ssh $(SSH_TARGET) "cd $(SERVER_PATH) && $(DOCKER_COMPOSE) up -d"
	@echo "$(GREEN)Containers started$(NC)"

status: ## Check container status on server
	@echo "$(YELLOW)Container status on $(SERVER_HOST):$(NC)"
	ssh $(SSH_TARGET) "cd $(SERVER_PATH) && $(DOCKER_COMPOSE) ps"

health: ## Check API health endpoint
	@echo "$(YELLOW)Checking API health...$(NC)"
	@ssh $(SSH_TARGET) "curl -sf http://localhost:3000/api/v1 >/dev/null 2>&1 && echo '$(GREEN)API is responding$(NC)' || echo '$(RED)API is not responding$(NC)'"
	@ssh $(SSH_TARGET) "cd $(SERVER_PATH) && $(DOCKER_COMPOSE) ps --format 'table {{.Name}}\t{{.Status}}'"

verify: ## Verify deployment: show container status and recent logs
	@echo "$(YELLOW)Verifying deployment on $(SERVER_HOST)...$(NC)"
	@ssh $(SSH_TARGET) "cd $(SERVER_PATH) && $(DOCKER_COMPOSE) ps"
	@echo "\n$(YELLOW)Recent API logs:$(NC)"
	@ssh $(SSH_TARGET) "docker logs maintenance-api --tail 10"

env-show: ## Show current .env on server
	ssh $(SSH_TARGET) "cat $(SERVER_PATH)/.env 2>/dev/null || echo 'No .env file found'"

env-edit: ## Edit .env file on server
	ssh -t $(SSH_TARGET) "nano $(SERVER_PATH)/.env"

env-add-cors: ## Add a CORS origin (usage: make env-add-cors DOMAIN=https://example.com)
ifndef DOMAIN
	@echo "$(RED)Error: DOMAIN is required. Usage: make env-add-cors DOMAIN=https://example.com$(NC)"
	@exit 1
endif
	@echo "$(YELLOW)Adding $(DOMAIN) to CORS_ORIGIN on server...$(NC)"
	ssh $(SSH_TARGET) 'cd $(SERVER_PATH) && \
		if grep -q "^CORS_ORIGIN=" .env; then \
			if grep -q "$(DOMAIN)" .env; then \
				echo "$(DOMAIN) already in CORS_ORIGIN"; \
			else \
				sed -i "s|^CORS_ORIGIN=.*|&,$(DOMAIN)|" .env; \
				echo "Added $(DOMAIN) to CORS_ORIGIN"; \
			fi; \
		else \
			echo "CORS_ORIGIN=$(DOMAIN)" >> .env; \
			echo "Created CORS_ORIGIN with $(DOMAIN)"; \
		fi'
	@echo "$(GREEN)CORS_ORIGIN updated. Run 'make restart' to apply changes.$(NC)"

db-shell: ## Open PostgreSQL shell on server
	ssh $(SSH_TARGET) "docker exec -it maintenance-postgres psql -U maintenance_user -d maintenance_db"

db-backup: ## Backup database from server
	@echo "$(YELLOW)Creating database backup...$(NC)"
	ssh $(SSH_TARGET) "docker exec maintenance-postgres pg_dump -U maintenance_user maintenance_db" > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup saved locally$(NC)"

clean: ## Clean up Docker resources on server
	@echo "$(YELLOW)Cleaning up Docker resources on server...$(NC)"
	ssh $(SSH_TARGET) "docker system prune -f"
	@echo "$(GREEN)Cleanup complete$(NC)"

setup-server: ## Initial server setup (create directory, copy files)
	@echo "$(YELLOW)Setting up server...$(NC)"
	ssh $(SSH_TARGET) "mkdir -p $(SERVER_PATH)"
	@$(MAKE) push
	@echo "$(GREEN)Server setup complete. Run 'make deploy' to start the application.$(NC)"

rebuild: ## Rebuild and restart containers on server (no file sync)
	@echo "$(YELLOW)Rebuilding containers on server...$(NC)"
	ssh $(SSH_TARGET) "cd $(SERVER_PATH) && $(DOCKER_COMPOSE) up -d --build"
	@echo "$(GREEN)Rebuild complete!$(NC)"
	@$(MAKE) status

migrate: ## Run database migrations on server
	@echo "$(YELLOW)Running migrations...$(NC)"
	ssh $(SSH_TARGET) "docker exec maintenance-api npm run migrate"
	@echo "$(GREEN)Migrations complete$(NC)"

seed: ## Seed database on server
	@echo "$(YELLOW)Seeding database...$(NC)"
	ssh $(SSH_TARGET) "docker exec maintenance-api npm run seed"
	@echo "$(GREEN)Seeding complete$(NC)"
