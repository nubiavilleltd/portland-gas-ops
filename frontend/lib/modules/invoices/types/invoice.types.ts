import { PaymentStatus } from "../../payments/types/payments.types";

export interface Invoice {
  id: string;

  order_id: string;
  order_no: string | null;

  invoice_number: string;

  total_amount: number;

  status: PaymentStatus

  issued_date: string;

  due_date: string;
  created_by_name:string;
}


export interface CreateInvoiceInput {
  order_id: string;
  issued_date: string;
  due_date: string;
  notes?: string;
}