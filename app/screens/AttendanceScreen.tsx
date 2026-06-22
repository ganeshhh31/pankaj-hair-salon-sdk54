import React from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { WorkerWithAttendance, useAttendance } from "../../hooks/useAttendance";
import { clearAttendance } from "../../storage/attendanceStorage";
import { AttendanceStatus } from "../../types/Attendance";

// ─── Worker Card ─────────────────────────────────────────────────────────────

interface WorkerCardProps {
  item: WorkerWithAttendance;
  onCheckIn: (workerId: string) => void;
  onCheckOut: (workerId: string) => void;
}

const WorkerCard: React.FC<WorkerCardProps> = ({
  item,
  onCheckIn,
  onCheckOut,
}) => {
  const { worker, todayAttendance } = item;
  const status: AttendanceStatus = todayAttendance?.status ?? "INACTIVE";

  const formatTime = (isoString: string): string => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const statusConfig: Record<
    AttendanceStatus,
    { label: string; color: string; bg: string }
  > = {
    INACTIVE: { label: "Not Checked In", color: "#6B7280", bg: "#F3F4F6" },
    ACTIVE: { label: "Active", color: "#059669", bg: "#D1FAE5" },
    CHECKED_OUT: { label: "Checked Out", color: "#D97706", bg: "#FEF3C7" },
    SETTLED: { label: "Settled", color: "#7C3AED", bg: "#EDE9FE" },
  };

  const cfg = statusConfig[status];

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {worker.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.workerName}>{worker.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Time row */}
      <View style={styles.timeRow}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Check In</Text>
          <Text style={styles.timeValue}>
            {formatTime(todayAttendance?.checkInTime ?? "")}
          </Text>
        </View>

        <View style={styles.timeDivider} />

        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Check Out</Text>
          <Text style={styles.timeValue}>
            {formatTime(todayAttendance?.checkOutTime ?? "")}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.checkInBtn,
            status !== "INACTIVE" && styles.btnDisabled,
          ]}
          onPress={() => onCheckIn(worker.workerId)}
          disabled={status !== "INACTIVE"}
          activeOpacity={0.75}
        >
          <Text style={styles.actionBtnText}>Check In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.checkOutBtn,
            status !== "ACTIVE" && styles.btnDisabled,
          ]}
          onPress={() => onCheckOut(worker.workerId)}
          disabled={status !== "ACTIVE"}
          activeOpacity={0.75}
        >
          <Text style={styles.actionBtnText}>Check Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Summary Bar ──────────────────────────────────────────────────────────────

interface SummaryBarProps {
  items: WorkerWithAttendance[];
}

const SummaryBar: React.FC<SummaryBarProps> = ({ items }) => {
  const active = items.filter(
    (i) => i.todayAttendance?.status === "ACTIVE",
  ).length;
  const checkedOut = items.filter(
    (i) => i.todayAttendance?.status === "CHECKED_OUT",
  ).length;
  const notIn = items.filter((i) => !i.todayAttendance).length;

  return (
    <View style={styles.summaryBar}>
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryCount, { color: "#059669" }]}>
          {active}
        </Text>
        <Text style={styles.summaryLabel}>Active</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryCount, { color: "#D97706" }]}>
          {checkedOut}
        </Text>
        <Text style={styles.summaryLabel}>Checked Out</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryCount, { color: "#6B7280" }]}>{notIn}</Text>
        <Text style={styles.summaryLabel}>Not In</Text>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AttendanceScreen(): React.ReactElement {
  const {
    workersWithAttendance,
    todayDate,
    isLoading,
    checkIn,
    checkOut,
    refresh,
  } = useAttendance();

  const formatDisplayDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleClearAttendance = async (): Promise<void> => {
    await clearAttendance();
    await refresh();
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Date Header */}
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>{formatDisplayDate(todayDate)}</Text>
      </View>

      {/* Summary */}
      <SummaryBar items={workersWithAttendance} />

      {/* Temporary: Clear Attendance Button */}
      <TouchableOpacity
        style={styles.clearBtn}
        onPress={() => void handleClearAttendance()}
      >
        <Text style={styles.clearBtnText}>🗑 Clear Attendance</Text>
      </TouchableOpacity>

      {/* Worker List */}
      <FlatList<WorkerWithAttendance>
        data={workersWithAttendance}
        keyExtractor={(item) => item.worker.workerId}
        renderItem={({ item }) => (
          <WorkerCard
            key={item.worker.workerId}
            item={item}
            onCheckIn={checkIn}
            onCheckOut={checkOut}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor="#111827"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Workers Found</Text>
            <Text style={styles.emptySubtitle}>
              Add workers first to manage attendance.
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },

  // Date header
  dateHeader: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  dateText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // Summary bar
  summaryBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 14,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryCount: {
    fontSize: 22,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
  },

  // Clear button (temporary)
  clearBtn: {
    backgroundColor: "#FEE2E2",
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  clearBtnText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },

  // List
  listContent: {
    padding: 16,
    gap: 12,
  },

  // Worker card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  cardInfo: {
    flex: 1,
    gap: 6,
  },
  workerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // Time row
  timeRow: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 14,
    overflow: "hidden",
  },
  timeBlock: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  timeDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  timeLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: "center",
  },
  checkInBtn: {
    backgroundColor: "#059669",
  },
  checkOutBtn: {
    backgroundColor: "#DC2626",
  },
  btnDisabled: {
    opacity: 0.35,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#374151",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
