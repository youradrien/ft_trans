# Makefile

# Default target
.PHONY: all up build re fclean logs

all: up

# Build without cache and start the containers
build:
	docker compose build --no-cache

# Start the containers (after build)
up: build
	docker compose up -d

dev:
	docker compose -f docker-compose.dev.yml up -d

# Rebuild and restart everything fresh
re:
	docker compose down -v
	docker image prune -f
	docker compose build --no-cache
	docker compose up -d

# Stop and clean everything
fclean:
	docker compose down -v
	docker image prune -f
	rm -rf src/front-end/node_modules
	rm -rf src/back-end/node_modules src/back-end/package-lock.json
	npm cache clean --force

# View backend logs
logs:
	docker compose logs -f backend