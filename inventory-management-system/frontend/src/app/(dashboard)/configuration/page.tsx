"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Shield, Users } from "lucide-react";
import {
  approveUser,
  banUser,
  createAdminUser,
  createRole,
  deleteRole,
  getAdminUsers,
  getRoles,
  unbanUser,
  updateAdminUser,
  updateRole,
} from "@/lib/api/configuration";
import { PageHeader, LoadingState, EmptyState, Alert } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { useClientPagination } from "@/hooks/useClientPagination";
import { formatDate } from "@/lib/utils";
import type { Role, User } from "@/lib/types";
import { getErrorMessage } from "@/lib/api/client";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";

type Tab = "users" | "roles";

interface UserForm {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_id: string;
  approved: string;
}

interface RoleForm {
  name: string;
  code: string;
  description?: string;
  can_manage_users: boolean;
  can_manage_config: boolean;
  can_manage_inventory: boolean;
  can_manage_orders: boolean;
  can_view_reports: boolean;
}

const PERMISSION_FIELDS: {
  key: keyof Pick<
    RoleForm,
    | "can_manage_users"
    | "can_manage_config"
    | "can_manage_inventory"
    | "can_manage_orders"
    | "can_view_reports"
  >;
  label: string;
  description: string;
}[] = [
  { key: "can_manage_users", label: "Manage users", description: "Approve, ban, and assign roles" },
  { key: "can_manage_config", label: "Manage configuration", description: "Access this settings page" },
  { key: "can_manage_inventory", label: "Manage inventory", description: "Stock, products, warehouses" },
  { key: "can_manage_orders", label: "Manage orders", description: "Purchase and sales orders" },
  { key: "can_view_reports", label: "View reports", description: "Valuation and ABC reports" },
];

const defaultRolePermissions: Pick<
  RoleForm,
  | "can_manage_users"
  | "can_manage_config"
  | "can_manage_inventory"
  | "can_manage_orders"
  | "can_view_reports"
> = {
  can_manage_users: false,
  can_manage_config: false,
  can_manage_inventory: false,
  can_manage_orders: false,
  can_view_reports: false,
};

