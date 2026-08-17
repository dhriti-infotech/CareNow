import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    AppUser,
    getSession,
    logout,
} from "../services/auth";

export default function ProfessionalProfileScreen() {
  const [user, setUser] = useState<AppUser | null>(
    null
  );

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const session = await getSession();
    setUser(session);
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/login");
          },
        },
      ]
    );
  };

  const professionalType =
    user?.professionalType || "Healthcare Professional";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#0F172A"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            My Profile
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Profile summary */}
          <View style={styles.profileSummary}>
            <View style={styles.avatar}>
              <Ionicons
                name="person"
                size={34}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.name}>
              {user?.name || "Professional"}
            </Text>

            <Text style={styles.mobile}>
              +91 {user?.mobile || ""}
            </Text>

            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {professionalType}
              </Text>
            </View>
          </View>

          {/* Verification */}
          <Text style={styles.sectionTitle}>
            Verification
          </Text>

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={21}
                color="#16A34A"
              />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                Professional Status
              </Text>

              <Text style={styles.cardDescription}>
                Your professional profile is verified and
                active.
              </Text>
            </View>

            <View style={styles.approvedBadge}>
              <Text style={styles.approvedText}>
                Approved
              </Text>
            </View>
          </View>

          {/* Professional details */}
          <Text style={styles.sectionTitle}>
            Professional Details
          </Text>

          <View style={styles.detailsCard}>
            <DetailRow
              icon="medical-outline"
              label="Profession"
              value={professionalType}
            />

            <View style={styles.separator} />

            <DetailRow
              icon="school-outline"
              label="Qualification"
              value={
                user?.qualification || "Not provided"
              }
            />

            <View style={styles.separator} />

            <DetailRow
              icon="document-text-outline"
              label="Registration Number"
              value={
                user?.registrationNumber ||
                "Not provided"
              }
            />

            <View style={styles.separator} />

            <DetailRow
              icon="location-outline"
              label="Service Area"
              value={
                user?.serviceArea || "Not provided"
              }
            />
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.85}
            onPress={handleLogout}
          >
            <Ionicons
              name="log-out-outline"
              size={21}
              color="#DC2626"
            />

            <Text style={styles.logoutText}>
              Logout
            </Text>
          </TouchableOpacity>

          <Text style={styles.version}>
            RuralCare • Development Build
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons
          name={icon}
          size={19}
          color="#2563EB"
        />
      </View>

      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text style={styles.detailValue}>
          {value}
        </Text>
      </View>
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
  },

  header: {
    height: 58,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
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
    padding: 20,
    paddingBottom: 35,
  },

  profileSummary: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 10,
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 13,
  },

  mobile: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },

  typeBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 9,
  },

  typeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563EB",
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 22,
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  cardIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },

  cardContent: {
    flex: 1,
    marginLeft: 10,
  },

  cardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E293B",
  },

  cardDescription: {
    fontSize: 10,
    lineHeight: 15,
    color: "#64748B",
    marginTop: 3,
  },

  approvedBadge: {
    backgroundColor: "#DCFCE7",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  approvedText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#15803D",
  },

  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 13,
  },

  detailRow: {
    minHeight: 67,
    flexDirection: "row",
    alignItems: "center",
  },

  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  detailContent: {
    flex: 1,
    marginLeft: 11,
  },

  detailLabel: {
    fontSize: 10,
    color: "#64748B",
  },

  detailValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 3,
  },

  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 51,
  },

  logoutButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },

  logoutText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#DC2626",
    marginLeft: 8,
  },

  version: {
    textAlign: "center",
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 16,
  },
});