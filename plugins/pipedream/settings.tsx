"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function PipedreamSettings({
  apiKey: _apiKey,
  hasKey: _hasKey,
  onApiKeyChange: _onApiKeyChange,
}: {
  apiKey: string;
  hasKey?: boolean;
  onApiKeyChange: (key: string) => void;
  showCard?: boolean;
  config?: Record<string, string>;
  onConfigChange?: (key: string, value: string) => void;
}) {
  const [status, setStatus] = useState<"loading" | "enabled" | "disabled">(
    "loading"
  );

  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch("/api/pipedream/status");
        const data = await response.json();
        setStatus(data.enabled ? "enabled" : "disabled");
      } catch {
        setStatus("disabled");
      }
    }
    checkStatus();
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking Pipedream status...</span>
      </div>
    );
  }

  if (status === "enabled") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">Pipedream is enabled</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Access 3,000+ app integrations. Users connect their accounts when
          configuring Pipedream actions in workflows.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <XCircle className="h-5 w-5" />
        <span className="font-medium">Pipedream is not configured</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Administrator must set PIPEDREAM_CLIENT_ID, PIPEDREAM_CLIENT_SECRET, and
        PIPEDREAM_PROJECT_ID environment variables.
      </p>
    </div>
  );
}