function PermissionCheckboxes({
  values,
  onChange,
}: {
  values: typeof defaultRolePermissions;
  onChange: (key: keyof typeof defaultRolePermissions, checked: boolean) => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-[#ecf1ed] bg-[#f8faf8] p-4">
      <p className="text-sm font-medium text-[#14201a]">Permissions</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {PERMISSION_FIELDS.map(({ key, label, description }) => (
          <label
            key={key}
            className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-[#ecf1ed] bg-white px-3 py-2.5 transition hover:border-[#0b6e4f]/30"
          >
            <input
              type="checkbox"
              className="mt-0.5 cursor-pointer rounded border-[#d8e0d9] text-[#0b6e4f] focus:ring-[#0b6e4f]/20"
              checked={values[key]}
              onChange={(e) => onChange(key, e.target.checked)}
            />
            <span>
              <span className="block text-sm font-medium text-[#14201a]">{label}</span>
              <span className="block text-xs text-[#5c6b63]">{description}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function statusVariant(status?: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  if (status === "BANNED") return "danger" as const;
  return "default" as const;
}

export default function ConfigurationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ count: 0, total_pages: 1, current_page: 1 });
  const [showUserForm, setShowUserForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rolePermissions, setRolePermissions] = useState(defaultRolePermissions);
  const [editPermissions, setEditPermissions] = useState(defaultRolePermissions);
  const rolesPagination = useClientPagination(roles, 10);

  const userForm = useForm<UserForm>({ defaultValues: { approved: "true", role_id: "" } });
  const roleForm = useForm<RoleForm>();

  useEffect(() => {
    if (user && user.can_manage_config === false) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const loadRoles = useCallback(async () => {
    try {
      const res = await getRoles();
      setRoles(res.data.results ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  const loadUsers = useCallback(async (pageNum: number, size: number) => {
    setLoading(true);
    try {
      const res = await getAdminUsers({ page: String(pageNum), page_size: String(size) });
      setUsers(res.data.results);
      setPagination({
        count: res.data.count,
        total_pages: res.data.total_pages,
        current_page: res.data.current_page,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Always load roles so user role dropdowns work on the Users tab
    void loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (tab === "users") {
      void loadUsers(page, pageSize);
    } else {
      setLoading(true);
      loadRoles().finally(() => setLoading(false));
    }
  }, [tab, page, pageSize, loadUsers, loadRoles]);

  const refreshUsers = () => loadUsers(page, pageSize);
  const refreshRoles = () => loadRoles();

  const onCreateUser = async (data: UserForm) => {
    setError("");
    setSubmitting(true);
    try {
      await createAdminUser({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        role_id: data.role_id ? Number(data.role_id) : null,
        approved: data.approved === "true",
      });
      setShowUserForm(false);
      userForm.reset({ approved: "true", role_id: "" });
      setPage(1);
      loadUsers(1, pageSize);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onCreateRole = async (data: RoleForm) => {
    setError("");
    setSubmitting(true);
    try {
      await createRole({
        name: data.name,
        code: data.code,
        description: data.description,
        ...rolePermissions,
      });
      setShowRoleForm(false);
      roleForm.reset();
      setRolePermissions(defaultRolePermissions);
      refreshRoles();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setEditPermissions({
      can_manage_users: role.can_manage_users,
      can_manage_config: role.can_manage_config,
      can_manage_inventory: role.can_manage_inventory,
      can_manage_orders: role.can_manage_orders,
      can_view_reports: role.can_view_reports,
    });
  };

  const onUpdateRole = async () => {
    if (!editingRole) return;
    setError("");
    setSubmitting(true);
    try {
      await updateRole(editingRole.id, editPermissions);
      setEditingRole(null);
      refreshRoles();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    setError("");
    try {
      await approveUser(id);
      refreshUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleBan = async (id: number) => {
    setError("");
    try {
      await banUser(id);
      refreshUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleUnban = async (id: number) => {
    setError("");
    try {
      await unbanUser(id);
      refreshUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleRoleChange = async (userId: number, roleId: string) => {
    setError("");
    try {
      await updateAdminUser(userId, { role_id: roleId ? Number(roleId) : null });
      refreshUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteRole = async (id: number) => {
    setError("");
    try {
      await deleteRole(id);
      refreshRoles();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!user?.can_manage_config) {
    return <LoadingState />;
  }

  const roleOptions = [
    { value: "", label: "No role" },
    ...roles.map((r) => ({ value: r.id, label: r.name })),
  ];

  return (
    <div>
      <PageHeader
        title="Configuration"
        description="Manage users, approvals, roles, and access control"
        action={
          tab === "users" ? (
            <Button onClick={() => setShowUserForm(true)}>
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          ) : (
            <Button onClick={() => setShowRoleForm(true)}>
              <Plus className="h-4 w-4" />
              Add Role
            </Button>
          )
        }
      />

      {error && <div className="mb-4"><Alert message={error} /></div>}

      <div className="mb-4 flex gap-2">
        <Button
          variant={tab === "users" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setTab("users")}
        >
          <Users className="h-4 w-4" />
          Users
        </Button>
        <Button
          variant={tab === "roles" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setTab("roles")}
        >
          <Shield className="h-4 w-4" />
          Roles
        </Button>
      </div>

      <Modal
        open={showUserForm}
        onClose={() => setShowUserForm(false)}
        title="Create User"
        description="Admin-created users can be approved immediately."
      >
        <form onSubmit={userForm.handleSubmit(onCreateUser)} className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" {...userForm.register("email", { required: true })} />
          <Input label="Password" type="password" {...userForm.register("password", { required: true })} />
          <Input label="First name" {...userForm.register("first_name", { required: true })} />
          <Input label="Last name" {...userForm.register("last_name", { required: true })} />
          <Input label="Phone" {...userForm.register("phone")} />
          <Select label="Role" options={roleOptions} {...userForm.register("role_id")} />
          <Select
            label="Approval"
            options={[
              { value: "true", label: "Approved (can login)" },
              { value: "false", label: "Pending approval" },
            ]}
            {...userForm.register("approved")}
          />
          <div className="flex justify-end gap-2 border-t border-[#ecf1ed] pt-4 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setShowUserForm(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showRoleForm}
        onClose={() => {
          setShowRoleForm(false);
          setRolePermissions(defaultRolePermissions);
        }}
        title="Create Role"
        description="Define a custom access role for your team."
      >
        <form onSubmit={roleForm.handleSubmit(onCreateRole)} className="space-y-4">
          <Input label="Name" {...roleForm.register("name", { required: true })} />
          <Input label="Code" placeholder="SALES_LEAD" {...roleForm.register("code", { required: true })} />
          <Input label="Description" {...roleForm.register("description")} />
          <PermissionCheckboxes
            values={rolePermissions}
            onChange={(key, checked) =>
              setRolePermissions((prev) => ({ ...prev, [key]: checked }))
            }
          />
          <div className="flex justify-end gap-2 border-t border-[#ecf1ed] pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowRoleForm(false);
                setRolePermissions(defaultRolePermissions);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>Create</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!editingRole}
        onClose={() => setEditingRole(null)}
        title={editingRole ? `Edit ${editingRole.name}` : "Edit role"}
        description="Update permissions for this role."
      >
        {editingRole && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#ecf1ed] bg-[#f8faf8] px-4 py-3 text-sm">
              <p className="font-medium text-[#14201a]">{editingRole.name}</p>
              <p className="font-mono text-xs text-[#5c6b63]">{editingRole.code}</p>
            </div>
            <PermissionCheckboxes
              values={editPermissions}
              onChange={(key, checked) =>
                setEditPermissions((prev) => ({ ...prev, [key]: checked }))
              }
            />
            <div className="flex justify-end gap-2 border-t border-[#ecf1ed] pt-4">
              <Button type="button" variant="secondary" onClick={() => setEditingRole(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={onUpdateRole} loading={submitting}>
                Save permissions
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <LoadingState />
          ) : tab === "users" ? (
            users.length === 0 ? (
              <EmptyState title="No users" />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] text-sm">
                    <thead>
                      <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">Phone</th>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Joined</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-[#f4f6f3] hover:bg-[#f8faf8]">
                          <td className="px-4 py-3">
                            <p className="font-medium text-[#14201a]">{u.first_name} {u.last_name}</p>
                            <p className="text-xs text-[#5c6b63]">{u.email}</p>
                          </td>
                          <td className="px-4 py-3 text-[#5c6b63]">{u.phone || "—"}</td>
                          <td className="px-4 py-3">
                            <select
                              className="rounded-lg border border-[#d8e0d9] px-2 py-1.5 text-sm"
                              value={u.role ?? ""}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            >
                              {roleOptions.map((opt) => (
                                <option key={String(opt.value)} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant(u.account_status)}>
                              {u.account_status?.replace(/_/g, " ") ?? "—"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-[#5c6b63]">
                            {u.created_at ? formatDate(u.created_at) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {u.account_status === "PENDING" && (
                                <Button size="sm" onClick={() => handleApprove(u.id)}>Approve</Button>
                              )}
                              {u.account_status === "ACTIVE" && (
                                <Button size="sm" variant="danger" onClick={() => handleBan(u.id)}>Ban</Button>
                              )}
                              {u.account_status === "BANNED" && (
                                <Button size="sm" variant="secondary" onClick={() => handleUnban(u.id)}>Unban</Button>
                              )}
                            </div>
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
                  onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                />
              </>
            )
          ) : roles.length === 0 ? (
            <EmptyState title="No roles" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Code</th>
                      <th className="px-4 py-3 font-medium">Users</th>
                      <th className="px-4 py-3 font-medium">Permissions</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rolesPagination.pagedItems.map((role) => (
                      <tr key={role.id} className="border-b border-[#f4f6f3]">
                        <td className="px-4 py-3">
                          <p className="font-medium">{role.name}</p>
                          <p className="text-xs text-[#5c6b63]">{role.description}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{role.code}</td>
                        <td className="px-4 py-3">{role.user_count ?? 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {role.can_manage_users && <Badge>Users</Badge>}
                            {role.can_manage_config && <Badge variant="success">Config</Badge>}
                            {role.can_manage_inventory && <Badge>Inventory</Badge>}
                            {role.can_manage_orders && <Badge>Orders</Badge>}
                            {role.can_view_reports && <Badge>Reports</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <Button size="sm" variant="secondary" onClick={() => openEditRole(role)}>
                              Edit
                            </Button>
                            {!role.is_system && (
                              <Button size="sm" variant="danger" onClick={() => handleDeleteRole(role.id)}>
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={rolesPagination.pagination.current_page}
                totalPages={rolesPagination.pagination.total_pages}
                totalCount={rolesPagination.pagination.count}
                pageSize={rolesPagination.pageSize}
                onPageChange={rolesPagination.setPage}
                onPageSizeChange={rolesPagination.onPageSizeChange}
              />
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
