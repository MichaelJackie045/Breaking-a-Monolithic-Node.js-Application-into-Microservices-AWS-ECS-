const fs = require("node:fs/promises");
const path = require("node:path");

const dbPath = path.join(__dirname, "db.json");

async function readDb() {
  const raw = await fs.readFile(dbPath, "utf8");
  return JSON.parse(raw);
}

async function writeDb(nextDb) {
  const raw = JSON.stringify(nextDb, null, 2) + "\n";
  await fs.writeFile(dbPath, raw, "utf8");
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

module.exports = {
  readDb,
  writeDb,
  nextId,
};
