import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { prisma } from './db'
import bcrypt from 'bcryptjs'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// App ready
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Ping test
  ipcMain.on('ping', () => console.log('pong'))

  //-------------------------------------------------------------
  // UTILS
  //-------------------------------------------------------------
  const ok = (data) => ({ success: true, data })
  const fail = (error) => ({ success: false, error })

  //-------------------------------------------------------------
  // USER
  //-------------------------------------------------------------
  ipcMain.handle('users:list', async () => {
    try {
      const users = await prisma.user.findMany()
      return ok(users)
    } catch (err) {
      console.error(err)
      return fail('Failed to fetch users')
    }
  })

  ipcMain.handle('users:create', async (_, { email, password }) => {
    try {
      if (!email || !password) return fail('Email & password required')

      const exists = await prisma.user.findFirst({ where: { email } })
      if (exists) return fail('User already exists')

      const hashed = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({ data: { email, password: hashed } })

      return ok({ id: user.id, email: user.email })
    } catch (err) {
      console.error(err)
      return fail('Failed to create user')
    }
  })

  ipcMain.handle('users:login', async (_, { email, password }) => {
    try {
      const user = await prisma.user.findFirst({ where: { email } })
      if (!user) return fail('Invalid email or password')

      const valid = await bcrypt.compare(password, user.password)
      if (!valid) return fail('Invalid email or password')

      return ok({ id: user.id, email: user.email })
    } catch (err) {
      console.error(err)
      return fail('Failed to login')
    }
  })

  //-------------------------------------------------------------
  // WAREHOUSES
  //-------------------------------------------------------------
  ipcMain.handle('warehouses:list', async () => {
    try {
      const list = await prisma.warehouse.findMany({
        include: { agents: true, inventories: true, vendors: true }
      })
      return ok(list)
    } catch (err) {
      console.error(err)
      return fail('Failed to fetch warehouses')
    }
  })

  ipcMain.handle('warehouses:create', async (_, data) => {
    try {
      const warehouse = await prisma.warehouse.create({
        data: {
          ...data,
          items: 0,
          status: 'active'
        }
      })
      return ok(warehouse)
    } catch (err) {
      console.error(err)
      return fail('Failed to create warehouse')
    }
  })

  ipcMain.handle('warehouses:update', async (_, { id, data }) => {
    try {
      const w = await prisma.warehouse.update({
        where: { id },
        data
      })
      return ok(w)
    } catch (err) {
      console.error(err)
      return fail('Failed to update warehouse')
    }
  })

  ipcMain.handle('warehouses:get', async (_, { id }) => {
    try {
      const w = await prisma.warehouse.findUnique({
        where: { id },
        include: { agents: true, inventories: true, vendors: true }
      })
      return ok(w)
    } catch (err) {
      console.error(err)
      return fail('Failed to fetch warehouse')
    }
  })

  ipcMain.handle('warehouses:delete', async (_, { id }) => {
    try {
      await prisma.warehouse.delete({ where: { id } })
      return ok(true)
    } catch (err) {
      console.error(err)
      return fail('Failed to delete warehouse')
    }
  })

  //-------------------------------------------------------------
  // AGENTS
  //-------------------------------------------------------------
  ipcMain.handle('agents:list', async () => {
    try {
      const agents = await prisma.agent.findMany({
        include: { warehouse: true, deliveryOrders: true }
      })
      return ok(agents)
    } catch (err) {
      console.error(err)
      return fail('Failed to fetch agents')
    }
  })

  ipcMain.handle('agents:create', async (_, data) => {
    try {
      const agent = await prisma.agent.create({
        data,
        include: { warehouse: true }
      })
      return ok(agent)
    } catch (err) {
      console.error(err)
      return fail('Failed to create agent')
    }
  })

  ipcMain.handle('agents:update', async (_, { id, data }) => {
    console.log(data)

    try {
      const a = await prisma.agent.update({
        where: { id },
        data,
        include: { warehouse: true, deliveryOrders: true }
      })
      return ok(a)
    } catch (err) {
      console.error(err)
      return fail('Failed to update agent')
    }
  })

  ipcMain.handle('agents:delete', async (_, { id }) => {
    try {
      await prisma.agent.delete({ where: { id } })
      return ok(true)
    } catch (err) {
      console.error(err)
      return fail('Failed to delete agent')
    }
  })

  //-------------------------------------------------------------
  // CLIENTS
  //-------------------------------------------------------------
  ipcMain.handle('clients:create', async (_, data) => {
    try {
      const c = await prisma.client.create({ data })
      return ok(c)
    } catch (err) {
      console.error(err)
      return fail('Failed to create client')
    }
  })

  ipcMain.handle('clients:list', async () => {
    try {
      const c = await prisma.client.findMany({
        include: { deliveryOrders: true }
      })
      return ok(c)
    } catch (err) {
      console.error(err)
      return fail('Failed to list clients')
    }
  })

  // Update Client
  ipcMain.handle('clients:update', async (_, { id, data }) => {
    try {
      const c = await prisma.client.update({
        where: { id },
        data
      })
      return ok(c)
    } catch (err) {
      console.error(err)
      return fail('Failed to update client')
    }
  })

  // Delete Client
  ipcMain.handle('clients:delete', async (_, id: string) => {
    try {
      const c = await prisma.client.delete({
        where: { id }
      })
      return ok(c)
    } catch (err) {
      console.error(err)
      return fail('Failed to delete client')
    }
  })
  //-------------------------------------------------------------
  // VENDORS
  //-------------------------------------------------------------
  ipcMain.handle('vendors:create', async (_, data) => {
    try {
      const v = await prisma.vendor.create({ data })
      return ok(v)
    } catch (err) {
      console.error(err)
      return fail('Failed to create vendor')
    }
  })

  ipcMain.handle('vendors:list', async () => {
    try {
      const v = await prisma.vendor.findMany({
        include: {
          products: true,
          warehouses: true,
          inventory: true
        }
      })
      return ok(v)
    } catch (err) {
      console.error(err)
      return fail('Failed to list vendors')
    }
  })
  ipcMain.handle('vendors:update', async (_, { id, data }) => {
    try {
      if (!id) return fail('Vendor ID is required')

      const updated = await prisma.vendor.update({
        where: { id },
        data
      })

      return ok(updated)
    } catch (err: any) {
      console.error(err)

      if (err.code === 'P2025') {
        return fail('Vendor not found')
      }

      return fail('Failed to update vendor')
    }
  })

  // DELETE VENDOR
  ipcMain.handle('vendors:delete', async (_, data: { id: string }) => {
    try {
      if (!data.id) return fail('Vendor ID is required')
      console.log(data.id)
      await prisma.vendor.delete({ where: { id: data.id } })

      return ok({ message: 'Vendor deleted successfully' })
    } catch (err: any) {
      console.error(err)

      if (err.code === 'P2025') return fail('Vendor not found')

      return fail('Failed to delete vendor')
    }
  })

  //-------------------------------------------------------------
  // PRODUCTS
  //-------------------------------------------------------------
  ipcMain.handle('products:create', async (_, data) => {
    try {
      const p = await prisma.product.create({ data })
      return ok(p)
    } catch (err) {
      console.error(err)
      return fail('Failed to create product')
    }
  })

  ipcMain.handle('products:list', async () => {
    try {
      const p = await prisma.product.findMany({
        include: { vendor: true }
      })
      return ok(p)
    } catch (err) {
      console.error(err)
      return fail('Failed to list products')
    }
  })

  //-------------------------------------------------------------
  // INVENTORY
  //-------------------------------------------------------------

  //-------------------------------------------------------------
  // ORDERS
  //-------------------------------------------------------------
  ipcMain.handle('orders:create', async (_, data) => {
    try {
      // Validate stock
      const stock = await prisma.inventory.findUnique({
        where: {
          vendorId_warehouseId_productId: {
            vendorId: data.vendorId,
            warehouseId: data.warehouseId,
            productId: data.productId
          }
        }
      })
  

      if (!stock || stock.quantity < data.quantity) return fail('Insufficient stock')

      // Decrement inventory
      await prisma.inventory.update({
        where: {
          vendorId_warehouseId_productId: {
            vendorId: data.vendorId,
            warehouseId: data.warehouseId,
            productId: data.productId
          }
        },
        data: {
          quantity: { decrement: data.quantity }
        }
      })

      const order = await prisma.deliveryOrder.create({
        data,
        include: {
          vendor: true,
          client: true,
          product: true,
          agent: true
        }
      })

      return ok(order)
    } catch (err) {
      console.error(err)
      return fail('Failed to create order')
    }
  })
  ipcMain.handle('orders:client_create', async (_, data) => {
    try {

      const order = await prisma.deliveryOrder.create({
        data,
        include: {
          vendor: true,
          client: true,
          product: true,
          agent: true
        }
      })

      return ok(order)
    } catch (err) {
      console.error(err)
      return fail('Failed to create order')
    }
  })
  ipcMain.handle('orders:list', async (_, ) => {
    try {



      const orders = await prisma.deliveryOrder.findMany({
      
        include: {
          vendor: true,
          client: true,
          product: true,
          agent: true
        }
      })

      return ok(orders)
    } catch (err) {
      console.error(err)
      return fail('Failed to create order')
    }
  })
  ipcMain.handle('inventory:list', async (_, filters) => {
    try {
      const { vendorId, warehouseId, productId } = filters || {}

      const inv = await prisma.inventory.findMany({
        where: {
          ...(vendorId && { vendorId }),
          ...(warehouseId && { warehouseId }),
          ...(productId && { productId })
        },
        include: {
          vendor: true,
          product: true,
          warehouse: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return ok(inv)
    } catch (err) {
      console.error(err)
      return fail('Failed to list inventory')
    }
  })

  //-------------------------------------------------------------
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
