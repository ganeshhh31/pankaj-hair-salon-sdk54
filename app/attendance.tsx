// app/attendance.tsx
// Expo Router entry point — thin wrapper, all logic lives in AttendanceScreen.

import { Stack } from "expo-router";
import AttendanceScreen from "./screens/AttendanceScreen";

export default function AttendancePage() {
  return (
    <>
      
      <AttendanceScreen />
    </>
  );
}
