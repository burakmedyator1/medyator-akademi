import Database from 'better-sqlite3';
import path from 'node:path';
import { STORAGE_DIR } from './storagePath.js';

const db = new Database(path.join(STORAGE_DIR, 'data.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    phone TEXT NOT NULL DEFAULT '',
    instagram TEXT,
    tiktok TEXT,
    youtube TEXT,
    linkedin TEXT,
    twitter TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS instructors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    bio TEXT NOT NULL,
    avatar_color TEXT NOT NULL DEFAULT '#F0653C'
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    delivery_type TEXT NOT NULL CHECK (delivery_type IN ('online', 'corporate', 'in_person')),
    description TEXT NOT NULL,
    cover_color TEXT NOT NULL DEFAULT 'yellow',
    price INTEGER NOT NULL DEFAULT 0,
    instructor_id INTEGER REFERENCES instructors(id)
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    title TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    lesson_order INTEGER NOT NULL,
    video_provider TEXT NOT NULL CHECK (video_provider IN ('youtube', 'vimeo')),
    video_id TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    course_id INTEGER NOT NULL REFERENCES courses(id),
    progress INTEGER NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'approved' CHECK (payment_status IN ('pending', 'approved', 'rejected')),
    amount INTEGER,
    payment_provider TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, course_id)
  );

  CREATE TABLE IF NOT EXISTS contact_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('corporate', 'in_person')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );
`);

// Backfill categories from any course.category values that predate the
// dedicated categories table, so nothing existing silently disappears.
const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
db.prepare('SELECT DISTINCT category FROM courses').all().forEach((row) => insertCategory.run(row.category));

export default db;
