import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
export default function NotFoundPage() {
    return <><PageHeader title="Esta página no existe" description="Revisá la dirección o volvé a la agenda." /><Link className="button primary" to="/clases">Ver clases</Link></>;
}
