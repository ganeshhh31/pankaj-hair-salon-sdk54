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

            const report = {
              date: now.toLocaleDateString(),
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
          {workers.map((worker) => (
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
          dayClosed && {
            backgroundColor: '#999',
          },
        ]}
        disabled={dayClosed}
        onPress={() => setScreen('transaction')}>
        <Text style={styles.buttonText}>
          + Add Transaction
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

      {dayClosed && (
        <TouchableOpacity
          style={styles.startDayButton}
          onPress={async () => {
            await AsyncStorage.removeItem(
              'dayClosed'
            );
            setDayClosed(false);
          }}>
          <Text style={styles.buttonText}>
            🌅 Start New Day
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.heading}>Worker Earnings</Text>

      {workers.map((worker) => (
        <View key={worker} style={styles.workerCard}>
          <Text style={styles.workerName}>{worker}</Text>
          <Text style={styles.workerAmount}>
            ₹{getWorkerTotal(worker)}
          </Text>
        </View>
      ))}

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
});
