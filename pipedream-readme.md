# Pipedream Connect for AI Agents

Pipedream Connect is a powerful developer toolkit that enables AI agents to seamlessly integrate with 2,800+ external APIs and services. This document explores how agents can leverage Connect to extend their capabilities through managed authentication, pre-built tools, and secure API access.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Integration Approaches](#integration-approaches)
- [SDK Integration (Strongly Recommended)](#sdk-integration-strongly-recommended)
- [Core Features for AI Agents](#core-features-for-ai-agents)
- [Advanced Tool Calling with Actions and Triggers](#advanced-tool-calling-with-actions-and-triggers)
- [AI Agent Use Cases](#ai-agent-use-cases)
- [Security Best Practices](#security-best-practices)
- [Supported AI Frameworks](#supported-ai-frameworks)
- [Pricing and Limits](#pricing-and-limits)
- [Resources](#resources)

## Overview

Pipedream Connect provides AI agents with managed authentication and API access to 2,800+ services. Here's how it works:

### Step 1: Connect User Accounts
Use the frontend SDK or Connect Link to connect your users' accounts:
- **Frontend SDK**: Use `client.connectAccount()` to open account connection flow in your UI
- **Connect Link**: Generate a URL users can open in a browser to connect accounts
- Account credentials are securely saved to Pipedream and accessible via your project

### Step 2: Make Authenticated API Requests
Once accounts are connected, make authenticated requests on behalf of users using:

**A. Pre-built Actions & Triggers**
- Execute 10,000+ pre-built components with `client.actions.run()`
- Deploy event-driven triggers with `client.triggers.deploy()`
- Choose your frontend: Connect React (drop-in components) or custom UI with backend SDK

**B. Custom API Requests via Proxy**
- Send custom requests through `client.proxy.*` methods
- Pipedream handles authentication automatically
- Full control over request/response handling

**C. MCP Integration**
- Use Pipedream's MCP server for AI framework integration
- Tools automatically prompt users to connect accounts when needed
- No upfront account connection required - handled on-demand

### Key Benefits
- **No Credential Management**: Pipedream securely stores and refreshes tokens
- **Multi-language SDKs**: TypeScript, Python, and Java support
- **Flexible Integration**: Choose the approach that fits your architecture

## Getting Started

### Quick Start Example

Here's a complete example showing how to enable users to connect accounts and run actions:

**1. Backend Setup (Node.js)**

```typescript
import { PipedreamClient } from "@pipedream/sdk";

// Initialize server client with OAuth credentials
const client = new PipedreamClient({
  clientId: process.env.PIPEDREAM_CLIENT_ID!,
  clientSecret: process.env.PIPEDREAM_CLIENT_SECRET!,
  projectId: process.env.PIPEDREAM_PROJECT_ID!,
  projectEnvironment: "development" // Use this while developing
});

// Generate connect token for frontend
export async function createConnectToken(externalUserId: string) {
  return await client.tokens.create({
    externalUserId,
    allowedOrigins: ["https://your-app.com"] // Required for browser usage
  });
}

// Run action on behalf of user
export async function runSlackMessage(externalUserId: string, message: string) {
  return await client.actions.run({
    id: "slack-send-message-to-channel",
    externalUserId,
    configuredProps: {
      slack: {
        authProvisionId: "apn_abc123" // User's connected account ID
      },
      channel: "#general",
      text: message
    }
  });
}
```

**2. Frontend Usage (Browser/React)**

```typescript
import { PipedreamClient } from "@pipedream/sdk";

function MyComponent() {
  const client = new PipedreamClient(); // No credentials needed for frontend

  const connectAccount = async () => {
    // Get token from your backend
    const { token } = await fetch('/api/connect-token').then(r => r.json());

    // Open account connection flow
    client.connectAccount({
      app: "slack",
      token,
      onSuccess: (account) => {
        console.log(`Account connected: ${account.id}`);
        // Save account.id as authProvisionId for future actions
      }
    });
  };

  return (
    <button onClick={connectAccount}>
      Connect Slack Account
    </button>
  );
}
```

**3. Environment Configuration**

```bash
# .env file
PIPEDREAM_CLIENT_ID=your_oauth_client_id
PIPEDREAM_CLIENT_SECRET=your_oauth_client_secret
PIPEDREAM_PROJECT_ID=proj_your_project_id
PIPEDREAM_PROJECT_ENVIRONMENT=development
PIPEDREAM_ALLOWED_ORIGINS=["https://localhost:3000","https://your-app.com"]
```

### Environment Setup Guide

**Development Environment:**
```typescript
const client = new PipedreamClient({
  clientId: process.env.PIPEDREAM_CLIENT_ID!,
  clientSecret: process.env.PIPEDREAM_CLIENT_SECRET!,
  projectId: process.env.PIPEDREAM_PROJECT_ID!,
  projectEnvironment: "development" // Use development environment
});

// Development tokens can use localhost origins
const token = await client.tokens.create({
  externalUserId: "dev-user-123",
  allowedOrigins: ["http://localhost:3000", "https://localhost:3001"]
});
```

**Production Environment (when ready to deploy):**
```typescript
const client = new PipedreamClient({
  clientId: process.env.PIPEDREAM_CLIENT_ID!,
  clientSecret: process.env.PIPEDREAM_CLIENT_SECRET!,
  projectId: process.env.PIPEDREAM_PROJECT_ID!,
  projectEnvironment: "production" // Only when deploying to production
});

// Production tokens require HTTPS origins
const token = await client.tokens.create({
  externalUserId: "user-456",
  allowedOrigins: ["https://your-app.com", "https://app.yourdomain.com"]
});
```

**Environment Notes:**
- **Start with development**: Use `"development"` while building and testing
- User accounts are scoped to environments (dev/prod accounts are separate)
- Connect tokens are environment-specific
- Development allows `localhost` origins, production requires HTTPS
- Switch to `"production"` only when deploying live

> **Setup Instructions:**
> 1. Create OAuth client: [pipedream.com/settings/api](https://pipedream.com/settings/api)
> 2. Create project: [pipedream.com/projects](https://pipedream.com/projects)
> 3. Copy Project ID from Settings tab

## Integration Approaches

Choose the right integration approach based on your needs:

### 1. Backend SDK + Custom Frontend
**Best for: Full control over user experience**

- Use `client.tokens.create()` on backend to generate secure tokens
- Use `client.connectAccount()` on frontend for account connections
- Use `client.actions.run()` and `client.triggers.deploy()` for execution
- Build your own UI components and handle user flows

**When to use:**
- Need complete control over UI/UX
- Integrating into existing applications
- Want custom error handling and retry logic
- Building for non-React frameworks

### 2. Connect React SDK
**Best for: Rapid development with pre-built UI**

- Use `FrontendClientProvider` to wrap your app
- Use `ComponentFormContainer` for automatic action/trigger configuration
- Handles dynamic props, validation, and execution automatically
- Pre-built, accessible UI components

**When to use:**
- Building React applications
- Want to ship integrations quickly
- Need user-facing configuration interfaces
- Prefer pre-built, tested components

### 3. MCP Integration
**Best for: AI frameworks with native MCP support**

- Works with OpenAI, Anthropic, Vercel AI SDK, and LangChain
- Tools discoverable by natural language
- Automatic tool parameter configuration
- Dynamic tool loading based on connected accounts

**When to use:**
- Your AI framework supports MCP
- Building conversational agents
- Want natural language tool interaction
- Need dynamic tool discovery

---

**Quick Decision Guide:**
- **React app + want speed?** → Use Connect React SDK
- **Need full control?** → Use Backend SDK + Custom Frontend
- **Building AI chat/agent?** → Use MCP Integration
- **Non-React framework?** → Use Backend SDK + Custom Frontend

## Core Features for AI Agents

### 1. Model Context Protocol (MCP) Integration

Pipedream's MCP server enables agents to discover and execute tools dynamically:

```bash
# MCP Server URL
https://remote.mcp.pipedream.net
```

**Key Capabilities:**
- Automatic tool discovery from 2,800+ APIs
- Streamable HTTP transport
- User account connection management
- Support for OpenAI, Anthropic, Google Gemini, and Vercel AI SDK

**Setup Requirements:**
```bash
export PIPEDREAM_CLIENT_ID="your_client_id"
export PIPEDREAM_CLIENT_SECRET="your_client_secret"
export PIPEDREAM_PROJECT_ID="your_project_id"
```

### 2. Managed Authentication

Connect eliminates the complexity of managing user credentials:

- **OAuth Flow Management**: Automatic token refresh and storage
- **API Key Handling**: Secure storage and injection
- **Connect Link**: Pre-built UI components for user authorization
- **External User Mapping**: Associate your user IDs with connected accounts

### 3. API Proxy for Secure Requests

Make authenticated API calls without handling credentials:

```typescript
// TypeScript example
const response = await client.proxy.post({
  externalUserId: "user123",
  accountId: "account456",
  url: "https://api.github.com/repos/owner/repo/issues",
  headers: { "Content-Type": "application/json" },
  body: { title: "New issue", body: "Created by AI agent" }
});
```

**Limitations:**
- 1,000 requests per 5 minutes per project
- 30-second maximum timeout
- Restricted header modifications

## SDK Integration

**⚠️ Always use the official Pipedream SDKs instead of calling the REST API directly.** The SDKs provide automatic authentication, type safety, error handling, and future compatibility.

### Installation

```bash
npm install @pipedream/sdk @pipedream/connect-react
```

### Key SDK Methods

#### Backend Methods (Server-side)

```typescript
import { PipedreamClient } from "@pipedream/sdk";

const client = new PipedreamClient({
  clientId: process.env.PIPEDREAM_CLIENT_ID!,
  clientSecret: process.env.PIPEDREAM_CLIENT_SECRET!,
  projectId: process.env.PIPEDREAM_PROJECT_ID!,
  projectEnvironment: "development" // Use this while developing
});

// Generate connect tokens for frontend
const token = await client.tokens.create({
  externalUserId: "user123",
  allowedOrigins: ["https://your-app.com"]
});

// List user's connected accounts
const accounts = await client.accounts.list({
  externalUserId: "user123",
  app: "slack" // optional filter
});

// Discover available components
const components = await client.components.list({
  q: "slack",
  type: "action" // or "trigger"
});

// Execute actions
const result = await client.actions.run({
  id: "slack-send-message-to-channel",
  externalUserId: "user123",
  configuredProps: {
    slack: { authProvisionId: "apn_abc123" },
    channel: "#general",
    text: "Hello from AI agent!"
  }
});

// Deploy triggers
const trigger = await client.triggers.deploy({
  id: "slack-new-message",
  externalUserId: "user123",
  configuredProps: {
    slack: { authProvisionId: "apn_abc123" },
    channels: ["#alerts"]
  },
  webhookUrl: "https://your-app.com/webhook"
});

// API proxy for custom requests
const response = await client.proxy.post({
  externalUserId: "user123",
  accountId: "apn_abc123",
  url: "https://api.github.com/repos/owner/repo/issues",
  body: { title: "New issue", body: "Created by AI" }
});
```

#### Frontend Methods (Browser)

```typescript
import { PipedreamClient } from "@pipedream/sdk";

const client = new PipedreamClient(); // No credentials for frontend

// Connect user accounts
client.connectAccount({
  app: "github",
  token: connectToken, // From backend tokens.create()
  oauthAppId: "optional_custom_oauth_app", // Use custom OAuth client
  onSuccess: (account) => {
    console.log(`Connected: ${account.id}`);
    // Save account.id as authProvisionId for actions
  },
  onError: (error) => {
    console.error('Connection failed:', error.message);
  }
});
```

### Error Handling

```typescript
import { PipedreamError } from "@pipedream/sdk";

try {
  const result = await client.actions.run({...});
} catch (error) {
  if (error instanceof PipedreamError) {
    console.log(`Status: ${error.statusCode}`);
    console.log(`Message: ${error.message}`);
    console.log(`Details:`, error.body);
  }
}
```

### TypeScript/JavaScript

```typescript
import { PipedreamClient } from "@pipedream/sdk";

// Server initialization
const client = new PipedreamClient({
  clientId: process.env.PIPEDREAM_CLIENT_ID!,
  clientSecret: process.env.PIPEDREAM_CLIENT_SECRET!,
  projectId: process.env.PIPEDREAM_PROJECT_ID!,
  projectEnvironment: "development" // Use this while developing
});

// Generate connect token
const connectToken = await client.tokens.create({
  externalUserId: "agent_user_123",
  allowedOrigins: ["https://your-app.com"]
});

// Frontend usage
const frontendClient = new PipedreamClient();
frontendClient.connectAccount({
  app: "slack",
  token: connectToken.token,
  onSuccess: (account) => console.log('Connected:', account.id)
});
```

### Python

```python
from pipedream import Pipedream
import os

# Server initialization
pd = Pipedream(
    client_id=os.getenv("PIPEDREAM_CLIENT_ID"),
    client_secret=os.getenv("PIPEDREAM_CLIENT_SECRET"),
    project_id=os.getenv("PIPEDREAM_PROJECT_ID"),
    project_environment="development"  # Use this while developing
)

# Generate connect token
token = await pd.tokens.create({
    "externalUserId": "user123",
    "allowedOrigins": ["https://your-app.com"]
})

# Execute action
response = await pd.actions.run({
    "id": "github-create-issue",
    "externalUserId": "user123",
    "configuredProps": {
        "github": {
            "authProvisionId": "apn_github123"
        },
        "repo": "my-repo",
        "title": "AI Generated Issue",
        "body": "Created automatically by AI agent"
    }
})
```

### Java

```java
import com.pipedream.api.BaseClient;
import java.util.Map;
import java.util.Arrays;

// Server initialization
BaseClient client = BaseClient
    .builder()
    .clientId(System.getenv("PIPEDREAM_CLIENT_ID"))
    .clientSecret(System.getenv("PIPEDREAM_CLIENT_SECRET"))
    .projectId(System.getenv("PIPEDREAM_PROJECT_ID"))
    .projectEnvironment("development")  // Use this while developing
    .build();

// Generate connect token
var tokenRequest = Map.of(
    "externalUserId", "user123",
    "allowedOrigins", Arrays.asList("https://your-app.com")
);
var token = client.tokens.create(tokenRequest);

// Execute action
var actionRequest = Map.of(
    "id", "slack-send-message-to-channel",
    "externalUserId", "user123",
    "configuredProps", Map.of(
        "slack", Map.of("authProvisionId", "apn_slack123"),
        "channel", "#general",
        "text", "Hello from Java AI agent!"
    )
);
var result = client.actions.run(actionRequest);
```

## Connect React SDK

The Connect React SDK provides pre-built components that handle the entire integration flow automatically, from account connection to action execution.

### Installation

```bash
npm install @pipedream/connect-react
```

### Basic Setup

**Backend: Token Generation (actions.ts)**

```typescript
"use server";
import { PipedreamClient } from "@pipedream/sdk";

const client = new PipedreamClient({
  projectEnvironment: "development", // Use this while developing
  projectId: process.env.PIPEDREAM_PROJECT_ID!,
  clientId: process.env.PIPEDREAM_CLIENT_ID!,
  clientSecret: process.env.PIPEDREAM_CLIENT_SECRET!,
});

// Generate secure tokens for frontend requests
export async function fetchToken(opts: { externalUserId: string }) {
  return await client.tokens.create({
    externalUserId: opts.externalUserId,
    allowedOrigins: JSON.parse(process.env.PIPEDREAM_ALLOWED_ORIGINS || "[]"),
  });
}
```

**Frontend: React Component**

```typescript
import { PipedreamClient } from '@pipedream/sdk';
import {
  FrontendClientProvider,
  ComponentFormContainer
} from '@pipedream/connect-react';
import { fetchToken } from './actions';

function AIAgentIntegration({ userId }) {
  // Initialize frontend client with token callback
  const client = new PipedreamClient({
    projectEnvironment: "development", // Use this while developing
    externalUserId: userId,
    tokenCallback: fetchToken, // Backend function to generate tokens
  });

  return (
    <FrontendClientProvider client={client}>
      {/* Pre-built component handles entire configuration and execution flow */}
      <ComponentFormContainer
        userId={userId}
        componentKey="slack-send-message-to-channel"
        onRun={(result) => {
          console.log('Action completed:', result);
          // Handle successful execution
        }}
        onError={(error) => {
          console.error('Action failed:', error);
          // Handle errors
        }}
      />
    </FrontendClientProvider>
  );
}
```

### Advanced Usage

**Multi-Action AI Agent Hub**

```typescript
import { useState } from 'react';
import { ComponentFormContainer, FrontendClientProvider } from '@pipedream/connect-react';

function AIAgentActionHub({ userId, client }) {
  const [availableActions] = useState([
    { key: 'slack-send-message-to-channel', name: 'Send Slack Message' },
    { key: 'github-create-issue', name: 'Create GitHub Issue' },
    { key: 'gmail-send-email', name: 'Send Email' },
    { key: 'linear-create-issue', name: 'Create Linear Issue' }
  ]);

  const [selectedAction, setSelectedAction] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);

  const handleActionComplete = (result) => {
    setActionHistory(prev => [...prev, {
      action: selectedAction.name,
      result,
      timestamp: new Date()
    }]);
    setSelectedAction(null); // Reset for next action
  };

  return (
    <FrontendClientProvider client={client}>
      <div className="ai-agent-hub">
        <h2>AI Agent Action Hub</h2>

        {!selectedAction ? (
          <div className="action-selector">
            <h3>Select an action:</h3>
            {availableActions.map(action => (
              <button
                key={action.key}
                onClick={() => setSelectedAction(action)}
                className="action-button"
              >
                {action.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="action-configuration">
            <h3>Configure: {selectedAction.name}</h3>
            <ComponentFormContainer
              userId={userId}
              componentKey={selectedAction.key}
              onRun={handleActionComplete}
              onCancel={() => setSelectedAction(null)}
            />
          </div>
        )}

        {/* Show execution history */}
        <div className="action-history">
          <h3>Recent Actions ({actionHistory.length})</h3>
          {actionHistory.map((item, index) => (
            <div key={index} className="history-item">
              <strong>{item.action}</strong> - {item.timestamp.toLocaleString()}
              <details>
                <summary>View Result</summary>
                <pre>{JSON.stringify(item.result, null, 2)}</pre>
              </details>
            </div>
          ))}
        </div>
      </div>
    </FrontendClientProvider>
  );
}
```

### Connect React SDK Benefits

- **Automatic UI Generation**: Dynamic forms based on component prop definitions
- **Account Connection Management**: Built-in `connectAccount` integration
- **Dynamic Prop Handling**: Automatically reloads dependent props
- **Validation & Error Handling**: User-friendly error messages and validation
- **Responsive Design**: Mobile-friendly, accessible components
- **Type Safety**: Full TypeScript support
- **Real-time Execution**: Live action execution with results display

## AI Agent Use Cases

### 1. Autonomous Task Execution

Agents can perform complex multi-step workflows:

```typescript
// Example: AI agent creating a GitHub issue and notifying Slack
async function handleUserRequest(request: string, externalUserId: string) {
  // Create GitHub issue using action
  const issue = await client.actions.run({
    id: "github-create-issue",
    externalUserId,
    configuredProps: {
      github: { authProvisionId: "apn_github123" },
      repo: "owner/repo",
      title: request,
      body: "Generated by AI agent",
      labels: ["ai-generated"]
    }
  });

  // Notify team via Slack using action
  await client.actions.run({
    id: "slack-send-message-to-channel",
    externalUserId,
    configuredProps: {
      slack: { authProvisionId: "apn_slack123" },
      channel: "#dev-team",
      text: `🤖 New issue created: ${issue.ret.html_url}`
    }
  });
}
```

### 2. Data Integration and Analysis

```typescript
// Collect data from multiple sources
async function analyzeUserActivity(externalUserId: string) {
  // Get GitHub commits using proxy
  const commits = await client.proxy.get({
    externalUserId,
    accountId: "apn_github123", // Use actual authProvisionId
    url: "https://api.github.com/repos/owner/repo/commits",
    params: { per_page: 50 } // Add pagination
  });

  // Get Slack messages using proxy
  const messages = await client.proxy.get({
    externalUserId,
    accountId: "apn_slack123", // Use actual authProvisionId
    url: "https://slack.com/api/conversations.history",
    params: { channel: "C1234567890", limit: 100 } // Proper channel ID
  });

  // Process with AI model
  return await analyzeActivity(commits.data, messages.data);
}
```

### 3. Real-time Event Response

Agents can respond to triggers using the triggers.deploy API:

```typescript
// Deploy a Slack message trigger to respond to mentions
const trigger = await client.triggers.deploy({
  externalUserId: "user123",
  id: "slack-new-message",
  configuredProps: {
    slack: {
      authProvisionId: "apn_slack123"
    },
    channels: ["C1234567890"], // Use actual channel IDs
    excludeBots: true,
    includeThreadReplies: false
  },
  webhookUrl: "https://your-app.com/webhooks/slack-mentions",
  skipHistoricalEvents: true
});

// Your webhook handler would then process the event and respond
// using actions.run to send messages or perform other tasks
```

## Security Best Practices

- **Never expose secrets in client-side code**
- **Use HTTPS for all communications**
- **Implement secure session-based auth between client/server**
- **Validate all requests in workflows before execution**
- **Store credentials securely with Pipedream's encryption**

## Advanced Tool Calling with Actions and Triggers

### 1. Action Execution with `actions.run`

Actions are pre-built components that perform specific tasks. AI agents can discover, configure, and execute these actions programmatically. You have two main implementation approaches:

1. **Backend SDK + Custom Frontend**: Full control over UI/UX using the Pipedream SDK
2. **Connect React SDK**: Pre-built React components that handle configuration UI automatically

#### Approach 1: Backend SDK with Custom Frontend

This approach gives you complete control over the user experience by handling all Connect operations on your backend:

**Configuration Flow:**
1. **Component Discovery**: Find the action component
2. **Prop Configuration**: Configure input parameters sequentially
3. **Dynamic Prop Handling**: Reload props when dependencies change
4. **Action Execution**: Run the action with configured props

```typescript
// Complete action configuration and execution example
import { PipedreamClient } from "@pipedream/sdk";

const client = new PipedreamClient({
  clientId: process.env.PIPEDREAM_CLIENT_ID!,
  clientSecret: process.env.PIPEDREAM_CLIENT_SECRET!,
  projectId: process.env.PIPEDREAM_PROJECT_ID!,
  projectEnvironment: "development"
});

// Step 1: Discover available actions
const components = await client.components.list({
  q: "gitlab",
  type: "action"
});

// Step 2: Get component details
const component = await client.components.get({
  id: "gitlab-create-issue"
});

// Step 3: Configure props step by step
let configuredProps = {
  gitlab: {
    authProvisionId: "apn_abc123" // User's connected GitLab account
  }
};

// Step 4: Handle dynamic props (props that depend on other selections)
const propsResponse = await client.components.configureProp({
  id: "gitlab-create-issue",
  externalUserId: "user123",
  propName: "projectId", // Configure project selection
  configuredProps
});

// Step 5: Add project selection
configuredProps.projectId = 12345678; // Selected from propsResponse options

// Step 6: Execute action with complete configuration
const result = await client.actions.run({
  id: "gitlab-create-issue",
  externalUserId: "user123",
  configuredProps: {
    ...configuredProps,
    title: "AI Agent Created Issue",
    description: "This issue was created by an AI agent",
    labels: "bug,automated", // GitLab expects comma-separated string
    assigneeId: 98765 // Optional assignee
  }
});

// Handle results
console.log('Action completed:', {
  exports: result.exports, // Named outputs from the action
  logs: result.os,        // Execution logs
  returnValue: result.ret // Main return value
});
```

#### Prop Configuration Requirements

- **Authentication Props**: Reference connected accounts via `authProvisionId`
- **Dynamic Props**: Reload prop definitions when dependencies change
- **Remote Options**: Some props fetch options from external APIs
- **Validation**: Props are validated before action execution

```typescript
// Example of configuring and executing slack-send-message-to-channel
async function configureSlackAction(externalUserId: string) {
  let configuredProps = {
    slack: { authProvisionId: "apn_slack123" }
  };

  // Step 1: Configure channel prop to get available channels
  let propsResponse = await client.components.configureProp({
    id: "slack-send-message-to-channel",
    externalUserId,
    propName: "channel",
    configuredProps
  });

  // Step 2: Select channel from available options
  configuredProps.channel = "#general";

  // Step 3: Add message text
  configuredProps.text = "Hello from AI agent!";

  // Step 4: Execute the action
  const result = await client.actions.run({
    id: "slack-send-message-to-channel",
    externalUserId,
    configuredProps
  });

  return result;
}
```

#### Approach 2: Connect React SDK (Recommended for Frontend Integration)

The Connect React SDK provides pre-built React components that handle the entire action configuration flow automatically. This is ideal for AI agents that need user interaction for tool configuration.

```typescript
// Backend: Generate connect tokens (actions.ts)
"use server";
import { PipedreamClient } from "@pipedream/sdk";

const client = new PipedreamClient({
  projectEnvironment: "development", 
  projectId: process.env.PIPEDREAM_PROJECT_ID,
  clientId: process.env.PIPEDREAM_CLIENT_ID,
  clientSecret: process.env.PIPEDREAM_CLIENT_SECRET,
});

// Generate secure tokens for frontend requests
export async function fetchToken(opts: { externalUserId: string }) {
  return await client.tokens.create({
    externalUserId: opts.externalUserId,
    allowedOrigins: JSON.parse(process.env.PIPEDREAM_ALLOWED_ORIGINS || "[]"),
  });
}
```

```typescript
// Frontend: React component with pre-built UI (component.tsx)
import { PipedreamClient } from '@pipedream/sdk';
import { 
  FrontendClientProvider, 
  ComponentFormContainer 
} from '@pipedream/connect-react';
import { fetchToken } from './actions';

function ActionConfigurationAgent({ userId, onActionComplete }) {
  // Initialize frontend client with token callback
  const client = new PipedreamClient({
    projectEnvironment: "development", // Use this while developing
    externalUserId: userId,
    tokenCallback: fetchToken, // Backend function to generate tokens
  });

  return (
    <FrontendClientProvider client={client}>
      {/* Pre-built component handles entire configuration flow */}
      <ComponentFormContainer
        userId={userId}
        componentKey="slack-send-message-to-channel"
        onRun={(result) => {
          // Handle action execution result
          console.log('Action completed:', result);
          onActionComplete(result);
        }}
        onError={(error) => {
          console.error('Action failed:', error);
        }}
      />
    </FrontendClientProvider>
  );
}

export default ActionConfigurationAgent;
```

**Connect React SDK Benefits:**
- **Automatic UI Generation**: Dynamic forms based on component prop definitions
- **Dynamic Prop Handling**: Automatically reloads dependent props
- **Account Connection Management**: Built-in Connect Link integration
- **Error Handling**: User-friendly error messages and retry logic
- **Responsive Design**: Mobile-friendly, accessible components
- **Type Safety**: Full TypeScript support

**Example: Multi-Action AI Agent Interface**

```typescript
// Advanced agent interface with multiple action types
import { useState } from 'react';
import { ComponentFormContainer, FrontendClientProvider } from '@pipedream/connect-react';

function AIAgentActionHub({ userId, client }) {
  const [availableActions, setAvailableActions] = useState([
    { key: 'slack-send-message-to-channel', name: 'Send Slack Message' },
    { key: 'github-create-issue', name: 'Create GitHub Issue' },
    { key: 'gmail-send-email', name: 'Send Email' },
    { key: 'linear-create-issue', name: 'Create Linear Issue' }
  ]);
  
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionResults, setActionResults] = useState([]);

  const handleActionComplete = (result) => {
    setActionResults(prev => [...prev, {
      action: selectedAction,
      result,
      timestamp: new Date()
    }]);
    
    // Reset for next action
    setSelectedAction(null);
  };

  return (
    <FrontendClientProvider client={client}>
      <div className="ai-agent-actions">
        <h2>AI Agent Action Hub</h2>
        
        {!selectedAction ? (
          <div className="action-selector">
            <h3>Select an action to configure:</h3>
            {availableActions.map(action => (
              <button 
                key={action.key}
                onClick={() => setSelectedAction(action)}
                className="action-button"
              >
                {action.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="action-configuration">
            <h3>Configure: {selectedAction.name}</h3>
            <ComponentFormContainer
              userId={userId}
              componentKey={selectedAction.key}
              onRun={handleActionComplete}
              onCancel={() => setSelectedAction(null)}
            />
          </div>
        )}

        {/* Show execution history */}
        <div className="action-history">
          <h3>Recent Actions</h3>
          {actionResults.map((item, index) => (
            <div key={index} className="action-result">
              <strong>{item.action.name}</strong> - {item.timestamp.toLocaleString()}
              <pre>{JSON.stringify(item.result, null, 2)}</pre>
            </div>
          ))}
        </div>
      </div>
    </FrontendClientProvider>
  );
}
```

### 2. Event-Driven Automation with `triggers.deploy`

Triggers enable AI agents to respond to events in external systems. Like actions, you can implement triggers using two approaches:

1. **Backend SDK + Custom Frontend**: Programmatic trigger deployment and management
2. **Connect React SDK**: Pre-built React components for trigger configuration UI

#### Approach 1: Backend SDK for Triggers

**App-Based Event Sources**

Deploy event sources that listen to third-party APIs:

```typescript
// Deploy a GitLab issue trigger using the SDK (RECOMMENDED)
// SDK handles authentication, error handling, and response formatting
const trigger = await client.triggers.deploy({
  externalUserId: "user123",
  id: "gitlab-new-issue", // Component ID
  configuredProps: {
    gitlab: {
      authProvisionId: "apn_gitlab123" // User's GitLab account
    },
    projectId: 45672541,
    includeComments: true,
    labels: ["bug", "critical"] // Filter specific labels
  },
  webhookUrl: "https://your-app.com/webhooks/gitlab-issues"
});

// SDK provides typed response with proper error handling
console.log({
  id: trigger.id,
  status: trigger.status,
  endpointUrl: trigger.endpointUrl,
  configured_props: trigger.configured_props
});
```

**Native Triggers**

Deploy system-level triggers for HTTP webhooks, scheduled jobs, and email:

```typescript
// HTTP Webhook trigger
const httpTrigger = await client.triggers.deploy({
  externalUserId: "user123", 
  id: "http",
  configuredProps: {
    httpPath: "/ai-agent-webhook",
    corsEnabled: true
  },
  webhookUrl: "https://your-app.com/process-webhook"
});

// Scheduled trigger (cron)
const scheduledTrigger = await client.triggers.deploy({
  externalUserId: "user123",
  id: "cron",
  configuredProps: {
    cron: "0 9 * * MON", // Every Monday at 9 AM
    timezone: "America/New_York"
  },
  webhookUrl: "https://your-app.com/weekly-report"
});

// Email trigger
const emailTrigger = await client.triggers.deploy({
  externalUserId: "user123",
  id: "email",
  configuredProps: {
    name: "ai-agent-inbox"
  },
  webhookUrl: "https://your-app.com/process-email"
});
```

**Advanced Trigger Configuration**

```typescript
// Complex trigger with filtering and data transformation
const slackTrigger = await client.triggers.deploy({
  externalUserId: "user123",
  id: "slack-new-message",
  configuredProps: {
    slack: { authProvisionId: "apn_slack123" },
    channels: ["#ai-alerts", "#critical-issues"],
    excludeBots: true,
    includeThreadReplies: false,
    keywords: ["urgent", "error", "down"] // Only trigger on specific keywords
  },
  webhookUrl: "https://your-app.com/slack-alerts",
  skipHistoricalEvents: true // Don't emit old events on deploy
});
```

#### Approach 2: Connect React SDK for Triggers

The Connect React SDK also supports trigger configuration with pre-built components:

```typescript
// Backend: Trigger management API (triggers.ts)
"use server";
import { PipedreamClient } from "@pipedream/sdk";

const client = new PipedreamClient({
  projectEnvironment: "development",
  projectId: process.env.PIPEDREAM_PROJECT_ID,
  clientId: process.env.PIPEDREAM_CLIENT_ID,
  clientSecret: process.env.PIPEDREAM_CLIENT_SECRET,
});

export async function deployTrigger(opts: {
  externalUserId: string;
  triggerConfig: any;
}) {
  return await client.triggers.deploy({
    externalUserId: opts.externalUserId,
    ...opts.triggerConfig
  });
}

export async function listTriggers(externalUserId: string) {
  return await client.triggers.list({ externalUserId });
}
```

```typescript
// Frontend: Trigger Configuration Component
import { useState, useEffect } from 'react';
import { ComponentFormContainer, FrontendClientProvider } from '@pipedream/connect-react';
import { deployTrigger, listTriggers } from './triggers';

function TriggerManagementAgent({ userId, client }) {
  const [availableTriggers, setAvailableTriggers] = useState([
    { key: 'slack-new-message', name: 'Slack New Message' },
    { key: 'github-new-issue', name: 'GitHub New Issue' },
    { key: 'gmail-new-email', name: 'Gmail New Email' },
    { key: 'cron', name: 'Scheduled Job' },
    { key: 'http', name: 'HTTP Webhook' }
  ]);
  
  const [selectedTrigger, setSelectedTrigger] = useState(null);
  const [deployedTriggers, setDeployedTriggers] = useState([]);

  useEffect(() => {
    // Load existing triggers
    loadDeployedTriggers();
  }, [userId]);

  const loadDeployedTriggers = async () => {
    try {
      const triggers = await listTriggers(userId);
      setDeployedTriggers(triggers.data || []);
    } catch (error) {
      console.error('Failed to load triggers:', error);
    }
  };

  const handleTriggerDeploy = async (result) => {
    console.log('Trigger deployed:', result);
    setSelectedTrigger(null);
    
    // Refresh the deployed triggers list
    await loadDeployedTriggers();
  };

  return (
    <FrontendClientProvider client={client}>
      <div className="trigger-management">
        <h2>AI Agent Trigger Hub</h2>
        
        <div className="deployed-triggers">
          <h3>Active Triggers ({deployedTriggers.length})</h3>
          {deployedTriggers.map((trigger, index) => (
            <div key={index} className="trigger-item">
              <strong>{trigger.id}</strong> - {trigger.status}
              <br />
              <small>Endpoint: {trigger.endpointUrl}</small>
            </div>
          ))}
        </div>

        {!selectedTrigger ? (
          <div className="trigger-selector">
            <h3>Deploy New Trigger:</h3>
            {availableTriggers.map(trigger => (
              <button 
                key={trigger.key}
                onClick={() => setSelectedTrigger(trigger)}
                className="trigger-button"
              >
                {trigger.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="trigger-configuration">
            <h3>Configure: {selectedTrigger.name}</h3>
            <ComponentFormContainer
              userId={userId}
              componentKey={selectedTrigger.key}
              componentType="trigger" // Specify trigger type
              onDeploy={handleTriggerDeploy}
              onCancel={() => setSelectedTrigger(null)}
              deploymentConfig={{
                webhookUrl: "https://your-app.com/webhooks/trigger-events"
              }}
            />
          </div>
        )}
      </div>
    </FrontendClientProvider>
  );
}
```

**Connect React SDK Benefits for Triggers:**
- **Visual Trigger Builder**: Drag-and-drop interface for trigger configuration
- **Event Filtering UI**: Easy setup of event filters and conditions
- **Webhook Management**: Built-in webhook URL configuration and testing
- **Real-time Status**: Live trigger status and event monitoring
- **Deployment History**: Track trigger deployments and changes

### 3. Advanced MCP Implementation

Pipedream's Model Context Protocol integration provides three distinct tool modes for different agent architectures:

#### Tool Mode: Sub-Agent (Default)

The sub-agent mode uses an LLM to handle tool configuration complexity:

```typescript
// MCP client configuration for sub-agent mode
const transport = new StreamableHTTPClientTransport(
  new URL("https://remote.mcp.pipedream.net"), 
  {
    requestInit: {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "x-pd-project-id": PIPEDREAM_PROJECT_ID,
        "x-pd-environment": PIPEDREAM_ENVIRONMENT,
        "x-pd-external-user-id": EXTERNAL_USER_ID,
        "x-pd-app-slug": "slack",
        "x-pd-tool-mode": "sub-agent" // Default mode
      }
    }
  }
);

// Tools in sub-agent mode take a single "instruction" parameter
const result = await session.callTool({
  name: "slack_send_message_to_channel",
  arguments: {
    instruction: "Send a message to #general channel saying 'Hello from AI agent' with a rocket emoji"
  }
});

// The sub-agent LLM handles:
// - Channel selection and validation
// - Message formatting
// - Emoji insertion
// - Error handling
```

**Sub-Agent Mode Benefits:**
- Simplifies tool usage to natural language instructions
- Handles dynamic props automatically
- Reduces agent complexity
- Currently free during beta

**Sub-Agent Mode Limitations:**
- Less control over specific configurations
- Reduced observability into tool execution
- May not work for highly specific parameter requirements

#### Tool Mode: Full-Config

Full-config mode provides maximum flexibility and control:

```typescript
// Enable full-config mode with conversation tracking
const transport = new StreamableHTTPClientTransport(
  new URL("https://remote.mcp.pipedream.net"),
  {
    requestInit: {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "x-pd-project-id": PIPEDREAM_PROJECT_ID,
        "x-pd-environment": PIPEDREAM_ENVIRONMENT, 
        "x-pd-external-user-id": EXTERNAL_USER_ID,
        "x-pd-app-slug": "github",
        "x-pd-tool-mode": "full-config",
        "x-pd-conversation-id": conversationId // Required for state management
      }
    }
  }
);

// Full-config tools expose all configuration parameters
const result = await session.callTool({
  name: "github_create_issue",
  arguments: {
    owner: "myorg",
    repo: "myproject", 
    title: "Bug Report: API timeout",
    body: "The API is timing out after 30 seconds...",
    assignees: ["developer1", "developer2"],
    labels: ["bug", "high-priority"],
    milestone: 5
  }
});
```

**Dynamic Prop Handling in Full-Config Mode:**

```typescript
// Handle props that depend on previous selections
let session;

// Initial connection
async function initializeSession() {
  session = await createMCPSession(transport);
  await session.initialize();
}

// Reload tools when dynamic props change
async function selectGitHubRepo(owner: string, repo: string) {
  // Update headers with new context
  transport.requestInit.headers["x-pd-repo-context"] = `${owner}/${repo}`;
  
  // Reinitialize session to reload tools with repo-specific options
  await session.close();
  session = await createMCPSession(transport);
  await session.initialize();
  
  // Tools now include repo-specific options (branches, milestones, etc.)
  const tools = await session.listTools();
  return tools;
}
```

#### Tool Mode: Tools-Only

Tools-only mode gives direct control but with limited compatibility:

```typescript
// Tools-only mode - handle everything directly
const transport = new StreamableHTTPClientTransport(
  new URL("https://remote.mcp.pipedream.net"),
  {
    requestInit: {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "x-pd-project-id": PIPEDREAM_PROJECT_ID,
        "x-pd-environment": PIPEDREAM_ENVIRONMENT,
        "x-pd-external-user-id": EXTERNAL_USER_ID, 
        "x-pd-app-slug": "linear",
        "x-pd-tool-mode": "tools-only"
      }
    }
  }
);

// Direct tool execution - no LLM intermediary
const result = await session.callTool({
  name: "linear_create_issue",
  arguments: {
    teamId: "team_abc123",
    title: "Fix authentication bug",
    description: "Users cannot log in with OAuth",
    priority: 1, // High priority
    labelIds: ["label_bug", "label_auth"],
    assigneeId: "user_dev123"
  }
});
```

**Note**: Not all tools work in tools-only mode due to dynamic prop requirements.

#### MCP Auto-Connection Feature

Unlike other integration approaches, MCP can handle account connections automatically. When a tool is called but no account is connected, **Pipedream's MCP server automatically returns a Connect Link URL** in the tool response:

```typescript
// When a tool is called but no account is connected
const result = await session.callTool({
  name: "slack_send_message_to_channel",
  arguments: {
    instruction: "Send hello to #general"
  }
});

// If no Slack account is connected, the MCP server automatically returns:
// A Connect Link URL like:
// "https://pipedream.com/_static/connect.html?token=ctok_xxxxxxx&connectLink=true&app=slack"
```

This eliminates the need for upfront account management in MCP-based agents - users connect accounts on-demand when tools require them. The MCP server handles this automatically with no additional implementation required.

> **Source**: [Pipedream MCP Developer Docs](https://pipedream.com/docs/connect/mcp/developers)

#### App Discovery Mode

Enable dynamic app discovery for flexible agent behavior:

```typescript
// Enable app discovery to work with any available app
const transport = new StreamableHTTPClientTransport(
  new URL("https://remote.mcp.pipedream.net"),
  {
    requestInit: {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "x-pd-project-id": PIPEDREAM_PROJECT_ID,
        "x-pd-environment": PIPEDREAM_ENVIRONMENT,
        "x-pd-external-user-id": EXTERNAL_USER_ID,
        "x-pd-app-discovery": "true", // Enable app discovery
        "x-pd-tool-mode": "full-config"
      }
    }
  }
);

// Agent can now discover and use tools from any connected app
const availableTools = await session.listTools();

// Tools are dynamically loaded based on user's connected accounts
// Example discovered tools might include:
// - slack_send_message (if user has Slack connected)
// - github_create_issue (if user has GitHub connected) 
// - notion_create_page (if user has Notion connected)
```

### Account Connection Handling

Both action execution and MCP tool calling require proper account connections:

```typescript
// Check if user has required account connected
const accounts = await client.accounts.list({
  externalUserId: "user123",
  app: "github"
});

if (accounts.data.length === 0) {
  // Generate connect token for account connection
  const connectToken = await client.tokens.create({
    externalUserId: "user123",
    allowedOrigins: ["https://your-app.com"]
  });

  // Use Connect Link URL for account connection
  const connectUrl = connectToken.connectLinkUrl + "?app=github";

  // Or handle in frontend with connectAccount method
  return {
    error: "GitHub account required",
    connectUrl,
    connectToken: connectToken.token // For frontend connectAccount
  };
}

// Use the connected account's authProvisionId for actions
const authProvisionId = accounts.data[0].id;

// Execute action with connected account
const result = await client.actions.run({
  id: "github-create-issue",
  externalUserId: "user123",
  configuredProps: {
    github: { authProvisionId },
    repo: "owner/repo",
    title: "New Issue",
    body: "Created via API"
  }
});
```

This advanced implementation gives AI agents complete programmatic control over Pipedream's 10,000+ tools while handling the complexity of authentication, dynamic configuration, and real-time event processing.

## Supported AI Frameworks

Pipedream Connect integrates with popular AI frameworks:

- **OpenAI SDK**: GPT models and assistants
- **Anthropic SDK**: Claude models
- **Google Gemini SDK**: Gemini models  
- **Vercel AI SDK**: Multi-model support
- **LangChain**: Agent and tool integration
- **Custom frameworks**: REST API compatibility

## Pricing and Limits

- **Development**: Free to start and test
- **Production**: Usage-based pricing (see [pricing page](https://pipedream.com/pricing))
- **Connected Accounts**: Free up to 1,000 connected accounts
- **Rate Limits**:
  - API Proxy: 1,000 requests per 5 minutes per project
  - Actions/Triggers: Based on your plan's credit limits
- **Timeouts**:
  - API Proxy: 30-second maximum
  - Actions: Up to 5 minutes
  - Triggers: No timeout (event-driven)
- **Token Limits**: Connect tokens expire after 4 hours and are single-use

## Resources

### Documentation & Demos
- **Main Documentation**: [pipedream.com/docs/connect](https://pipedream.com/docs/connect)
- **API Reference**: [pipedream.com/docs/connect/api-reference](https://pipedream.com/docs/connect/api-reference)
- **SDK Playground**: Interactive demo at [pipedream.com/connect/demo](https://pipedream.com/connect/demo)
- **MCP Chat Demo**: [chat.pipedream.com](https://chat.pipedream.com)

### Code & Components
- **GitHub Repository**: [github.com/PipedreamHQ/pipedream](https://github.com/PipedreamHQ/pipedream)
- **TypeScript SDK**: [github.com/PipedreamHQ/pipedream-sdk-typescript](https://github.com/PipedreamHQ/pipedream-sdk-typescript)
- **Component Registry**: [github.com/PipedreamHQ/pipedream/tree/master/components](https://github.com/PipedreamHQ/pipedream/tree/master/components)

### Getting Started with CLI (Optional)
The Pipedream CLI can help bootstrap demo projects, but it's not required for implementation:

```bash
# Install CLI (optional)
brew install pipedreamhq/pd-cli/pipedream
# OR
curl https://cli.pipedream.com/install | sh

# Quick project setup
pd login
pd init connect  # Creates demo projects with working examples

# Available demo templates:
# - Next.js managed auth app
# - SDK Playground
# - MCP Chat App
```

The CLI is mainly useful for:
- Creating starter projects with working examples
- Exploring demo applications
- Local development setup

For production integrations, focus on the SDK documentation above.

## Conclusion

Pipedream Connect empowers AI agents with enterprise-grade API integrations while abstracting away the complexity of authentication, rate limiting, and credential management. Whether building autonomous agents, chatbots, or workflow automation systems, Connect provides the infrastructure needed to integrate with thousands of services securely and efficiently.