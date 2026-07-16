export default function Pill({ active, children, ...rest }) {
  return (
    <button className={`pill${active ? ' active' : ''}`} {...rest}>
      {children}
    </button>
  );
}
