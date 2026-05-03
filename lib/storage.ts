import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Database } from './types';

const DB_PATH = join(process.cwd(), 'data', 'db.json');

export function readDatabase(): Database {
  try {
    if (!existsSync(DB_PATH)) {
      throw new Error('Database file not found');
    }
    const data = readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: [], bookmarks: [] };
  }
}

export function writeDatabase(db: Database): void {
  try {
    writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing database:', error);
    throw error;
  }
}
