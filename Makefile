# Start only the frontend service
front:
	docker-compose up -d frontend

# Start only the backend service
back:
	docker-compose up -d backend

# Start both services
up:
	docker-compose up -d

# stop and clear all containers
stop:
	docker-compose stop
	docker-compose down -v
	docker image prune -f
	rm -rf src/front-end/node_modules
	rm -rf src/back-end/node_modules


# Rebuild and start everything (fresh)
re:
	docker-compose down -v
	docker image prune -f
	docker-compose up --build -d

# notes
# -d = detached mode (runs in background)