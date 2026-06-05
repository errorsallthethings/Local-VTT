interface NameDialogProps {
  title: string;
  label: string;
  value: string;
  submitLabel: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export function NameDialog({ title, label, value, submitLabel, onChange, onCancel, onSubmit }: NameDialogProps) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <form
        className="modal"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <h2>{title}</h2>
        <label>
          {label}
          <input
            autoFocus
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
        <div className="button-row modal-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" disabled={!value.trim()}>
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
