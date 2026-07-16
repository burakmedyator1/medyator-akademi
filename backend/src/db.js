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
    avatar_color TEXT NOT NULL DEFAULT '#F0653C',
    photo_url TEXT,
    email TEXT,
    password_hash TEXT
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    delivery_type TEXT NOT NULL CHECK (delivery_type IN ('online', 'corporate', 'in_person')),
    description TEXT NOT NULL,
    cover_color TEXT NOT NULL DEFAULT 'yellow',
    cover_image_url TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL DEFAULT 0,
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

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('intern', 'instructor')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    cv_file_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    instructor_id INTEGER NOT NULL REFERENCES instructors(id),
    question_text TEXT NOT NULL,
    answer_text TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    answered_at TEXT
  );

  CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    cover_image_url TEXT,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('pending', 'published', 'rejected')),
    instructor_id INTEGER REFERENCES instructors(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Backfill categories from any course.category values that predate the
// dedicated categories table, so nothing existing silently disappears.
const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
db.prepare('SELECT DISTINCT category FROM courses').all().forEach((row) => insertCategory.run(row.category));

// CREATE TABLE IF NOT EXISTS only applies to brand-new databases, so columns
// added to existing tables after initial release need an explicit migration.
function addColumnIfMissing(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
addColumnIfMissing('instructors', 'photo_url', 'TEXT');
addColumnIfMissing('instructors', 'email', 'TEXT');
addColumnIfMissing('instructors', 'password_hash', 'TEXT');
addColumnIfMissing('courses', 'cover_image_url', 'TEXT');
addColumnIfMissing('courses', 'display_order', 'INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('blog_posts', 'status', "TEXT NOT NULL DEFAULT 'published'");
addColumnIfMissing('blog_posts', 'instructor_id', 'INTEGER REFERENCES instructors(id)');
// Older rows used a published (0/1) flag; migrate any that were explicitly
// unpublished so they don't suddenly appear as 'published' under the new column.
if (db.prepare("PRAGMA table_info(blog_posts)").all().some((c) => c.name === 'published')) {
  db.prepare("UPDATE blog_posts SET status = 'pending' WHERE published = 0 AND status = 'published'").run();
}

export default db;
