"use client";

import {
  ComponentFormContainer,
  SelectApp,
  SelectComponent,
} from "@pipedream/connect-react";
import type {
  App,
  AppsListRequestSortDirection,
  AppsListRequestSortKey,
  Component,
  ConfiguredProps,
} from "@pipedream/sdk";
import { Loader2, Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/auth-client";
import { runPipedreamAction } from "@/lib/pipedream/server";

// Sort apps by featured weight descending (most popular first)
const appsOptions: {
  sortKey: AppsListRequestSortKey;
  sortDirection: AppsListRequestSortDirection;
} = {
  sortKey: "featured_weight",
  sortDirection: "desc",
};

type PipedreamActionConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
};

export function PipedreamActionConfig({
  config,
  onUpdateConfig,
  disabled,
}: PipedreamActionConfigProps) {
  const { data: session } = useSession();
  const externalUserId = session?.user?.id || "anonymous";

  // Selected app state
  const [selectedApp, setSelectedApp] = useState<App | undefined>(() => {
    const nameSlug = config?.pipedreamApp as string | undefined;
    return nameSlug ? ({ nameSlug } as App) : undefined;
  });

  // Selected component state
  const [selectedComponent, setSelectedComponent] = useState<
    Component | undefined
  >(() => {
    const key = config?.pipedreamComponentKey as string | undefined;
    return key ? ({ key } as Component) : undefined;
  });

  // Configured props state (parse from JSON string if stored)
  const [configuredProps, setConfiguredProps] = useState<ConfiguredProps>(() => {
    const stored = config?.pipedreamConfiguredProps;
    if (typeof stored === "string" && stored) {
      try {
        return JSON.parse(stored) as ConfiguredProps;
      } catch {
        return {};
      }
    }
    return (stored as ConfiguredProps) || {};
  });

  // Test execution state
  const [isTesting, setIsTesting] = useState(false);

  // Handle app selection
  const handleAppChange = useCallback(
    (app?: App) => {
      setSelectedApp(app);
      // Reset component and props when app changes
      setSelectedComponent(undefined);
      setConfiguredProps({});

      // Sync to workflow state (stringify objects for storage)
      onUpdateConfig("pipedreamApp", app?.nameSlug || "");
      onUpdateConfig("pipedreamComponentKey", "");
      onUpdateConfig("pipedreamConfiguredProps", JSON.stringify({}));
    },
    [onUpdateConfig]
  );

  // Handle component selection
  const handleComponentChange = useCallback(
    (component?: Component) => {
      setSelectedComponent(component);
      // Reset props when component changes
      setConfiguredProps({});

      // Sync to workflow state
      onUpdateConfig("pipedreamComponentKey", component?.key || "");
      onUpdateConfig("pipedreamConfiguredProps", JSON.stringify({}));

      // Update label and description from selected component
      if (component?.name) {
        onUpdateConfig("label", component.name);
      }
      if (component?.description) {
        onUpdateConfig("description", component.description);
      }
    },
    [onUpdateConfig]
  );

  // Handle test execution
  const handleTest = useCallback(async () => {
    if (!selectedComponent?.key) {
      toast.error("Please select an action first");
      return;
    }

    setIsTesting(true);
    try {
      const result = await runPipedreamAction({
        externalUserId,
        componentKey: selectedComponent.key,
        configuredProps,
      });
      toast.success("Test successful!", {
        description: "Action executed successfully",
      });
      console.log("Pipedream action result:", result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error("Test failed", {
        description: message,
      });
    } finally {
      setIsTesting(false);
    }
  }, [selectedComponent?.key, configuredProps, externalUserId]);

  // Handle configured props update
  const handleConfiguredPropsChange = useCallback(
    (props: ConfiguredProps) => {
      setConfiguredProps(props);
      onUpdateConfig("pipedreamConfiguredProps", JSON.stringify(props));
    },
    [onUpdateConfig]
  );

  // Sync initial values from config on mount
  useEffect(() => {
    const nameSlug = config?.pipedreamApp as string | undefined;
    const key = config?.pipedreamComponentKey as string | undefined;
    const storedProps = config?.pipedreamConfiguredProps;

    if (nameSlug && !selectedApp) {
      setSelectedApp({ nameSlug } as App);
    }
    if (key && !selectedComponent) {
      setSelectedComponent({ key } as Component);
    }
    if (storedProps) {
      const props =
        typeof storedProps === "string"
          ? (JSON.parse(storedProps) as ConfiguredProps)
          : (storedProps as ConfiguredProps);
      if (Object.keys(props).length > 0) {
        setConfiguredProps(props);
      }
    }
  }, []);

  return (
    <div className="pipedream-config space-y-4">

      {/* App Selection */}
      <div className="space-y-2">
        <Label className="ml-1">Select App</Label>
        <SelectApp
          appsOptions={appsOptions}
          onChange={handleAppChange}
          value={selectedApp}
        />
      </div>

      {/* Action Selection */}
      {selectedApp && (
        <div className="space-y-2">
          <Label className="ml-1">Select Action</Label>
          <SelectComponent
            app={selectedApp}
            componentType="action"
            onChange={handleComponentChange}
            value={selectedComponent}
          />
        </div>
      )}

      {/* Configuration Form */}
      {selectedComponent && (
        <div className="space-y-2">
          <Label className="ml-1">Configure Action</Label>
          <div className="rounded-lg border bg-card p-4">
            <ComponentFormContainer
              componentKey={selectedComponent.key}
              configuredProps={configuredProps}
              externalUserId={externalUserId}
              hideOptionalProps={false}
              onUpdateConfiguredProps={handleConfiguredPropsChange}
            />
          </div>
          {/* Test Button */}
          <Button
            className="w-full"
            disabled={disabled || isTesting}
            onClick={handleTest}
            variant="secondary"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="mr-2 size-4" />
                Test
              </>
            )}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!selectedApp && (
        <p className="py-4 text-center text-muted-foreground text-sm">
          Select an app to browse available actions
        </p>
      )}
    </div>
  );
}
