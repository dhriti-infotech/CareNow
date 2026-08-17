import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
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
} from "../../services/auth";

export default function ProfileScreen() {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name="person-outline"
            size={36}
            color="#2563EB"
          />
        </View>

        {/* User information */}
        <Text style={styles.title}>
          {user?.name || "Your Profile"}
        </Text>

        {user?.mobile && (
          <Text style={styles.mobile}>
            +91 {user.mobile}
          </Text>
        )}

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            Patient
          </Text>
        </View>

        <Text style={styles.subtitle}>
          Manage your profile, saved addresses and
          preferences here.
        </Text>

        {/* Account section */}
        <View style={styles.accountCard}>
          <View style={styles.accountRow}>
            <View style={styles.rowIcon}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#2563EB"
              />
            </View>

            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>
                Personal Information
              </Text>

              <Text style={styles.rowSubtitle}>
                Manage your personal details
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#94A3B8"
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.accountRow}>
            <View style={styles.rowIcon}>
              <Ionicons
                name="location-outline"
                size={20}
                color="#2563EB"
              />
            </View>

            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>
                Saved Addresses
              </Text>

              <Text style={styles.rowSubtitle}>
                Manage your service locations
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#94A3B8"
            />
          </View>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 45,
  },

  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  title: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },

  mobile: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 5,
  },

  roleBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginTop: 8,
  },

  roleText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563EB",
  },

  subtitle: {
    marginTop: 12,
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 320,
  },

  accountCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 25,
    overflow: "hidden",
  },

  accountRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },

  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  rowContent: {
    flex: 1,
    marginLeft: 11,
  },

  rowTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },

  rowSubtitle: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 3,
  },

  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 66,
  },

  logoutButton: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  logoutText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#DC2626",
    marginLeft: 8,
  },
});