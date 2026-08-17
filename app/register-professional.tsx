import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const professionalTypes = [
  {
    id: "nurse",
    title: "Nurse",
    icon: "medkit-outline" as const,
  },
  {
    id: "compounder",
    title: "Compounder / Healthcare Worker",
    icon: "fitness-outline" as const,
  },
  {
    id: "pharmacist",
    title: "Pharmacist",
    icon: "medical-outline" as const,
  },
];

export default function RegisterProfessionalScreen() {
  const [selectedType, setSelectedType] =
    useState("nurse");

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [qualification, setQualification] =
    useState("");
  const [registrationNumber, setRegistrationNumber] =
    useState("");
  const [serviceArea, setServiceArea] =
    useState("");

  const handleContinue = () => {
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

    if (!serviceArea.trim()) {
      Alert.alert(
        "Service area required",
        "Please enter the area where you provide services."
      );
      return;
    }

    router.push({
      pathname: "/verify-otp",
      params: {
        mobile: cleanedMobile,
        mode: "professional-registration",
        name,
        professionalType: selectedType,
      },
    });
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
            Professional Registration
          </Text>

          <View style={styles.spacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name="briefcase-outline"
              size={32}
              color="#2563EB"
            />
          </View>

          <Text style={styles.title}>
            Join RuralCare
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
                      color="#2563EB"
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

          <View style={styles.verificationCard}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#2563EB"
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
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },

  spacer: {
    width: 40,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 22,
  },

  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginTop: 16,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
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
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  selectedTypeCard: {
    borderColor: "#2563EB",
    backgroundColor: "#F8FBFF",
  },

  typeIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  selectedTypeIcon: {
    backgroundColor: "#DBEAFE",
  },

  typeTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginLeft: 11,
  },

  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: "#2563EB",
  },

  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#2563EB",
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 7,
  },

  input: {
    height: 51,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    fontSize: 13,
    color: "#0F172A",
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
    borderColor: "#CBD5E1",
    borderRadius: 11,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    marginBottom: 2,
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

  verificationCard: {
    backgroundColor: "#EFF6FF",
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
    color: "#1E40AF",
  },

  verificationText: {
    fontSize: 11,
    lineHeight: 17,
    color: "#1E40AF",
    marginTop: 3,
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
});