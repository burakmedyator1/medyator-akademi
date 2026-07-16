import { avatarColorFor } from './colors';
import './AvatarStack.css';

// No real classmate data is tracked yet, so we derive a stable-looking
// pseudo count/initials from the course id purely for visual fidelity.
export default function AvatarStack({ seed = 0, total = 40 }) {
  const initials = ['AB', 'MK', 'ZE', 'CT'];
  const shown = initials.slice(0, 3);

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
