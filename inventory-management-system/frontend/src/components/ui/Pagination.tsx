"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { Select } from "./Select";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  showPageSize?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSize = true,
}: PaginationProps) {
  if (totalCount === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col gap-3 border-t border-[#ecf1ed] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-sm text-[#5c6b63]">
        Showing {start}–{end} of {totalCount}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {showPageSize && onPageSizeChange && (
          <div className="w-28">
            <Select
              label=""
              aria-label="Rows per page"
              value={String(pageSize)}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              options={[
                { value: "10", label: "10 / page" },
                { value: "20", label: "20 / page" },
                { value: "50", label: "50 / page" },
              ]}
            />
          </div>
        )}

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[5rem] text-center text-sm text-[#5c6b63]">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
