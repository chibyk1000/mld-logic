-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeliveryOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT,
    "productId" TEXT,
    "quantity" INTEGER NOT NULL,
    "clientId" TEXT,
    "agentId" TEXT,
    "warehouseId" TEXT,
    "destination" TEXT,
    "cost" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliveryOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeliveryOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeliveryOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeliveryOrder_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeliveryOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DeliveryOrder" ("agentId", "clientId", "cost", "createdAt", "destination", "id", "productId", "quantity", "status", "updatedAt", "vendorId", "warehouseId") SELECT "agentId", "clientId", "cost", "createdAt", "destination", "id", "productId", "quantity", "status", "updatedAt", "vendorId", "warehouseId" FROM "DeliveryOrder";
DROP TABLE "DeliveryOrder";
ALTER TABLE "new_DeliveryOrder" RENAME TO "DeliveryOrder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
