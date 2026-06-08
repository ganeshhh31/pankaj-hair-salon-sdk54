import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function HomeScreen() {
  const workers = ['Owner', 'Gotu', 'Sanjay', 'Pintu', 'Ajit', 'Abhijit'];

  const services = [
    { name: 'Hair Cut', price: 150 },
    { name: 'Beard', price: 80 },
    { name: 'Facial', price: 500 },
    { name: 'Bleach', price: 300 },
    { name: 'Hair Treatment', price: 700 },
    { name: 'Hair Color', price: 600 },
    { name: 'Head Massage', price: 200 },
  ];

  const [screen, setScreen] = useState('dashboard');
  const [selectedWorker, setSelectedWorker] = useState('Owner');
  const [selectedService, setSelectedService] = useState('Hair Cut');
  const [amount, setAmount] = useState('150');
  const [paymentMode, setPaymentMode] = useState('Cash');

  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalCollection, setTotalCollection] = useState(0);
  const [cashTotal, setCashTotal] = useState(0);
  const [upiTotal, setUpiTotal] = useState(0);
  const [showCollection, setShowCollection] = useState(false);
  const [dayClosed, setDayClosed] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // V7 — worker attendance & settlement
  const defaultWorkerStatus = workers.map((w) => ({
    name: w,
    active: true,
  }));
  const [workerStatus, setWorkerStatus] = useState<
    { name: string; active: boolean }[]
  >(defaultWorkerStatus);
  const [settlements, setSettlements] = useState<any[]>([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const saved = await AsyncStorage.getItem('transactions');

      if (saved) {
        const parsed = JSON.parse(saved);

        setTransactions(parsed);

        const total = parsed.reduce(
          (sum: number, item: any) => sum + item.amount,
          0
        );

        const cash = parsed
          .filter((item: any) => item.paymentMode === 'Cash')
          .reduce(
            (sum: number, item: any) => sum + item.amount,
            0
          );

        const upi = parsed
          .filter((item: any) => item.paymentMode === 'UPI')
          .reduce(
            (sum: number, item: any) => sum + item.amount,
            0
          );

        setTotalCollection(total);
        setCashTotal(cash);
        setUpiTotal(upi);
      }

      const savedReports =
        await AsyncStorage.getItem(
          'reports'
        );

      if (savedReports) {
        setReports(
          JSON.parse(savedReports)
        );
      }

      const savedDayClosed =
        await AsyncStorage.getItem(
          'dayClosed'
        );

      if (savedDayClosed === 'true') {
        setDayClosed(true);
      }

      const savedWorkerStatus =
        await AsyncStorage.getItem('workerStatus');
      if (savedWorkerStatus) {
        setWorkerStatus(JSON.parse(savedWorkerStatus));
      }

      const savedSettlements =
        await AsyncStorage.getItem('settlements');
      if (savedSettlements) {
        setSettlements(JSON.parse(savedSettlements));
      }

    } catch (error) {
      console.log(error);
    }

    setIsLoaded(true);
  };

  const handleServiceChange = (serviceName: string) => {
    setSelectedService(serviceName);

    const service = services.find(
      (item) => item.name === serviceName
    );

    if (service) {
      setAmount(service.price.toString());
    }
  };

  const saveTransaction = async () => {
    const newTransaction = {
      id: Date.now(),
      worker: selectedWorker,
      service: selectedService,
      amount: Number(amount),
      paymentMode,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    };

    const updatedTransactions = [
      newTransaction,
      ...transactions,
    ];

    setTransactions(updatedTransactions);

    const updatedTotal =
      totalCollection + Number(amount);

    setTotalCollection(updatedTotal);

    if (paymentMode === 'Cash') {
      setCashTotal(cashTotal + Number(amount));
    }

    if (paymentMode === 'UPI') {
      setUpiTotal(upiTotal + Number(amount));
    }

    try {
      await AsyncStorage.setItem(
        'transactions',
        JSON.stringify(updatedTransactions)
      );
    } catch (error) {
      console.log(error);
    }

    setSelectedWorker('Owner');
    setSelectedService('Hair Cut');
    setAmount('150');
    setPaymentMode('Cash');

    setScreen('dashboard');
  };

  const closeDay = () => {
    if (totalCollection === 0) {
      Alert.alert(
        'No Transactions',
        'Add at least one transaction before closing the day.'
      );
      return;
    }

    Alert.alert(
      'Close Day',
      `Today's Collection: ₹${totalCollection}\n\nCash: ₹${cashTotal}\nUPI: ₹${upiTotal}\n\nAre you sure you want to close the day?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Close Day',
          onPress: async () => {
            const workerReport = workers.map((worker) => {
              const workDone = getWorkerTotal(worker);

              return {
                worker,
                workDone,
                share:
                  worker === 'Owner'
                    ? workDone
                    : workDone / 2,
              };
            });

            const now = new Date();

            const serviceReport = services.map(
              (service) => ({
                service: service.name,
                count: transactions.filter(
                  (t) => t.service === service.name
                ).length,
              })
            );

            const report = {
              date: now.toLocaleDateString(),
              dateISO: now.toISOString(),
              closedAt: now.toLocaleTimeString(
                [], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                }
              ),
              totalCollection,
              cashTotal,
              upiTotal,
              workerReport,
              serviceReport,
            };

            const updatedReports = [
              report,
              ...reports,
            ];

            setReports(updatedReports);

            await AsyncStorage.setItem(
              'reports',
              JSON.stringify(updatedReports)
            );

            await AsyncStorage.removeItem(
              'transactions'
            );

            setTransactions([]);
            setTotalCollection(0);
            setCashTotal(0);
            setUpiTotal(0);

            await AsyncStorage.setItem(
              'dayClosed',
              'true'
            );

            setDayClosed(true);
          },
        },
      ]
    );
  };

  const activeWorkers = workerStatus
    .filter((w) => w.active)
    .map((w) => w.name);

  const getWorkerTotal = (workerName: string) => {
    return transactions
      .filter((item) => item.worker === workerName)
      .reduce((sum, item) => sum + item.amount, 0);
  };

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // ── Workers Screen ──────────────────────────────
  if (screen === 'workers') {
    const toggleWorker = async (name: string) => {
      const updated = workerStatus.map((w) =>
        w.name === name
          ? { ...w, active: !w.active }
          : w
      );
      setWorkerStatus(updated);
      await AsyncStorage.setItem(
        'workerStatus',
        JSON.stringify(updated)
      );
    };

    const settleWorker = (name: string) => {
      const alreadySettled = settlements.find(
        (s) => s.worker === name
      );
      if (alreadySettled) {
        Alert.alert(
          'Already Settled',
          `${name} is already settled today (₹${alreadySettled.amount} at ${alreadySettled.settledAt}).`
        );
        return;
      }

      const workerTransactions = transactions.filter(
        (t) => t.worker === name
      );

      if (workerTransactions.length === 0) {
        Alert.alert(
          'No Transactions',
          `${name} has no transactions today.`
        );
        return;
      }

      const breakdown = workerTransactions.map(
        (t) => `${t.service}  ₹${t.amount}`
      ).join('\n');

      const total = workerTransactions.reduce(
        (s, t) => s + t.amount, 0
      );

      const share = name === 'Owner' ? total : total / 2;

      Alert.alert(
        `Settle ${name}`,
        `${breakdown}\n\nTotal: ₹${total}\nShare: ₹${share}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Pay ₹${share}`,
            onPress: async () => {
              const now = new Date();
              const newSettlement = {
                worker: name,
                amount: share,
                settledAt: now.toLocaleTimeString(
                  [], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  }
                ),
              };
              const updated = [
                ...settlements,
                newSettlement,
              ];
              setSettlements(updated);
              await AsyncStorage.setItem(
                'settlements',
                JSON.stringify(updated)
              );
              Alert.alert(
                'Settled',
                `${name} paid ₹${share} ✅`
              );
            },
          },
        ]
      );
    };

    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>👨 Workers</Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setScreen('dashboard')}>
          <Text style={styles.buttonText}>
            ← Back to Dashboard
          </Text>
        </TouchableOpacity>

        <Text style={styles.heading}>
          Attendance
        </Text>

        {workerStatus.map((w) => {
          const isSettled = settlements.some(
            (s) => s.worker === w.name
          );
          return (
            <View
              key={w.name}
              style={styles.workerAttendanceCard}>
              <View>
                <Text style={styles.workerAttendanceName}>
                  {w.active ? '🟢' : '🔴'} {w.name}
                </Text>
                <Text style={styles.workerSettledBadge}>
                  {isSettled ? '✅ Settled' : '⏳ Pending'}
                </Text>
              </View>
              <View style={styles.workerActions}>
                <TouchableOpacity
                  style={[
                    styles.attendanceToggle,
                    {
                      backgroundColor: w.active
                        ? '#d9534f'
                        : '#28a745',
                    },
                  ]}
                  onPress={() => toggleWorker(w.name)}>
                  <Text style={styles.attendanceToggleText}>
                    {w.active ? 'Mark Off' : 'Activate'}
                  </Text>
                </TouchableOpacity>
                {w.name !== 'Owner' && (
                  <TouchableOpacity
                    style={[
                      styles.settleButton,
                      isSettled && {
                        backgroundColor: '#999',
                      },
                    ]}
                    disabled={isSettled}
                    onPress={() =>
                      settleWorker(w.name)
                    }>
                    <Text style={styles.attendanceToggleText}>
                      {isSettled ? 'Paid' : '💰 Settle'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        <Text style={styles.heading}>
          Today's Settlements
        </Text>

        {settlements.length === 0 ? (
          <Text style={styles.emptyText}>
            No settlements yet
          </Text>
        ) : (
          settlements.map((s, i) => (
            <View key={i} style={styles.settlementCard}>
              <View>
                <Text style={styles.workerName}>
                  {s.worker}
                </Text>
                <Text style={styles.reportSub}>
                  {s.settledAt}
                </Text>
              </View>
              <Text style={styles.reportAmount}>
                ₹{s.amount}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  // ── Analytics Screen ─────────────────────────────
  if (screen === 'analytics') {

    const now = new Date();

    // --- Weekly Revenue ---
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekReports = reports.filter((r) => {
      const d = r.dateISO
        ? new Date(r.dateISO)
        : new Date(r.date);
      return d >= startOfWeek;
    });

    const weekRevenue = weekReports.reduce(
      (s, r) => s + r.totalCollection, 0
    );
    const weekCash = weekReports.reduce(
      (s, r) => s + r.cashTotal, 0
    );
    const weekUPI = weekReports.reduce(
      (s, r) => s + r.upiTotal, 0
    );

    // --- Monthly Revenue ---
    const monthReports = reports.filter((r) => {
      const d = r.dateISO
        ? new Date(r.dateISO)
        : new Date(r.date);
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    });

    const monthRevenue = monthReports.reduce(
      (s, r) => s + r.totalCollection, 0
    );
    const monthCash = monthReports.reduce(
      (s, r) => s + r.cashTotal, 0
    );
    const monthUPI = monthReports.reduce(
      (s, r) => s + r.upiTotal, 0
    );

    // --- Best Worker (from all reports) ---
    const workerTotals: { [key: string]: number } = {};
    reports.forEach((r) => {
      r.workerReport.forEach((w: any) => {
        workerTotals[w.worker] =
          (workerTotals[w.worker] || 0) + w.workDone;
      });
    });
    const topWorkerName = Object.keys(workerTotals).sort(
      (a, b) => workerTotals[b] - workerTotals[a]
    )[0];
    const topWorkerAmount = topWorkerName
      ? workerTotals[topWorkerName]
      : 0;

    // --- Most Popular Service (historical from reports + today live) ---
    const serviceCounts: { [key: string]: number } = {};

    // count from all closed reports
    reports.forEach((r) => {
      if (r.serviceReport) {
        r.serviceReport.forEach((s: any) => {
          serviceCounts[s.service] =
            (serviceCounts[s.service] || 0) + s.count;
        });
      }
    });

    // also add today's live transactions
    transactions.forEach((t) => {
      serviceCounts[t.service] =
        (serviceCounts[t.service] || 0) + 1;
    });

    const topServiceName = Object.keys(serviceCounts).sort(
      (a, b) => serviceCounts[b] - serviceCounts[a]
    )[0];
    const topServiceCount = topServiceName
      ? serviceCounts[topServiceName]
      : 0;

    // --- Average Daily Revenue ---
    const avgDaily =
      reports.length > 0
        ? Math.round(
            reports.reduce(
              (s, r) => s + r.totalCollection, 0
            ) / reports.length
          )
        : 0;

    // --- Last 7 Days Trend ---
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7: { label: string; amount: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);

      const dayTotal = reports
        .filter((r) => {
          const rd = r.dateISO
            ? new Date(r.dateISO)
            : new Date(r.date);
          return rd >= d && rd < nextDay;
        })
        .reduce((s, r) => s + r.totalCollection, 0);

      last7.push({
        label: dayNames[d.getDay()],
        amount: dayTotal,
      });
    }

    const maxTrend = Math.max(...last7.map((d) => d.amount), 1);

    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>📊 Analytics</Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setScreen('dashboard')}>
          <Text style={styles.buttonText}>
            ← Back to Dashboard
          </Text>
        </TouchableOpacity>

        {/* Weekly Revenue */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            This Week
          </Text>
          <Text style={styles.dashboardAmount}>
            ₹{weekRevenue}
          </Text>
          <Text style={styles.dashboardInfo}>
            Cash : ₹{weekCash}
          </Text>
          <Text style={styles.dashboardInfo}>
            UPI : ₹{weekUPI}
          </Text>
        </View>

        {/* Monthly Revenue */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            This Month
          </Text>
          <Text style={styles.dashboardAmount}>
            ₹{monthRevenue}
          </Text>
          <Text style={styles.dashboardInfo}>
            Cash : ₹{monthCash}
          </Text>
          <Text style={styles.dashboardInfo}>
            UPI : ₹{monthUPI}
          </Text>
        </View>

        {/* Best Worker */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            🏆 Top Worker
          </Text>
          {topWorkerName ? (
            <>
              <Text style={styles.dashboardAmount}>
                {topWorkerName}
              </Text>
              <Text style={styles.dashboardInfo}>
                ₹{topWorkerAmount} earned
              </Text>
            </>
          ) : (
            <Text style={styles.emptyText}>
              No data yet
            </Text>
          )}
        </View>

        {/* Most Popular Service */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            ✂️ Top Service
          </Text>
          {topServiceName ? (
            <>
              <Text style={styles.dashboardAmount}>
                {topServiceName}
              </Text>
              <Text style={styles.dashboardInfo}>
                {topServiceCount} times
              </Text>
            </>
          ) : (
            <Text style={styles.emptyText}>
              No data yet
            </Text>
          )}
        </View>

        {/* Average Daily Revenue */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            📅 Avg Per Day
          </Text>
          <Text style={styles.dashboardAmount}>
            ₹{avgDaily}
          </Text>
          <Text style={styles.dashboardInfo}>
            Over {reports.length} closed days
          </Text>
        </View>

        {/* Last 7 Days Trend */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Last 7 Days
          </Text>
          {last7.map((day, i) => (
            <View key={i} style={styles.trendRow}>
              <Text style={styles.trendLabel}>
                {day.label}
              </Text>
              <View style={styles.trendBarBg}>
                <View
                  style={[
                    styles.trendBarFill,
                    {
                      width: `${Math.round(
                        (day.amount / maxTrend) * 100
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.trendAmount}>
                {day.amount > 0
                  ? `₹${day.amount}`
                  : '-'}
              </Text>
            </View>
          ))}
        </View>

      </ScrollView>
    );
  }

  if (screen === 'reports') {

    // Detail view — user tapped a specific report
    if (selectedReport) {
      return (
        <ScrollView style={styles.container}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedReport(null)}>
            <Text style={styles.buttonText}>
              ← Back to Reports
            </Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            📋 {selectedReport.date}
            {selectedReport.closedAt
              ? `\n${selectedReport.closedAt}`
              : ''}
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Total Collection
            </Text>
            <Text style={styles.dashboardAmount}>
              ₹{selectedReport.totalCollection}
            </Text>
            <Text style={styles.dashboardInfo}>
              Cash : ₹{selectedReport.cashTotal}
            </Text>
            <Text style={styles.dashboardInfo}>
              UPI : ₹{selectedReport.upiTotal}
            </Text>
          </View>

          <Text style={styles.heading}>
            Worker Earnings
          </Text>

          {selectedReport.workerReport.map(
            (item: any) => (
              <View
                key={item.worker}
                style={styles.workerCard}>
                <Text style={styles.workerName}>
                  {item.worker}
                </Text>
                <View>
                  <Text style={styles.workerAmount}>
                    Work: ₹{item.workDone}
                  </Text>
                  <Text style={styles.workerShare}>
                    Share: ₹{item.share}
                  </Text>
                </View>
              </View>
            )
          )}
        </ScrollView>
      );
    }

    // List view — all reports
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>📈 Reports</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Total Closed Days
          </Text>
          <Text style={styles.dashboardAmount}>
            {reports.length}
          </Text>
          <Text style={styles.dashboardInfo}>
            Total Revenue : ₹{reports.reduce(
              (sum, r) => sum + r.totalCollection, 0
            )}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setScreen('dashboard')}>
          <Text style={styles.buttonText}>
            ← Back to Dashboard
          </Text>
        </TouchableOpacity>

        {reports.length === 0 ? (
          <Text style={styles.emptyText}>
            No reports yet. Close a day to generate one.
          </Text>
        ) : (
          reports.map((report, index) => (
            <TouchableOpacity
              key={index}
              style={styles.reportCard}
              onPress={() =>
                setSelectedReport(report)
              }>
              <View>
                <Text style={styles.reportDate}>
                  {report.date}
                </Text>
                <Text style={styles.reportSub}>
                  {report.closedAt
                    ? `Closed at ${report.closedAt}`
                    : ''}
                </Text>
                <Text style={styles.reportSub}>
                  Cash ₹{report.cashTotal} • UPI ₹{report.upiTotal}
                </Text>
              </View>
              <View style={styles.reportRight}>
                <Text style={styles.reportAmount}>
                  ₹{report.totalCollection}
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    Alert.alert(
                      'Delete Report',
                      `Delete report for ${report.date}?`,
                      [
                        {
                          text: 'Cancel',
                          style: 'cancel',
                        },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            const updated =
                              reports.filter(
                                (_, i) => i !== index
                              );
                            setReports(updated);
                            await AsyncStorage.setItem(
                              'reports',
                              JSON.stringify(updated)
                            );
                          },
                        },
                      ]
                    );
                  }}>
                  <Text style={styles.deleteText}>
                    🗑
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  }

  if (screen === 'transaction') {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Add Transaction</Text>

        <Text style={styles.label}>Worker</Text>

        <Picker
          selectedValue={selectedWorker}
          onValueChange={(value) => setSelectedWorker(value)}>
          {activeWorkers.map((worker) => (
            <Picker.Item key={worker} label={worker} value={worker} />
          ))}
        </Picker>

        <Text style={styles.label}>Service</Text>

        <Picker
          selectedValue={selectedService}
          onValueChange={handleServiceChange}>
          {services.map((service) => (
            <Picker.Item
              key={service.name}
              label={service.name}
              value={service.name}
            />
          ))}
        </Picker>

        <Text style={styles.label}>Amount</Text>

        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Payment Mode</Text>

        <Picker
          selectedValue={paymentMode}
          onValueChange={(value) => setPaymentMode(value)}>
          <Picker.Item label="Cash" value="Cash" />
          <Picker.Item label="UPI" value="UPI" />
        </Picker>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveTransaction}>
          <Text style={styles.buttonText}>
            Save Transaction
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setScreen('dashboard')}>
          <Text style={styles.buttonText}>
            Back to Dashboard
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>💈 Pankaj Hair Salon</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            Today's Collection
          </Text>

          <TouchableOpacity
            onPress={() =>
              setShowCollection(!showCollection)
            }>
            <Text style={styles.eyeIcon}>
              {showCollection ? '🙈' : '👁'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.dashboardAmount}>
          {showCollection
            ? `₹${totalCollection}`
            : '*****'}
        </Text>

        <Text style={styles.dashboardInfo}>
          UPI :
          {showCollection
            ? ` ₹${upiTotal}`
            : ' ***'}
        </Text>

        <Text style={styles.dashboardInfo}>
          Cash :
          {showCollection
            ? ` ₹${cashTotal}`
            : ' ****'}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          dayClosed && { backgroundColor: '#999' },
        ]}
        disabled={dayClosed}
        onPress={() => setScreen('transaction')}>
        <Text style={styles.buttonText}>
          ➕ Add Transaction
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.workersButton}
        onPress={() => setScreen('workers')}>
        <Text style={styles.buttonText}>
          👨 Workers & Settlements
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.closeDayButton}
        onPress={closeDay}>
        <Text style={styles.buttonText}>
          📊 Close Day
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.reportsButton}
        onPress={() => setScreen('reports')}>
        <Text style={styles.buttonText}>
          📈 Reports
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.analyticsButton}
        onPress={() => setScreen('analytics')}>
        <Text style={styles.buttonText}>
          📊 Analytics
        </Text>
      </TouchableOpacity>

      {dayClosed && (
        <TouchableOpacity
          style={styles.startDayButton}
          onPress={async () => {
            await AsyncStorage.removeItem('dayClosed');
            await AsyncStorage.removeItem('settlements');
            const reset = workers.map((w) => ({
              name: w,
              active: true,
            }));
            setWorkerStatus(reset);
            await AsyncStorage.setItem(
              'workerStatus',
              JSON.stringify(reset)
            );
            setSettlements([]);
            setDayClosed(false);
          }}>
          <Text style={styles.buttonText}>
            🌅 Start New Day
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.heading}>Worker Earnings</Text>

      {workerStatus.map((w) => {
        const isSettled = settlements.some(
          (s) => s.worker === w.name
        );
        return (
          <View key={w.name} style={styles.workerCard}>
            <Text style={styles.workerName}>
              {w.active ? '🟢' : '🔴'} {w.name}
              {isSettled ? '  ✅' : ''}
            </Text>
            <Text style={styles.workerAmount}>
              ₹{getWorkerTotal(w.name)}
            </Text>
          </View>
        );
      })}

      <Text style={styles.heading}>Recent Transactions</Text>

      {transactions.length === 0 ? (
        <Text>No transactions yet</Text>
      ) : (
        transactions.map((item) => (
          <View
            key={item.id}
            style={styles.transactionCard}>
            <Text>
              {item.worker} • {item.service}
            </Text>

            <Text>
              ₹{item.amount} ({item.paymentMode})
            </Text>

            <Text>
              {item.date} • {item.time}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  dashboardAmount: {
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 10,
  },
  dashboardInfo: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: 'green',
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
  },
  backButton: {
    backgroundColor: '#555',
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 40,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  workerCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  workerAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  closeDayButton: {
    backgroundColor: '#d9534f',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  reportsButton: {
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  analyticsButton: {
    backgroundColor: '#6f42c1',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  workersButton: {
    backgroundColor: '#e67e22',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  workerAttendanceCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerAttendanceName: {
    fontSize: 16,
    fontWeight: '700',
  },
  workerSettledBadge: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  workerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  attendanceToggle: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  settleButton: {
    backgroundColor: '#e67e22',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  attendanceToggleText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  settlementCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startDayButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  reportCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportRight: {
    alignItems: 'flex-end',
  },
  deleteButton: {
    marginTop: 6,
    padding: 4,
  },
  deleteText: {
    fontSize: 18,
  },
  reportDate: {
    fontSize: 16,
    fontWeight: '700',
  },
  reportSub: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  reportAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  workerShare: {
    fontSize: 13,
    color: '#666',
    textAlign: 'right',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 15,
    marginTop: 40,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  trendLabel: {
    width: 36,
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  trendBarBg: {
    flex: 1,
    height: 14,
    backgroundColor: '#eee',
    borderRadius: 7,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  trendBarFill: {
    height: 14,
    backgroundColor: '#6f42c1',
    borderRadius: 7,
  },
  trendAmount: {
    width: 64,
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
  },
});
