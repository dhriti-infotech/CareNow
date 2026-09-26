import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createNurseRequest, type PaymentMethod } from "@/api/patientRequests";
import { useAuth } from "@/context/auth-context";

const careOptions = [
  { id: "general", title: "General Nursing Care", description: "Basic nursing attention at home", icon: "medkit-outline" as const },
  { id: "elderly", title: "Elderly Care", description: "Assistance and attention for elderly patients", icon: "people-outline" as const },
  { id: "post-hospital", title: "Post-Hospital Care", description: "Support after discharge from hospital", icon: "fitness-outline" as const },
  { id: "wound", title: "Wound Care", description: "Basic wound dressing and nursing attention", icon: "bandage-outline" as const },
];

export default function RequestNurseScreen() {
  const { user } = useAuth();
  const [selectedCare, setSelectedCare] = useState("general");
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [requestFor, setRequestFor] = useState<"self" | "other">("self");
  const [patientName, setPatientName] = useState(user?.name ?? "");
  const [urgency, setUrgency] = useState("asap");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [detectedAddress, setDetectedAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (requestFor === "self") setPatientName(user?.name ?? "");
  }, [requestFor, user?.name]);


  const selectedCareOption = useMemo(
    () => careOptions.find((option) => option.id === selectedCare) ?? careOptions[0],
    [selectedCare]
  );

  const detectCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location permission required", "Please allow CareNow to use your location so we can find a nurse near you.");
        return;
      }

      try { await Location.enableNetworkProviderAsync(); } catch { /* Continue with available GPS accuracy. */ }

      const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude: currentLatitude, longitude: currentLongitude } = currentLocation.coords;
      setLatitude(currentLatitude);
      setLongitude(currentLongitude);

      const addresses = await Location.reverseGeocodeAsync({ latitude: currentLatitude, longitude: currentLongitude });
      if (addresses.length > 0) {
        const place = addresses[0];
        const parts = [place.name, place.street, place.district, place.city, place.region, place.postalCode].filter(Boolean);
        setDetectedAddress(place.formattedAddress || parts.join(", "));
      }
      setLocationDetected(true);
    } catch (error) {
      console.error("Location detection failed:", error);
      Alert.alert("Location unavailable", "We couldn't detect your location. Please check that GPS is enabled and try again.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!patientName.trim()) {
      Alert.alert("Patient name required", "Please enter the patient's name.");
      return;
    }
    if (urgency === "scheduled") {
      Alert.alert("Scheduling unavailable", "Scheduling for later is not available yet. Please select As soon as possible.");
      return;
    }
    if (!locationDetected || latitude === null || longitude === null || !detectedAddress.trim()) {
      Alert.alert("Location required", "Please use GPS to detect the patient's location before requesting a nurse.");
      return;
    }

    try {
      setSubmitting(true);
      const request = await createNurseRequest({
        serviceType: selectedCareOption.title,
        patientName: patientName.trim(),
        patientAge: null,
        locationAddress: detectedAddress.trim(),
        latitude,
        longitude,
        offeredPrice: 0,
        paymentMethod,
        priority: urgency === "asap" ? "URGENT" : "NORMAL",
        notes: notes.trim() || undefined,
      });

      router.replace({
        pathname: "/available-professionals",
        params: { requestId: request.requestId, patientName: request.patientName, careType: selectedCare, urgency },
      });
    } catch (error: any) {
      Alert.alert("Request failed", error?.message ?? "We couldn't submit your nurse request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nurse at Home</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.intro}>
            <View style={styles.introIcon}>
              <Ionicons name="medkit-outline" size={31} color="#2563EB" />
            </View>
            <Text style={styles.title}>Request a nurse at home</Text>
            <Text style={styles.subtitle}>Tell us a few details so we can help arrange appropriate nursing care near you.</Text>
          </View>

          <Text style={styles.sectionTitle}>Select service</Text>
          <TouchableOpacity
            style={styles.dropdown}
            activeOpacity={0.8}
            onPress={() => setServiceDropdownOpen(true)}
          >
            <View style={styles.dropdownIcon}>
              <Ionicons name={selectedCareOption.icon} size={23} color="#2563EB" />
            </View>
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownLabel}>Service type</Text>
              <Text style={styles.dropdownValue}>{selectedCareOption.title}</Text>
              <Text style={styles.dropdownDescription}>{selectedCareOption.description}</Text>
            </View>
            <Ionicons name="chevron-down" size={22} color="#64748B" />
          </TouchableOpacity>

          <View style={styles.priceCard}>
            <View style={styles.priceIcon}>
              <Ionicons name="pricetag-outline" size={21} color="#16A34A" />
            </View>
            <View style={styles.priceContent}>
              <Text style={styles.priceLabel}>Distance-based pricing</Text>
              <Text style={styles.priceValue}>₹199 – ₹299</Text>
            </View>
            <Text style={styles.priceUnit}>INR</Text>
          </View>

          <Text style={styles.sectionTitle}>Who is this service for?</Text>
          <View style={styles.forRow}>
            <TouchableOpacity
              style={[styles.forCard, requestFor === "self" && styles.forCardSelected]}
              activeOpacity={0.8}
              onPress={() => setRequestFor("self")}
            >
              <View style={[styles.radio, requestFor === "self" && styles.radioSelected]}>
                {requestFor === "self" && <View style={styles.radioDot} />}
              </View>
              <View style={styles.forTextContainer}>
                <Text style={styles.forTitle}>Myself</Text>
                <Text style={styles.forSubtitle}>I need the service</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.forCard, requestFor === "other" && styles.forCardSelected]}
              activeOpacity={0.8}
              onPress={() => setRequestFor("other")}
            >
              <View style={[styles.radio, requestFor === "other" && styles.radioSelected]}>
                {requestFor === "other" && <View style={styles.radioDot} />}
              </View>
              <View style={styles.forTextContainer}>
                <Text style={styles.forTitle}>Someone else</Text>
                <Text style={styles.forSubtitle}>Family or another person</Text>
              </View>
            </TouchableOpacity>
          </View>

          {requestFor === "other" && (
            <>
              <Text style={styles.fieldLabel}>Patient name</Text>
              <TextInput
                value={patientName}
                onChangeText={setPatientName}
                placeholder="Enter patient name"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                autoCapitalize="words"
              />
            </>
          )}

          <Text style={styles.sectionTitle}>When do you need the nurse?</Text>
          <TouchableOpacity style={[styles.timingCard, urgency === "asap" && styles.selectedTimingCard]} onPress={() => setUrgency("asap")} activeOpacity={0.8}>
            <View style={[styles.radio, urgency === "asap" && styles.radioSelected]}>
              {urgency === "asap" && <View style={styles.radioDot} />}
            </View>
            <View style={styles.timingContent}>
              <Text style={styles.timingTitle}>As soon as possible</Text>
              <Text style={styles.timingDescription}>We'll look for nearby availability.</Text>
            </View>
            <Ionicons name="flash-outline" size={22} color="#2563EB" />
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Patient location</Text>
          <Text style={styles.locationDescription}>Use GPS to automatically get the address where the nurse should visit.</Text>
          <TouchableOpacity style={[styles.detectLocationButton, locationDetected && styles.locationDetectedButton]} activeOpacity={0.8} onPress={detectCurrentLocation} disabled={locationLoading}>
            <View style={styles.detectLocationIcon}>
              <Ionicons name={locationLoading ? "sync-outline" : locationDetected ? "checkmark" : "locate-outline"} size={23} color="#2563EB" />
            </View>
            <View style={styles.detectLocationContent}>
              <Text style={styles.detectLocationTitle}>
                {locationLoading ? "Detecting your location..." : locationDetected ? "Location detected" : "Use my current location"}
              </Text>
              <Text style={styles.detectLocationSubtitle}>
                {locationLoading ? "Please wait while we find your location" : locationDetected ? "GPS coordinates and address captured" : "Turn on GPS and automatically fill your address"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={21} color="#64748B" />
          </TouchableOpacity>

          {locationDetected && detectedAddress ? (
            <View style={styles.detectedLocationCard}>
              <View style={styles.detectedLocationHeader}>
                <Ionicons name="location" size={18} color="#16A34A" />
                <Text style={styles.detectedLocationTitle}>Service address</Text>
              </View>
              <Text style={styles.detectedAddress}>{detectedAddress}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Payment method</Text>
          <View style={styles.paymentRow}>
            <TouchableOpacity
              style={[styles.paymentCard, paymentMethod === "UPI" && styles.paymentCardSelected]}
              activeOpacity={0.8}
              onPress={() => setPaymentMethod("UPI")}
            >
              <View style={[styles.radio, paymentMethod === "UPI" && styles.radioSelected]}>
                {paymentMethod === "UPI" && <View style={styles.radioDot} />}
              </View>
              <Ionicons name="phone-portrait-outline" size={21} color="#2563EB" />
              <View style={styles.paymentText}>
                <Text style={styles.paymentTitle}>UPI</Text>
                <Text style={styles.paymentSubtitle}>Pay in the app</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentCard, paymentMethod === "COD" && styles.paymentCardSelected]}
              activeOpacity={0.8}
              onPress={() => setPaymentMethod("COD")}
            >
              <View style={[styles.radio, paymentMethod === "COD" && styles.radioSelected]}>
                {paymentMethod === "COD" && <View style={styles.radioDot} />}
              </View>
              <Ionicons name="cash-outline" size={21} color="#16A34A" />
              <View style={styles.paymentText}>
                <Text style={styles.paymentTitle}>COD</Text>
                <Text style={styles.paymentSubtitle}>Cash at service</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Additional information</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything the nurse should know?"
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.notesInput]}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={21} color="#2563EB" />
            <Text style={styles.infoText}>You will see available professionals and their distance-based price after submitting the request. You cannot choose a professional; CareNow will match one automatically.</Text>
          </View>

          <TouchableOpacity style={[styles.requestButton, submitting && styles.requestButtonDisabled]} activeOpacity={0.85} onPress={handleRequest} disabled={submitting}>
            <Text style={styles.requestButtonText}>{submitting ? "Requesting..." : "Request Nurse"}</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.disclaimer}>Availability and arrival time depend on local healthcare-worker availability.</Text>
        </ScrollView>

        <Modal visible={serviceDropdownOpen} transparent animationType="fade" onRequestClose={() => setServiceDropdownOpen(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setServiceDropdownOpen(false)}>
            <Pressable style={styles.dropdownModal} onPress={(event) => event.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select service</Text>
                <TouchableOpacity onPress={() => setServiceDropdownOpen(false)}>
                  <Ionicons name="close" size={24} color="#475569" />
                </TouchableOpacity>
              </View>
              {careOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.dropdownOption, selectedCare === option.id && styles.dropdownOptionSelected]}
                  onPress={() => { setSelectedCare(option.id); setServiceDropdownOpen(false); }}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionIcon}>
                    <Ionicons name={option.icon} size={22} color="#2563EB" />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  {selectedCare === option.id && <Ionicons name="checkmark-circle" size={21} color="#2563EB" />}
                </TouchableOpacity>
              ))}
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { height: 58, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E2E8F0", flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: "#0F172A" },
  headerSpacer: { width: 40 },
  content: { padding: 16, paddingBottom: 35 },
  intro: { alignItems: "center", paddingTop: 12, paddingBottom: 8 },
  introIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 23, fontWeight: "800", color: "#0F172A", marginTop: 14, textAlign: "center" },
  subtitle: { fontSize: 13, lineHeight: 19, color: "#64748B", textAlign: "center", marginTop: 6, paddingHorizontal: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A", marginTop: 24, marginBottom: 11 },
  dropdown: { minHeight: 82, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#2563EB", borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center" },
  dropdownIcon: { width: 49, height: 49, borderRadius: 25, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  dropdownContent: { flex: 1, marginLeft: 12, paddingRight: 8 },
  dropdownLabel: { fontSize: 10, color: "#64748B", marginBottom: 2 },
  dropdownValue: { fontSize: 15, fontWeight: "800", color: "#1E293B" },
  dropdownDescription: { fontSize: 11, color: "#64748B", marginTop: 3 },
  priceCard: { minHeight: 66, marginTop: 10, backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0", borderRadius: 13, paddingHorizontal: 13, flexDirection: "row", alignItems: "center" },
  priceIcon: { width: 43, height: 43, borderRadius: 22, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center" },
  priceContent: { flex: 1, marginLeft: 10 },
  priceLabel: { fontSize: 11, color: "#166534" },
  priceValue: { fontSize: 19, fontWeight: "800", color: "#166534", marginTop: 2 },
  priceUnit: { fontSize: 10, fontWeight: "700", color: "#16A34A" },
  forRow: { flexDirection: "row", gap: 9 },
  paymentRow: { flexDirection: "row", gap: 9 },
  paymentCard: { flex: 1, minHeight: 74, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 13, padding: 10, flexDirection: "row", alignItems: "center" },
  paymentCardSelected: { borderColor: "#2563EB", backgroundColor: "#F8FBFF" },
  paymentText: { flex: 1, marginLeft: 7 },
  paymentTitle: { fontSize: 12, fontWeight: "800", color: "#1E293B" },
  paymentSubtitle: { fontSize: 9, color: "#64748B", marginTop: 3 },
  forCard: { flex: 1, minHeight: 72, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 13, padding: 11, flexDirection: "row", alignItems: "center" },
  forCardSelected: { borderColor: "#2563EB", backgroundColor: "#F8FBFF" },
  forTextContainer: { flex: 1, marginLeft: 9 },
  forTitle: { fontSize: 12, fontWeight: "800", color: "#1E293B" },
  forSubtitle: { fontSize: 10, color: "#64748B", marginTop: 3 },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 2, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: "#2563EB" },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: "#2563EB" },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: "#334155", marginTop: 16, marginBottom: 6 },
  input: { minHeight: 49, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 11, paddingHorizontal: 13, fontSize: 13, color: "#0F172A", marginBottom: 13 },
  notesInput: { minHeight: 85, paddingTop: 12 },
  timingCard: { minHeight: 70, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 13, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", marginBottom: 9 },
  selectedTimingCard: { borderColor: "#2563EB", backgroundColor: "#F8FBFF" },
  timingContent: { flex: 1, marginLeft: 11 },
  timingTitle: { fontSize: 13, fontWeight: "800", color: "#1E293B" },
  timingDescription: { fontSize: 11, color: "#64748B", marginTop: 3 },
  locationDescription: { fontSize: 12, color: "#64748B", lineHeight: 18, marginTop: -5, marginBottom: 12 },
  detectLocationButton: { minHeight: 76, backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1, borderColor: "#BFDBFE", padding: 12, flexDirection: "row", alignItems: "center" },
  locationDetectedButton: { borderColor: "#86EFAC", backgroundColor: "#F0FDF4" },
  detectLocationIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  detectLocationContent: { flex: 1, marginLeft: 11, paddingRight: 8 },
  detectLocationTitle: { fontSize: 13, fontWeight: "800", color: "#1E293B" },
  detectLocationSubtitle: { fontSize: 11, color: "#64748B", lineHeight: 16, marginTop: 3 },
  detectedLocationCard: { backgroundColor: "#F0FDF4", borderRadius: 12, padding: 13, marginTop: 10, borderWidth: 1, borderColor: "#BBF7D0" },
  detectedLocationHeader: { flexDirection: "row", alignItems: "center" },
  detectedLocationTitle: { fontSize: 12, fontWeight: "800", color: "#166534", marginLeft: 6 },
  detectedAddress: { fontSize: 12, lineHeight: 18, color: "#334155", marginTop: 7 },
  infoCard: { marginTop: 20, backgroundColor: "#EFF6FF", borderRadius: 12, padding: 13, flexDirection: "row", alignItems: "flex-start" },
  infoText: { flex: 1, marginLeft: 8, fontSize: 11, lineHeight: 17, color: "#1E40AF" },
  requestButton: { height: 53, borderRadius: 13, backgroundColor: "#2563EB", marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  requestButtonDisabled: { opacity: 0.65 },
  requestButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800", marginRight: 9 },
  disclaimer: { fontSize: 10, color: "#94A3B8", textAlign: "center", lineHeight: 15, marginTop: 9 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.45)", justifyContent: "flex-end" },
  dropdownModal: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: 28 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  dropdownOption: { minHeight: 72, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 13, padding: 10, flexDirection: "row", alignItems: "center", marginTop: 8 },
  dropdownOptionSelected: { borderColor: "#2563EB", backgroundColor: "#F8FBFF" },
  optionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  optionContent: { flex: 1, marginLeft: 10, paddingRight: 5 },
  optionTitle: { fontSize: 13, fontWeight: "800", color: "#1E293B" },
  optionDescription: { fontSize: 10, color: "#64748B", marginTop: 3 },
  optionPriceContainer: { alignItems: "flex-end", gap: 5 },
  optionPrice: { fontSize: 12, fontWeight: "800", color: "#166534" },
});
