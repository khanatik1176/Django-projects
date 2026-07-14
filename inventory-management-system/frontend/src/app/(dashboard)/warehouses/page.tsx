"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Power, Star } from "lucide-react";
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
} from "@/lib/api/inventory";
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
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
    setEditingId(null);
    reset();
  };

  const openCreate = () => {
    setEditingId(null);
    reset();
    setShowForm(true);
  };

  const openEdit = (warehouse: Warehouse) => {
    setEditingId(warehouse.id);
    reset({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address ?? "",
      contact_person: warehouse.contact_person ?? "",
      phone: warehouse.phone ?? "",
    });
    setShowForm(true);
  };

  const onSubmit = async (data: WarehouseForm) => {
    setError("");
    setSubmitting(true);
    try {
      if (editingId) {
        await updateWarehouse(editingId, { ...data } as Record<string, unknown>);
      } else {
        await createWarehouse({ ...data, is_active: true, is_default: false });
      }
      closeForm();
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const makeDefault = async (warehouse: Warehouse) => {
    setError("");
    setActionId(warehouse.id);
    try {
      await updateWarehouse(warehouse.id, { is_default: true });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  };

  const toggleActive = async (warehouse: Warehouse) => {
    setError("");
    setActionId(warehouse.id);
    try {
      await updateWarehouse(warehouse.id, { is_active: !warehouse.is_active });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  };

  const renderActions = (warehouse: Warehouse) => (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => openEdit(warehouse)}
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
      {!warehouse.is_default && warehouse.is_active && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={actionId === warehouse.id}
          onClick={() => makeDefault(warehouse)}
        >
          <Star className="h-3.5 w-3.5" />
          Make default
        </Button>
      )}
      <Button
        type="button"
        variant={warehouse.is_active ? "ghost" : "secondary"}
        size="sm"
        loading={actionId === warehouse.id}
        onClick={() => toggleActive(warehouse)}
      >
        <Power className="h-3.5 w-3.5" />
        {warehouse.is_active ? "Deactivate" : "Activate"}
      </Button>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Warehouses"
        description="Storage locations for inventory"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Warehouse
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}

      <Modal
        open={showForm}
        onClose={closeForm}
        title={editingId ? "Edit Warehouse" : "New Warehouse"}
        description={
          editingId
            ? "Update warehouse details."
            : "Add a storage location for inventory."
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            error={errors.name?.message}
            {...register("name", { required: "Required" })}
          />
          <Input
            label="Code"
            error={errors.code?.message}
            {...register("code", { required: "Required" })}
          />
          <Input label="Address" className="sm:col-span-2" {...register("address")} />
          <Input label="Contact Person" {...register("contact_person")} />
          <Input label="Phone" {...register("phone")} />
          <div className="flex justify-end gap-2 border-t border-[#ecf1ed] pt-4 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingId ? "Update Warehouse" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <LoadingState />
          ) : warehouses.length === 0 ? (
            <EmptyState title="No warehouses" />
          ) : (
            <>
              <div className="divide-y divide-[#ecf1ed] sm:hidden">
                {warehouses.map((w) => (
                  <div key={w.id} className="space-y-3 px-4 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#14201a]">{w.name}</p>
                        <p className="font-mono text-xs text-[#5c6b63]">{w.code}</p>
                      </div>
                      <Badge variant={w.is_active ? "success" : "default"}>
                        {w.is_default ? "Default" : w.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#5c6b63]">{w.address || "—"}</p>
                    {renderActions(w)}
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                      <th className="px-6 py-3 font-medium">Code</th>
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium">Address</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouses.map((w) => (
                      <tr
                        key={w.id}
                        className="border-b border-[#f4f6f3] hover:bg-[#f8faf8]"
                      >
                        <td className="px-6 py-3 font-mono text-[#14201a]">{w.code}</td>
                        <td className="px-6 py-3 font-medium text-[#14201a]">{w.name}</td>
                        <td className="px-6 py-3 text-[#5c6b63]">{w.address || "—"}</td>
                        <td className="px-6 py-3">
                          <Badge variant={w.is_active ? "success" : "default"}>
                            {w.is_default ? "Default" : w.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-6 py-3">{renderActions(w)}</td>
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
