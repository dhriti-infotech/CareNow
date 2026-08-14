import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const serviceNames: Record<string, string> = {
  injection: "Injection Administration",
  "wound-dressing": "Wound Dressing",
  bp: "Blood Pressure Check",
  sugar: "Blood Sugar Check",
  medicine: "Medicine Administration",
  elderly: "Elderly Assistance",
  nursing: "Nursing Visit",
};

export default function RequestServiceScreen() {
  const { service } = useLocalSearchParams<{
    service?: string;
  }>();

  const serviceName =
    serviceNames[service ?? ""] ?? "Healthcare Service";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#0F172A"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Request Service
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="medkit-outline"
              size={38}
              color="#2563EB"
            />
          </View>

          <Text style={styles.title}>
            {serviceName}
          </Text>

          <Text style={styles.subtitle}>
            We will collect a few details before finding an
            available healthcare worker near you.
          </Text>

          {/* Step indicator */}
          <View style={styles.steps}>
            <Step number="1" label="Service" active />
            <Step number="2" label="Details" />
            <Step number="3" label="Location" />
            <Step number="4" label="Confirm" />
          </View>

          {/* Coming next */}
          <View style={styles.nextCard}>
            <Ionicons
              name="document-text-outline"
              size={25}
              color="#2563EB"
            />

            <View style={styles.nextContent}>
              <Text style={styles.nextTitle}>
                Service details
              </Text>

              <Text style={styles.nextText}>
                Next, we'll collect the information required
                for this service.
              </Text>
            </View>
          </View>

          <View style={styles.spacer} />

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              // Next step will implement the actual form.
            }}
          >
            <Text style={styles.continueText}>
              Continue
            </Text>

            <Ionicons
              name="arrow-forward"
              size={19}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Step({
  number,
  label,
  active = false,
}: {
  number: string;
  label: string;
  active?: boolean;
}) {
  return (
    <View style={styles.step}>
      <View
        style={[
          styles.stepCircle,
          active && styles.activeStepCircle,
        ]}
      >
        <Text
          style={[
            styles.stepNumber,
            active && styles.activeStepNumber,
          ]}
        >
          {number}
        </Text>
      </View>

      <Text
        style={[
          styles.stepLabel,
          active && styles.activeStepLabel,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },

  headerSpacer: {
    width: 40,
  },

  content: {
    flex: 1,
    padding: 18,
  },

  iconContainer: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 15,
  },

  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginTop: 16,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
    marginTop: 7,
  },

  steps: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 25,
  },

  step: {
    alignItems: "center",
  },

  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  activeStepCircle: {
    backgroundColor: "#2563EB",
  },

  stepNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  activeStepNumber: {
    color: "#FFFFFF",
  },

  stepLabel: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 5,
  },

  activeStepLabel: {
    color: "#2563EB",
    fontWeight: "700",
  },

  nextCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  nextContent: {
    flex: 1,
    marginLeft: 11,
  },

  nextTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },

  nextText: {
    fontSize: 11,
    lineHeight: 17,
    color: "#64748B",
    marginTop: 4,
  },

  spacer: {
    flex: 1,
  },

  continueButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  continueText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginRight: 9,
  },
});