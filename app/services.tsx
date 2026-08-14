import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const services = [
  {
    id: "injection",
    title: "Injection Administration",
    description: "Administration of a prescribed injection at home.",
    icon: "fitness-outline" as const,
  },
  {
    id: "wound-dressing",
    title: "Wound Dressing",
    description: "Basic wound dressing and care at home.",
    icon: "bandage-outline" as const,
  },
  {
    id: "bp",
    title: "Blood Pressure Check",
    description: "Check your blood pressure at home.",
    icon: "heart-outline" as const,
  },
  {
    id: "sugar",
    title: "Blood Sugar Check",
    description: "Check blood glucose at home.",
    icon: "water-outline" as const,
  },
  {
    id: "medicine",
    title: "Medicine Administration",
    description: "Assistance with prescribed medicines.",
    icon: "medical-outline" as const,
  },
  {
    id: "elderly",
    title: "Elderly Assistance",
    description: "Basic assistance and care for elderly patients.",
    icon: "people-outline" as const,
  },
  {
    id: "nursing",
    title: "Nursing Visit",
    description: "Request a qualified healthcare worker at home.",
    icon: "medkit-outline" as const,
  },
];

export default function ServicesScreen() {
  const handleServicePress = (serviceId: string) => {
    router.push({
      pathname: "/request-service",
      params: {
        service: serviceId,
      },
    });
  };

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
            Healthcare Services
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.title}>
            What service do you need?
          </Text>

          <Text style={styles.subtitle}>
            Choose a healthcare service that you need at home.
          </Text>

          <View style={styles.serviceList}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                activeOpacity={0.75}
                onPress={() => handleServicePress(service.id)}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={service.icon}
                    size={25}
                    color="#2563EB"
                  />
                </View>

                <View style={styles.serviceContent}>
                  <Text style={styles.serviceTitle}>
                    {service.title}
                  </Text>

                  <Text style={styles.serviceDescription}>
                    {service.description}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Safety message */}
          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#2563EB"
            />

            <Text style={styles.infoText}>
              For services requiring a prescription, please keep
              your valid prescription ready.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
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
    borderRadius: 20,
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
    padding: 16,
    paddingBottom: 35,
  },

  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 8,
  },

  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 5,
    marginBottom: 20,
    lineHeight: 19,
  },

  serviceList: {
    gap: 11,
  },

  serviceCard: {
    minHeight: 82,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 49,
    height: 49,
    borderRadius: 25,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  serviceContent: {
    flex: 1,
    paddingRight: 8,
  },

  serviceTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },

  serviceDescription: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 16,
  },

  infoCard: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 11,
    lineHeight: 17,
    color: "#1E40AF",
  },
});