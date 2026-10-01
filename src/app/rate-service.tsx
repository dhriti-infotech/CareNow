import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
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

import { ratePatientRequest } from "@/api/patientRequests";

export default function RateServiceScreen() {
  const { requestId, nurseName, serviceType, amount } = useLocalSearchParams<{
    requestId?: string;
    nurseName?: string;
    serviceType?: string;
    amount?: string;
  }>();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!requestId || rating < 1) {
      Alert.alert("Rating required", "Please select a rating before submitting.");
      return;
    }
    try {
      setSubmitting(true);
      await ratePatientRequest(requestId, { rating, review: review.trim() || undefined });
      Alert.alert("Thank you", "Your rating has been submitted.", [
        { text: "Continue", onPress: () => router.replace("/(tabs)/orders") },
      ]);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Unable to submit your rating.";
      Alert.alert("Unable to submit rating", message);
    } finally {
      setSubmitting(false);
    }
  };

  const skip = () => router.replace("/(tabs)/orders");

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={skip} disabled={submitting}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service completed</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingBottom: 140 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>Service completed</Text>
          <Text style={styles.subtitle}>
            {nurseName || "Your nurse"} has completed your {serviceType || "nursing service"}.
          </Text>

          {!!amount && <Text style={styles.amount}>₹{Number(amount).toFixed(0)}</Text>}

          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>How was your experience?</Text>
            <Text style={styles.ratingSubtitle}>Rate {nurseName || "your nurse"}</Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={styles.starButton}
                  onPress={() => setRating(value)}
                  disabled={submitting}
                  accessibilityLabel={`${value} star${value > 1 ? "s" : ""}`}
                >
                  <Ionicons
                    name={value <= rating ? "star" : "star-outline"}
                    size={43}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              value={review}
              onChangeText={setReview}
              placeholder="Tell us about your experience (optional)"
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={2000}
              textAlignVertical="top"
              editable={!submitting}
            />

            <TouchableOpacity
              style={[styles.submitButton, (rating < 1 || submitting) && styles.disabledButton]}
              onPress={submit}
              disabled={rating < 1 || submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>Submit rating</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={skip} disabled={submitting}>
              <Text style={styles.skipText}>Rate later</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1 },
  header: {
    height: 64,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EAF8FA",
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: { width: 42 },
  headerTitle: { fontSize: 19, fontWeight: "800", color: "#102A43" },
  content: { flex: 1, alignItems: "center", paddingHorizontal: 22, paddingTop: 35 },
  successCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: { fontSize: 28, fontWeight: "900", color: "#102A43", textAlign: "center" },
  subtitle: { marginTop: 8, fontSize: 15, lineHeight: 22, color: "#64748B", textAlign: "center" },
  amount: { marginTop: 12, fontSize: 22, fontWeight: "900", color: "#102A43" },
  ratingCard: {
    width: "100%",
    marginTop: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    alignItems: "center",
  },
  ratingTitle: { fontSize: 19, fontWeight: "800", color: "#102A43" },
  ratingSubtitle: { marginTop: 5, fontSize: 13, color: "#64748B" },
  starsRow: { flexDirection: "row", marginTop: 18 },
  starButton: { paddingHorizontal: 3 },
  reviewInput: {
    width: "100%",
    minHeight: 92,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#D7E2EA",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: "#334155",
    backgroundColor: "#F8FAFC",
  },
  submitButton: {
    width: "100%",
    height: 52,
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: { opacity: 0.5 },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  skipButton: { marginTop: 14, padding: 8 },
  skipText: { color: "#64748B", fontSize: 13, fontWeight: "700" },
});
