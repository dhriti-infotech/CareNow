import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
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

import {
  sendLoginOtp,
  verifyLoginOtp,
  verifyProfessionalMobile,
  verifyUserMobile,
} from "@/api/authApi";
import { normalizeApiError } from "@/api/client";
import { useAuth } from "@/context/auth-context";
import { AuthStorage } from "@/services/auth-storage";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

type Purpose = "LOGIN" | "USER_REGISTRATION" | "PROFESSIONAL_REGISTRATION";
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
    identifier?: string;
    purpose?: string;
    rolePreference?: string;
    professionalType?: string;
  }>();

  const { login } = useAuth();

  const purpose = (params.purpose as Purpose) ?? "LOGIN";

  const email = (params.identifier ?? params.email ?? "") as string;

  const rolePreference =
    (params.rolePreference as SelectedRole | undefined) ?? "USER";

  const professionalType =
    (params.professionalType as ProfessionalType | undefined) ?? "NURSE";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  const otpInputRef = useRef<TextInput>(null);

  /*
   * ---------------------------------------------------------
   * OTP TIMER
   * ---------------------------------------------------------
   */
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

  /*
   * ---------------------------------------------------------
   * AUTO VERIFY
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (otp.length === OTP_LENGTH && !isVerifying) {
      handleVerify();
    }
  }, [otp, isVerifying]);

  /*
   * ---------------------------------------------------------
   * IMPORTANT KEYBOARD FIX
   *
   * When iOS dismisses the keyboard, explicitly blur the
   * TextInput.
   *
   * This is important because otherwise React Native/iOS can
   * still consider the hidden TextInput focused even though
   * the keyboard is no longer visible.
   *
   * Once blurred, tapping the OTP area can focus it again.
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const subscription = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        otpInputRef.current?.blur();
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * FORCE OTP INPUT FOCUS
   *
   * This function is called every time the user touches the
   * OTP boxes.
   *
   * The small timeout/requestAnimationFrame is intentional.
   * It allows the touch responder to finish before asking
   * iOS to make the TextInput first responder again.
   * ---------------------------------------------------------
   */
  const focusOtpInput = () => {
    requestAnimationFrame(() => {
      otpInputRef.current?.focus();
    });
  };

  /*
   * ---------------------------------------------------------
   * VERIFY OTP
   * ---------------------------------------------------------
   */
  const handleVerify = async () => {
    Keyboard.dismiss();

    if (isVerifying) {
      return;
    }

    if (!email) {
      setError("Missing mobile number. Please retry the process.");
      return;
    }

    if (
      otp.trim().length !== OTP_LENGTH ||
      !/^\d{6}$/.test(otp)
    ) {
      setError("Please enter the 6-digit code sent to your mobile.");
      return;
    }

    setError("");
    setIsVerifying(true);

    try {
      const response =
        purpose === "USER_REGISTRATION"
          ? await verifyUserMobile({
              mobile: email,
              otp,
            })
          : purpose === "PROFESSIONAL_REGISTRATION"
            ? await verifyProfessionalMobile({
                mobile: email,
                otp,
              })
            : await verifyLoginOtp(email, otp);

      if (purpose !== "LOGIN") {
        await AuthStorage.clearPendingRegistration();

        router.replace("/login");

        return;
      }

      const loginResponse =
        response as import("@/types/auth").AuthResponse;

      await login(loginResponse);

      /*
       * Login is a stack reset point. `router.replace()` only replaces
       * the current OTP route, so the previous Login screen would remain
       * underneath it and an iOS back-swipe could return to Login.
       *
       * Dismiss the authentication stack first, then replace the first
       * route with the authenticated destination. This keeps normal
       * in-app navigation/back gestures unchanged after login.
       */
      if (
        loginResponse.role === "PROFESSIONAL" &&
        loginResponse.verificationStatus === "APPROVED"
      ) {
        router.dismissAll();
        router.replace({
          pathname: "/professional-home",
          params: {
            professionalType,
          },
        });

        return;
      }

      router.dismissAll();
      router.replace(
        loginResponse.role === "USER"
          ? "/(tabs)"
          : "/professional-verification"
      );
    } catch (apiError) {
      const normalized = normalizeApiError(apiError);

      const uiMessage = getUiMessageForCode(
        normalized.code
      );

      if (
        normalized.code ===
        "OTP_MAX_ATTEMPTS_EXCEEDED"
      ) {
        setOtp("");
        setError(uiMessage);
      } else {
        setError(uiMessage);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * RESEND OTP
   * ---------------------------------------------------------
   */
  const handleResend = async () => {
    if (countdown > 0 || isResending) {
      return;
    }

    setIsResending(true);
    setError("");

    try {
      if (purpose === "LOGIN") {
        await sendLoginOtp(email);
      } else {
        setError(
          "Please return to registration to request another OTP."
        );

        return;
      }

      setOtp("");
      setCountdown(RESEND_SECONDS);

      /*
       * Explicitly focus the OTP field after resend.
       */
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 150);
    } catch (apiError) {
      const normalized = normalizeApiError(apiError);

      const uiMessage =
        normalized.code === "OTP_COOLDOWN"
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
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        {/* ===================================================
            HEADER
            =================================================== */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#101828"
            />
          </TouchableOpacity>

          <Image
            source={require("@/assets/images/carenow-logo.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />

          <View style={styles.headerSpacer} />
        </View>

        {/* ===================================================
            CONTENT
            =================================================== */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios"
              ? "interactive"
              : "on-drag"
          }
          showsVerticalScrollIndicator={false}
        >
          {/* =================================================
              OTP ICON
              ================================================= */}
          <View style={styles.brandBadge}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={30}
              color="#0A9FB5"
            />
          </View>

          {/* =================================================
              TITLE
              ================================================= */}
          <Text style={styles.title}>
            OTP Verification
          </Text>

          <Text style={styles.subtitle}>
            We&apos;ve sent a 6-digit verification code to
          </Text>

          <Text style={styles.phoneNumber}>
            {email}
          </Text>

          {/* =================================================
              OTP LABEL
              ================================================= */}
          <Text style={styles.label}>
            Enter OTP
          </Text>

          {/* =================================================
              OTP AREA
              
              IMPORTANT:
              The OTP boxes are custom visual boxes.
              The real TextInput is transparent and sits
              over them.

              onStartShouldSetResponder ensures the OTP area
              can reclaim the touch even after the keyboard
              was dismissed.
              ================================================= */}
          <View
            style={styles.otpArea}
            onStartShouldSetResponder={() => true}
            onResponderRelease={() => {
              focusOtpInput();
            }}
          >
            {/* =================================================
                VISUAL OTP BOXES
                ================================================= */}
            <View
              style={styles.otpBoxes}
              pointerEvents="none"
            >
              {Array.from({
                length: OTP_LENGTH,
              }).map((_, index) => {
                const digit = otp[index] ?? "";

                const isActive =
                  index === otp.length;

                const isFilled =
                  Boolean(digit);

                return (
                  <View
                    key={index}
                    style={[
                      styles.otpBox,

                      isActive &&
                        styles.otpBoxActive,

                      isFilled &&
                        styles.otpBoxFilled,
                    ]}
                  >
                    <Text style={styles.otpDigit}>
                      {digit}
                    </Text>

                    {isActive && !isFilled ? (
                      <View style={styles.otpCaret} />
                    ) : null}
                  </View>
                );
              })}
            </View>

            {/* =================================================
                REAL TEXT INPUT

                This input is intentionally transparent.
                It receives the keyboard input while the
                boxes above provide the visual design.
                ================================================= */}
            <TextInput
              ref={otpInputRef}
              value={otp}
              onChangeText={(value) => {
                const sanitized = value
                  .replace(/\D/g, "")
                  .slice(0, OTP_LENGTH);

                setOtp(sanitized);

                if (error) {
                  setError("");
                }
              }}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={OTP_LENGTH}
              style={styles.otpInputOverlay}
              autoFocus
              showSoftInputOnFocus={true}
              selectionColor="#0A9FB5"
              caretHidden
              accessibilityLabel="Enter 6-digit OTP"
              onTouchStart={() => {
                focusOtpInput();
              }}
            />
          </View>

          {/* =================================================
              ERROR
              ================================================= */}
          {error ? (
            <Text style={styles.errorText}>
              {error}
            </Text>
          ) : null}

          {/* =================================================
              VERIFY
              ================================================= */}
          <TouchableOpacity
            style={[
              styles.verifyButton,

              (isVerifying ||
                otp.length !== OTP_LENGTH) &&
                styles.disabledButton,
            ]}
            activeOpacity={0.85}
            onPress={handleVerify}
            disabled={
              isVerifying ||
              otp.length !== OTP_LENGTH
            }
          >
            {isVerifying ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <>
                <Text style={styles.verifyButtonText}>
                  Verify &amp; Continue
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#FFFFFF"
                />
              </>
            )}
          </TouchableOpacity>

          {/* =================================================
              RESEND
              ================================================= */}
          <TouchableOpacity
            style={[
              styles.resendButton,

              (countdown > 0 ||
                isResending) &&
                styles.resendDisabled,
            ]}
            onPress={handleResend}
            disabled={
              countdown > 0 ||
              isResending
            }
            activeOpacity={0.75}
          >
            <Text style={styles.resendText}>
              {countdown > 0
                ? "Resend OTP in "
                : "Resend OTP"}

              {countdown > 0 ? (
                <Text
                  style={styles.resendCountdown}
                >
                  {countdown}s
                </Text>
              ) : null}
            </Text>
          </TouchableOpacity>

          {/* =================================================
              HELP
              ================================================= */}
          <Text style={styles.helpText}>
            Didn&apos;t receive the code? Check your
            messages or try again after the timer.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* =============================================================
   STYLES
   ============================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  /* ==========================================================
     HEADER
     ========================================================== */

  topBar: {
    height: 62,

    paddingHorizontal: 20,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    borderBottomWidth: 1,

    borderBottomColor: "#F0F2F5",
  },

  backButton: {
    width: 42,

    height: 42,

    borderRadius: 21,

    backgroundColor: "#F6FAFB",

    borderWidth: 1,

    borderColor: "#E1EEF0",

    alignItems: "center",

    justifyContent: "center",
  },

  headerLogo: {
    width: 108,

    height: 48,
  },

  headerSpacer: {
    width: 42,

    height: 42,
  },

  /* ==========================================================
     CONTENT
     ========================================================== */

  contentScroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,

    paddingHorizontal: 20,

    paddingTop: 44,

    paddingBottom: 30,

    alignItems: "center",
  },

  /* ==========================================================
     OTP ICON
     ========================================================== */

  brandBadge: {
    width: 76,

    height: 76,

    borderRadius: 38,

    backgroundColor: "#EAF9FC",

    borderWidth: 1,

    borderColor: "#D5F1F4",

    alignItems: "center",

    justifyContent: "center",

    marginBottom: 24,
  },

  /* ==========================================================
     TYPOGRAPHY
     ========================================================== */

  title: {
    fontSize: 28,

    lineHeight: 35,

    fontWeight: "800",

    color: "#101828",

    textAlign: "center",

    letterSpacing: -0.6,
  },

  subtitle: {
    marginTop: 10,

    fontSize: 15,

    lineHeight: 21,

    color: "#667085",

    textAlign: "center",
  },

  phoneNumber: {
    marginTop: 5,

    fontSize: 16,

    lineHeight: 22,

    fontWeight: "800",

    color: "#101828",

    textAlign: "center",

    letterSpacing: 0.2,
  },

  label: {
    alignSelf: "stretch",

    marginTop: 34,

    marginBottom: 10,

    fontSize: 14,

    lineHeight: 20,

    fontWeight: "700",

    color: "#344054",
  },

  /* ==========================================================
     OTP AREA
     ========================================================== */

  otpArea: {
    width: "100%",

    height: 62,

    position: "relative",
  },

  otpBoxes: {
    width: "100%",

    height: "100%",

    flexDirection: "row",

    justifyContent: "space-between",
  },

  otpBox: {
    width: "14.5%",

    maxWidth: 58,

    height: 62,

    borderRadius: 14,

    borderWidth: 1.5,

    borderColor: "#D0D5DD",

    backgroundColor: "#F9FAFB",

    alignItems: "center",

    justifyContent: "center",
  },

  otpBoxActive: {
    borderColor: "#0A9FB5",

    backgroundColor: "#FFFFFF",

    shadowColor: "#0A9FB5",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.12,

    shadowRadius: 7,

    elevation: 2,
  },

  otpBoxFilled: {
    borderColor: "#9CCFD6",

    backgroundColor: "#F6FCFD",
  },

  otpDigit: {
    fontSize: 24,

    lineHeight: 30,

    fontWeight: "700",

    color: "#101828",
  },

  otpCaret: {
    position: "absolute",

    width: 2,

    height: 28,

    borderRadius: 1,

    backgroundColor: "#0A9FB5",
  },

  /*
   * The real TextInput is almost invisible but remains
   * touchable/focusable.
   *
   * DO NOT use display:none.
   * DO NOT use pointerEvents="none".
   *
   * It must remain a native TextInput so iOS can present
   * the numeric keyboard.
   */
 otpInputOverlay: {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,

  opacity: 0.02,

  color: "transparent",

  backgroundColor: "transparent",

  fontSize: 1,

  textAlign: "center",
},

  /* ==========================================================
     ERROR
     ========================================================== */

  errorText: {
    alignSelf: "stretch",

    marginTop: 9,

    fontSize: 12,

    lineHeight: 18,

    color: "#B42318",
  },

  /* ==========================================================
     VERIFY BUTTON
     ========================================================== */

  verifyButton: {
    width: "100%",

    minHeight: 56,

    marginTop: 18,

    borderRadius: 16,

    backgroundColor: "#0A9FB5",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    shadowColor: "#0A9FB5",

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.16,

    shadowRadius: 10,

    elevation: 3,
  },

  verifyButtonText: {
    color: "#FFFFFF",

    fontSize: 17,

    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.48,

    shadowOpacity: 0,

    elevation: 0,
  },

  /* ==========================================================
     RESEND
     ========================================================== */

  resendButton: {
    marginTop: 18,

    paddingVertical: 8,

    paddingHorizontal: 12,

    alignItems: "center",

    justifyContent: "center",
  },

  resendDisabled: {
    opacity: 0.7,
  },

  resendText: {
    color: "#667085",

    fontSize: 14,

    lineHeight: 20,

    fontWeight: "600",
  },

  resendCountdown: {
    color: "#101828",

    fontWeight: "800",
  },

  /* ==========================================================
     HELP
     ========================================================== */

  helpText: {
    maxWidth: 330,

    marginTop: 18,

    fontSize: 12,

    lineHeight: 18,

    color: "#98A2B3",

    textAlign: "center",
  },
});