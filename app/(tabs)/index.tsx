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

const quickServices = [
  {
    title: "Nurse at Home",
    subtitle: "Professional care",
    icon: "medkit-outline" as const,
    route: "/request-nurse",
  },
  {
    title: "Injection Service",
    subtitle: "With prescription",
    icon: "fitness-outline" as const,
    route: "/services",
  },
  {
    title: "Prescription Medicines",
    subtitle: "Delivered to you",
    icon: "medical-outline" as const,
    route: "/services"
  },
  {
    title: "Medical Equipment",
    subtitle: "Buy or rent",
    icon: "bandage-outline" as const,
    route: "/services",
  },
];

const popularServices = [
  {
    title: "Injection administration",
    icon: "fitness-outline" as const,
  },
  {
    title: "Wound dressing",
    icon: "bandage-outline" as const,
  },
  {
    title: "BP / Sugar check",
    icon: "heart-outline" as const,
  },
  {
    title: "Elderly care",
    icon: "people-outline" as const,
  },
  {
    title: "Nursing visit",
    icon: "medkit-outline" as const,
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.locationContainer}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={19} color="#0A9FB5" />
              </View>

              <View>
                <Text style={styles.locationLabel}>Your Location</Text>
                <View style={styles.locationRow}>
                  <Text style={styles.locationText}>Select your location</Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color="#526973"
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.8}
            >
              <Ionicons name="person-outline" size={20} color="#182A33" />
            </TouchableOpacity>
          </View>

          {/* Greeting */}
          <View style={styles.greeting}>
            <Text style={styles.greetingTitle}>Good Morning 👋</Text>
            <Text style={styles.greetingSubtitle}>
              How can we help you today?
            </Text>
          </View>

          {/* Search */}
          <TouchableOpacity style={styles.searchBox}>
            <Ionicons name="search-outline" size={21} color="#687F89" />

            <Text style={styles.searchText}>
              Search for a service
            </Text>
          </TouchableOpacity>

          {/* Quick Services */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>What do you need?</Text>
          </View>

          <View style={styles.serviceGrid}>
            {quickServices.map((service) => (
              <TouchableOpacity
                key={service.title}
                style={styles.serviceCard}
                activeOpacity={0.8}
                onPress={() => router.push(service.route as any)}
              >
                <View style={styles.serviceIcon}>
                  <Ionicons
                    name={service.icon}
                    size={27}
                    color="#0A9FB5"
                  />
                </View>

                <Text style={styles.serviceTitle}>
                  {service.title}
                </Text>

                <Text style={styles.serviceSubtitle}>
                  {service.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Emergency / Quick Request */}
          <TouchableOpacity
            style={styles.urgentCard}
            activeOpacity={0.85}
            onPress={() => router.push("/services")}
          >
            <View style={styles.urgentIcon}>
              <Ionicons name="flash" size={23} color="#FFFFFF" />
            </View>

            <View style={styles.urgentContent}>
              <Text style={styles.urgentTitle}>
                Need healthcare quickly?
              </Text>

              <Text style={styles.urgentSubtitle}>
                Request a nearby healthcare worker
              </Text>
            </View>

            <View style={styles.urgentArrow}>
              <Ionicons
                name="arrow-forward"
                size={19}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>

          {/* Popular Services */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Services</Text>

            <TouchableOpacity>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.popularContainer}>
            {popularServices.map((service) => (
              <TouchableOpacity
                key={service.title}
                style={styles.popularItem}
                activeOpacity={0.7}
              >
                <View style={styles.popularIcon}>
                  <Ionicons
                    name={service.icon}
                    size={20}
                    color="#0A9FB5"
                  />
                </View>

                <Text style={styles.popularText}>
                  {service.title}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={17}
                  color="#91A6AE"
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Trust message */}
          <View style={styles.trustCard}>
            <Ionicons
              name="shield-checkmark-outline"
              size={25}
              color="#16A34A"
            />

            <View style={styles.trustTextContainer}>
              <Text style={styles.trustTitle}>
                Healthcare at your doorstep
              </Text>

              <Text style={styles.trustSubtitle}>
                Connecting you with local healthcare services.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FBFC",
  },

  container: {
    flex: 1,
    backgroundColor: "#F7FBFC",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
  },

  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  locationIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EAF9FC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  locationLabel: {
    fontSize: 11,
    color: "#687F89",
    marginBottom: 2,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  locationText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#182A33",
    marginRight: 3,
  },

  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D7E8EB",
  },

  greeting: {
    marginTop: 8,
    marginBottom: 16,
  },

  greetingTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#10242C",
  },

  greetingSubtitle: {
    fontSize: 14,
    color: "#687F89",
    marginTop: 4,
  },

  searchBox: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7E8EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 24,
  },

  searchText: {
    fontSize: 14,
    color: "#91A6AE",
    marginLeft: 10,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10242C",
  },

  viewAll: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0A9FB5",
  },

  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  serviceCard: {
    width: "48.2%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#D7E8EB",
  },

  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EAF9FC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },

  serviceTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#182A33",
    lineHeight: 19,
  },

  serviceSubtitle: {
    fontSize: 11,
    color: "#687F89",
    marginTop: 4,
  },

  urgentCard: {
    backgroundColor: "#0A9FB5",
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
  },

  urgentIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  urgentContent: {
    flex: 1,
    marginLeft: 12,
  },

  urgentTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  urgentSubtitle: {
    color: "#D5F1F4",
    fontSize: 11,
    marginTop: 3,
  },

  urgentArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  popularContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7E8EB",
    overflow: "hidden",
    marginBottom: 20,
  },

  popularItem: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF6F7",
  },

  popularIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EAF9FC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  popularText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#344B55",
  },

  trustCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    padding: 14,
  },

  trustTextContainer: {
    flex: 1,
    marginLeft: 11,
  },

  trustTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#166534",
  },

  trustSubtitle: {
    fontSize: 11,
    color: "#4D7C0F",
    marginTop: 3,
  },
});