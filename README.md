# Medyator Akademi

Online, kurumsal ve yüz yüze eğitim platformu. React + Vite frontend, Express + SQLite backend.

## Yerel geliştirme

Backend ve frontend ayrı süreçler olarak, iki terminalde çalıştırılır (Vite dev server `/api` ve `/uploads` isteklerini backend'e proxy'ler).

```bash
# 1. Backend
cd backend
npm install
npm run seed   # örnek veri + admin hesabı oluşturur (sadece ilk kurulumda / sıfırlamak istediğinde)
npm run dev    # http://localhost:4000

# 2. Frontend (başka bir terminalde)
cd frontend
npm install
npm run dev    # http://localhost:5173
```

Varsayılan admin girişi (seed sonrası, `ADMIN_EMAIL`/`ADMIN_PASSWORD` ortam değişkenleri ayarlanmazsa): `admin@medyatorakademi.com` / `Admin123!` — bu sadece yerel geliştirme içindir, canlıda kullanma.

## Proje yapısı

```
backend/    Express API + SQLite (better-sqlite3)
  src/routes/       auth, courses, instructors, me, contact, settings, admin
  src/middleware/   requireAuth, requireAdmin, rate limiting
  src/db.js         şema + otomatik migration/backfill
  src/seed.js       örnek veri + admin hesabı
  src/storagePath.js  kalıcı veri klasörünün konumu (DATA_DIR ile değiştirilebilir)
  storage/          SQLite veritabanı + yüklenen dosyalar (git'e dahil değil)

frontend/   React + Vite
  src/pages/        genel sayfalar (Landing, Courses, Lesson, vb.)
  src/pages/admin/  admin paneli sayfaları
  src/components/   paylaşılan UI bileşenleri
  src/context/      AuthContext, SettingsContext
```

## Production build (tek servis)

Kökteki `package.json`, frontend'i derleyip backend'in aynı süreçte sunmasını sağlar — tek bir Node servisi deploy edilir:

```bash
npm run build   # frontend/dist oluşturur + backend bağımlılıklarını kurar
npm start       # backend, API + derlenmiş frontend'i aynı porttan sunar
npm run seed    # (sadece ilk deploy'da) admin hesabı + örnek veriyi oluşturur
```

### Gerekli ortam değişkenleri

| Değişken | Açıklama |
|---|---|
| `JWT_SECRET` | Oturum token'larını imzalamak için rastgele, uzun bir metin. **Prod'da mutlaka ayarla** (`openssl rand -hex 32`). |
| `NODE_ENV` | `production` olarak ayarla. |
| `PORT` | Servisin dinleyeceği port (çoğu PaaS bunu otomatik sağlar). |
| `ADMIN_EMAIL` | `npm run seed` çalıştırılırken oluşturulacak admin hesabının e-postası. **Prod'da mutlaka ayarla**, aksi halde varsayılan (herkese açık kaynak kodunda yazılı) değer kullanılır. |
| `ADMIN_PASSWORD` | Aynı admin hesabının şifresi. **Prod'da mutlaka güçlü, rastgele bir değer ayarla** — seed'i çalıştırmadan önce. |
| `DATA_DIR` | SQLite veritabanı + yüklenen dosyaların saklanacağı klasör. **Prod'da persistent disk'in mount edildiği yolu buraya yaz** (örn. `/var/data`). Ayarlanmazsa `backend/storage` kullanılır. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Kayıt olan öğrencilere gönderilen hoş geldin e-postası için SMTP ayarları. `SMTP_HOST` ayarlanmazsa e-posta gönderimi sessizce atlanır (log'da uyarı görünür). Mevcut Google Workspace adresini bir Uygulama Şifresi ile `smtp.gmail.com` üzerinden kullanabilirsin. |
| `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL` | Ücretli kurs satın alma için iyzico ödeme anahtarları. Ayarlanmazsa satın alma sayfası "henüz hazır değil" mesajı gösterir, hataya düşmez. Sandbox (test) anahtarlarını ücretsiz olarak https://merchant.iyzipay.com adresinden alabilirsin; gerçek ödeme almak için merchant başvurunun onaylanması ve `IYZICO_BASE_URL=https://api.iyzipay.com` yapman gerekir. |
| `APP_BASE_URL` | Sitenin canlı adresi (örn. `https://medyagency.co`). iyzico'nun ödeme sonrası geri döneceği callback linkini oluşturmak için kullanılır; genelde otomatik algılanır ama garantiye almak için ayarlaman önerilir. |

### Kalıcı veri

`DATA_DIR` (varsayılan: `backend/storage/`) altında `data.db` ve `uploads/` tutulur, git'e dahil değildir. Deploy platformunda kalıcı diski **`DATA_DIR` neyse tam olarak o yola** bağla — projenin kod klasörlerinden birinin (örn. `backend/`) üzerine bağlarsan, disk o klasördeki kodu (package.json dahil) görünmez hale getirir ve uygulama başlamaz.

### Yedekleme

Admin Panel → Genel Bakış → **Veritabanı Yedeği İndir** — SQLite dosyasının anlık bir kopyasını indirir. Düzenli aralıklarla indirip saklamanız önerilir (otomatik bulut yedeği kurulu değildir).

## Güvenlik notları

- Login/kayıt uçlarında IP başına 15 dakikada 20 deneme sınırı var (brute-force koruması).
- Video koruması: ders videosunun ID'si yalnızca giriş yapmış + kursa **onaylı** kayıtlı kullanıcıya döner. Ama YouTube/Vimeo embed teknolojisinin doğası gereği, dersi izleyebilen bir kullanıcı tarayıcı geliştirici araçlarıyla video ID'sini görebilir. Tam domain kilidi için Vimeo'nun ücretli "domain-restricted" özelliği gerekir.
