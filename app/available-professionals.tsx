import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  continuePatientMatching,
  getAvailableProfessionals,
  type AvailableProfessional,
} from "../api/patientRequests";
import { downloadAuthenticatedImage } from "../api/authenticatedImage";

function ProfessionalCardAvatar({
  requestId,
  professional,
}: {
  requestId?: string;
  professional: AvailableProfessional;
}) {
  const [uri, setUri] = useState<string | null>(null);
  const [loadingPicture, setLoadingPicture] = useState(true);

  useEffect(() => {
    let active = true;
    const loadPicture = async () => {
      if (!requestId) {
        if (active) setLoadingPicture(false);
        return;
      }
      setLoadingPicture(true);
      const localUri = await downloadAuthenticatedImage(
        `/api/user/patient/requests/${requestId}/available-professionals/${professional.professionalId}/picture`,
        `available-professional-${professional.professionalId}`,
      );
      if (active) {
        setUri(localUri);
        setLoadingPicture(false);
      }
    };
    void loadPicture();
    return () => { active = false; };
  }, [requestId, professional.professionalId]);

  if (uri) {
    return <Image source={{ uri }} style={styles.avatarImage} contentFit="cover" />;
  }

  return (
    <View style={styles.avatar}>
      {loadingPicture ? (
        <ActivityIndicator size="small" color="#2563EB" />
      ) : (
        <Text style={styles.avatarText}>{professional.name.trim().slice(0, 1).toUpperCase() || "N"}</Text>
      )}
    </View>
  );
}

function ProfessionalCard({
  requestId,
  item,
}: {
  requestId?: string;
  item: AvailableProfessional;
}) {
  return (
    <View style={styles.card}>
      <ProfessionalCardAvatar requestId={requestId} professional={item} />

      <View style={styles.main}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <View style={styles.verified}><Ionicons name="checkmark-circle" size={15} color="#16A34A" /><Text style={styles.verifiedText}>Verified</Text></View>
        </View>
        <Text style={styles.profession}>{item.profession.replaceAll("_", " ")}</Text>

        <View style={styles.detailRow}>
          <View style={styles.detail}><Ionicons name="person-outline" size={15} color="#64748B" /><Text style={styles.detailText}>{item.age ? `${item.age} yrs` : "Age —"}</Text></View>
          <View style={styles.detail}><Ionicons name="briefcase-outline" size={15} color="#64748B" /><Text style={styles.detailText}>{item.experienceYears != null ? `${item.experienceYears} yrs exp.` : "Experience —"}</Text></View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detail}><Ionicons name="star" size={15} color="#F59E0B" /><Text style={styles.detailText}>{item.rating.toFixed(1)} ({item.ratingCount})</Text></View>
          <View style={styles.detail}><Ionicons name="location-outline" size={15} color="#2563EB" /><Text style={styles.distance}>{item.distanceKm.toFixed(1)} km away</Text></View>
        </View>
      </View>

      <View style={styles.priceBox}>
        <Text style={styles.priceLabel}>Price</Text>
        <Text style={styles.price}>₹{item.price}</Text>
        <Text style={styles.priceSub}>home visit</Text>
      </View>
    </View>
  );
}

export default function AvailableProfessionalsScreen() {
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const [professionals, setProfessionals] = useState<AvailableProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);

  const load = useCallback(async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      const data = await getAvailableProfessionals(requestId);
      setProfessionals(data);
    } catch (error: any) {
      Alert.alert("Unable to load professionals", error?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => { void load(); }, [load]);

  const handleContinue = async () => {
    if (!requestId || continuing) return;
    try {
      setContinuing(true);
      await continuePatientMatching(requestId);
      router.replace({ pathname: "/nurse-request-submitted", params: { requestId } });
    } catch (error: any) {
      Alert.alert("Matching unavailable", error?.message ?? "We couldn't start nurse matching. Please try again.");
    } finally {
      setContinuing(false);
    }
  };

  const renderCard = ({ item }: { item: AvailableProfessional }) => (
    <ProfessionalCard requestId={requestId} item={item} />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Available Professionals</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.intro}>
          <Text style={styles.title}>Healthcare professionals near you</Text>
          <Text style={styles.subtitle}>These professionals are currently available for your service. You cannot select a professional — CareNow will automatically match the request after you continue.</Text>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /><Text style={styles.loadingText}>Finding available professionals...</Text></View>
        ) : (
          <FlatList
            data={professionals}
            keyExtractor={(item) => item.professionalId}
            renderItem={renderCard}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={(
              <View style={styles.empty}>
                <View style={styles.emptyIcon}><Ionicons name="people-outline" size={34} color="#2563EB" /></View>
                <Text style={styles.emptyTitle}>No professional is available right now</Text>
                <Text style={styles.emptyText}>You can still continue. CareNow will check the live availability and offer the request when an eligible professional is found.</Text>
              </View>
            )}
          />
        )}

        <View style={styles.footer}>
          <View style={styles.pricingHint}>
            <Ionicons name="pricetag-outline" size={18} color="#16A34A" />
            <Text style={styles.pricingHintText}>Pricing: &lt;6 km ₹199 · 6–10 km ₹249 · &gt;10–&lt;15 km ₹299</Text>
          </View>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue} disabled={continuing || loading} activeOpacity={0.85}>
            {continuing ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.continueText}>Continue</Text><Ionicons name="arrow-forward" size={19} color="#FFFFFF" /></>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { height: 58, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: "#0F172A" },
  headerSpacer: { width: 40 },
  intro: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8 },
  title: { fontSize: 21, fontWeight: "800", color: "#0F172A" },
  subtitle: { marginTop: 7, fontSize: 12, lineHeight: 18, color: "#64748B" },
  list: { padding: 16, paddingBottom: 170 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", padding: 13, marginBottom: 12, flexDirection: "row", alignItems: "flex-start" },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 21, fontWeight: "800", color: "#2563EB" },
  avatarImage: { width: 54, height: 54, borderRadius: 27 },
  main: { flex: 1, marginLeft: 11, paddingRight: 8 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { flexShrink: 1, fontSize: 15, fontWeight: "800", color: "#0F172A" },
  verified: { flexDirection: "row", alignItems: "center", gap: 2 },
  verifiedText: { fontSize: 9, fontWeight: "700", color: "#16A34A" },
  profession: { marginTop: 3, fontSize: 11, fontWeight: "700", color: "#2563EB", textTransform: "capitalize" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 13, marginTop: 8 },
  detail: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailText: { fontSize: 10, color: "#475569" },
  distance: { fontSize: 10, fontWeight: "700", color: "#2563EB" },
  priceBox: { minWidth: 66, alignItems: "flex-end", paddingTop: 2 },
  priceLabel: { fontSize: 9, color: "#64748B" },
  price: { marginTop: 1, fontSize: 18, fontWeight: "900", color: "#16A34A" },
  priceSub: { fontSize: 8, color: "#64748B" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 10, fontSize: 12, color: "#64748B" },
  empty: { alignItems: "center", paddingHorizontal: 28, paddingTop: 60 },
  emptyIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: 14, fontSize: 17, fontWeight: "800", color: "#0F172A", textAlign: "center" },
  emptyText: { marginTop: 7, fontSize: 12, lineHeight: 18, color: "#64748B", textAlign: "center" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 14, paddingBottom: 18, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  pricingHint: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10 },
  pricingHintText: { flex: 1, fontSize: 10, color: "#475569" },
  continueButton: { height: 50, borderRadius: 13, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  continueText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
