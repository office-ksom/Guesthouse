/** Generate a booking reference like KSOM-2025-0042 */
export function generateBookingRef(id: number, year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `KSOM-${y}-${String(id).padStart(4, '0')}`;
}

/** Generate an invoice number like INV-2025-0007 */
export function generateInvoiceNumber(id: number, year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `INV-${y}-${String(id).padStart(4, '0')}`;
}
