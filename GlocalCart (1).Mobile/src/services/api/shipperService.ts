import apiClient from './apiClient';

export interface ShipmentOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Shipment {
  shipmentId: number;
  orderId: number;
  orderNumber: string;
  orderStatus: string;
  shipmentStatus: string;
  totalAmount: number;
  shippingFee: number;
  paymentMethod?: string;
  paymentStatus?: string;
  trackingNumber?: string;
  shipmentMethod?: string;
  shipmentDate?: string;
  estimatedArrival?: string;
  buyerName: string;
  buyerPhone: string;
  deliveryAddress: string;
  pickupAddress?: string;
  distanceKm?: number;
  assignedAt?: string;
  deliveredAt?: string;
  shipperId?: number;
  shipperName?: string;
  orderItems: ShipmentOrderItem[];
  canConfirmPickup?: boolean;
  canConfirmArrival?: boolean;
  pickupCountdownSeconds?: number;
  arrivalCountdownSeconds?: number;
  buyerConfirmedReceipt?: boolean;
  awaitingCash?: boolean;
  awaitingTransferConfirm?: boolean;
}

export interface ShipperStats {
  todayCompleted: number;
  todayIncome: number;
  monthCompleted: number;
  monthIncome: number;
  activeShipments: number;
  pendingCodAmount: number;
  successRate: number;
  rating: number;
}

export interface ShipperActionPayload {
  note?: string;
  failureReason?: string;
  proofNote?: string;
}

export const shipperService = {
  getAvailableShipments: async (page = 1, pageSize = 20) => {
    return apiClient.get(`/shipper/shipments/available?page=${page}&pageSize=${pageSize}`);
  },

  getMyShipments: async (page = 1, pageSize = 20) => {
    return apiClient.get(`/shipper/shipments/mine?page=${page}&pageSize=${pageSize}`);
  },

  getCompletedShipments: async (page = 1, pageSize = 20) => {
    return apiClient.get(`/shipper/shipments/completed?page=${page}&pageSize=${pageSize}`);
  },

  getStats: async (): Promise<ShipperStats> => {
    return apiClient.get('/shipper/stats');
  },

  getShipmentDetail: async (id: number) => {
    return apiClient.get(`/shipper/shipments/${id}`);
  },

  acceptShipment: async (id: number, note = '') => {
    return apiClient.post(`/shipper/shipments/${id}/accept`, { note });
  },

  confirmPickup: async (id: number, note = '') => {
    return apiClient.post(`/shipper/shipments/${id}/confirm-pickup`, { note });
  },

  confirmArrival: async (id: number, note = '') => {
    return apiClient.post(`/shipper/shipments/${id}/confirm-arrival`, { note });
  },

  confirmCashReceived: async (id: number, note = '') => {
    return apiClient.post(`/shipper/shipments/${id}/confirm-cash-received`, { note });
  },

  confirmTransferReceived: async (id: number, note = '') => {
    return apiClient.post(`/shipper/shipments/${id}/confirm-transfer-received`, { note });
  },

  requestPayment: async (id: number) => {
    return apiClient.post(`/shipper/shipments/${id}/request-payment`);
  },

  deliverShipment: async (id: number, payload: string | ShipperActionPayload = '') => {
    const body = typeof payload === 'string' ? { note: payload } : payload;
    return apiClient.post(`/shipper/shipments/${id}/deliver`, body);
  },

  reportDeliveryFailed: async (id: number, payload: ShipperActionPayload) => {
    return apiClient.post(`/shipper/shipments/${id}/delivery-failed`, payload);
  },
};
