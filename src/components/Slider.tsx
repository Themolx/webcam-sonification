interface SliderProps {
  label: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export function Slider({
  label,
  value,
  defaultValue,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
}: SliderProps) {
  const isModified = value !== defaultValue;
  const displayValue = formatValue ? formatValue(value) : value;

  const handleReset = () => {
    onChange(defaultValue);
  };

  return (
    <div className="control-group">
      <label>
        {label}: {displayValue}
        {isModified && (
          <button
            className="reset-circle"
            onClick={handleReset}
            title="Reset to default"
            type="button"
          />
        )}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
