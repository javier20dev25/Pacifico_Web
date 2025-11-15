import { fmt } from '../../lib/format';
import type { Order } from '../../types';

const OrderList = ({ orders = [] }: { orders?: Order[] }) => {
  const safeOrders = Array.isArray(orders) ? orders : [];

  if (!safeOrders.length) {
    return <div className="text-center text-gray-500 py-4">No hay pedidos para mostrar.</div>;
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {safeOrders.map((o: Order, i: number) => (
          <li key={o.id ?? i}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-indigo-600 truncate">Pedido #{o.id ?? '—'}</p>
                <div className="ml-2 flex-shrink-0 flex">
                  <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${o.payment_status === 'pagado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {o.payment_status ?? 'PENDIENTE'}
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex">
                  <p className="flex items-center text-sm text-gray-500">
                    {o.customer_name ?? o.customer_info?.name ?? 'Cliente no especificado'}
                  </p>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                  <p className="font-semibold">C${fmt(o.total_amount)}</p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OrderList;
