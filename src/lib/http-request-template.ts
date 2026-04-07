import type { GenericHttpRequestTemplate } from "@/src/types/context-layer";

const EXACT_TEMPLATE = /^\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}$/;
const TEMPLATE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

export interface HttpTemplateValidationIssue {
  path: Array<string | number>;
  message: string;
}

type TemplateStringMode = "path" | "exact";

const hasTemplateDelimiters = (value: string) =>
  value.includes("{{") || value.includes("}}");

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const collectTemplateValueIssues = (
  value: unknown,
  mode: TemplateStringMode,
  path: Array<string | number>,
  issues: HttpTemplateValidationIssue[],
) => {
  if (typeof value === "string") {
    if (!hasTemplateDelimiters(value)) {
      return;
    }

    if (mode === "path") {
      const unsupported = value.replace(TEMPLATE, "");
      if (!hasTemplateDelimiters(unsupported)) {
        return;
      }

      issues.push({
        path,
        message: "Request paths may only use complete `{{variable}}` placeholders.",
      });
      return;
    }

    if (extractExactTemplateVariable(value)) {
      return;
    }

    issues.push({
      path,
      message:
        "Only whole-value `{{variable}}` placeholders are allowed outside request paths.",
    });
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      collectTemplateValueIssues(entry, mode, [...path, index], issues);
    });
    return;
  }

  if (isObject(value)) {
    Object.entries(value).forEach(([key, entry]) => {
      collectTemplateValueIssues(entry, mode, [...path, key], issues);
    });
  }
};

const collectTemplateValueVariables = (
  value: unknown,
  mode: TemplateStringMode,
  variables: Set<string>,
) => {
  if (typeof value === "string") {
    if (mode === "path") {
      for (const match of value.matchAll(TEMPLATE)) {
        const variable = match[1]?.trim();
        if (variable) {
          variables.add(variable);
        }
      }
      return;
    }

    const variable = extractExactTemplateVariable(value);
    if (variable) {
      variables.add(variable);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectTemplateValueVariables(entry, mode, variables));
    return;
  }

  if (isObject(value)) {
    Object.values(value).forEach((entry) => collectTemplateValueVariables(entry, mode, variables));
  }
};

export const extractExactTemplateVariable = (value: string) => value.match(EXACT_TEMPLATE)?.[1]?.trim();

export const replacePathTemplateVariables = (
  value: string,
  replacer: (variable: string) => string,
) => value.replace(TEMPLATE, (_, variable: string) => replacer(variable));

export const collectHttpTemplateValidationIssues = (
  requestTemplate?: GenericHttpRequestTemplate,
): HttpTemplateValidationIssue[] => {
  if (!requestTemplate) {
    return [];
  }

  const issues: HttpTemplateValidationIssue[] = [];
  collectTemplateValueIssues(requestTemplate.path, "path", ["path"], issues);
  collectTemplateValueIssues(requestTemplate.query, "exact", ["query"], issues);
  collectTemplateValueIssues(requestTemplate.headers, "exact", ["headers"], issues);
  collectTemplateValueIssues(requestTemplate.body, "exact", ["body"], issues);
  return issues;
};

export const collectHttpTemplateVariables = (
  requestTemplate?: GenericHttpRequestTemplate,
) => {
  const variables = new Set<string>();
  if (!requestTemplate) {
    return variables;
  }

  collectTemplateValueVariables(requestTemplate.path, "path", variables);
  collectTemplateValueVariables(requestTemplate.query, "exact", variables);
  collectTemplateValueVariables(requestTemplate.headers, "exact", variables);
  collectTemplateValueVariables(requestTemplate.body, "exact", variables);

  return variables;
};

export const formatHttpTemplateLocation = (path: Array<string | number>) =>
  path
    .map((segment, index) =>
      typeof segment === "number"
        ? `[${segment}]`
        : index === 0
          ? segment
          : `.${segment}`,
    )
    .join("");
