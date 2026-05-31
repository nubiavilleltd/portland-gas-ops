export function generateInvoiceNumber(sequence: number) {
  return `INV-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}`;
}