import bcrypt from 'bcryptjs';
import db from './db.js';

// Fail fast, before touching the database, if production is about to seed
// with the publicly-known default admin password.
if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
  throw new Error(
    'ADMIN_PASSWORD ortam değişkeni ayarlanmadan production modunda seed çalıştırılamaz. ' +
      'Güçlü bir şifre belirleyip ortam değişkenlerine ekleyin.'
  );
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@medyatorakademi.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

db.exec(`
  DELETE FROM enrollments;
  DELETE FROM lessons;
  DELETE FROM courses;
  DELETE FROM instructors;
  DELETE FROM contact_requests;
  DELETE FROM users;
  DELETE FROM site_settings;
`);

db.prepare(
  `INSERT INTO users (email, password_hash, name, role, phone, instagram)
   VALUES (?, ?, ?, 'admin', ?, ?)`
).run(ADMIN_EMAIL, bcrypt.hashSync(ADMIN_PASSWORD, 10), 'Medyator Akademi Admin', '+90 555 000 0000', 'medyatorakademi');

const DEFAULT_SETTINGS = {
  'bg-cream': '#f5f1e8',
  navy: '#1b1e29',
  orange: '#f0653c',
  yellow: '#f5c94f',
  purple: '#c9b7e4',
  blue: '#a9d3e5',
  'price-tag': '#f0653c',
  'cursor-glow': '#f0653c',
  'cursor-glow-intensity': '12',
  logo_url: '',
  navbar_logo_height: '34',
  splash_tagline: 'Öğrenmenin yeni adresi',
  splash_enabled: 'true',
  splash_show_logo: 'true',
  splash_image_url: '',

  landing_hero_title: 'Öğrenmenin yeni adresi',
  landing_hero_subtitle:
    'Eğitmenlerinden video dersler al, ilerlemeni takip et. Online, kurumsal veya yüz yüze — sana uygun formatı seç.',
  landing_hero_video_provider: '',
  landing_hero_video_id: '',
  landing_delivery_online_title: 'Online Eğitim',
  landing_delivery_online_desc:
    'Dilediğin an, YouTube ve Vimeo üzerinden yayınlanan video derslerle kendi hızında öğren.',
  landing_delivery_corporate_title: 'Kurumsal Eğitim',
  landing_delivery_corporate_desc: 'Şirketine özel, ekibinin ihtiyacına göre tasarlanmış eğitim programları.',
  landing_delivery_inperson_title: 'Yüz Yüze Eğitim',
  landing_delivery_inperson_desc:
    "Sınıf ortamında, mentörlük destekli uygulamalı atölyeler ve bootcamp'ler.",

  footer_instagram: '',
  footer_tiktok: '',
  footer_youtube: '',
  footer_linkedin: '',
  footer_twitter: '',

  company_legal_name: '',
  company_address: '',
  company_tax_office: '',
  company_tax_no: '',
  company_mersis: '',
  company_phone: '',
  company_email: '',

  corporate_hero_title: 'Kurumsal Eğitim',
  corporate_hero_subtitle:
    'Ekibinizin yetkinliklerini geliştirecek, şirketinize özel tasarlanmış eğitim programları.',
  corporate_highlight1_title: 'İhtiyaca Özel Program',
  corporate_highlight1_desc: 'Şirketinizin hedeflerine göre tasarlanmış müfredat.',
  corporate_highlight2_title: 'Ekip Odaklı Atölyeler',
  corporate_highlight2_desc: 'Departmanlara özel grup çalışmaları ve vaka analizleri.',
  corporate_highlight3_title: 'Yerinde veya Online',
  corporate_highlight3_desc: 'Ofisinizde ya da online olarak esnek uygulama seçenekleri.',

  inperson_hero_title: 'Yüz Yüze Eğitim',
  inperson_hero_subtitle: "Sınıf ortamında, mentörlük destekli uygulamalı atölyeler ve bootcamp'ler.",
  inperson_highlight1_title: 'Sınıf Ortamında',
  inperson_highlight1_desc: 'Fiziksel sınıflarımızda uygulamalı, etkileşimli dersler.',
  inperson_highlight2_title: 'Yoğunlaştırılmış Programlar',
  inperson_highlight2_desc: "Hafta sonu bootcamp'leri ve haftalık kamp formatları.",
  inperson_highlight3_title: 'Mentörlük Desteği',
  inperson_highlight3_desc: 'Eğitim boyunca birebir mentörlük ve geri bildirim.',

  welcome_email_subject: "Medyator Akademi'ye Hoş Geldin!",
  welcome_email_body:
    'Merhaba {{name}},\n\nMedyator Akademi ailesine hoş geldin! Kurslarını hemen keşfetmeye başlayabilirsin.',
};

const insertSetting = db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)');
Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => insertSetting.run(key, value));

const instructors = [
  { name: 'Elif Demir', title: 'Kıdemli Pazarlama Eğitmeni', bio: '10 yıllık dijital pazarlama deneyimiyle marka stratejisi ve içerik pazarlaması üzerine dersler veriyor.', avatar_color: '#F0653C' },
  { name: 'Kaan Yılmaz', title: 'Yazılım Geliştirme Eğitmeni', bio: 'Full-stack geliştirici, React ve Node.js ekosistemi üzerine uygulamalı eğitimler hazırlıyor.', avatar_color: '#6C63B5' },
  { name: 'Zeynep Arslan', title: 'Psikolog & Eğitmen', bio: 'Klinik psikolog, iletişim ve liderlik becerileri üzerine kurumsal atölyeler düzenliyor.', avatar_color: '#3B9AB4' },
  { name: 'Mert Kaya', title: 'Kurumsal Eğitim Danışmanı', bio: 'Şirketlere özel ekip gelişimi ve satış eğitimleri tasarlıyor, saha deneyimi 12 yıl.', avatar_color: '#F0653C' },
];

