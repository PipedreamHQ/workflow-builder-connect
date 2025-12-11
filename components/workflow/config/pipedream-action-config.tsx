"use client";

import {
  ComponentFormContainer,
  SelectApp,
  SelectComponent,
  useApps,
  useComponents,
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
import { usePipedreamUserId } from "@/components/pipedream/use-pipedream-user-id";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { runPipedreamAction } from "@/lib/pipedream/server";

/**
 * Custom hook for debounced persistence that handles cleanup properly.
 * Uses refs to avoid stale closure issues and flushes on unmount.
 */
function useDebouncedPersist(
  persistFn: (props: ConfiguredProps) => void,
  delay: number
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPropsRef = useRef<ConfiguredProps | null>(null);
  const persistFnRef = useRef(persistFn);

  // Keep the persist function ref up to date
  useEffect(() => {
    persistFnRef.current = persistFn;
  }, [persistFn]);

  // Cleanup on unmount - flush any pending persist
  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (pendingPropsRef.current !== null) {
        persistFnRef.current(pendingPropsRef.current);
      }
    },
    []
  );

  const debouncedPersist = useCallback(
    (props: ConfiguredProps) => {
      pendingPropsRef.current = props;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (pendingPropsRef.current !== null) {
          persistFnRef.current(pendingPropsRef.current);
          pendingPropsRef.current = null;
        }
      }, delay);
    },
    [delay]
  );

  return debouncedPersist;
}

// Sort apps by featured weight descending (most popular first), only show apps with actions
const appsOptions: {
  sortKey: AppsListRequestSortKey;
  sortDirection: AppsListRequestSortDirection;
  hasActions: boolean;
} = {
  sortKey: "featured_weight",
  sortDirection: "desc",
  hasActions: true,
};

type PipedreamActionConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  onUpdateLabel?: (label: string) => void;
  onUpdateDescription?: (description: string) => void;
  disabled: boolean;
  nodeId?: string;
};

/**
 * Collects all keys from a ConfiguredProps object, handling Proxy objects.
 */
function collectPropKeys(
  props: ConfiguredProps,
  additionalNames: Set<string>
): Set<string> {
  const keys = new Set<string>();

  for (const name of Object.keys(props || {})) {
    keys.add(name);
  }
  for (const name of Object.getOwnPropertyNames(props || {})) {
    keys.add(name);
  }
  for (const name of additionalNames) {
    keys.add(name);
  }
  try {
    for (const key of Reflect.ownKeys(props || {})) {
      if (typeof key === "string") {
        keys.add(key);
      }
    }
  } catch {
    // ignore reflection errors
  }

  return keys;
}

/**
 * Serializes ConfiguredProps to a plain object, breaking any Proxy wrappers.
 */
function serializeProps(
  props: ConfiguredProps,
  propNames: Set<string>
): Record<string, unknown> {
  const serializable: Record<string, unknown> = {};
  const keys = collectPropKeys(props, propNames);

  for (const name of keys) {
    try {
      const value = (props as Record<string, unknown>)?.[name];
      if (value !== undefined) {
        serializable[name] = value;
      }
    } catch {
      // ignore individual property read failures
    }
  }

  // Break any Proxies before returning
  try {
    return JSON.parse(JSON.stringify(serializable));
  } catch {
    return { ...serializable };
  }
}

