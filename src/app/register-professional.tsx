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
import { registerProfessional } from "@/api/authApi";
import { normalizeApiError } from "@/api/client";
import { AuthStorage } from "@/services/auth-storage";
import type { ProfessionalType } from "@/types/auth";

const professionalTypes = [
  {
    id: "NURSE" as ProfessionalType,
    title: "Nurse",
    icon: "medkit-outline" as const,
  },
  {
    id: "COMPOUNDER" as ProfessionalType,
    title: "Compounder / Healthcare Worker",
    icon: "fitness-outline" as const,
  },
  {
    id: "PHARMACIST" as ProfessionalType,
    title: "Pharmacist",
    icon: "medical-outline" as const,
  },
];

export default function RegisterProfessionalScreen() {
  const [selectedType, setSelectedType] =
    useState<ProfessionalType>("NURSE");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [qualification, setQualification] =
    useState("");
  const [registrationNumber, setRegistrationNumber] =
    useState("");
  const [serviceArea, setServiceArea] =
    useState("");
  const [age, setAge] = useState("");
  const [experienceYears, setExperienceYears] = useState("");

  const handleContinue = async () => {
    const cleanedMobile = mobile.replace(/\D/g, "");

    if (!name.trim()) {
      Alert.alert(
        "Name required",
        "Please enter your full name."
      );
      return;
    }

    if (cleanedMobile.length !== 10) {
      Alert.alert(
        "Invalid mobile number",
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Valid email required", "Please enter a valid email address.");
      return;
    }

    if (!qualification.trim()) {
      Alert.alert(
        "Qualification required",
        "Please enter your qualification."
      );
      return;
    }

    if (!registrationNumber.trim()) {
      Alert.alert(
        "Registration details required",
        "Please enter your professional registration/license number."
      );
      return;
    }

    const parsedAge = age.trim() ? Number(age) : null;
    const parsedExperience = experienceYears.trim() ? Number(experienceYears) : null;
    if (parsedAge !== null && (!Number.isInteger(parsedAge) || parsedAge < 18 || parsedAge > 100)) {
      Alert.alert("Invalid age", "Please enter an age between 18 and 100.");
      return;
    }
    if (parsedExperience !== null && (!Number.isInteger(parsedExperience) || parsedExperience < 0 || parsedExperience > 60)) {
      Alert.alert("Invalid experience", "Please enter experience between 0 and 60 years.");
      return;
    }

    if (!serviceArea.trim()) {
      Alert.alert(
        "Service area required",
        "Please enter the area where you provide services."
      );
      return;
    }

    try {
      await registerProfessional({
        professionalType: selectedType,
        fullName: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: cleanedMobile,
        qualification: qualification.trim(),
        registrationNumber: registrationNumber.trim(),
        serviceArea: serviceArea.trim(),
        age: parsedAge,
        experienceYears: parsedExperience,
      });
      await AuthStorage.savePendingRegistration({ kind: "PROFESSIONAL", mobile: cleanedMobile });
      router.push({
        pathname: "/verify-otp",
        params: { identifier: cleanedMobile, purpose: "PROFESSIONAL_REGISTRATION", professionalType: selectedType },
      });
    } catch (error) {
      Alert.alert("Registration failed", normalizeApiError(error).message);
    }
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
              color="#101828"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Professional Registration
          </Text>

          <View style={styles.spacer} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
          <View style={styles.iconContainer}>
            <Ionicons
              name="briefcase-outline"
              size={32}
              color="#0A9FB5"
            />
          </View>

          <Text style={styles.title}>
            Join CareNow
          </Text>

          <Text style={styles.subtitle}>
            Register as a healthcare professional and
            provide services in your area.
          </Text>

          <Text style={styles.sectionTitle}>
            Professional type
          </Text>

          <View style={styles.typeList}>
            {professionalTypes.map((type) => {
              const selected =
                selectedType === type.id;

              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    selected && styles.selectedTypeCard,
                  ]}
                  activeOpacity={0.8}
                  onPress={() =>
                    setSelectedType(type.id)
                  }
                >
                  <View
                    style={[
                      styles.typeIcon,
                      selected && styles.selectedTypeIcon,
                    ]}
                  >
                    <Ionicons
                      name={type.icon}
                      size={22}
                      color="#0A9FB5"
                    />
                  </View>

                  <Text style={styles.typeTitle}>
                    {type.title}
                  </Text>

                  <View
                    style={[
                      styles.radio,
                      selected && styles.radioSelected,
                    ]}
                  >
                    {selected && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>
            Personal details
          </Text>

          <Text style={styles.label}>
            Full name
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          <Text style={styles.label}>
            Mobile number
          </Text>

          <View style={styles.phoneContainer}>
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

          <Text style={styles.label}>Email address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email address"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={styles.sectionTitle}>
            Professional details
          </Text>

          <Text style={styles.label}>
            Qualification
          </Text>

          <TextInput
            value={qualification}
            onChangeText={setQualification}
            placeholder="Example: GNM, B.Sc Nursing, D.Pharm"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          <Text style={styles.label}>
            Registration / License number
          </Text>

          <TextInput
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            placeholder="Enter registration/license number"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>
            Service area
          </Text>

          <TextInput
            value={serviceArea}
            onChangeText={setServiceArea}
            placeholder="Village, town or service area"
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.multilineInput]}
            multiline
          />

          <View style={styles.inlineFields}>
            <View style={styles.inlineField}>
              <Text style={styles.fieldLabel}>Age</Text>
              <TextInput value={age} onChangeText={setAge} placeholder="e.g. 32" placeholderTextColor="#98A2B3" keyboardType="number-pad" style={styles.input} maxLength={3} />
            </View>
            <View style={styles.inlineField}>
              <Text style={styles.fieldLabel}>Experience (years)</Text>
              <TextInput value={experienceYears} onChangeText={setExperienceYears} placeholder="e.g. 8" placeholderTextColor="#98A2B3" keyboardType="number-pad" style={styles.input} maxLength={2} />
            </View>
          </View>

          <View style={styles.verificationCard}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#0A9FB5"
            />

            <View style={styles.verificationContent}>
              <Text style={styles.verificationTitle}>
                Verification required
              </Text>

              <Text style={styles.verificationText}>
                Your professional credentials will need to
                be verified before you can receive service
                requests.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>
              Continue
            </Text>

            <Ionicons
              name="arrow-forward"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6FAFB",
  },

  container: {
    flex: 1,
  },

  keyboardAvoidingView: {
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
    fontSize: 16,
    fontWeight: "800",
    color: "#101828",
  },

  spacer: {
    width: 40,
  },

  content: {
    padding: 20,
    paddingBottom: 180,
  },

  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EAF9FC",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 22,
  },

  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#101828",
    textAlign: "center",
    marginTop: 16,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#667085",
    textAlign: "center",
    marginTop: 6,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#101828",
    marginTop: 25,
    marginBottom: 11,
  },

  typeList: {
    gap: 9,
  },

  typeCard: {
    minHeight: 66,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0F2F5",
    borderRadius: 12,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  selectedTypeCard: {
    borderColor: "#0A9FB5",
    backgroundColor: "#F6FCFD",
  },

  typeIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#EAF9FC",
    alignItems: "center",
    justifyContent: "center",
  },

  selectedTypeIcon: {
    backgroundColor: "#D5F1F4",
  },

  typeTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#344054",
    marginLeft: 11,
  },

  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D0D5DD",
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: "#0A9FB5",
  },

  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#0A9FB5",
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
    fontSize: 13,
    color: "#101828",
    marginBottom: 15,
  },

  multilineInput: {
    minHeight: 70,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  phoneContainer: {
    height: 51,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 11,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    marginBottom: 2,
  },

  countryCode: {
    width: 62,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6FAFB",
    borderRightWidth: 1,
    borderRightColor: "#F0F2F5",
  },

  countryCodeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#344054",
  },

  phoneInput: {
    flex: 1,
    paddingHorizontal: 13,
    fontSize: 14,
    color: "#101828",
  },

  verificationCard: {
    backgroundColor: "#EAF9FC",
    borderRadius: 13,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 7,
  },

  verificationContent: {
    flex: 1,
    marginLeft: 9,
  },

  verificationTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#087F91",
  },

  verificationText: {
    fontSize: 11,
    lineHeight: 17,
    color: "#087F91",
    marginTop: 3,
  },

  button: {
    height: 52,
    borderRadius: 11,
    backgroundColor: "#0A9FB5",
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0A9FB5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginRight: 8,
  },
  inlineFields: { flexDirection: "row", gap: 10, marginTop: 14 },
  inlineField: { flex: 1 },
});
