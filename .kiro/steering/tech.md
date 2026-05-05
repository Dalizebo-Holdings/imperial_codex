# Tech Stack

No tech stack has been explicitly defined yet. Based on the `.gitignore`, the project likely uses a Node.js-based stack.

## Inferred from .gitignore

- **Runtime**: Node.js (node_modules, npm/yarn logs present)
- **Build output**: `dist/`, `build/`, `out/`, `.next/`, `.nuxt/` are ignored — suggesting a bundled or compiled frontend/fullstack project
- **Package managers**: npm or yarn

## Common Commands

Update this section once the stack is confirmed:

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build
npm run build

# Tests
npm test
```

## Notes

- `.env` files are gitignored — use `.env.example` to document required environment variables
- Secrets (`.p12`, `.pem`, `.key`, `auth.json`) must never be committed
