export type OrderTabKey =
  | 'all'
  | 'pending'
  | 'waitingPickup'
  | 'delivering'
  | 'delivered'
  | 'canceled';

export const ORDER_TAB_LABELS: Record<OrderTabKey, string> = {
  all: 'Tất cả',
  pending: 'Chờ xác nhận',
  waitingPickup: 'Chờ lấy hàng',
  delivering: 'Đang giao',
  delivered: 'Đã giao',
  canceled: 'Đã hủy',
};

export const BUYER_ORDER_TABS = [
  ORDER_TAB_LABELS.all,
  ORDER_TAB_LABELS.pending,
  ORDER_TAB_LABELS.waitingPickup,
  ORDER_TAB_LABELS.delivering,
  ORDER_TAB_LABELS.delivered,
  ORDER_TAB_LABELS.canceled,
];

export const SELLER_ORDER_TABS = [
  ORDER_TAB_LABELS.pending,
  ORDER_TAB_LABELS.waitingPickup,
  ORDER_TAB_LABELS.delivering,
  ORDER_TAB_LABELS.delivered,
  ORDER_TAB_LABELS.canceled,
];

export function getOrderTabKey(orderStatus: string, shipmentStatus?: string | null): OrderTabKey {
  const status = String(orderStatus);
  const shipment = shipmentStatus ? String(shipmentStatus) : null;

  if (status === 'Canceled') return 'canceled';
  if (status === 'Complete') return 'delivered';
  if (status === 'Pending') return 'pending';
  if (shipment === 'OnHold') return 'delivering';
  if (status === 'Unshipped') return 'waitingPickup';
  if (status === 'Shipped') {
    if (shipment === 'Delivered') return 'delivered';
    return 'delivering';
  }

  return 'pending';
}

export function getOrderDisplayLabel(orderStatus: string, shipmentStatus?: string | null): string {
  return ORDER_TAB_LABELS[getOrderTabKey(orderStatus, shipmentStatus)];
}

export function matchesTabLabel(
  orderStatus: string,
  shipmentStatus: string | null | undefined,
  tabLabel: string
): boolean {
  if (tabLabel === ORDER_TAB_LABELS.all) return true;
  return getOrderDisplayLabel(orderStatus, shipmentStatus) === tabLabel;
}

export function getShipmentBadgeLabel(shipmentStatus: string): string {
  switch (shipmentStatus) {
    case 'Pending':
      return 'Chờ nhận đơn';
    case 'Accepted':
      return 'Đã nhận đơn';
    case 'Shipped':
      return 'Đang giao';
    case 'Arrived':
      return 'Đã đến nơi';
    case 'Delivered':
      return 'Đã giao';
    case 'OnHold':
      return 'Cần xử lý';
    default:
      return 'Khác';
  }
}
