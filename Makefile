.PHONY: start install migrate build lint clean

# Start both API and frontend (Linux/macOS/Git Bash)
start:
	bash start.sh

# Install all workspace dependencies
install:
	npm install

# Build shared package + both apps
build:
	npm run build --workspace=packages/shared
	npm run build --workspace=apps/api
	npm run build --workspace=apps/web

# Apply SQLite migrations
migrate:
	cd apps/api && DATABASE_URL=file:./dev.db npx prisma migrate deploy

# Regenerate Prisma client
generate:
	cd apps/api && DATABASE_URL=file:./dev.db npx prisma generate

# Run linters across the monorepo
lint:
	npm run lint --workspaces --if-present

# Remove build artifacts
clean:
	rm -rf apps/api/dist apps/web/.next packages/shared/dist
