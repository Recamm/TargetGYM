export default function PageHeader({ title, description, children }) {
    return <div className="page-heading page-header"><div><h1 tabIndex={-1}>{title}</h1>{description && <p>{description}</p>}</div>{children && <div className="actions">{children}</div>}</div>;
}
