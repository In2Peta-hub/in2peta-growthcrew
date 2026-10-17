/* A segmented switch built from real radios, so arrow keys, labels and
   screen readers work natively; the thumb slides under the checked option.
   options: [{ value, label, icon? }] */
export default function Segmented({ name, value, options, onChange, label, block = false, className = '' }) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div
      className={`ui-seg ${block ? 'ui-seg-block' : ''} ${className}`}
      role="radiogroup"
      aria-label={label}
      style={{ '--seg-i': index, '--seg-n': options.length }}
    >
      <span className="ui-seg-thumb" aria-hidden="true" />
      {options.map((o) => {
        const Icon = o.icon;
        return (
          <label key={o.value} className="ui-seg-opt" data-on={o.value === value || undefined}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={o.value === value}
              onChange={() => onChange(o.value)}
            />
            {Icon && <Icon aria-hidden="true" />}
            <span>{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}
