// FIX: `status` changed from bare `string` to a proper union type.

export type OwnerStatus = "ACTIVE" | "INACTIVE";

export interface Owner {
  ownerId: string;
  name: string;
  phone: string;
  pin: string;
  role: "owner";
  status: OwnerStatus;
  createdAt: string; // ISO datetime string
}
