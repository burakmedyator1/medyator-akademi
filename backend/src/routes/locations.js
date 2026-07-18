import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Mahalle/köy -> posta kodu eşleşmesi PTT kaynaklı; il/ilçe altındaki her
// mahallenin kendi posta kodu var (bazı ilçelerde tüm mahalleler aynı kodu
// paylaşır, büyük şehirlerde her mahallenin kodu farklı olabilir) — bu yüzden
// posta kodu her zaman seçilen mahalleden okunur, ilçe/mahalle ayrımı için
// ayrı bir mantık gerekmez.
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'turkiye-il-ilce-mahalle-postakodu.json'), 'utf-8')
);

const cities = Object.keys(data).sort((a, b) => a.localeCompare(b, 'tr'));

const router = Router();

router.get('/cities', (req, res) => {
  res.json(cities);
});

router.get('/districts', (req, res) => {
  const city = data[req.query.city];
  if (!city) return res.json([]);
  res.json(Object.keys(city).sort((a, b) => a.localeCompare(b, 'tr')));
});

router.get('/neighborhoods', (req, res) => {
  const districts = data[req.query.city];
  const neighborhoods = districts?.[req.query.district];
  if (!neighborhoods) return res.json([]);
  const list = Object.entries(neighborhoods).map(([name, postCode]) => ({ name, postCode }));
  list.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  res.json(list);
});

export default router;
