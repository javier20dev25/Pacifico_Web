// src/types/index.ts

// --- Interfaces de Pedidos ---
export interface OrderProduct {
  name: string;
  quantity: number;
  price: number;
}

export type PaymentStatus = 'pendiente' | 'parcial' | 'pagado';
export type DeliveryStatus = 'pendiente' | 'en_proceso' | 'en_camino' | 'entregado' | 'cancelado';

/**
 * Representa un pedido en el sistema. Esta es la interfaz unificada
 * para evitar inconsistencias de tipos a través de la aplicación.
 */
export interface Order {
  // --- Campos Core (Siempre presentes) ---
  id: number;
  created_at: string;
  total_amount: number;
  customer_info: {
    name: string;
  };
  
  // --- Campos de Estado ---
  payment_status: PaymentStatus;
  delivery_status: DeliveryStatus;

  // --- Contenido del Pedido (Puede ser opcional dependiendo del contexto) ---
  order_content?: {
    products: OrderProduct[];
    raw_message?: string;
  };
  
  // --- Campos de Planes de Pago (Opcionales) ---
  plan_tipo?: 'contado' | 'cuotas';
  plan_frecuencia?: 'semanal' | 'quincenal' | 'mensual';
  plan_cuotas?: number;

  // --- Campos Adicionales ---
  total_abonado?: number;
  saldo_pendiente?: number;
  is_overdue?: boolean;
  store_name?: string;
  
  // --- Campos de la versión de OrderProcessor (Legacy, opcional) ---
  products?: OrderProduct[];
  raw_message?: string;
  order_date?: Date;
  customer_name?: string;
  total_price?: number;
}

// --- Otras Interfaces ---
export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export interface Abono {
  id: number;
  amount: number;
  payment_method: string;
  notes: string;
  created_at: string;
}
