## Included Steps
1. Install -> npm ci - to install dependencies from lockfile
2. Lint -> npm run lint - to check the code quality
3. Test -> npm run test - Run vitest unit/ui tests
4. Build -> npm run build - to create production build 
5. Deploy

## Tools / platforms

For this project, a CI/CD pipeline using GitHub Actions would be used. GitHub Actions integrates directly with the repository, requires no external services, and is free for public repos.
- Already integrated with GitHub — no extra platform needed
- Fast checks (lint) run first for quick feedback
- Deploy only happens after all checks pass

