.PHONY: start install migrate build lint clean

# Start both API and frontend (Linux/macOS/Git Bash)
start:
	bash start.sh

# Install all workspace dependencies
install:
	pnpm install

# Build shared package + both apps
build:
	pnpm --filter @testa/shared build
	pnpm --filter api build
	pnpm --filter @testa/web build

# Apply SQLite migrations
migrate:
	cd apps/api && DATABASE_URL=file:./dev.db npx prisma migrate deploy

# Regenerate Prisma client
generate:
	cd apps/api && DATABASE_URL=file:./dev.db npx prisma generate

# Run linters across the monorepo
lint:
	pnpm -r lint

# Remove build artifacts
clean:
	rm -rf apps/api/dist apps/web/.next packages/shared/dist
