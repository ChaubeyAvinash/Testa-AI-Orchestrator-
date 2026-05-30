.PHONY: dev prod migrate seed logs build

dev:
	docker compose -f docker-compose.yml -f docker-compose.override.yml up

prod:
	docker compose up --build

migrate:
	docker compose exec api npx prisma migrate dev

db-push:
	cd apps/api && DATABASE_URL=$(DATABASE_URL) npx prisma db push

generate:
	cd apps/api && DATABASE_URL=$(DATABASE_URL) npx prisma generate

logs:
	docker compose logs -f api

stop:
	docker compose down

clean:
	docker compose down -v
