import Papa from "papaparse";
import type {
  DataViewCsvRow,
  DataViewExportColumn,
  DataViewImportConfig,
  DataViewImportIssue,
  DataViewImportRow,
} from "@eng-mohamedelsayed/admin-core/data-view";

export interface DataViewCsvParseResult {
  headers: string[];
  rows: DataViewCsvRow[];
  rowNumbers: number[];
  issues: DataViewImportIssue[];
}

/** RFC 4180-compliant CSV parser powered by PapaParse. */
export function parseDataViewCsv(input: string): DataViewCsvParseResult {
  const text = input.replace(/^\uFEFF/, "");
  const result = Papa.parse<string[]>(text, {
    skipEmptyLines: "greedy",
  });

  const issues: DataViewImportIssue[] = [];

  result.errors.forEach((err) => {
    issues.push({
      row: err.row !== undefined ? err.row + 1 : 1,
      message: err.message,
      severity:
        err.type === "Quotes" || err.type === "Delimiter" ? "error" : "warning",
      code: err.code,
    });
  });

  const rawRows = result.data;
  if (!rawRows || rawRows.length === 0) {
    return {
      headers: [],
      rows: [],
      rowNumbers: [],
      issues: [
        ...issues,
        {
          row: 1,
          message: "The CSV file is empty.",
          severity: "error",
          code: "empty_file",
        },
      ],
    };
  }

  const headerRecord = rawRows[0] ?? [];
  const headers = headerRecord.map((h) => String(h).trim());
  const seenHeaders = new Set<string>();

  headers.forEach((header) => {
    if (!header) {
      issues.push({
        row: 1,
        message: "CSV column names cannot be empty.",
        severity: "error",
        code: "empty_header",
      });
    } else if (seenHeaders.has(header)) {
      issues.push({
        row: 1,
        column: header,
        message: `Duplicate CSV column “${header}”.`,
        severity: "error",
        code: "duplicate_header",
      });
    }
    seenHeaders.add(header);
  });

  const rows: DataViewCsvRow[] = [];
  const rowNumbers: number[] = [];

  for (let i = 1; i < rawRows.length; i++) {
    const values = rawRows[i] ?? [];
    const rowNum = i + 1;

    if (values.length !== headers.length) {
      issues.push({
        row: rowNum,
        message: `Expected ${headers.length} columns but found ${values.length}.`,
        severity: "error",
        code: "column_count",
      });
    }

    const rowObj: DataViewCsvRow = {};
    headers.forEach((header, index) => {
      rowObj[header] = values[index] ?? "";
    });

    rows.push(rowObj);
    rowNumbers.push(rowNum);
  }

  return { headers, rows, rowNumbers, issues };
}

