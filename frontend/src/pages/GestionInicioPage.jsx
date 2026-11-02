import { Link } from 'react-router-dom';
import { listarSocios } from '../services/sociosService.js';
import useResource from '../utils/useResource.js';
import { fechaHora } from '../utils/validation.js';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
import Button from '../components/Button.jsx';

export default function GestionInicioPage() {
    const resource = useResource(listarSocios, 30000);
    const pendientes = (resource.data ?? []).filter(socio => socio.estado === 'activo' && socio.tipoPlan)
        .sort((a, b) => Number(Boolean(b.pagoReportadoEn)) - Number(Boolean(a.pagoReportadoEn)));
    const vencimientos = (resource.data ?? []).filter(socio => socio.estado === 'activo' && (socio.proximaAVencer || socio.membresia?.estado === 'vencida'));
    return <><PageHeader title="Hoy en Target" description="Altas, pagos y membresías. Primero, lo que necesita tu atención.">
        <Button variant="secondary" onClick={resource.reload}>Actualizar</Button><Link className="button primary" to="/gestion/socios/nuevo">Nuevo socio</Link>
    </PageHeader>
        <ResourceState resource={resource}>
            <section aria-labelledby="pendientes-title"><h2 id="pendientes-title">Altas y pagos pendientes <span className="badge">{pendientes.length}</span></h2>
                <p>Verificá el dinero recibido antes de registrar un pago. Una transferencia informada por el socio no es un cobro confirmado.</p>
                {pendientes.length === 0 ? <EmptyState>No hay solicitudes de pago pendientes.</EmptyState> : <ul className="records">{pendientes.map(socio => <li key={socio.id}>
                    <div className="record-heading"><h3>{socio.nombre} {socio.apellido}</h3><span className="badge">{socio.pagoReportadoEn ? 'Transferencia a revisar' : 'Pendiente de pago'}</span></div>
                    <p>{socio.nombrePlanSolicitado} · {socio.metodoPagoSolicitado ?? 'Método por coordinar'}{socio.solicitadoEn && ` · ${fechaHora(socio.solicitadoEn)}`}</p>
                    {socio.accesoPendiente && <p>Falta entregar el acceso a la web.</p>}
                    <div className="actions"><Link className="button secondary" to={`/gestion/socios/${socio.id}`}>Ver socio</Link><Link className="text-link" to={`/gestion/pagos?socio=${socio.id}`}>Registrar pago confirmado</Link></div>
                </li>)}</ul>}
            </section>
            <section aria-labelledby="vencimientos-title"><h2 id="vencimientos-title">Membresías por revisar</h2>
                {vencimientos.length === 0 ? <EmptyState>No hay membresías vencidas ni próximas a vencer en los siguientes 7 días.</EmptyState> : <ul className="records">{vencimientos.map(socio => <li key={socio.id}>
                    <h3>{socio.nombre} {socio.apellido}</h3><p>{socio.membresia.nombrePlan} · {socio.membresia.estado} · {fechaHora(socio.membresia.fechaVencimiento)}</p><Link className="text-link" to={`/gestion/socios/${socio.id}`}>Revisar membresía</Link>
                </li>)}</ul>}
            </section>
        </ResourceState>
    </>;
}
