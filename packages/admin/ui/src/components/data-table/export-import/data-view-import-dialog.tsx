"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Spinner } from "../../ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { prepareDataViewImport } from "./data-view-csv";
import type {
  DataViewImportConfig,
  DataViewImportIssue,
  DataViewImportResult,
  DataViewImportRow,
} from "@eng-mohamedelsayed/admin-core/data-view";

interface PreparedImport<TMapped> {
  file: File;
  headers: string[];
  rows: DataViewImportRow<TMapped>[];
  issues: DataViewImportIssue[];
}

const BLOCKING_FILE_ISSUE_CODES = new Set([
  "empty_file",
  "empty_header",
  "duplicate_header",
  "missing_required_column",
  "unterminated_quote",
]);

function issueSummary(issues: DataViewImportIssue[]) {
  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.filter((issue) => issue.severity === "warning").length;
  return { errors, warnings };
}

export function DataViewImportDialog<TMapped>({
  config,
  label = "Import",
}: {
  config: DataViewImportConfig<TMapped>;
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [preparing, setPreparing] = React.useState(false);
  const [executing, setExecuting] = React.useState(false);
  const [prepared, setPrepared] = React.useState<PreparedImport<TMapped> | null>(
    null
  );
  const [result, setResult] = React.useState<DataViewImportResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const reset = () => {
    setPrepared(null);
    setResult(null);
    setError(null);
  };

  const handleFile = async (file: File | undefined) => {
    reset();
    if (!file) return;
    const maxFileSize = config.maxFileSize ?? 8 * 1024 * 1024;
    if (file.size > maxFileSize) {
      setError(
        `The file is too large. Choose a CSV smaller than ${Math.floor(maxFileSize / 1024 / 1024)} MB.`
      );
      return;
    }
    setPreparing(true);
    try {
      const next = await prepareDataViewImport(file, config);
      setPrepared({ file, ...next });
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : "The CSV file could not be parsed."
      );
    } finally {
      setPreparing(false);
    }
  };

  const execute = async () => {
    if (!prepared) return;
    const validRows = prepared.rows.filter(
      (row): row is DataViewImportRow<TMapped> & { mapped: TMapped } =>
        row.mapped !== undefined &&
        !row.issues.some((issue) => issue.severity === "error")
    );
    setExecuting(true);
    setError(null);
    try {
      const executionResult = await config.execute({
        file: prepared.file,
        headers: prepared.headers,
        rows: prepared.rows,
        validRows,
      });
      const summary = issueSummary(prepared.issues);
      setResult(
        executionResult ?? {
          total: prepared.rows.length,
          succeeded: validRows.length,
          failed: prepared.rows.length - validRows.length,
          warnings: summary.warnings,
        }
      );
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : "The import could not be completed."
      );
    } finally {
      setExecuting(false);
    }
  };

  const summary = issueSummary(prepared?.issues ?? []);
  const hasFileError = Boolean(
    prepared?.issues.some(
      (issue) =>
        issue.severity === "error" &&
        (issue.row <= 1 ||
          (issue.code !== undefined && BLOCKING_FILE_ISSUE_CODES.has(issue.code)))
    )
  );
  const canExecute = Boolean(
    prepared &&
      !hasFileError &&
      prepared.rows.length > 0 &&
      prepared.rows.some(
        (row) =>
          row.mapped !== undefined &&
          !row.issues.some((issue) => issue.severity === "error")
      ) &&
      (config.allowPartial || summary.errors === 0)
  );
  const preview = prepared?.rows.slice(0, config.previewRows ?? 8) ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (executing) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Upload data-icon="inline-start" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>
            Upload, validate, preview, and confirm the resource import. No rows
            are submitted before confirmation.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col gap-2 text-sm" aria-live="polite">
            <p className="font-medium">Import complete</p>
            <p className="text-muted-foreground">
              {result.succeeded} succeeded, {result.failed} failed, and{" "}
              {result.warnings} warning(s) across {result.total} row(s).
            </p>
            {result.message ? <p className="text-muted-foreground">{result.message}</p> : null}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Input
              type="file"
              accept={config.accept ?? ".csv,text/csv"}
              aria-label="Choose CSV file"
              disabled={preparing || executing}
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />

            {preparing ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner /> Parsing and validating CSV…
              </div>
            ) : null}

            {prepared ? (
              <>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span>{prepared.rows.length} row(s)</span>
                  <span>{summary.errors} error(s)</span>
                  <span>{summary.warnings} warning(s)</span>
                  <span>
                    {prepared.rows.filter((row) => row.duplicate).length} duplicate(s)
                  </span>
                </div>

                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        {prepared.headers.map((header) => (
                          <TableHead key={header}>{header || "Unnamed"}</TableHead>
                        ))}
                        <TableHead>Validation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((row) => (
                        <TableRow key={row.row}>
                          <TableCell>{row.row}</TableCell>
                          {prepared.headers.map((header) => (
                            <TableCell key={header} className="max-w-48 truncate">
                              {row.raw[header] ?? ""}
                            </TableCell>
                          ))}
                          <TableCell className="min-w-56">
                            {row.issues.length
                              ? row.issues.map((issue) => issue.message).join("; ")
                              : "Ready"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {prepared.issues.length ? (
                  <div className="flex max-h-32 flex-col gap-1 overflow-y-auto text-xs">
                    {prepared.issues.map((issue, index) => (
                      <p
                        key={`${issue.row}-${issue.code ?? "issue"}-${index}`}
                        className={
                          issue.severity === "error"
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }
                      >
                        Row {issue.row}
                        {issue.column ? `, ${issue.column}` : ""}: {issue.message}
                      </p>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        )}

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={executing}
            onClick={() => setOpen(false)}
          >
            {result ? "Close" : "Cancel"}
          </Button>
          {!result ? (
            <Button type="button" disabled={!canExecute || executing} onClick={() => void execute()}>
              {executing ? <Spinner data-icon="inline-start" /> : null}
              {executing ? "Importing…" : "Confirm import"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
