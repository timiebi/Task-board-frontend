interface FilterPillsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
}: FilterPillsProps<T>) {
  return (
    <div className="pill-group" role="tablist">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          className={`pill ${value === opt.value ? "pill-active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
