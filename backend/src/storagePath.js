import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// All persistent, runtime-generated data (SQLite db + uploaded files) lives
// here. In production this directory — and only this directory — should be
// the mount point of the platform's persistent disk. Mounting a disk on top
// of `backend/` itself would hide the checked-out source code (package.json,
// src/, ...) underneath an empty volume.
export const STORAGE_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'storage');

fs.mkdirSync(STORAGE_DIR, { recursive: true });
