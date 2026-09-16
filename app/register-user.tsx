import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { registerUser } from "../api/authApi";
import { normalizeApiError } from "../api/client";
import { AuthStorage } from "../services/auth-storage";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterUserScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMobile = mobile.replace(/\D/g, "");

    if (!name.trim() || !normalizedEmail || normalizedMobile.length !== 10) {
      setError("Name, email, and a valid 10-digit mobile number are required.");
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await registerUser({ name: name.trim(), email: normalizedEmail, mobile: normalizedMobile, address: address.trim() || undefined });
      await AuthStorage.savePendingRegistration({ kind: "USER", mobile: normalizedMobile });
      router.push({
        pathname: "/verify-otp",
        params: {
          identifier: normalizedMobile,
          purpose: "USER_REGISTRATION",
        },
      });
    } catch (apiError) {
      const normalized = normalizeApiError(apiError);

      if (normalized.code === "EMAIL_ALREADY_REGISTERED") {
        Alert.alert("Account exists", "An account already exists with this email.", [
          { text: "Login", onPress: () => router.replace("/login") },
          { text: "Cancel", style: "cancel" },
        ]);
        return;
      }

      setError(normalized.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#101828" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-add-outline" size={32} color="#0A9FB5" />
          </View>

          <Text style={styles.title}>Create your CareNow account</Text>
          <Text style={styles.subtitle}>Register to request healthcare services at your doorstep.</Text>

          <Text style={styles.label}>Full name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Enter your full name" placeholderTextColor="#98A2B3" style={styles.input} />
          <Text style={styles.label}>Email address</Text>
          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (error) setError("");
            }}
            placeholder="Enter your email"
            placeholderTextColor="#98A2B3"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          <Text style={styles.label}>Mobile number</Text>
          <TextInput value={mobile} onChangeText={(value) => setMobile(value.replace(/\D/g, ""))} placeholder="Enter 10-digit mobile number" placeholderTextColor="#98A2B3" keyboardType="phone-pad" maxLength={10} style={styles.input} />
          <Text style={styles.label}>Address (optional)</Text>
          <TextInput value={address} onChangeText={setAddress} placeholder="Enter your address" placeholderTextColor="#98A2B3" style={styles.input} />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#0A9FB5" />
            <Text style={styles.infoText}>We&apos;ll verify your mobile number using a one-time password.</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.disabledButton]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.buttonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
  },
  header: {
    height: 58,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
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
    color: "#101828",
  },
  spacer: {
    width: 40,
  },
  content: {
    padding: 20,
    paddingBottom: 35,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EAF9FC",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 25,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#101828",
    textAlign: "center",
    marginTop: 17,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#667085",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 28,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#344054",
    marginBottom: 7,
  },
  input: {
    height: 51,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    fontSize: 14,
    color: "#101828",
    marginBottom: 12,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 12,
    marginBottom: 12,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF9FC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: "#D5F1F4",
  },
  infoText: {
    flex: 1,
    color: "#344054",
    fontSize: 12,
    lineHeight: 18,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A9FB5",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    shadowColor: "#0A9FB5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
