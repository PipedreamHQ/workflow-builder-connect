# Agent Instructions

## Package Management

This project uses **pnpm** as its package manager. Always use pnpm for all package operations:

- Installing packages: `pnpm add <package>`
- Running scripts: `pnpm <script-name>`
- **For shadcn/ui components**: Use `pnpm dlx shadcn@latest add <component>` (not `npx`)

Never use npm or yarn for this project.

---

When working on this project, always follow these steps before completing your work:

## 1. Type Check
```bash
pnpm type-check
```
Run TypeScript compiler to check for type errors. Fix any type errors that appear.

## 2. Fix Code
```bash
pnpm fix
```
This will automatically format and lint all code using Ultracite (combines formatting and linting with auto-fixes).

## 3. Fix Issues
If any of the above commands fail or show errors:
- Read the error messages carefully
- Fix the issues in the relevant files
- Re-run the commands to verify fixes
- Repeat until all checks pass

## Important Notes
- Never commit code with type errors or linting issues
- Run `pnpm fix` before making commits to ensure code is properly formatted and linted
- All checks must pass before work is considered complete

## Documentation Guidelines
- **No Emojis**: Do not use emojis in any code, documentation, or README files
- **No File Structure**: Do not include file/folder structure diagrams in README files
- **No Random Documentation**: Do not create markdown documentation files unless explicitly requested by the user. This includes integration guides, feature documentation, or any other .md files

## Component Guidelines
- **Use shadcn/ui**: Always use shadcn/ui components when available. Do not create custom components that duplicate shadcn functionality
- **Add Components**: Use `pnpm dlx shadcn@latest add <component>` to add new shadcn components as needed
- **No Native Dialogs**: Never use native `alert()` or `confirm()` dialogs. Always use shadcn AlertDialog, Dialog, or Sonner toast components instead

## Database Migrations
- **Generate Migrations**: Use `pnpm db:generate` to automatically generate database migrations from schema changes
- **Never Write Manual Migrations**: Do not manually create SQL migration files in the `drizzle/` directory
- **Workflow**: 
  1. Update the schema in `lib/db/schema.ts`
  2. Run `pnpm db:generate` to generate the migration
  3. Run `pnpm db:push` to apply the migration to the database
- The migration generator will create properly formatted SQL files based on your schema changes

## Code Cleanliness
- **Remove Unused Code**: If a variable, import, or function is unused, remove it entirely. Do not prefix with underscore unless it's intentionally unused but required (e.g., function parameters)
- **Use Correct Jotai Hooks**: When working with Jotai atoms, use the appropriate hook based on usage:
  - `useAtom(atom)` - Use when you need both the value and setter
  - `useAtomValue(atom)` - Use when you only need to read the value
  - `useSetAtom(atom)` - Use when you only need the setter function
  - Never use `useAtom` if you're only using one part (getter or setter)

## API Architecture
- **Use API Routes**: This project uses API routes instead of Next.js server actions
- **API Client**: Always use the type-safe API client from `@/lib/api-client` for all backend calls
- **No Server Actions**: Do not create or use server actions (files with `"use server"` directive)
- **Import Pattern**: Import the API client as `import { api } from "@/lib/api-client"`
- **Available APIs**:
  - `api.ai.*` - AI operations (generate workflows)
  - `api.integration.*` - Test integration connections
  - `api.user.*` - User operations (get, update)
  - `api.vercelProject.*` - Vercel project integrations
  - `api.workflow.*` - Workflow CRUD and operations (create, update, delete, deploy, execute, etc.)
- **No Barrel Files**: Do not create barrel/index files that re-export from other files

## Pipedream Integration

This project uses Pipedream Connect to integrate with 2,800+ external APIs and services.

### Environment Variables

Required for Pipedream functionality:
- `PIPEDREAM_CLIENT_ID` - OAuth client ID from pipedream.com/settings/api
- `PIPEDREAM_CLIENT_SECRET` - OAuth client secret
- `PIPEDREAM_PROJECT_ID` - Project ID (proj_xxxxxxx) from pipedream.com/projects
- `PIPEDREAM_PROJECT_ENVIRONMENT` - `development` or `production`
- `PIPEDREAM_ALLOWED_ORIGINS` - JSON array of allowed origins (optional if deploying to Vercel)

### Architecture

**Backend (`lib/pipedream/server.ts`)**:
- Uses `@pipedream/sdk` with `PipedreamClient`
- Provides `serverConnectTokenCreate()` for frontend authentication
- Provides `runPipedreamAction()` for executing actions during workflow runs
- Automatically includes `VERCEL_URL` in allowed origins when deployed

**Frontend (`components/pipedream/pipedream-provider.tsx`)**:
- Uses `@pipedream/sdk/browser` with `createFrontendClient`
- Uses `@pipedream/connect-react` for pre-built UI components
- `FrontendClientProvider` wraps the app to provide Pipedream context
- `CustomizeProvider` applies shadcn/ui theme to Pipedream components

### Key SDK Methods

```typescript
// Backend: Generate connect token
const token = await client.tokens.create({
  externalUserId: "user123",
  allowedOrigins: ["https://your-app.com"]
});

// Backend: Execute action
const result = await client.actions.run({
  id: "slack-send-message-to-channel",
  externalUserId: "user123",
  configuredProps: {
    slack: { authProvisionId: "apn_abc123" },
    channel: "#general",
    text: "Hello!"
  }
});

// Frontend: Create client with token callback
const client = createFrontendClient({
  externalUserId: "user123",
  tokenCallback: async ({ externalUserId }) => {
    return serverConnectTokenCreate({ externalUserId });
  }
});
```

### Connect React Components

Use these components from `@pipedream/connect-react`:
- `FrontendClientProvider` - Wraps app to provide client context
- `CustomizeProvider` - Applies theme customization
- `ComponentFormContainer` - Pre-built form for configuring and running actions

### Documentation

- Main docs: https://pipedream.com/docs/connect
- API reference: https://pipedream.com/docs/connect/api-reference
- Component registry: https://github.com/PipedreamHQ/pipedream/tree/master/components

