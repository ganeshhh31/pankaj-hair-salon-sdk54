import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { saveWorkerPinHash } from "@/storage/authStorage";
import { Worker } from "@/types/Worker";
import { hashPin } from "@/utils/pinHash";

// V8.6 - Service type definition
interface Service {
  id: string;
  name: string;
  price: number;
}

// Service Modal Component - MOVED OUTSIDE to prevent re-renders
const ServiceModalComponent = ({
  visible,
  onClose,
  onSave,
  editingService,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, price: number) => void;
  editingService: Service | null;
}) => {
  const [serviceFormName, setServiceFormName] = useState("");
  const [serviceFormPrice, setServiceFormPrice] = useState("");

  // Reset form when modal opens or editing service changes
  React.useEffect(() => {
    if (visible) {
      if (editingService) {
        setServiceFormName(editingService.name);
        setServiceFormPrice(editingService.price.toString());
      } else {
        setServiceFormName("");
        setServiceFormPrice("");
      }
    }
  }, [visible, editingService]);

  const handleSave = () => {
    const price = parseFloat(serviceFormPrice);
    if (!serviceFormName.trim()) {
      Alert.alert("Error", "Service name cannot be empty");
      return;
    }
    if (isNaN(price) || price <= 0) {
      Alert.alert("Error", "Price must be greater than 0");
      return;
    }
    onSave(serviceFormName.trim(), price);
    setServiceFormName("");
    setServiceFormPrice("");
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editingService ? "✏️ Edit Service" : "➕ Add New Service"}
          </Text>

          <Text style={styles.label}>Service Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Hair Spa"
            value={serviceFormName}
            onChangeText={setServiceFormName}
            placeholderTextColor="#aaa"
            autoFocus={true}
          />

          <Text style={styles.label}>Price (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 800"
            value={serviceFormPrice}
            onChangeText={setServiceFormPrice}
            keyboardType="numeric"
            placeholderTextColor="#aaa"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>
                {editingService ? "Update" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function HomeScreen() {
  // V8.6 - Dynamic services
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [amount, setAmount] = useState("");

  // V8.6 - Service Management Modal state
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const expenseCategories = [
    "Rent",
    "Electricity",
    "Products",
    "Salary",
    "Maintenance",
    "Water",
    "Internet",
    "Tea & Snacks",
    "Other",
  ];

  // screen values: 'home' | 'workers' | 'reports' | 'analytics' | 'expenses' | 'transaction' | 'services'
  const [screen, setScreen] = useState("home");
  const [activeTab, setActiveTab] = useState("home");

  const [selectedWorker, setSelectedWorker] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");

  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalCollection, setTotalCollection] = useState(0);
  const [cashTotal, setCashTotal] = useState(0);
  const [upiTotal, setUpiTotal] = useState(0);
  const [showCollection, setShowCollection] = useState(false);
  const [dayClosed, setDayClosed] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // V8.5 - Dynamic workers
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [newWorkerName, setNewWorkerName] = useState("");
  const [settlements, setSettlements] = useState<any[]>([]);

  // V8 — Expenses
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Rent");
  const [expenseNote, setExpenseNote] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  const isWorkerActive = (worker: Worker | undefined) =>
    worker?.status === "ACTIVE";

  const normalizeWorkerRecord = (
    worker: Partial<Worker> & { id?: string; active?: boolean },
    fallbackId: string,
  ): Worker => {
    const normalizedStatus: Worker["status"] =
      worker.status === "ACTIVE" ||
      worker.status === "CHECKED_OUT" ||
      worker.status === "SETTLED" ||
      worker.status === "INACTIVE"
        ? worker.status
        : worker.active === false
          ? "INACTIVE"
          : "ACTIVE";

    return {
      workerId: worker.workerId ?? worker.id ?? fallbackId,
      name:
        typeof worker.name === "string" && worker.name.trim()
          ? worker.name.trim()
          : "Unnamed Worker",
      phone: typeof worker.phone === "string" ? worker.phone.trim() : "",
      pin: typeof worker.pin === "string" ? worker.pin : "",
      role: "worker",
      status: normalizedStatus,
      joinDate:
        typeof worker.joinDate === "string" && worker.joinDate
          ? worker.joinDate
          : new Date().toISOString().split("T")[0],
    };
  };

  const createWorkerRecord = async (workerName: string): Promise<Worker> => {
    const trimmedName = workerName.trim();
    const workerId = Date.now().toString();
    const phone = `9${String(Date.now()).slice(-9)}`;
    const initialPin = "1234";

    await saveWorkerPinHash(workerId, await hashPin(initialPin, workerId));

    return {
      workerId,
      name: trimmedName,
      phone,
      pin: initialPin,
      role: "worker",
      status: "ACTIVE",
      joinDate: new Date().toISOString().split("T")[0],
    };
  };

  // V8.6 - Initialize default services if none exist
  const initializeDefaultServices = async () => {
    const defaultServices: Service[] = [
      { id: "1", name: "Hair Cut", price: 150 },
      { id: "2", name: "Beard", price: 80 },
      { id: "3", name: "Facial", price: 500 },
      { id: "4", name: "Bleach", price: 300 },
      { id: "5", name: "Hair Treatment", price: 700 },
      { id: "6", name: "Hair Color", price: 600 },
      { id: "7", name: "Head Massage", price: 200 },
    ];

    await AsyncStorage.setItem("services", JSON.stringify(defaultServices));
    return defaultServices;
  };

  // V8.6 - Add new service
  const addService = async (name: string, price: number) => {
    // Check for duplicates
    const nameExists = services.some(
      (s) => s.name.toLowerCase() === name.toLowerCase(),
    );

    if (nameExists) {
      Alert.alert("Error", "A service with this name already exists");
      return;
    }

    const newService: Service = {
      id: Date.now().toString(),
      name: name,
      price: price,
    };

    const updatedServices = [...services, newService];
    setServices(updatedServices);
    await AsyncStorage.setItem("services", JSON.stringify(updatedServices));
    Alert.alert("Success", `${newService.name} added successfully`);
  };

  // V8.6 - Edit service
  const editService = async (name: string, price: number) => {
    if (!editingService) return;

    // Check for duplicates (excluding current service)
    const nameExists = services.some(
      (s) =>
        s.id !== editingService.id &&
        s.name.toLowerCase() === name.toLowerCase(),
    );

    if (nameExists) {
      Alert.alert("Error", "A service with this name already exists");
      return;
    }

    const updatedServices = services.map((s) =>
      s.id === editingService.id ? { ...s, name: name, price: price } : s,
    );

    setServices(updatedServices);
    await AsyncStorage.setItem("services", JSON.stringify(updatedServices));

    // Update selected service if it was edited
    if (selectedService === editingService.name) {
      setSelectedService(name);
      setAmount(price.toString());
    }

    Alert.alert("Success", `${name} updated successfully`);
  };

  // V8.6 - Delete service with last service protection
  const deleteService = async (serviceId: string, serviceName: string) => {
    // Prevent deleting last service
    if (services.length === 1) {
      Alert.alert(
        "Cannot Delete",
        "At least one service must remain. Add a new service before deleting this one.",
      );
      return;
    }

    // Check if service appears in any historical report
    const serviceInReports = reports.some((report) =>
      report.serviceReport?.some((s: any) => s.service === serviceName),
    );

    let warningMessage = `Delete ${serviceName}?`;
    if (serviceInReports) {
      warningMessage += `\n\n⚠️ This service appears in historical reports. Deleting it will not affect existing reports, but it will be removed from future transactions.`;
    }

    Alert.alert("Delete Service", warningMessage, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updatedServices = services.filter((s) => s.id !== serviceId);
          setServices(updatedServices);
          await AsyncStorage.setItem(
            "services",
            JSON.stringify(updatedServices),
          );

          // If deleted service was selected, reset selection
          if (selectedService === serviceName) {
            if (updatedServices.length > 0) {
              handleServiceChange(
                updatedServices[0].name,
                updatedServices[0].price,
              );
            } else {
              setSelectedService("");
              setAmount("");
            }
          }

          Alert.alert("Success", `${serviceName} deleted successfully`);
        },
      },
    ]);
  };

  // V8.6 - Open service modal for add/edit
  const openServiceModal = (service?: Service) => {
    setEditingService(service || null);
    setServiceModalVisible(true);
  };

  // V8.6 - Handle service save from modal
  const handleServiceSave = (name: string, price: number) => {
    if (editingService) {
      editService(name, price);
    } else {
      addService(name, price);
    }
    setServiceModalVisible(false);
    setEditingService(null);
  };

  // V8.6 - Handle service selection with price autofill
  const handleServiceChange = (serviceName: string, servicePrice?: number) => {
    setSelectedService(serviceName);
    if (servicePrice !== undefined) {
      setAmount(servicePrice.toString());
    } else {
      const service = services.find((item) => item.name === serviceName);
      if (service) setAmount(service.price.toString());
    }
  };

  // V8.5 - Initialize default workers if none exist
  const initializeDefaultWorkers = async () => {
    const defaultWorkers = await Promise.all(
      ["Pankaj", "Rohit", "Amit"].map((name) => createWorkerRecord(name)),
    );

    await AsyncStorage.setItem("workers", JSON.stringify(defaultWorkers));
    return defaultWorkers;
  };

  // V8.5 - Add new worker
  const addWorker = async () => {
    if (!newWorkerName.trim()) {
      Alert.alert("Error", "Worker name cannot be empty");
      return;
    }

    const nameExists = workers.some(
      (w) => w.name.toLowerCase() === newWorkerName.trim().toLowerCase(),
    );

    if (nameExists) {
      Alert.alert("Error", "A worker with this name already exists");
      return;
    }

    const newWorker = await createWorkerRecord(newWorkerName.trim());

    const updatedWorkers = [...workers, newWorker];
    setWorkers(updatedWorkers);
    await AsyncStorage.setItem("workers", JSON.stringify(updatedWorkers));

    setNewWorkerName("");
    Alert.alert("Success", `${newWorker.name} added successfully`);
  };

  // V8.5 - Deactivate worker
  const deactivateWorker = async (workerId: string, workerName: string) => {
    const activeCount = workers.filter((w) => isWorkerActive(w)).length;

    if (
      activeCount === 1 &&
      isWorkerActive(workers.find((w) => w.workerId === workerId))
    ) {
      Alert.alert(
        "Cannot Deactivate",
        "At least one worker must remain active. Please add another worker before deactivating this one.",
      );
      return;
    }

    const hasTransactions = transactions.some((t) => t.worker === workerName);
    if (hasTransactions) {
      Alert.alert(
        "Cannot Deactivate",
        `${workerName} has transactions today. Please close the day first before deactivating.`,
      );
      return;
    }

    Alert.alert(
      "Deactivate Worker",
      `Are you sure you want to deactivate ${workerName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            const updatedWorkers: Worker[] = workers.map((w) =>
              w.workerId === workerId ? { ...w, status: "INACTIVE" } : w,
            );
            setWorkers(updatedWorkers);
            await AsyncStorage.setItem(
              "workers",
              JSON.stringify(updatedWorkers),
            );

            if (selectedWorker === workerName) {
              const activeWorkersList = updatedWorkers.filter((w) =>
                isWorkerActive(w),
              );
              setSelectedWorker(
                activeWorkersList.length > 0 ? activeWorkersList[0].name : "",
              );
            }

            Alert.alert("Success", `${workerName} has been deactivated`);
          },
        },
      ],
    );
  };

  // V8.5 - Reactivate worker
  const reactivateWorker = async (workerId: string, workerName: string) => {
    Alert.alert("Reactivate Worker", `Reactivate ${workerName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reactivate",
        onPress: async () => {
          const updatedWorkers: Worker[] = workers.map((w) =>
            w.workerId === workerId ? { ...w, status: "ACTIVE" } : w,
          );
          setWorkers(updatedWorkers);
          await AsyncStorage.setItem("workers", JSON.stringify(updatedWorkers));
          Alert.alert("Success", `${workerName} has been reactivated`);
        },
      },
    ]);
  };

  const loadAllData = async () => {
    try {
      // V8.6 - Load services with proper migration
      let savedServices = await AsyncStorage.getItem("services");
      let loadedServices: Service[] = [];

      if (!savedServices) {
        // First launch - create default services
        loadedServices = await initializeDefaultServices();
      } else {
        const parsedServices = JSON.parse(savedServices);

        // Check if old format (array of strings)
        if (
          parsedServices.length > 0 &&
          typeof parsedServices[0] === "string"
        ) {
          // Old format detected - reinitialize with defaults
          console.log(
            "Old service format detected, migrating to new format...",
          );
          loadedServices = await initializeDefaultServices();
        } else {
          // New format - just ensure all fields exist
          loadedServices = parsedServices.map((s: any) => ({
            id: s.id || Date.now().toString() + Math.random(),
            name: s.name,
            price: s.price || 100, // Default price if missing
          }));
        }

        await AsyncStorage.setItem("services", JSON.stringify(loadedServices));
      }

      setServices(loadedServices);

      // Set default selected service
      if (loadedServices.length > 0 && !selectedService) {
        setSelectedService(loadedServices[0].name);
        setAmount(loadedServices[0].price.toString());
      }

      // V8.5 - Load workers
      let savedWorkers = await AsyncStorage.getItem("workers");
      let loadedWorkers: Worker[] = [];

      if (!savedWorkers) {
        loadedWorkers = await initializeDefaultWorkers();
      } else {
        const parsedWorkers = JSON.parse(savedWorkers);
        loadedWorkers = parsedWorkers.map((w: any, index: number) =>
          normalizeWorkerRecord(w, `${Date.now()}-${index}`),
        );
        await AsyncStorage.setItem("workers", JSON.stringify(loadedWorkers));
      }

      setWorkers(loadedWorkers);

      const activeWorkersList = loadedWorkers.filter((w) => isWorkerActive(w));
      if (activeWorkersList.length > 0 && !selectedWorker) {
        setSelectedWorker(activeWorkersList[0].name);
      }

      // Load transactions
      const saved = await AsyncStorage.getItem("transactions");
      if (saved) {
        const parsed = JSON.parse(saved);
        setTransactions(parsed);
        const total = parsed.reduce(
          (sum: number, item: any) => sum + item.amount,
          0,
        );
        const cash = parsed
          .filter((item: any) => item.paymentMode === "Cash")
          .reduce((sum: number, item: any) => sum + item.amount, 0);
        const upi = parsed
          .filter((item: any) => item.paymentMode === "UPI")
          .reduce((sum: number, item: any) => sum + item.amount, 0);
        setTotalCollection(total);
        setCashTotal(cash);
        setUpiTotal(upi);
      }

      const savedReports = await AsyncStorage.getItem("reports");
      if (savedReports) setReports(JSON.parse(savedReports));

      const savedDayClosed = await AsyncStorage.getItem("dayClosed");
      if (savedDayClosed === "true") setDayClosed(true);

      const savedSettlements = await AsyncStorage.getItem("settlements");
      if (savedSettlements) setSettlements(JSON.parse(savedSettlements));

      const savedExpenses = await AsyncStorage.getItem("expenses");
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
    } catch (error) {
      console.log(error);
    }
    setIsLoaded(true);
  };

  const saveTransaction = async () => {
    // CRITICAL FIX: Validate amount before saving
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid amount greater than 0",
      );
      return;
    }

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
    if (paymentMode === "Cash") setCashTotal(cashTotal + Number(amount));
    if (paymentMode === "UPI") setUpiTotal(upiTotal + Number(amount));

    try {
      await AsyncStorage.setItem(
        "transactions",
        JSON.stringify(updatedTransactions),
      );
    } catch (error) {
      console.log(error);
    }

    const activeWorkersList = workers.filter((w) => isWorkerActive(w));
    setSelectedWorker(
      activeWorkersList.length > 0 ? activeWorkersList[0].name : "",
    );
    if (services.length > 0) {
      setSelectedService(services[0].name);
      setAmount(services[0].price.toString());
    }
    setPaymentMode("Cash");
    navigateTo("home");
  };

  // V8 — Save Expense
  const saveExpense = async () => {
    if (!expenseAmount || Number(expenseAmount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid expense amount.");
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
      time: now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };

    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);

    try {
      await AsyncStorage.setItem("expenses", JSON.stringify(updatedExpenses));
    } catch (error) {
      console.log(error);
    }

    setExpenseAmount("");
    setExpenseCategory("Rent");
    setExpenseNote("");

    Alert.alert(
      "Saved",
      `Expense of ₹${newExpense.amount} (${newExpense.category}) saved ✅`,
    );
  };

  // V8 — Delete Expense
  const deleteExpense = async (id: number) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updated = expenses.filter((e) => e.id !== id);
            setExpenses(updated);
            await AsyncStorage.setItem("expenses", JSON.stringify(updated));
          },
        },
      ],
    );
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
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getMonthlyRevenueTotal = () => {
    const now = new Date();
    return reports
      .filter((r) => {
        const d = r.dateISO ? new Date(r.dateISO) : new Date(r.date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, r) => sum + r.totalCollection, 0);
  };

  const closeDay = () => {
    if (totalCollection === 0) {
      Alert.alert(
        "No Transactions",
        "Add at least one transaction before closing the day.",
      );
      return;
    }

    const todayExpenseTotal = getTodayExpenseTotal();
    const todayProfit = totalCollection - todayExpenseTotal;

    Alert.alert(
      "Close Day",
      `Revenue: ₹${totalCollection}\nExpenses: ₹${todayExpenseTotal}\nProfit: ₹${todayProfit}\n\nCash: ₹${cashTotal}  UPI: ₹${upiTotal}\n\nClose the day?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close Day",
          onPress: async () => {
            // FIX: Only include active workers in reports
            const workerReport = workers
              .filter((w) => isWorkerActive(w))
              .map((worker) => {
                const workDone = getWorkerTotal(worker.name);
                return {
                  worker: worker.name,
                  workDone,
                  share: worker.name === "Pankaj" ? workDone : workDone / 2,
                };
              });

            const now = new Date();
            const serviceReport = services.map((service) => ({
              service: service.name,
              count: transactions.filter((t) => t.service === service.name)
                .length,
            }));

            const report = {
              date: now.toLocaleDateString(),
              dateISO: now.toISOString(),
              closedAt: now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
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
            await AsyncStorage.setItem(
              "reports",
              JSON.stringify(updatedReports),
            );
            await AsyncStorage.removeItem("transactions");
            setTransactions([]);
            setTotalCollection(0);
            setCashTotal(0);
            setUpiTotal(0);
            await AsyncStorage.setItem("dayClosed", "true");
            setDayClosed(true);
          },
        },
      ],
    );
  };

  const startNewDay = async () => {
    await AsyncStorage.removeItem("dayClosed");
    await AsyncStorage.removeItem("settlements");
    setSettlements([]);
    setDayClosed(false);
  };

  const activeWorkers = workers.filter((w) => isWorkerActive(w)).map((w) => w.name);

  const getWorkerTotal = (workerName: string) => {
    return transactions
      .filter((item) => item.worker === workerName)
      .reduce((sum, item) => sum + item.amount, 0);
  };

  const navigateTo = (s: string) => {
    setScreen(s);
    if (
      [
        "home",
        "workers",
        "reports",
        "analytics",
        "expenses",
        "services",
      ].includes(s)
    ) {
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
        { key: "home", label: "🏠 Home" },
        { key: "workers", label: "👨 Workers" },
        { key: "services", label: "✂️ Services" },
        { key: "reports", label: "📁 Reports" },
        { key: "analytics", label: "📊 Stats" },
        { key: "expenses", label: "💰 Expenses" },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.navTab, activeTab === tab.key && styles.navTabActive]}
          onPress={() => navigateTo(tab.key)}
        >
          <Text
            style={[
              styles.navTabText,
              activeTab === tab.key && styles.navTabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Services Screen ──────────────────────────────
  if (screen === "services") {
    return (
      <View style={styles.screenWrapper}>
        <ScrollView style={styles.container}>
          <Text style={styles.title}>✂️ Service Management</Text>

          {/* Add Service Button */}
          <TouchableOpacity
            style={styles.addServiceButton}
            onPress={() => openServiceModal()}
          >
            <Text style={styles.addServiceButtonText}>➕ Add New Service</Text>
          </TouchableOpacity>

          {/* Services List */}
          <Text style={styles.sectionHeading}>Services List</Text>

          {services.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateText}>No services found</Text>
              <Text style={styles.emptyStateSubText}>
                Add a service to continue
              </Text>
            </View>
          ) : (
            services.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.servicePrice}>₹{service.price}</Text>
                </View>
                <View style={styles.serviceActions}>
                  <TouchableOpacity
                    style={styles.editServiceButton}
                    onPress={() => openServiceModal(service)}
                  >
                    <Text style={styles.actionButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteServiceButton}
                    onPress={() => deleteService(service.id, service.name)}
                  >
                    <Text style={styles.actionButtonText}>🗑 Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {/* Info Note */}
          {services.length > 0 && (
            <View style={styles.infoNote}>
              <Text style={styles.infoNoteText}>
                ℹ️ Editing or deleting services won&apos;t affect historical
                reports.
              </Text>
            </View>
          )}
        </ScrollView>
        <BottomNav />
        <ServiceModalComponent
          visible={serviceModalVisible}
          onClose={() => {
            setServiceModalVisible(false);
            setEditingService(null);
          }}
          onSave={handleServiceSave}
          editingService={editingService}
        />
      </View>
    );
  }

  // ── Add Transaction Screen ───────────────────────
  if (screen === "transaction") {
    if (activeWorkers.length === 0) {
      return (
        <View style={styles.screenWrapper}>
          <ScrollView style={styles.container}>
            <Text style={styles.title}>➕ Add Transaction</Text>
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateText}>No active workers found</Text>
              <Text style={styles.emptyStateSubText}>
                Please add workers in Workers section first
              </Text>
            </View>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigateTo("workers")}
            >
              <Text style={styles.buttonText}>Go to Workers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigateTo("home")}
            >
              <Text style={styles.buttonText}>← Back</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    if (services.length === 0) {
      return (
        <View style={styles.screenWrapper}>
          <ScrollView style={styles.container}>
            <Text style={styles.title}>➕ Add Transaction</Text>
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateText}>No services available</Text>
              <Text style={styles.emptyStateSubText}>
                Please add services in Services section first
              </Text>
            </View>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigateTo("services")}
            >
              <Text style={styles.buttonText}>Go to Services</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigateTo("home")}
            >
              <Text style={styles.buttonText}>← Back</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={styles.screenWrapper}>
        <ScrollView style={styles.container}>
          <Text style={styles.title}>➕ Add Transaction</Text>

          <Text style={styles.label}>Worker</Text>
          <Picker
            selectedValue={selectedWorker}
            onValueChange={(value) => setSelectedWorker(value)}
          >
            {activeWorkers.map((worker) => (
              <Picker.Item key={worker} label={worker} value={worker} />
            ))}
          </Picker>

          <Text style={styles.label}>Service</Text>
          <Picker
            selectedValue={selectedService}
            onValueChange={(value) => {
              const service = services.find((s) => s.name === value);
              if (service) {
                handleServiceChange(value, service.price);
              }
            }}
          >
            {services.map((service) => (
              <Picker.Item
                key={service.id}
                label={`${service.name} (₹${service.price})`}
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
            placeholder="Enter amount"
          />

          <Text style={styles.label}>Payment Mode</Text>
          <Picker
            selectedValue={paymentMode}
            onValueChange={(value) => setPaymentMode(value)}
          >
            <Picker.Item label="Cash" value="Cash" />
            <Picker.Item label="UPI" value="UPI" />
          </Picker>

          <TouchableOpacity style={styles.saveButton} onPress={saveTransaction}>
            <Text style={styles.buttonText}>✅ Save Transaction</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigateTo("home")}
          >
            <Text style={styles.buttonText}>← Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Expenses Screen ──────────────────────────────
  if (screen === "expenses") {
    const todayExpenseTotal = getTodayExpenseTotal();
    const monthlyExpenseTotal = getMonthlyExpenseTotal();
    const monthlyRevenue = getMonthlyRevenueTotal() + totalCollection;
    const todayProfit = totalCollection - todayExpenseTotal;
    const monthlyProfit = monthlyRevenue - monthlyExpenseTotal;

    return (
      <View style={styles.screenWrapper}>
        <ScrollView style={styles.container}>
          <Text style={styles.title}>💰 Expenses</Text>

          <View
            style={[
              styles.card,
              { backgroundColor: todayProfit >= 0 ? "#e8f5e9" : "#fdecea" },
            ]}
          >
            <Text style={styles.cardTitle}>Today&apos;s Profit</Text>
            <Text
              style={[
                styles.dashboardAmount,
                { color: todayProfit >= 0 ? "#2e7d32" : "#c62828" },
              ]}
            >
              ₹{todayProfit}
            </Text>
            <Text style={styles.dashboardInfo}>
              Revenue : ₹{totalCollection}
            </Text>
            <Text style={styles.dashboardInfo}>
              Expenses : ₹{todayExpenseTotal}
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: monthlyProfit >= 0 ? "#e8f5e9" : "#fdecea" },
            ]}
          >
            <Text style={styles.cardTitle}>Monthly Profit</Text>
            <Text
              style={[
                styles.dashboardAmount,
                { color: monthlyProfit >= 0 ? "#2e7d32" : "#c62828" },
              ]}
            >
              ₹{monthlyProfit}
            </Text>
            <Text style={styles.dashboardInfo}>
              Revenue : ₹{monthlyRevenue}
            </Text>
            <Text style={styles.dashboardInfo}>
              Expenses : ₹{monthlyExpenseTotal}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Expense Summary</Text>
            <Text style={styles.dashboardInfo}>
              Today : ₹{todayExpenseTotal}
            </Text>
            <Text style={styles.dashboardInfo}>
              This Month : ₹{monthlyExpenseTotal}
            </Text>
          </View>

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
              onValueChange={(value) => setExpenseCategory(value)}
            >
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

          <Text style={styles.sectionHeading}>Expense History</Text>

          {expenses.length === 0 ? (
            <Text style={styles.emptyText}>No expenses recorded yet.</Text>
          ) : (
            expenses.map((e) => (
              <View key={e.id} style={styles.expenseCard}>
                <View style={styles.expenseLeft}>
                  <Text style={styles.expenseCategory}>{e.category}</Text>
                  {e.note ? (
                    <Text style={styles.expenseNote}>{e.note}</Text>
                  ) : null}
                  <Text style={styles.expenseDate}>
                    {e.date} • {e.time}
                  </Text>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.expenseAmount}>₹{e.amount}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteExpense(e.id)}
                  >
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
  if (screen === "workers") {
    const settleWorker = (name: string) => {
      const alreadySettled = settlements.find((s) => s.worker === name);
      if (alreadySettled) {
        Alert.alert(
          "Already Settled",
          `${name} is already settled today (₹${alreadySettled.amount} at ${alreadySettled.settledAt}).`,
        );
        return;
      }

      const workerTransactions = transactions.filter((t) => t.worker === name);
      if (workerTransactions.length === 0) {
        Alert.alert("No Transactions", `${name} has no transactions today.`);
        return;
      }

      const breakdown = workerTransactions
        .map((t) => `${t.service}  ₹${t.amount}`)
        .join("\n");
      const total = workerTransactions.reduce((s, t) => s + t.amount, 0);
      const share = name === "Pankaj" ? total : total / 2;

      Alert.alert(
        `Settle ${name}`,
        `${breakdown}\n\nTotal: ₹${total}\nShare: ₹${share}`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: `Pay ₹${share}`,
            onPress: async () => {
              const now = new Date();
              const newSettlement = {
                worker: name,
                amount: share,
                settledAt: now.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }),
              };
              const updated = [...settlements, newSettlement];
              setSettlements(updated);
              await AsyncStorage.setItem(
                "settlements",
                JSON.stringify(updated),
              );
              Alert.alert("Settled", `${name} paid ₹${share} ✅`);
            },
          },
        ],
      );
    };

    const activeCount = workers.filter((w) => isWorkerActive(w)).length;
    const inactiveCount = workers.filter((w) => !isWorkerActive(w)).length;

    const sortedWorkers = [...workers].sort((a, b) => {
      const aActive = isWorkerActive(a);
      const bActive = isWorkerActive(b);
      if (aActive === bActive) return a.name.localeCompare(b.name);
      return aActive ? -1 : 1;
    });

    return (
      <View style={styles.screenWrapper}>
        <ScrollView style={styles.container}>
          <Text style={styles.title}>👨 Worker Management</Text>

          <View style={styles.statsCard}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{activeCount}</Text>
              <Text style={styles.statLabel}>Active Workers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{inactiveCount}</Text>
              <Text style={styles.statLabel}>Inactive Workers</Text>
            </View>
          </View>

          <View style={styles.addWorkerCard}>
            <Text style={styles.cardTitle}>➕ Add New Worker</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter worker name"
              value={newWorkerName}
              onChangeText={setNewWorkerName}
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity style={styles.saveButton} onPress={addWorker}>
              <Text style={styles.buttonText}>Save Worker</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeading}>Workers List</Text>

          {workers.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateText}>No workers found</Text>
              <Text style={styles.emptyStateSubText}>
                Add a worker to continue
              </Text>
            </View>
          ) : (
            sortedWorkers.map((worker, index) => {
              const isSettled = settlements.some(
                (s) => s.worker === worker.name,
              );
              const isActive = isWorkerActive(worker);

              const showSeparator =
                !isActive &&
                index > 0 &&
                isWorkerActive(sortedWorkers[index - 1]);

              return (
                <React.Fragment key={worker.workerId}>
                  {showSeparator && (
                    <View style={styles.separator}>
                      <Text style={styles.separatorText}>Inactive Workers</Text>
                    </View>
                  )}
                  <View style={styles.workerManagementCard}>
                    <View style={styles.workerInfo}>
                      <Text style={styles.workerName}>
                        {worker.name}
                        {!isActive && (
                          <Text style={styles.inactiveBadge}> (Inactive)</Text>
                        )}
                      </Text>
                      <Text style={styles.workerSubText}>
                        {isSettled
                          ? "✅ Settled today"
                          : "⏳ Pending settlement"}
                      </Text>
                    </View>
                    <View style={styles.workerActionsRow}>
                      {isActive && worker.name !== "Pankaj" && (
                        <TouchableOpacity
                          style={[
                            styles.settleButton,
                            isSettled && { backgroundColor: "#999" },
                          ]}
                          disabled={isSettled}
                          onPress={() => settleWorker(worker.name)}
                        >
                          <Text style={styles.actionButtonText}>
                            {isSettled ? "Paid" : "💰 Settle"}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {isActive ? (
                        <TouchableOpacity
                          style={styles.deactivateButton}
                          onPress={() =>
                            deactivateWorker(worker.workerId, worker.name)
                          }
                        >
                          <Text style={styles.actionButtonText}>
                            🔴 Deactivate
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.reactivateButton}
                          onPress={() =>
                            reactivateWorker(worker.workerId, worker.name)
                          }
                        >
                          <Text style={styles.actionButtonText}>
                            🟢 Reactivate
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </React.Fragment>
              );
            })
          )}

          <Text style={styles.sectionHeading}>Today&apos;s Settlements</Text>
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
  if (screen === "analytics") {
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
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });
    const monthRevenue =
      monthReports.reduce((s, r) => s + r.totalCollection, 0) + totalCollection;
    const monthCash = monthReports.reduce((s, r) => s + r.cashTotal, 0);
    const monthUPI = monthReports.reduce((s, r) => s + r.upiTotal, 0);

    const weekExpenses = expenses
      .filter((e) => {
        const d = e.dateISO ? new Date(e.dateISO) : new Date(e.date);
        return d >= startOfWeek;
      })
      .reduce((s, e) => s + e.amount, 0);

    const monthExpenses = expenses
      .filter((e) => {
        const d = e.dateISO ? new Date(e.dateISO) : new Date(e.date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((s, e) => s + e.amount, 0);

    const monthProfit = monthRevenue - monthExpenses;

    const workerTotals: { [key: string]: number } = {};
    reports.forEach((r) => {
      r.workerReport.forEach((w: any) => {
        workerTotals[w.worker] = (workerTotals[w.worker] || 0) + w.workDone;
      });
    });
    const topWorkerName = Object.keys(workerTotals).sort(
      (a, b) => workerTotals[b] - workerTotals[a],
    )[0];
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
    const topServiceName = Object.keys(serviceCounts).sort(
      (a, b) => serviceCounts[b] - serviceCounts[a],
    )[0];
    const topServiceCount = topServiceName ? serviceCounts[topServiceName] : 0;

    const avgDaily =
      reports.length > 0
        ? Math.round(
            reports.reduce((s, r) => s + r.totalCollection, 0) / reports.length,
          )
        : 0;

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const last7: { label: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);
      const dayTotal = reports
        .filter((r) => {
          const rd = r.dateISO ? new Date(r.dateISO) : new Date(r.date);
          return rd >= d && rd < nextDay;
        })
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
            <Text style={[styles.dashboardInfo, { color: "#d9534f" }]}>
              Expenses : ₹{weekExpenses}
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: monthProfit >= 0 ? "#e8f5e9" : "#fdecea" },
            ]}
          >
            <Text style={styles.cardTitle}>This Month</Text>
            <Text style={styles.dashboardAmount}>₹{monthRevenue}</Text>
            <Text style={styles.dashboardInfo}>Cash : ₹{monthCash}</Text>
            <Text style={styles.dashboardInfo}>UPI : ₹{monthUPI}</Text>
            <Text style={[styles.dashboardInfo, { color: "#d9534f" }]}>
              Expenses : ₹{monthExpenses}
            </Text>
            <Text
              style={[
                styles.dashboardInfo,
                {
                  color: monthProfit >= 0 ? "#2e7d32" : "#c62828",
                  fontWeight: "700",
                },
              ]}
            >
              Profit : ₹{monthProfit}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>📅 Avg Per Day</Text>
            <Text style={styles.dashboardAmount}>₹{avgDaily}</Text>
            <Text style={styles.dashboardInfo}>
              Over {reports.length} closed days
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏆 Top Worker</Text>
            {topWorkerName ? (
              <>
                <Text style={styles.dashboardAmount}>{topWorkerName}</Text>
                <Text style={styles.dashboardInfo}>
                  ₹{topWorkerAmount} earned
                </Text>
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
                <Text style={styles.dashboardInfo}>
                  {topServiceCount} times
                </Text>
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
                  <View
                    style={[
                      styles.trendBarFill,
                      {
                        width: `${Math.round((day.amount / maxTrend) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.trendAmount}>
                  {day.amount > 0 ? `₹${day.amount}` : "-"}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <BottomNav />
      </View>
    );
  }

  // ── Reports Screen ───────────────────────────────
  if (screen === "reports") {
    if (selectedReport) {
      return (
        <View style={styles.screenWrapper}>
          <ScrollView style={styles.container}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedReport(null)}
            >
              <Text style={styles.buttonText}>← Back to Reports</Text>
            </TouchableOpacity>

            <Text style={styles.title}>
              📋 {selectedReport.date}
              {selectedReport.closedAt ? `\n${selectedReport.closedAt}` : ""}
            </Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Revenue</Text>
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

            {selectedReport.totalExpenses !== undefined && (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor:
                      (selectedReport.profit ?? 0) >= 0 ? "#e8f5e9" : "#fdecea",
                  },
                ]}
              >
                <Text style={styles.cardTitle}>Expenses & Profit</Text>
                <Text style={[styles.dashboardInfo, { color: "#d9534f" }]}>
                  Expenses : ₹{selectedReport.totalExpenses}
                </Text>
                <Text
                  style={[
                    styles.dashboardAmount,
                    {
                      color:
                        (selectedReport.profit ?? 0) >= 0
                          ? "#2e7d32"
                          : "#c62828",
                    },
                  ]}
                >
                  Profit : ₹{selectedReport.profit}
                </Text>
                {selectedReport.expenses &&
                  selectedReport.expenses.length > 0 && (
                    <>
                      <Text style={[styles.workerSubText, { marginTop: 10 }]}>
                        Expense Breakdown:
                      </Text>
                      {selectedReport.expenses.map((e: any, i: number) => (
                        <View key={i} style={styles.reportExpenseRow}>
                          <Text style={styles.reportExpenseCategory}>
                            {e.category}
                            {e.note ? ` — ${e.note}` : ""}
                          </Text>
                          <Text style={styles.reportExpenseAmount}>
                            ₹{e.amount}
                          </Text>
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
                  <Text style={styles.workerAmount}>
                    Work: ₹{item.workDone}
                  </Text>
                  <Text style={styles.workerSubText}>Share: ₹{item.share}</Text>
                </View>
              </View>
            ))}

            {/* Service Breakdown */}
            {selectedReport.serviceReport &&
              selectedReport.serviceReport.length > 0 && (
                <>
                  <Text style={styles.sectionHeading}>
                    ✂️ Service Breakdown
                  </Text>
                  {selectedReport.serviceReport.map(
                    (item: any, idx: number) => (
                      <View key={idx} style={styles.serviceBreakdownCard}>
                        <Text style={styles.serviceBreakdownName}>
                          {item.service}
                        </Text>
                        <Text style={styles.serviceBreakdownCount}>
                          {item.count} times
                        </Text>
                      </View>
                    ),
                  )}
                </>
              )}
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
              Total Revenue : ₹
              {reports.reduce((sum, r) => sum + r.totalCollection, 0)}
            </Text>
            <Text style={[styles.dashboardInfo, { color: "#d9534f" }]}>
              Total Expenses : ₹
              {reports.reduce((sum, r) => sum + (r.totalExpenses || 0), 0)}
            </Text>
          </View>

          {reports.length === 0 ? (
            <Text style={styles.emptyText}>
              No reports yet. Close a day to generate one.
            </Text>
          ) : (
            reports.map((report, index) => (
              <TouchableOpacity
                key={index}
                style={styles.reportCard}
                onPress={() => setSelectedReport(report)}
              >
                <View>
                  <Text style={styles.reportDate}>{report.date}</Text>
                  <Text style={styles.workerSubText}>
                    {report.closedAt ? `Closed at ${report.closedAt}` : ""}
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
                  <Text style={styles.reportAmount}>
                    ₹{report.totalCollection}
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      Alert.alert(
                        "Delete Report",
                        `Delete report for ${report.date}?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: async () => {
                              const updated = reports.filter(
                                (_, i) => i !== index,
                              );
                              setReports(updated);
                              await AsyncStorage.setItem(
                                "reports",
                                JSON.stringify(updated),
                              );
                            },
                          },
                        ],
                      );
                    }}
                  >
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
            <Text style={styles.cardTitle}>Today&apos;s Collection</Text>
            <TouchableOpacity
              onPress={() => setShowCollection(!showCollection)}
            >
              <Text style={styles.eyeIcon}>{showCollection ? "🙈" : "👁"}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.dashboardAmount}>
            {showCollection ? `₹${totalCollection}` : "*****"}
          </Text>
          <View style={styles.collectionRow}>
            <View style={styles.collectionPill}>
              <Text style={styles.collectionPillLabel}>💵 Cash</Text>
              <Text style={styles.collectionPillAmount}>
                {showCollection ? `₹${cashTotal}` : "***"}
              </Text>
            </View>
            <View style={styles.collectionPill}>
              <Text style={styles.collectionPillLabel}>📲 UPI</Text>
              <Text style={styles.collectionPillAmount}>
                {showCollection ? `₹${upiTotal}` : "***"}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.addTransactionButton,
            (dayClosed ||
              activeWorkers.length === 0 ||
              services.length === 0) && { backgroundColor: "#999" },
          ]}
          disabled={
            dayClosed || activeWorkers.length === 0 || services.length === 0
          }
          onPress={() => setScreen("transaction")}
        >
          <Text style={styles.addTransactionText}>
            {services.length === 0
              ? "⚠️ No Services Available"
              : activeWorkers.length === 0
                ? "⚠️ No Workers Available"
                : "➕ Add Transaction"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionHeading}>Worker Earnings</Text>
        {workers
          .filter((w) => isWorkerActive(w))
          .map((worker) => {
            const isSettled = settlements.some((s) => s.worker === worker.name);
            return (
              <View key={worker.workerId} style={styles.workerCard}>
                <Text style={styles.workerName}>
                  {worker.name}
                  {isSettled ? "  ✅" : ""}
                </Text>
                <Text style={styles.workerAmount}>
                  ₹{getWorkerTotal(worker.name)}
                </Text>
              </View>
            );
          })}

        <View style={styles.actionRow}>
          {!dayClosed ? (
            <TouchableOpacity style={styles.closeDayButton} onPress={closeDay}>
              <Text style={styles.buttonText}>🔒 Close Day</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.startDayButton}
              onPress={startNewDay}
            >
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
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Bottom Nav ───────────────────────────────────
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingBottom: 20,
    paddingTop: 10,
  },
  navTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
  },
  navTabActive: {
    borderTopWidth: 2,
    borderTopColor: "#000",
  },
  navTabText: {
    fontSize: 10,
    color: "#999",
    fontWeight: "500",
    textAlign: "center",
  },
  navTabTextActive: {
    color: "#000",
    fontWeight: "700",
  },

  // ── Typography ───────────────────────────────────
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 15,
    marginTop: 40,
  },

  // ── Cards ────────────────────────────────────────
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyeIcon: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  dashboardAmount: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 8,
    color: "#111",
  },
  dashboardInfo: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    color: "#444",
  },

  // ── Collection Pills ─────────────────────────────
  collectionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  collectionPill: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  collectionPillLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  collectionPillAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
    marginTop: 4,
  },

  // ── Buttons ──────────────────────────────────────
  addTransactionButton: {
    backgroundColor: "#000",
    padding: 22,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  addTransactionText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#555",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  actionRow: {
    marginTop: 24,
    marginBottom: 40,
  },
  closeDayButton: {
    backgroundColor: "#d9534f",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  startDayButton: {
    backgroundColor: "#28a745",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  // ── Service Management Styles ───────────────────
  addServiceButton: {
    backgroundColor: "#6f42c1",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  addServiceButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  serviceCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  servicePrice: {
    fontSize: 14,
    color: "#28a745",
    fontWeight: "600",
    marginTop: 4,
  },
  serviceActions: {
    flexDirection: "row",
    gap: 10,
  },
  editServiceButton: {
    backgroundColor: "#17a2b8",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteServiceButton: {
    backgroundColor: "#d9534f",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  infoNote: {
    backgroundColor: "#e7f3ff",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  infoNoteText: {
    fontSize: 13,
    color: "#0066cc",
    textAlign: "center",
  },
  serviceBreakdownCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceBreakdownName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  serviceBreakdownCount: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#6f42c1",
  },

  // ── Modal Styles ────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },

  // ── Worker Cards ─────────────────────────────────
  workerCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workerName: {
    fontSize: 15,
    fontWeight: "600",
  },
  inactiveBadge: {
    color: "#999",
    fontStyle: "italic",
  },
  workerSubText: {
    fontSize: 12,
    color: "#888",
    marginTop: 3,
  },
  workerAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#28a745",
  },

  // ── Worker Management Styles ───────────────────
  statsCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
  },
  addWorkerCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  workerManagementCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  workerInfo: {
    marginBottom: 10,
  },
  workerActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  settleButton: {
    backgroundColor: "#e67e22",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  deactivateButton: {
    backgroundColor: "#d9534f",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  reactivateButton: {
    backgroundColor: "#28a745",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
    textAlign: "center",
  },
  separator: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  separatorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
    letterSpacing: 0.5,
  },
  emptyStateCard: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#999",
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: "#bbb",
  },
  settlementCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // ── Expense Cards ────────────────────────────────
  expenseCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expenseLeft: {
    flex: 1,
    marginRight: 10,
  },
  expenseCategory: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  expenseNote: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  expenseDate: {
    fontSize: 11,
    color: "#aaa",
    marginTop: 3,
  },
  expenseRight: {
    alignItems: "flex-end",
  },
  expenseAmount: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#d9534f",
  },
  pickerWrapper: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 4,
  },

  // ── Reports ──────────────────────────────────────
  reportCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportRight: {
    alignItems: "flex-end",
  },
  reportDate: {
    fontSize: 15,
    fontWeight: "700",
  },
  reportAmount: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#28a745",
  },
  reportExpenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingHorizontal: 4,
  },
  reportExpenseCategory: {
    fontSize: 13,
    color: "#555",
    flex: 1,
  },
  reportExpenseAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#d9534f",
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
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    marginBottom: 12,
  },

  // ── Trend Chart ──────────────────────────────────
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  trendLabel: {
    width: 36,
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },
  trendBarBg: {
    flex: 1,
    height: 14,
    backgroundColor: "#eee",
    borderRadius: 7,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  trendBarFill: {
    height: 14,
    backgroundColor: "#6f42c1",
    borderRadius: 7,
  },
  trendAmount: {
    width: 64,
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    textAlign: "right",
  },
});
  