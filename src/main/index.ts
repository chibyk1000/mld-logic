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
    ...(process.platform === 'linux' ? { icon } : {icon}),
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

  // -------------------- CLIENTS GLOBAL STATS --------------------
  ipcMain.handle('clients:stats', async () => {
    try {
      // ===== BASE TOTALS =====
      const orders: any[] = db
        .prepare(`SELECT * FROM "DeliveryOrder" WHERE clientId IS NOT NULL`)
        .all()

      const totalRequested = orders.length
      const totalDelivered = orders.filter((o) =>
        ['completed', 'delivered'].includes(o.status.toLowerCase())
      ).length
      const totalFailed = orders.filter((o) =>
        ['failed', 'cancelled'].includes(o.status.toLowerCase())
      ).length
      const totalRevenue = orders.reduce(
        (sum, o) => sum + (o.serviceCharge || 0) + (o.additionalCharge || 0),
        0
      )

      const successRate =
        totalRequested > 0 ? Number(((totalDelivered / totalRequested) * 100).toFixed(1)) : 0

      // ===== WEEKLY (LAST 4 WEEKS) =====
      const weekly: any[] = db
        .prepare(
          `
      SELECT 
        strftime('%W', createdAt) AS week,
        COUNT(*) AS requested,
        SUM(CASE WHEN LOWER(status) IN ('completed','delivered') THEN 1 ELSE 0 END) AS delivered,
        SUM(CASE WHEN LOWER(status) IN ('failed','cancelled') THEN 1 ELSE 0 END) AS failed
      FROM "DeliveryOrder"
      WHERE createdAt >= date('now', '-28 days')
        AND clientId IS NOT NULL
      GROUP BY week
      ORDER BY week ASC
      `
        )
        .all()

      const weeklyData = weekly.map((w, i) => ({
        period: `Week ${i + 1}`,
        requested: w.requested || 0,
        delivered: w.delivered || 0,
        failed: w.failed || 0
      }))

      while (weeklyData.length < 4) {
        weeklyData.push({
          period: `Week ${weeklyData.length + 1}`,
          requested: 0,
          delivered: 0,
          failed: 0
        })
      }

      // ===== MONTHLY (LAST 6 MONTHS) =====
      const monthly: any[] = db
        .prepare(
          `
      SELECT 
        CAST(strftime('%m', createdAt) AS INTEGER) AS month,
        COUNT(*) AS requested,
        SUM(CASE WHEN LOWER(status) IN ('completed','delivered') THEN 1 ELSE 0 END) AS delivered,
        SUM(CASE WHEN LOWER(status) IN ('failed','cancelled') THEN 1 ELSE 0 END) AS failed
      FROM "DeliveryOrder"
      WHERE createdAt >= date('now', '-6 months')
        AND clientId IS NOT NULL
      GROUP BY month
      ORDER BY month ASC
      `
        )
        .all()

      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ]

      const monthlyData = monthNames.slice(0, 6).map((m, i) => {
        const row = monthly.find((r) => Number(r.month) === i + 1)
        return {
          period: m,
          requested: row?.requested || 0,
          delivered: row?.delivered || 0,
          failed: row?.failed || 0
        }
      })

      // ===== RETURN ALL STATS =====
      return ok({
        totals: {
          totalRequested,
          totalDelivered,
          totalFailed,
          totalRevenue,
          successRate
        },
        weekly: weeklyData,
        monthly: monthlyData
      })
    } catch (err) {
      console.error(err)
      return fail('Failed to compute client stats')
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
        const orders = db.prepare('SELECT * FROM "DeliveryOrder" WHERE vendorId = ?').all(vendor.id)

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

        return { ...vendor, products, inventory, warehouses, orders }
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

  // -------------------- STATS --------------------

  ipcMain.handle('stats:vendor-performance', async () => {
    try {
      // ---------- WEEKLY (LAST 4 WEEKS) ----------
      const weeklyRaw: any = db
        .prepare(
          `
      SELECT 
        'Week ' || (
          (strftime('%W', createdAt) - strftime('%W', date('now', '-28 days'))) + 1
        ) AS period,
        COUNT(*) AS requested,
        SUM(CASE WHEN status IN ('completed','delivered') THEN 1 ELSE 0 END) AS delivered,
        SUM(CASE WHEN status IN ('failed','cancelled') THEN 1 ELSE 0 END) AS failed
      FROM "DeliveryOrder"
      WHERE createdAt >= date('now', '-28 days')
      GROUP BY period
      ORDER BY period ASC
      `
        )
        .all()

      // Ensure 4 rows (Week 1 → Week 4)
      const weekly = Array.from({ length: 4 }, (_, i) => {
        const label = `Week ${i + 1}`
        const row: any = weeklyRaw.find((r) => r.period === label)
        return {
          period: label,
          requested: row?.requested || 0,
          delivered: row?.delivered || 0,
          failed: row?.failed || 0
        }
      })

      // ---------- MONTHLY (LAST 12 MONTHS) ----------
      const monthlyRaw: any = db
        .prepare(
          `
      SELECT 
        strftime('%m', createdAt) AS month,
        COUNT(*) AS requested,
        SUM(CASE WHEN status IN ('completed','delivered') THEN 1 ELSE 0 END) AS delivered,
        SUM(CASE WHEN status IN ('failed','cancelled') THEN 1 ELSE 0 END) AS failed
      FROM "DeliveryOrder"
      WHERE createdAt >= date('now', '-12 months')
      GROUP BY month
      ORDER BY month ASC
      `
        )
        .all()

      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ]

      const monthly = monthNames.map((m, i) => {
        const row: any = monthlyRaw.find((r) => Number(r.month) === i + 1)
        return {
          period: m,
          requested: row?.requested || 0,
          delivered: row?.delivered || 0,
          failed: row?.failed || 0
        }
      })

      // ----- Return final stats -----
      return ok({
        weekly,
        monthly
      })
    } catch (err) {
      console.error(err)
      return fail('Failed to load vendor performance stats')
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

      // --- Dynamic WHERE clause ---
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

      const inventory: any[] = db.prepare(query).all(...values)

      // --- Attach related data ---
      const result = inventory.map((item) => {
        const vendor = db.prepare('SELECT * FROM "Vendor" WHERE id = ?').get(item.vendorId)
        const product = db.prepare('SELECT * FROM "Product" WHERE id = ?').get(item.productId)
        const warehouse = db.prepare('SELECT * FROM "Warehouse" WHERE id = ?').get(item.warehouseId)
        return { ...item, vendor, product, warehouse }
      })

      // -----------------------------
      //     INVENTORY STATISTICS
      // -----------------------------
      const totalItemsInStock = inventory.reduce((sum, item) => sum + item.quantity, 0)

      const LOW_STOCK_THRESHOLD = 10

      const lowStockItems = inventory.filter((item) => item.quantity <= LOW_STOCK_THRESHOLD).length

      // Return combined result
      return ok({
        items: result,
        stats: {
          totalItemsInStock,
          lowStockItems,
          threshold: LOW_STOCK_THRESHOLD
        }
      })
    } catch (err) {
      console.error(err)
      return fail('Failed to list inventory')
    }
  })

  // In your main process (e.g., index.ts)
ipcMain.handle('warehouse:listProducts', (_, warehouseId: string) => {
  try {

    console.log('Listing products for warehouseId:', warehouseId)
    if (!warehouseId) {
     return fail('warehouseId is required')
    }

    const products = db
      .prepare(
        `
        SELECT 
          p.id AS productId,
          p.name AS productName,
          p.price,
          i.quantity
        FROM "Inventory" i
        INNER JOIN "Product" p ON p.id = i.productId
        WHERE i.warehouseId = ?
      `
      )
      .all(warehouseId) // ✅ pass warehouseId as parameter

    return { data: products }
  } catch (err) {
    console.error('Failed to list warehouse products:', err)
    return { error: 'Failed to list warehouse products' }
  }
})




ipcMain.handle(
  'warehouse:transferStock',
  (
    _,
    payload: {
      fromWarehouseId: string
      toWarehouseId: string
      products: { id: string; quantity: number }[]
      note?: string
    }
  ) => {
    const { fromWarehouseId, toWarehouseId, products, note } = payload

    try {
      for (const product of products) {
        const { id: productId, quantity } = product

        // Check source inventory
        const fromInventory: any = db
          .prepare(`SELECT quantity FROM "Inventory" WHERE warehouseId = ? AND productId = ?`)
          .get(fromWarehouseId, productId)

        if (!fromInventory || fromInventory.quantity < quantity) {
          return { error: `Insufficient stock for product ${productId}` }
        }

        // Deduct from source
        db.prepare(
          `UPDATE "Inventory" SET quantity = quantity - ? WHERE warehouseId = ? AND productId = ?`
        ).run(quantity, fromWarehouseId, productId)

        // Add to destination (insert if doesn't exist)
        const destExists = db
          .prepare(`SELECT quantity FROM "Inventory" WHERE warehouseId = ? AND productId = ?`)
          .get(toWarehouseId, productId)

        if (destExists) {
          db.prepare(
            `UPDATE "Inventory" SET quantity = quantity + ? WHERE warehouseId = ? AND productId = ?`
          ).run(quantity, toWarehouseId, productId)
        } else {
          // Get vendorId from source inventory
          const vendor:any =
            db
              .prepare(`SELECT vendorId FROM "Inventory" WHERE warehouseId = ? AND productId = ?`)
              .get(fromWarehouseId, productId)

          db.prepare(
            `INSERT INTO "Inventory"(id, vendorId, warehouseId, productId, quantity) VALUES (?, ?, ?, ?, ?)`
          ).run(crypto.randomUUID(), vendor.vendorId, toWarehouseId, productId, quantity)
        }

        // Log transfer
        db.prepare(
          `INSERT INTO "StockTransferLog"(id, productId, fromWarehouseId, toWarehouseId, quantity, note) VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
          crypto.randomUUID(),
          productId,
          fromWarehouseId,
          toWarehouseId,
          quantity,
          note || null
        )
      }

      return { success: true }
    } catch (err) {
      console.error('Failed to transfer stock:', err)
      return { error: 'Failed to transfer stock' }
    }
  }
)



  //-------------------------------------------------------------
  // ORDERS
  //-------------------------------------------------------------

  // -------------------- CREATE ORDER --------------------
  ipcMain.handle('orders:create', async (_, data) => {
    try {
      const products = data.productIds || [] // array of product IDs
      const quantities = data.quantity || {} // { productId: number }

      if (!Array.isArray(products) || products.length === 0) {
        return fail('Products array is required')
      }

      // ——————————————————————————
      // STEP 1: Validate stock for *each* product
      // ——————————————————————————
      for (const productId of products) {
        const qty = Number(quantities[productId] || 1)

        const stock: any = db
          .prepare(
            `SELECT * FROM "Inventory" 
           WHERE vendorId = ? 
           AND warehouseId = ? 
           AND productId = ?`
          )
          .get(data.vendorId, data.warehouseId, productId)

        if (!stock || stock.quantity < qty) {
          return fail(`Insufficient stock for product: ${productId}`)
        }
      }

      // ——————————————————————————
      // STEP 2: Decrement stock for each product
      // ——————————————————————————
      for (const productId of products) {
        const qty = Number(quantities[productId] || 1)

        db.prepare(
          `UPDATE "Inventory" 
         SET quantity = quantity - ? 
         WHERE vendorId = ? 
         AND warehouseId = ? 
         AND productId = ?`
        ).run(qty, data.vendorId, data.warehouseId, productId)
      }

      // ——————————————————————————
      // STEP 3: Create DeliveryOrder (NO productId here)
      // ——————————————————————————
      const orderId = crypto.randomUUID()

      db.prepare(
        `INSERT INTO "DeliveryOrder" (
        id, vendorId, clientId, agentId, warehouseId,
        pickupContactName, pickupContactPhone, pickupInstructions,
        deliveryContactName, deliveryContactPhone, deliveryContactEmail,
        deliveryInstructions, deliveryAddress,
        serviceCharge, amountReceived, additionalCharge,
        collectPayment, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        orderId,
        data.vendorId || null,
        data.clientId || null,
        data.agentId || null,
        data.warehouseId || null,

        data.pickupContactName || null,
        data.pickupContactPhone || null,
        data.pickupInstructions || null,

        data.deliveryContactName || null,
        data.deliveryContactPhone || null,
        data.deliveryContactEmail || null,
        data.deliveryInstructions || null,
        data.deliveryAddress || null,

        data.serviceCharge || 0,
        data.amountReceived || 0,
        data.additionalCharge || 0,

        data.collectPayment ? 1 : 0,
        'PENDING'
      )

      // ——————————————————————————
      // STEP 4: Insert products into DeliveryOrderProduct
      // ——————————————————————————
      for (const productId of products) {
        const qty = Number(quantities[productId] || 1)

        db.prepare(
          `INSERT INTO "DeliveryOrderProduct" (id, orderId, productId, quantity)
         VALUES (?, ?, ?, ?)`
        ).run(crypto.randomUUID(), orderId, productId, qty)
      }

      // ——————————————————————————
      // STEP 5: Fetch related entities
      // ——————————————————————————
      const order: any = db.prepare(`SELECT * FROM "DeliveryOrder" WHERE id = ?`).get(orderId)

      const vendor = order.vendorId
        ? db.prepare(`SELECT * FROM "Vendor" WHERE id = ?`).get(order.vendorId)
        : null

      const client = order.clientId
        ? db.prepare(`SELECT * FROM "Client" WHERE id = ?`).get(order.clientId)
        : null

      const agent = order.agentId
        ? db.prepare(`SELECT * FROM "Agent" WHERE id = ?`).get(order.agentId)
        : null

      // Fetch attached products
      const orderProducts = db
        .prepare(
          `SELECT p.*, dop.quantity
         FROM "DeliveryOrderProduct" dop
         JOIN "Product" p ON p.id = dop.productId
         WHERE dop.orderId = ?`
        )
        .all(orderId)

      // ——————————————————————————
      // STEP 6: Remittance linking
      // ——————————————————————————
      if (order.vendorId || order.clientId) {
        let remittance: any = db
          .prepare(
            `SELECT * FROM "Remittance"
           WHERE vendorId = ? 
           AND status = 'PENDING'
           ORDER BY createdAt DESC LIMIT 1`
          )
          .get(order.vendorId || null)

        if (!remittance) {
          const remId = crypto.randomUUID()
          db.prepare(
            `INSERT INTO "Remittance" (id, vendorId, status)
           VALUES (?, ?, 'PENDING')`
          ).run(remId, order.vendorId || null)

          remittance = db.prepare(`SELECT * FROM "Remittance" WHERE id = ?`).get(remId)
        }

        const roId = crypto.randomUUID()

        db.prepare(
          `INSERT INTO "RemittanceOrder" 
         (id, remittanceId, orderId, amountCharged, receivedAmount)
         VALUES (?, ?, ?, ?, ?)`
        ).run(roId, remittance.id, orderId, order.serviceCharge || 0, order.amountReceived || 0)
      }

      return ok({
        ...order,
        vendor,
        client,
        agent,
        products: orderProducts
      })
    } catch (err) {
      console.log(err)
      return fail('Failed to create order')
    }
  })

  // -------------------- CLIENT CREATE ORDER --------------------
  ipcMain.handle('orders:client_create', async (_, data) => {
    try {
      const id = crypto.randomUUID()

      db.prepare(
        `
      INSERT INTO "DeliveryOrder" (
        id,
        vendorId,
        clientId,
        agentId,
        warehouseId,

        serviceCharge,
        amountReceived,

        pickupContactName,
        pickupContactPhone,
        pickupInstructions,

        deliveryContactName,
        deliveryContactPhone,
        deliveryContactEmail,
        deliveryInstructions,
        deliveryAddress,

        collectPayment,
        additionalCharge,

        status,
        createdAt,
        updatedAt
      )
      VALUES (
        ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?,
        'PENDING',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      `
      ).run(
        id,
        data.vendorId || null,
        data.clientId,
        data.agentId || null,
        data.warehouseId || null,

        // Pricing (order-level, NOT accounting source)
        data.serviceCharge ?? 0,
        data.amountReceived ?? 0,

        // Pickup
        data.pickupContactName || null,
        data.pickupContactPhone || null,
        data.pickupInstructions || null,

        // Delivery
        data.deliveryContactName || null,
        data.deliveryContactPhone || null,
        data.deliveryContactEmail || null,
        data.deliveryInstructions || null,
        data.deliveryAddress || null,

        // Payment
        data.collectPayment ? 1 : 0,
        data.additionalCharge ?? 0
      )

      const order: any = db.prepare(`SELECT * FROM "DeliveryOrder" WHERE id = ?`).get(id)

      const client = order.clientId
        ? db.prepare(`SELECT * FROM "Client" WHERE id = ?`).get(order.clientId)
        : null

      return ok({
        ...order,
        client
      })
    } catch (err) {
      console.error(err)
      return fail('Failed to create order')
    }
  })

  // -------------------- LIST ORDERS --------------------
  ipcMain.handle('orders:list', async () => {
    try {
      const orders = db.prepare(`SELECT * FROM "DeliveryOrder" ORDER BY createdAt DESC`).all()

      const result = orders.map((order: any) => {
        const vendor = order.vendorId
          ? db.prepare(`SELECT * FROM "Vendor" WHERE id = ?`).get(order.vendorId)
          : null

        const client = order.clientId
          ? db.prepare(`SELECT * FROM "Client" WHERE id = ?`).get(order.clientId)
          : null

        const product = order.productId
          ? db.prepare(`SELECT * FROM "Product" WHERE id = ?`).get(order.productId)
          : null

        const agent = order.agentId
          ? db.prepare(`SELECT * FROM "Agent" WHERE id = ?`).get(order.agentId)
          : null

        // ✅ Correct remittance lookup
        const remittance = db
          .prepare(
            `
          SELECT 
            r.*,
            ro.amountCharged,
            ro.receivedAmount
          FROM "RemittanceOrder" ro
          JOIN "Remittance" r ON r.id = ro.remittanceId
          WHERE ro.orderId = ?
        `
          )
          .get(order.id)

        return {
          ...order,
          vendor,
          client,
          product,
          agent,
          remittance: remittance ?? null
        }
      })

      return ok(result)
    } catch (err) {
      console.error(err)
      return fail('Failed to list orders')
    }
  })

  //------------------------------Assign Orders-------------------------------

  ipcMain.handle('orders:assignAgent', async (_event, { orderId, agentId }) => {
    try {
      // If setting to Unassigned → store NULL
      const normalizedAgentId = agentId === 'Unassigned' ? null : agentId

      db.prepare(
        `UPDATE "DeliveryOrder"
       SET agentId = ?
       WHERE id = ?`
      ).run(normalizedAgentId, orderId)

      // Return updated order
      const updatedOrder = db.prepare('SELECT * FROM "DeliveryOrder" WHERE id = ?').get(orderId)

      return ok(updatedOrder)
    } catch (err) {
      console.error('Assign Agent Error:', err)
      return fail('Failed to assign agent')
    }
  })

  //-------------------------------------------------------------
  // REMITTANCES
  //-------------------------------------------------------------

  // -------------------- LIST REMITTANCES --------------------
  ipcMain.handle('remittances:list', async () => {
    try {
      const remittances = db
        .prepare(
          `
        SELECT 
          r.*,
          v.companyName AS vendorName
        FROM "Remittance" r
        LEFT JOIN "Vendor" v ON v.id = r.vendorId
        ORDER BY r.createdAt DESC
        `
        )
        .all()

      const result = remittances.map((r: any) => {
        const orders: any = db
          .prepare(
            `
          SELECT 
            ro.orderId,
            ro.amountCharged,
            ro.receivedAmount
          FROM "RemittanceOrder" ro
          WHERE ro.remittanceId = ?
          `
          )
          .all(r.id)

        const totalCharged = orders.reduce((sum, o) => sum + (o.amountCharged || 0), 0)

        const totalReceived = orders.reduce((sum, o) => sum + (o.receivedAmount || 0), 0)

        const amountLeft = totalReceived - totalCharged

        return {
          ...r,
          orders,
          orderCount: orders.length,
          totalCharged: totalCharged.toFixed(2),
          totalReceived: totalReceived.toFixed(2),
          amountLeft: amountLeft.toFixed(2)
        }
      })

      return ok(result)
    } catch (err) {
      console.error(err)
      return fail('Failed to list remittances')
    }
  })

  // -------------------- CREATE REMITTANCE --------------------
  ipcMain.handle('remittances:create', async (_, { vendorId, orders }) => {
    try {
      if (!orders || !orders.length) {
        return fail('No orders provided')
      }

      const remittanceId = crypto.randomUUID()

      db.transaction(() => {
        /** 1️⃣ Create remittance */
        db.prepare(
          `
          INSERT INTO "Remittance" (id, vendorId, status)
          VALUES (?, ?, 'PENDING')
          `
        ).run(remittanceId, vendorId || null)

        /** 2️⃣ Attach orders */
        for (const o of orders) {
          if (!o.orderId || typeof o.amountCharged !== 'number') {
            throw new Error('Invalid order payload')
          }

          db.prepare(
            `
            INSERT INTO "RemittanceOrder"
              (id, remittanceId, orderId, amountCharged, receivedAmount)
            VALUES (?, ?, ?, ?, 0)
            `
          ).run(crypto.randomUUID(), remittanceId, o.orderId, o.amountCharged)
        }
      })()

      /** 3️⃣ Return created remittance (summary) */
      const remittance = db
        .prepare(
          `
          SELECT
            r.*,
            COUNT(ro.id) AS orderCount,
            COALESCE(SUM(ro.amountCharged), 0) AS totalCharged
          FROM "Remittance" r
          LEFT JOIN "RemittanceOrder" ro ON ro.remittanceId = r.id
          WHERE r.id = ?
          GROUP BY r.id
          `
        )
        .get(remittanceId)

      return ok(remittance)
    } catch (err: any) {
      console.error(err)
      return fail(err.message || 'Failed to create remittance')
    }
  })

  // -------------------- ADD PAYMENT TO REMITTANCE --------------------
  ipcMain.handle(
    'remittances:add_payment',
    async (_, { remittanceId, vendorId, amount, method, reference, notes }) => {
      try {
        const paymentId = crypto.randomUUID()

        db.transaction(() => {
          /** 1️⃣ Validate remittance + vendor */
          const remittance: any = db
            .prepare(`SELECT vendorId FROM "Remittance" WHERE id = ?`)
            .get(remittanceId)

          if (!remittance) {
            throw new Error('Remittance not found')
          }

          if (remittance.vendorId && remittance.vendorId !== vendorId) {
            throw new Error('Vendor does not match remittance vendor')
          }

          /** 2️⃣ Insert payment */
          db.prepare(
            `
          INSERT INTO "RemittancePayment"
            (id, remittanceId, vendorId, amount, method, reference, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `
          ).run(
            paymentId,
            remittanceId,
            vendorId,
            amount,
            method || null,
            reference || null,
            notes || null
          )

          /** 3️⃣ Fetch unpaid orders */
          const orders: any = db
            .prepare(
              `
          SELECT id, amountCharged, receivedAmount
          FROM "RemittanceOrder"
          WHERE remittanceId = ?
          ORDER BY createdAt ASC
          `
            )
            .all(remittanceId)

          let remaining = amount

          /** 4️⃣ Allocate payment */
          for (const order of orders) {
            if (remaining <= 0) break

            const balance = order.amountCharged - order.receivedAmount

            if (balance <= 0) continue

            const applied = Math.min(balance, remaining)

            db.prepare(
              `
            UPDATE "RemittanceOrder"
            SET receivedAmount = receivedAmount + ?
            WHERE id = ?
            `
            ).run(applied, order.id)

            remaining -= applied
          }

          /** 5️⃣ Recalculate remittance status */
          const totals: any = db
            .prepare(
              `
          SELECT
            COALESCE(SUM(amountCharged), 0) AS totalCharged,
            COALESCE(SUM(receivedAmount), 0) AS totalReceived
          FROM "RemittanceOrder"
          WHERE remittanceId = ?
          `
            )
            .get(remittanceId)

          let status: 'PENDING' | 'PARTIAL' | 'PAID' = 'PENDING'

          if (totals.totalCharged > 0 && totals.totalReceived >= totals.totalCharged) {
            status = 'PAID'
          } else if (totals.totalReceived > 0) {
            status = 'PARTIAL'
          }

          db.prepare(
            `
          UPDATE "Remittance"
          SET status = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
          `
          ).run(status, remittanceId)
        })()

        return ok({
          paymentId,
          remittanceId,
          vendorId,
          amount,
          message: 'Payment recorded successfully'
        })
      } catch (err: any) {
        console.error(err)
        return fail(err.message || 'Failed to add payment')
      }
    }
  )

  // -------------------- GET REMITTANCE BY ID --------------------
  ipcMain.handle('remittances:get', async (_, { id }) => {
    try {
      /** 1️⃣ Remittance core */
      const remittance = db
        .prepare(
          `
        SELECT
          r.*,
          v.companyName AS vendorName
        FROM "Remittance" r
        LEFT JOIN "Vendor" v ON v.id = r.vendorId
        WHERE r.id = ?
        `
        )
        .get(id)

      if (!remittance) return fail('Remittance not found')

      /** 2️⃣ Orders under this remittance */
      const orders: any = db
        .prepare(
          `
        SELECT
          ro.id,
          ro.orderId,
          ro.amountCharged,
          ro.receivedAmount,
          ro.createdAt
        FROM "RemittanceOrder" ro
        WHERE ro.remittanceId = ?
        ORDER BY ro.createdAt ASC
        `
        )
        .all(id)

      /** 3️⃣ Payments */
      const payments = db
        .prepare(
          `
        SELECT
          id,
          vendorId,
          amount,
          method,
          reference,
          notes,
          createdAt
        FROM "RemittancePayment"
        WHERE remittanceId = ?
        ORDER BY createdAt ASC
        `
        )
        .all(id)

      /** 4️⃣ Totals (derived, not stored) */
      const totalCharged: any = orders.reduce((sum, o) => sum + (o.amountCharged || 0), 0)

      const totalReceived: any = orders.reduce((sum, o) => sum + (o.receivedAmount || 0), 0)

      return ok({
        ...remittance,
        orders,
        payments,
        summary: {
          orderCount: orders.length,
          totalCharged: totalCharged.toFixed(2),
          totalReceived: totalReceived.toFixed(2),
          amountLeft: (totalCharged - totalReceived).toFixed(2)
        }
      })
    } catch (err) {
      console.error(err)
      return fail('Failed to get remittance')
    }
  })

  // -------------------- DELETE REMITTANCE --------------------
  ipcMain.handle('remittances:delete', async (_, { id }) => {
    try {
      db.prepare('DELETE FROM "Remittance" WHERE id = ?').run(id)
      return ok(true)
    } catch (err) {
      console.error(err)
      return fail('Failed to delete remittance')
    }
  })

  ipcMain.handle('remittances:metrics', () => {
    try {
      // =========================
      // 1. TOTAL PENDING
      // =========================
      const totalPending: any = db
        .prepare(
          `
    SELECT
      COALESCE(SUM(ro.receivedAmount-ro.amountCharged), 0) AS pending
    FROM "RemittanceOrder" ro
    INNER JOIN "DeliveryOrder" o ON o.id = ro.orderId
    WHERE o.vendorId IS NOT NULL
      AND o.status NOT IN ('CANCELLED', 'COMPLETED', 'DELIVERED')
    `
        )
        .get()

      // =========================
      // 2. COMPLETED THIS MONTH
      // =========================
      const completedThisMonth: any = db
        .prepare(
          `
    SELECT
      COALESCE(SUM(serviceCharge + additionalCharge), 0) AS total
    FROM "DeliveryOrder"
    WHERE vendorId IS NOT NULL
      AND status IN ('COMPLETED', 'DELIVERED')
      AND strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now')
    `
        )
        .get()

      // =========================
      // 3. SERVICE FEES EARNED
      // (Client orders only)
      // =========================
      const serviceFees: any = db
        .prepare(
          `
    SELECT
      COALESCE(SUM(serviceCharge + additionalCharge), 0) AS total
    FROM "DeliveryOrder"
    WHERE vendorId IS NOT NULL
      AND status IN ('COMPLETED', 'DELIVERED')
    `
        )
        .get()

      return {
        totalPending: totalPending.pending ?? 0,
        completedThisMonth: completedThisMonth.total ?? 0,
        serviceFees: serviceFees.total ?? 0
      }
    } catch (error) {
      console.error('Accounting metrics error:', error)
      throw error
    }
  })

  // --- Income Records ---
  ipcMain.handle('accounting:income', (_, period?: 'daily' | 'weekly' | 'monthly') => {
    try {
      // =====================
      // DATE FILTERS (INLINE)
      // =====================
      let orderDateFilter = ''
      let remittanceDateFilter = ''

      switch (period) {
        case 'daily':
          orderDateFilter = `AND o.createdAt >= date('now', 'start of day')`
          remittanceDateFilter = `AND ro.createdAt >= date('now', 'start of day')`
          break
        case 'weekly':
          orderDateFilter = `AND o.createdAt >= date('now', '-6 days')`
          remittanceDateFilter = `AND ro.createdAt >= date('now', '-6 days')`
          break
        case 'monthly':
          orderDateFilter = `AND o.createdAt >= date('now', 'start of month')`
          remittanceDateFilter = `AND ro.createdAt >= date('now', 'start of month')`
          break
      }

      // =====================
      // CLIENT ORDERS (NO REMITTANCE)
      // =====================
      const clientOrders = db
        .prepare(
          `
      SELECT
        o.id                        AS refId,
        'CLIENT_ORDER'              AS source,

        c.fullName                  AS clientName,
        NULL                        AS vendorName,

        (o.serviceCharge + o.additionalCharge) AS amountCharged,
        o.amountReceived            AS paymentReceived,

        o.createdAt                 AS date
      FROM "DeliveryOrder" o
      LEFT JOIN "Client" c ON c.id = o.clientId
      WHERE o.vendorId IS NULL
      ${orderDateFilter}
    `
        )
        .all()

      // =====================
      // VENDOR REMITTANCE ORDERS
      // =====================
      const remittanceOrders = db
        .prepare(
          `
      SELECT
        o.id                        AS refId,
        'VENDOR_REMITTANCE'         AS source,

        NULL                        AS clientName,
        v.companyName               AS vendorName,

        ro.amountCharged            AS amountCharged,
        ro.receivedAmount           AS paymentReceived,

        ro.createdAt                AS date
      FROM "RemittanceOrder" ro
      INNER JOIN "DeliveryOrder" o ON o.id = ro.orderId
      INNER JOIN "Vendor" v ON v.id = o.vendorId
      WHERE 1=1
      ${remittanceDateFilter}
    `
        )
        .all()

      // =====================
      // MERGE & NORMALIZE
      // =====================
      const rows = [...clientOrders, ...remittanceOrders]

      return ok(
        rows
          .map((row: any) => {
            const outstanding = (row.amountCharged || 0) - (row.paymentReceived || 0)

            return {
              id: row.refId,
              source: row.source,

              client: row.clientName,
              vendor: row.vendorName,

              amountCharged: row.amountCharged,
              paymentReceived: row.paymentReceived,
              outstanding,

              date: row.date,
              category: row.amountCharged >= 100_000 ? 'High Value' : 'Standard'
            }
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      )
    } catch (error) {
      console.error(error)
      return fail('Failed to load income report')
    }
  })

  ipcMain.handle('accounting:expenses', (_, period?: 'daily' | 'weekly' | 'monthly') => {
    try {
      // Build the date filter directly
      let dateCondition = ''
      switch (period) {
        case 'daily':
          dateCondition = `WHERE createdAt >= date('now', 'start of day')`
          break
        case 'weekly':
          dateCondition = `WHERE createdAt >= date('now', '-6 days')`
          break
        case 'monthly':
          dateCondition = `WHERE createdAt >= date('now', 'start of month')`
          break
        default:
          dateCondition = ''
      }

      const rows = db
        .prepare(
          `
        SELECT id, type, description, amount, createdAt as date
        FROM "Expense"
        ${dateCondition}
        ORDER BY createdAt DESC
      `
        )
        .all()

      return rows
    } catch (error) {
      console.error('Error fetching expenses:', error)
      return []
    }
  })

  // --- Summary Metrics ---
  ipcMain.handle('accounting:summary', (_, period?: 'daily' | 'weekly' | 'monthly') => {
    try {
      /** ============================
       * DATE FILTERS
       * ============================ */
      let orderDateFilter = ''
      let remittanceDateFilter = ''
      let expenseDateFilter = ''

      switch (period) {
        case 'daily':
          orderDateFilter = `AND o.createdAt >= date('now', 'start of day')`
          remittanceDateFilter = `WHERE ro.createdAt >= date('now', 'start of day')`
          expenseDateFilter = `WHERE createdAt >= date('now', 'start of day')`
          break
        case 'weekly':
          orderDateFilter = `AND o.createdAt >= date('now', '-6 days')`
          remittanceDateFilter = `WHERE ro.createdAt >= date('now', '-6 days')`
          expenseDateFilter = `WHERE createdAt >= date('now', '-6 days')`
          break
        case 'monthly':
          orderDateFilter = `AND o.createdAt >= date('now', 'start of month')`
          remittanceDateFilter = `WHERE ro.createdAt >= date('now', 'start of month')`
          expenseDateFilter = `WHERE createdAt >= date('now', 'start of month')`
          break
        default:
          orderDateFilter = ''
          remittanceDateFilter = ''
          expenseDateFilter = ''
      }

      /** ============================
       * CLIENT ORDERS (REGULAR)
       * ============================ */
      const clientIncome: any[] = db
        .prepare(
          `
          SELECT
            (o.serviceCharge + o.additionalCharge) AS charged,
            o.amountReceived                     AS received
          FROM "DeliveryOrder" o
          WHERE o.vendorId IS NULL
          ${orderDateFilter}
          `
        )
        .all()

      /** ============================
       * VENDOR REMITTANCE (VIP)
       * ============================ */
      const vendorIncome: any[] = db
        .prepare(
          `
          SELECT
            ro.amountCharged AS charged,
            ro.receivedAmount AS received
          FROM "RemittanceOrder" ro
          INNER JOIN "Remittance" r ON r.id = ro.remittanceId
          ${remittanceDateFilter}
          `
        )
        .all()

      /** ============================
       * EXPENSES
       * ============================ */
      const expenseRecords: any[] = db
        .prepare(
          `
          SELECT type, amount
          FROM "Expense"
          ${expenseDateFilter}
          `
        )
        .all()

      /** ============================
       * INCOME CALCULATION
       * ============================ */
      let regularCharged = 0
      let regularReceived = 0
      let regularPending = 0

      for (const r of clientIncome) {
        const charged = r.charged || 0
        const received = r.received || 0

        regularCharged += charged
        regularReceived += received
        regularPending += charged - received
      }

      let vipCharged = 0
      let vipReceived = 0
      let vipPending = 0

      for (const r of vendorIncome) {
        const charged = r.charged || 0
        const received = r.received || 0

        vipCharged += charged
        vipReceived += received
        vipPending += charged - received
      }

      const totalCharged = regularCharged + vipCharged
      const totalReceived = regularReceived + vipReceived
      const totalPending = regularPending + vipPending

      /** ============================
       * EXPENSE BREAKDOWN
       * ============================ */
      const expenseTypes: Record<string, number> = {}
      let totalExpenses = 0

      for (const exp of expenseRecords) {
        expenseTypes[exp.type] = (expenseTypes[exp.type] || 0) + exp.amount
        totalExpenses += exp.amount
      }

      /** ============================
       * PROFIT (CASH BASIS)
       * ============================ */
      const profit = totalReceived - totalExpenses

      /** ============================
       * RETURN SUMMARY
       * ============================ */
      return ok({
        incomeBreakdown: {
          vip: {
            charged: vipCharged,
            received: vipReceived,
            pending: vipPending
          },
          regular: {
            charged: regularCharged,
            received: regularReceived,
            pending: regularPending
          },
          totals: {
            charged: totalCharged,
            received: totalReceived,
            pending: totalPending
          }
        },
        expenseBreakdown: {
          byType: expenseTypes,
          total: totalExpenses
        },
        profitLoss: {
          totalReceived,
          totalExpenses,
          profit,
          outstanding: totalPending
        }
      })
    } catch (error) {
      console.error('Error fetching summary:', error)
      return fail('Failed to load accounting summary')
    }
  })

  // --- Create Expense Record ---
  ipcMain.handle(
    'accounting:createExpense',
    async (_, data: { type: string; description?: string; amount: number }) => {
      try {
        if (!data.type || !data.amount) {
          throw new Error('Type and amount are required')
        }

        const id = crypto.randomUUID()
        const stmt = db.prepare(`
        INSERT INTO "Expense" (id, type, description, amount)
        VALUES (?, ?, ?, ?)
      `)
        stmt.run(id, data.type, data.description || null, data.amount)

        // Return the created expense
        const expense = db
          .prepare(`SELECT id, type, description, amount, createdAt FROM "Expense" WHERE id = ?`)
          .get(id)

        return ok(expense)
      } catch (error) {
        return fail(error)
      }
    }
  )

  // --- Metrics IPC Handler ---
  ipcMain.handle('dashboard:metrics', async () => {
    try {
      // Total Shipments (all DeliveryOrders)
      const totalShipmentsRow: any = db
        .prepare(`SELECT COUNT(*) as total FROM "DeliveryOrder"`)
        .get()
      const totalShipments = totalShipmentsRow.total || 0

      // Deliveries in Progress (status != 'DELIVERED')
      const inProgressRow: any = db
        .prepare(`SELECT COUNT(*) as total FROM "DeliveryOrder" WHERE status != 'DELIVERED'`)
        .get()
      const deliveriesInProgress = inProgressRow.total || 0

      // Active Agents (agents with at least one active delivery today)
      const activeAgentsRow: any = db
        .prepare(
          `
        SELECT COUNT(DISTINCT agentId) as total
        FROM "DeliveryOrder"
        WHERE status != 'DELIVERED'
      `
        )
        .get()
      const activeAgents: any = activeAgentsRow.total || 0

      // Warehouses (all warehouses)
      const warehousesRow: any = db.prepare(`SELECT COUNT(*) as total FROM "Warehouse"`).get()
      const warehouses = warehousesRow.total || 0

      return {
        success: true,
        data: {
          totalShipments,
          deliveriesInProgress,
          activeAgents,
          warehouses
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
      return { success: false, error }
    }
  })

  ipcMain.handle('dashboard:shipmentsAnalytics', () => {
    try {
      // Query total shipments and deliveries per month
      const rows: any = db
        .prepare(
          `
        SELECT 
          strftime('%m', createdAt) as month,
          COUNT(*) as totalShipments,
          SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as totalDelivered
        FROM "DeliveryOrder"
        GROUP BY month
        ORDER BY month
      `
        )
        .all()

      // Map month number to month name
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ]

      const chartData = monthNames.map((name, idx) => {
        const row: any = rows.find((r) => parseInt(r.month, 10) === idx + 1)
        return {
          name,
          shipment: row?.totalShipments || 0,
          delivery: row?.totalDelivered || 0
        }
      })

      return { success: true, chartData }
    } catch (error) {
      console.error('Error fetching shipments analytics:', error)
      return { success: false, error }
    }
  })

  ipcMain.handle('dashboard:ordersByLocation', () => {
    try {
      // Get total orders grouped by warehouse
      const rows: any = db
        .prepare(
          `
        SELECT 
          w.name as warehouse,
          COUNT(o.id) as totalOrders
        FROM "DeliveryOrder" o
        LEFT JOIN "Warehouse" w ON o.warehouseId = w.id
        GROUP BY w.id
      `
        )
        .all()

      // Calculate total for percentage
      const totalOrders = rows.reduce((sum, r) => sum + r.totalOrders, 0)

      // Map to chart format with percentage
      const pieData = rows.map((r, index) => ({
        name: r.warehouse || 'Other',
        value: ((r.totalOrders / totalOrders) * 100).toFixed(1),
        color: ['#FFD700', '#FF4C4C', '#00FF00', '#00FFFF'][index % 4]
      }))

      return { success: true, pieData }
    } catch (error) {
      console.error('Error fetching orders by location:', error)
      return { success: false, error }
    }
  })

  // --- Fetch Recent Agents and Warehouses ---
  ipcMain.handle('dashboard:recentEntities', (_, limit: number = 5) => {
    try {
      // Recent Agents
      const recentAgents = db
        .prepare(
          `
        SELECT id, fullName, email, phone, createdAt
        FROM "Agent"
        ORDER BY createdAt DESC
        LIMIT ?
      `
        )
        .all(limit)

      // Recent Warehouses
      const recentWarehouses = db
        .prepare(
          `
        SELECT id, name, location, createdAt
        FROM "Warehouse"
        ORDER BY createdAt DESC
        LIMIT ?
      `
        )
        .all(limit)

      return ok({ recentAgents, recentWarehouses })
    } catch (error) {
      console.error('Error fetching recent agents/warehouses:', error)
      return fail(error)
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
