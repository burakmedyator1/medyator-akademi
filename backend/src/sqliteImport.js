// SQLite verisini PostgreSQL'e aktaran ortak çekirdek. İki yerden kullanılır:
// scripts/migrate-sqlite-to-postgres.js (elle, yedek dosyasından) ve uygulama
// açılışı (runStartupImportIfNeeded — Render'da tek seferlik otomatik taşıma).
//
// Otomatik taşıma sunucuda yapılmak ZORUNDA: SQLite WAL modunda çalıştığı ve
// küçük veritabanı checkpoint eşiğine hiç ulaşmadığı için gerçek veri ana
// data.db dosyasında değil, yanındaki data.db-wal dosyasında birikiyor. Admin
// panelden indirilen ana dosya bu yüzden boş çıkıyor; diskteki dosyayı yerinde
// açmak ise WAL'ı otomatik okur ve veri eksiksiz gelir.
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import prisma from './prisma.js';
import { STORAGE_DIR } from './storagePath.js';

// SQLite datetime('now') UTC saklar ama zaman dilimi eki yazmaz; eki eklemeden
// parse edilirse yerel saat sanılır ve tüm kayıtlar saat farkı kadar kayar.
function toDate(value) {
  if (!value) return null;
  const s = String(value);
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s.replace(' ', 'T'));
  return new Date(`${s.replace(' ', 'T')}Z`);
}

function readTable(sqlite, table) {
  try {
    return sqlite.prepare(`SELECT * FROM ${table}`).all();
  } catch (err) {
    // Eski yedeklerde henüz var olmayan tablolar normal; onun dışındaki her
    // hata (bozuk dosya vb.) gizlenmeden yukarı fırlatılır.
    if (/no such table/i.test(err.message)) return [];
    throw err;
  }
}

const SEQUENCED_TABLES = [
  'users',
  'instructors',
  'courses',
  'lessons',
  'enrollments',
  'contact_requests',
  'categories',
  'testimonials',
  'applications',
  'questions',
  'question_messages',
  'blog_posts',
  'notifications',
];

