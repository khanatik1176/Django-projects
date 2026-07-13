"use client";

import { useMemo, useState } from "react";

export function useClientPagination<T>(items: T[], initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);

  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const onPageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  return {
    page: safePage,
    setPage,
    pageSize,
    onPageSizeChange,
    pagedItems,
    pagination: {
      count: totalCount,
      total_pages: totalPages,
      current_page: safePage,
    },
  };
}