export async function prepareDataViewImport<TMapped>(
  file: File,
  config: DataViewImportConfig<TMapped>
): Promise<{
  headers: string[];
  rows: DataViewImportRow<TMapped>[];
  issues: DataViewImportIssue[];
}> {
  const parsed = parseDataViewCsv(await file.text());
  const issues = [...parsed.issues];
  const headerSet = new Set(parsed.headers);

  for (const required of config.requiredColumns ?? []) {
    if (!headerSet.has(required)) {
      issues.push({
        row: 1,
        column: required,
        message: `Missing required column “${required}”.`,
        severity: "error",
        code: "missing_required_column",
      });
    }
  }

  if (config.expectedColumns?.length) {
    const expected = new Set(config.expectedColumns);
    parsed.headers.forEach((header) => {
      if (!expected.has(header)) {
        issues.push({
          row: 1,
          column: header,
          message: `Unexpected column “${header}” will be ignored by this import.`,
          severity: "warning",
          code: "unexpected_column",
        });
      }
    });
  }

  const hasStructuralErrors = issues.some(
    (issue) => issue.severity === "error" && issue.row <= 1
  );

  const duplicateKeys = new Map<string, number>();
  const rows: DataViewImportRow<TMapped>[] = [];

  for (let index = 0; index < parsed.rows.length; index += 1) {
    const raw = parsed.rows[index] ?? {};
    const row = parsed.rowNumbers[index] ?? index + 2;
    const rowIssues = issues.filter((issue) => issue.row === row);
    let duplicate = false;
    const duplicateKey = config.duplicateKey?.(raw)?.trim();

    if (duplicateKey) {
      const normalizedKey = duplicateKey.toLocaleLowerCase();
      const firstRow = duplicateKeys.get(normalizedKey);
      if (firstRow !== undefined) {
        duplicate = true;
        rowIssues.push({
          row,
          message: `Duplicate value also appears on row ${firstRow}.`,
          severity: "error",
          code: "duplicate_row",
        });
      } else {
        duplicateKeys.set(normalizedKey, row);
      }
    }

    if (config.validate) {
      try {
        const validationIssues = await config.validate(raw, {
          row,
          rows: parsed.rows,
        });
        rowIssues.push(
          ...validationIssues.map((issue) => ({ ...issue, row }))
        );
      } catch (error: unknown) {
        rowIssues.push({
          row,
          message:
            error instanceof Error
              ? error.message
              : "The row could not be validated.",
          severity: "error",
          code: "validation_error",
        });
      }
    }

    let mapped: TMapped | undefined;
    if (
      !hasStructuralErrors &&
      !rowIssues.some((issue) => issue.severity === "error")
    ) {
      try {
        mapped = config.map
          ? await config.map(raw, { row })
          : (raw as unknown as TMapped);
      } catch (error: unknown) {
        rowIssues.push({
          row,
          message:
            error instanceof Error ? error.message : "The row could not be mapped.",
          severity: "error",
          code: "mapping_error",
        });
      }
    }

    issues.push(
      ...rowIssues.filter(
        (issue) => !issues.some((existing) => existing === issue)
      )
    );
    rows.push({
      row,
      raw,
      ...(mapped !== undefined ? { mapped } : {}),
      issues: rowIssues,
      duplicate,
    });
  }

  return { headers: parsed.headers, rows, issues };
}

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toCsvValue).join(" | ");
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value);
  // Neutralize spreadsheet formulas in user-controlled exported values.
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

/** Serializes rows to CSV using PapaParse with UTF-8 BOM encoding. */
export function serializeDataViewCsv<TData>(
  rows: TData[],
  columns: DataViewExportColumn<TData>[]
): string {
  const fields = columns.map((column) => column.label);
  const data = rows.map((row) =>
    columns.map((column) => toCsvValue(column.value(row)))
  );

  const csv = Papa.unparse({ fields, data });
  return `\uFEFF${csv}`;
}

/** Triggers download of generated CSV contents. */
export function downloadCsv(contents: string, filename: string): void {
  const normalizedFilename = filename.toLocaleLowerCase().endsWith(".csv")
    ? filename
    : `${filename}.csv`;
  const url = URL.createObjectURL(
    new Blob([contents], { type: "text/csv;charset=utf-8" })
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = normalizedFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Opens a dedicated printable view formatted for printing selected records. */
export function printDataViewTable<TData>(
  rows: TData[],
  columns: DataViewExportColumn<TData>[],
  title = "Resource Records"
): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const headerHtml = columns
    .map(
      (c) =>
        `<th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; background-color: #f1f5f9; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155;">${escapeHtml(
          c.label
        )}</th>`
    )
    .join("");

  const rowsHtml = rows
    .map(
      (row) =>
        `<tr style="border-bottom: 1px solid #e2e8f0;">${columns
          .map(
            (c) =>
              `<td style="border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 12px; color: #0f172a;">${escapeHtml(
                String(toCsvValue(c.value(row)))
              )}</td>`
          )
          .join("")}</tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
  <head>
    <title>${escapeHtml(title)}</title>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; margin: 0; }
      .header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
      h1 { font-size: 20px; font-weight: 700; margin: 0; }
      .meta { font-size: 12px; color: #64748b; margin: 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      @media print {
        body { padding: 12px; }
        @page { margin: 1cm; size: landscape; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${escapeHtml(title)}</h1>
      <p class="meta">${rows.length} record${rows.length === 1 ? "" : "s"} &bull; Printed ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
    </div>
    <table>
      <thead>
        <tr>${headerHtml}</tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <script>
      window.onload = function() {
        window.focus();
        window.print();
      };
    </script>
  </body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
