import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { api } from '../../api/client';
import AdminLayout from './AdminLayout';
import './AdminCommon.css';

const EMPTY_FORM = { code: '', discountPercent: 10, active: true };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    api.admin.getCoupons().then(setCoupons);
  }

  useEffect(load, []);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  }

  function startEdit(coupon) {
    setEditingId(coupon.id);
    setForm({ code: coupon.code, discountPercent: coupon.discountPercent, active: coupon.active });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        code: form.code,
        discountPercent: Number(form.discountPercent),
        active: form.active,
      };
      if (editingId) {
        await api.admin.updateCoupon(editingId, payload);
      } else {
        await api.admin.createCoupon(payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, code) {
    if (!window.confirm(`"${code}" kodunu silmek istediğine emin misin?`)) return;
    try {
      await api.admin.deleteCoupon(id);
      load();
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page-head">
        <h1>Kampanya Kodları</h1>
        <button className="btn btn-primary" onClick={resetForm}>
          <Plus size={16} /> Yeni Kod
        </button>
      </div>

      <div className="admin-split">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kod</th>
                <th>İndirim</th>
                <th>Durum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="clickable" onClick={() => startEdit(coupon)}>
                  <td style={{ fontWeight: 700, letterSpacing: '0.03em' }}>{coupon.code}</td>
                  <td>%{coupon.discountPercent}</td>
                  <td>
                    <span className={`admin-badge ${coupon.active ? 'admin-badge--approved' : 'admin-badge--rejected'}`}>
                      {coupon.active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(coupon.id, coupon.code);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-empty">
                    Henüz kampanya kodu yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Kodu Düzenle' : 'Yeni Kod'}</h2>
          {error && <div className="auth-error">{error}</div>}

          <div className="admin-field">
            <label>Kod (satın alma sayfasında bu kod girilir)</label>
            <input
              required
              value={form.code}
              placeholder="ör. INDIRIM20"
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>İndirim Oranı (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={form.discountPercent}
              onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
            />
          </div>
          <div className="admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              id="coupon-active"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <label htmlFor="coupon-active" style={{ margin: 0 }}>
              Aktif (kapatırsan kod çalışmaz)
            </label>
          </div>

          <div className="admin-form__actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Ekle'}
            </button>
            {editingId && (
              <button className="btn btn-outline" type="button" onClick={resetForm}>
                Vazgeç
              </button>
            )}
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
