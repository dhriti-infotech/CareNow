import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ProfilePicturePicker from "../components/ProfilePicturePicker";
import { useAuth } from "../context/auth-context";

const COLORS = {
  background: "#F7FCFD",
  surface: "#FFFFFF",
  primary: "#0A9FB5",
  primarySoft: "#E7F8F6",
  primaryPale: "#EAF7F9",
  text: "#10283A",
  muted: "#6C8296",
  border: "#DDEBED",
  success: "#16A765",
  successSoft: "#E8F8EF",
  danger: "#DC3D3D",
  dangerSoft: "#FFF1F1",
  warning: "#F4A62A",
};

export default function ProfessionalProfileScreen() {
  const { user, logout } = useAuth();
  const [detailsExpanded, setDetailsExpanded] = useState(true);

  const professionalType = user?.professionalType || "Healthcare Professional";
  const verificationStatus = user?.verificationStatus || "PENDING";
  const isApproved = verificationStatus === "APPROVED";

  const profileFields = [
    user?.name,
    user?.mobile,
    user?.professionalType,
    user?.qualification,
    user?.registrationNumber,
    user?.serviceArea,
  ];
  const completedFields = profileFields.filter((value) => Boolean(value?.trim())).length;
  const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.75} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={23} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.75} onPress={() => router.push("/professional-home")}>
            <Ionicons name="home-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.profileHero}>
            <View style={styles.avatarRing}>
              <ProfilePicturePicker owner="PROFESSIONAL" user={user} size={104} />
              {isApproved && (
                <View style={styles.verifiedDot}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>

            <Text style={styles.name}>{user?.name || "Professional"}</Text>
            <Text style={styles.mobile}>{user?.mobile || "Mobile number not available"}</Text>

            <View style={styles.typeBadge}>
              <Ionicons name="medical-outline" size={14} color={COLORS.primary} />
              <Text style={styles.typeBadgeText}>{professionalType}</Text>
            </View>
          </View>

          <View style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <View style={styles.completionIcon}>
                <Ionicons name="person-circle-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.completionCopy}>
                <Text style={styles.completionTitle}>Profile completeness</Text>
                <Text style={styles.completionSubtitle}>
                  {profileCompletion === 100 ? "Your professional profile is complete" : "Complete your details to build a stronger profile"}
                </Text>
              </View>
              <Text style={styles.completionPercent}>{profileCompletion}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${profileCompletion}%` }]} />
            </View>
          </View>

          <SectionTitle title="Verification" />
          <View style={styles.verificationCard}>
            <View style={[styles.statusIcon, isApproved ? styles.successIcon : styles.pendingIcon]}>
              <Ionicons
                name={isApproved ? "shield-checkmark-outline" : "shield-outline"}
                size={24}
                color={isApproved ? COLORS.success : COLORS.warning}
              />
            </View>
            <View style={styles.verificationContent}>
              <View style={styles.verificationTitleRow}>
                <Text style={styles.cardTitle}>Professional Status</Text>
                <View style={[styles.statusBadge, isApproved ? styles.approvedBadge : styles.pendingBadge]}>
                  <View style={[styles.statusDot, { backgroundColor: isApproved ? COLORS.success : COLORS.warning }]} />
                  <Text style={[styles.statusBadgeText, { color: isApproved ? COLORS.success : "#A16207" }]}>
                    {formatStatus(verificationStatus)}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardDescription}>
                {isApproved ? "Your professional profile is verified and active." : "Your professional profile is currently awaiting verification."}
              </Text>
            </View>
          </View>

          <SectionTitle title="Professional Details" />
          <View style={styles.detailsCard}>
            <TouchableOpacity style={styles.detailsHeader} activeOpacity={0.75} onPress={() => setDetailsExpanded((current) => !current)}>
              <View style={styles.detailsHeaderIcon}>
                <Ionicons name="briefcase-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.detailsHeaderCopy}>
                <Text style={styles.detailsHeaderTitle}>Professional information</Text>
                <Text style={styles.detailsHeaderSubtitle}>Your registered healthcare details</Text>
              </View>
              <Ionicons name={detailsExpanded ? "chevron-up" : "chevron-down"} size={19} color={COLORS.muted} />
            </TouchableOpacity>

            {detailsExpanded && (
              <View style={styles.detailsBody}>
                <DetailRow icon="medical-outline" label="Profession" value={professionalType} />
                <DetailRow icon="school-outline" label="Qualification" value={user?.qualification || "Not provided"} />
                <DetailRow icon="document-text-outline" label="Registration Number" value={user?.registrationNumber || "Not provided"} />
                <DetailRow icon="location-outline" label="Service Area" value={user?.serviceArea || "Not provided"} last />
              </View>
            )}
          </View>

          <SectionTitle title="Contact & Account" />
          <View style={styles.accountCard}>
            <InfoRow icon="call-outline" label="Mobile number" value={user?.mobile || "Not provided"} />
            <View style={styles.separator} />
            <InfoRow icon="mail-outline" label="Email address" value={user?.email || "Not provided"} />
          </View>

          <TouchableOpacity style={styles.dashboardCard} activeOpacity={0.82} onPress={() => router.push("/professional-home")}>
            <View style={styles.dashboardIcon}>
              <Ionicons name="pulse-outline" size={23} color={COLORS.primary} />
            </View>
            <View style={styles.dashboardCopy}>
              <Text style={styles.dashboardTitle}>Manage your availability</Text>
              <Text style={styles.dashboardSubtitle}>Go to your professional dashboard to manage services and availability.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} onPress={handleLogout}>
            <View style={styles.logoutIcon}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
            </View>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <Text style={styles.version}>CareNow • Professional</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function DetailRow({ icon, label, value, last = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) {
  return (
    <View>
      <View style={styles.detailRow}>
        <View style={styles.detailIcon}>
          <Ionicons name={icon} size={19} color={COLORS.primary} />
        </View>
        <View style={styles.detailContent}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.detailValue}>{value}</Text>
        </View>
      </View>
      {!last && <View style={styles.separator} />}
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={19} color={COLORS.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function formatStatus(status: string) {
  return status.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { height: 60, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 14 },
  headerButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primaryPale },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "900", color: COLORS.text },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 36 },
  profileHero: { alignItems: "center", paddingTop: 4, paddingBottom: 18 },
  avatarRing: { width: 104, height: 104, borderRadius: 52, backgroundColor: COLORS.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#CDE9ED", position: "relative" },
  avatar: { width: 86, height: 86, borderRadius: 43, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  verifiedDot: { position: "absolute", right: 1, bottom: 5, width: 27, height: 27, borderRadius: 14, backgroundColor: COLORS.success, borderWidth: 3, borderColor: COLORS.background, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 25, fontWeight: "900", color: COLORS.text, marginTop: 13 },
  mobile: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primarySoft, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 7, marginTop: 10 },
  typeBadgeText: { fontSize: 11, fontWeight: "900", color: COLORS.primary },
  completionCard: { backgroundColor: COLORS.surface, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, padding: 14 },
  completionHeader: { flexDirection: "row", alignItems: "center" },
  completionIcon: { width: 43, height: 43, borderRadius: 22, backgroundColor: COLORS.primarySoft, alignItems: "center", justifyContent: "center" },
  completionCopy: { flex: 1, marginLeft: 10 },
  completionTitle: { fontSize: 12, fontWeight: "900", color: COLORS.text },
  completionSubtitle: { fontSize: 10, lineHeight: 15, color: COLORS.muted, marginTop: 2 },
  completionPercent: { fontSize: 16, fontWeight: "900", color: COLORS.primary },
  progressTrack: { height: 7, backgroundColor: "#DCE8EC", borderRadius: 5, overflow: "hidden", marginTop: 13 },
  progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 5 },
  sectionTitle: { fontSize: 17, fontWeight: "900", color: COLORS.text, marginTop: 22, marginBottom: 10 },
  verificationCard: { backgroundColor: COLORS.surface, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, padding: 14, flexDirection: "row", alignItems: "center" },
  statusIcon: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  successIcon: { backgroundColor: COLORS.successSoft },
  pendingIcon: { backgroundColor: "#FFF7E7" },
  verificationContent: { flex: 1, marginLeft: 11 },
  verificationTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { flex: 1, fontSize: 12, fontWeight: "900", color: COLORS.text },
  cardDescription: { fontSize: 10, lineHeight: 15, color: COLORS.muted, marginTop: 4 },
  statusBadge: { flexDirection: "row", alignItems: "center", borderRadius: 15, paddingHorizontal: 8, paddingVertical: 5 },
  approvedBadge: { backgroundColor: COLORS.successSoft },
  pendingBadge: { backgroundColor: "#FFF7E7" },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusBadgeText: { fontSize: 9, fontWeight: "900" },
  detailsCard: { backgroundColor: COLORS.surface, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  detailsHeader: { minHeight: 72, flexDirection: "row", alignItems: "center", paddingHorizontal: 13 },
  detailsHeaderIcon: { width: 43, height: 43, borderRadius: 22, backgroundColor: COLORS.primarySoft, alignItems: "center", justifyContent: "center" },
  detailsHeaderCopy: { flex: 1, marginLeft: 11 },
  detailsHeaderTitle: { fontSize: 12, fontWeight: "900", color: COLORS.text },
  detailsHeaderSubtitle: { fontSize: 10, color: COLORS.muted, marginTop: 3 },
  detailsBody: { borderTopWidth: 1, borderTopColor: "#EEF5F6", paddingHorizontal: 13 },
  detailRow: { minHeight: 70, flexDirection: "row", alignItems: "center" },
  detailIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#EFF9FA", alignItems: "center", justifyContent: "center" },
  detailContent: { flex: 1, marginLeft: 11 },
  detailLabel: { fontSize: 10, color: COLORS.muted },
  detailValue: { fontSize: 13, fontWeight: "800", color: COLORS.text, marginTop: 3 },
  separator: { height: 1, backgroundColor: "#EEF5F6" },
  accountCard: { backgroundColor: COLORS.surface, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  infoRow: { minHeight: 68, flexDirection: "row", alignItems: "center", paddingHorizontal: 13 },
  infoIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#EFF9FA", alignItems: "center", justifyContent: "center" },
  infoContent: { flex: 1, marginLeft: 11 },
  infoLabel: { fontSize: 10, color: COLORS.muted },
  infoValue: { fontSize: 12, fontWeight: "800", color: COLORS.text, marginTop: 3 },
  dashboardCard: { marginTop: 14, backgroundColor: COLORS.primarySoft, borderRadius: 15, borderWidth: 1, borderColor: "#CDE9ED", padding: 13, flexDirection: "row", alignItems: "center" },
  dashboardIcon: { width: 45, height: 45, borderRadius: 23, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center" },
  dashboardCopy: { flex: 1, marginLeft: 11, marginRight: 7 },
  dashboardTitle: { fontSize: 12, fontWeight: "900", color: COLORS.text },
  dashboardSubtitle: { fontSize: 10, lineHeight: 15, color: COLORS.muted, marginTop: 3 },
  logoutButton: { marginTop: 18, minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: "#F5C7C7", backgroundColor: COLORS.dangerSoft, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  logoutIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#FFE3E3", alignItems: "center", justifyContent: "center" },
  logoutText: { color: COLORS.danger, fontSize: 14, fontWeight: "900" },
  version: { textAlign: "center", fontSize: 9, color: "#94A3B8", marginTop: 16 },
});
