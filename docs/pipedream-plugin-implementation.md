# Pipedream Plugin Implementation Guide

## Overview

This document provides step-by-step instructions for integrating Pipedream into the plugin architecture. The goal is consistency with other plugins while preserving Pipedream's unique characteristics.

## Background Context

### Current State
- Pipedream integration exists but is NOT structured as a plugin
- Key files are scattered across: `lib/steps/`, `components/pipedream/`, `components/workflow/config/`
- Other integrations (v0, Firecrawl) follow the plugin pattern in `plugins/`

### Why Pipedream is Unique
Unlike other plugins where end-users configure their own API keys:
1. **Developer-configured**: The developer deploying this app sets up Pipedream once via environment variables (client ID, secret, project ID)
2. **End-users connect accounts via OAuth**: Users don't "set up" Pipedream - they connect their individual accounts (Google, Slack, etc.) through Pipedream Connect when configuring workflow actions
3. **Dynamic actions**: 3,000+ actions fetched from Pipedream API, not hardcoded
4. **SDK-provided UI**: Uses `@pipedream/connect-react` components (`SelectApp`, `SelectComponent`, `ComponentFormContainer`)

### User Decisions (Already Confirmed)
- **Goal**: Follow same plugin patterns as other integrations for consistency
- **Credentials**: Keep in environment variables (not per-user DB storage)
- **Settings UI**: Read-only status display (show if enabled, how many apps available - no config inputs)

---

## Implementation Steps

### Step 1: Create Directory Structure

```bash
mkdir -p plugins/pipedream/steps/pipedream-action
```

Create the following files:
```
plugins/pipedream/
├── index.tsx              # Plugin registration
├── settings.tsx           # Read-only status UI for end users
├── icon.tsx               # Pipedream SVG icon
├── test.ts                # Connection validation
└── steps/
    └── pipedream-action/
        ├── step.ts        # Moved from lib/steps/pipedream-action.ts
        └── config.tsx     # Wrapper around existing config component
```

### Step 2: Create `plugins/pipedream/icon.tsx`

```tsx
export function PipedreamIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
```

**Note**: Check if a better Pipedream logo SVG exists in the codebase (search for "pipedream" in components) and use that instead.

### Step 3: Create `plugins/pipedream/test.ts`

```ts
import { isPipedreamEnabled } from "@/lib/pipedream/server"

export async function testPipedreamConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const enabled = await isPipedreamEnabled()
    if (!enabled) {
      return {
        success: false,
        error: "Pipedream is not configured. Environment variables PIPEDREAM_CLIENT_ID, PIPEDREAM_CLIENT_SECRET, and PIPEDREAM_PROJECT_ID are required."
      }
    }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error testing Pipedream connection"
    }
  }
}
```

### Step 4: Create `plugins/pipedream/settings.tsx`

This should be a **read-only status display** (not a configuration form like other plugins):

```tsx
"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export function PipedreamSettings() {
  const [status, setStatus] = useState<"loading" | "enabled" | "disabled">("loading")

  useEffect(() => {
    // Check if Pipedream is enabled via server action
    async function checkStatus() {
      try {
        const response = await fetch("/api/pipedream/status")
        const data = await response.json()
        setStatus(data.enabled ? "enabled" : "disabled")
      } catch {
        setStatus("disabled")
      }
    }
    checkStatus()
  }, [])

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking Pipedream status...</span>
      </div>
    )
  }

  if (status === "enabled") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">Pipedream is enabled</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Access 3,000+ app integrations directly in your workflows. Connect your accounts when configuring Pipedream actions in the workflow builder.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <XCircle className="h-5 w-5" />
        <span className="font-medium">Pipedream is not configured</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Pipedream integration requires configuration by the application administrator.
      </p>
    </div>
  )
}
```

**Note**: You may need to create a simple API route at `app/api/pipedream/status/route.ts` that calls `isPipedreamEnabled()`, OR use an existing pattern from other plugins for checking status.

### Step 5: Move Step File

Copy `lib/steps/pipedream-action.ts` to `plugins/pipedream/steps/pipedream-action/step.ts`

Update any relative imports to use absolute imports (e.g., `@/lib/...`).

### Step 6: Create `plugins/pipedream/steps/pipedream-action/config.tsx`

```tsx
"use client"

// Re-export the existing PipedreamActionConfig component
// This wrapper allows the plugin system to find it in the expected location
export { PipedreamActionConfig } from "@/components/workflow/config/pipedream-action-config"
```

