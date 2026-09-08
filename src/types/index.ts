export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff' | 'cashier';
  phone?: string;
  storeName?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code?: string;
  location?: string;
  isDefault?: boolean;
}

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  sku?: string;
  categoryId?: string;
  category?: Category;
  unit?: string;
  purchasePrice: number;
  sellingPrice: number;
  minStockLevel?: number;
  currentStock: number;
  warehouseStocks?: {
    warehouseId: string;
    warehouseName: string;
    stock: number;
  }[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dueAmount: number;
  creditLimit?: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dueAmount: number;
  companyName?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  customerId?: string;
  customer?: Customer;
  customerName?: string;
  warehouseId?: string;
  warehouse?: Warehouse;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: 'cash' | 'card' | 'mobile_banking' | 'credit';
  status: 'completed' | 'pending' | 'cancelled';
  createdAt: string;
  items?: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

export interface Purchase {
  id: string;
  billNo: string;
  supplierId?: string;
  supplier?: Supplier;
  supplierName?: string;
  warehouseId?: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod?: string;
  status: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface BalanceSheetData {
  previousStockValue: number;
  totalPurchases: number;
  totalSales: number;
  presentStockValue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  customerDues: number;
  supplierDues: number;
  cashInHand: number;
}

export interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  totalProducts: number;
  lowStockCount: number;
  customerReceivable: number;
  supplierPayable: number;
  recentSales: Sale[];
  lowStockProducts: Product[];
}

