import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import './PaymentResult.css';

const CONTENT = {
  basarili: {
    icon: CheckCircle2,
    color: '#2f8a4e',
    title: 'Ödemen alındı!',
    message: 'Kursa erişimin açıldı. Kurslarım sekmesinden derslerine başlayabilirsin.',
  },
  basarisiz: {
    icon: XCircle,
    color: '#c0392b',
    title: 'Ödeme başarısız oldu',
    message: 'Ödemen tamamlanamadı. Lütfen tekrar dene veya farklı bir kartla ödeme yapmayı deneyebilirsin.',
  },
  hata: {
    icon: AlertCircle,
    color: '#c0392b',
    title: 'Bir şeyler ters gitti',
    message: 'Ödeme durumu doğrulanamadı. Lütfen bizimle iletişime geç.',
  },
};

export default function PaymentResult() {
  const [params] = useSearchParams();
  const durum = params.get('durum') || 'hata';
  const { icon: Icon, color, title, message } = CONTENT[durum] || CONTENT.hata;

  return (
    <div className="container payment-result">
      <div className="card payment-result__card">
        <Icon size={48} color={color} />
        <h1>{title}</h1>
        <p>{message}</p>
        <Link to="/panel" className="btn btn-primary">
          Kurslarıma Git
        </Link>
      </div>
    </div>
  );
}
