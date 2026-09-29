import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
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

type OwnerType = "SELF" | "DEPENDENT" | "FRIEND";

type AddressLabel = "HOME" | "WORK" | "OTHER";

export default function AddAddressScreen() {
  const router = useRouter();

  const [ownerType, setOwnerType] = useState<OwnerType>("SELF");
  const [showOwnerModal, setShowOwnerModal] = useState(false);

  const [ownerName, setOwnerName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [mobile, setMobile] = useState("");

  const [addressLabel, setAddressLabel] = useState<AddressLabel>("HOME");

  const [showLabelModal, setShowLabelModal] = useState(false);

  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const getOwnerLabel = () => {
    switch (ownerType) {
      case "DEPENDENT":
        return "Dependent";

      case "FRIEND":
        return "Friend";

      default:
        return "Myself";
    }
  };

  const getOwnerIcon = () => {
    switch (ownerType) {
      case "DEPENDENT":
        return "people-outline";

      case "FRIEND":
        return "person-add-outline";

      default:
        return "person-outline";
    }
  };

  const getLabelText = () => {
    switch (addressLabel) {
      case "WORK":
        return "Work";

      case "OTHER":
        return "Other";

      default:
        return "Home";
    }
  };

  const validateForm = () => {
    if (ownerType !== "SELF" && !ownerName.trim()) {
      Alert.alert(
        "Required",
        `Please enter the ${ownerType === "DEPENDENT" ? "dependent" : "friend"} name.`,
      );
      return false;
    }

    if (ownerType !== "SELF" && !relationship.trim()) {
      Alert.alert("Required", "Please enter the relationship.");
      return false;
    }

    if (mobile.trim() && mobile.replace(/\D/g, "").length < 10) {
      Alert.alert(
        "Invalid mobile number",
        "Please enter a valid mobile number.",
      );
      return false;
    }

    if (!addressLine1.trim()) {
      Alert.alert("Required", "Please enter the address.");
      return false;
    }

    if (!city.trim()) {
      Alert.alert("Required", "Please enter the city.");
      return false;
    }

    if (!state.trim()) {
      Alert.alert("Required", "Please enter the state.");
      return false;
    }

    if (!pincode.trim()) {
      Alert.alert("Required", "Please enter the PIN code.");
      return false;
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      Alert.alert("Invalid PIN code", "Please enter a valid 6-digit PIN code.");
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
       * Replace this with your actual API.
       *
       * Example payload:
       *
       * {
       *   ownerType,
       *   ownerName,
       *   relationship,
       *   mobile,
       *   label: addressLabel,
       *   addressLine1,
       *   addressLine2,
       *   landmark,
       *   city,
       *   state,
       *   pincode,
       *   isDefault
       * }
       */

      await new Promise((resolve) => setTimeout(resolve, 700));

      Alert.alert("Address Saved", "The address has been saved successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Unable to save",
        "Something went wrong while saving the address. Please try again.",
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
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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

            <Text style={styles.headerTitle}>Add New Address</Text>

            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Intro */}

            <View style={styles.introSection}>
              <View style={styles.introIcon}>
                <Ionicons name="location-outline" size={25} color="#2563EB" />
              </View>

              <Text style={styles.introTitle}>Save a service location</Text>

              <Text style={styles.introSubtitle}>
                Add an address for yourself, a dependent or a friend so you can
                quickly select it when booking a service.
              </Text>
            </View>

            {/* Who is this address for? */}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Address For</Text>

              <Text style={styles.sectionSubtitle}>
                Tell us who this address belongs to
              </Text>
            </View>

            <TouchableOpacity
              style={styles.selectorCard}
              activeOpacity={0.7}
              onPress={() => setShowOwnerModal(true)}
            >
              <View style={styles.fieldIcon}>
                <Ionicons name={getOwnerIcon()} size={19} color="#2563EB" />
              </View>

              <View style={styles.selectorContent}>
                <Text style={styles.fieldLabel}>Address belongs to</Text>

                <Text style={styles.selectorValue}>{getOwnerLabel()}</Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Person Details */}

            {ownerType !== "SELF" && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Person Details</Text>

                  <Text style={styles.sectionSubtitle}>
                    Details of the person using this address
                  </Text>
                </View>

                <View style={styles.card}>
                  {/* Name */}

                  <View style={styles.fieldContainer}>
                    {renderFieldIcon("person-outline")}

                    <View style={styles.fieldContent}>
                      <Text style={styles.fieldLabel}>Full Name *</Text>

                      <TextInput
                        value={ownerName}
                        onChangeText={setOwnerName}
                        placeholder={
                          ownerType === "DEPENDENT"
                            ? "Enter dependent's name"
                            : "Enter friend's name"
                        }
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
                      <Text style={styles.fieldLabel}>Relationship *</Text>

                      <TextInput
                        value={relationship}
                        onChangeText={setRelationship}
                        placeholder={
                          ownerType === "DEPENDENT"
                            ? "e.g. Daughter, Son"
                            : "e.g. Friend"
                        }
                        placeholderTextColor="#94A3B8"
                        style={styles.input}
                      />
                    </View>
                  </View>

                  <View style={styles.separator} />

                  {/* Mobile */}

                  <View style={styles.fieldContainer}>
                    {renderFieldIcon("call-outline")}

                    <View style={styles.fieldContent}>
                      <Text style={styles.fieldLabel}>Mobile Number</Text>

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
                </View>
              </>
            )}

            {/* Address Details */}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Address Details</Text>

              <Text style={styles.sectionSubtitle}>
                Enter the complete service location
              </Text>
            </View>

            <View style={styles.card}>
              {/* Address Label */}

              <TouchableOpacity
                style={styles.fieldContainer}
                activeOpacity={0.7}
                onPress={() => setShowLabelModal(true)}
              >
                {renderFieldIcon("bookmark-outline")}

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Address Type</Text>

                  <Text style={styles.selectValue}>{getLabelText()}</Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.separator} />

              {/* Address Line 1 */}

              <View style={styles.fieldContainer}>
                {renderFieldIcon("location-outline")}

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Address Line 1 *</Text>

                  <TextInput
                    value={addressLine1}
                    onChangeText={setAddressLine1}
                    placeholder="House / Flat / Building"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    multiline
                  />
                </View>
              </View>

              <View style={styles.separator} />

              {/* Address Line 2 */}

              <View style={styles.fieldContainer}>
                {renderFieldIcon("business-outline")}

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Address Line 2</Text>

                  <TextInput
                    value={addressLine2}
                    onChangeText={setAddressLine2}
                    placeholder="Street / Area / Locality"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    multiline
                  />
                </View>
              </View>

              <View style={styles.separator} />

              {/* Landmark */}

              <View style={styles.fieldContainer}>
                {renderFieldIcon("navigate-outline")}

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Landmark</Text>

                  <TextInput
                    value={landmark}
                    onChangeText={setLandmark}
                    placeholder="Nearby landmark"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.separator} />

              {/* City */}

              <View style={styles.fieldContainer}>
                {renderFieldIcon("map-outline")}

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>City *</Text>

                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="Enter city"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.separator} />

              {/* State */}

              <View style={styles.fieldContainer}>
                {renderFieldIcon("map-outline")}

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>State *</Text>

                  <TextInput
                    value={state}
                    onChangeText={setState}
                    placeholder="Enter state"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.separator} />

              {/* PIN */}

              <View style={styles.fieldContainer}>
                {renderFieldIcon("keypad-outline")}

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>PIN Code *</Text>

                  <TextInput
                    value={pincode}
                    onChangeText={setPincode}
                    placeholder="Enter 6-digit PIN code"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>
            </View>

            {/* Current Location */}

            <TouchableOpacity
              style={styles.locationButton}
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert(
                  "Use Current Location",
                  "Location detection can be connected here using your preferred location service.",
                );
              }}
            >
              <Ionicons name="locate-outline" size={20} color="#2563EB" />

              <View style={styles.locationContent}>
                <Text style={styles.locationTitle}>Use Current Location</Text>

                <Text style={styles.locationSubtitle}>
                  Automatically detect your address
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Default Address */}

            <TouchableOpacity
              style={styles.defaultRow}
              activeOpacity={0.7}
              onPress={() => setIsDefault(!isDefault)}
            >
              <View
                style={[styles.checkbox, isDefault && styles.checkboxSelected]}
              >
                {isDefault && (
                  <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                )}
              </View>

              <View style={styles.defaultContent}>
                <Text style={styles.defaultTitle}>Set as default address</Text>

                <Text style={styles.defaultSubtitle}>
                  Use this address automatically when possible
                </Text>
              </View>
            </TouchableOpacity>

            {/* Privacy / Info */}

            <View style={styles.infoBox}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#2563EB"
              />

              <Text style={styles.infoText}>
                Your saved addresses are securely stored and used only to
                provide services at the selected location.
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

                  <Text style={styles.saveButtonText}>Save Address</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.bottomSpacing} />
          </ScrollView>

          {/* Address Owner Modal */}

          <Modal
            visible={showOwnerModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowOwnerModal(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setShowOwnerModal(false)}
            >
              <Pressable
                style={styles.bottomSheet}
                onPress={(event) => event.stopPropagation()}
              >
                <View style={styles.sheetHandle} />

                <Text style={styles.sheetTitle}>Who is this address for?</Text>

                <Text style={styles.sheetSubtitle}>
                  Choose the person who will use this service location
                </Text>

                <OwnerOption
                  icon="person-outline"
                  title="Myself"
                  subtitle="Save an address for me"
                  selected={ownerType === "SELF"}
                  onPress={() => {
                    setOwnerType("SELF");
                    setShowOwnerModal(false);
                  }}
                />

                <OwnerOption
                  icon="people-outline"
                  title="Dependent"
                  subtitle="Family member or dependent"
                  selected={ownerType === "DEPENDENT"}
                  onPress={() => {
                    setOwnerType("DEPENDENT");
                    setShowOwnerModal(false);
                  }}
                />

                <OwnerOption
                  icon="person-add-outline"
                  title="Friend"
                  subtitle="Save a friend's address"
                  selected={ownerType === "FRIEND"}
                  onPress={() => {
                    setOwnerType("FRIEND");
                    setShowOwnerModal(false);
                  }}
                />

                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.8}
                  onPress={() => setShowOwnerModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>

          {/* Address Label Modal */}

          <Modal
            visible={showLabelModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowLabelModal(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setShowLabelModal(false)}
            >
              <Pressable
                style={styles.bottomSheet}
                onPress={(event) => event.stopPropagation()}
              >
                <View style={styles.sheetHandle} />

                <Text style={styles.sheetTitle}>Address Type</Text>

                <Text style={styles.sheetSubtitle}>
                  Choose a label for this address
                </Text>

                {(
                  [
                    ["HOME", "Home", "home-outline"],
                    ["WORK", "Work", "briefcase-outline"],
                    ["OTHER", "Other", "location-outline"],
                  ] as const
                ).map(([value, title, icon]) => {
                  const selected = addressLabel === value;

                  return (
                    <TouchableOpacity
                      key={value}
                      style={styles.optionRow}
                      activeOpacity={0.7}
                      onPress={() => {
                        setAddressLabel(value);
                        setShowLabelModal(false);
                      }}
                    >
                      <View style={styles.optionIcon}>
                        <Ionicons name={icon} size={19} color="#2563EB" />
                      </View>

                      <Text
                        style={[
                          styles.optionText,
                          selected && styles.optionTextSelected,
                        ]}
                      >
                        {title}
                      </Text>

                      {selected && (
                        <Ionicons name="checkmark" size={20} color="#2563EB" />
                      )}
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.8}
                  onPress={() => setShowLabelModal(false)}
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

function OwnerOption({
  icon,
  title,
  subtitle,
  selected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.ownerOption}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.ownerOptionIcon}>
        <Ionicons name={icon} size={20} color="#2563EB" />
      </View>

      <View style={styles.ownerOptionContent}>
        <Text
          style={[
            styles.ownerOptionTitle,
            selected && styles.ownerOptionTitleSelected,
          ]}
        >
          {title}
        </Text>

        <Text style={styles.ownerOptionSubtitle}>{subtitle}</Text>
      </View>

      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
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
    paddingTop: 22,
  },

  /* Intro */

  introSection: {
    alignItems: "center",
    marginBottom: 26,
  },

  introIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  introTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },

  introSubtitle: {
    marginTop: 6,
    maxWidth: 330,
    fontSize: 11,
    lineHeight: 17,
    color: "#64748B",
    textAlign: "center",
  },

  /* Sections */

  sectionHeader: {
    marginBottom: 10,
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

  selectorCard: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 26,
  },

  selectorContent: {
    flex: 1,
    marginLeft: 12,
  },

  selectorValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
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

  separator: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginLeft: 66,
  },

  /* Current Location */

  locationButton: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  locationContent: {
    flex: 1,
    marginLeft: 11,
  },

  locationTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },

  locationSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: "#64748B",
  },

  /* Default */

  defaultRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    paddingVertical: 5,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxSelected: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  defaultContent: {
    flex: 1,
    marginLeft: 10,
  },

  defaultTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },

  defaultSubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: "#64748B",
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

  /* Modal */

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },

  bottomSheet: {
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
    lineHeight: 17,
    color: "#64748B",
  },

  /* Owner Options */

  ownerOption: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  ownerOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  ownerOptionContent: {
    flex: 1,
    marginLeft: 11,
  },

  ownerOptionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },

  ownerOptionTitleSelected: {
    color: "#2563EB",
  },

  ownerOptionSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: "#64748B",
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

  /* Generic Options */

  optionRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  optionText: {
    flex: 1,
    marginLeft: 11,
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },

  optionTextSelected: {
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
