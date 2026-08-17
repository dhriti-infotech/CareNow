import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [mobile, setMobile] = useState("");

  const handleLogin = () => {
    const cleanedMobile = mobile.replace(/\D/g, "");

    if (cleanedMobile.length !== 10) {
      Alert.alert(
        "Invalid mobile number",
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    router.push({
      pathname: "/verify-otp",
      params: {
        mobile: cleanedMobile,
        mode: "login",
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios" ? "padding" : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons
                name="medical"
                size={34}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.brand}>RuralCare</Text>

            <Text style={styles.tagline}>
              Healthcare at your doorstep
            </Text>
          </View>

          {/* Login card */}
          <View style={styles.card}>
            <Text style={styles.title}>
              Welcome back
            </Text>

            <Text style={styles.subtitle}>
              Login to access RuralCare services
            </Text>

            <Text style={styles.label}>
              Mobile number
            </Text>

            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>
                  +91
                </Text>
              </View>

              <TextInput
                value={mobile}
                onChangeText={setMobile}
                placeholder="Enter mobile number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                style={styles.phoneInput}
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={handleLogin}
            >
              <Text style={styles.primaryButtonText}>
                Continue
              </Text>

              <Ionicons
                name="arrow-forward"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>
                New to RuralCare?
              </Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              onPress={() => router.push("/register-user")}
            >
              <Text style={styles.secondaryButtonText}>
                Register as User
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.professionalButton}
              activeOpacity={0.85}
              onPress={() =>
                router.push("/register-professional")
              }
            >
              <Ionicons
                name="briefcase-outline"
                size={19}
                color="#2563EB"
              />

              <Text style={styles.professionalButtonText}>
                Register as Healthcare Professional
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            By continuing, you agree to RuralCare's
            Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 25,
    justifyContent: "center",
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },

  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  brand: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 13,
  },

  tagline: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },

  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 5,
    marginBottom: 25,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 7,
  },

  phoneInputContainer: {
    height: 52,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 11,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },

  countryCode: {
    width: 62,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
  },

  countryCodeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },

  phoneInput: {
    flex: 1,
    paddingHorizontal: 13,
    fontSize: 14,
    color: "#0F172A",
  },

  primaryButton: {
    height: 52,
    borderRadius: 11,
    backgroundColor: "#2563EB",
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginRight: 8,
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },

  dividerText: {
    fontSize: 10,
    color: "#94A3B8",
    marginHorizontal: 10,
  },

  secondaryButton: {
    height: 50,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },

  professionalButton: {
    minHeight: 50,
    borderRadius: 11,
    backgroundColor: "#EFF6FF",
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  professionalButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2563EB",
    marginLeft: 8,
  },

  footer: {
    fontSize: 9,
    lineHeight: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 18,
  },
});