// export function calculateOrderSubtotal(
//   quantity: number,
//   unitPrice: number
// ) {
//   return quantity * unitPrice;
// }




/**
 * Pure calculation functions for the order creation / edit forms.
 * No data fetching here — inputs come from form state.
 */

export function calculateOrderSubtotal(
  quantity: number,
  unitPrice: number
): number {
  if (!quantity || !unitPrice) return 0;
  return quantity * unitPrice;
}

export function calculateOrderTotal(
  quantity: number,
  unitPrice: number,
  taxRate = 0
): number {
  const subtotal = calculateOrderSubtotal(quantity, unitPrice);
  return subtotal + subtotal * taxRate;
}