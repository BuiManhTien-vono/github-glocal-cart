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
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  pickupLatitude?: number;
  pickupLongitude?: number;
  distanceMeters?: number;
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
  todayFailed: number;
  monthCompleted: number;
  monthIncome: number;
  monthFailed: number;
  allCompleted: number;
  allIncome: number;
  allFailed: number;
  activeShipments: number;
  pendingCodAmount: number;
  successRate: number;
  rating: number;
}

export type CompletedShipmentPeriod = 'today' | 'month' | 'all';

export interface ShipperActionPayload {
  note?: string;
  failureReason?: string;
  proofNote?: string;
}

export interface ShipperLocationPayload {
  latitude: number;
  longitude: number;
}

export const shipperService = {
  getAvailableShipments: async (page = 1, pageSize = 20) => {
    return apiClient.get(`/shipper/shipments/available?page=${page}&pageSize=${pageSize}`);
  },

  getMyShipments: async (page = 1, pageSize = 20) => {
    return apiClient.get(`/shipper/shipments/mine?page=${page}&pageSize=${pageSize}`);
  },

  getCompletedShipments: async (page = 1, pageSize = 20, period: CompletedShipmentPeriod = 'all') => {
    return apiClient.get(`/shipper/shipments/completed?page=${page}&pageSize=${pageSize}&period=${period}`);
  },

  getStats: async (): Promise<ShipperStats> => {
    return apiClient.get('/shipper/stats');
  },

  updateLocation: async (payload: ShipperLocationPayload) => {
    return apiClient.post('/shipper/location', payload);
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
