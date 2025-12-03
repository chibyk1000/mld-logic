import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { db } from './db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
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
  // -------------------- LIST USERS --------------------
  ipcMain.handle('users:list', async () => {
    try {
      const users = db.prepare('SELECT id, email, createdAt, updatedAt FROM "User"').all()
      return ok(users)
    } catch (err) {
      console.error(err)
      return fail('Failed to fetch users')
    }
  })

  // -------------------- CREATE USER --------------------
  ipcMain.handle('users:create', async (_, { email, password }) => {
    try {
      if (!email || !password) return fail('Email & password required')

      const exists = db.prepare('SELECT id FROM "User" WHERE email = ?').get(email)
      if (exists) return fail('User already exists')

      const hashed = await bcrypt.hash(password, 10)
      const result = db
        .prepare('INSERT INTO "User" (id, email, password) VALUES (?, ?, ?)')
        .run(crypto.randomUUID(), email, hashed)

      return ok({ id: result.lastInsertRowid, email })
    } catch (err) {
      console.error(err)
      return fail('Failed to create user')
    }
  })

  // -------------------- LOGIN --------------------
  ipcMain.handle('users:login', async (_, { email, password }) => {
    try {
      const user: any = db
        .prepare('SELECT id, email, password FROM "User" WHERE email = ?')
        .get(email)
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

  // -------------------- LIST WAREHOUSES --------------------
  ipcMain.handle('warehouses:list', async () => {
    try {
      const warehouses = db.prepare('SELECT * FROM "Warehouse"').all()

      // Attach agents, inventories, vendors
      const result = warehouses.map((wh: any) => {
        const agents = db.prepare('SELECT * FROM "Agent" WHERE warehouseId = ?').all(wh.id)
        const inventories = db.prepare('SELECT * FROM "Inventory" WHERE warehouseId = ?').all(wh.id)
        const vendors = db
          .prepare(
            `
        SELECT v.* 
        FROM "Vendor" v
        JOIN "VendorOnWarehouse" vw ON vw.vendorId = v.id
        WHERE vw.warehouseId = ?
      `
          )
          .all(wh.id)
        return { ...wh, agents, inventories, vendors }
      })

      return ok(result)
    } catch (err) {
      console.error(err)
      return fail('Failed to fetch warehouses')
    }
  })

  // -------------------- CREATE WAREHOUSE --------------------
  ipcMain.handle('warehouses:create', async (_, data) => {
    try {
      const id = crypto.randomUUID()
      const stmt = db.prepare(`
      INSERT INTO "Warehouse" (id, name, location, capacity, description, items, status)
      VALUES (?, ?, ?, ?, ?, 0, 'active')
    `)
      stmt.run(id, data.name, data.location, data.capacity, data.description || null)

      const warehouse = db.prepare('SELECT * FROM "Warehouse" WHERE id = ?').get(id)
      return ok(warehouse)
    } catch (err) {
      console.error(err)
      return fail('Failed to create warehouse')
    }
  })

  // -------------------- UPDATE WAREHOUSE --------------------
  ipcMain.handle('warehouses:update', async (_, { id, data }) => {
    try {
      const fields: string[] = []
      const values: any[] = []

      Object.entries(data).forEach(([key, value]) => {
        fields.push(`${key} = ?`)
        values.push(value)
      })

      if (fields.length === 0) return fail('No data to update')

      values.push(id) // for WHERE clause
      const stmt = db.prepare(
        `UPDATE "Warehouse" SET ${fields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
      )
      stmt.run(...values)

      const warehouse = db.prepare('SELECT * FROM "Warehouse" WHERE id = ?').get(id)
      return ok(warehouse)
    } catch (err) {
      console.error(err)
      return fail('Failed to update warehouse')
    }
  })

  // -------------------- GET WAREHOUSE BY ID --------------------
  ipcMain.handle('warehouses:get', async (_, { id }) => {
    try {
      const warehouse = db.prepare('SELECT * FROM "Warehouse" WHERE id = ?').get(id)
      if (!warehouse) return fail('Warehouse not found')

      const agents = db.prepare('SELECT * FROM "Agent" WHERE warehouseId = ?').all(id)
      const inventories = db.prepare('SELECT * FROM "Inventory" WHERE warehouseId = ?').all(id)
      const vendors = db
        .prepare(
          `
      SELECT v.* 
      FROM "Vendor" v
      JOIN "VendorOnWarehouse" vw ON vw.vendorId = v.id
      WHERE vw.warehouseId = ?
    `
        )
        .all(id)

      return ok({ ...warehouse, agents, inventories, vendors })
    } catch (err) {
      console.error(err)
      return fail('Failed to fetch warehouse')
    }
  })

  // -------------------- DELETE WAREHOUSE --------------------
  ipcMain.handle('warehouses:delete', async (_, { id }) => {
    try {
      const stmt = db.prepare('DELETE FROM "Warehouse" WHERE id = ?')
      stmt.run(id)
      return ok(true)
    } catch (err) {
      console.error(err)
      return fail('Failed to delete warehouse')
    }
  })

  //-------------------------------------------------------------
  // AGENTS
  //-------------------------------------------------------------
  // -------------------- LIST AGENTS --------------------
  ipcMain.handle('agents:list', async () => {
    try {
      const agents: any = db.prepare('SELECT * FROM "Agent"').all()

      const result = agents.map((agent) => {
        const warehouse = db
          .prepare('SELECT * FROM "Warehouse" WHERE id = ?')
          .get(agent.warehouseId)
        const deliveryOrders = db
          .prepare('SELECT * FROM "DeliveryOrder" WHERE agentId = ?')
          .all(agent.id)
        return { ...agent, warehouse, deliveryOrders }
      })

      return ok(result)
    } catch (err) {
      console.error(err)
      return fail('Failed to fetch agents')
    }
  })

  // -------------------- CREATE AGENT --------------------
  ipcMain.handle('agents:create', async (_, data) => {
    try {
      const id = crypto.randomUUID()
      const stmt = db.prepare(`
      INSERT INTO "Agent" (id, fullName, email, phone, status, warehouseId)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
      stmt.run(id, data.fullName, data.email, data.phone, data.status || 'active', data.warehouseId)

      const agent: any = db.prepare('SELECT * FROM "Agent" WHERE id = ?').get(id)
      const warehouse = db.prepare('SELECT * FROM "Warehouse" WHERE id = ?').get(agent.warehouseId)

      return ok({ ...agent, warehouse })
    } catch (err) {
      console.error(err)
      return fail('Failed to create agent')
    }
  })

  // -------------------- UPDATE AGENT --------------------
  ipcMain.handle('agents:update', async (_, { id, data }) => {
    try {
      const fields: string[] = []
      const values: any[] = []

      Object.entries(data).forEach(([key, value]) => {
        fields.push(`${key} = ?`)
        values.push(value)
      })

      if (fields.length === 0) return fail('No data to update')

      values.push(id) // for WHERE clause
      const stmt = db.prepare(
        `UPDATE "Agent" SET ${fields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
      )
      stmt.run(...values)

      const agent: any = db.prepare('SELECT * FROM "Agent" WHERE id = ?').get(id)
      const warehouse = db.prepare('SELECT * FROM "Warehouse" WHERE id = ?').get(agent.warehouseId)
      const deliveryOrders = db.prepare('SELECT * FROM "DeliveryOrder" WHERE agentId = ?').all(id)

      return ok({ ...agent, warehouse, deliveryOrders })
    } catch (err) {
      console.error(err)
      return fail('Failed to update agent')
    }
  })

  // -------------------- DELETE AGENT --------------------
  ipcMain.handle('agents:delete', async (_, { id }) => {
    try {
      db.prepare('DELETE FROM "Agent" WHERE id = ?').run(id)
      return ok(true)
    } catch (err) {
      console.error(err)
      return fail('Failed to delete agent')
    }
  })

  //-------------------------------------------------------------
  // CLIENTS
  //-------------------------------------------------------------
  // -------------------- CREATE CLIENT --------------------
  ipcMain.handle('clients:create', async (_, data) => {
    try {
      const id = crypto.randomUUID()
      const stmt = db.prepare(`
      INSERT INTO "Client" (id, fullName, phone, email, address)
      VALUES (?, ?, ?, ?, ?)
    `)
      stmt.run(id, data.fullName, data.phone, data.email || null, data.address || null)

      const client = db.prepare('SELECT * FROM "Client" WHERE id = ?').get(id)
      return ok(client)
    } catch (err) {
      console.error(err)
      return fail('Failed to create client')
    }
  })

  // -------------------- LIST CLIENTS --------------------
  ipcMain.handle('clients:list', async () => {
    try {
      const clients: any = db.prepare('SELECT * FROM "Client"').all()

      const result = clients.map((c) => {
        const deliveryOrders = db
          .prepare('SELECT * FROM "DeliveryOrder" WHERE clientId = ?')
          .all(c.id)
        return { ...c, deliveryOrders }
      })

      return ok(result)
    } catch (err) {
      console.error(err)
      return fail('Failed to list clients')
    }
  })

  // -------------------- UPDATE CLIENT --------------------
  ipcMain.handle('clients:update', async (_, { id, data }) => {
    try {
      const fields: string[] = []
      const values: any[] = []

      Object.entries(data).forEach(([key, value]) => {
        fields.push(`${key} = ?`)
        values.push(value)
      })

      if (fields.length === 0) return fail('No data to update')

      values.push(id)
      const stmt = db.prepare(
        `UPDATE "Client" SET ${fields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
      )
      stmt.run(...values)

      const client: any = db.prepare('SELECT * FROM "Client" WHERE id = ?').get(id)
      const deliveryOrders = db.prepare('SELECT * FROM "DeliveryOrder" WHERE clientId = ?').all(id)

      return ok({ ...client, deliveryOrders })
    } catch (err) {
      console.error(err)
      return fail('Failed to update client')
    }
  })

  // -------------------- DELETE CLIENT --------------------
  ipcMain.handle('clients:delete', async (_, id: string) => {
    try {
      db.prepare('DELETE FROM "Client" WHERE id = ?').run(id)
      return ok(true)
    } catch (err) {
      console.error(err)
      return fail('Failed to delete client')
    }
  })

  //-------------------------------------------------------------
  // VENDORS
  //-------------------------------------------------------------
  // -------------------- CREATE VENDOR --------------------
  ipcMain.handle('vendors:create', async (_, data) => {
    try {
      const id = crypto.randomUUID()
      const stmt = db.prepare(`
      INSERT INTO "Vendor" (id, companyName, contactName, phone, email, address, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
      stmt.run(
        id,
        data.companyName,
        data.contactName || null,
        data.phone || null,
        data.email || null,
        data.address || null,
        data.status || 'active'
      )

      const vendor = db.prepare('SELECT * FROM "Vendor" WHERE id = ?').get(id)
      return ok(vendor)
    } catch (err) {
      console.error(err)
      return fail('Failed to create vendor')
    }
  })

  // -------------------- LIST VENDORS --------------------
  ipcMain.handle('vendors:list', async () => {
    try {
      const vendors: any = db.prepare('SELECT * FROM "Vendor"').all()

      const result = vendors.map((vendor) => {
        // Products
        const products = db.prepare('SELECT * FROM "Product" WHERE vendorId = ?').all(vendor.id)

        // Inventories
        const inventory = db.prepare('SELECT * FROM "Inventory" WHERE vendorId = ?').all(vendor.id)

        // Warehouses via VendorOnWarehouse
        const warehouses = db
          .prepare(
            `
        SELECT w.* 
        FROM "Warehouse" w
        JOIN "VendorOnWarehouse" vw ON vw.warehouseId = w.id
        WHERE vw.vendorId = ?
      `
          )
          .all(vendor.id)

        return { ...vendor, products, inventory, warehouses }
      })

      return ok(result)
    } catch (err) {
      console.error(err)
      return fail('Failed to list vendors')
    }
  })

  // -------------------- UPDATE VENDOR --------------------
  ipcMain.handle('vendors:update', async (_, { id, data }) => {
    try {
      if (!id) return fail('Vendor ID is required')

      const fields: string[] = []
      const values: any[] = []

      Object.entries(data).forEach(([key, value]) => {
        fields.push(`${key} = ?`)
        values.push(value)
      })

      if (fields.length === 0) return fail('No data to update')

      values.push(id)
      db.prepare(
        `UPDATE "Vendor" SET ${fields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(...values)

      const updated = db.prepare('SELECT * FROM "Vendor" WHERE id = ?').get(id)
      if (!updated) return fail('Vendor not found')

      return ok(updated)
    } catch (err) {
      console.error(err)
      return fail('Failed to update vendor')
    }
  })

  // -------------------- DELETE VENDOR --------------------
  ipcMain.handle('vendors:delete', async (_, data: { id: string }) => {
    try {
      if (!data.id) return fail('Vendor ID is required')

      const stmt = db.prepare('DELETE FROM "Vendor" WHERE id = ?')
      const info = stmt.run(data.id)

      if (info.changes === 0) return fail('Vendor not found')

      return ok({ message: 'Vendor deleted successfully' })
    } catch (err) {
      console.error(err)
      return fail('Failed to delete vendor')
    }
  })

  //-------------------------------------------------------------
  // PRODUCTS
  //-------------------------------------------------------------
  // -------------------- CREATE PRODUCT --------------------
  ipcMain.handle('products:create', async (_, data) => {
    try {
      const id = crypto.randomUUID()
      const stmt = db.prepare(`
      INSERT INTO "Product" (id, vendorId, name, description, price, sku)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
      stmt.run(id, data.vendorId, data.name, data.description || null, data.price, data.sku || null)

      const product = db.prepare('SELECT * FROM "Product" WHERE id = ?').get(id)
      return ok(product)
    } catch (err) {
      console.error(err)
      return fail('Failed to create product')
    }
  })

  // -------------------- LIST PRODUCTS --------------------
  ipcMain.handle('products:list', async () => {
    try {
      const products: any = db.prepare('SELECT * FROM "Product"').all()

      const result = products.map((p) => {
        const vendor = db.prepare('SELECT * FROM "Vendor" WHERE id = ?').get(p.vendorId)
        return { ...p, vendor }
      })

      return ok(result)
    } catch (err) {
      console.error(err)
      return fail('Failed to list products')
    }
  })

  //-------------------------------------------------------------
  // INVENTORY
  //-------------------------------------------------------------

  // -------------------- SET / UPSERT INVENTORY --------------------
  ipcMain.handle('inventory:set', async (_, { vendorId, warehouseId, productId, quantity }) => {
    try {
      // Check if inventory already exists
      const existing = db
        .prepare(
          `SELECT * FROM "Inventory" WHERE vendorId = ? AND warehouseId = ? AND productId = ?`
        )
        .get(vendorId, warehouseId, productId)

      if (existing) {
        // Update quantity
        db.prepare(
          `UPDATE "Inventory" SET quantity = ?, updatedAt = CURRENT_TIMESTAMP
           WHERE vendorId = ? AND warehouseId = ? AND productId = ?`
        ).run(quantity, vendorId, warehouseId, productId)
      } else {
        // Insert new record
        const id = crypto.randomUUID()
        db.prepare(
          `INSERT INTO "Inventory" (id, vendorId, warehouseId, productId, quantity)
           VALUES (?, ?, ?, ?, ?)`
        ).run(id, vendorId, warehouseId, productId, quantity)
      }

      // Return the current state of the inventory
      const inv = db
        .prepare(
          `SELECT * FROM "Inventory" WHERE vendorId = ? AND warehouseId = ? AND productId = ?`
        )
        .get(vendorId, warehouseId, productId)

      return ok(inv)
    } catch (err) {
      console.error(err)
      return fail('Failed to set inventory')
    }
  })
  // -------------------- LIST INVENTORY --------------------
  ipcMain.handle('inventory:list', async (_, filters) => {
    try {
      const { vendorId, warehouseId, productId } = filters || {}

      // Build WHERE clause dynamically
      const conditions: string[] = []
      const values: any[] = []

      if (vendorId) {
        conditions.push('vendorId = ?')
        values.push(vendorId)
      }
      if (warehouseId) {
        conditions.push('warehouseId = ?')
        values.push(warehouseId)
      }
      if (productId) {
        conditions.push('productId = ?')
        values.push(productId)
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      const query = `SELECT * FROM "Inventory" ${whereClause} ORDER BY createdAt DESC`

      const inventory: any = db.prepare(query).all(...values)

      // Attach related data
      const result = inventory.map((item) => {
        const vendor = db.prepare('SELECT * FROM "Vendor" WHERE id = ?').get(item.vendorId)
        const product = db.prepare('SELECT * FROM "Product" WHERE id = ?').get(item.productId)
        const warehouse = db.prepare('SELECT * FROM "Warehouse" WHERE id = ?').get(item.warehouseId)
        return { ...item, vendor, product, warehouse }
      })

      return ok(result)
    } catch (err) {
      console.error(err)
      return fail('Failed to list inventory')
    }
  })
  //-------------------------------------------------------------
  // ORDERS
  //-------------------------------------------------------------

  // -------------------- CREATE ORDER --------------------
  ipcMain.handle('orders:create', async (_, data) => {
    try {
      // Validate stock
      const stock: any = db
        .prepare(
          `SELECT * FROM "Inventory" WHERE vendorId = ? AND warehouseId = ? AND productId = ?`
        )
        .get(data.vendorId, data.warehouseId, data.productId)

      if (!stock || stock.quantity < data.quantity) return fail('Insufficient stock')

      // Decrement inventory
      db.prepare(
        `UPDATE "Inventory" SET quantity = quantity - ? WHERE vendorId = ? AND warehouseId = ? AND productId = ?`
      ).run(data.quantity, data.vendorId, data.warehouseId, data.productId)

      // Create order
      const id = crypto.randomUUID()
      db.prepare(
        `INSERT INTO "DeliveryOrder" (id, vendorId, productId, quantity, clientId, agentId, warehouseId, destination, cost, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        data.vendorId || null,
        data.productId || null,
        data.quantity,
        data.clientId || null,
        data.agentId || null,
        data.warehouseId || null,
        data.destination || null,
        data.cost,
        data.status || 'PENDING'
      )

      const order: any = db.prepare('SELECT * FROM "DeliveryOrder" WHERE id = ?').get(id)

      // Attach related entities
      const vendor = order.vendorId
        ? db.prepare('SELECT * FROM "Vendor" WHERE id = ?').get(order.vendorId)
        : null
      const client = order.clientId
        ? db.prepare('SELECT * FROM "Client" WHERE id = ?').get(order.clientId)
        : null
      const product = order.productId
        ? db.prepare('SELECT * FROM "Product" WHERE id = ?').get(order.productId)
        : null
      const agent = order.agentId
        ? db.prepare('SELECT * FROM "Agent" WHERE id = ?').get(order.agentId)
        : null

      return ok({ ...order, vendor, client, product, agent })
    } catch (err) {
      console.error(err)
      return fail('Failed to create order')
    }
  })

  // -------------------- CLIENT CREATE ORDER --------------------
  ipcMain.handle('orders:client_create', async (_, data) => {
    try {
      const id = crypto.randomUUID()
      db.prepare(
        `INSERT INTO "DeliveryOrder" (id, vendorId, productId, quantity, clientId, agentId, warehouseId, destination, cost, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        data.vendorId || null,
        data.productId || null,
        data.quantity,
        data.clientId || null,
        data.agentId || null,
        data.warehouseId || null,
        data.destination || null,
        data.cost,
        data.status || 'PENDING'
      )

      const order: any = db.prepare('SELECT * FROM "DeliveryOrder" WHERE id = ?').get(id)

      // Attach related entities
      const vendor = order.vendorId
        ? db.prepare('SELECT * FROM "Vendor" WHERE id = ?').get(order.vendorId)
        : null
      const client = order.clientId
        ? db.prepare('SELECT * FROM "Client" WHERE id = ?').get(order.clientId)
        : null
      const product = order.productId
        ? db.prepare('SELECT * FROM "Product" WHERE id = ?').get(order.productId)
        : null
      const agent = order.agentId
        ? db.prepare('SELECT * FROM "Agent" WHERE id = ?').get(order.agentId)
        : null

      return ok({ ...order, vendor, client, product, agent })
    } catch (err) {
      console.error(err)
      return fail('Failed to create order')
    }
  })

  // -------------------- LIST ORDERS --------------------
  ipcMain.handle('orders:list', async () => {
    try {
      const orders: any = db.prepare('SELECT * FROM "DeliveryOrder" ORDER BY createdAt DESC').all()

      const result = orders.map((order) => {
        const vendor = order.vendorId
          ? db.prepare('SELECT * FROM "Vendor" WHERE id = ?').get(order.vendorId)
          : null
        const client = order.clientId
          ? db.prepare('SELECT * FROM "Client" WHERE id = ?').get(order.clientId)
          : null
        const product = order.productId
          ? db.prepare('SELECT * FROM "Product" WHERE id = ?').get(order.productId)
          : null
        const agent = order.agentId
          ? db.prepare('SELECT * FROM "Agent" WHERE id = ?').get(order.agentId)
          : null
        return { ...order, vendor, client, product, agent }
      })

      return ok(result)
    } catch (err) {
      console.error(err)
      return fail('Failed to list orders')
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
