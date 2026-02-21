const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const dbDir = path.join(__dirname, "..", "..", "db");
const dbPath = path.join(dbDir, "inventory.sqlite");
const migrationPath = path.join(dbDir, "migrations", "001_inventory_schema.sql");
const seedPath = path.join(dbDir, "seed", "inventory_seed.sql");

fs.mkdirSync(dbDir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");

const migrationSql = fs.readFileSync(migrationPath, "utf8");
db.exec(migrationSql);

const hasItems = db.prepare("SELECT COUNT(*) AS count FROM items").get();
if (!hasItems || hasItems.count === 0) {
  const seedSql = fs.readFileSync(seedPath, "utf8");
  db.exec(seedSql);
}

module.exports = db;