const insertInstructor = db.prepare(
  'INSERT INTO instructors (name, title, bio, avatar_color) VALUES (@name, @title, @bio, @avatar_color)'
);
const instructorIds = instructors.map((i) => insertInstructor.run(i).lastInsertRowid);

const courses = [
  {
    title: 'Yeni Başlayanlar için Yaratıcı Yazarlık',
    category: 'Pazarlama',
    delivery_type: 'online',
    description: 'İçerik pazarlaması ve marka hikayeciliği için temel yazarlık becerilerini öğrenin.',
    cover_color: 'yellow',
    price: 1499,
    instructor_id: instructorIds[0],
    lessons: [
      'Yaratıcı Yazarlığa Giriş',
      'Hedef Kitleyi Anlamak',
      'Marka Sesi Oluşturmak',
      'Başlık ve Giriş Cümleleri',
      'Düzenleme ve Geri Bildirim',
    ],
  },
  {
    title: "Adobe Illustrator ile Dijital İllüstrasyon",
    category: 'Bilgisayar Bilimi',
    delivery_type: 'online',
    description: 'Sıfırdan Illustrator araçlarını öğrenip kendi dijital illüstrasyonlarınızı oluşturun.',
    cover_color: 'purple',
    instructor_id: instructorIds[1],
    lessons: [
      "Illustrator Aracını Tanımak",
      'Vektör Çizim Temelleri',
      'Renk ve Degrade Kullanımı',
      'Katmanlarla Çalışmak',
      'İlk İllüstrasyonunuzu Bitirmek',
      'Dışa Aktarma ve Paylaşım',
    ],
  },
  {
    title: 'Topluluk Önünde Konuşma ve Liderlik',
    category: 'Psikoloji',
    delivery_type: 'online',
    description: 'Sahne korkusunu yenin, ikna edici konuşma ve liderlik becerilerinizi geliştirin.',
    cover_color: 'blue',
    instructor_id: instructorIds[2],
    lessons: [
      'Topluluk Önünde Konuşmaya Giriş',
      'Beden Dili ve Ses Tonu',
      'Etkileyici Sunum Yapısı',
      'Soru-Cevap Yönetimi',
      'Zor Dinleyicilerle Başa Çıkmak',
      'Liderlik ve İletişim',
    ],
  },
  {
    title: 'Etkili Satış Teknikleri',
    category: 'Pazarlama',
    delivery_type: 'online',
    description: 'Müşteri ihtiyaçlarını analiz ederek satış kapama oranınızı artırın.',
    cover_color: 'yellow',
    instructor_id: instructorIds[0],
    lessons: ['Satış Sürecine Genel Bakış', 'İhtiyaç Analizi', 'İtirazları Yönetmek', 'Satışı Kapatmak'],
  },
  {
    title: 'Kurumlar için Ekip Gelişimi Programı',
    category: 'Kurumsal',
    delivery_type: 'corporate',
    description: 'Şirket içi ekiplerin iletişim ve iş birliğini güçlendiren özelleştirilebilir program.',
    cover_color: 'purple',
    instructor_id: instructorIds[3],
    lessons: [],
  },
  {
    title: 'Yöneticiler için Liderlik Atölyesi (Kurumsal)',
    category: 'Kurumsal',
    delivery_type: 'corporate',
    description: 'Orta ve üst düzey yöneticilere yönelik, şirket lokasyonunda uygulanan liderlik atölyesi.',
    cover_color: 'blue',
    instructor_id: instructorIds[2],
    lessons: [],
  },
  {
    title: 'Yüz Yüze Dijital Pazarlama Bootcamp',
    category: 'Yüz Yüze',
    delivery_type: 'in_person',
    description: 'Hafta sonu yoğunlaştırılmış, sınıf ortamında uygulamalı dijital pazarlama eğitimi.',
    cover_color: 'yellow',
    instructor_id: instructorIds[0],
    lessons: [],
  },
  {
    title: 'Yüz Yüze Yazılım Geliştirme Kampı',
    category: 'Yüz Yüze',
    delivery_type: 'in_person',
    description: '4 haftalık, ofiste düzenlenen, mentörlük destekli yazılım geliştirme kampı.',
    cover_color: 'purple',
    instructor_id: instructorIds[1],
    lessons: [],
  },
];

const insertCourse = db.prepare(
  `INSERT INTO courses (title, category, delivery_type, description, cover_color, price, instructor_id)
   VALUES (@title, @category, @delivery_type, @description, @cover_color, @price, @instructor_id)`
);
const insertLesson = db.prepare(
  `INSERT INTO lessons (course_id, title, duration_minutes, lesson_order, video_provider, video_id)
   VALUES (@course_id, @title, @duration_minutes, @lesson_order, @video_provider, @video_id)`
);

courses.forEach((course) => {
  const courseId = insertCourse.run({ ...course, price: course.price ?? 999 }).lastInsertRowid;
  course.lessons.forEach((title, index) => {
    insertLesson.run({
      course_id: courseId,
      title,
      duration_minutes: 15 + ((index * 7) % 40),
      lesson_order: index + 1,
      video_provider: index % 2 === 0 ? 'youtube' : 'vimeo',
      video_id: 'REPLACE_WITH_REAL_VIDEO_ID',
    });
  });
});

console.log('Seed tamamlandı:', {
  instructors: instructors.length,
  courses: courses.length,
  lessons: courses.reduce((sum, c) => sum + c.lessons.length, 0),
  admin: `${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`,
});
