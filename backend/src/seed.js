import bcrypt from 'bcryptjs';
import prisma from './prisma.js';

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

const DEFAULT_SETTINGS = {
  'bg-cream': '#f5f1e8',
  navy: '#1b1e29',
  orange: '#f0653c',
  yellow: '#f5c94f',
  purple: '#c9b7e4',
  blue: '#a9d3e5',
  'price-tag': '#f0653c',
  'navbar-bg': '#f5f1e8',
  'footer-bg': '#1b1e29',
  'cursor-glow': '#f0653c',
  'cursor-glow-intensity': '12',
  logo_url: '',
  navbar_logo_height: '34',
  footer_logo_height: '30',
  splash_logo_width: '380',
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

  cart_reminder_email_subject: 'Sepetini tamamlamayı unutma, {{name}}!',
  cart_reminder_email_body:
    'Merhaba {{name}},\n\n{{course}} kursunu sepetine eklemiştin ama satın alma işlemini tamamlamamışsın. ' +
    '{{price}} TL karşılığında hemen kaydını tamamlayabilirsin:\n{{link}}\n\nSeni aramızda görmek isteriz!',
};

const INSTRUCTORS = [
  { name: 'Elif Demir', title: 'Kıdemli Pazarlama Eğitmeni', bio: '10 yıllık dijital pazarlama deneyimiyle marka stratejisi ve içerik pazarlaması üzerine dersler veriyor.', avatarColor: '#F0653C' },
  { name: 'Kaan Yılmaz', title: 'Yazılım Geliştirme Eğitmeni', bio: 'Full-stack geliştirici, React ve Node.js ekosistemi üzerine uygulamalı eğitimler hazırlıyor.', avatarColor: '#6C63B5' },
  { name: 'Zeynep Arslan', title: 'Psikolog & Eğitmen', bio: 'Klinik psikolog, iletişim ve liderlik becerileri üzerine kurumsal atölyeler düzenliyor.', avatarColor: '#3B9AB4' },
  { name: 'Mert Kaya', title: 'Kurumsal Eğitim Danışmanı', bio: 'Şirketlere özel ekip gelişimi ve satış eğitimleri tasarlıyor, saha deneyimi 12 yıl.', avatarColor: '#F0653C' },
];

const TESTIMONIALS = [
  {
    studentName: 'Deniz Yıldız',
    studentTitle: 'Sosyal Medya Kursu Mezunu',
    quote: 'Kursu bitirdikten sonra edindiğim bilgilerle ilk müşterimi kazandım. Anlatım çok akıcı ve uygulamalıydı.',
    rating: 5,
    avatarColor: '#F0653C',
  },
  {
    studentName: 'Cem Aydın',
    studentTitle: 'Yazılım Geliştirme Kursu Mezunu',
    quote: 'Sıfırdan başlayıp kendi projemi geliştirebilecek seviyeye geldim. Eğitmenin geri bildirimleri çok değerliydi.',
    rating: 5,
    avatarColor: '#6C63B5',
  },
  {
    studentName: 'Selin Koç',
    studentTitle: 'Kurumsal Eğitim Katılımcısı',
    quote: 'Ekibimizle katıldığımız atölye sonrası iletişimimiz ve iş birliğimiz gözle görülür şekilde iyileşti.',
    rating: 5,
    avatarColor: '#3B9AB4',
  },
];

