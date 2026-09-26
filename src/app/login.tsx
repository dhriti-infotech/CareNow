// import { Ionicons } from "@expo/vector-icons";
// import { router } from "expo-router";
// import { useState } from "react";
// import {
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// import { sendLoginOtp } from "@/api/authApi";
// import { normalizeApiError } from "@/api/client";

// const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// /*
//  * TEMP DEV TEST ONLY:
//  * This role selector is a temporary developer-only test harness for the app flow.
//  * Once the backend supports multiple email identities with different account roles,
//  * login should be driven by the actual user record and role in the backend response.
//  *
//  * Current temporary behavior:
//  * - User => routes to the normal customer app flow
//  * - Professional => routes to the professional dashboard
//  * - Professional sub-roles: Nurse, Health Worker, Pharmacist
//  *
//  * This UI will be removed once real users are created with distinct role-based emails
//  * and backend role resolution is fully in place.
//  */

// type SelectedRole = "USER" | "PROFESSIONAL";
// type ProfessionalType = "NURSE" | "HEALTH_WORKER" | "PHARMACIST";

// const professionalTypes: Array<{ value: ProfessionalType; label: string }> = [
//   { value: "NURSE", label: "Nurse" },
//   { value: "HEALTH_WORKER", label: "Health Worker" },
//   { value: "PHARMACIST", label: "Pharmacist" },
// ];

// export default function LoginScreen() {
//   const [email, setEmail] = useState("");
//   const [error, setError] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [selectedRole, setSelectedRole] = useState<SelectedRole>("USER");
//   const [selectedProfessionalType, setSelectedProfessionalType] = useState<ProfessionalType>("NURSE");

//   const handleContinue = async () => {
//     const normalizedEmail = email.trim().toLowerCase();

//     if (!normalizedEmail) {
//       setError("Email is required.");
//       return;
//     }

//     if (!EMAIL_REGEX.test(normalizedEmail)) {
//       setError("Please enter a valid email address.");
//       return;
//     }

//     setError("");
//     setIsSubmitting(true);

//     try {
//       await sendLoginOtp(normalizedEmail);
//       router.push({
//         pathname: "/verify-otp",
//         params: {
//           email: normalizedEmail,
//           purpose: "LOGIN",
//           rolePreference: selectedRole,
//           professionalType: selectedRole === "PROFESSIONAL" ? selectedProfessionalType : "USER",
//         },
//       });
//     } catch (apiError) {
//       const normalized = normalizeApiError(apiError);
//       setError(normalized.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <KeyboardAvoidingView
//         style={styles.container}
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//       >
//         <ScrollView
//           contentContainerStyle={styles.content}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//         >
//           <View style={styles.logoContainer}>
//             <View style={styles.logo}>
//               <Ionicons name="medical" size={34} color="#FFFFFF" />
//             </View>

//             <Text style={styles.brand}>CareNow</Text>
//             <Text style={styles.tagline}>Healthcare at your doorstep</Text>
//           </View>

//           <View style={styles.card}>
//             <Text style={styles.title}>Welcome back</Text>
//             <Text style={styles.subtitle}>Login to access CareNow services</Text>

//             <Text style={styles.label}>Email address</Text>
//             <TextInput
//               value={email}
//               onChangeText={(value) => {
//                 setEmail(value);
//                 if (error) setError("");
//               }}
//               placeholder="Enter your email"
//               placeholderTextColor="#94A3B8"
//               keyboardType="email-address"
//               autoCapitalize="none"
//               autoCorrect={false}
//               style={styles.input}
//             />

//             <View style={styles.roleSection}>
//               <Text style={styles.roleTitle}>Select the role you want to log in as</Text>

