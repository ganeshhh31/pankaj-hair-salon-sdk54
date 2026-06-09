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

  const expenseCategories = [
    'Rent', 'Electricity', 'Products', 'Salary',
    'Maintenance', 'Water', 'Internet', 'Tea & Snacks', 'Other',
  ];

  // screen values: 'home' | 'workers' | 'reports' | 'analytics' | 'expenses' | 'transaction'
  const [screen, setScreen] = useState('home');
  const [activeTab, setActiveTab] = useState('home');

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

  const defaultWorkerStatus = workers.map((w) => ({ name: w, active: true }));
  const [workerStatus, setWorkerStatus] = useState<{ name: string; active: boolean }[]>(defaultWorkerStatus);
  const [settlements, setSettlements] = useState<any[]>([]);

  // V8 — Expenses
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Rent');
  const [expenseNote, setExpenseNote] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const saved = await AsyncStorage.getItem('transactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        setTransactions(parsed);
        const total = parsed.reduce((sum: number, item: any) => sum + item.amount, 0);
        const cash = parsed.filter((item: any) => item.paymentMode === 'Cash').reduce((sum: number, item: any) => sum + item.amount, 0);
        const upi = parsed.filter((item: any) => item.paymentMode === 'UPI').reduce((sum: number, item: any) => sum + item.amount, 0);
        setTotalCollection(total);
        setCashTotal(cash);
        setUpiTotal(upi);
      }

      const savedReports = await AsyncStorage.getItem('reports');
      if (savedReports) setReports(JSON.parse(savedReports));

      const savedDayClosed = await AsyncStorage.getItem('dayClosed');
      if (savedDayClosed === 'true') setDayClosed(true);

      const savedWorkerStatus = await AsyncStorage.getItem('workerStatus');
      if (savedWorkerStatus) setWorkerStatus(JSON.parse(savedWorkerStatus));

      const savedSettlements = await AsyncStorage.getItem('settlements');
      if (savedSettlements) setSettlements(JSON.parse(savedSettlements));

      const savedExpenses = await AsyncStorage.getItem('expenses');
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));

    } catch (error) {
      console.log(error);
    }
    setIsLoaded(true);
  };

  const handleServiceChange = (serviceName: string) => {
    setSelectedService(serviceName);
    const service = services.find((item) => item.name === serviceName);
    if (service) setAmount(service.price.toString());
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

    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);

    const updatedTotal = totalCollection + Number(amount);
    setTotalCollection(updatedTotal);
    if (paymentMode === 'Cash') setCashTotal(cashTotal + Number(amount));
    if (paymentMode === 'UPI') setUpiTotal(upiTotal + Number(amount));

    try {
      await AsyncStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    } catch (error) {
      console.log(error);
    }

    setSelectedWorker('Owner');
    setSelectedService('Hair Cut');
    setAmount('150');
    setPaymentMode('Cash');
    navigateTo('home');
  };

  // V8 — Save Expense
  const saveExpense = async () => {
    if (!expenseAmount || Number(expenseAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount.');
      return;
    }

    const now = new Date();
    const newExpense = {
      id: Date.now(),
      amount: Number(expenseAmount),
      category: expenseCategory,
      note: expenseNote.trim(),
      date: now.toLocaleDateString(),
      dateISO: now.toISOString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);

    try {
      await AsyncStorage.setItem('expenses', JSON.stringify(updatedExpenses));
    } catch (error) {
      console.log(error);
    }

    setExpenseAmount('');
    setExpenseCategory('Rent');
    setExpenseNote('');

    Alert.alert('Saved', `Expense of ₹${newExpense.amount} (${newExpense.category}) saved ✅`);
  };

  // V8 — Delete Expense
  const deleteExpense = async (id: number) => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = expenses.filter((e) => e.id !== id);
          setExpenses(updated);
          await AsyncStorage.setItem('expenses', JSON.stringify(updated));
        },
      },
    ]);
  };

  // V8 — Expense helpers
  const getTodayExpenses = () => {
    const today = new Date().toLocaleDateString();
    return expenses.filter((e) => e.date === today);
  };

  const getTodayExpenseTotal = () =>
    getTodayExpenses().reduce((sum, e) => sum + e.amount, 0);

  const getMonthlyExpenseTotal = () => {
    const now = new Date();
    return expenses
      .filter((e) => {
        const d = e.dateISO ? new Date(e.dateISO) : new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getMonthlyRevenueTotal = () => {
    const now = new Date();
    return reports
      .filter((r) => {
        const d = r.dateISO ? new Date(r.dateISO) : new Date(r.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, r) => sum + r.totalCollection, 0);
  };

  const closeDay = () => {
    if (totalCollection === 0) {
      Alert.alert('No Transactions', 'Add at least one transaction before closing the day.');
      return;
    }

    const todayExpenseTotal = getTodayExpenseTotal();
    const todayProfit = totalCollection - todayExpenseTotal;

    Alert.alert(
      'Close Day',
      `Revenue: ₹${totalCollection}\nExpenses: ₹${todayExpenseTotal}\nProfit: ₹${todayProfit}\n\nCash: ₹${cashTotal}  UPI: ₹${upiTotal}\n\nClose the day?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Day',
          onPress: async () => {
            const workerReport = workers.map((worker) => {
              const workDone = getWorkerTotal(worker);
              return { worker, workDone, share: worker === 'Owner' ? workDone : workDone / 2 };
            });

            const now = new Date();
            const serviceReport = services.map((service) => ({
              service: service.name,
              count: transactions.filter((t) => t.service === service.name).length,
            }));

            // V8 — include expenses & profit in report
            const report = {
              date: now.toLocaleDateString(),
              dateISO: now.toISOString(),
              closedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
              totalCollection,
              cashTotal,
              upiTotal,
              workerReport,
              serviceReport,
              expenses: getTodayExpenses(),
              totalExpenses: todayExpenseTotal,
              profit: todayProfit,
            };

            const updatedReports = [report, ...reports];
            setReports(updatedReports);
            await AsyncStorage.setItem('reports', JSON.stringify(updatedReports));
            await AsyncStorage.removeItem('transactions');
            setTransactions([]);
            setTotalCollection(0);
            setCashTotal(0);
            setUpiTotal(0);
            await AsyncStorage.setItem('dayClosed', 'true');
            setDayClosed(true);
          },
        },
      ]
    );
  };

  const startNewDay = async () => {
    await AsyncStorage.removeItem('dayClosed');
    await AsyncStorage.removeItem('settlements');
    const reset = workers.map((w) => ({ name: w, active: true }));
    setWorkerStatus(reset);
    await AsyncStorage.setItem('workerStatus', JSON.stringify(reset));
    setSettlements([]);
    setDayClosed(false);
  };

  const activeWorkers = workerStatus.filter((w) => w.active).map((w) => w.name);

  const getWorkerTotal = (workerName: string) => {
    return transactions.filter((item) => item.worker === workerName).reduce((sum, item) => sum + item.amount, 0);
  };

  const navigateTo = (s: string) => {
    setScreen(s);
    if (['home', 'workers', 'reports', 'analytics', 'expenses'].includes(s)) {
      setActiveTab(s);
    }
  };

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // ── Bottom Navigation Bar ────────────────────────
  const BottomNav = () => (
    <View style={styles.bottomNav}>
      {[
        { key: 'home', label: '🏠 Home' },
        { key: 'workers', label: '👨 Workers' },
        { key: 'reports', label: '📁 Reports' },
        { key: 'analytics', label: '📊 Stats' },
        { key: 'expenses', label: '💰 Expenses' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.navTab, activeTab === tab.key && styles.navTabActive]}
          onPress={() => navigateTo(tab.key)}>
          <Text style={[styles.navTabText, activeTab === tab.key && styles.navTabTextActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Add Transaction Screen ───────────────────────
  if (screen === 'transaction') {
    return (
      <View style={styles.screenWrapper}>
        <ScrollView style={styles.container}>
          <Text style={styles.title}>➕ Add Transaction</Text>

          <Text style={styles.label}>Worker</Text>
          <Picker selectedValue={selectedWorker} onValueChange={(value) => setSelectedWorker(value)}>
            {activeWorkers.map((worker) => (
              <Picker.Item key={worker} label={worker} value={worker} />
            ))}
          </Picker>

          <Text style={styles.label}>Service</Text>
          <Picker selectedValue={selectedService} onValueChange={handleServiceChange}>
            {services.map((service) => (
              <Picker.Item key={service.name} label={service.name} value={service.name} />
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
          <Picker selectedValue={paymentMode} onValueChange={(value) => setPaymentMode(value)}>
            <Picker.Item label="Cash" value="Cash" />
            <Picker.Item label="UPI" value="UPI" />
          </Picker>

          <TouchableOpacity style={styles.saveButton} onPress={saveTransaction}>
            <Text style={styles.buttonText}>✅ Save Transaction</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => navigateTo('home')}>
            <Text style={styles.buttonText}>← Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Expenses Screen ──────────────────────────────
  if (screen === 'expenses') {
    const todayExpenseTotal = getTodayExpenseTotal();
    const monthlyExpenseTotal = getMonthlyExpenseTotal();
    const monthlyRevenue = getMonthlyRevenueTotal() + totalCollection;
    const todayProfit = totalCollection - todayExpenseTotal;
    const monthlyProfit = monthlyRevenue - monthlyExpenseTotal;

    return (
      <View style={styles.screenWrapper}>
        <ScrollView style={styles.container}>
          <Text style={styles.title}>💰 Expenses</Text>

          {/* Profit Cards — owner only */}
          <View style={[styles.card, { backgroundColor: todayProfit >= 0 ? '#e8f5e9' : '#fdecea' }]}>
            <Text style={styles.cardTitle}>Today's Profit</Text>
            <Text style={[styles.dashboardAmount, { color: todayProfit >= 0 ? '#2e7d32' : '#c62828' }]}>
              ₹{todayProfit}
            </Text>
            <Text style={styles.dashboardInfo}>Revenue : ₹{totalCollection}</Text>
            <Text style={styles.dashboardInfo}>Expenses : ₹{todayExpenseTotal}</Text>
          </View>

          <View style={[styles.card, { backgroundColor: monthlyProfit >= 0 ? '#e8f5e9' : '#fdecea' }]}>
            <Text style={styles.cardTitle}>Monthly Profit</Text>
            <Text style={[styles.dashboardAmount, { color: monthlyProfit >= 0 ? '#2e7d32' : '#c62828' }]}>
              ₹{monthlyProfit}
            </Text>
            <Text style={styles.dashboardInfo}>Revenue : ₹{monthlyRevenue}</Text>
            <Text style={styles.dashboardInfo}>Expenses : ₹{monthlyExpenseTotal}</Text>
          </View>

          {/* Expense Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Expense Summary</Text>
            <Text style={styles.dashboardInfo}>Today : ₹{todayExpenseTotal}</Text>
            <Text style={styles.dashboardInfo}>This Month : ₹{monthlyExpenseTotal}</Text>
          </View>

          {/* Add Expense Form */}
          <Text style={styles.sectionHeading}>Add Expense</Text>

          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={expenseAmount}
            onChangeText={setExpenseAmount}
            keyboardType="numeric"
            placeholder="e.g. 500"
            placeholderTextColor="#aaa"
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={expenseCategory}
              onValueChange={(value) => setExpenseCategory(value)}>
              {expenseCategories.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={styles.input}
            value={expenseNote}
            onChangeText={setExpenseNote}
            placeholder="e.g. Hair Wax Purchase"
            placeholderTextColor="#aaa"
          />

          <TouchableOpacity style={styles.saveButton} onPress={saveExpense}>
            <Text style={styles.buttonText}>➕ Save Expense</Text>
          </TouchableOpacity>

          {/* Expense History */}
          <Text style={styles.sectionHeading}>Expense History</Text>

          {expenses.length === 0 ? (
            <Text style={styles.emptyText}>No expenses recorded yet.</Text>
          ) : (
            expenses.map((e) => (
              <View key={e.id} style={styles.expenseCard}>
                <View style={styles.expenseLeft}>
                  <Text style={styles.expenseCategory}>{e.category}</Text>
                  {e.note ? <Text style={styles.expenseNote}>{e.note}</Text> : null}
                  <Text style={styles.expenseDate}>{e.date} • {e.time}</Text>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.expenseAmount}>₹{e.amount}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteExpense(e.id)}>
                    <Text style={styles.deleteText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
        <BottomNav />
      </View>
    );
  }

  // ── Workers Screen ───────────────────────────────
  if (screen === 'workers') {
    const toggleWorker = async (name: string) => {
      const updated = workerStatus.map((w) => w.name === name ? { ...w, active: !w.active } : w);
      setWorkerStatus(updated);
      await AsyncStorage.setItem('workerStatus', JSON.stringify(updated));
    };

    const settleWorker = (name: string) => {
      const alreadySettled = settlements.find((s) => s.worker === name);
      if (alreadySettled) {
        Alert.alert('Already Settled', `${name} is already settled today (₹${alreadySettled.amount} at ${alreadySettled.settledAt}).`);
        return;
      }

      const workerTransactions = transactions.filter((t) => t.worker === name);
      if (workerTransactions.length === 0) {
        Alert.alert('No Transactions', `${name} has no transactions today.`);
        return;
      }

      const breakdown = workerTransactions.map((t) => `${t.service}  ₹${t.amount}`).join('\n');
      const total = workerTransactions.reduce((s, t) => s + t.amount, 0);
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
                settledAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
              };
              const updated = [...settlements, newSettlement];
              setSettlements(updated);
              await AsyncStorage.setItem('settlements', JSON.stringify(updated));
              Alert.alert('Settled', `${name} paid ₹${share} ✅`);
            },
          },
        ]
      );
    };

    return (
      <View style={styles.screenWrapper}>
        <ScrollView style={styles.container}>
          <Text style={styles.title}>👨 Workers</Text>

          <Text style={styles.sectionHeading}>Today's Earnings</Text>
          {workerStatus.map((w) => {
            const isSettled = settlements.some((s) => s.worker === w.name);
            const earned = getWorkerTotal(w.name);
            return (
              <View key={w.name} style={styles.workerCard}>
                <View>
                  <Text style={styles.workerName}>{w.active ? '🟢' : '🔴'} {w.name}</Text>
                  <Text style={styles.workerSubText}>{isSettled ? '✅ Settled' : '⏳ Pending'}</Text>
                </View>
                <Text style={styles.workerAmount}>₹{earned}</Text>
              </View>
            );
          })}

          <Text style={styles.sectionHeading}>Attendance</Text>
          {workerStatus.map((w) => {
            const isSettled = settlements.some((s) => s.worker === w.name);
            return (
              <View key={w.name} style={styles.workerAttendanceCard}>
                <View>
                  <Text style={styles.workerAttendanceName}>{w.active ? '🟢' : '🔴'} {w.name}</Text>
                  <Text style={styles.workerSettledBadge}>{isSettled ? '✅ Settled' : '⏳ Pending'}</Text>
                </View>
                <View style={styles.workerActions}>
                  <TouchableOpacity
                    style={[styles.attendanceToggle, { backgroundColor: w.active ? '#d9534f' : '#28a745' }]}
                    onPress={() => toggleWorker(w.name)}>
                    <Text style={styles.attendanceToggleText}>{w.active ? 'Mark Off' : 'Activate'}</Text>
                  </TouchableOpacity>
                  {w.name !== 'Owner' && (
                    <TouchableOpacity
                      style={[styles.settleButton, isSettled && { backgroundColor: '#999' }]}
                      disabled={isSettled}
                      onPress={() => settleWorker(w.name)}>
                      <Text style={styles.attendanceToggleText}>{isSettled ? 'Paid' : '💰 Settle'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          <Text style={styles.sectionHeading}>Today's Settlements</Text>
          {settlements.length === 0 ? (
            <Text style={styles.emptyText}>No settlements yet</Text>
          ) : (
            settlements.map((s, i) => (
              <View key={i} style={styles.settlementCard}>
                <View>
                  <Text style={styles.workerName}>{s.worker}</Text>
                  <Text style={styles.workerSubText}>{s.settledAt}</Text>
                </View>
                <Text style={styles.reportAmount}>₹{s.amount}</Text>
              </View>
            ))
          )}
        </ScrollView>
        <BottomNav />
      </View>
    );
  }

  // ── Analytics Screen ─────────────────────────────
  if (screen === 'analytics') {
    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekReports = reports.filter((r) => {
      const d = r.dateISO ? new Date(r.dateISO) : new Date(r.date);
      return d >= startOfWeek;
    });
    const weekRevenue = weekReports.reduce((s, r) => s + r.totalCollection, 0);
    const weekCash = weekReports.reduce((s, r) => s + r.cashTotal, 0);
    const weekUPI = weekReports.reduce((s, r) => s + r.upiTotal, 0);

    const monthReports = reports.filter((r) => {
      const d = r.dateISO ? new Date(r.dateISO) : new Date(r.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthRevenue = monthReports.reduce((s, r) => s + r.totalCollection, 0) + totalCollection;
    const monthCash = monthReports.reduce((s, r) => s + r.cashTotal, 0);
    const monthUPI = monthReports.reduce((s, r) => s + r.upiTotal, 0);

    // V8 — Weekly & Monthly Expenses
    const weekExpenses = expenses.filter((e) => {
      const d = e.dateISO ? new Date(e.dateISO) : new Date(e.date);
      return d >= startOfWeek;
    }).reduce((s, e) => s + e.amount, 0);

    const monthExpenses = expenses.filter((e) => {
      const d = e.dateISO ? new Date(e.dateISO) : new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, e) => s + e.amount, 0);

    const monthProfit = monthRevenue - monthExpenses;

    const workerTotals: { [key: string]: number } = {};
    reports.forEach((r) => {
      r.workerReport.forEach((w: any) => {
        workerTotals[w.worker] = (workerTotals[w.worker] || 0) + w.workDone;
      });
    });
    const topWorkerName = Object.keys(workerTotals).sort((a, b) => workerTotals[b] - workerTotals[a])[0];
    const topWorkerAmount = topWorkerName ? workerTotals[topWorkerName] : 0;

    const serviceCounts: { [key: string]: number } = {};
    reports.forEach((r) => {
      if (r.serviceReport) {
        r.serviceReport.forEach((s: any) => {
          serviceCounts[s.service] = (serviceCounts[s.service] || 0) + s.count;
        });
      }
    });
    transactions.forEach((t) => {
      serviceCounts[t.service] = (serviceCounts[t.service] || 0) + 1;
    });
    const topServiceName = Object.keys(serviceCounts).sort((a, b) => serviceCounts[b] - serviceCounts[a])[0];
    const topServiceCount = topServiceName ? serviceCounts[topServiceName] : 0;

    const avgDaily = reports.length > 0
      ? Math.round(reports.reduce((s, r) => s + r.totalCollection, 0) / reports.length)
      : 0;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7: { label: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);
      const dayTotal = reports
        .filter((r) => { const rd = r.dateISO ? new Date(r.dateISO) : new Date(r.date); return rd >= d && rd < nextDay; })
        .reduce((s, r) => s + r.totalCollection, 0);
      last7.push({ label: dayNames[d.getDay()], amount: dayTotal });
    }
    const maxTrend = Math.max(...last7.map((d) => d.amount), 1);

    return (
      <View style={styles.screenWrapper}>
        <ScrollView style={styles.container}>
          <Text style={styles.title}>📊 Analytics</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>This Week — Revenue</Text>
            <Text style={styles.dashboardAmount}>₹{weekRevenue}</Text>
            <Text style={styles.dashboardInfo}>Cash : ₹{weekCash}</Text>
            <Text style={styles.dashboardInfo}>UPI : ₹{weekUPI}</Text>
            <Text style={[styles.dashboardInfo, { color: '#d9534f' }]}>Expenses : ₹{weekExpenses}</Text>
          </View>

          <View style={[styles.card, { backgroundColor: monthProfit >= 0 ? '#e8f5e9' : '#fdecea' }]}>
            <Text style={styles.cardTitle}>This Month</Text>
            <Text style={styles.dashboardAmount}>₹{monthRevenue}</Text>
            <Text style={styles.dashboardInfo}>Cash : ₹{monthCash}</Text>
            <Text style={styles.dashboardInfo}>UPI : ₹{monthUPI}</Text>
            <Text style={[styles.dashboardInfo, { color: '#d9534f' }]}>Expenses : ₹{monthExpenses}</Text>
            <Text style={[styles.dashboardInfo, { color: monthProfit >= 0 ? '#2e7d32' : '#c62828', fontWeight: '700' }]}>
              Profit : ₹{monthProfit}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>📅 Avg Per Day</Text>
            <Text style={styles.dashboardAmount}>₹{avgDaily}</Text>
            <Text style={styles.dashboardInfo}>Over {reports.length} closed days</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏆 Top Worker</Text>
            {topWorkerName ? (
              <>
                <Text style={styles.dashboardAmount}>{topWorkerName}</Text>
                <Text style={styles.dashboardInfo}>₹{topWorkerAmount} earned</Text>
              </>
            ) : (
              <Text style={styles.emptyText}>No data yet</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>✂️ Top Service</Text>
            {topServiceName ? (
              <>
                <Text style={styles.dashboardAmount}>{topServiceName}</Text>
                <Text style={styles.dashboardInfo}>{topServiceCount} times</Text>
              </>
            ) : (
              <Text style={styles.emptyText}>No data yet</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Last 7 Days</Text>
            {last7.map((day, i) => (
              <View key={i} style={styles.trendRow}>
                <Text style={styles.trendLabel}>{day.label}</Text>
                <View style={styles.trendBarBg}>
                  <View style={[styles.trendBarFill, { width: `${Math.round((day.amount / maxTrend) * 100)}%` }]} />
                </View>
                <Text style={styles.trendAmount}>{day.amount > 0 ? `₹${day.amount}` : '-'}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <BottomNav />
      </View>
    );
  }

  // ── Reports Screen ───────────────────────────────
  if (screen === 'reports') {
    if (selectedReport) {
      return (
        <View style={styles.screenWrapper}>
          <ScrollView style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => setSelectedReport(null)}>
              <Text style={styles.buttonText}>← Back to Reports</Text>
            </TouchableOpacity>

            <Text style={styles.title}>
              📋 {selectedReport.date}{selectedReport.closedAt ? `\n${selectedReport.closedAt}` : ''}
            </Text>

            {/* Revenue */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Revenue</Text>
              <Text style={styles.dashboardAmount}>₹{selectedReport.totalCollection}</Text>
              <Text style={styles.dashboardInfo}>Cash : ₹{selectedReport.cashTotal}</Text>
              <Text style={styles.dashboardInfo}>UPI : ₹{selectedReport.upiTotal}</Text>
            </View>

            {/* Expenses & Profit — V8 */}
            {selectedReport.totalExpenses !== undefined && (
              <View style={[styles.card, { backgroundColor: (selectedReport.profit ?? 0) >= 0 ? '#e8f5e9' : '#fdecea' }]}>
                <Text style={styles.cardTitle}>Expenses & Profit</Text>
                <Text style={[styles.dashboardInfo, { color: '#d9534f' }]}>Expenses : ₹{selectedReport.totalExpenses}</Text>
                <Text style={[styles.dashboardAmount, { color: (selectedReport.profit ?? 0) >= 0 ? '#2e7d32' : '#c62828' }]}>
                  Profit : ₹{selectedReport.profit}
                </Text>
                {selectedReport.expenses && selectedReport.expenses.length > 0 && (
                  <>
                    <Text style={[styles.workerSubText, { marginTop: 10 }]}>Expense Breakdown:</Text>
                    {selectedReport.expenses.map((e: any, i: number) => (
                      <View key={i} style={styles.reportExpenseRow}>
                        <Text style={styles.reportExpenseCategory}>{e.category}{e.note ? ` — ${e.note}` : ''}</Text>
                        <Text style={styles.reportExpenseAmount}>₹{e.amount}</Text>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}

            <Text style={styles.sectionHeading}>Worker Earnings</Text>
            {selectedReport.workerReport.map((item: any) => (
              <View key={item.worker} style={styles.workerCard}>
                <Text style={styles.workerName}>{item.worker}</Text>
                <View>
                  <Text style={styles.workerAmount}>Work: ₹{item.workDone}</Text>
                  <Text style={styles.workerSubText}>Share: ₹{item.share}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <BottomNav />
        </View>
      );
    }

    return (
      <View style={styles.screenWrapper}>
        <ScrollView style={styles.container}>
          <Text style={styles.title}>📁 Reports</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Total Closed Days</Text>
            <Text style={styles.dashboardAmount}>{reports.length}</Text>
            <Text style={styles.dashboardInfo}>
              Total Revenue : ₹{reports.reduce((sum, r) => sum + r.totalCollection, 0)}
            </Text>
            <Text style={[styles.dashboardInfo, { color: '#d9534f' }]}>
              Total Expenses : ₹{reports.reduce((sum, r) => sum + (r.totalExpenses || 0), 0)}
            </Text>
          </View>

          {reports.length === 0 ? (
            <Text style={styles.emptyText}>No reports yet. Close a day to generate one.</Text>
          ) : (
            reports.map((report, index) => (
              <TouchableOpacity
                key={index}
                style={styles.reportCard}
                onPress={() => setSelectedReport(report)}>
                <View>
                  <Text style={styles.reportDate}>{report.date}</Text>
                  <Text style={styles.workerSubText}>
                    {report.closedAt ? `Closed at ${report.closedAt}` : ''}
                  </Text>
                  <Text style={styles.workerSubText}>
                    Cash ₹{report.cashTotal} • UPI ₹{report.upiTotal}
                  </Text>
                  {report.totalExpenses !== undefined && (
                    <Text style={styles.workerSubText}>
                      Exp ₹{report.totalExpenses} • Profit ₹{report.profit}
                    </Text>
                  )}
                </View>
                <View style={styles.reportRight}>
                  <Text style={styles.reportAmount}>₹{report.totalCollection}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      Alert.alert(
                        'Delete Report',
                        `Delete report for ${report.date}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              const updated = reports.filter((_, i) => i !== index);
                              setReports(updated);
                              await AsyncStorage.setItem('reports', JSON.stringify(updated));
                            },
                          },
                        ]
                      );
                    }}>
                    <Text style={styles.deleteText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        <BottomNav />
      </View>
    );
  }

  // ── Home Screen (Dashboard) ──────────────────────
  return (
    <View style={styles.screenWrapper}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>💈 Pankaj Hair Salon</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Collection</Text>
            <TouchableOpacity onPress={() => setShowCollection(!showCollection)}>
              <Text style={styles.eyeIcon}>{showCollection ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.dashboardAmount}>
            {showCollection ? `₹${totalCollection}` : '*****'}
          </Text>
          <View style={styles.collectionRow}>
            <View style={styles.collectionPill}>
              <Text style={styles.collectionPillLabel}>💵 Cash</Text>
              <Text style={styles.collectionPillAmount}>
                {showCollection ? `₹${cashTotal}` : '***'}
              </Text>
            </View>
            <View style={styles.collectionPill}>
              <Text style={styles.collectionPillLabel}>📲 UPI</Text>
              <Text style={styles.collectionPillAmount}>
                {showCollection ? `₹${upiTotal}` : '***'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addTransactionButton, dayClosed && { backgroundColor: '#999' }]}
          disabled={dayClosed}
          onPress={() => setScreen('transaction')}>
          <Text style={styles.addTransactionText}>➕ Add Transaction</Text>
        </TouchableOpacity>

        <Text style={styles.sectionHeading}>Worker Earnings</Text>
        {workerStatus.map((w) => {
          const isSettled = settlements.some((s) => s.worker === w.name);
          return (
            <View key={w.name} style={styles.workerCard}>
              <Text style={styles.workerName}>
                {w.active ? '🟢' : '🔴'} {w.name}
                {isSettled ? '  ✅' : ''}
              </Text>
              <Text style={styles.workerAmount}>₹{getWorkerTotal(w.name)}</Text>
            </View>
          );
        })}

        <View style={styles.actionRow}>
          {!dayClosed ? (
            <TouchableOpacity style={styles.closeDayButton} onPress={closeDay}>
              <Text style={styles.buttonText}>🔒 Close Day</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.startDayButton} onPress={startNewDay}>
              <Text style={styles.buttonText}>🌅 Start New Day</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Bottom Nav ───────────────────────────────────
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 20,
    paddingTop: 10,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  navTabActive: {
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  navTabText: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
    textAlign: 'center',
  },
  navTabTextActive: {
    color: '#000',
    fontWeight: '700',
  },

  // ── Typography ───────────────────────────────────
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 15,
    marginTop: 40,
  },

  // ── Cards ────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dashboardAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#111',
  },
  dashboardInfo: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    color: '#444',
  },

  // ── Collection Pills ─────────────────────────────
  collectionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  collectionPill: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  collectionPillLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  collectionPillAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginTop: 4,
  },

  // ── Buttons ──────────────────────────────────────
  addTransactionButton: {
    backgroundColor: '#000',
    padding: 22,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  addTransactionText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#555',
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 24,
    marginBottom: 40,
  },
  closeDayButton: {
    backgroundColor: '#d9534f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startDayButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  // ── Worker Cards ─────────────────────────────────
  workerCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  workerSubText: {
    fontSize: 12,
    color: '#888',
    marginTop: 3,
  },
  workerAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  workerAttendanceCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerAttendanceName: {
    fontSize: 15,
    fontWeight: '700',
  },
  workerSettledBadge: {
    fontSize: 12,
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
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // ── Expense Cards ────────────────────────────────
  expenseCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseLeft: {
    flex: 1,
    marginRight: 10,
  },
  expenseCategory: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  expenseNote: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  expenseDate: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 3,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#d9534f',
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 4,
  },

  // ── Reports ──────────────────────────────────────
  reportCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportRight: {
    alignItems: 'flex-end',
  },
  reportDate: {
    fontSize: 15,
    fontWeight: '700',
  },
  reportAmount: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#28a745',
  },
  reportExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  reportExpenseCategory: {
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
  reportExpenseAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d9534f',
  },
  deleteButton: {
    marginTop: 6,
    padding: 4,
  },
  deleteText: {
    fontSize: 18,
  },

  // ── Input ────────────────────────────────────────
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },

  // ── Trend Chart ──────────────────────────────────
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