const COURSES = [
  {
    title: 'Yeni Başlayanlar için Yaratıcı Yazarlık',
    category: 'Pazarlama',
    deliveryType: 'online',
    description: 'İçerik pazarlaması ve marka hikayeciliği için temel yazarlık becerilerini öğrenin.',
    coverColor: 'yellow',
    price: 1499,
    instructorIndex: 0,
    lessons: [
      'Yaratıcı Yazarlığa Giriş',
      'Hedef Kitleyi Anlamak',
      'Marka Sesi Oluşturmak',
      'Başlık ve Giriş Cümleleri',
      'Düzenleme ve Geri Bildirim',
    ],
  },
  {
    title: 'Adobe Illustrator ile Dijital İllüstrasyon',
    category: 'Bilgisayar Bilimi',
    deliveryType: 'online',
    description: 'Sıfırdan Illustrator araçlarını öğrenip kendi dijital illüstrasyonlarınızı oluşturun.',
    coverColor: 'purple',
    instructorIndex: 1,
    lessons: [
      'Illustrator Aracını Tanımak',
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
    deliveryType: 'online',
    description: 'Sahne korkusunu yenin, ikna edici konuşma ve liderlik becerilerinizi geliştirin.',
    coverColor: 'blue',
    instructorIndex: 2,
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
    deliveryType: 'online',
    description: 'Müşteri ihtiyaçlarını analiz ederek satış kapama oranınızı artırın.',
    coverColor: 'yellow',
    instructorIndex: 0,
    lessons: ['Satış Sürecine Genel Bakış', 'İhtiyaç Analizi', 'İtirazları Yönetmek', 'Satışı Kapatmak'],
  },
  {
    title: 'Kurumlar için Ekip Gelişimi Programı',
    category: 'Kurumsal',
    deliveryType: 'corporate',
    description: 'Şirket içi ekiplerin iletişim ve iş birliğini güçlendiren özelleştirilebilir program.',
    coverColor: 'purple',
    instructorIndex: 3,
    lessons: [],
  },
  {
    title: 'Yöneticiler için Liderlik Atölyesi (Kurumsal)',
    category: 'Kurumsal',
    deliveryType: 'corporate',
    description: 'Orta ve üst düzey yöneticilere yönelik, şirket lokasyonunda uygulanan liderlik atölyesi.',
    coverColor: 'blue',
    instructorIndex: 2,
    lessons: [],
  },
  {
    title: 'Yüz Yüze Dijital Pazarlama Bootcamp',
    category: 'Yüz Yüze',
    deliveryType: 'in_person',
    description: 'Hafta sonu yoğunlaştırılmış, sınıf ortamında uygulamalı dijital pazarlama eğitimi.',
    coverColor: 'yellow',
    instructorIndex: 0,
    lessons: [],
  },
  {
    title: 'Yüz Yüze Yazılım Geliştirme Kampı',
    category: 'Yüz Yüze',
    deliveryType: 'in_person',
    description: '4 haftalık, ofiste düzenlenen, mentörlük destekli yazılım geliştirme kampı.',
    coverColor: 'purple',
    instructorIndex: 1,
    lessons: [],
  },
];

async function main() {
  // Bağımlı tablolardan ana tablolara doğru temizle (FK sırası).
  await prisma.questionMessage.deleteMany();
  await prisma.question.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.course.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.contactRequest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.siteSetting.deleteMany();

  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, 10),
      name: 'Medyator Akademi Admin',
      role: 'admin',
      phone: '+90 555 000 0000',
      instagram: 'medyatorakademi',
    },
  });

  await prisma.siteSetting.createMany({
    data: Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value })),
  });

  const instructorIds = [];
  for (const instructor of INSTRUCTORS) {
    const created = await prisma.instructor.create({ data: instructor });
    instructorIds.push(created.id);
  }

  await prisma.testimonial.createMany({
    data: TESTIMONIALS.map((t, i) => ({ ...t, displayOrder: i })),
  });

  let lessonCount = 0;
  for (const course of COURSES) {
    const created = await prisma.course.create({
      data: {
        title: course.title,
        category: course.category,
        deliveryType: course.deliveryType,
        description: course.description,
        coverColor: course.coverColor,
        price: course.price ?? 999,
        instructorId: instructorIds[course.instructorIndex],
      },
    });
    for (const [index, title] of course.lessons.entries()) {
      await prisma.lesson.create({
        data: {
          courseId: created.id,
          title,
          durationMinutes: 15 + ((index * 7) % 40),
          lessonOrder: index + 1,
          videoProvider: index % 2 === 0 ? 'youtube' : 'vimeo',
          videoId: 'REPLACE_WITH_REAL_VIDEO_ID',
        },
      });
      lessonCount++;
    }
  }

  console.log('Seed tamamlandı:', {
    instructors: INSTRUCTORS.length,
    courses: COURSES.length,
    lessons: lessonCount,
    admin: `${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