//               <View style={styles.roleOptions}>
//                 <TouchableOpacity
//                   style={[styles.roleOption, selectedRole === "USER" && styles.roleOptionSelected]}
//                   activeOpacity={0.8}
//                   onPress={() => setSelectedRole("USER")}
//                 >
//                   <View style={[styles.radio, selectedRole === "USER" && styles.radioSelected]}>
//                     {selectedRole === "USER" && <View style={styles.radioDot} />}
//                   </View>
//                   <Text style={styles.roleOptionText}>User</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={[styles.roleOption, selectedRole === "PROFESSIONAL" && styles.roleOptionSelected]}
//                   activeOpacity={0.8}
//                   onPress={() => setSelectedRole("PROFESSIONAL")}
//                 >
//                   <View style={[styles.radio, selectedRole === "PROFESSIONAL" && styles.radioSelected]}>
//                     {selectedRole === "PROFESSIONAL" && <View style={styles.radioDot} />}
//                   </View>
//                   <Text style={styles.roleOptionText}>Professional</Text>
//                 </TouchableOpacity>
//               </View>

//               {selectedRole === "PROFESSIONAL" && (
//                 <View style={styles.professionalTypesWrap}>
//                   {professionalTypes.map((option) => {
//                     const isSelected = selectedProfessionalType === option.value;

//                     return (
//                       <TouchableOpacity
//                         key={option.value}
//                         style={[styles.professionalTypeButton, isSelected && styles.professionalTypeButtonSelected]}
//                         activeOpacity={0.8}
//                         onPress={() => setSelectedProfessionalType(option.value)}
//                       >
//                         <View style={[styles.radio, isSelected && styles.radioSelected]}>
//                           {isSelected && <View style={styles.radioDot} />}
//                         </View>
//                         <Text style={styles.professionalTypeText}>{option.label}</Text>
//                       </TouchableOpacity>
//                     );
//                   })}
//                 </View>
//               )}
//             </View>

//             {error ? <Text style={styles.errorText}>{error}</Text> : null}

//             <TouchableOpacity
//               style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
//               activeOpacity={0.85}
//               onPress={handleContinue}
//               disabled={isSubmitting}
//             >
//               {isSubmitting ? (
//                 <ActivityIndicator size="small" color="#FFFFFF" />
//               ) : (
//                 <>
//                   <Text style={styles.primaryButtonText}>Continue</Text>
//                   <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
//                 </>
//               )}
//             </TouchableOpacity>

//             <View style={styles.dividerContainer}>
//               <View style={styles.divider} />
//               <Text style={styles.dividerText}>New to CareNow?</Text>
//               <View style={styles.divider} />
//             </View>

//             <TouchableOpacity
//               style={styles.secondaryButton}
//               activeOpacity={0.85}
//               onPress={() => router.push("/register-user")}
//             >
//               <Text style={styles.secondaryButtonText}>Register as User</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.professionalButton}
//               activeOpacity={0.85}
//               onPress={() => router.push("/register-professional")}
//             >
//               <Ionicons name="briefcase-outline" size={19} color="#2563EB" />
//               <Text style={styles.professionalButtonText}>Register as Healthcare Professional</Text>
//             </TouchableOpacity>
//           </View>

