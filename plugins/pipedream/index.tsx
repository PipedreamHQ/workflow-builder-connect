import { Zap } from "lucide-react";
import type { IntegrationPlugin } from "../registry";
import { registerIntegration } from "../registry";
import { pipedreamActionCodegenTemplate } from "./codegen/pipedream-action";
import { PipedreamIcon } from "./icon";
import { PipedreamSettings } from "./settings";
import { PipedreamActionConfigFields } from "./steps/pipedream-action/config";

const pipedreamPlugin: IntegrationPlugin = {
  type: "pipedream",
  label: "Pipedream",
  description: "Connect to 3,000+ apps with Pipedream",

  icon: {
    type: "svg",
    value: "PipedreamIcon",
    svgComponent: PipedreamIcon,
  },

  settingsComponent: PipedreamSettings,

  // Empty - credentials are in environment variables, not per-user database storage
  formFields: [],

  // Returns empty object - no credential mapping needed
  credentialMapping: () => ({}),

  // Test function checks if Pipedream is configured via env vars
  testConfig: {
    getTestFunction: async () => {
      const { testPipedream } = await import("./test");
      return testPipedream;
    },
  },

  // Single meta-action that covers all 3,000+ Pipedream apps
  actions: [
    {
      id: "Pipedream Action",
      label: "Pipedream Action",
      description: "Execute any of 3,000+ Pipedream app actions",
      category: "Pipedream",
      icon: Zap,
      stepFunction: "pipedreamActionStep",
      stepImportPath: "pipedream-action",
      configFields: PipedreamActionConfigFields,
      codegenTemplate: pipedreamActionCodegenTemplate,
    },
  ],
};

// Auto-register on import
registerIntegration(pipedreamPlugin);

export default pipedreamPlugin;
