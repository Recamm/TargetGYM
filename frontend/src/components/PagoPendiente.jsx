import { useState } from 'react';
import { useAuth } from './AuthContext.js';
import { useNotifications } from './NotificationContext.js';
import { informarTransferencia } from '../services/membresiasService.js';
import InstruccionesPago from './InstruccionesPago.jsx';
import Button from './Button.jsx';

export default function PagoPendiente() {
    const { usuario, refresh } = useAuth(), notices = useNotifications();
    const [busy, setBusy] = useState(false);
    if (!usuario.tipoPlan) return null;
    async function informar() {
        setBusy(true);
        try {
            await informarTransferencia();
            await refresh();
            notices.notify('Transferencia informada. El administrador debe verificar el dinero recibido; la membresía todavía no se activa.');
        } catch (error) { notices.error(error); }
        finally { setBusy(false); }
    }
    return <section className="summary-panel pending-payment" aria-labelledby="pago-pendiente-title">
        <span className="badge">{usuario.pagoReportadoEn ? 'Pago a revisar' : 'Pendiente de pago'}</span>
        <h2 id="pago-pendiente-title">{usuario.pagoReportadoEn ? 'Estamos revisando tu transferencia' : 'Tu cuenta está creada'}</h2>
        <p>Plan solicitado: {usuario.nombrePlanSolicitado}. La membresía solicitada solo se activa cuando el administrador confirma el pago.</p>
        <InstruccionesPago metodo={usuario.metodoPagoSolicitado} />
        {usuario.metodoPagoSolicitado === 'Transferencia' && !usuario.pagoReportadoEn && <Button variant="secondary" busy={busy} disabled={usuario.estado !== 'activo'} onClick={informar}>Ya realicé la transferencia</Button>}
        {usuario.pagoReportadoEn && <p>Informar el pago no acredita dinero. Podés consultar el estado con recepción.</p>}
    </section>;
}