export async function importFromSqlite(sqlitePath, { force = false, log = console.log } = {}) {
  // Salt-okunur AÇILMAZ: WAL kurtarma/okuma için yazma izni gerekebilir.
  const sqlite = new Database(sqlitePath, { fileMustExist: true });

  try {
    const users = readTable(sqlite, 'users');
    const settings = readTable(sqlite, 'site_settings');

    if (users.length === 0 && settings.length === 0) {
      throw new Error(
        `SQLite dosyası boş görünüyor (${sqlitePath}). Admin panelden indirilen yedekler WAL ` +
          'nedeniyle boş olabilir — taşıma, verinin bulunduğu sunucuda (deploy sırasında otomatik) yapılmalı.'
      );
    }

    const existingUsers = await prisma.user.count();
    const existingSettings = await prisma.siteSetting.count();
    if ((existingUsers > 0 || existingSettings > 0) && !force) {
      throw new Error(
        'Hedef veritabanı boş değil. Üzerine yazmak istediğinden eminsen --force ile çalıştır ' +
          '(hedefteki TÜM veri silinir ve SQLite içeriğiyle değiştirilir).'
      );
    }

    const instructors = readTable(sqlite, 'instructors');
    const courses = readTable(sqlite, 'courses');
    const lessons = readTable(sqlite, 'lessons');
    const enrollments = readTable(sqlite, 'enrollments');
    const contactRequests = readTable(sqlite, 'contact_requests');
    const categories = readTable(sqlite, 'categories');
    const testimonials = readTable(sqlite, 'testimonials');
    const applications = readTable(sqlite, 'applications');
    const questions = readTable(sqlite, 'questions');
    const questionMessages = readTable(sqlite, 'question_messages');
    const blogPosts = readTable(sqlite, 'blog_posts');
    const notifications = readTable(sqlite, 'notifications');

    await prisma.$transaction(
      async (tx) => {
        if (force) {
          log('--force: hedef veritabanı temizleniyor...');
          await tx.questionMessage.deleteMany();
          await tx.question.deleteMany();
          await tx.enrollment.deleteMany();
          await tx.lesson.deleteMany();
          await tx.testimonial.deleteMany();
          await tx.blogPost.deleteMany();
          await tx.course.deleteMany();
          await tx.instructor.deleteMany();
          await tx.contactRequest.deleteMany();
          await tx.application.deleteMany();
          await tx.notification.deleteMany();
          await tx.category.deleteMany();
          await tx.user.deleteMany();
          await tx.siteSetting.deleteMany();
        }

        await tx.user.createMany({
          data: users.map((u) => ({
            id: u.id,
            email: u.email,
            passwordHash: u.password_hash,
            name: u.name,
            role: u.role,
            phone: u.phone ?? '',
            birthDate: u.birth_date ?? null,
            instagram: u.instagram ?? null,
            tiktok: u.tiktok ?? null,
            youtube: u.youtube ?? null,
            linkedin: u.linkedin ?? null,
            twitter: u.twitter ?? null,
            expoPushToken: u.expo_push_token ?? null,
            createdAt: toDate(u.created_at) ?? new Date(),
          })),
        });

        await tx.instructor.createMany({
          data: instructors.map((i) => ({
            id: i.id,
            name: i.name,
            title: i.title,
            bio: i.bio,
            avatarColor: i.avatar_color ?? '#F0653C',
            photoUrl: i.photo_url ?? null,
            email: i.email ?? null,
            passwordHash: i.password_hash ?? null,
          })),
        });

        await tx.course.createMany({
          data: courses.map((c) => ({
            id: c.id,
            title: c.title,
            category: c.category,
            deliveryType: c.delivery_type,
            description: c.description,
            coverColor: c.cover_color ?? 'yellow',
            coverImageUrl: c.cover_image_url ?? null,
            price: c.price ?? 0,
            displayOrder: c.display_order ?? 0,
            instructorId: c.instructor_id ?? null,
          })),
        });

        await tx.lesson.createMany({
          data: lessons.map((l) => ({
            id: l.id,
            courseId: l.course_id,
            title: l.title,
            description: l.description ?? '',
            durationMinutes: l.duration_minutes,
            lessonOrder: l.lesson_order,
            videoProvider: l.video_provider,
            videoId: l.video_id,
            isPreview: Boolean(l.is_preview),
          })),
        });

        await tx.enrollment.createMany({
          data: enrollments.map((e) => ({
            id: e.id,
            userId: e.user_id,
            courseId: e.course_id,
            progress: e.progress ?? 0,
            paymentStatus: e.payment_status ?? 'approved',
            amount: e.amount ?? null,
            paymentProvider: e.payment_provider ?? null,
            paymentReference: e.payment_reference ?? null,
            paymentToken: e.payment_token ?? null,
            reminderSentAt: toDate(e.reminder_sent_at),
            createdAt: toDate(e.created_at) ?? new Date(),
          })),
        });

        await tx.contactRequest.createMany({
          data: contactRequests.map((r) => ({
            id: r.id,
            type: r.type,
            name: r.name,
            email: r.email,
            phone: r.phone ?? null,
            company: r.company ?? null,
            category: r.category ?? null,
            subject: r.subject ?? null,
            message: r.message ?? null,
            createdAt: toDate(r.created_at) ?? new Date(),
          })),
        });

        await tx.siteSetting.createMany({
          data: settings.map((s) => ({ key: s.key, value: s.value })),
        });

        await tx.category.createMany({
          data: categories.map((c) => ({ id: c.id, name: c.name })),
        });

        await tx.testimonial.createMany({
          data: testimonials.map((t) => ({
            id: t.id,
            studentName: t.student_name,
            studentTitle: t.student_title ?? '',
            quote: t.quote,
            rating: t.rating ?? 5,
            avatarColor: t.avatar_color ?? '#f0653c',
            photoUrl: t.photo_url ?? null,
            displayOrder: t.display_order ?? 0,
            userId: t.user_id ?? null,
            courseId: t.course_id ?? null,
            status: t.status ?? 'approved',
            createdAt: toDate(t.created_at) ?? new Date(),
          })),
        });

        await tx.application.createMany({
          data: applications.map((a) => ({
            id: a.id,
            type: a.type,
            name: a.name,
            email: a.email,
            phone: a.phone,
            description: a.description ?? '',
            cvFileUrl: a.cv_file_url ?? null,
            createdAt: toDate(a.created_at) ?? new Date(),
          })),
        });

        await tx.question.createMany({
          data: questions.map((q) => ({
            id: q.id,
            courseId: q.course_id,
            userId: q.user_id,
            instructorId: q.instructor_id,
            questionText: q.question_text,
            answerText: q.answer_text ?? null,
            createdAt: toDate(q.created_at) ?? new Date(),
            answeredAt: toDate(q.answered_at),
          })),
        });

        await tx.questionMessage.createMany({
          data: questionMessages.map((m) => ({
            id: m.id,
            questionId: m.question_id,
            senderRole: m.sender_role,
            messageText: m.message_text,
            createdAt: toDate(m.created_at) ?? new Date(),
          })),
        });

        await tx.blogPost.createMany({
          data: blogPosts.map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt ?? '',
            content: p.content,
            coverImageUrl: p.cover_image_url ?? null,
            status: p.status ?? 'published',
            instructorId: p.instructor_id ?? null,
            createdAt: toDate(p.created_at) ?? new Date(),
          })),
        });

        await tx.notification.createMany({
          data: notifications.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            recipientCount: n.recipient_count ?? 0,
            createdAt: toDate(n.created_at) ?? new Date(),
          })),
        });

        // ID'ler birebir taşındığı için sequence'lar ileri alınmazsa yeni
        // kayıtlar eski ID'lerle çakışır.
        for (const table of SEQUENCED_TABLES) {
          await tx.$executeRawUnsafe(
            `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`
          );
        }
      },
      { timeout: 120000 }
    );

    return {
      users: users.length,
      instructors: instructors.length,
      courses: courses.length,
      lessons: lessons.length,
      enrollments: enrollments.length,
      contactRequests: contactRequests.length,
      siteSettings: settings.length,
      categories: categories.length,
      testimonials: testimonials.length,
      applications: applications.length,
      questions: questions.length,
      questionMessages: questionMessages.length,
      blogPosts: blogPosts.length,
      notifications: notifications.length,
    };
  } finally {
    sqlite.close();
  }
}

// Açılışta tek seferlik otomatik taşıma: PostgreSQL boşsa ve diskte dolu bir
// SQLite dosyası varsa içeri aktarır. Taşıma bittikten sonraki açılışlarda
// (PostgreSQL artık dolu) hiçbir şey yapmaz. Hata olursa süreç durdurulur —
// Render'da başarısız deploy, eski (SQLite) sürümü yayında bırakır.
export async function runStartupImportIfNeeded() {
  const sqlitePath = path.join(STORAGE_DIR, 'data.db');
  if (!fs.existsSync(sqlitePath)) return;

  const existingUsers = await prisma.user.count();
  const existingSettings = await prisma.siteSetting.count();
  if (existingUsers > 0 || existingSettings > 0) return;

  console.log('PostgreSQL boş, diskteki SQLite verisi içeri aktarılıyor...');
  const counts = await importFromSqlite(sqlitePath);
  console.log('SQLite -> PostgreSQL otomatik taşıma tamamlandı:', counts);
}
