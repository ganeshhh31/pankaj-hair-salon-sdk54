import AsyncStorage from "@react-native-async-storage/async-storage";

import { Attendance } from "../types/Attendance";
import { STORAGE_KEYS } from "./keys";

// ─── Core Helpers ─────────────────────────────────────────────────────────────

const loadAttendance = async (): Promise<Attendance[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE);
  return data ? (JSON.parse(data) as Attendance[]) : [];
};

const persistAttendance = async (records: Attendance[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const getAttendance = async (): Promise<Attendance[]> => {
  try {
    return await loadAttendance();
  } catch (error) {
    console.error("[attendanceStorage] getAttendance failed:", error);
    return [];
  }
};

export const getAttendanceById = async (
  attendanceId: string,
): Promise<Attendance | undefined> => {
  try {
    const records = await loadAttendance();
    return records.find((a) => a.attendanceId === attendanceId);
  } catch (error) {
    console.error(
      `[attendanceStorage] getAttendanceById(${attendanceId}) failed:`,
      error,
    );
    return undefined;
  }
};

export const getWorkerAttendance = async (
  workerId: string,
): Promise<Attendance[]> => {
  try {
    const records = await loadAttendance();
    return records.filter((a) => a.workerId === workerId);
  } catch (error) {
    console.error(
      `[attendanceStorage] getWorkerAttendance(${workerId}) failed:`,
      error,
    );
    return [];
  }
};

// Returns today's attendance record for a worker, if it exists.
export const getTodayAttendance = async (
  workerId: string,
  date: string,
): Promise<Attendance | undefined> => {
  try {
    const records = await loadAttendance();
    return records.find((a) => a.workerId === workerId && a.date === date);
  } catch (error) {
    console.error(
      `[attendanceStorage] getTodayAttendance(${workerId}, ${date}) failed:`,
      error,
    );
    return undefined;
  }
};

export const saveAttendance = async (attendance: Attendance): Promise<void> => {
  try {
    const records = await loadAttendance();

    const exists = records.some(
      (a) => a.attendanceId === attendance.attendanceId,
    );
    if (exists) {
      console.warn(
        `[attendanceStorage] saveAttendance: attendanceId "${attendance.attendanceId}" already exists. Use updateAttendance instead.`,
      );
      return;
    }

    records.push(attendance);
    await persistAttendance(records);
  } catch (error) {
    console.error("[attendanceStorage] saveAttendance failed:", error);
  }
};

export const updateAttendance = async (
  updatedAttendance: Attendance,
): Promise<void> => {
  try {
    const records = await loadAttendance();

    const index = records.findIndex(
      (a) => a.attendanceId === updatedAttendance.attendanceId,
    );
    if (index === -1) {
      console.warn(
        `[attendanceStorage] updateAttendance: attendanceId "${updatedAttendance.attendanceId}" not found.`,
      );
      return;
    }

    records[index] = updatedAttendance;
    await persistAttendance(records);
  } catch (error) {
    console.error("[attendanceStorage] updateAttendance failed:", error);
  }
};

export const deleteAttendance = async (attendanceId: string): Promise<void> => {
  try {
    const records = await loadAttendance();
    const filtered = records.filter((a) => a.attendanceId !== attendanceId);

    if (filtered.length === records.length) {
      console.warn(
        `[attendanceStorage] deleteAttendance: attendanceId "${attendanceId}" not found.`,
      );
      return;
    }

    await persistAttendance(filtered);
  } catch (error) {
    console.error(
      `[attendanceStorage] deleteAttendance(${attendanceId}) failed:`,
      error,
    );
  }
};

export const clearAttendance = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
  } catch (error) {
    console.error("[attendanceStorage] clearAttendance failed:", error);
  }
};
