import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // -----------------------------
  // USER AUTH
  // -----------------------------
  createUser: (email: string, password: string) =>
    ipcRenderer.invoke('users:create', { email, password }),

  loginUser: (email: string, password: string) =>
    ipcRenderer.invoke('users:login', { email, password }),

  getUsers: () => ipcRenderer.invoke('users:list'),

  // -----------------------------
  // WAREHOUSE
  // -----------------------------
  listWarehouses: () => ipcRenderer.invoke('warehouses:list'),
listWarehouseProducts: (warehouseId: string) =>
  ipcRenderer.invoke('warehouse:listProducts', warehouseId)
,

  createWarehouse: (data: {
    name: string
    location: string
    capacity: string
    description?: string
  }) => ipcRenderer.invoke('warehouses:create', data),

  updateWarehouse: (id: string, data: any) => ipcRenderer.invoke('warehouses:update', { id, data }),

  deleteWarehouse: (id: string) => ipcRenderer.invoke('warehouses:delete', { id }),

  getWarehouse: (id: string) => ipcRenderer.invoke('warehouses:get', { id }),

  // -----------------------------
  // AGENTS
  // -----------------------------
  listAgents: () => ipcRenderer.invoke('agents:list'),

  createAgent: (data: {
    fullName: string
    email: string
    phone: string
    warehouseId: string
    status?: string
  }) => ipcRenderer.invoke('agents:create', data),

  updateAgent: (id: string, data: any) => ipcRenderer.invoke('agents:update', { id, data }),

  deleteAgent: (id: string) => ipcRenderer.invoke('agents:delete', { id }),

  getAgent: (id: string) => ipcRenderer.invoke('agents:get', { id }),

  // -----------------------------
  // CLIENTS (FINAL CUSTOMERS)
  // -----------------------------
  listClients: () => ipcRenderer.invoke('clients:list'),
  getClientStats: () => ipcRenderer.invoke('clients:stats'),

  createClient: (data: { fullName: string; phone: string; email?: string; address?: string }) =>
    ipcRenderer.invoke('clients:create', data),

  updateClient: (id: string, data: any) => ipcRenderer.invoke('clients:update', { id, data }),

  deleteClient: (id: string) => ipcRenderer.invoke('clients:delete', { id }),

  getClient: (id: string) => ipcRenderer.invoke('clients:get', { id }),

  // -----------------------------
  // VENDORS
  // -----------------------------
  listVendors: () => ipcRenderer.invoke('vendors:list'),
  // -----------------------------
  getVendorStats: () => ipcRenderer.invoke('stats:vendor-performance'),

  createVendor: (data: {
    companyName: string
    contactName?: string
    phone?: string
    email?: string
    address?: string
  }) => ipcRenderer.invoke('vendors:create', data),

  updateVendor: (id: string, data: any) => ipcRenderer.invoke('vendors:update', { id, data }),

  deleteVendor: (id: string) => ipcRenderer.invoke('vendors:delete', { id }),

  getVendor: (id: string) => ipcRenderer.invoke('vendors:get', { id }),

  // Connect vendor ⇄ warehouse
  addVendorToWarehouse: (vendorId: string, warehouseId: string) =>
    ipcRenderer.invoke('vendorWarehouse:add', { vendorId, warehouseId }),

  transferStock: (data: any) => ipcRenderer.invoke('warehouse:transferStock', data),
  removeVendorFromWarehouse: (vendorId: string, warehouseId: string) =>
    ipcRenderer.invoke('vendorWarehouse:remove', { vendorId, warehouseId }),

  // -----------------------------
  // PRODUCTS
  // -----------------------------
  listProducts: () => ipcRenderer.invoke('products:list'),

  createProduct: (data: {
    vendorId: string
    name: string
    price: number
    sku?: string
    description?: string
  }) => ipcRenderer.invoke('products:create', data),

  updateProduct: (id: string, data: any) => ipcRenderer.invoke('products:update', { id, data }),

  deleteProduct: (id: string) => ipcRenderer.invoke('products:delete', { id }),

  getProduct: (id: string) => ipcRenderer.invoke('products:get', { id }),

  // -----------------------------
  // INVENTORY
  // -----------------------------
  listInventory: () => ipcRenderer.invoke('inventory:list'),

  createInventory: (data: {
    vendorId: string
    warehouseId: string
    productId: string
    quantity: number
  }) => ipcRenderer.invoke('inventory:set', data),

  updateInventory: (id: string, quantity: number) =>
    ipcRenderer.invoke('inventory:update', { id, quantity }),

  deleteInventory: (id: string) => ipcRenderer.invoke('inventory:delete', { id }),

  getInventory: (id: string) => ipcRenderer.invoke('inventory:get', { id }),

  // -----------------------------
  // DELIVERY ORDERS
  // -----------------------------
  listDeliveryOrders: () => ipcRenderer.invoke('orders:list'),

  createDeliveryOrder: (data: {
    vendorId: string
    productId: string
    quantity: number
    clientId: string
    warehouseId: string
    cost: number
  }) => ipcRenderer.invoke('orders:create', data),
  createClientDeliveryOrder: (data: any) => ipcRenderer.invoke('orders:client_create', data),

  updateDeliveryOrder: (id: string, data: any) => ipcRenderer.invoke('orders:update', { id, data }),

  assignAgent: (orderId: string, agentId: string) =>
    ipcRenderer.invoke('orders:assignAgent', { orderId, agentId }),

  updateDeliveryStatus: (orderId: string, status: string) =>
    ipcRenderer.invoke('orders:status', { orderId, status }),

  deleteDeliveryOrder: (id: string) => ipcRenderer.invoke('orders:delete', { id }),

  getDeliveryOrder: (id: string) => ipcRenderer.invoke('orders:get', { id }),
  // -----------------------------
  // REMITTANCES
  // -----------------------------
  listRemittances: () => ipcRenderer.invoke('remittances:list'),

  createRemittance: (payload: {
    clientId: string
    periodStart: string
    periodEnd: string
    orders: { orderId: string; expectedAmount: number }[]
  }) => ipcRenderer.invoke('remittances:create', payload),

  addRemittancePayment: (payload: {
    remittanceId: string
    amount: number
    method?: string
    reference?: string
    notes?: string
  }) => ipcRenderer.invoke('remittances:add_payment', payload),

  getRemittance: (id: string) => ipcRenderer.invoke('remittances:get', { id }),
  getRemittanceMetrics: () => ipcRenderer.invoke('remittances:metrics'),
  // -----------------------------
  // ACCOUNTING
  // -----------------------------
  getIncomeRecords: (period?: 'daily' | 'weekly' | 'monthly') =>
    ipcRenderer.invoke('accounting:income', period),

  getExpenseRecords: (period?: 'daily' | 'weekly' | 'monthly') =>
    ipcRenderer.invoke('accounting:expenses', period),

  getAccountingSummary: (period?: 'daily' | 'weekly' | 'monthly') =>
    ipcRenderer.invoke('accounting:summary', period),
  createExpense: (data: { type: string; description?: string | undefined; amount: number }) =>
    ipcRenderer.invoke('accounting:createExpense', data),

  // Dashboard

  getDashboardMetrics: () => ipcRenderer.invoke('dashboard:metrics'),
  getDashboardShipmentAnalytics: () => ipcRenderer.invoke('dashboard:shipmentsAnalytics'),
  getDashboardOrdersByLocation: () => ipcRenderer.invoke('dashboard:ordersByLocation'),
  getDashboardRecentEntities: () => ipcRenderer.invoke('dashboard:recentEntities')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
