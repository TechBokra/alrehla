import tseslint from "typescript-eslint";

const sourceFiles = ["**/*.{js,mjs,cjs,ts,tsx}"];

const architectureRules = {
  "no-restricted-imports": [
    "error",
    {
      paths: [
        {
          name: "@eng-mohamedelsayed/admin-ui/components/resource",
          importNames: [
            "ResourceDefinition",
            "ResourceContextValue",
            "ResourceExecutionContext",
            "ResourceExecutionContextProvider",
            "ResourceFormDefinition",
            "ResourceMutationDefinition",
            "ResourceMutationsDefinition",
            "ResourceQueryDefinition",
            "ResourceRegisteredFieldName",
            "defineResource",
            "useResourceMutations",
            "useResourceQuery",
          ],
          message:
            "Resource contracts and headless behavior belong to @eng-mohamedelsayed/admin-core/resource. Keep visual Resource components in @eng-mohamedelsayed/admin-ui/components/resource.",
        },
      ],
    },
  ],
};

/** Rules shared by package and application ESLint entrypoints. */
export const sharedArchitectureRules = architectureRules;

/** Rules for app/service boundaries that are not applicable to infrastructure packages. */
export const appArchitectureRules = {
  ...architectureRules,
  "no-restricted-imports": [
    "error",
    {
      paths: [
        ...architectureRules["no-restricted-imports"][1].paths,
        {
          name: "cloudinary",
          message:
            "Apps and services must use @e-commerce/cloudinary. The raw Cloudinary SDK belongs in the cloudinary infrastructure package.",
        },
      ],
    },
  ],
};

/**
 * Admin Dashboard may consume the form engine and low-level primitives only
 * through the project-owned Admin Forms and Admin UI packages. Infrastructure packages remain free
 * to import those implementation details directly.
 */
export const adminDashboardArchitectureRules = {
  ...appArchitectureRules,
  "no-restricted-imports": [
    "error",
    {
      paths: [
        ...appArchitectureRules["no-restricted-imports"][1].paths,
        {
          name: "@tanstack/react-form",
          message:
            "Admin forms must use CoreForm and the form-aware fields from @eng-mohamedelsayed/admin-forms.",
        },
        {
          name: "react-hook-form",
          message:
            "Admin forms must use CoreForm and the form-aware fields from @eng-mohamedelsayed/admin-forms.",
        },
        {
          name: "@hookform/resolvers",
          message:
            "Admin forms must use CoreForm validators; resolver packages are owned by @eng-mohamedelsayed/admin-forms when needed.",
        },
      ],
      patterns: [
        {
          group: ["@radix-ui/*", "@base-ui/*"],
          message:
            "Use the project-owned primitives from @eng-mohamedelsayed/admin-ui instead of importing Radix/Base UI directly.",
        },
      ],
    },
  ],
};

/** Marketplace must consume Medusa through the shared API-client boundary. */
export const marketplaceArchitectureRules = {
  ...appArchitectureRules,
  "no-restricted-imports": [
    "error",
    {
      paths: [
        ...appArchitectureRules["no-restricted-imports"][1].paths,
        {
          name: "@medusajs/js-sdk",
          message:
            "Marketplace code must use @eng-mohamedelsayed/api-client. The raw Medusa SDK belongs in the shared API-client package.",
        },
        {
          name: "pg",
          message:
            "Marketplace code must not access PostgreSQL directly. Use the shared API/API-client boundary.",
        },
        {
          name: "postgres",
          message:
            "Marketplace code must not access PostgreSQL directly. Use the shared API/API-client boundary.",
        },
        {
          name: "@neondatabase/serverless",
          message:
            "Marketplace code must not access PostgreSQL directly. Use the shared API/API-client boundary.",
        },
        {
          name: "@prisma/client",
          message:
            "Marketplace code must not access PostgreSQL directly. Use the shared API/API-client boundary.",
        },
      ],
    },
  ],
};

/** App-facing architecture-only config; Next apps add their own framework rules. */
export const sharedArchitectureConfig = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/generated/**",
    ],
  },
  {
    files: sourceFiles,
    rules: sharedArchitectureRules,
  },
];

/** Baseline config for shared packages: real parsing and architecture boundaries. */
export const sharedEslintConfig = [
  ...sharedArchitectureConfig,
  tseslint.configs.base,
];

export default sharedEslintConfig;
