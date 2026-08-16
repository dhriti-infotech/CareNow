import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
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

const careOptions = [
  {
    id: "general",
    title: "General Nursing Care",
    description: "Basic nursing attention at home",
    icon: "medkit-outline" as const,
  },
  {
    id: "elderly",
    title: "Elderly Care",
    description: "Assistance and attention for elderly patients",
    icon: "people-outline" as const,
  },
  {
    id: "post-hospital",
    title: "Post-Hospital Care",
    description: "Support after discharge from hospital",
    icon: "fitness-outline" as const,
  },
  {
    id: "wound",
    title: "Wound Care",
    description: "Basic wound dressing and nursing attention",
    icon: "bandage-outline" as const,
  },
];

export default function RequestNurseScreen() {
  const [selectedCare, setSelectedCare] = useState("general");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [urgency, setUrgency] = useState("asap");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [detectedAddress, setDetectedAddress] = useState("");

  const [houseNumber, setHouseNumber] = useState("");
  const [landmark, setLandmark] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [directions, setDirections] = useState("");



  const detectCurrentLocation = async () => {
  try {
    setLocationLoading(true);

    // Ask for location permission
    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      alert(
        "Location permission is required to find a nurse near you."
      );
      return;
    }

    // On Android, ask the user to enable high accuracy location
    try {
      await Location.enableNetworkProviderAsync();
    } catch {
      // User may choose not to enable high accuracy.
      // We can still attempt to get the current location.
    }

    // Get current device location
    const currentLocation =
      await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

    const { latitude, longitude } =
      currentLocation.coords;

    setLatitude(latitude);
    setLongitude(longitude);

    // Convert coordinates into a readable address
    const addresses =
      await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

    if (addresses.length > 0) {
      const place = addresses[0];

      const parts = [
        place.name,
        place.street,
        place.district,
        place.city,
        place.region,
        place.postalCode,
      ].filter(Boolean);

      const formattedAddress =
        place.formattedAddress ||
        parts.join(", ");

      setDetectedAddress(formattedAddress);
      setAddress(formattedAddress);
    }

    setLocationDetected(true);
  } catch (error) {
    console.error("Location detection failed:", error);

    alert(
      "We couldn't detect your location. Please check that GPS is enabled and try again."
    );
  } finally {
    setLocationLoading(false);
  }
};

//   const handleRequest = () => {
//     if (!patientName.trim()) {
//       Alert.alert(
//         "Patient name required",
//         "Please enter the patient's name."
//       );
//       return;
//     }

//     if (!patientAge.trim()) {
//       Alert.alert(
//         "Patient age required",
//         "Please enter the patient's age."
//       );
//       return;
//     }

//     if (!address.trim()) {
//       Alert.alert(
//         "Address required",
//         "Please enter the patient's address or village."
//       );
//       return;
//     }

//     router.push({
//       pathname: "/nurse-request-submitted",
//       params: {
//         patientName,
//         careType: selectedCare,
//         urgency,
//       },
//     });
//   };

