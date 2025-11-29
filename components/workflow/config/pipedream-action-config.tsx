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
  DynamicProps,
} from "@pipedream/sdk";
import { Loader2, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  onUpdateLabel?: (label: string) => void;
  onUpdateDescription?: (description: string) => void;
  disabled: boolean;
};

export function PipedreamActionConfig({
  config,
  onUpdateConfig,
  onUpdateLabel,
  onUpdateDescription,
  disabled,
}: PipedreamActionConfigProps) {
  const { data: session } = useSession();
  const externalUserId = session?.user?.id || "anonymous";

  // Selected app state
  const [selectedApp, setSelectedApp] = useState<App | undefined>(() => {
    const nameSlug = config?.pipedreamApp as string | undefined;
    if (!nameSlug) return undefined;
    return {
      nameSlug,
      name: (config?.pipedreamAppName as string) || nameSlug,
      imgSrc: (config?.pipedreamAppLogo as string) || "",
      categories: [],
      featuredWeight: 0,
    } as App;
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

  // Track latest dynamic props so we can serialize values reliably
  const [latestDynamicProps, setLatestDynamicProps] = useState<
    DynamicProps | undefined
  >();
  const lastSavedPropsJson = useRef<string>("");
  const lastSavedComponentKey = useRef<string>("");

  // Test execution state
  const [isTesting, setIsTesting] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Handle app selection
  const handleAppChange = useCallback(
    (app?: App) => {
      setSelectedApp(app);
      // Reset component and props when app changes
      setSelectedComponent(undefined);
      setConfiguredProps({});

      // Sync to workflow state (stringify objects for storage)
      onUpdateConfig("pipedreamApp", app?.nameSlug || "");
      onUpdateConfig("pipedreamAppName", app?.name || app?.nameSlug || "");
      onUpdateConfig("pipedreamAppLogo", app?.imgSrc || "");
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

      // Update node label to action name and description to app name
      const appName = selectedApp?.name || (config?.pipedreamAppName as string);
      if (component?.name && onUpdateLabel) {
        onUpdateLabel(component.name);
      }
      if (appName && onUpdateDescription) {
        onUpdateDescription(appName);
      }
    },
    [onUpdateConfig, onUpdateLabel, onUpdateDescription, selectedApp?.name, config?.pipedreamAppName]
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

  // Build a deterministic list of prop names (base + latest dynamic props)
  const serializedPropNames = useMemo(() => {
    const names = new Set<string>();
    selectedComponent?.configurableProps?.forEach((prop) =>
      names.add(prop.name)
    );
    latestDynamicProps?.configurableProps?.forEach((prop) =>
      names.add(prop.name)
    );
    return names;
  }, [selectedComponent?.configurableProps, latestDynamicProps]);

  // Persist configured props when they change (one-way sync to store)
  useEffect(() => {
    if (!selectedComponent?.key) return;

    const props = configuredProps || {};
    const serializable: Record<string, unknown> = {};

    // Collect every key we can discover
    const keyCandidates = new Set<string>();
    Object.keys(props || {}).forEach((name) => keyCandidates.add(name));
    Object.getOwnPropertyNames(props || {}).forEach((name) =>
      keyCandidates.add(name)
    );
    serializedPropNames.forEach((name) => keyCandidates.add(name));
    try {
      Reflect.ownKeys(props || {}).forEach((key) => {
        if (typeof key === "string") keyCandidates.add(key);
      });
    } catch {
      // ignore
    }

    // Pull values by key
    for (const name of keyCandidates) {
      try {
        const value = (props as any)?.[name];
        if (value !== undefined) {
          serializable[name] = value;
        }
      } catch {
        // ignore individual property read failures
      }
    }

    // Break any Proxies before persisting to workflow JSON
    let plainProps: Record<string, unknown> = serializable;
    try {
      plainProps = JSON.parse(JSON.stringify(serializable));
    } catch {
      plainProps = { ...serializable };
    }

    const json = JSON.stringify(plainProps);

    const shouldUpdateProps = json !== lastSavedPropsJson.current;
    const shouldUpdateKey =
      selectedComponent.key !== lastSavedComponentKey.current;

    if (shouldUpdateProps) {
      lastSavedPropsJson.current = json;
      onUpdateConfig("pipedreamConfiguredProps", json);
    }

    if (shouldUpdateKey) {
      lastSavedComponentKey.current = selectedComponent.key;
      onUpdateConfig("pipedreamComponentKey", selectedComponent.key);
    }
  }, [
    configuredProps,
    onUpdateConfig,
    selectedComponent?.key,
    serializedPropNames,
  ]);

  // Sync initial values from config on mount
  useEffect(() => {
    const nameSlug = config?.pipedreamApp as string | undefined;
    const key = config?.pipedreamComponentKey as string | undefined;
    const storedProps = config?.pipedreamConfiguredProps;

    if (nameSlug && !selectedApp) {
      setSelectedApp({
        nameSlug,
        name: (config?.pipedreamAppName as string) || nameSlug,
        imgSrc: (config?.pipedreamAppLogo as string) || "",
        categories: [],
        featuredWeight: 0,
      } as App);
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
    <div className="pipedream-config space-y-4" ref={containerRef}>

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
              key={selectedComponent.key}
              componentKey={selectedComponent.key}
              configuredProps={configuredProps}
              externalUserId={externalUserId}
              hideOptionalProps={false}
              onUpdateConfiguredProps={setConfiguredProps}
              onUpdateDynamicProps={setLatestDynamicProps}
            />
          </div>
          {/* Test Button */}
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={disabled || isTesting}
            onClick={handleTest}
            variant="default"
            type="button"
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
