export enum UserStatus {
  PENDING = "PENDING",
  EXPIRED = "EXPIRED",
  ACTIVE = "ACTIVE",
  DENIED = "DENIED",
}

export interface User {
  id: string;
  name: string;
  mac: string;
  status: UserStatus;
  expiryDate: string;
  packageId: string;
  packageName?: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  validityDays: number;
  channelIds: string[];
}

export interface Channel {
  id: string;
  name: string;
  streamUrl: string;
  categoryId: string;
  logoUrl: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Admin {
  uid: string;
  email: string;
  role: "admin";
}
