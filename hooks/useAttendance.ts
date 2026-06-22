import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import "react-native-get-random-values"; // required for uuid
import { v4 as uuidv4 } from "uuid";

import {
  getAttendance,
  getTodayAttendance,
  saveAttendance,
  updateAttendance,
} from "../storage/attendanceStorage";
import { getWorkers } from "../storage/workerStorage";
import { Attendance } from "../types/Attendance";
import { Worker } from "../types/Worker";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
};

const getNow = (): string => {
  return new Date().toISOString();
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkerWithAttendance {
  worker: Worker;
  todayAttendance: Attendance | undefined;
}

export interface UseAttendanceReturn {
  workersWithAttendance: WorkerWithAttendance[];
  todayDate: string;
  isLoading: boolean;
  checkIn: (workerId: string) => Promise<void>;
  checkOut: (workerId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAttendance = (): UseAttendanceReturn => {
  const [workersWithAttendance, setWorkersWithAttendance] = useState<
    WorkerWithAttendance[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const todayDate = getTodayDate();

  // Load all workers + their today's attendance in one pass
  const load = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const [workers, allAttendance] = await Promise.all([
        getWorkers(),
        getAttendance(),
      ]);

      const todayRecords = allAttendance.filter((a) => a.date === todayDate);

      const combined: WorkerWithAttendance[] = workers.map((worker) => ({
        worker,
        todayAttendance: todayRecords.find(
          (a) => a.workerId === worker.workerId,
        ),
      }));

      setWorkersWithAttendance(combined);
    } catch (error) {
      console.error("[useAttendance] load failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [todayDate]);

  useEffect(() => {
    void load();
  }, [load]);

  // ─── Check In ───────────────────────────────────────────────────────────────

  const checkIn = useCallback(
    async (workerId: string): Promise<void> => {
      try {
        // Guard: already checked in today?
        const existing = await getTodayAttendance(workerId, todayDate);
        if (existing) {
          Alert.alert(
            "Already Checked In",
            "This worker is already active today.",
          );
          return;
        }

        const newAttendance: Attendance = {
          attendanceId: uuidv4(),
          workerId,
          status: "ACTIVE",
          checkInTime: getNow(),
          checkOutTime: "",
          date: todayDate,
        };

        await saveAttendance(newAttendance);
        await load();
      } catch (error) {
        console.error(`[useAttendance] checkIn(${workerId}) failed:`, error);
        Alert.alert("Error", "Check-in failed. Please try again.");
      }
    },
    [workersWithAttendance, todayDate, load],
  );

  // ─── Check Out ──────────────────────────────────────────────────────────────

  const checkOut = useCallback(
    async (workerId: string): Promise<void> => {
      try {
        const existing = await getTodayAttendance(workerId, todayDate);

        if (!existing) {
          Alert.alert(
            "Not Checked In",
            "This worker has no check-in record for today.",
          );
          return;
        }

        if (existing.status === "CHECKED_OUT") {
          Alert.alert(
            "Already Checked Out",
            "This worker has already checked out.",
          );
          return;
        }

        const updatedAttendance: Attendance = {
          ...existing,
          status: "CHECKED_OUT",
          checkOutTime: getNow(),
        };

        await updateAttendance(updatedAttendance);
        await load();
      } catch (error) {
        console.error(`[useAttendance] checkOut(${workerId}) failed:`, error);
        Alert.alert("Error", "Check-out failed. Please try again.");
      }
    },
    [workersWithAttendance, todayDate, load],
  );

  return {
    workersWithAttendance,
    todayDate,
    isLoading,
    checkIn,
    checkOut,
    refresh: load,
  };
};
