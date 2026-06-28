// Future: owner-approval worker login flow (V9 Architecture).
// Not used by UI yet — local PIN login only.

export type LoginRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export interface LoginRequest {
  requestId: string;
  workerId: string;
  phone: string;
  status: LoginRequestStatus;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}
