import apiClient from './apiClient';

export interface Shipment {
  shipmentId: number;
  orderId: number;
  orderNumber: string;
  orderStatus: string;
  shipmentStatus: string;
  totalAmount: number;
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
}

export const shipperService = {
  getAvailableShipments: async (page = 1, pageSize = 20) => {
    return apiClient.get(`/shipper/shipments/available?page=${page}&pageSize=${pageSize}`);
  },
  
  getMyShipments: async (page = 1, pageSize = 20) => {
    return apiClient.get(`/shipper/shipments/mine?page=${page}&pageSize=${pageSize}`);
  },
  
  getShipmentDetail: async (id: number) => {
    return apiClient.get(`/shipper/shipments/${id}`);
  },
  
  acceptShipment: async (id: number, note: string = '') => {
    return apiClient.post(`/shipper/shipments/${id}/accept`, { note });
  },
  
  deliverShipment: async (id: number, note: string = '') => {
    return apiClient.post(`/shipper/shipments/${id}/deliver`, { note });
  }
};
