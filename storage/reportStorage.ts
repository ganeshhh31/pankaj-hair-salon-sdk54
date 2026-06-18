import AsyncStorage from "@react-native-async-storage/async-storage";

import { Report } from "../types/Report";
import { STORAGE_KEYS } from "./keys";

// ─── Core Helpers ────────────────────────────────────────────────────────────

const loadReports = async (): Promise<Report[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.REPORTS);
  return data ? (JSON.parse(data) as Report[]) : [];
};

const persistReports = async (reports: Report[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
};

// ─── CRUD ────────────────────────────────────────────────────────────────────

export const getReports = async (): Promise<Report[]> => {
  try {
    return await loadReports();
  } catch (error) {
    console.error("[reportStorage] getReports failed:", error);
    return [];
  }
};

export const getReportById = async (
  reportId: string,
): Promise<Report | undefined> => {
  try {
    const reports = await loadReports();
    return reports.find((r) => r.reportId === reportId);
  } catch (error) {
    console.error(
      `[reportStorage] getReportById(${reportId}) failed:`,
      error,
    );
    return undefined;
  }
};

// Utility: fetch report for a specific date ("YYYY-MM-DD")
export const getReportByDate = async (
  date: string,
): Promise<Report | undefined> => {
  try {
    const reports = await loadReports();
    return reports.find((r) => r.date === date);
  } catch (error) {
    console.error(
      `[reportStorage] getReportByDate(${date}) failed:`,
      error,
    );
    return undefined;
  }
};

export const saveReport = async (report: Report): Promise<void> => {
  try {
    const reports = await loadReports();

    const exists = reports.some((r) => r.reportId === report.reportId);
    if (exists) {
      console.warn(
        `[reportStorage] saveReport: reportId "${report.reportId}" already exists. Use updateReport instead.`,
      );
      return;
    }

    reports.push(report);
    await persistReports(reports);
  } catch (error) {
    console.error("[reportStorage] saveReport failed:", error);
  }
};

export const updateReport = async (updatedReport: Report): Promise<void> => {
  try {
    const reports = await loadReports();

    const index = reports.findIndex(
      (r) => r.reportId === updatedReport.reportId,
    );
    if (index === -1) {
      console.warn(
        `[reportStorage] updateReport: reportId "${updatedReport.reportId}" not found. Use saveReport instead.`,
      );
      return;
    }

    reports[index] = updatedReport;
    await persistReports(reports);
  } catch (error) {
    console.error("[reportStorage] updateReport failed:", error);
  }
};

export const deleteReport = async (reportId: string): Promise<void> => {
  try {
    const reports = await loadReports();
    const filtered = reports.filter((r) => r.reportId !== reportId);

    if (filtered.length === reports.length) {
      console.warn(
        `[reportStorage] deleteReport: reportId "${reportId}" not found.`,
      );
      return;
    }

    await persistReports(filtered);
  } catch (error) {
    console.error(
      `[reportStorage] deleteReport(${reportId}) failed:`,
      error,
    );
  }
};

export const clearReports = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.REPORTS);
  } catch (error) {
    console.error("[reportStorage] clearReports failed:", error);
  }
};
