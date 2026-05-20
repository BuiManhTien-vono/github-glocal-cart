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
  trackingNumber: string;
  shipmentMethod: string;
  shipmentDate: string;
  estimatedArrival: string;
  buyerName: string;
  buyerPhone: string;
  deliveryAddress: string;
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

  getShipmentDetail: async (id: number) => {
    return apiClient.get(`/shipper/shipments/${id}`);
  },

  acceptShipment: async (id: number, note: string = '') => {
    return apiClient.post(`/shipper/shipments/${id}/accept`, { note });
  },

  confirmPickup: async (id: number, note: string = '') => {
    return apiClient.post(`/shipper/shipments/${id}/confirm-pickup`, { note });
  },

  confirmArrival: async (id: number, note: string = '') => {
    return apiClient.post(`/shipper/shipments/${id}/confirm-arrival`, { note });
  },

  confirmCashReceived: async (id: number, note: string = '') => {
    return apiClient.post(`/shipper/shipments/${id}/confirm-cash-received`, { note });
  },

  confirmTransferReceived: async (id: number, note: string = '') => {
    return apiClient.post(`/shipper/shipments/${id}/confirm-transfer-received`, { note });
  },

  requestPayment: async (id: number) => {
    return apiClient.post(`/shipper/shipments/${id}/request-payment`);
  },

  deliverShipment: async (id: number, note: string = '') => {
    return apiClient.post(`/shipper/shipments/${id}/deliver`, { note });
  },
};
