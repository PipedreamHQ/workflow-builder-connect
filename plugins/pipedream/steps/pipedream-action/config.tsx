"use client";

import { PipedreamActionConfig } from "@/components/workflow/config/pipedream-action-config";

/**
 * Pipedream Action Config Fields
 * Wrapper component that re-exports the existing PipedreamActionConfig
 * to fit the plugin architecture pattern
 */
export function PipedreamActionConfigFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
}) {
  return (
    <PipedreamActionConfig
      config={config}
      onUpdateConfig={(key, value) => onUpdateConfig(key, value)}
      disabled={disabled ?? false}
    />
  );
}
