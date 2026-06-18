import AsyncStorage from "@react-native-async-storage/async-storage";

import { Service } from "../types/Service";
import { STORAGE_KEYS } from "./keys";

// NOTE: This file did not exist in V8. Added in V9 because Service type
// existed but had no storage layer and no STORAGE_KEYS.SERVICES entry.

// ─── Core Helpers ────────────────────────────────────────────────────────────

const loadServices = async (): Promise<Service[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.SERVICES);
  return data ? (JSON.parse(data) as Service[]) : [];
};

const persistServices = async (services: Service[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
};

// ─── CRUD ────────────────────────────────────────────────────────────────────

export const getServices = async (): Promise<Service[]> => {
  try {
    return await loadServices();
  } catch (error) {
    console.error("[serviceStorage] getServices failed:", error);
    return [];
  }
};

export const getServiceById = async (
  serviceId: string,
): Promise<Service | undefined> => {
  try {
    const services = await loadServices();
    return services.find((s) => s.serviceId === serviceId);
  } catch (error) {
    console.error(
      `[serviceStorage] getServiceById(${serviceId}) failed:`,
      error,
    );
    return undefined;
  }
};

// Utility: get only active services (for display in transaction forms)
export const getActiveServices = async (): Promise<Service[]> => {
  try {
    const services = await loadServices();
    return services.filter((s) => s.status === "ACTIVE");
  } catch (error) {
    console.error("[serviceStorage] getActiveServices failed:", error);
    return [];
  }
};

export const saveService = async (service: Service): Promise<void> => {
  try {
    const services = await loadServices();

    const exists = services.some((s) => s.serviceId === service.serviceId);
    if (exists) {
      console.warn(
        `[serviceStorage] saveService: serviceId "${service.serviceId}" already exists. Use updateService instead.`,
      );
      return;
    }

    services.push(service);
    await persistServices(services);
  } catch (error) {
    console.error("[serviceStorage] saveService failed:", error);
  }
};

export const updateService = async (
  updatedService: Service,
): Promise<void> => {
  try {
    const services = await loadServices();

    const index = services.findIndex(
      (s) => s.serviceId === updatedService.serviceId,
    );
    if (index === -1) {
      console.warn(
        `[serviceStorage] updateService: serviceId "${updatedService.serviceId}" not found. Use saveService instead.`,
      );
      return;
    }

    services[index] = updatedService;
    await persistServices(services);
  } catch (error) {
    console.error("[serviceStorage] updateService failed:", error);
  }
};

export const deleteService = async (serviceId: string): Promise<void> => {
  try {
    const services = await loadServices();
    const filtered = services.filter((s) => s.serviceId !== serviceId);

    if (filtered.length === services.length) {
      console.warn(
        `[serviceStorage] deleteService: serviceId "${serviceId}" not found.`,
      );
      return;
    }

    await persistServices(filtered);
  } catch (error) {
    console.error(
      `[serviceStorage] deleteService(${serviceId}) failed:`,
      error,
    );
  }
};

export const clearServices = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SERVICES);
  } catch (error) {
    console.error("[serviceStorage] clearServices failed:", error);
  }
};