const handleRequest = () => {
  if (!patientName.trim()) {
    Alert.alert(
      "Patient name required",
      "Please enter the patient's name."
    );
    return;
  }

  if (!patientAge.trim()) {
    Alert.alert(
      "Patient age required",
      "Please enter the patient's age."
    );
    return;
  }

  if (!address.trim()) {
    Alert.alert(
      "Patient location required",
      "Please detect your current location or enter the address manually."
    );
    return;
  }

  if (!houseNumber.trim()) {
    Alert.alert(
      "House number required",
      "Please enter the house, door or flat number."
    );
    return;
  }

  router.push({
    pathname: "/nurse-request-submitted",
    params: {
      patientName,
      careType: selectedCare,
      urgency,
      latitude: latitude?.toString() ?? "",
      longitude: longitude?.toString() ?? "",
      houseNumber,
      address,
      landmark,
      directions,
      notes,
    },
  });
};

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#0F172A"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Nurse at Home
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Intro */}
          <View style={styles.intro}>
            <View style={styles.introIcon}>
              <Ionicons
                name="medkit-outline"
                size={31}
                color="#2563EB"
              />
            </View>

            <Text style={styles.title}>
              Request a nurse at home
            </Text>

            <Text style={styles.subtitle}>
              Tell us a few details so we can help arrange
              appropriate nursing care near you.
            </Text>
          </View>

          {/* Care requirement */}
          <SectionTitle
            title="What kind of care do you need?"
          />

          <View style={styles.careList}>
            {careOptions.map((option) => {
              const selected = selectedCare === option.id;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.careCard,
                    selected && styles.selectedCareCard,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCare(option.id)}
                >
                  <View
                    style={[
                      styles.careIcon,
                      selected && styles.selectedCareIcon,
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={23}
                      color="#2563EB"
                    />
                  </View>

                  <View style={styles.careContent}>
                    <Text style={styles.careTitle}>
                      {option.title}
                    </Text>

                    <Text style={styles.careDescription}>
                      {option.description}
                    </Text>
                  </View>

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

          {/* Patient details */}
          <SectionTitle title="Patient details" />

          <Text style={styles.fieldLabel}>
            Patient name
          </Text>

          <TextInput
            value={patientName}
            onChangeText={setPatientName}
            placeholder="Enter patient name"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>
            Patient age
          </Text>

          <TextInput
            value={patientAge}
            onChangeText={setPatientAge}
            placeholder="Enter age"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            style={styles.input}
          />

          {/* Timing */}
          <SectionTitle title="When do you need the nurse?" />

          <TouchableOpacity
            style={[
              styles.timingCard,
              urgency === "asap" && styles.selectedTimingCard,
            ]}
            onPress={() => setUrgency("asap")}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.radio,
                urgency === "asap" && styles.radioSelected,
              ]}
            >
              {urgency === "asap" && (
                <View style={styles.radioDot} />
              )}
            </View>

            <View style={styles.timingContent}>
              <Text style={styles.timingTitle}>
                As soon as possible
              </Text>

              <Text style={styles.timingDescription}>
                We'll look for nearby availability.
              </Text>
            </View>

            <Ionicons
              name="flash-outline"
              size={22}
              color="#2563EB"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.timingCard,
              urgency === "scheduled" &&
                styles.selectedTimingCard,
            ]}
            onPress={() => setUrgency("scheduled")}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.radio,
                urgency === "scheduled" &&
                  styles.radioSelected,
              ]}
            >
              {urgency === "scheduled" && (
                <View style={styles.radioDot} />
              )}
            </View>

            <View style={styles.timingContent}>
              <Text style={styles.timingTitle}>
                Schedule for later
              </Text>

              <Text style={styles.timingDescription}>
                Scheduling will be added in the next step.
              </Text>
            </View>

            <Ionicons
              name="calendar-outline"
              size={22}
              color="#64748B"
            />
          </TouchableOpacity>

          {/* Location */}
          {/* <SectionTitle title="Patient location" />

          <Text style={styles.fieldLabel}>
            Address / Village
          </Text>

          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Enter village or address"
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.multilineInput]}
            multiline
          />

          <Text style={styles.fieldLabel}>
            Landmark
          </Text>

          <TextInput
            value={landmark}
            onChangeText={setLandmark}
            placeholder="Example: Near Government School"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          /> */}


                {/* Location */}
        <SectionTitle title="Patient location" />

        <Text style={styles.locationDescription}>
        Help us find the exact place where the nurse should visit.
        </Text>

        {/* Detect Location */}
        <TouchableOpacity
        style={[
            styles.detectLocationButton,
            locationDetected && styles.locationDetectedButton,
        ]}
        activeOpacity={0.8}
        onPress={detectCurrentLocation}
        disabled={locationLoading}
        >
        <View style={styles.detectLocationIcon}>
            <Ionicons
            name={
                locationLoading
                ? "sync-outline"
                : locationDetected
                    ? "checkmark"
                    : "locate-outline"
            }
            size={23}
            color="#2563EB"
            />
        </View>

        <View style={styles.detectLocationContent}>
            <Text style={styles.detectLocationTitle}>
            {locationLoading
                ? "Detecting your location..."
                : locationDetected
                ? "Location detected"
                : "Use my current location"}
            </Text>

            <Text style={styles.detectLocationSubtitle}>
            {locationLoading
                ? "Please wait while we find your location"
                : locationDetected
                ? "You can edit the address below"
                : "Turn on GPS and automatically fill your address"}
            </Text>
        </View>

        {!locationLoading && (
            <Ionicons
            name="chevron-forward"
            size={19}
            color="#64748B"
            />
        )}
        </TouchableOpacity>

        {/* Detected Address */}
        {locationDetected && (
        <View style={styles.detectedLocationCard}>
            <View style={styles.detectedLocationHeader}>
            <Ionicons
                name="location"
                size={19}
                color="#16A34A"
            />

            <Text style={styles.detectedLocationTitle}>
                Current location
            </Text>
            </View>

            <Text style={styles.detectedAddress}>
            {detectedAddress || "Location detected"}
            </Text>

            <Text style={styles.coordinateText}>
            Location captured successfully
            </Text>
        </View>
        )}

        {/* House Number */}
        <Text style={styles.fieldLabel}>
        House / Door / Flat No.
        </Text>

        <TextInput
        value={houseNumber}
        onChangeText={setHouseNumber}
        placeholder="Example: H.No. 2-45"
        placeholderTextColor="#94A3B8"
        style={styles.input}
        />

        {/* Address */}
        <Text style={styles.fieldLabel}>
        Address / Village
        </Text>

        <TextInput
        value={address}
        onChangeText={setAddress}
        placeholder="Enter or edit your address"
        placeholderTextColor="#94A3B8"
        style={[styles.input, styles.multilineInput]}
        multiline
        />

        {/* Landmark */}
        <Text style={styles.fieldLabel}>
        Nearby landmark
        </Text>

        <TextInput
        value={landmark}
        onChangeText={setLandmark}
        placeholder="Example: Near Government School"
        placeholderTextColor="#94A3B8"
        style={styles.input}
        />

        {/* Additional directions */}
        <Text style={styles.fieldLabel}>
        Additional directions
        <Text style={styles.optionalText}>  (Optional)</Text>
        </Text>

        <TextInput
            value={directions}
            onChangeText={setDirections}
            placeholder="Example: Blue gate, second house after the temple"
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.notesInput]}
            multiline
            textAlignVertical="top"
            />

          {/* Notes */}
          <SectionTitle title="Additional information" />

          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything the nurse should know?"
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.notesInput]}
            multiline
            textAlignVertical="top"
          />

          {/* Information */}
          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={21}
              color="#2563EB"
            />

            <Text style={styles.infoText}>
              We will use these details to find an
              appropriate available healthcare worker.
            </Text>
          </View>

          {/* Request */}
          <TouchableOpacity
            style={styles.requestButton}
            activeOpacity={0.85}
            onPress={handleRequest}
          >
            <Text style={styles.requestButtonText}>
              Request Nurse
            </Text>

            <Ionicons
              name="arrow-forward"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Availability and arrival time depend on local
            healthcare-worker availability.
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text style={styles.sectionTitle}>
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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

  headerSpacer: {
    width: 40,
  },

  content: {
    padding: 16,
    paddingBottom: 35,
  },

  intro: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },

  introIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 14,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 10,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 24,
    marginBottom: 11,
  },

  careList: {
    gap: 10,
  },

  careCard: {
    minHeight: 76,
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  selectedCareCard: {
    borderColor: "#2563EB",
    backgroundColor: "#F8FBFF",
  },

  careIcon: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  selectedCareIcon: {
    backgroundColor: "#DBEAFE",
  },

  careContent: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 8,
  },

  careTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },

  careDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: "#64748B",
    marginTop: 3,
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

  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },

  input: {
    minHeight: 49,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 11,
    paddingHorizontal: 13,
    fontSize: 13,
    color: "#0F172A",
    marginBottom: 13,
  },

  multilineInput: {
    minHeight: 72,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  notesInput: {
    minHeight: 85,
    paddingTop: 12,
  },

  timingCard: {
    minHeight: 70,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  selectedTimingCard: {
    borderColor: "#2563EB",
    backgroundColor: "#F8FBFF",
  },

  timingContent: {
    flex: 1,
    marginLeft: 11,
  },

  timingTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },

  timingDescription: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
  },

  infoCard: {
    marginTop: 20,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 11,
    lineHeight: 17,
    color: "#1E40AF",
  },

  requestButton: {
    height: 53,
    borderRadius: 13,
    backgroundColor: "#2563EB",
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  requestButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginRight: 9,
  },

  disclaimer: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 15,
    marginTop: 9,
  },

  locationDescription: {
  fontSize: 12,
  color: "#64748B",
  lineHeight: 18,
  marginTop: -5,
  marginBottom: 12,
},

