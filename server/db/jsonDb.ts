import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSeedDb } from './seed';
import type { PredictDb } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'predict2026.db.json');

function ensureDbFile() {
  if (fs.existsSync(dbPath)) return;
  writeDb(createSeedDb());
}

export function readDb(): PredictDb {
  ensureDbFile();
  return JSON.parse(fs.readFileSync(dbPath, 'utf8')) as PredictDb;
}

export function writeDb(db: PredictDb) {
  fs.writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`, 'utf8');
}

export function updateDb<T>(updater: (db: PredictDb) => T): T {
  const db = readDb();
  const result = updater(db);
  writeDb(db);
  return result;
}

export function getDbPath() {
  return dbPath;
}
