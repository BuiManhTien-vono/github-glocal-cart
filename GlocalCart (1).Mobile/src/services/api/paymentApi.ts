import apiClient from './apiClient';

export interface PaymentInitiateResponse {
  billId: string;
  merchantId: string;
  orderId: string;
  amount: number;
  timestamp: number;
  signature: string;
  vietQrUrl: string;
  bankId: string;
  bankAccount: string;
  accountName: string;
}

export interface PaymentStatusResponse {
  orderId: number;
  orderNumber: string;
  method: string;
  status: string;
  amount: number;
  transactionRef: string | null;
  canInitiatePayment: boolean;
  canConfirmTransfer: boolean;
  isPaid: boolean;
}

export const paymentApi = {
  initiate: async (orderId: number | string): Promise<PaymentInitiateResponse> => {
    return await apiClient.post(`/payments/${orderId}/initiate`);
  },

  confirmTransfer: async (orderId: number | string): Promise<any> => {
    return await apiClient.post(`/payments/${orderId}/confirm-transfer`);
  },

  getStatus: async (orderId: number | string): Promise<PaymentStatusResponse> => {
    return await apiClient.get(`/payments/${orderId}/status`);
  }
};
