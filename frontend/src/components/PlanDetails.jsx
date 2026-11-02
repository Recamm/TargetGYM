import { periodoPlan } from '../utils/planes.js';

export function PlanConditions({ plan }) {
    return <>
        {plan.metodoExclusivo && <p className="help-text">Solo {plan.metodoExclusivo.toLowerCase()}.</p>}
        {plan.permiteTarjeta === false && !plan.metodoExclusivo && <p className="help-text">Pago en efectivo o transferencia.</p>}
        {plan.requisitosAcceso && <p className="help-text">{plan.requisitosAcceso}</p>}
    </>;
}

export default function PlanDetails({ plan }) {
    return <>
        <p className="plan-period">Por {periodoPlan(plan)}</p>
        {plan.descripcion && <p className="help-text">{plan.descripcion}</p>}
        <PlanConditions plan={plan} />
    </>;
}
