import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  sendLoginOtp,
  sendRegistrationOtp,
  verifyLoginOtp,
  verifyRegistrationOtp,
} from "../api/authApi";
import { normalizeApiError } from "../api/client";
import { useAuth } from "../context/auth-context";
import { logout as clearLegacySession, saveSession } from "../services/auth";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

type Purpose = "LOGIN" | "REGISTRATION";
type SelectedRole = "USER" | "PROFESSIONAL";
type ProfessionalType = "NURSE" | "HEALTH_WORKER" | "PHARMACIST";

const getUiMessageForCode = (code?: string): string => {
  switch (code) {
    case "OTP_INVALID":
      return "Invalid OTP. Please check the code and try again.";
    case "OTP_EXPIRED":
      return "Your OTP has expired. Please request a new OTP.";
    case "OTP_MAX_ATTEMPTS_EXCEEDED":
      return "You have reached the maximum number of attempts. Please request a new OTP.";
    case "OTP_COOLDOWN":
      return "Please wait before requesting another OTP.";
    case "OTP_NOT_FOUND":
      return "Invalid or expired OTP. Please request a new OTP.";
    case "EMAIL_ALREADY_REGISTERED":
      return "An account already exists with this email.";
    case "USER_NOT_FOUND":
      return "No CareNow account exists with this email.";
    case "USER_DISABLED":
      return "This account is currently disabled.";
    case "NETWORK_ERROR":
      return "Unable to connect to CareNow. Please try again.";
    default:
      return "Unable to connect to CareNow. Please try again.";
  }
};

export default function VerifyOtpScreen() {
  const params = useLocalSearchParams<{
    email?: string;
    purpose?: string;
    rolePreference?: string;
    professionalType?: string;
  }>();
  const { login } = useAuth();

  const purpose = (params.purpose as Purpose) ?? "LOGIN";
  const email = (params.email as string) ?? "";
  const rolePreference = (params.rolePreference as SelectedRole | undefined) ?? "USER";
  const professionalType = (params.professionalType as ProfessionalType | undefined) ?? "NURSE";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const otpInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (otp.length === OTP_LENGTH && !isVerifying) {
      handleVerify();
    }
  }, [otp, isVerifying]);

  const resendLabel = useMemo(() => {
    if (countdown > 0) {
      return `Resend available in ${countdown}s`;
    }
    return "Resend OTP";
  }, [countdown]);

  const handleVerify = async () => {
    if (isVerifying) {
      return;
    }

    if (!email) {
      setError("Missing email. Please retry the process.");
      return;
    }

    if (otp.trim().length !== OTP_LENGTH || !/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit code sent to your email.");
      return;
    }

    setError("");
    setIsVerifying(true);

    try {
      const response =
        purpose === "REGISTRATION"
          ? await verifyRegistrationOtp(email, otp)
          : await verifyLoginOtp(email, otp);

      const finalUser = {
        ...response.user,
        role: rolePreference === "PROFESSIONAL" ? "PROFESSIONAL" : "USER",
        professionalType: rolePreference === "PROFESSIONAL" ? professionalType : "USER",
      };

      const finalSessionRole: "USER" | "PROFESSIONAL" =
        rolePreference === "PROFESSIONAL" ? "PROFESSIONAL" : "USER";

      await clearLegacySession();
      await saveSession({
        id: String(finalUser.id),
        name: finalUser.email.split('@')[0] || 'CareNow User',
        mobile: '',
        otp: '',
        role: finalSessionRole,
        professionalType: finalUser.professionalType,
        status: finalSessionRole === 'PROFESSIONAL' ? 'APPROVED' : 'ACTIVE',
      });

      await login({
        ...response,
        user: finalUser,
      });

      if (rolePreference === "PROFESSIONAL") {
        router.replace({
          pathname: "/professional-home",
          params: {
            professionalType,
          },
        });
        return;
      }

      router.replace("/(tabs)");
    } catch (apiError) {
      const normalized = normalizeApiError(apiError);
      const uiMessage = getUiMessageForCode(normalized.code);

      if (normalized.code === "OTP_MAX_ATTEMPTS_EXCEEDED") {
        setOtp("");
        setError(uiMessage);
      } else {
        setError(uiMessage);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) {
      return;
    }

    setIsResending(true);
    setError("");

    try {
      if (purpose === "REGISTRATION") {
        await sendRegistrationOtp(email);
      } else {
        await sendLoginOtp(email);
      }

      setOtp("");
      setCountdown(RESEND_SECONDS);
      setTimeout(() => otpInputRef.current?.focus(), 100);
    } catch (apiError) {
      const normalized = normalizeApiError(apiError);
      const uiMessage = normalized.code === "OTP_COOLDOWN"
        ? getUiMessageForCode(normalized.code)
        : normalized.message;

      setError(uiMessage);

      if (normalized.code === "OTP_COOLDOWN") {
        setCountdown(RESEND_SECONDS);
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Verify OTP</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={31} color="#2563EB" />
          </View>

          <Text style={styles.title}>Enter the 6-digit code</Text>
          <Text style={styles.subtitle}>We sent a verification code to</Text>
          <Text style={styles.email}>{email}</Text>

          <Text style={styles.label}>OTP</Text>
          <TextInput
            ref={otpInputRef}
            value={otp}
            onChangeText={(value) => {
              const sanitized = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
              setOtp(sanitized);
              if (error) setError("");
            }}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor="#94A3B8"
            style={styles.otpInput}
            textAlign="center"
            autoFocus
            inputMode="numeric"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.verifyButton, (isVerifying || otp.length !== OTP_LENGTH) && styles.disabledButton]}
            activeOpacity={0.85}
            onPress={handleVerify}
            disabled={isVerifying || otp.length !== OTP_LENGTH}
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resendButton, (countdown > 0 || isResending) && styles.resendDisabled]}
            onPress={handleResend}
            disabled={countdown > 0 || isResending}
          >
            <Text style={styles.resendText}>{resendLabel}</Text>
          </TouchableOpacity>
        </View>
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
    marginTop: 10,
  },
  email: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginTop: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginTop: 28,
    marginBottom: 8,
  },
  otpInput: {
    height: 54,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    fontSize: 18,
    color: "#0F172A",
    letterSpacing: 8,
  },
  errorText: {
    marginTop: 12,
    color: "#B91C1C",
    fontSize: 12,
    lineHeight: 18,
  },
  verifyButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.7,
  },
  resendButton: {
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  resendDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
  },
});