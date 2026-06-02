export interface Invoice {
  id: string;

  order_id: string;

  invoice_number: string;

  total_amount: number;

  status:
    | "unpaid"
    | "partially_paid"
    | "paid";

  issued_date: string;

  due_date: string;
}


export interface CreateInvoiceInput {
  order_id: string;
  total_amount: number;
  invoice_date: string;
  due_date: string;
  notes?: string;
}