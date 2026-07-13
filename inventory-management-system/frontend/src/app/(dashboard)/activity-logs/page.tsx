"use client";

import { useCallback, useEffect, useState } from "react";
import { getActivityLogs } from "@/lib/api/finance";
import { PageHeader, LoadingState, EmptyState, Alert } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { useServerPagination } from "@/hooks/useServerPagination";
import { formatDateTime } from "@/lib/utils";
import type { ActivityLogEntry } from "@/lib/types";
import { getErrorMessage } from "@/lib/api/client";

const MODULE_FILTERS = [
  { value: "", label: "All modules" },
  { value: "finance", label: "Finance" },
  { value: "orders", label: "Orders" },
  { value: "inventory", label: "Inventory" },
];

function actionVariant(action: string) {
  if (["CANCEL", "DELETE", "DEACTIVATE"].includes(action)) return "danger" as const;
  if (["PAYMENT_RECORDED", "CREDIT_COLLECTION", "POS_CHECKOUT", "EXPENSE_RECORDED"].includes(action)) {
    return "success" as const;
  }
  if (["CONFIRM", "SUBMIT", "RECEIVE", "FULFILL"].includes(action)) return "warning" as const;
  return "default" as const;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const { page, setPage, pageSize, onPageSizeChange, pagination, applyResponse } =
    useServerPagination(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        page_size: String(pageSize),
        ordering: "-created_at",
      };
      if (moduleFilter) params.module = moduleFilter;
      const res = await getActivityLogs(params);
      setLogs(res.data.results);
      applyResponse(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, moduleFilter, applyResponse]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Activity Logs"
        description="Complete audit trail — every sale, stock move, payment & order action"
      />

      {error && <div className="mb-4"><Alert message={error} /></div>}

      <div className="mb-4 flex flex-wrap gap-2">
        {MODULE_FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            type="button"
            onClick={() => {
              setModuleFilter(f.value);
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              moduleFilter === f.value
                ? "bg-[#0b6e4f] text-white"
                : "bg-white text-[#5c6b63] ring-1 ring-[#d8e0d9]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <LoadingState />
          ) : logs.length === 0 ? (
            <EmptyState title="No activity yet" description="Actions across the shop will appear here." />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Module</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-[#f4f6f3] hover:bg-[#f8faf8]">
                      <td className="px-4 py-3 whitespace-nowrap text-[#5c6b63]">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-4 py-3">{log.user_display}</td>
                      <td className="px-4 py-3 capitalize">{log.module}</td>
                      <td className="px-4 py-3">
                        <Badge variant={actionVariant(log.action)}>
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[#5c6b63]">{log.entity_type}</span>
                        {log.entity_label && (
                          <p className="font-medium text-[#14201a]">{log.entity_label}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-xs">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                currentPage={pagination.current_page}
                totalPages={pagination.total_pages}
                totalCount={pagination.count}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={onPageSizeChange}
              />
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
