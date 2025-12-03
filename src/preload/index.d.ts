import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // -----------------------------
      // USERS
      // -----------------------------
      createUser: (email: string, password: string) => Promise<any>
      loginUser: (email: string, password: string) => Promise<any>
      getUsers: () => Promise<any>

      // -----------------------------
      // WAREHOUSES
      // -----------------------------
      listWarehouses: () => Promise<any>
      createWarehouse: (data: {
        name: string
        location: string
        capacity: string
        description?: string
      }) => Promise<any>
      updateWarehouse: (id: string, data: any) => Promise<any>
      deleteWarehouse: (id: string) => Promise<any>
      getWarehouse: (id: string) => Promise<any>

      // -----------------------------
      // AGENTS
      // -----------------------------
      listAgents: () => Promise<any>
      createAgent: (data: {
        fullName: string
        email: string
        phone: string
        warehouseId: string
        status?: string
      }) => Promise<any>
      updateAgent: (id: string, data: any) => Promise<any>
      deleteAgent: (id: string) => Promise<any>
      getAgent: (id: string) => Promise<any>

      // -----------------------------
      // CLIENTS
      // -----------------------------
      listClients: () => Promise<any>
      createClient: (data: {
        fullName: string
        phone: string
        email?: string
        address?: string
      }) => Promise<any>
      updateClient: (id: string, data: any) => Promise<any>
      deleteClient: (id: string) => Promise<any>
      getClient: (id: string) => Promise<any>

      // -----------------------------
      // VENDORS
      // -----------------------------
      listVendors: () => Promise<any>
      createVendor: (data: {
        companyName: string
        contactName?: string
        phone?: string
        email?: string
        address?: string
      }) => Promise<any>
      updateVendor: (id: string, data: any) => Promise<any>
      deleteVendor: (id: string) => Promise<any>
      getVendor: (id: string) => Promise<any>
      addVendorToWarehouse: (vendorId: string, warehouseId: string) => Promise<any>
      removeVendorFromWarehouse: (vendorId: string, warehouseId: string) => Promise<any>

      // -----------------------------
      // PRODUCTS
      // -----------------------------
      listProducts: () => Promise<any>
      createProduct: (data: {
        vendorId: string
        name: string
        price: number
        sku?: string
        description?: string
      }) => Promise<any>
      updateProduct: (id: string, data: any) => Promise<any>
      deleteProduct: (id: string) => Promise<any>
      getProduct: (id: string) => Promise<any>

      // -----------------------------
      // INVENTORY
      // -----------------------------
      listInventory: () => Promise<any>
      createInventory: (data: {
        vendorId: string
        warehouseId: string
        productId: string
        quantity: number
      }) => Promise<any>
      updateInventory: (id: string, quantity: number) => Promise<any>
      deleteInventory: (id: string) => Promise<any>
      getInventory: (id: string) => Promise<any>

      // -----------------------------
      // DELIVERY ORDERS
      // -----------------------------
      listDeliveryOrders: () => Promise<any>
      createDeliveryOrder: (data: {
        vendorId: string
        productId: string
        quantity: number
        clientId: string
        warehouseId: string
        cost: number
      }) => Promise<any>
      createClientDeliveryOrder: (data: any) => Promise<any>
      updateDeliveryOrder: (id: string, data: any) => Promise<any>
      assignAgent: (orderId: string, agentId: string) => Promise<any>
      updateDeliveryStatus: (orderId: string, status: string) => Promise<any>
      deleteDeliveryOrder: (id: string) => Promise<any>
      getDeliveryOrder: (id: string) => Promise<any>
    }
  }
}
