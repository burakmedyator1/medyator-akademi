import { avatarColorFor } from './colors';
import './AvatarStack.css';

const INITIALS_POOL = [
  'AB', 'MK', 'ZE', 'CT', 'EY', 'SD', 'BK', 'NP', 'RT', 'HG', 'LM', 'FS', 'OY', 'DK', 'TC', 'PY',
];

// Deterministically shuffle the pool using the seed so each course always
// shows the same-looking trio instead of a different one on every render.
function pickInitials(seed, count) {
  const pool = [...INITIALS_POOL];
  const picked = [];
  let s = (seed || 0) + 1;
  for (let i = 0; i < count && pool.length > 0; i++) {
    s = (s * 9301 + 49297) % 233280;
    const idx = s % pool.length;
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

// No real classmate data is tracked yet, so we derive a stable-looking
// pseudo count/initials from the course id purely for visual fidelity.
export default function AvatarStack({ seed = 0, total = 40 }) {
  const shown = pickInitials(seed, 3);

  return (
    <div className="avatar-stack">
      {shown.map((initial, i) => (
        <span
          key={initial}
          className="avatar-stack__item"
          style={{ background: avatarColorFor(seed + i), zIndex: shown.length - i }}
        >
          {initial}
        </span>
      ))}
      <span className="avatar-stack__more">+{total}</span>
    </div>
  );
}
