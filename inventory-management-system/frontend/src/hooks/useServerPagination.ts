"use client";

import { useCallback, useMemo, useState } from "react";
import type { PaginatedData } from "@/lib/types";

const emptyMeta = { count: 0, total_pages: 1, current_page: 1 };

export function useServerPagination(initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [pagination, setPagination] = useState(emptyMeta);

  const applyResponse = useCallback(<T,>(data: PaginatedData<T>) => {
    setPagination({
      count: data.count,
      total_pages: data.total_pages,
      current_page: data.current_page,
    });
  }, []);

  const resetPage = useCallback(() => setPage(1), []);

  const onPageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const queryParams = useMemo(
    () => ({
      page: String(page),
      page_size: String(pageSize),
    }),
    [page, pageSize],
  );

  return {
    page,
    setPage,
    pageSize,
    onPageSizeChange,
    pagination,
    applyResponse,
    resetPage,
    queryParams,
  };
}
