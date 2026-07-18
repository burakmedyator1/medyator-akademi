// SQLite (storage/data.db) verisini PostgreSQL'e taşır.
//
// Kullanım:
//   node scripts/migrate-sqlite-to-postgres.js [sqlite-dosya-yolu] [--force]
//
// Varsayılan kaynak: storage/data.db (yerel). Canlı veriyi taşımak için admin
// panelden indirilen yedek dosyasının yolunu ver. Hedef (DATABASE_URL) boş
// değilse script durur; --force verilirse hedefteki TÜM veriyi silip yeniden
// yazar. ID'ler birebir korunur ve sonda PostgreSQL sequence'ları düzeltilir
// (aksi hâlde yeni kayıtlar eski ID'lerle çakışır).
import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2).filter((a) => a !== '--force');
const force = process.argv.includes('--force');
const sqlitePath = args[0] || path.join(__dirname, '..', 'storage', 'data.db');

const sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true });
const prisma = new PrismaClient();

// SQLite datetime('now') UTC saklar ama zaman dilimi eki yazmaz; eki eklemeden
// parse edilirse yerel saat sanılır ve tüm kayıtlar saat farkı kadar kayar.
function toDate(value) {
  if (!value) return null;
  const s = String(value);
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s.replace(' ', 'T'));
  return new Date(`${s.replace(' ', 'T')}Z`);
}

function rows(table) {
  try {
    return sqlite.prepare(`SELECT * FROM ${table}`).all();
  } catch {
    return [];
  }
}

async function resetSequence(table) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`
  );
}

async function main() {
  console.log(`Kaynak: ${sqlitePath}`);

  const existingUsers = await prisma.user.count();
  const existingSettings = await prisma.siteSetting.count();
  if ((existingUsers > 0 || existingSettings > 0) && !force) {
    throw new Error(
      'Hedef veritabanı boş değil. Üzerine yazmak istediğinden eminsen --force ile çalıştır ' +
        '(hedefteki TÜM veri silinir ve SQLite içeriğiyle değiştirilir).'
    );
  }
  if (force) {
    console.log('--force: hedef veritabanı temizleniyor...');
    await prisma.questionMessage.deleteMany();
    await prisma.question.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.testimonial.deleteMany();
    await prisma.blogPost.deleteMany();
    await prisma.course.deleteMany();
    await prisma.instructor.deleteMany();
    await prisma.contactRequest.deleteMany();
    await prisma.application.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.siteSetting.deleteMany();
  }

  const counts = {};

  const users = rows('users');
  await prisma.user.createMany({
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
  counts.users = users.length;

  const instructors = rows('instructors');
  await prisma.instructor.createMany({
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
  counts.instructors = instructors.length;

  const courses = rows('courses');
  await prisma.course.createMany({
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
  counts.courses = courses.length;

  const lessons = rows('lessons');
  await prisma.lesson.createMany({
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
  counts.lessons = lessons.length;

  const enrollments = rows('enrollments');
  await prisma.enrollment.createMany({
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
  counts.enrollments = enrollments.length;

  const contactRequests = rows('contact_requests');
  await prisma.contactRequest.createMany({
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
  counts.contactRequests = contactRequests.length;

  const settings = rows('site_settings');
  await prisma.siteSetting.createMany({
    data: settings.map((s) => ({ key: s.key, value: s.value })),
  });
  counts.siteSettings = settings.length;

  const categories = rows('categories');
  await prisma.category.createMany({
    data: categories.map((c) => ({ id: c.id, name: c.name })),
  });
  counts.categories = categories.length;

  const testimonials = rows('testimonials');
  await prisma.testimonial.createMany({
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
  counts.testimonials = testimonials.length;

  const applications = rows('applications');
  await prisma.application.createMany({
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
  counts.applications = applications.length;

  const questions = rows('questions');
  await prisma.question.createMany({
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
  counts.questions = questions.length;

  const questionMessages = rows('question_messages');
  await prisma.questionMessage.createMany({
    data: questionMessages.map((m) => ({
      id: m.id,
      questionId: m.question_id,
      senderRole: m.sender_role,
      messageText: m.message_text,
      createdAt: toDate(m.created_at) ?? new Date(),
    })),
  });
  counts.questionMessages = questionMessages.length;

  const blogPosts = rows('blog_posts');
  await prisma.blogPost.createMany({
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
  counts.blogPosts = blogPosts.length;

  const notifications = rows('notifications');
  await prisma.notification.createMany({
    data: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      recipientCount: n.recipient_count ?? 0,
      createdAt: toDate(n.created_at) ?? new Date(),
    })),
  });
  counts.notifications = notifications.length;

  const sequencedTables = [
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
  for (const table of sequencedTables) {
    await resetSequence(table);
  }

  console.log('Taşıma tamamlandı:', counts);
}

main()
  .catch((err) => {
    console.error('Taşıma hatası:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    sqlite.close();
    await prisma.$disconnect();
  });
