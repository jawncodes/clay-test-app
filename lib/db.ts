import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const dbPath = join(process.cwd(), 'data.db');
  db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Initialize schema
  const schema = readFileSync(join(process.cwd(), 'lib', 'schema.sql'), 'utf-8');
  db.exec(schema);

  // Migrate existing database: add enrichment columns if they don't exist
  try {
    const tableInfo = db.prepare("PRAGMA table_info(user_entries)").all() as any[];
    const hasEnrichmentStatus = tableInfo.some((col: any) => col.name === 'enrichment_status');
    const hasEnrichedAt = tableInfo.some((col: any) => col.name === 'enriched_at');
    const hasEnrichmentData = tableInfo.some((col: any) => col.name === 'enrichment_data');
    const hasEnriched = tableInfo.some((col: any) => col.name === 'enriched'); // Old column

    // Migration: convert old 'enriched' column to new 'enrichment_status'
    if (hasEnriched && !hasEnrichmentStatus) {
      db.exec('ALTER TABLE user_entries ADD COLUMN enrichment_status TEXT NOT NULL DEFAULT \'pending\'');
      db.exec('UPDATE user_entries SET enrichment_status = CASE WHEN enriched = 1 THEN \'enriched\' ELSE \'pending\' END');
      // Note: We'll keep the old column for now to avoid breaking things, but use enrichment_status going forward
    }

    if (!hasEnrichmentStatus && !hasEnriched) {
      db.exec('ALTER TABLE user_entries ADD COLUMN enrichment_status TEXT NOT NULL DEFAULT \'pending\' CHECK(enrichment_status IN (\'pending\', \'queued\', \'enriched\'))');
    }

    if (!hasEnrichedAt) {
      db.exec('ALTER TABLE user_entries ADD COLUMN enriched_at DATETIME');
    }

    if (!hasEnrichmentData) {
      db.exec('ALTER TABLE user_entries ADD COLUMN enrichment_data TEXT');
    }
  } catch (error) {
    // Table might not exist yet, which is fine - schema.sql will create it
    console.log('Migration check completed');
  }

  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

