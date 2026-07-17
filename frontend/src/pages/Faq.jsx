import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './DeliveryPage.css';
import './Faq.css';

const FAQS = [
  {
    question: 'Eğitimler nasıl gerçekleşiyor?',
    answer:
      'Eğitimlerimizin hepsi online olarak sadece Medyator Akademi web sitemiz üzerinden gerçekleşmektedir. Satın aldıktan sonra eğitim videolarına platform üzerinden erişebilirsin.',
  },
  {
    question: 'Eğitim sonrasında destek var mı?',
    answer:
      'Evet, üç farklı destek seçeneğimiz var: düzenli canlı yayınlar (ömür boyu, ücretsiz erişim), bire bir görüşmeler (2x30 dakika ücretsiz) ve WhatsApp grup desteği ile eğitmenle doğrudan iletişim.',
  },
  {
    question: 'Eğitimlerde bire bir & canlı bağlantılar nasıl oluyor?',
    answer: 'Öğrenciler entegre Zoom üzerinden iki adet 30 dakikalık ücretsiz canlı görüşme hakkı kazanır.',
  },
  {
    question: 'Eğitimlerde 2x30dk ücretsiz görüşme sonrasında tekrar görüşebilir miyiz?',
    answer: 'Ücretsiz görüşme hakların bittikten sonra platform üzerinden ek danışmanlık paketleri satın alınabilir.',
  },
  {
    question: 'Eğitimler kimler için uygun?',
    answer: 'Eğitimlerimiz hem sıfırdan başlayan kişiler için hem de alanında uzman kişiler için uygundur.',
  },
  {
    question: 'Eğitimler güncel mi?',
    answer:
      'Evet. Eğitimlerimiz, platformlardaki özellikler değiştikçe eğitmenlerimiz tarafından düzenli olarak güncellenir ve güncel bilgi sunulmaya devam edilir.',
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="delivery-page">
      <section className="delivery-page__hero container">
        <h1>Sıkça Sorulan Sorular</h1>
        <p>Aklınıza takılan soruların cevabını burada bulabilirsiniz.</p>
      </section>

      <section className="container delivery-page__section">
        {FAQS.map((item, i) => (
          <div className="card faq__item" key={item.question}>
            <button className="faq__question" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
              <span>{item.question}</span>
              <ChevronDown size={18} className={`faq__chevron${openIndex === i ? ' faq__chevron--open' : ''}`} />
            </button>
            {openIndex === i && <p className="faq__answer">{item.answer}</p>}
          </div>
        ))}
      </section>
    </div>
  );
}
