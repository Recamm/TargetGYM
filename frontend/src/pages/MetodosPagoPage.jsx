import { useState } from 'react';
import { listarMetodosPagoGestion, configurarMetodoPago } from '../services/membresiasService.js';
import useResource from '../utils/useResource.js';
import { useNotifications } from '../components/NotificationContext.js';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
import Button from '../components/Button.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

export default function MetodosPagoPage() {
    const resource = useResource(listarMetodosPagoGestion), notices = useNotifications();
    const [operation, setOperation] = useState(null);
    return <><PageHeader title="Métodos de pago" description="Elegí qué métodos pueden usar los socios al asociarse o renovar. El administrador conserva todos para registrar dinero recibido, incluso si están deshabilitados." />
        <ResourceState resource={resource}>
            {resource.data?.length === 0 && <EmptyState>No hay métodos configurados. Revisá la configuración del sistema.</EmptyState>}
            <div className="card-grid plan-management">{resource.data?.map(metodo => <article className="form-panel" key={metodo.codigo} aria-labelledby={`metodo-${metodo.codigo}`}>
                <h2 id={`metodo-${metodo.codigo}`}>{metodo.codigo}</h2>
                <span className="badge">{metodo.habilitado ? metodo.permiteSocio ? 'Disponible para socios' : 'Solo caja' : 'Deshabilitado para socios'}</span>
                <p>{metodo.permiteSocio ? 'Apagarlo lo oculta en nuevas asociaciones y renovaciones. Las solicitudes anteriores y el historial se conservan.' : 'Tarjeta se registra solo en caja por un cobro externo. No hay una pasarela online; su estado controla el aviso en caja, no habilita pagos desde la web.'}</p>
                <Button variant="secondary" disabled={Boolean(operation) || resource.loading || Boolean(resource.error)} onClick={() => setOperation(metodo)}>{metodo.habilitado ? 'Deshabilitar' : 'Habilitar'}</Button>
            </article>)}</div>
        </ResourceState>
        {operation && <ConfirmDialog title={operation.habilitado ? '¿Deshabilitar el método?' : '¿Habilitar el método?'} onClose={() => setOperation(null)} onConfirm={async () => {
            await configurarMetodoPago(operation.codigo, { habilitado: !operation.habilitado });
            notices.notify(`Se ${operation.habilitado ? 'deshabilitó' : 'habilitó'} ${operation.codigo}. Las solicitudes anteriores se conservan.`);
            setOperation(null); resource.reload();
        }}><p>{operation.codigo}. {operation.permiteSocio ? operation.habilitado ? 'Los socios no podrán elegirlo en nuevas solicitudes. El administrador podrá seguir usándolo con un aviso.' : 'Volverá a estar disponible para nuevas asociaciones y renovaciones.' : 'Solo cambia el estado y su aviso en caja. Tarjeta sigue sin ofrecerse como pago online a socios.'}</p></ConfirmDialog>}
    </>;
}
