// SQLite verisini PostgreSQL'e elle taşımak için CLI sarmalayıcı.
//
// Kullanım:
//   node scripts/migrate-sqlite-to-postgres.js [sqlite-dosya-yolu] [--force]
//
// Varsayılan kaynak: storage/data.db. Hedef (DATABASE_URL) boş değilse durur;
// --force hedefteki TÜM veriyi silip yeniden yazar.
//
// NOT: Canlı (Render) verisi için bu scripte gerek yok — uygulama açılışta
// PostgreSQL'i boş bulursa diskteki SQLite'ı otomatik içeri aktarır
// (src/sqliteImport.js). Admin panelden indirilen yedek dosyaları WAL
// nedeniyle boş olabilir; taşıma verinin bulunduğu makinede yapılmalı.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prisma from '../src/prisma.js';
import { importFromSqlite } from '../src/sqliteImport.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2).filter((a) => a !== '--force');
const force = process.argv.includes('--force');
const sqlitePath = args[0] || path.join(__dirname, '..', 'storage', 'data.db');

console.log(`Kaynak: ${sqlitePath}`);

importFromSqlite(sqlitePath, { force })
  .then((counts) => {
    console.log('Taşıma tamamlandı:', counts);
  })
  .catch((err) => {
    console.error('Taşıma hatası:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