export function PipedreamActionConfig({
  config,
  onUpdateConfig,
  onUpdateLabel,
  onUpdateDescription,
  disabled,
  nodeId,
}: PipedreamActionConfigProps) {
  // Use shared hook for consistent externalUserId with PipedreamProvider
  // This ensures accounts connected via the frontend SDK can be used when running actions
  const externalUserId = usePipedreamUserId();

  // Selected app state
  const [selectedApp, setSelectedApp] = useState<App | undefined>(() => {
    const nameSlug = config?.pipedreamApp as string | undefined;
    if (!nameSlug) {
      return;
    }
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
  const [configuredProps, setConfiguredProps] = useState<ConfiguredProps>(
    () => {
      const stored = config?.pipedreamConfiguredProps;
      if (typeof stored === "string" && stored) {
        try {
          return JSON.parse(stored) as ConfiguredProps;
        } catch {
          return {};
        }
      }
      return (stored as ConfiguredProps) || {};
    }
  );

  // Track latest dynamic props so we can serialize values reliably
  const [latestDynamicProps, setLatestDynamicProps] = useState<
    DynamicProps | undefined
  >();
  const lastSavedPropsJson = useRef<string>("");
  const lastSavedComponentKey = useRef<string>("");

  // Track initial props to guard against ComponentFormContainer clobbering on mount
  const initialPropsCountRef = useRef<number>(
    Object.keys(configuredProps || {}).length
  );
  const hasReceivedUserInputRef = useRef(false);

  // Test execution state
  const [isTesting, setIsTesting] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Get action count for selected app
  const { components: actionsForApp } = useComponents({
    app: selectedApp?.nameSlug,
    componentType: "action",
  });
  const actionCount = actionsForApp?.length ?? 0;

  // Get loading state for apps list
  const { isLoading: isLoadingApps } = useApps(appsOptions);

  // Build a deterministic list of prop names (base + latest dynamic props)
  const serializedPropNames = useMemo(() => {
    const names = new Set<string>();
    for (const prop of selectedComponent?.configurableProps ?? []) {
      names.add(prop.name);
    }
    for (const prop of latestDynamicProps?.configurableProps ?? []) {
      names.add(prop.name);
    }
    return names;
  }, [selectedComponent?.configurableProps, latestDynamicProps]);

  // Persist configured props to workflow state
  const persistConfiguredProps = useCallback(
    (props: ConfiguredProps) => {
      if (!selectedComponent?.key) {
        return;
      }

      // Avoid clobbering previously saved props with an empty payload emitted
      // before the form finishes hydrating
      if (
        lastSavedPropsJson.current &&
        lastSavedPropsJson.current !== "{}" &&
        Object.keys(props || {}).length === 0
      ) {
        return;
      }

      const plainProps = serializeProps(props, serializedPropNames);
      const json = JSON.stringify(plainProps);

      const shouldUpdateProps = json !== lastSavedPropsJson.current;
      const shouldUpdateKey =
        selectedComponent.key !== lastSavedComponentKey.current;

      if (shouldUpdateProps) {
        lastSavedPropsJson.current = json;
        onUpdateConfig("pipedreamConfiguredProps", json);
        // Also save the external user ID that owns these props
        if (externalUserId && externalUserId !== "anonymous") {
          onUpdateConfig("pipedreamExternalUserId", externalUserId);
        }
      }

      if (shouldUpdateKey) {
        lastSavedComponentKey.current = selectedComponent.key;
        onUpdateConfig("pipedreamComponentKey", selectedComponent.key);
      }
    },
    [
      externalUserId,
      onUpdateConfig,
      selectedComponent?.key,
      serializedPropNames,
    ]
  );

  // Debounced persist to reduce lag when typing - uses custom hook for proper cleanup
  const debouncedPersist = useDebouncedPersist(persistConfiguredProps, 300);

  // Handle props update from ComponentFormContainer
  const handleConfiguredPropsUpdate = useCallback(
    (props: ConfiguredProps) => {
      const incomingCount = Object.keys(props || {}).length;

      // Guard against ComponentFormContainer emitting empty/reduced props on mount
      // which would clobber our saved props. Only accept if:
      // 1. We've already received user input (not initial hydration)
      // 2. OR incoming props have at least as many keys as we started with
      // 3. OR we had no initial props
      if (
        !hasReceivedUserInputRef.current &&
        initialPropsCountRef.current > 0 &&
        incomingCount < initialPropsCountRef.current
      ) {
        // This is likely the form's initial empty emission - ignore it
        return;
      }

      // Mark that we've received real input after this point
      if (incomingCount >= initialPropsCountRef.current) {
        hasReceivedUserInputRef.current = true;
      }

      setConfiguredProps(props);
      debouncedPersist(props);
    },
    [debouncedPersist]
  );

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
      persistConfiguredProps({});

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
    [
      onUpdateConfig,
      onUpdateLabel,
      onUpdateDescription,
      selectedApp?.name,
      config?.pipedreamAppName,
      persistConfiguredProps,
    ]
  );

  // Handle test execution
  const handleTest = useCallback(async () => {
    if (!selectedComponent?.key) {
      toast.error("Please select an action first");
      return;
    }

    setIsTesting(true);
    try {
      // Serialize configuredProps to break any Proxy wrappers from the Pipedream SDK
      // This ensures the data can be serialized across the server/client boundary
      const serializedProps = serializeProps(
        configuredProps,
        serializedPropNames
      );

      console.log("[Pipedream Test] Running with props:", {
        componentKey: selectedComponent.key,
        externalUserId,
        propsKeys: Object.keys(serializedProps),
      });

      const result = await runPipedreamAction({
        externalUserId,
        componentKey: selectedComponent.key,
        configuredProps: serializedProps,
      });
      toast.success("Test successful!", {
        description: "Action executed successfully",
      });
      console.log("Pipedream action result:", result);
    } catch (error) {
      console.error("[Pipedream Test] Error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error("Test failed", {
        description: message,
      });
    } finally {
      setIsTesting(false);
    }
  }, [
    selectedComponent?.key,
    configuredProps,
    externalUserId,
    serializedPropNames,
  ]);

  // Sync values from config whenever they change (handles node switches and refresh)
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Controlled hydration for Pipedream state
  useEffect(() => {
    const nameSlug = config?.pipedreamApp as string | undefined;
    const key = config?.pipedreamComponentKey as string | undefined;
    const storedProps = config?.pipedreamConfiguredProps;

    if (nameSlug && (!selectedApp || selectedApp.nameSlug !== nameSlug)) {
      setSelectedApp({
        nameSlug,
        name: (config?.pipedreamAppName as string) || nameSlug,
        imgSrc: (config?.pipedreamAppLogo as string) || "",
        categories: [],
        featuredWeight: 0,
      } as App);
    }
    if (key && (!selectedComponent || selectedComponent.key !== key)) {
      setSelectedComponent({
        key,
        name: (config?.pipedreamComponentName as string) || key,
      } as Component);
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
  }, [
    config?.pipedreamApp,
    config?.pipedreamAppLogo,
    config?.pipedreamAppName,
    config?.pipedreamComponentKey,
    config?.pipedreamComponentName,
    config?.pipedreamConfiguredProps,
    selectedApp,
    selectedComponent,
  ]);

  return (
    <div className="pipedream-config space-y-4" ref={containerRef}>
      {/* App Selection */}
      <div className="space-y-2">
        <Label className="ml-1 flex items-center gap-2">
          Select app <span className="text-muted-foreground">(3,000+)</span>
          {isLoadingApps && (
            <Loader2 className="size-3 animate-spin text-muted-foreground" />
          )}
        </Label>
        <SelectApp
          appsOptions={appsOptions}
          onChange={handleAppChange}
          value={selectedApp}
        />
      </div>

      {/* Action Selection */}
      {selectedApp && (
        <div className="space-y-2">
          <Label className="ml-1">
            Select action{" "}
            {actionCount > 0 && (
              <span className="text-muted-foreground">({actionCount})</span>
            )}
          </Label>
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
              key={`${nodeId}-${selectedComponent.key}`}
              onUpdateConfiguredProps={handleConfiguredPropsUpdate}
              onUpdateDynamicProps={setLatestDynamicProps}
            />
          </div>
          {/* Test Button */}
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={disabled || isTesting}
            onClick={handleTest}
            type="button"
            variant="default"
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
