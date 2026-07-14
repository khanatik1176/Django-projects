export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: Record<string, unknown> | null;
}

export interface PaginatedData<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  profile_picture?: string | null;
  role?: number | null;
  role_name?: string;
  role_code?: string;
  account_status?: "PENDING" | "ACTIVE" | "BANNED";
  can_manage_config?: boolean;
  can_manage_inventory?: boolean;
  can_manage_orders?: boolean;
  can_view_reports?: boolean;
  is_active?: boolean;
  created_at?: string;
}

export interface Role {
  id: number;
  name: string;
  code: string;
  description?: string;
  can_manage_users: boolean;
  can_manage_config: boolean;
  can_manage_inventory: boolean;
  can_manage_orders: boolean;
  can_view_reports: boolean;
  is_system: boolean;
  user_count?: number;
  created_at?: string;
}

export interface AuthData {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Brand {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string | null;
  unit_of_measure?: string;
  cost_price?: string;
  selling_price?: string;
  category?: string | Category;
  brand?: string | Brand;
  supplier?: string | Supplier;
  description?: string;
  is_perishable?: boolean;
  shelf_life_days?: number | null;
  is_active: boolean;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address?: string;
  contact_person?: string;
  phone?: string;
  is_default: boolean;
  is_active: boolean;
}

export type StockHealthStatus =
  | "LOW_STOCK"
  | "ADEQUATE"
  | "GOOD"
  | "EXPIRING_SOON"
  | "OUT_OF_STOCK";

export interface Stock {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  warehouse: number;
  warehouse_name: string;
  quantity: string;
  reserved_quantity: string;
  available_quantity: string;
  reorder_level: string;
  max_stock_level?: string | null;
  is_low_stock: boolean;
  is_perishable?: boolean;
  health_status?: StockHealthStatus;
  health_label?: string;
  is_expiring_soon?: boolean;
  days_to_expiry?: number | null;
  expiring_quantity?: string;
}

export interface StockBatch {
  id: number;
  batch_number: string;
  quantity: string;
  expiry_date: string | null;
  received_at: string;
  product_name: string;
  days_left: number | null;
  is_expired: boolean;
}

export interface StockDetail extends Stock {
  unit_of_measure?: string;
  batches?: StockBatch[];
}

export interface StockMovement {
  id: number;
  product_name: string;
  product_sku: string;
  warehouse_name: string;
  movement_type: string;
  quantity: string;
  quantity_before: string;
  quantity_after: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export interface DashboardData {
  total_warehouses: number;
  total_stock_records: number;
  total_units_on_hand: string;
  low_stock_items: number;
  expiring_soon_items?: number;
  pending_transfers: number;
  open_purchase_orders: number;
  open_sales_orders: number;
  total_inventory_value: string;
  health_summary?: Record<StockHealthStatus, number>;
}

export interface ExpiringBatch {
  batch_id: number;
  product_name: string;
  product_sku: string;
  warehouse_name: string;
  batch_number: string;
  quantity: string;
  expiry_date: string;
  days_left: number;
  at_risk_value?: string;
}

export interface ReorderSuggestion {
  stock_id: number;
  product_name: string;
  product_sku: string;
  warehouse_name: string;
  quantity: string;
  reorder_level: string;
  health_status: StockHealthStatus;
  health_label: string;
  suggested_order_qty: string;
  supplier_name: string;
  supplier_phone?: string;
}

export interface ClearanceItem {
  batch_id: number;
  stock_id: number;
  product_name: string;
  product_sku: string;
  warehouse_name: string;
  quantity: string;
  expiry_date: string;
  days_left: number;
  is_expired: boolean;
  selling_price: string;
  suggested_discount_percent: number;
  clearance_price: string;
  at_risk_value: string;
  action: string;
}

export interface ClearanceHub {
  expiring_items: ClearanceItem[];
  expiring_count: number;
  total_at_risk_value: string;
  dead_stock: ReorderSuggestion[];
  tip: string;
}

export interface ShopInsights {
  role_code: string;
  role_name: string;
  health_summary: Record<StockHealthStatus, number>;
  expiring_batches: ExpiringBatch[];
  reorder_suggestions: ReorderSuggestion[];
  daily_tip: string;
  admin_panel?: {
    pending_approvals: number;
    banned_users: number;
    margin_snapshot: {
      inventory_cost_value: string;
      inventory_retail_value: string;
      potential_margin: string;
      margin_percent: number;
    };
    expiring_loss_risk: string;
    dead_stock: ReorderSuggestion[];
    headline: string;
  };
  manager_panel?: {
    open_purchase_orders: { id: number; po_number: string; supplier_name: string; status: string; total_cost: string }[];
    open_sales_orders: { id: number; so_number: string; customer_name: string; status: string; total_revenue: string }[];
    dead_stock: ReorderSuggestion[];
    headline: string;
  };
  warehouse_panel?: {
    receive_queue: { id: number; po_number: string; supplier_name: string; status: string; total_cost: string }[];
    pick_list: { id: number; so_number: string; customer_name: string; status: string; total_revenue: string }[];
    fefo_alerts: ExpiringBatch[];
    shelf_refill: ReorderSuggestion[];
    headline: string;
  };
  viewer_panel?: {
    price_board: { product_name: string; sku: string; selling_price: string; quantity: string; unit: string }[];
    movement_today: number;
    headline: string;
  };
}

export interface PurchaseOrderItem {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  is_perishable?: boolean;
  quantity_ordered: string;
  quantity_received: string;
  quantity_remaining: string;
  unit_cost: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier: number;
  supplier_name: string;
  warehouse: number;
  warehouse_name: string;
  status: string;
  order_date: string;
  items: PurchaseOrderItem[];
  total_cost: string;
}

export interface SalesOrderItem {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  quantity_ordered: string;
  quantity_fulfilled: string;
  quantity_reserved?: string;
  quantity_remaining: string;
  unit_price: string;
  line_total?: string;
}

export interface SalesOrder {
  id: number;
  so_number: string;
  invoice_number?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  warehouse: number;
  warehouse_name: string;
  status: string;
  order_date: string;
  notes?: string;
  items: SalesOrderItem[];
  total_ordered?: string;
  total_fulfilled?: string;
  total_revenue: string;
  is_pos?: boolean;
  payment_method?: string | null;
  created_at?: string;
}

export interface FinanceSummary {
  today_revenue: string;
  month_revenue: string;
  today_expenses: string;
  month_expenses: string;
  month_net: string;
  udhar_outstanding: string;
  payment_method_breakdown: { payment_method: string; total: string }[];
  daily_revenue: { date: string; revenue: string }[];
  recent_payments: {
    id: number;
    payment_type: string;
    direction: string;
    payment_method: string;
    amount: string;
    description: string;
    created_at: string;
    customer_id: number | null;
  }[];
}

export interface FinancePayment {
  id: number;
  payment_type: string;
  direction: string;
  payment_method: string;
  amount: string;
  description: string;
  reference_type: string;
  reference_id: number | null;
  sales_order_id: number | null;
  customer_id: number | null;
  customer_name: string;
  created_by_email: string;
  created_at: string;
}

export interface FinanceExpense {
  id: number;
  category: string;
  amount: string;
  description: string;
  expense_date: string;
  payment_method: string;
  notes: string;
  created_by_email: string;
  created_at: string;
}

export interface ActivityLogEntry {
  id: number;
  action: string;
  module: string;
  entity_type: string;
  entity_id: number | null;
  entity_label: string;
  description: string;
  metadata: Record<string, unknown>;
  user_display: string;
  user_email: string;
  created_at: string;
}