//           <Text style={styles.footer}>
//             By continuing, you agree to CareNow&apos;s Terms of Service and Privacy Policy.
//           </Text>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: "#F8FAFC",
//   },
//   container: {
//     flex: 1,
//   },
//   content: {
//     flexGrow: 1,
//     paddingHorizontal: 20,
//     paddingTop: 45,
//     paddingBottom: 25,
//     justifyContent: "center",
//   },
//   logoContainer: {
//     alignItems: "center",
//     marginBottom: 30,
//   },
//   logo: {
//     width: 72,
//     height: 72,
//     borderRadius: 22,
//     backgroundColor: "#2563EB",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   brand: {
//     fontSize: 28,
//     fontWeight: "900",
//     color: "#0F172A",
//     marginTop: 13,
//   },
//   tagline: {
//     fontSize: 12,
//     color: "#64748B",
//     marginTop: 4,
//   },
//   card: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 18,
//     padding: 20,
//     borderWidth: 1,
//     borderColor: "#E2E8F0",
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "800",
//     color: "#0F172A",
//   },
//   subtitle: {
//     fontSize: 13,
//     color: "#64748B",
//     marginTop: 5,
//     marginBottom: 25,
//   },
//   label: {
//     fontSize: 12,
//     fontWeight: "700",
//     color: "#334155",
//     marginBottom: 7,
//   },
//   input: {
//     height: 52,
//     borderWidth: 1,
//     borderColor: "#CBD5E1",
//     borderRadius: 11,
//     backgroundColor: "#FFFFFF",
//     paddingHorizontal: 13,
//     fontSize: 14,
//     color: "#0F172A",
//     marginBottom: 12,
//   },
//   roleSection: {
//     marginTop: 4,
//     marginBottom: 16,
//   },
//   roleTitle: {
//     fontSize: 12,
//     fontWeight: "700",
//     color: "#334155",
//     marginBottom: 10,
//   },
//   roleOptions: {
//     gap: 8,
//   },
//   roleOption: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     borderWidth: 1,
//     borderColor: "#E2E8F0",
//     borderRadius: 11,
//     backgroundColor: "#FFFFFF",
//   },
//   roleOptionSelected: {
//     borderColor: "#2563EB",
//     backgroundColor: "#F8FBFF",
//   },
//   roleOptionText: {
//     marginLeft: 10,
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#0F172A",
//   },
//   radio: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     borderWidth: 2,
//     borderColor: "#CBD5E1",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   radioSelected: {
//     borderColor: "#2563EB",
//   },
//   radioDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: "#2563EB",
//   },
//   professionalTypesWrap: {
//     marginTop: 10,
//     gap: 8,
//   },
//   professionalTypeButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     borderWidth: 1,
//     borderColor: "#E2E8F0",
//     borderRadius: 11,
//     backgroundColor: "#F8FAFC",
//   },
//   professionalTypeButtonSelected: {
//     borderColor: "#2563EB",
//     backgroundColor: "#EFF6FF",
//   },
//   professionalTypeText: {
//     marginLeft: 10,
//     fontSize: 13,
//     fontWeight: "600",
//     color: "#1E293B",
//   },
//   errorText: {
//     color: "#B91C1C",
//     fontSize: 12,
//     marginBottom: 12,
//   },
//   primaryButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#2563EB",
//     borderRadius: 12,
//     paddingVertical: 14,
//     gap: 8,
//   },
//   disabledButton: {
//     opacity: 0.7,
//   },
//   primaryButtonText: {
//     color: "#FFFFFF",
//     fontSize: 15,
//     fontWeight: "700",
//   },
//   dividerContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 24,
//     marginBottom: 18,
//   },
//   divider: {
//     flex: 1,
//     height: 1,
//     backgroundColor: "#E2E8F0",
//   },
//   dividerText: {
//     marginHorizontal: 12,
//     fontSize: 11,
//     color: "#64748B",
//     fontWeight: "700",
//   },
//   secondaryButton: {
//     borderWidth: 1,
//     borderColor: "#E2E8F0",
//     backgroundColor: "#FFFFFF",
//     borderRadius: 12,
//     height: 48,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   secondaryButtonText: {
//     color: "#0F172A",
//     fontSize: 14,
//     fontWeight: "700",
//   },
//   professionalButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//     borderRadius: 12,
//     marginTop: 12,
//     height: 48,
//     backgroundColor: "#EFF6FF",
//   },
//   professionalButtonText: {
//     color: "#2563EB",
//     fontSize: 14,
//     fontWeight: "700",
//   },
//   footer: {
//     marginTop: 18,
//     textAlign: "center",
//     fontSize: 11,
//     color: "#64748B",
//     lineHeight: 18,
//     paddingHorizontal: 14,
//   },
// });

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
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

