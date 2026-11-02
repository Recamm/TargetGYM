export default function FormField({ label, name, error, hint, options, multiline = false, ...props }) {
    const description = [hint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(' ');
    const attributes = { id: name, name, 'aria-invalid': error ? true : undefined, 'aria-describedby': description || undefined, ...props };
    return <div className="form-field">
        <label htmlFor={name}>{label}</label>
        {options ? <select {...attributes}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : multiline ? <textarea rows={3} {...attributes} /> : <input {...attributes} />}
        {hint && <small id={`${name}-hint`}>{hint}</small>}
        {error && <small id={`${name}-error`} className="field-error">{error}</small>}
    </div>;
}
