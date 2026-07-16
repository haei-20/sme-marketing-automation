import { type HTMLAttributes, type Key, type ReactNode } from "react";

import { EmptyState } from "./empty-state";
import { Skeleton } from "./skeleton";
import { cn } from "./utils";

export type DataTableAlign = "left" | "center" | "right";

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T, rowIndex: number) => ReactNode;
  align?: DataTableAlign;
  className?: string;
  headerClassName?: string;
  width?: string;
}

export interface DataTableProps<T>
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  columns: DataTableColumn<T>[];
  data: readonly T[];
  getRowKey?: (row: T, rowIndex: number) => Key;
  caption?: string;
  loading?: boolean;
  loadingRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  footer?: ReactNode;
  rowClassName?: (row: T, rowIndex: number) => string | undefined;
}

const alignClasses: Record<DataTableAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  caption,
  loading = false,
  loadingRows = 5,
  emptyTitle = "Chưa có dữ liệu",
  emptyDescription = "Dữ liệu sẽ xuất hiện tại đây sau khi được tạo.",
  emptyAction,
  footer,
  rowClassName,
  className,
  ...props
}: DataTableProps<T>) {
  const hasData = data.length > 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950",
        className,
      )}
      aria-busy={loading || undefined}
      {...props}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-slate-50/80 dark:bg-slate-900">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    "border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.06em] text-slate-500 sm:px-5 dark:border-slate-800 dark:text-slate-400",
                    alignClasses[column.align ?? "left"],
                    column.headerClassName,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading
              ? Array.from({ length: Math.max(1, loadingRows) }, (_, rowIndex) => (
                  <tr key={`loading-${rowIndex}`}>
                    {columns.map((column, columnIndex) => (
                      <td key={column.id} className="px-4 py-4 sm:px-5">
                        <Skeleton
                          className={cn(
                            "h-4",
                            columnIndex === 0 ? "w-3/4" : "w-2/3",
                            column.align === "right" && "ml-auto",
                            column.align === "center" && "mx-auto",
                          )}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : hasData
                ? data.map((row, rowIndex) => (
                    <tr
                      key={getRowKey?.(row, rowIndex) ?? rowIndex}
                      className={cn(
                        "transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/70",
                        rowClassName?.(row, rowIndex),
                      )}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.id}
                          className={cn(
                            "px-4 py-4 align-middle text-slate-700 sm:px-5 dark:text-slate-200",
                            alignClasses[column.align ?? "left"],
                            column.className,
                          )}
                        >
                          {column.cell(row, rowIndex)}
                        </td>
                      ))}
                    </tr>
                  ))
                : null}
          </tbody>
        </table>
      </div>
      {!loading && !hasData && (
        <EmptyState
          compact
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      )}
      {loading && <span className="sr-only" role="status">Đang tải dữ liệu…</span>}
      {footer && (
        <div className="border-t border-slate-100 px-4 py-3 sm:px-5 dark:border-slate-800">
          {footer}
        </div>
      )}
    </div>
  );
}