import { sendLoginOtp } from "@/api/authApi";
import { normalizeApiError } from "@/api/client";

export default function LoginScreen() {
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    const normalizedMobile = mobile.replace(/\D/g, "");

    if (!normalizedMobile) {
      setError("Mobile number is required.");
      return;
    }

    if (normalizedMobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await sendLoginOtp(normalizedMobile);

      router.push({
        pathname: "/verify-otp",
        params: {
          identifier: normalizedMobile,
          purpose: "LOGIN",
        },
      });
    } catch (apiError) {
      const normalized = normalizeApiError(apiError);
      setError(normalized.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <Image
              source={require("@/assets/images/carenow-login-hero.png")}
              style={styles.heroImage}
              resizeMode="cover"
              accessibilityLabel="CareNow healthcare illustration"
            />
          </View>

          <View style={styles.loginSection}>
            {/* <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Login to continue with CareNow</Text> */}

            <Text style={styles.label}>Mobile number</Text>
            <View style={[styles.inputShell, error ? styles.inputShellError : null]}>
              <View style={styles.countryCode}>
                <Text style={styles.flag}>🇮🇳</Text>
                <Text style={styles.countryCodeText}>+91</Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </View>
              <View style={styles.inputDivider} />
              <TextInput
                value={mobile}
                onChangeText={(value) => {
                  setMobile(value.replace(/\D/g, ""));
                  if (error) setError("");
                }}
                placeholder="Enter phone number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
              activeOpacity={0.85}
              onPress={handleContinue}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>New to CareNow?</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              onPress={() => router.push("/register-user")}
            >
              <Text style={styles.secondaryButtonText}>Register as User</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.professionalButton}
              activeOpacity={0.85}
              onPress={() => router.push("/register-professional")}
            >
              <Ionicons name="briefcase-outline" size={21} color="#0A9FB5" />
              <Text style={styles.professionalButtonText}>
                Register as Healthcare Professional
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            By continuing, you agree to CareNow&apos;s Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 22,
  },
  heroSection: {
    width: "100%",
    aspectRatio: 852 / 612,
    marginHorizontal: -20,
    alignSelf: "center",
    overflow: "hidden",
    backgroundColor: "#E9FAFC",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  loginSection: {
    width: "100%",
    marginTop: -1,
    paddingTop: 30,
    paddingBottom: 2,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  title: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "800",
    color: "#101828",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 5,
    marginBottom: 27,
    fontSize: 15,
    lineHeight: 21,
    color: "#667085",
  },
  label: {
    marginBottom: 9,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#344054",
  },
  inputShell: {
    minHeight: 58,
    borderWidth: 1.5,
    borderColor: "#D0D5DD",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  inputShellError: { borderColor: "#E55353" },
  countryCode: { flexDirection: "row", alignItems: "center", gap: 7 },
  flag: { fontSize: 19 },
  countryCodeText: { fontSize: 16, fontWeight: "600", color: "#344054" },
  inputDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E4E7EC",
    marginHorizontal: 13,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 56,
    paddingHorizontal: 0,
    fontSize: 17,
    color: "#101828",
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: "#B42318",
  },
  primaryButton: {
    minHeight: 56,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "#0A9FB5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    shadowColor: "#0A9FB5",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  disabledButton: { opacity: 0.65 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 29,
    marginBottom: 17,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#E4E7EC" },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    fontWeight: "700",
    color: "#667085",
  },
  secondaryButton: {
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: "#D0D5DD",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { color: "#101828", fontSize: 16, fontWeight: "700" },
  professionalButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    backgroundColor: "#EAF9FC",
  },
  professionalButtonText: {
    color: "#087F91",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    marginTop: 22,
    textAlign: "center",
    fontSize: 11.5,
    lineHeight: 18,
    color: "#667085",
    paddingHorizontal: 12,
  },
});