### Step 7: Create `plugins/pipedream/index.tsx`

Look at existing plugins for the exact pattern. Reference files:
- `plugins/v0/index.tsx`
- `plugins/firecrawl/index.tsx`
- `plugins/registry.ts` (for the `IntegrationPlugin` type)

```tsx
import { IntegrationPlugin } from "@/plugins/registry"
import { PipedreamIcon } from "./icon"
import { PipedreamSettings } from "./settings"
import { testPipedreamConnection } from "./test"

export const pipedreamPlugin: IntegrationPlugin = {
  type: "pipedream",
  name: "Pipedream",
  description: "Connect to 3,000+ apps with Pipedream",
  icon: PipedreamIcon,
  settings: PipedreamSettings,
  test: testPipedreamConnection,

  // Empty - credentials are in env vars, not per-user
  formFields: [],
  credentialMapping: () => ({}),

  // Single dynamic action that covers all 3,000+ Pipedream apps
  actions: [
    {
      type: "pipedream-action",
      name: "Pipedream Action",
      description: "Execute any of 3,000+ Pipedream app actions",
      // Point to the step and config in the plugin directory
      stepPath: "@/plugins/pipedream/steps/pipedream-action/step",
      configComponent: "@/plugins/pipedream/steps/pipedream-action/config",
    }
  ],
}

export default pipedreamPlugin
```

**IMPORTANT**: Check the exact shape of `IntegrationPlugin` in `plugins/registry.ts` and adjust accordingly. The above is a template - the actual fields may differ.

### Step 8: Update `lib/db/integrations.ts`

Add `"pipedream"` to the `IntegrationType` union if not already present:

```ts
export type IntegrationType = "v0" | "firecrawl" | "pipedream" | ... // add pipedream
```

### Step 9: Update `lib/workflow-executor.workflow.ts`

Find where `pipedream-action` step is imported and update the import path:

```ts
// Old (find this):
import { executePipedreamAction } from "@/lib/steps/pipedream-action"

// New:
import { executePipedreamAction } from "@/plugins/pipedream/steps/pipedream-action/step"
```

### Step 10: Verify Plugin Auto-Discovery

Check `plugins/registry.ts` to understand how plugins are auto-discovered. The Pipedream plugin should be automatically picked up if:
1. It's in the `plugins/` directory
2. It exports a default `IntegrationPlugin`
3. It follows the same pattern as other plugins

If auto-discovery doesn't work, you may need to manually register it in the registry.

### Step 11: Clean Up Old Files (Optional)

After verifying everything works:
- Consider removing `lib/steps/pipedream-action.ts` if it's no longer imported anywhere
- Keep `components/workflow/config/pipedream-action-config.tsx` (it's still used via re-export)
- Keep `components/pipedream/pipedream-provider.tsx` (app-level SDK initialization)
- Keep `lib/pipedream/server.ts` (backend SDK functions)

---

## Files to Reference

Before implementing, read these files to understand the patterns:

1. **Plugin structure**: `plugins/v0/index.tsx`, `plugins/firecrawl/index.tsx`
2. **Plugin registry**: `plugins/registry.ts` (for `IntegrationPlugin` type definition)
3. **Existing Pipedream code**:
   - `lib/steps/pipedream-action.ts` (step to move)
   - `components/workflow/config/pipedream-action-config.tsx` (config component)
   - `lib/pipedream/server.ts` (server functions including `isPipedreamEnabled`)
4. **Workflow executor**: `lib/workflow-executor.workflow.ts` (needs import path update)
5. **Integration types**: `lib/db/integrations.ts`

---

## Testing Checklist

After implementation:

- [ ] `pnpm check` passes (no lint errors)
- [ ] `pnpm build` succeeds
- [ ] Pipedream appears in the Integrations dialog
- [ ] Settings shows read-only status (enabled/disabled)
- [ ] Pipedream actions still appear in workflow action grid
- [ ] Can configure a Pipedream action in a workflow
- [ ] Workflow execution with Pipedream action still works

---

## Summary

This is a **lightweight plugin wrapper** that brings Pipedream into the plugin architecture for consistency, while respecting its unique nature:
- No credential form (env vars only)
- Read-only settings UI (status display)
- Single dynamic action covering all 3,000+ apps
- Existing SDK components and config UI are reused via re-exports
