import 'dotenv/config'
import Database from 'better-sqlite3'
import path from 'path'

const dbPath =
  process.env.NODE_ENV === 'development'
    ? './data.db'
    : path.join(process.resourcesPath, './data.db')

// Open the database

const db :ReturnType<typeof Database> = new Database(dbPath as string, { verbose: console.log })

// -------------------- SCHEMA --------------------

// User table
db.prepare(
  `
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`
).run()

// Warehouse table
db.prepare(
  `
CREATE TABLE IF NOT EXISTS "Warehouse" (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  description TEXT,
  items INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`
).run()

// Agent table
db.prepare(
  `
CREATE TABLE IF NOT EXISTS "Agent" (
  id TEXT PRIMARY KEY NOT NULL,
  fullName TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  warehouseId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouseId) REFERENCES "Warehouse"(id) ON DELETE CASCADE ON UPDATE CASCADE
)
`
).run()

// Client table
db.prepare(
  `
CREATE TABLE IF NOT EXISTS "Client" (
  id TEXT PRIMARY KEY NOT NULL,
  fullName TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`
).run()

// Vendor table
db.prepare(
  `
CREATE TABLE IF NOT EXISTS "Vendor" (
  id TEXT PRIMARY KEY NOT NULL,
  companyName TEXT NOT NULL,
  contactName TEXT,
  phone TEXT,
  email TEXT UNIQUE,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`
).run()

// VendorOnWarehouse table
db.prepare(
  `
CREATE TABLE IF NOT EXISTS "VendorOnWarehouse" (
  id TEXT PRIMARY KEY NOT NULL,
  vendorId TEXT NOT NULL,
  warehouseId TEXT NOT NULL,
  contractStart DATETIME,
  contractEnd DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendorId, warehouseId),
  FOREIGN KEY (vendorId) REFERENCES "Vendor"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (warehouseId) REFERENCES "Warehouse"(id) ON DELETE CASCADE ON UPDATE CASCADE
)
`
).run()

// Product table
db.prepare(
  `
CREATE TABLE IF NOT EXISTS "Product" (
  id TEXT PRIMARY KEY NOT NULL,
  vendorId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  sku TEXT UNIQUE,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendorId) REFERENCES "Vendor"(id) ON DELETE RESTRICT ON UPDATE CASCADE
)
`
).run()

// Inventory table
db.prepare(
  `
CREATE TABLE IF NOT EXISTS "Inventory" (
  id TEXT PRIMARY KEY NOT NULL,
  vendorId TEXT NOT NULL,
  warehouseId TEXT NOT NULL,
  productId TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendorId, warehouseId, productId),
  FOREIGN KEY (vendorId) REFERENCES "Vendor"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (warehouseId) REFERENCES "Warehouse"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (productId) REFERENCES "Product"(id) ON DELETE RESTRICT ON UPDATE CASCADE
)
`
).run()

// DeliveryOrder table
db.prepare(
  `
CREATE TABLE IF NOT EXISTS "DeliveryOrder" (
  id TEXT PRIMARY KEY NOT NULL,

  vendorId TEXT,
  productId TEXT,
  quantity INTEGER NOT NULL,

  clientId TEXT,
  agentId TEXT,
  warehouseId TEXT,

  -- Existing
  destination TEXT,
  serviceCost REAL NOT NULL,
  deliveryCost REAL NOT NULL,
  

  -- New fields: PICKUP INFO
  pickupContactName TEXT,
  pickupContactPhone TEXT,
  pickupInstructions TEXT,

  -- New fields: DELIVERY INFO
  deliveryContactName TEXT,
  deliveryContactPhone TEXT,
  deliveryInstructions TEXT,
  deliveryAddress TEXT,

  -- Payment fields
  collectPayment INTEGER NOT NULL DEFAULT 0,
  additionalCost REAL DEFAULT 0,

  -- enum Sensitivity (store as TEXT)
  sensitivity TEXT NOT NULL DEFAULT 'MEDIUM',

  status TEXT NOT NULL DEFAULT 'PENDING',

  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (vendorId) REFERENCES "Vendor"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (productId) REFERENCES "Product"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (clientId) REFERENCES "Client"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (agentId) REFERENCES "Agent"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (warehouseId) REFERENCES "Warehouse"(id) ON DELETE SET NULL ON UPDATE CASCADE
)
`
).run()


// -------------------- REMITTANCE --------------------

// Remittance table
db.prepare(
  `
CREATE TABLE IF NOT EXISTS "Remittance" (
  id TEXT PRIMARY KEY NOT NULL,

  clientId TEXT,            -- client who paid
  vendorId TEXT,            -- vendor who paid for delivery (optional)

  -- FINANCIALS
totalCost REAL NOT NULL DEFAULT 0,     -- total cost of service only
amountLeft REAL NOT NULL DEFAULT 0,    -- remaining amount to be received
   

  status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, PARTIAL, PAID

  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (clientId) REFERENCES "Client"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (vendorId) REFERENCES "Vendor"(id) ON DELETE CASCADE ON UPDATE CASCADE
)
`
).run()


// Pivot table: Remittance → DeliveryOrder
db.prepare(`
CREATE TABLE IF NOT EXISTS "RemittanceOrder" (
  id TEXT PRIMARY KEY NOT NULL,

  remittanceId TEXT NOT NULL,
  orderId TEXT NOT NULL,
  expectedAmount REAL NOT NULL,
  receivedAmount REAL NOT NULL DEFAULT 0,

  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (remittanceId) REFERENCES "Remittance"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (orderId) REFERENCES "DeliveryOrder"(id) ON DELETE CASCADE ON UPDATE CASCADE
)
`).run()

// Optional: Payment logs for each remittance
db.prepare(
  `
CREATE TABLE IF NOT EXISTS "RemittancePayment" (
  id TEXT PRIMARY KEY NOT NULL,

  remittanceId TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT,
  reference TEXT,
  notes TEXT,

  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (remittanceId) REFERENCES "Remittance"(id) ON DELETE CASCADE ON UPDATE CASCADE
)
`
)
  .run()

// Initialize Expense table on app start
db.prepare(`
  CREATE TABLE IF NOT EXISTS "Expense" (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`).run();


// -------------------- TRIGGERS --------------------
// Auto-update updatedAt on each table
const tablesWithUpdatedAt = [
  'User',
  'Warehouse',
  'Agent',
  'Client',
  'Vendor',
  'VendorOnWarehouse',
  'Product',
  'Inventory',
  'DeliveryOrder',
  'Remittance', 'RemittanceOrder', 'RemittancePayment',
  "Expense"
]

tablesWithUpdatedAt.forEach((table) => {
  db.prepare(
    `
    CREATE TRIGGER IF NOT EXISTS update_${table}_updatedAt
    AFTER UPDATE ON "${table}"
    FOR EACH ROW
    BEGIN
      UPDATE "${table}" SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `
  ).run()
})

export {db}
