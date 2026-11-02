import gimnasio from '../../../info/target-gym/datos-verificados.json';

export default function InstruccionesPago({ metodo }) {
    return <div className="payment-instructions">
        {metodo === 'Efectivo' ? <p>Pagá en recepción. Tu membresía se activa cuando el administrador confirma el cobro.</p>
            : metodo === 'Transferencia' ? <p>Pedí los datos de transferencia al gimnasio. Después de pagar, informalo desde Mi espacio; el administrador debe verificar que recibió el dinero.</p>
                : <p>Coordiná el método y el pago con el gimnasio. Todavía no hay un método registrado para esta solicitud.</p>}
        <a className="text-link" href={gimnasio.contacto.whatsappHref}>Coordinar el pago por WhatsApp</a>
    </div>;
}
