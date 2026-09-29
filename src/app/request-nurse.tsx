import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
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

import { createNurseRequest, type PaymentMethod } from "@/api/patientRequests";
import { useAuth } from "@/context/auth-context";

type Step = 1 | 2 | 3 | 4;

type CareOption = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type ServiceLocation = {
  id: string;
  name: string;
  relationship?: string;
  address: string;
};

const careOptions: CareOption[] = [
  {
    id: "general",
    title: "General Nursing Care",
    description: "Basic nursing attention at home",
    icon: "medkit-outline",
  },
  {
    id: "elderly",
    title: "Elderly Care",
    description: "Assistance and attention for elderly patients",
    icon: "people-outline",
  },
  {
    id: "post-hospital",
    title: "Post-Hospital Care",
    description: "Support after discharge from hospital",
    icon: "fitness-outline",
  },
  {
    id: "wound",
    title: "Wound Care",
    description: "Basic wound dressing and nursing attention",
    icon: "bandage-outline",
  },
  {
    id: "other",
    title: "Other Care",
    description: "Tell us what kind of care you need",
    icon: "add-circle-outline",
  },
];

export default function RequestNurseScreen() {
  const { user } = useAuth();

  const [step, setStep] = useState<Step>(1);

  const [selectedCare, setSelectedCare] = useState("general");
  const [otherCare, setOtherCare] = useState("");

  const [selectedLocationId, setSelectedLocationId] = useState("self");

  const [showLocationModal, setShowLocationModal] = useState(false);

  const [patientName, setPatientName] = useState(user?.name ?? "");

  const [serviceLocations] = useState<ServiceLocation[]>([
    {
      id: "self",
      name: user?.name ?? "Myself",
      relationship: "Myself",
      address: "Use my current location",
    },
  ]);

  const [urgency, setUrgency] = useState<"asap" | "scheduled">("asap");

  const [scheduledDate, setScheduledDate] = useState<Date>(
    new Date(Date.now() + 60 * 60 * 1000),
  );

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [showTimePicker, setShowTimePicker] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");

  const [notes, setNotes] = useState("");

  const [latitude, setLatitude] = useState<number | null>(null);

  const [longitude, setLongitude] = useState<number | null>(null);

  const [detectedAddress, setDetectedAddress] = useState("");

  const [detectingLocation, setDetectingLocation] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const selectedCareOption = useMemo(
    () =>
      careOptions.find((item) => item.id === selectedCare) ?? careOptions[0],
    [selectedCare],
  );

  const selectedLocation = useMemo(
    () =>
      serviceLocations.find((item) => item.id === selectedLocationId) ??
      serviceLocations[0],
    [serviceLocations, selectedLocationId],
  );

  const displayedServiceName =
    selectedCare === "other" && otherCare.trim()
      ? otherCare.trim()
      : selectedCareOption.title;

  const isScheduledTimeValid =
    urgency === "asap" || scheduledDate.getTime() > Date.now();

  const goBack = () => {
    if (step === 1) {
      router.back();
      return;
    }

    setStep((current) => (current - 1) as Step);
  };

  const continueFromStep1 = () => {
    if (selectedCare === "other" && !otherCare.trim()) {
      Alert.alert(
        "Care required",
        "Please tell us what kind of care you need.",
      );
      return;
    }

    setStep(2);
  };

  const continueFromStep2 = () => {
    if (!patientName.trim()) {
      Alert.alert("Patient name required", "Please enter the patient's name.");
      return;
    }

    if (!detectedAddress.trim()) {
      Alert.alert(
        "Location required",
        "Please use your current location or select a saved address.",
      );
      return;
    }

    setStep(3);
  };

  const continueFromStep3 = () => {
    if (urgency === "scheduled" && !isScheduledTimeValid) {
      Alert.alert(
        "Choose a future time",
        "Please select a date and time in the future.",
      );
      return;
    }

    setStep(4);
  };

  const detectLocation = async () => {
    try {
      setDetectingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location permission",
          "Please allow location access to detect your current address.",
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude: lat, longitude: lng } = currentLocation.coords;

      setLatitude(lat);
      setLongitude(lng);

      const addresses = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (addresses.length > 0) {
        const address = addresses[0];

        const formatted = [
          address.name,
          address.street,
          address.district,
          address.city,
          address.region,
          address.postalCode,
        ]
          .filter(Boolean)
          .filter((value, index, array) => array.indexOf(value) === index)
          .join(", ");

        setDetectedAddress(formatted);
      }

      setSelectedLocationId("self");
    } catch (error) {
      console.error("Location error:", error);

      Alert.alert(
        "Unable to detect location",
        "Please try again or select a saved address.",
      );
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleAddAddress = () => {
    setShowLocationModal(false);
    router.push("/add");
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (!selectedDate) {
      return;
    }

    const next = new Date(scheduledDate);

    next.setFullYear(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
    );

    setScheduledDate(next);

    if (Platform.OS === "android") {
      setTimeout(() => {
        setShowTimePicker(true);
      }, 250);
    }
  };

  const handleTimeChange = (_event: any, selectedTime?: Date) => {
    setShowTimePicker(false);

    if (!selectedTime) {
      return;
    }

    const next = new Date(scheduledDate);

    next.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

    setScheduledDate(next);
  };

  const submitRequest = async () => {
    if (urgency === "scheduled" && !isScheduledTimeValid) {
      Alert.alert(
        "Choose a future time",
        "Please select a date and time in the future.",
      );
      return;
    }

    if (!patientName.trim()) {
      Alert.alert("Patient name required", "Please enter the patient's name.");
      return;
    }

    if (!detectedAddress.trim()) {
      Alert.alert(
        "Location required",
        "Please provide the patient's service location.",
      );
      return;
    }

    try {
      setSubmitting(true);

      const request = await createNurseRequest({
        serviceType: displayedServiceName,
        patientName: patientName.trim(),
        patientAge: null,
        locationAddress: detectedAddress.trim(),
        latitude,
        longitude,
        offeredPrice: 0,
        paymentMethod,
        priority: urgency === "asap" ? "URGENT" : "NORMAL",
        notes: notes.trim() || undefined,

        scheduledFor:
          urgency === "scheduled" ? scheduledDate.toISOString() : undefined,
      });

      router.replace({
        pathname: "/available-professionals",
        params: {
          requestId: request.requestId,
          patientName: request.patientName,
          careType: selectedCare,
          urgency,
        },
      });
    } catch (error: any) {
      console.error("Create nurse request error:", error);

      Alert.alert(
        "Request failed",
        error?.message ||
          "We couldn't create your nurse request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderProgress = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressStep}>Step {step} of 4</Text>

          <Text style={styles.progressHint}>
            {step === 1
              ? "Care needed"
              : step === 2
                ? "Patient & location"
                : step === 3
                  ? "Schedule & payment"
                  : "Review request"}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          {[1, 2, 3, 4].map((item) => (
            <View
              key={item}
              style={[
                styles.progressSegment,
                item <= step && styles.progressSegmentActive,
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderStep1 = () => (
    <>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="medical-outline" size={32} color="#2563EB" />
        </View>

        <Text style={styles.heroTitle}>What care do you need?</Text>

        <Text style={styles.heroSubtitle}>
          Choose the type of nursing support you need at home.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Select care type</Text>

      <View style={styles.careList}>
        {careOptions.map((option) => {
          const selected = selectedCare === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              activeOpacity={0.85}
              onPress={() => setSelectedCare(option.id)}
              style={[styles.careCard, selected && styles.careCardSelected]}
            >
              <View
                style={[styles.careIcon, selected && styles.careIconSelected]}
              >
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={selected ? "#2563EB" : "#64748B"}
                />
              </View>

              <View style={styles.careContent}>
                <Text
                  style={[
                    styles.careTitle,
                    selected && styles.careTitleSelected,
                  ]}
                >
                  {option.title}
                </Text>

                <Text style={styles.careDescription}>{option.description}</Text>
              </View>

              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedCare === "other" && (
        <View style={styles.otherCareContainer}>
          <Text style={styles.inputLabel}>What kind of care do you need?</Text>

          <TextInput
            value={otherCare}
            onChangeText={setOtherCare}
            placeholder="e.g. Injection, catheter care..."
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
            multiline
            maxLength={120}
          />
        </View>
      )}
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.heroCompact}>
        <View style={styles.heroIconSmall}>
          <Ionicons name="person-outline" size={26} color="#2563EB" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitleSmall}>Who needs the nurse?</Text>

          <Text style={styles.heroSubtitleSmall}>
            Select the person and where they need care.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Patient</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setShowLocationModal(true)}
        style={styles.selectedPersonCard}
      >
        <View style={styles.personAvatar}>
          <Ionicons name="person" size={22} color="#2563EB" />
        </View>

        <View style={styles.personInfo}>
          <Text style={styles.personName}>
            {selectedLocation?.name || "Myself"}
          </Text>

          <Text style={styles.personRelation}>
            {selectedLocation?.relationship || "Patient"}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={21} color="#94A3B8" />
      </TouchableOpacity>

      <View style={styles.patientNameContainer}>
        <Text style={styles.inputLabel}>Patient name</Text>

        <TextInput
          value={patientName}
          onChangeText={setPatientName}
          placeholder="Enter patient's name"
          placeholderTextColor="#94A3B8"
          style={styles.textInput}
        />
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setShowLocationModal(true)}
        style={styles.addAddressButton}
      >
        <View style={styles.addAddressIcon}>
          <Ionicons name="add" size={22} color="#2563EB" />
        </View>

        <View style={styles.addSpace}>
          <Text style={styles.addAddressTitle}>
            Add or select another address
          </Text>

          <Text style={styles.addAddressSubtitle}>
            For family members or saved locations
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Care location</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={detectLocation}
        style={styles.locationCard}
      >
        <View style={styles.locationIcon}>
          <Ionicons name="navigate-outline" size={23} color="#2563EB" />
        </View>

        <View style={styles.addSpace}>
          <Text style={styles.locationTitle}>
            {detectingLocation
              ? "Detecting location..."
              : detectedAddress
                ? "Current location"
                : "Use my current location"}
          </Text>

          <Text style={styles.locationSubtitle}>
            {detectedAddress || "We'll use GPS to find the service address"}
          </Text>
        </View>

        <Ionicons
          name={detectingLocation ? "sync-outline" : "chevron-forward"}
          size={20}
          color="#94A3B8"
        />
      </TouchableOpacity>

      {detectedAddress && (
        <View style={styles.detectedAddress}>
          <View style={styles.detectedIcon}>
            <Ionicons name="checkmark" size={15} color="#16A34A" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.detectedTitle}>Service location</Text>

            <Text style={styles.detectedText}>{detectedAddress}</Text>
          </View>

          <TouchableOpacity onPress={detectLocation} hitSlop={10}>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const renderStep3 = () => (
    <>
      <View style={styles.heroCompact}>
        <View style={styles.heroIconSmall}>
          <Ionicons name="calendar-outline" size={26} color="#2563EB" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitleSmall}>When do you need the nurse?</Text>

          <Text style={styles.heroSubtitleSmall}>
            Choose immediate care or plan it for later.
          </Text>
        </View>
      </View>

      <View style={styles.timingContainer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setUrgency("asap")}
          style={[
            styles.timingCard,
            urgency === "asap" && styles.timingCardSelected,
          ]}
        >
          <View style={styles.timingIcon}>
            <Ionicons name="flash-outline" size={23} color="#2563EB" />
          </View>

          <View style={styles.timingContent}>
            <Text style={styles.timingTitle}>As soon as possible</Text>

            <Text style={styles.timingSubtitle}>
              Find an available nurse now
            </Text>
          </View>

          <View
            style={[styles.radio, urgency === "asap" && styles.radioSelected]}
          >
            {urgency === "asap" && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setUrgency("scheduled")}
          style={[
            styles.timingCard,
            urgency === "scheduled" && styles.timingCardSelected,
          ]}
        >
          <View style={styles.timingIcon}>
            <Ionicons name="calendar-outline" size={23} color="#2563EB" />
          </View>

          <View style={styles.timingContent}>
            <Text style={styles.timingTitle}>Schedule for later</Text>

            <Text style={styles.timingSubtitle}>Choose a date and time</Text>
          </View>

          <View
            style={[
              styles.radio,
              urgency === "scheduled" && styles.radioSelected,
            ]}
          >
            {urgency === "scheduled" && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>
      </View>

      {urgency === "scheduled" && (
        <View style={styles.scheduleBox}>
          <Text style={styles.scheduleTitle}>Choose your preferred time</Text>

          <View style={styles.scheduleRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowDatePicker(true)}
              style={styles.dateTimeButton}
            >
              <Ionicons name="calendar-outline" size={20} color="#2563EB" />

              <View>
                <Text style={styles.dateTimeLabel}>Date</Text>

                <Text style={styles.dateTimeValue}>
                  {scheduledDate.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowTimePicker(true)}
              style={styles.dateTimeButton}
            >
              <Ionicons name="time-outline" size={20} color="#2563EB" />

              <View>
                <Text style={styles.dateTimeLabel}>Time</Text>

                <Text style={styles.dateTimeValue}>
                  {scheduledDate.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {!isScheduledTimeValid && (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#D97706" />

              <Text style={styles.warningText}>
                Please choose a future date and time.
              </Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.sectionTitle}>Estimated service price</Text>

      <View style={styles.priceCard}>
        <View style={styles.priceIcon}>
          <Ionicons name="wallet-outline" size={25} color="#16A34A" />
        </View>

        <View style={styles.priceContent}>
          <Text style={styles.priceLabel}>Nursing visit</Text>

          <Text style={styles.priceDescription}>
            Final amount depends on distance and selected care.
          </Text>
        </View>

        <View style={styles.priceValueContainer}>
          <Text style={styles.priceValue}>₹199</Text>

          <Text style={styles.priceTo}>– ₹299</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Payment method</Text>

      <View style={styles.paymentRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setPaymentMethod("UPI")}
          style={[
            styles.paymentCard,
            paymentMethod === "UPI" && styles.paymentCardSelected,
          ]}
        >
          <View style={styles.paymentIcon}>
            <Ionicons name="phone-portrait-outline" size={23} color="#2563EB" />
          </View>

          <Text style={styles.paymentTitle}>UPI</Text>

          <Text style={styles.paymentSubtitle}>Pay digitally</Text>

          <View
            style={[
              styles.radio,
              paymentMethod === "UPI" && styles.radioSelected,
            ]}
          >
            {paymentMethod === "UPI" && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setPaymentMethod("COD")}
          style={[
            styles.paymentCard,
            paymentMethod === "COD" && styles.paymentCardSelected,
          ]}
        >
          <View style={styles.paymentIcon}>
            <Ionicons name="cash-outline" size={23} color="#2563EB" />
          </View>

          <Text style={styles.paymentTitle}>Cash</Text>

          <Text style={styles.paymentSubtitle}>Pay after service</Text>

          <View
            style={[
              styles.radio,
              paymentMethod === "COD" && styles.radioSelected,
            ]}
          >
            {paymentMethod === "COD" && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        Additional information
        <Text style={styles.optionalText}>{"  "}Optional</Text>
      </Text>

      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Anything the nurse should know?"
        placeholderTextColor="#94A3B8"
        style={styles.notesInput}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        maxLength={500}
      />
    </>
  );

  const renderStep4 = () => (
    <>
      <View style={styles.reviewHero}>
        <View style={styles.reviewSuccessIcon}>
          <Ionicons name="checkmark-circle-outline" size={38} color="#2563EB" />
        </View>

        <Text style={styles.reviewHeroTitle}>Review your request</Text>

        <Text style={styles.reviewHeroSubtitle}>
          Please check the details before finding an available nurse.
        </Text>
      </View>

      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View>
            <Text style={styles.reviewTitle}>Care details</Text>

            <Text style={styles.reviewSectionHint}>Service requested</Text>
          </View>

          <TouchableOpacity onPress={() => setStep(1)}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <ReviewRow
          icon="medkit-outline"
          label="Care"
          value={displayedServiceName}
        />
      </View>

      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View>
            <Text style={styles.reviewTitle}>Patient & location</Text>

            <Text style={styles.reviewSectionHint}>Who and where</Text>
          </View>

          <TouchableOpacity onPress={() => setStep(2)}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <ReviewRow icon="person-outline" label="Patient" value={patientName} />

        <ReviewRow
          icon="location-outline"
          label="Location"
          value={detectedAddress}
        />
      </View>

      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View>
            <Text style={styles.reviewTitle}>Schedule & payment</Text>

            <Text style={styles.reviewSectionHint}>
              When and how you'll pay
            </Text>
          </View>

          <TouchableOpacity onPress={() => setStep(3)}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <ReviewRow
          icon="calendar-outline"
          label="When"
          value={
            urgency === "asap"
              ? "As soon as possible"
              : `${scheduledDate.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}, ${scheduledDate.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
          }
        />

        <ReviewRow
          icon="card-outline"
          label="Payment"
          value={paymentMethod === "UPI" ? "UPI" : "Cash"}
        />

        <ReviewRow icon="wallet-outline" label="Price" value="₹199 – ₹299" />
      </View>

      {notes.trim() && (
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View>
              <Text style={styles.reviewTitle}>Additional information</Text>

              <Text style={styles.reviewSectionHint}>Note for the nurse</Text>
            </View>

            <TouchableOpacity onPress={() => setStep(3)}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.reviewNotes}>{notes.trim()}</Text>
        </View>
      )}

      <View style={styles.finalPriceCard}>
        <View style={styles.finalPriceIcon}>
          <Ionicons name="shield-checkmark-outline" size={25} color="#16A34A" />
        </View>

        <View style={styles.finalPriceContent}>
          <Text style={styles.finalPriceTitle}>Estimated total</Text>

          <Text style={styles.finalPriceSubtitle}>
            Final amount may vary based on distance and care requirements.
          </Text>
        </View>

        <Text style={styles.finalPrice}>₹199–₹299</Text>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={21} color="#2563EB" />

        <Text style={styles.infoText}>
          After you confirm, we'll show available nursing professionals near
          your service location.
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={goBack}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Nurse at Home</Text>

          <View style={styles.headerSpacer} />
        </View>

        {renderProgress()}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          <View style={{ height: 105 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          {step === 1 && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.primaryButton}
              onPress={continueFromStep1}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>

              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {step === 2 && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.primaryButton}
              onPress={continueFromStep2}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>

              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {step === 3 && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.primaryButton}
              onPress={continueFromStep3}
            >
              <Text style={styles.primaryButtonText}>Review Request</Text>

              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {step === 4 && (
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={submitting}
              style={[
                styles.primaryButton,
                submitting && styles.primaryButtonDisabled,
              ]}
              onPress={submitRequest}
            >
              {submitting ? (
                <Text style={styles.primaryButtonText}>Finding a Nurse...</Text>
              ) : (
                <>
                  <Ionicons name="search" size={19} color="#FFFFFF" />

                  <Text style={styles.primaryButtonText}>Find a Nurse</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <Modal
          visible={showLocationModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLocationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setShowLocationModal(false)}
            />

            <View style={styles.locationModal}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Who needs the nurse?</Text>

                  <Text style={styles.modalSubtitle}>
                    Choose a saved person or address
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowLocationModal(false)}
                  style={styles.modalClose}
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingBottom: 30,
                }}
              >
                {serviceLocations.map((location) => {
                  const selected = selectedLocationId === location.id;

                  return (
                    <TouchableOpacity
                      key={location.id}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedLocationId(location.id);

                        setPatientName(location.name);

                        if (location.address !== "Use my current location") {
                          setDetectedAddress(location.address);
                        }

                        setShowLocationModal(false);
                      }}
                      style={[
                        styles.modalLocationItem,
                        selected && styles.modalLocationItemSelected,
                      ]}
                    >
                      <View style={styles.modalPersonIcon}>
                        <Ionicons
                          name="person-outline"
                          size={21}
                          color="#2563EB"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalPersonName}>
                          {location.name}
                        </Text>

                        <Text style={styles.modalPersonRelation}>
                          {location.relationship || "Patient"}
                        </Text>

                        {location.address !== "Use my current location" && (
                          <Text
                            style={styles.modalPersonAddress}
                            numberOfLines={2}
                          >
                            {location.address}
                          </Text>
                        )}
                      </View>

                      <View
                        style={[styles.radio, selected && styles.radioSelected]}
                      >
                        {selected && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleAddAddress}
                  style={styles.modalAddAddress}
                >
                  <View style={styles.modalAddIcon}>
                    <Ionicons name="add" size={22} color="#2563EB" />
                  </View>

                  <View
                    style={{
                      flex: 1,
                      marginLeft: 14,
                    }}
                  >
                    <Text style={styles.modalAddTitle}>Add new address</Text>

                    <Text style={styles.modalAddSubtitle}>
                      Add a person or service location
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {showDatePicker && (
          <DateTimePicker
            value={scheduledDate}
            mode="date"
            minimumDate={new Date()}
            onChange={handleDateChange}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={scheduledDate}
            mode="time"
            onChange={handleTimeChange}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function ReviewRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.reviewRow}>
      <View style={styles.reviewIcon}>
        <Ionicons name={icon} size={17} color="#64748B" />
      </View>

      <Text style={styles.reviewLabel}>{label}</Text>

      <Text style={styles.reviewValue} numberOfLines={3}>
        {value}
      </Text>
    </View>
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
    borderRadius: 20,
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

  progressContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  progressStep: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563EB",
  },

  progressHint: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  progressTrack: {
    flexDirection: "row",
    gap: 5,
  },

  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },

  progressSegmentActive: {
    backgroundColor: "#2563EB",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 22,
  },

  hero: {
    alignItems: "center",
    paddingTop: 5,
    marginBottom: 22,
  },

  heroCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 24,
  },

  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  heroIconSmall: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },

  heroSubtitle: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 320,
  },

  heroTitleSmall: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
  },

  heroSubtitleSmall: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 10,
    marginTop: 20,
  },

  careList: {
    gap: 10,
  },

  careCard: {
    minHeight: 86,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  careCardSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#F8FBFF",
  },

  careIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  careIconSelected: {
    backgroundColor: "#EFF6FF",
  },

  careContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  careTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
  },

  careTitleSelected: {
    color: "#0F172A",
  },

  careDescription: {
    fontSize: 11.5,
    lineHeight: 17,
    color: "#64748B",
    marginTop: 3,
  },

  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
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

  otherCareContainer: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 8,
  },

  textInput: {
    minHeight: 48,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    fontSize: 14,
    color: "#0F172A",
  },

  patientNameContainer: {
    marginTop: 13,
  },

  selectedPersonCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 15,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  personAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  personInfo: {
    flex: 1,
    marginLeft: 12,
  },

  personName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },

  personRelation: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },

  addAddressButton: {
    marginTop: 11,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  addAddressIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  addSpace: {
    flex: 1,
    marginLeft: 14,
  },

  addAddressTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },

  addAddressSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
  },

  locationCard: {
    minHeight: 76,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  locationIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  locationTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },

  locationSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: "#64748B",
    marginTop: 3,
    marginRight: 8,
  },

  detectedAddress: {
    marginTop: 10,
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  detectedIcon: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  detectedTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#166534",
  },

  detectedText: {
    fontSize: 11.5,
    lineHeight: 17,
    color: "#166534",
    marginTop: 2,
  },

  changeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB",
    marginLeft: 8,
  },

  timingContainer: {
    gap: 10,
  },

  timingCard: {
    minHeight: 78,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  timingCardSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#F8FBFF",
  },

  timingIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  timingContent: {
    flex: 1,
    marginLeft: 11,
  },

  timingTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },

  timingSubtitle: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 3,
  },

  scheduleBox: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
  },

  scheduleTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 11,
  },

  scheduleRow: {
    flexDirection: "row",
    gap: 10,
  },

  dateTimeButton: {
    flex: 1,
    minHeight: 64,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  dateTimeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },

  dateTimeValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },

  warningBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FFFBEB",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  warningText: {
    flex: 1,
    fontSize: 11,
    color: "#92400E",
    fontWeight: "600",
  },

  priceCard: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 15,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  priceIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },

  priceContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  priceLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#166534",
  },

  priceDescription: {
    fontSize: 10.5,
    lineHeight: 15,
    color: "#15803D",
    marginTop: 3,
  },

  priceValueContainer: {
    alignItems: "flex-end",
  },

  priceValue: {
    fontSize: 17,
    fontWeight: "900",
    color: "#166534",
  },

  priceTo: {
    fontSize: 10,
    fontWeight: "700",
    color: "#15803D",
  },

  paymentRow: {
    flexDirection: "row",
    gap: 10,
  },

  paymentCard: {
    flex: 1,
    minHeight: 130,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 13,
  },

  paymentCardSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#F8FBFF",
  },

  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  paymentTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },

  paymentSubtitle: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 3,
  },

  optionalText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#94A3B8",
  },

  notesInput: {
    minHeight: 100,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 13,
    color: "#0F172A",
  },

  reviewHero: {
    alignItems: "center",
    paddingTop: 4,
    marginBottom: 20,
  },

  reviewSuccessIcon: {
    width: 70,
    height: 70,
    borderRadius: 23,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  reviewHeroTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
  },

  reviewHeroSubtitle: {
    marginTop: 6,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 320,
  },

  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 12,
  },

  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  reviewTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },

  reviewSectionHint: {
    fontSize: 10.5,
    color: "#94A3B8",
    marginTop: 2,
  },

  editText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563EB",
  },

  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
  },

  reviewIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  reviewLabel: {
    width: 62,
    marginLeft: 8,
    fontSize: 11,
    color: "#64748B",
  },

  reviewValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    textAlign: "right",
  },

  reviewNotes: {
    fontSize: 12,
    lineHeight: 18,
    color: "#475569",
    marginTop: 11,
  },

  finalPriceCard: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  finalPriceIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },

  finalPriceContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  finalPriceTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#166534",
  },

  finalPriceSubtitle: {
    fontSize: 10.5,
    lineHeight: 15,
    color: "#15803D",
    marginTop: 3,
  },

  finalPrice: {
    fontSize: 17,
    fontWeight: "900",
    color: "#166534",
  },

  infoCard: {
    padding: 13,
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },

  infoText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: "#1E40AF",
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 12,
  },

  primaryButton: {
    height: 53,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryButtonDisabled: {
    opacity: 0.65,
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
  },

  locationModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "78%",
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
    marginBottom: 15,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 15,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },

  modalSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
  },

  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  modalLocationItem: {
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 11,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  modalLocationItemSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#F8FBFF",
  },

  modalPersonIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  modalPersonName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },

  modalPersonRelation: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 2,
  },

  modalPersonAddress: {
    fontSize: 10.5,
    lineHeight: 15,
    color: "#64748B",
    marginTop: 4,
  },

  modalAddAddress: {
    minHeight: 70,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderStyle: "dashed",
    backgroundColor: "#F8FBFF",
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  modalAddIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  modalAddTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2563EB",
  },

  modalAddSubtitle: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 3,
  },
});
