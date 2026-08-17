import { Ionicons } from "@expo/vector-icons";
import {
    router,
    useLocalSearchParams,
} from "expo-router";
import { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    findUser,
    saveSession,
} from "../services/auth";

export default function VerifyOtpScreen() {
  const params = useLocalSearchParams<{
    mobile?: string;
    mode?: string;
    name?: string;
    professionalType?: string;
  }>();

  const [otp, setOtp] = useState("");

 const handleVerify = async () => {
  if (otp.length !== 6) {
    Alert.alert(
      "Invalid OTP",
      "Please enter the 6-digit OTP."
    );
    return;
  }

  /*
   * LOGIN FLOW
   */
  if (params.mode === "login") {
    const user = findUser(
      params.mobile ?? "",
      otp
    );

    if (!user) {
      Alert.alert(
        "Login failed",
        "Mobile number or OTP is incorrect."
      );
      return;
    }

    await saveSession(user);

    if (user.role === "PROFESSIONAL") {
      router.replace("/professional-home");
    } else {
      router.replace("/(tabs)");
    }

    return;
  }

  /*
   * USER REGISTRATION
   *
   * Still mock for now.
   */
  if (params.mode === "user-registration") {
    Alert.alert(
      "Account created",
      "Your RuralCare account has been created successfully.",
      [
        {
          text: "Continue",
          onPress: async () => {
            /*
             * For now create a development session
             * using the registration information.
             */
            const user = {
              id: `USR-${Date.now()}`,
              name: params.name ?? "RuralCare User",
              mobile: params.mobile ?? "",
              otp: "123456",
              role: "USER" as const,
              status: "ACTIVE",
            };

            await saveSession(user);

            router.replace("/(tabs)");
          },
        },
      ]
    );

    return;
  }

  /*
   * PROFESSIONAL REGISTRATION
   */
  if (
    params.mode ===
    "professional-registration"
  ) {
    Alert.alert(
      "Registration submitted",
      "Your professional registration has been submitted for verification.",
      [
        {
          text: "Continue",
          onPress: async () => {
            const professional = {
              id: `PRO-${Date.now()}`,
              name:
                params.name ??
                "RuralCare Professional",
              mobile: params.mobile ?? "",
              otp: "123456",
              role: "PROFESSIONAL" as const,
              professionalType:
                params.professionalType ??
                "NURSE",
              status: "PENDING",
            };

            await saveSession(professional);

            router.replace(
              "/professional-home"
            );
          },
        },
      ]
    );

    return;
  }

  Alert.alert(
    "Unable to continue",
    "Unknown authentication request."
  );
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#0F172A"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Verify Mobile
          </Text>

          <View style={styles.spacer} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={31}
              color="#2563EB"
            />
          </View>

          <Text style={styles.title}>
            Verify your mobile number
          </Text>

          <Text style={styles.subtitle}>
            We've sent a one-time password to
          </Text>

          <Text style={styles.mobile}>
            +91 {params.mobile}
          </Text>

          <Text style={styles.label}>
            Enter OTP
          </Text>

          <TextInput
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor="#94A3B8"
            style={styles.otpInput}
          />

          <View style={styles.devCard}>
            <Ionicons
              name="construct-outline"
              size={19}
              color="#B45309"
            />

            <Text style={styles.devText}>
              Development mode: use OTP 123456
            </Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            onPress={handleVerify}
          >
            <Text style={styles.buttonText}>
              Verify & Continue
            </Text>

            <Ionicons
              name="arrow-forward"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={() =>
              Alert.alert(
                "OTP",
                "A new OTP would be sent here in production."
              )
            }
          >
            <Text style={styles.resendText}>
              Resend OTP
            </Text>
          </TouchableOpacity>
        </View>
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
  },

  header: {
    height: 58,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
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

  spacer: {
    width: 40,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 55,
  },

  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },

  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginTop: 18,
  },

  subtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 7,
  },

  mobile: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
    marginTop: 4,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginTop: 30,
    marginBottom: 7,
  },

  otpInput: {
    height: 55,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },

  devCard: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 11,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },

  devText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 11,
    color: "#92400E",
  },

  button: {
    height: 52,
    borderRadius: 11,
    backgroundColor: "#2563EB",
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginRight: 8,
  },

  resendButton: {
    alignItems: "center",
    marginTop: 20,
  },

  resendText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },
});