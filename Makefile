all : up

up :
	docker compose -f docker-compose.yml up --build -d


# start both services
up:
	docker-compose up -d

# stop and clear all containers
fclean:
	docker-compose stop
	docker-compose down -v
	docker image prune -f
	rm -rf src/front-end/node_modules
	rm -rf src/back-end/node_modules src/back-end/package-lock.json
	npm cache clean --force

# Rebuild and start everything (fresh)
re:
	docker-compose down -v
	docker image prune -f
	docker-compose up --build -d

# notes
# -d = detached mode (runs in background)
