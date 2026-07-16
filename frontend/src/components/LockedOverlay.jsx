import { Lock } from 'lucide-react';
import './LockedOverlay.css';

export default function LockedOverlay({ onEnroll, enrolling, courseTitle }) {
  return (
    <div className="locked-overlay">
      <Lock size={32} />
      <h3>Bu ders kilitli</h3>
      <p>
        <strong>{courseTitle}</strong> kursuna kayıtlı olmadığın için video içeriğine erişemiyorsun.
      </p>
      <button className="btn btn-primary" onClick={onEnroll} disabled={enrolling}>
        {enrolling ? 'Kayıt yapılıyor...' : 'Kayıt Ol ve İzle'}
      </button>
    </div>
  );
}
