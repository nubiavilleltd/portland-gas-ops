export type CustomerType = "corporate" | "individual";
export type CustomerStatus = "active" | "inactive";

export interface Customer {
  id: string;
  customerNo: string;
  name: string;
  type: CustomerType;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  status:    CustomerStatus; 
}

export interface CreateCustomerInput {
  name: string;
  type: CustomerType;
  phone: string;
  email: string;
  address: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  status?: CustomerStatus;
}