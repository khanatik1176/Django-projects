"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import { getWarehouses, createWarehouse } from "@/lib/api/inventory";
import { PageHeader, LoadingState, EmptyState, Alert } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { useServerPagination } from "@/hooks/useServerPagination";
import type { Warehouse } from "@/lib/types";
import { getErrorMessage } from "@/lib/api/client";

interface WarehouseForm {
  name: string;
  code: string;
  address?: string;
  contact_person?: string;
  phone?: string;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const {
    page,
    setPage,
    pageSize,
    onPageSizeChange,
    pagination,
    applyResponse,
  } = useServerPagination(10);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WarehouseForm>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWarehouses({
        page: String(page),
        page_size: String(pageSize),
      });
      setWarehouses(res.data.results);
      applyResponse(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, applyResponse]);

  useEffect(() => {
    load();
  }, [load]);

  const closeForm = () => {
    setShowForm(false);
    reset();
  };

  const onSubmit = async (data: WarehouseForm) => {
    setError("");
    setSubmitting(true);
    try {
      await createWarehouse({ ...data, is_active: true, is_default: false });
      closeForm();
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Warehouses"
        description="Storage locations for inventory"
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add Warehouse
          </Button>
        }
      />

      {error && <div className="mb-4"><Alert message={error} /></div>}

      <Modal
        open={showForm}
        onClose={closeForm}
        title="New Warehouse"
        description="Add a storage location for inventory."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" error={errors.name?.message} {...register("name", { required: "Required" })} />
          <Input label="Code" error={errors.code?.message} {...register("code", { required: "Required" })} />
          <Input label="Address" className="sm:col-span-2" {...register("address")} />
          <Input label="Contact Person" {...register("contact_person")} />
          <Input label="Phone" {...register("phone")} />
          <div className="flex justify-end gap-2 border-t border-[#ecf1ed] pt-4 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save</Button>
          </div>
        </form>
      </Modal>

      <Card>
        <CardBody className="p-0">
          {loading ? <LoadingState /> : warehouses.length === 0 ? (
            <EmptyState title="No warehouses" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-slate-500">
                      <th className="px-6 py-3 font-medium">Code</th>
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium">Address</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouses.map((w) => (
                      <tr key={w.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-6 py-3 font-mono text-slate-900">{w.code}</td>
                        <td className="px-6 py-3">{w.name}</td>
                        <td className="px-6 py-3 text-slate-600">{w.address || "—"}</td>
                        <td className="px-6 py-3">
                          <Badge variant={w.is_active ? "success" : "default"}>
                            {w.is_default ? "Default" : w.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
