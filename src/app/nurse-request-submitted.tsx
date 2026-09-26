import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getPatientRequest,
  getPatientRequestOffers,
  type PatientNurseOffer,
  type NurseServiceRequestStatus,
} from "@/api/patientRequests";

const careNames: Record<string, string> = {
  general: "General Nursing Care",
  elderly: "Elderly Care",
  "post-hospital": "Post-Hospital Care",
  wound: "Wound Care",
};

const isTrackingStatus = (status: NurseServiceRequestStatus) =>
  status === "ACCEPTED" || status === "EN_ROUTE" || status === "ARRIVED" || status === "IN_SERVICE";

export default function NurseRequestSubmittedScreen() {
  const { patientName, careType, serviceType, urgency, requestId } =
    useLocalSearchParams<{
      patientName?: string;
      careType?: string;
      serviceType?: string;
      urgency?: string;
      requestId?: string;
    }>();

  const [requestStatus, setRequestStatus] =
    useState<NurseServiceRequestStatus>("SEARCHING");
  const [assignedProfessionalName, setAssignedProfessionalName] =
    useState<string | null>(null);
  const [offers, setOffers] = useState<PatientNurseOffer[]>([]);
  const acceptedNotifiedRef = useRef(false);
  const trackingOpenedRef = useRef(false);

  const careName =
    serviceType || careNames[careType ?? ""] || "Nursing Care";

  const isAsap = urgency === "asap";

  useEffect(() => {
    if (!requestId) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let previousStatus: NurseServiceRequestStatus | null = null;

    const refresh = async () => {
      try {
        const request = await getPatientRequest(requestId);
        if (!active) return;

        const statusChangedToAccepted =
          previousStatus !== null &&
          previousStatus !== "ACCEPTED" &&
          request.status === "ACCEPTED";
        previousStatus = request.status;

        setRequestStatus(request.status);
        setAssignedProfessionalName(request.professionalName ?? null);

        if (
          isTrackingStatus(request.status) &&
          request.professionalId &&
          !trackingOpenedRef.current
        ) {
          trackingOpenedRef.current = true;
          router.replace({
            pathname: "/nurse-on-the-way",
            params: { requestId },
          });
          return;
        }

        if (
          statusChangedToAccepted &&
          !acceptedNotifiedRef.current
        ) {
          acceptedNotifiedRef.current = true;
          Alert.alert(
            "Nurse assigned",
            request.professionalName
              ? `${request.professionalName} has accepted your request.`
              : "A nurse has accepted your request."
          );
        }

        if (
          request.status === "SEARCHING" ||
          request.status === "OFFERED"
        ) {
          const currentOffers = await getPatientRequestOffers(requestId);
          if (active) setOffers(currentOffers);
        }

        if (
          request.status === "SEARCHING" ||
          request.status === "OFFERED"
        ) {
          timer = setTimeout(refresh, 5000);
        }
      } catch (error) {
        console.warn("Unable to refresh nurse request status", error);
      }
    };

    void refresh();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [requestId]);

  const statusLabel = (() => {
    switch (requestStatus) {
      case "OFFERED": {
        const activeOfferCount = offers.filter((offer) => offer.status === "OFFERED").length;
        return `${activeOfferCount || offers.length} nurse${(activeOfferCount || offers.length) === 1 ? "" : "s"} notified`;
      }
      case "SEARCHING": {
        const hasActiveOffer = offers.some((offer) => offer.status === "OFFERED");
        const hasDeclinedOffer = offers.some((offer) => offer.status === "DECLINED");
        if (!hasActiveOffer && hasDeclinedOffer) {
          return "Nurse declined — finding another nurse";
        }
        return "Finding a nurse";
      }
      case "ACCEPTED":
        return assignedProfessionalName
          ? `${assignedProfessionalName} is getting ready`
          : "Nurse is getting ready";
      case "EN_ROUTE":
        return "Nurse is on the way";
      case "ARRIVED":
        return "Nurse has arrived";
      case "IN_SERVICE":
        return "Service in progress";
      case "COMPLETED":
        return "Service completed";
      case "CANCELLED":
        return "Request cancelled";
      case "EXPIRED":
        return "Request expired";
      default:
        return "Finding a nurse";
    }
  })();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Ionicons
              name="checkmark"
              size={46}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.title}>
            Nurse request submitted
          </Text>

          <Text style={styles.subtitle}>
            We've received your request for {patientName}.
          </Text>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.label}>
                Care required
              </Text>

              <Text style={styles.value}>
                {careName}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statusRow}>
              <Text style={styles.label}>
                Request type
              </Text>

              <Text style={styles.value}>
                {isAsap
                  ? "As soon as possible"
                  : "Scheduled"}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statusRow}>
              <Text style={styles.label}>
                Current status
              </Text>

              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />

                <Text style={styles.statusText}>
                  {statusLabel}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons
              name="time-outline"
              size={23}
              color="#2563EB"
            />

            <Text style={styles.infoText}>
              We will look for an available and appropriately
              qualified healthcare worker near the requested
              location.
            </Text>
          </View>
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace("/")}
            activeOpacity={0.85}
          >
            <Text style={styles.homeButtonText}>
              Back to Home
            </Text>
          </TouchableOpacity>
        </View>
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

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
  },

  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginTop: 22,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
    textAlign: "center",
    marginTop: 7,
  },

  statusCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 16,
    marginTop: 28,
  },

  statusRow: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  label: {
    fontSize: 12,
    color: "#64748B",
  },

  value: {
    maxWidth: "60%",
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "right",
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#2563EB",
    marginRight: 6,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
  },

  infoCard: {
    width: "100%",
    backgroundColor: "#EFF6FF",
    borderRadius: 13,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 15,
  },

  infoText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 11,
    lineHeight: 17,
    color: "#1E40AF",
  },

  bottom: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },

  homeButton: {
    height: 52,
    borderRadius: 13,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  homeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});