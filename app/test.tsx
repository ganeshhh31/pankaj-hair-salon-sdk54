import { Button, View } from "react-native";

import { getWorkers, saveWorker } from "../storage/workerStorage";

export default function TestScreen() {
  const addWorker = async () => {
    await saveWorker({
      workerId: Date.now().toString(),
      name: "Ganesh",
      phone: "9999999999",
      status: "ACTIVE",
      joinDate: new Date().toISOString(),
      role: "worker",
    });

    console.log("Worker Saved");
  };

  const loadWorkers = async () => {
    const workers = await getWorkers();

    console.log("Workers:", workers);
  };

  return (
    <View style={{ marginTop: 100 }}>
      <Button title="Save Worker" onPress={addWorker} />
      <Button title="Load Workers" onPress={loadWorkers} />
    </View>
  );
}
