.PHONY: dev prod stop clean test lint format migrate seed logs help

# ── Colors ────────────────────────────────────────────────────────────────────
BOLD  := \033[1m
GREEN := \033[32m
CYAN  := \033[36m
RESET := \033[0m

# ── Help ──────────────────────────────────────────────────────────────────────
help:
	@echo "$(BOLD)$(CYAN)ThePropertyFolio — Available Commands$(RESET)"
	@echo ""
	@echo "  $(GREEN)make dev$(RESET)         Start all services in development mode"
	@echo "  $(GREEN)make prod$(RESET)        Start all services in production mode"
	@echo "  $(GREEN)make stop$(RESET)        Stop all running containers"
	@echo "  $(GREEN)make clean$(RESET)       Stop containers and remove volumes"
	@echo "  $(GREEN)make logs$(RESET)        Tail logs for all services"
	@echo "  $(GREEN)make logs s=backend$(RESET)  Tail logs for a specific service"
	@echo ""
	@echo "  $(GREEN)make migrate$(RESET)     Run Alembic database migrations"
	@echo "  $(GREEN)make migrate-new msg=\"...\"$(RESET)  Create a new migration"
	@echo "  $(GREEN)make migrate-down$(RESET)  Downgrade database one step"
	@echo "  $(GREEN)make seed$(RESET)        Seed database with sample data"
	@echo ""
	@echo "  $(GREEN)make test$(RESET)        Run all tests (pytest + playwright + robot)"
	@echo "  $(GREEN)make test-unit$(RESET)   Run pytest unit tests only"
	@echo "  $(GREEN)make test-api$(RESET)    Run pytest integration tests only"
	@echo "  $(GREEN)make test-e2e$(RESET)    Run Playwright E2E tests"
	@echo "  $(GREEN)make test-robot$(RESET)  Run Robot Framework acceptance tests"
	@echo "  $(GREEN)make coverage$(RESET)    Run pytest with HTML coverage report"
	@echo ""
	@echo "  $(GREEN)make lint$(RESET)        Lint all code (ruff + eslint)"
	@echo "  $(GREEN)make format$(RESET)      Auto-format all code (black + prettier)"
	@echo "  $(GREEN)make typecheck$(RESET)   Run mypy + tsc type checks"
	@echo ""
	@echo "  $(GREEN)make install$(RESET)     Install all dependencies (backend + frontend)"
	@echo "  $(GREEN)make shell-backend$(RESET)  Open shell in backend container"
	@echo "  $(GREEN)make shell-db$(RESET)    Open psql shell"

# ── Development ───────────────────────────────────────────────────────────────
dev:
	@echo "$(BOLD)$(GREEN)Starting ThePropertyFolio in development mode...$(RESET)"
	@cp -n .env.example .env 2>/dev/null || true
	docker compose up --build -d
	@echo "$(BOLD)$(GREEN)✅ Services started:$(RESET)"
	@echo "   Frontend:  http://localhost:3000"
	@echo "   Backend:   http://localhost:8000"
	@echo "   API Docs:  http://localhost:8000/docs"
	@echo "   Nginx:     http://localhost:80"

prod:
	@echo "$(BOLD)$(GREEN)Starting ThePropertyFolio in production mode...$(RESET)"
	docker compose -f docker-compose.prod.yml up --build -d

stop:
	docker compose stop

clean:
	@echo "$(BOLD)Stopping containers and removing volumes...$(RESET)"
	docker compose down -v --remove-orphans
	@echo "$(GREEN)✅ Clean complete$(RESET)"

logs:
ifdef s
	docker compose logs -f $(s)
else
	docker compose logs -f
endif

# ── Database ──────────────────────────────────────────────────────────────────
migrate:
	docker compose exec backend alembic upgrade head
	@echo "$(GREEN)✅ Migrations applied$(RESET)"

migrate-new:
ifndef msg
	$(error Usage: make migrate-new msg="describe your migration")
endif
	docker compose exec backend alembic revision --autogenerate -m "$(msg)"

migrate-down:
	docker compose exec backend alembic downgrade -1

seed:
	docker compose exec backend python -m app.scripts.seed
	@echo "$(GREEN)✅ Database seeded with sample data$(RESET)"

# ── Testing ───────────────────────────────────────────────────────────────────
test: test-unit test-api test-e2e test-robot
	@echo "$(BOLD)$(GREEN)✅ All tests passed$(RESET)"

test-with-servers:
	@echo "$(BOLD)$(CYAN)Starting services for tests...$(RESET)"
	$(MAKE) dev
	@echo "$(BOLD)Waiting for services to be ready...$(RESET)"
	sleep 10
	-$(MAKE) test-unit
	-$(MAKE) test-api
	-$(MAKE) test-e2e
	-$(MAKE) test-robot
	@echo "$(BOLD)$(CYAN)Stopping services...$(RESET)"
	$(MAKE) stop
	@echo "$(BOLD)$(GREEN)✅ Test suite finished and services stopped$(RESET)"


test-unit:
	@echo "$(BOLD)Running pytest unit tests...$(RESET)"
	docker compose exec backend pytest tests/unit/ -v --tb=short

test-api:
	@echo "$(BOLD)Running pytest integration tests...$(RESET)"
	docker compose exec backend pytest tests/integration/ -v --tb=short

coverage:
	@echo "$(BOLD)Running pytest with coverage...$(RESET)"
	docker compose exec backend pytest tests/ --cov=app --cov-report=html --cov-report=term-missing --cov-fail-under=80
	@echo "$(GREEN)Coverage report: backend/htmlcov/index.html$(RESET)"

test-e2e:
	@echo "$(BOLD)Running Playwright E2E tests...$(RESET)"
	cd frontend && npx playwright test

test-robot:
	@echo "$(BOLD)Running Robot Framework tests...$(RESET)"
	robot --outputdir backend/tests/acceptance/results backend/tests/acceptance/

# ── Code Quality ──────────────────────────────────────────────────────────────
lint:
	@echo "$(BOLD)Linting Python (Ruff)...$(RESET)"
	docker compose exec backend ruff check app/ tests/
	@echo "$(BOLD)Linting Python (Pylint)...$(RESET)"
	docker compose exec backend pylint app/ --fail-under=8.0
	@echo "$(BOLD)Linting TypeScript/TSX (ESLint)...$(RESET)"
	cd frontend && npm run lint
	@echo "$(GREEN)✅ All lint checks passed$(RESET)"

format:
	@echo "$(BOLD)Formatting Python (Black)...$(RESET)"
	docker compose exec backend black app/ tests/
	@echo "$(BOLD)Sorting Python imports (Ruff isort)...$(RESET)"
	docker compose exec backend ruff check app/ tests/ --select I --fix
	@echo "$(BOLD)Formatting TypeScript (Prettier)...$(RESET)"
	cd frontend && npm run format
	@echo "$(GREEN)✅ Formatting complete$(RESET)"

typecheck:
	@echo "$(BOLD)Running mypy (Python)...$(RESET)"
	docker compose exec backend mypy app/
	@echo "$(BOLD)Running tsc (TypeScript)...$(RESET)"
	cd frontend && npx tsc --noEmit
	@echo "$(GREEN)✅ Type checks passed$(RESET)"

# ── Installation ──────────────────────────────────────────────────────────────
install:
	@echo "$(BOLD)Installing backend dependencies...$(RESET)"
	cd backend && pip install -r requirements.txt
	@echo "$(BOLD)Installing frontend dependencies...$(RESET)"
	cd frontend && npm install
	@echo "$(GREEN)✅ All dependencies installed$(RESET)"

# ── Utilities ─────────────────────────────────────────────────────────────────
shell-backend:
	docker compose exec backend /bin/bash

shell-db:
	docker compose exec db psql -U $${POSTGRES_USER:-tpf_user} -d $${POSTGRES_DB:-thepropertyfolio}

ssl-self-signed:
	@mkdir -p nginx/ssl
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout nginx/ssl/key.pem \
		-out nginx/ssl/cert.pem \
		-subj "/C=US/ST=State/L=City/O=ThePropertyFolio/CN=localhost"
	@echo "$(GREEN)✅ Self-signed SSL certificate created in nginx/ssl/$(RESET)"
