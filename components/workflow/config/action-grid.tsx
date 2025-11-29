"use client";

import { useApps } from "@pipedream/connect-react";
import type { App } from "@pipedream/sdk";
import {
  ChevronDown,
  ChevronRight,
  Database,
  Flame,
  Loader2,
  Mail,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  Ticket,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { IntegrationIcon } from "@/components/ui/integration-icon";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const InlineSwitch = ({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    aria-pressed={checked}
    className={cn(
      "relative inline-flex h-4.5 w-8 items-center rounded-full border transition-colors",
      checked
        ? "border-muted-foreground/40 bg-muted-foreground/15"
        : "border-input bg-muted",
      disabled && "cursor-not-allowed opacity-60"
    )}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    type="button"
  >
    <span
      className={cn(
        "inline-block size-3.5 translate-x-[2px] rounded-full bg-card shadow transition-transform",
        checked && "translate-x-[14px] bg-muted-foreground"
      )}
    />
  </button>
);

type ActionFilterMode = "all" | "vercel";

type ActionType = {
  id: string;
  label: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  integration?:
    | "linear"
    | "resend"
    | "slack"
    | "vercel"
    | "firecrawl"
    | "pipedream";
};

// Built-in Vercel actions
const vercelActions: ActionType[] = [
  {
    id: "HTTP Request",
    label: "HTTP Request",
    description: "Make an HTTP request to any API",
    category: "System",
    icon: Zap,
  },
  {
    id: "Database Query",
    label: "Database Query",
    description: "Query your database",
    category: "System",
    icon: Database,
  },
  {
    id: "Condition",
    label: "Condition",
    description: "Branch based on a condition",
    category: "System",
    icon: Settings,
  },
  {
    id: "Send Email",
    label: "Send Email",
    description: "Send an email via Resend",
    category: "Resend",
    icon: Mail,
    integration: "resend",
  },
  {
    id: "Send Slack Message",
    label: "Send Slack Message",
    description: "Post a message to Slack",
    category: "Slack",
    icon: MessageSquare,
    integration: "slack",
  },
  {
    id: "Create Ticket",
    label: "Create Ticket",
    description: "Create a Linear ticket",
    category: "Linear",
    icon: Ticket,
    integration: "linear",
  },
  {
    id: "Find Issues",
    label: "Find Issues",
    description: "Search Linear issues",
    category: "Linear",
    icon: Ticket,
    integration: "linear",
  },
  {
    id: "Generate Text",
    label: "Generate Text",
    description: "Generate text with AI",
    category: "AI Gateway",
    icon: Sparkles,
    integration: "vercel",
  },
  {
    id: "Generate Image",
    label: "Generate Image",
    description: "Generate images with AI",
    category: "AI Gateway",
    icon: Sparkles,
    integration: "vercel",
  },
  {
    id: "Scrape",
    label: "Scrape URL",
    description: "Scrape content from a URL",
    category: "Firecrawl",
    icon: Flame,
    integration: "firecrawl",
  },
  {
    id: "Search",
    label: "Search Web",
    description: "Search the web with Firecrawl",
    category: "Firecrawl",
    icon: Search,
    integration: "firecrawl",
  },
];

type ActionGridProps = {
  onSelectAction: (actionType: string) => void;
  onSelectPipedreamApp?: (app: App) => void;
  disabled?: boolean;
};

export function ActionGrid({
  onSelectAction,
  onSelectPipedreamApp,
  disabled,
}: ActionGridProps) {
  const [filter, setFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [actionFilterMode, setActionFilterMode] =
    useState<ActionFilterMode>("all"); // default include all
  const [vercelExpanded, setVercelExpanded] = useState(true);
  const [pipedreamExpanded, setPipedreamExpanded] = useState(true);

  // Debounce the filter for Pipedream API search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(filter);
    }, 300);
    return () => clearTimeout(timer);
  }, [filter]);

  // Search Pipedream apps - sorted by featured_weight descending (most popular first)
  const {
    apps: pipedreamApps,
    isLoading: isPipedreamLoading,
    hasMore,
    loadMore,
    isLoadingMore,
  } = useApps(
    debouncedFilter.length >= 2
      ? { q: debouncedFilter, sortKey: "featured_weight", sortDirection: "desc" }
      : { sortKey: "featured_weight", sortDirection: "desc" }
  );

  const filterActions = useCallback(
    (actions: ActionType[]) =>
      actions.filter((action) => {
        const searchTerm = filter.toLowerCase();
        return (
          action.label.toLowerCase().includes(searchTerm) ||
          action.description.toLowerCase().includes(searchTerm) ||
          action.category.toLowerCase().includes(searchTerm)
        );
      }),
    [filter]
  );

  const filteredVercelActions = filterActions(vercelActions);
  const hasVercelResults = filteredVercelActions.length > 0;
  const hasPipedreamResults = pipedreamApps.length > 0;
  const hasResults =
    (actionFilterMode === "vercel" && hasVercelResults) ||
    (actionFilterMode === "all" &&
      (hasVercelResults || hasPipedreamResults || isPipedreamLoading));

  const renderActionButton = (action: ActionType) => (
    <button
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary hover:bg-accent",
        disabled && "pointer-events-none opacity-50"
      )}
      disabled={disabled}
      key={action.id}
      onClick={() => onSelectAction(action.id)}
      type="button"
    >
      {action.integration ? (
        <IntegrationIcon className="size-8" integration={action.integration} />
      ) : (
        <action.icon className="size-8" />
      )}
      <p className="text-center font-medium text-sm">{action.label}</p>
    </button>
  );

  const renderPipedreamAppButton = (app: App) => {
    return (
      <button
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary hover:bg-accent",
          disabled && "pointer-events-none opacity-50"
        )}
        disabled={disabled}
        key={app.nameSlug}
        onClick={() => {
          if (onSelectPipedreamApp) {
            onSelectPipedreamApp(app);
          } else {
            // Fall back to selecting "Pipedream Action" type
            onSelectAction("Pipedream Action");
          }
        }}
        type="button"
      >
        <img
          alt={app.name}
          className="size-8 rounded"
          src={`https://pipedream.com/s.v0/${app.id}/logo/48`}
          onError={(e) => {
            // Fallback to Pipedream icon on error
            e.currentTarget.style.display = "none";
          }}
        />
        <p className="line-clamp-2 text-center font-medium text-sm">
          {app.name}
        </p>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Label className="ml-1 font-semibold" htmlFor="action-filter">
            Search Actions
          </Label>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <InlineSwitch
              aria-label="Include Pipedream actions"
              checked={actionFilterMode === "all"}
              onChange={(checked) =>
                setActionFilterMode(checked ? "all" : "vercel")
              }
              disabled={disabled}
            />
            <span>Include <a href="https://pipedream.com/connect" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Pipedream</a> actions</span>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            disabled={disabled}
            id="action-filter"
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search actions..."
            value={filter}
          />
        </div>
      </div>


      {/* Vercel Actions Section - Expandable */}
      {hasVercelResults && (
        <div className="space-y-2">
          <button
            className="flex w-full items-center gap-1 text-left"
            onClick={() => setVercelExpanded(!vercelExpanded)}
            type="button"
          >
            {vercelExpanded ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
            <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Vercel Actions ({filteredVercelActions.length})
            </h3>
          </button>
          {vercelExpanded && (
            <div className="grid grid-cols-2 gap-2">
              {filteredVercelActions.map(renderActionButton)}
            </div>
          )}
        </div>
      )}

      {/* Pipedream Apps Section - Expandable */}
      {actionFilterMode === "all" && (
        <div className="space-y-2">
          <button
            className="flex w-full items-center gap-1 text-left"
            onClick={() => setPipedreamExpanded(!pipedreamExpanded)}
            type="button"
          >
            {pipedreamExpanded ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
            <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Pipedream Apps (3,000+)
            </h3>
            {isPipedreamLoading && (
              <Loader2 className="ml-1 size-3 animate-spin text-muted-foreground" />
            )}
          </button>
          {pipedreamExpanded && (
            <>
              {hasPipedreamResults ? (
                <div className="grid grid-cols-2 gap-2">
                  {pipedreamApps.map(renderPipedreamAppButton)}
                </div>
              ) : isPipedreamLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <button
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary hover:bg-accent",
                    disabled && "pointer-events-none opacity-50"
                  )}
                  disabled={disabled}
                  onClick={() => onSelectAction("Pipedream Action")}
                  type="button"
                >
                  <IntegrationIcon className="size-8" integration="pipedream" />
                  <p className="text-center font-medium text-sm">
                    Browse All Apps
                  </p>
                </button>
              )}
              {hasMore && hasPipedreamResults && (
                <button
                  className="w-full rounded-lg border bg-card p-2 text-muted-foreground text-sm transition-colors hover:bg-accent"
                  disabled={isLoadingMore}
                  onClick={() => loadMore()}
                  type="button"
                >
                  {isLoadingMore ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading more...
                    </span>
                  ) : (
                    "Load more apps"
                  )}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {!hasResults && !isPipedreamLoading && (
        <p className="py-8 text-center text-muted-foreground text-sm">
          No actions found
        </p>
      )}
    </div>
  );
}
