import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { api } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import './DeliveryPage.css';
import './Faq.css';

export default function Faq() {
  const { settings } = useSettings();
  const [openIndex, setOpenIndex] = useState(null);
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    api.getFaq().then(setFaqs);
  }, []);

  return (
    <div className="delivery-page">
      <section className="delivery-page__hero container">
        <h1>{settings.faq_hero_title || 'Sıkça Sorulan Sorular'}</h1>
        <p>{settings.faq_hero_subtitle || 'Aklınıza takılan soruların cevabını burada bulabilirsiniz.'}</p>
      </section>

      <section className="container delivery-page__section">
        {faqs.map((item, i) => (
          <div className="card faq__item" key={item.id}>
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
