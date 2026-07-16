export function requireInstructor(req, res, next) {
  if (req.user?.role !== 'instructor') {
    return res.status(403).json({ error: 'Bu işlem için eğitmen yetkisi gerekli' });
  }
  next();
}

// Instructors and students are stored in separate tables with independent
// id sequences, so a numeric id collision between them is expected, not an
// edge case. Any route that trusts req.user.id as a foreign key into the
// users table must reject instructor tokens explicitly first.
export function rejectInstructor(req, res, next) {
  if (req.user?.role === 'instructor') {
    return res.status(403).json({ error: 'Bu işlem eğitmen hesapları için kullanılamaz' });
  }
  next();
}
