export type ProposedPatchPreviewRow = {
  key: string;
  masked: boolean;
  value: string;
};

const SENSITIVE_KEY_PATTERN =
  /(secret|token|password|authorization|cookie|session|api[_-]?key|transcript|body|raw|email|phone)/i;

const SENSITIVE_VALUE_PATTERNS = [
  /postgres(?:ql)?:\/\//i,
  /bearer\s+[a-z0-9._-]+/i,
  /sk-[a-z0-9]/i,
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function truncate(value: string, maxLength = 160) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function stringifyPreviewValue(value: unknown) {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }

  if (isPlainObject(value)) {
    return "{...}";
  }

  return String(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function shouldMask(key: string, value: unknown) {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return true;
  }

  return (
    typeof value === "string" &&
    SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value))
  );
}

export function proposedPatchPreviewRows(
  value: unknown,
  parentKey = "",
  depth = 0,
): ProposedPatchPreviewRow[] {
  if (depth > 2) {
    return [
      {
        key: parentKey || "value",
        masked: false,
        value: "{...}",
      },
    ];
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value).slice(0, 12);

    if (entries.length === 0) {
      return [
        {
          key: parentKey || "value",
          masked: false,
          value: "{}",
        },
      ];
    }

    return entries.flatMap(([key, entry]) => {
      const rowKey = parentKey ? `${parentKey}.${key}` : key;

      if (shouldMask(rowKey, entry)) {
        return [
          {
            key: rowKey,
            masked: true,
            value: "[redacted]",
          },
        ];
      }

      if (isPlainObject(entry)) {
        return proposedPatchPreviewRows(entry, rowKey, depth + 1);
      }

      return [
        {
          key: rowKey,
          masked: false,
          value: truncate(escapeHtml(stringifyPreviewValue(entry))),
        },
      ];
    });
  }

  if (Array.isArray(value)) {
    return [
      {
        key: parentKey || "value",
        masked: false,
        value: `[${value.length} items]`,
      },
    ];
  }

  return [
    {
      key: parentKey || "value",
      masked: shouldMask(parentKey || "value", value),
      value: shouldMask(parentKey || "value", value)
        ? "[redacted]"
        : truncate(escapeHtml(stringifyPreviewValue(value))),
    },
  ];
}
