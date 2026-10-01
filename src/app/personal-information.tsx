import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ProfilePicturePicker from "@/components/ProfilePicturePicker";
import { useAuth } from "@/context/auth-context";

type Gender = "Male" | "Female" | "Other" | "Prefer not to say" | "";

export default function PersonalInformationScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [mobile, setMobile] = useState(
    (user as any)?.mobile || (user as any)?.phone || "",
  );

  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
    (user as any)?.dateOfBirth ? new Date((user as any).dateOfBirth) : null,
  );

  const [gender, setGender] = useState<Gender>(
    ((user as any)?.gender as Gender) || "",
  );

  const [emergencyName, setEmergencyName] = useState(
    (user as any)?.emergencyContact?.name || "",
  );

  const [emergencyRelationship, setEmergencyRelationship] = useState(
    (user as any)?.emergencyContact?.relationship || "",
  );

  const [emergencyMobile, setEmergencyMobile] = useState(
    (user as any)?.emergencyContact?.mobile || "",
  );

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const formattedDateOfBirth = useMemo(() => {
    if (!dateOfBirth) {
      return "Add your date of birth";
    }

    return dateOfBirth.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [dateOfBirth]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (event?.type === "dismissed") {
      return;
    }

    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert("Required", "Please enter your full name.");
      return false;
    }

    if (!mobile.trim()) {
      Alert.alert("Required", "Please enter your mobile number.");
      return false;
    }

    if (mobile.replace(/\D/g, "").length < 10) {
      Alert.alert(
        "Invalid mobile number",
        "Please enter a valid mobile number.",
      );
      return false;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email.trim())) {
        Alert.alert("Invalid email", "Please enter a valid email address.");
        return false;
      }
    }

    if (
      emergencyMobile.trim() &&
      emergencyMobile.replace(/\D/g, "").length < 10
    ) {
      Alert.alert(
        "Invalid emergency number",
        "Please enter a valid emergency contact number.",
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      /*
       * TODO:
       * Replace this section with your actual profile update API.
       *
       * Example payload:
       *
       * {
       *   name: fullName.trim(),
       *   email: email.trim(),
       *   mobile: mobile.trim(),
       *   dateOfBirth: dateOfBirth?.toISOString(),
       *   gender,
       *   emergencyContact: {
       *     name: emergencyName.trim(),
       *     relationship: emergencyRelationship.trim(),
       *     mobile: emergencyMobile.trim(),
       *   }
       * }
       */

      await new Promise((resolve) => setTimeout(resolve, 700));

      Alert.alert(
        "Profile Updated",
        "Your personal information has been updated successfully.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Unable to save",
        "Something went wrong while updating your profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const renderFieldIcon = (name: keyof typeof Ionicons.glyphMap) => {
    return (
      <View style={styles.fieldIcon}>
        <Ionicons name={name} size={19} color="#2563EB" />
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Personal Information</Text>

            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Profile */}
            <View style={styles.profileSection}>
              <ProfilePicturePicker owner="USER" user={user} size={104} />

              <Text style={styles.profileName}>
                {fullName || "Your Profile"}
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  // ProfilePicturePicker handles the photo action.
                }}
              >
                <Text style={styles.changePhotoText}>Change profile photo</Text>
              </TouchableOpacity>
            </View>

            {/* Personal Details */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Personal Details</Text>

              <Text style={styles.sectionSubtitle}>
                Keep your information up to date
              </Text>
            </View>

            <View style={styles.card}>
              {/* Full Name */}
              <View style={styles.fieldContainer}>
                {renderFieldIcon("person-outline")}

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Full Name</Text>

                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.separator} />

              {/* Mobile */}
              <View style={styles.fieldContainer}>
                {renderFieldIcon("call-outline")}

                <View style={styles.fieldContent}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>Mobile Number</Text>

                    {mobile ? (
                      <View style={styles.verifiedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={13}
                          color="#16A34A"
                        />

                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    ) : null}
                  </View>

                  <TextInput
                    value={mobile}
                    onChangeText={setMobile}
                    placeholder="Enter mobile number"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                </View>
              </View>

              <View style={styles.separator} />

              {/* Email */}
              <View style={styles.fieldContainer}>
                {renderFieldIcon("mail-outline")}

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Email Address</Text>

                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email address"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.separator} />

              {/* Date of Birth */}
              <TouchableOpacity
                style={styles.fieldContainer}
                activeOpacity={0.7}
                onPress={() => setShowDatePicker(true)}
              >
                {renderFieldIcon("calendar-outline")}

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Date of Birth</Text>

                  <Text
                    style={[
                      styles.selectValue,
                      !dateOfBirth && styles.placeholderValue,
                    ]}
                  >
                    {formattedDateOfBirth}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.separator} />

              {/* Gender */}
              <TouchableOpacity
                style={styles.fieldContainer}
                activeOpacity={0.7}
                onPress={() => setShowGenderModal(true)}
              >
                {renderFieldIcon("person-circle-outline")}

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Gender</Text>

                  <Text
                    style={[
                      styles.selectValue,
                      !gender && styles.placeholderValue,
                    ]}
                  >
                    {gender || "Select gender"}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Emergency Contact */}
            <View style={[styles.sectionHeader, styles.emergencyHeader]}>
              <Text style={styles.sectionTitle}>Emergency Contact</Text>

              <Text style={styles.sectionSubtitle}>
                Someone we can contact in an emergency
              </Text>
            </View>

            <View style={styles.card}>
              {/* Emergency Name */}
              <View style={styles.fieldContainer}>
                {renderFieldIcon("person-add-outline")}

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Contact Name</Text>

                  <TextInput
                    value={emergencyName}
                    onChangeText={setEmergencyName}
                    placeholder="Enter contact name"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.separator} />

              {/* Relationship */}
              <View style={styles.fieldContainer}>
                {renderFieldIcon("people-outline")}

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Relationship</Text>

                  <TextInput
                    value={emergencyRelationship}
                    onChangeText={setEmergencyRelationship}
                    placeholder="e.g. Father, Mother, Spouse"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.separator} />

              {/* Emergency Mobile */}
              <View style={styles.fieldContainer}>
                {renderFieldIcon("call-outline")}

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Mobile Number</Text>

                  <TextInput
                    value={emergencyMobile}
                    onChangeText={setEmergencyMobile}
                    placeholder="Enter emergency number"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                </View>
              </View>
            </View>

            {/* Privacy note */}
            <View style={styles.infoBox}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#2563EB"
              />

              <Text style={styles.infoText}>
                Your personal information is kept secure and is only used to
                provide and improve your CareNow services.
              </Text>
            </View>

            {/* Save */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.bottomSpacing} />
          </ScrollView>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth || new Date(1995, 0, 1)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
          )}

          {/* Gender Modal */}
          <Modal
            visible={showGenderModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowGenderModal(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setShowGenderModal(false)}
            >
              <Pressable
                style={styles.genderSheet}
                onPress={(event) => event.stopPropagation()}
              >
                <View style={styles.sheetHandle} />

                <Text style={styles.sheetTitle}>Select Gender</Text>

                <Text style={styles.sheetSubtitle}>
                  Choose the option that best describes you
                </Text>

                {["Male", "Female", "Other", "Prefer not to say"].map(
                  (option) => {
                    const selected = gender === option;

                    return (
                      <TouchableOpacity
                        key={option}
                        style={styles.genderOption}
                        activeOpacity={0.7}
                        onPress={() => {
                          setGender(option as Gender);
                          setShowGenderModal(false);
                        }}
                      >
                        <View
                          style={[
                            styles.radio,
                            selected && styles.radioSelected,
                          ]}
                        >
                          {selected && <View style={styles.radioDot} />}
                        </View>

                        <Text
                          style={[
                            styles.genderText,
                            selected && styles.genderTextSelected,
                          ]}
                        >
                          {option}
                        </Text>

                        {selected && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#2563EB"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  },
                )}

                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.8}
                  onPress={() => setShowGenderModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  /* Header */

  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginRight: 40,
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },

  headerSpacer: {
    width: 0,
  },

  /* Content */

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 140,
  },

  /* Profile */

  profileSection: {
    alignItems: "center",
    marginBottom: 28,
  },

  profileName: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },

  changePhotoText: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
  },

  /* Sections */

  sectionHeader: {
    marginBottom: 10,
  },

  emergencyHeader: {
    marginTop: 28,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
  },

  /* Card */

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },

  fieldContainer: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  fieldContent: {
    flex: 1,
    marginLeft: 12,
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 3,
  },

  input: {
    padding: 0,
    margin: 0,
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    minHeight: 24,
  },

  selectValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },

  placeholderValue: {
    color: "#94A3B8",
    fontWeight: "500",
  },

  separator: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginLeft: 66,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 8,
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  verifiedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#16A34A",
  },

  /* Info */

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 20,
    padding: 14,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 11,
    lineHeight: 17,
    color: "#475569",
  },

  /* Save */

  saveButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    borderRadius: 13,
    backgroundColor: "#2563EB",
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  bottomSpacing: {
    height: 30,
  },

  /* Gender modal */

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },

  genderSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },

  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    marginBottom: 20,
  },

  sheetTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
  },

  sheetSubtitle: {
    marginTop: 4,
    marginBottom: 18,
    fontSize: 12,
    color: "#64748B",
  },

  genderOption: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  radio: {
    width: 22,
    height: 22,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563EB",
  },

  genderText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },

  genderTextSelected: {
    color: "#2563EB",
    fontWeight: "700",
  },

  cancelButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
});