detectLocationButton: {
  minHeight: 76,
  backgroundColor: "#FFFFFF",
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#BFDBFE",
  padding: 12,
  flexDirection: "row",
  alignItems: "center",
},

locationDetectedButton: {
  borderColor: "#86EFAC",
  backgroundColor: "#F0FDF4",
},

detectLocationIcon: {
  width: 46,
  height: 46,
  borderRadius: 23,
  backgroundColor: "#EFF6FF",
  alignItems: "center",
  justifyContent: "center",
},

detectLocationContent: {
  flex: 1,
  marginLeft: 11,
  paddingRight: 8,
},

detectLocationTitle: {
  fontSize: 13,
  fontWeight: "800",
  color: "#1E293B",
},

detectLocationSubtitle: {
  fontSize: 11,
  color: "#64748B",
  lineHeight: 16,
  marginTop: 3,
},

detectedLocationCard: {
  backgroundColor: "#F0FDF4",
  borderRadius: 12,
  padding: 13,
  marginTop: 10,
  borderWidth: 1,
  borderColor: "#BBF7D0",
},

detectedLocationHeader: {
  flexDirection: "row",
  alignItems: "center",
},

detectedLocationTitle: {
  fontSize: 12,
  fontWeight: "800",
  color: "#166534",
  marginLeft: 6,
},

detectedAddress: {
  fontSize: 12,
  lineHeight: 18,
  color: "#334155",
  marginTop: 7,
},

coordinateText: {
  fontSize: 10,
  color: "#16A34A",
  marginTop: 5,
},

optionalText: {
  fontWeight: "400",
  color: "#94A3B8",
},
});