
export const ORDER_ROUTES = {
  home: () => "/orders",

  new: () => "/orders/new",
  detail: (orderId: string) => `/orders/${orderId}`,
  edit: (orderId: string) => `/orders/${orderId}/edit`,

  cancel: (orderId: string) => `/orders/${orderId}/cancel`,

  deliveryConfirm: (orderId: string) =>
    `/orders/${orderId}/delivery/confirm`,
} as const;