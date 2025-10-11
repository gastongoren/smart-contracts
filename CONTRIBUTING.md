# Contributing

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Start PostgreSQL: `docker-compose up -d`
5. Run migrations: `npx prisma migrate dev`
6. Start dev server: `npm run start:dev`

## Code Style

- Follow TypeScript best practices
- Use ESLint configuration
- Run `npm run lint` before committing
- Use meaningful commit messages

## Commit Messages

Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## Pull Requests

1. Create feature branch from `main`
2. Make changes
3. Run tests and linter
4. Create PR with description
5. Wait for review

## Questions?

Open an issue for questions or discussions.
