// FIX: Replaced `isActive: boolean` with `status` union — consistent with all other entities.
// `isActive` is kept as a computed helper comment for UI consumers.

export type ServiceStatus = "ACTIVE" | "INACTIVE";

export interface Service {
  serviceId: string;
  serviceName: string;
  category: string;
  price: number;
  status: ServiceStatus; // Use status instead of isActive boolean for consistency
  createdAt: string;     // ISO datetime string
  updatedAt: string;     // ISO datetime string
}
