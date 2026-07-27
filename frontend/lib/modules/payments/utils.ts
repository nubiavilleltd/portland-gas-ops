import { PAYMENT_METHOD_LABELS, PaymentMethod } from "./types/payments.types";

export const formatPaymentMethodLabel = (method:PaymentMethod) => PAYMENT_METHOD_LABELS[method]