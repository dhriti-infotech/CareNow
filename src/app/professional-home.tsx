import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  getNurseDashboard,
  type NurseDashboard,
} from "@/api/professionalDashboard";
import {
  getNurseProfile,
  getNurseRequests,
  getNurseSecurityWallet,
  updateNurseAvailability,
  updateNurseLocation,
  type NurseAvailabilityStatus,
  type NurseProfile,
  type NurseSecurityWallet,
} from "@/api/professionalRequests";
import { getProfilePictureSource } from "@/api/profilePicture";
import { useAuth } from "@/context/auth-context";
import { AppUser, getSession } from "@/services/auth";
import { registerProfessionalPushNotifications } from "@/services/professional-notifications";
import { ServiceRequest } from "@/services/professional-requests";
import type { ProfessionalType } from "@/services/professional-stats";

export default function ProfessionalHomeScreen() {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();

  const [user, setUser] = useState<AppUser | null>(null);
  const [status, setStatus] = useState<"PENDING" | "APPROVED">("PENDING");
  const [loading, setLoading] = useState(true);

  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);

  const [nurseProfile, setNurseProfile] = useState<NurseProfile | null>(null);

  const [dashboard, setDashboard] = useState<NurseDashboard | null>(null);

  const [securityWallet, setSecurityWallet] =
    useState<NurseSecurityWallet | null>(null);

  const [availabilityUpdating, setAvailabilityUpdating] = useState(false);

  const [profilePictureSource, setProfilePictureSource] = useState<
    string | null
  >(null);

  /*
   * ---------------------------------------------------------
   * PROFILE PICTURE
   * ---------------------------------------------------------
   */

  useFocusEffect(
    useCallback(() => {
      if (authUser?.role !== "PROFESSIONAL" || !authUser.accountId) {
        setProfilePictureSource(null);
        return undefined;
      }

      let active = true;

      void getProfilePictureSource("PROFESSIONAL", Date.now()).then(
        (source) => {
          if (active) {
            setProfilePictureSource(source);
          }
        },
      );

      return () => {
        active = false;
      };
    }, [authUser?.accountId, authUser?.role]),
  );

  /*
   * ---------------------------------------------------------
   * INITIAL LOAD
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (authUser?.role !== "PROFESSIONAL") {
      setLoading(false);
      setServiceRequests([]);
      setNurseProfile(null);
      setDashboard(null);
      return;
    }

    const initializeProfessional = async () => {
      try {
        const session = await getSession();

        const fallbackProfessionalUser =
          authUser && authUser.role === "PROFESSIONAL"
            ? {
                id: authUser.accountId,
                name: authUser.name || "Professional",
                mobile: "",
                otp: "",
                role: "PROFESSIONAL" as const,
                status: authUser.verificationStatus || "PENDING",
                professionalType: authUser.professionalType || "NURSE",
              }
            : null;

        const activeUser = session ?? fallbackProfessionalUser;

        if (!activeUser) {
          router.replace("/login");
          return;
        }

        setUser(activeUser);

        if (activeUser.status === "APPROVED") {
          setStatus("APPROVED");

          const activeProfessionalType = activeUser.professionalType;

          const isNurseServiceProfessional =
            activeProfessionalType === "NURSE" ||
            activeProfessionalType === "HEALTHCARE_WORKER" ||
            activeProfessionalType === "HEALTH_WORKER";

          if (isNurseServiceProfessional) {
            try {
              const [profile, dashboardData, requests, wallet] =
                await Promise.all([
                  getNurseProfile(),
                  getNurseDashboard(),
                  getNurseRequests(),
                  getNurseSecurityWallet(),
                ]);

              setNurseProfile(profile);
              setDashboard(dashboardData);
              setSecurityWallet(wallet);
              setServiceRequests(requests.map(mapNurseRequest));
            } catch (error) {
              console.warn("Unable to load nurse dashboard", error);
            }
          }

          setLoading(false);
          return;
        }

        setStatus("PENDING");

        const pendingProfessionalType = activeUser.professionalType;

        const isPendingNurse =
          pendingProfessionalType === "NURSE" ||
          pendingProfessionalType === "HEALTHCARE_WORKER" ||
          pendingProfessionalType === "HEALTH_WORKER";

        if (isPendingNurse) {
          try {
            setSecurityWallet(await getNurseSecurityWallet());
          } catch (error) {
            console.warn("Unable to load professional security wallet", error);
          }
        }

        setLoading(false);
      } catch (error) {
        console.warn("Unable to initialize professional dashboard", error);
        setLoading(false);
      }
    };

    void initializeProfessional();
  }, [authUser]);

  /*
   * ---------------------------------------------------------
   * PUSH NOTIFICATIONS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (authUser?.role !== "PROFESSIONAL" || status !== "APPROVED") {
      return;
    }

    void registerProfessionalPushNotifications();
  }, [authUser?.role, status]);

  /*
   * ---------------------------------------------------------
   * LIVE LOCATION
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (authUser?.role !== "PROFESSIONAL" || status !== "APPROVED") {
      return;
    }

    if (
      nurseProfile?.availabilityStatus !== "AVAILABLE" &&
      nurseProfile?.availabilityStatus !== "BUSY"
    ) {
      return;
    }

    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    const startLocationUpdates = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== Location.PermissionStatus.GRANTED) {
          console.warn(
            "Location permission is required for live nurse tracking",
          );
          return;
        }

        if (cancelled) {
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (position) => {
            if (cancelled) {
              return;
            }

            void updateNurseLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }).catch((error) => {
              console.warn("Unable to update nurse live location", error);
            });
          },
        );
      } catch (error) {
        console.warn("Unable to start nurse location tracking", error);
      }
    };

    void startLocationUpdates();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [authUser?.role, status, nurseProfile?.availabilityStatus]);

  /*
   * ---------------------------------------------------------
   * REFRESH DASHBOARD
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (authUser?.role !== "PROFESSIONAL") {
      return;
    }

    if (
      !approvedStatus(status) ||
      nurseProfile?.availabilityStatus !== "AVAILABLE"
    ) {
      return;
    }

    let cancelled = false;

    const refreshRequests = async () => {
      try {
        const [requests, dashboardData] = await Promise.all([
          getNurseRequests(),
          getNurseDashboard(),
        ]);

        if (!cancelled) {
          setServiceRequests(requests.map(mapNurseRequest));

          setDashboard(dashboardData);

          setNurseProfile((current) =>
            current
              ? {
                  ...current,
                  availabilityStatus: dashboardData.availabilityStatus,
                }
              : current,
          );
        }
      } catch (error) {
        console.warn("Unable to refresh nurse dashboard data", error);
      }
    };

    const interval = setInterval(refreshRequests, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [authUser?.role, status, nurseProfile?.availabilityStatus]);

  /*
   * ---------------------------------------------------------
   * ACTIVITY
   * ---------------------------------------------------------
   */

  const activityRequests = useMemo(() => {
    const activities = dashboard?.recentActivities ?? [];
    return activities.slice(0, 3);
  }, [dashboard]);

  /*
   * ---------------------------------------------------------
   * ACTIVE SERVICE
   * ---------------------------------------------------------
   */

  const activeService = useMemo(() => {
    // Active services must come from the backend's professional-scoped
    // `activeServices` collection. Do not derive this from recentActivities:
    // another professional's OFFER can be EXPIRED while the shared service
    // request itself is already IN_SERVICE for the professional who accepted it.
    const activeServices = dashboard?.activeServices ?? [];
    return activeServices[0] ?? null;
  }, [dashboard]);

  /*
   * ---------------------------------------------------------
   * NEW REQUESTS
   * ---------------------------------------------------------
   */

  const newRequests = useMemo(() => {
    return serviceRequests
      .filter((request) => !request.status || request.status === "OFFERED")
      .slice(0, 2);
  }, [serviceRequests]);

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A9FB5" />

          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (authUser?.role !== "PROFESSIONAL") {
    return null;
  }

  const approved = status === "APPROVED";

  const professionalType = user?.professionalType as
    | ProfessionalType
    | undefined;

  const isPharmacist = professionalType === "PHARMACIST";

  /*
   * ---------------------------------------------------------
   * DASHBOARD DATA
   * ---------------------------------------------------------
   */

  const servicesCompleted = dashboard?.serviceActivity.servicesCompleted ?? 0;

  const serviceCompletionRate = dashboard?.serviceActivity.completionRate ?? 0;

  const lifetimeEarnings = dashboard?.earnings.lifetime ?? 0;

  const rating = dashboard?.rating.average ?? 0;

  const ordersFulfilled = 0;
  const fulfillmentRate = 0;

  /*
   * ---------------------------------------------------------
   * AVAILABILITY
   * ---------------------------------------------------------
   */

  const handleAvailabilityChange = async (
    nextStatus: NurseAvailabilityStatus,
  ) => {
    if (
      !nurseProfile ||
      availabilityUpdating ||
      nurseProfile.availabilityStatus === nextStatus
    ) {
      return;
    }

    setAvailabilityUpdating(true);

    try {
      let latitude = toNumber(nurseProfile.latitude);

      let longitude = toNumber(nurseProfile.longitude);

      if (
        nextStatus === "AVAILABLE" &&
        (latitude == null || longitude == null)
      ) {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== Location.PermissionStatus.GRANTED) {
          Alert.alert(
            "Location required",
            "Please allow location access so CareNow can match nearby service requests.",
          );

          return;
        }

        const position = await Location.getCurrentPositionAsync({});

        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }

      const updated = await updateNurseAvailability({
        availabilityStatus: nextStatus,
        latitude,
        longitude,
        serviceRadiusKm: toNumber(nurseProfile.serviceRadiusKm) ?? 10,
      });

      setNurseProfile(updated);

      if (nextStatus === "AVAILABLE") {
        const requests = await getNurseRequests();

        setServiceRequests(requests.map(mapNurseRequest));
      } else {
        setServiceRequests([]);
      }
    } catch (error: any) {
      Alert.alert(
        "Unable to update availability",
        error?.message ?? "Please try again.",
      );
    } finally {
      setAvailabilityUpdating(false);
    }
  };

  const displayName = user?.name || "Professional";

  const availabilityStatus = nurseProfile?.availabilityStatus;

  const availabilityIsOnline = availabilityStatus === "AVAILABLE";

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          {
            // The professional bottom navigation is now part of the normal
            // layout flow, so content does not render underneath it.
            paddingBottom: 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatar}
            activeOpacity={0.85}
            onPress={() => router.push("/professional-profile")}
          >
            {profilePictureSource ? (
              <Image
                source={profilePictureSource}
                style={styles.avatarImage}
                contentFit="cover"
                onError={() => setProfilePictureSource(null)}
              />
            ) : (
              <Ionicons name="person" size={24} color="#0A9FB5" />
            )}
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>Hi, {displayName}</Text>

            <View style={styles.headerMeta}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: availabilityColor(availabilityStatus),
                  },
                ]}
              />

              <Text style={styles.statusText}>
                {availabilityLabel(availabilityStatus)}
              </Text>

              <View style={styles.metaDivider} />

              <Text style={styles.professionalType}>
                {formatProfessionalType(professionalType || "NURSE")}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            activeOpacity={0.8}
            onPress={() => router.push("/professional-requests")}
          >
            <Ionicons name="notifications-outline" size={23} color="#183B46" />

            {serviceRequests.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {Math.min(serviceRequests.length, 9)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* =================================================
            AVAILABILITY
        ================================================= */}

        {approved && (
          <View style={styles.availabilityCard}>
            <View style={styles.availabilityLeft}>
              <View
                style={[
                  styles.availabilityIcon,
                  availabilityIsOnline
                    ? styles.availabilityIconOnline
                    : styles.availabilityIconOffline,
                ]}
              >
                <Ionicons
                  name={
                    availabilityIsOnline ? "radio-outline" : "pause-outline"
                  }
                  size={21}
                  color={availabilityIsOnline ? "#0A9F6A" : "#64748B"}
                />
              </View>

              <View style={styles.availabilityCopy}>
                <Text style={styles.availabilityTitle}>
                  {availabilityIsOnline ? "You're available" : "You're offline"}
                </Text>

                <Text style={styles.availabilitySubtitle}>
                  {availabilityIsOnline
                    ? "Receiving nearby service requests"
                    : "Turn on to receive nearby requests"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.switch,
                availabilityIsOnline ? styles.switchOn : styles.switchOff,
              ]}
              activeOpacity={0.9}
              disabled={availabilityUpdating}
              onPress={() =>
                handleAvailabilityChange(
                  availabilityIsOnline ? "OFFLINE" : "AVAILABLE",
                )
              }
            >
              {availabilityUpdating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View
                  style={[
                    styles.switchThumb,
                    availabilityIsOnline
                      ? styles.switchThumbOn
                      : styles.switchThumbOff,
                  ]}
                />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* =================================================
            PENDING
        ================================================= */}

        {!approved && (
          <View style={styles.pendingCard}>
            <View style={styles.pendingIcon}>
              <Ionicons name="time-outline" size={20} color="#B45309" />
            </View>

            <View style={styles.pendingContent}>
              <Text style={styles.pendingTitle}>Verification in progress</Text>

              <Text style={styles.pendingSubtitle}>
                Your professional profile is being verified.
              </Text>
            </View>

            <ActivityIndicator size="small" color="#F59E0B" />
          </View>
        )}

        {/* =================================================
            ACTIVE SERVICE
        ================================================= */}

        {approved && activeService && (
          <>
            <SectionHeader
              title="Current service"
              subtitle="Your active patient visit"
            />

            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.activeServiceCard}
              onPress={() =>
                router.push({
                  pathname: "/nurse-service-map",
                  params: {
                    requestId: activeService.requestId,
                  },
                })
              }
            >
              <View style={styles.activeServiceTop}>
                <View style={styles.activeServiceIcon}>
                  <Ionicons name="navigate" size={22} color="#FFFFFF" />
                </View>

                <View style={styles.activeServiceInfo}>
                  <Text style={styles.activeServiceTitle} numberOfLines={1}>
                    {activeService.serviceType}
                  </Text>

                  <Text style={styles.activeServicePatient} numberOfLines={1}>
                    {activeService.patientName}
                  </Text>
                </View>

                <View style={styles.activeStatusBadge}>
                  <View style={styles.activeStatusDot} />

                  <Text style={styles.activeStatusText}>
                    {activityStatusLabel(activeService.requestStatus)}
                  </Text>
                </View>
              </View>

              <View style={styles.activeServiceFooter}>
                <View style={styles.activeServiceMeta}>
                  <Ionicons name="location-outline" size={15} color="#647B84" />

                  <Text style={styles.activeServiceMetaText}>
                    Continue to service
                  </Text>
                </View>

                <View style={styles.openMapButton}>
                  <Text style={styles.openMapText}>Open route</Text>

                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* =================================================
            NEW REQUESTS
        ================================================= */}

        {approved && (
          <>
            <View style={[styles.sectionHeader, styles.requestsHeader]}>
              <View>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>New requests</Text>

                  {newRequests.length > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>
                        {newRequests.length}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.sectionSubtitle}>
                  Nearby service opportunities
                </Text>
              </View>

              <TouchableOpacity
                style={styles.viewAllButton}
                activeOpacity={0.7}
                onPress={() => router.push("/professional-requests")}
              >
                <Text style={styles.viewAllText}>View all</Text>

                <Ionicons name="arrow-forward" size={16} color="#0A9FB5" />
              </TouchableOpacity>
            </View>

            {newRequests.length > 0 ? (
              <View style={styles.requestList}>
                {newRequests.map((request) => (
                  <TouchableOpacity
                    key={request.id}
                    style={styles.requestCard}
                    activeOpacity={0.88}
                    onPress={() =>
                      router.push({
                        pathname: "/professional-requests",
                        params: {
                          requestId: request.id,
                        },
                      })
                    }
                  >
                    <View style={styles.requestIcon}>
                      <Ionicons name="home-outline" size={20} color="#0A9FB5" />
                    </View>

                    <View style={styles.requestInfo}>
                      <Text style={styles.requestTitle} numberOfLines={1}>
                        {request.serviceType}
                      </Text>

                      <View style={styles.requestMeta}>
                        <Ionicons
                          name="location-outline"
                          size={12}
                          color="#7B9199"
                        />

                        <Text style={styles.requestMetaText}>
                          {request.distance}
                        </Text>

                        <View style={styles.smallDivider} />

                        <Text style={styles.requestMetaText}>
                          {request.requestedAt}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.requestRight}>
                      <Text style={styles.requestPrice}>
                        ₹{request.offeredPrice.toLocaleString("en-IN")}
                      </Text>

                      <Text style={styles.viewRequestText}>View</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noRequestsCard}>
                <View style={styles.noRequestsIcon}>
                  <Ionicons name="search-outline" size={23} color="#0A9FB5" />
                </View>

                <View style={styles.noRequestsCopy}>
                  <Text style={styles.noRequestsTitle}>No new requests</Text>

                  <Text style={styles.noRequestsSubtitle}>
                    Stay available and we'll notify you when a nearby request
                    arrives.
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* =================================================
            SECURITY
        ================================================= */}

        {securityWallet && (
          <TouchableOpacity
            activeOpacity={0.88}
            style={[
              styles.securityCard,
              securityWallet.depositRequired && styles.securityCardAction,
            ]}
            onPress={() => router.push("/professional-wallet")}
          >
            <View
              style={[
                styles.securityIcon,
                securityWallet.depositRequired && styles.securityIconAction,
              ]}
            >
              <Ionicons
                name={
                  securityWallet.depositRequired
                    ? "alert-circle"
                    : "shield-checkmark"
                }
                size={23}
                color={securityWallet.depositRequired ? "#D97706" : "#0A9FB5"}
              />
            </View>

            <View style={styles.securityContent}>
              <View style={styles.securityTitleRow}>
                <Text style={styles.securityTitle}>Security balance</Text>

                {securityWallet.depositRequired && (
                  <View style={styles.actionBadge}>
                    <View style={styles.actionDot} />

                    <Text style={styles.actionBadgeText}>ACTION REQUIRED</Text>
                  </View>
                )}
              </View>

              <Text style={styles.securityAmount}>
                {formatCompactRupees(securityWallet.securityBalance)}
              </Text>

              <Text
                style={[
                  styles.securitySubtitle,
                  securityWallet.depositRequired &&
                    styles.securitySubtitleAction,
                ]}
              >
                {securityWallet.depositRequired
                  ? "Review your security balance to continue"
                  : "Security balance is up to date"}
              </Text>
            </View>

            <View style={styles.securityArrow}>
              {securityWallet.depositRequired ? (
                <View style={styles.reviewButton}>
                  <Text style={styles.reviewText}>Review</Text>

                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#7A9299" />
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* =================================================
            PERFORMANCE
        ================================================= */}

        <SectionHeader
          title="Your performance"
          subtitle="A quick look at your work"
        />

        <View style={styles.metricGrid}>
          <MetricCard
            icon="wallet-outline"
            value={`₹${lifetimeEarnings.toLocaleString("en-IN")}`}
            label="Lifetime earnings"
            tone="teal"
            onPress={() => router.push("/professional-wallet")}
          />

          <MetricCard
            icon="briefcase-outline"
            value={`${isPharmacist ? ordersFulfilled : servicesCompleted}`}
            label="Services provided"
            tone="blue"
          />

          <MetricCard
            icon="star"
            value={rating.toFixed(1)}
            label="Average rating"
            tone="gold"
          />

          <MetricCard
            icon="checkmark-circle-outline"
            value={`${isPharmacist ? fulfillmentRate : serviceCompletionRate}%`}
            label="Completion rate"
            tone="purple"
          />
        </View>

        {/* =================================================
            QUICK ACCESS
        ================================================= */}

        <SectionHeader
          title="Quick access"
          subtitle="Everything you may need during your day"
        />

        <View style={styles.quickActions}>
          <QuickAction
            icon="clipboard-outline"
            title="My Orders"
            subtitle="Manage services"
            onPress={() => router.push("/professional-requests")}
          />

          <QuickAction
            icon="wallet-outline"
            title="Earnings"
            subtitle="View wallet"
            onPress={() => router.push("/professional-wallet")}
          />

          <QuickAction
            icon="shield-checkmark-outline"
            title="Security"
            subtitle="Balance & deposit"
            onPress={() => router.push("/professional-wallet")}
            highlight={securityWallet?.depositRequired}
          />

          <QuickAction
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get assistance"
            onPress={() =>
              Alert.alert(
                "CareNow Support",
                "Please use the support channel provided by CareNow to contact our team.",
              )
            }
          />
        </View>

        {/* =================================================
            RECENT ACTIVITY
        ================================================= */}

        <View style={[styles.sectionHeader, styles.recentHeader]}>
          <View>
            <Text style={styles.sectionTitle}>Recent activity</Text>

            <Text style={styles.sectionSubtitle}>
              Your latest service updates
            </Text>
          </View>

          <TouchableOpacity
            style={styles.viewAllButton}
            activeOpacity={0.7}
            onPress={() => router.push("/professional-requests")}
          >
            <Text style={styles.viewAllText}>View all</Text>

            <Ionicons name="arrow-forward" size={16} color="#0A9FB5" />
          </TouchableOpacity>
        </View>

        {activityRequests.length > 0 ? (
          <View style={styles.activityList}>
            {activityRequests.map((request, index) => (
              <TouchableOpacity
                key={request.requestId}
                style={styles.activityCard}
                activeOpacity={0.85}
                onPress={() => {
                  if (
                    request.activityStatus === "ACCEPTED" ||
                    request.activityStatus === "EN_ROUTE" ||
                    request.activityStatus === "ARRIVED" ||
                    request.activityStatus === "IN_SERVICE"
                  ) {
                    router.push({
                      pathname: "/nurse-service-map",
                      params: {
                        requestId: request.requestId,
                      },
                    });
                  } else {
                    router.push({
                      pathname: "/professional-requests",
                      params: {
                        requestId: request.requestId,
                      },
                    });
                  }
                }}
              >
                <View style={styles.activityIcon}>
                  <Ionicons
                    name={
                      index === 0
                        ? "home-outline"
                        : index === 1
                          ? "medkit-outline"
                          : "pulse-outline"
                    }
                    size={20}
                    color="#0A9FB5"
                  />
                </View>

                <View style={styles.activityInfo}>
                  <Text style={styles.activityService} numberOfLines={1}>
                    {request.serviceType}
                  </Text>

                  <Text style={styles.activityPatient} numberOfLines={1}>
                    {request.patientName}
                  </Text>

                  <Text style={styles.activityTime}>
                    {formatRequestTime(request.activityAt)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.activityStatus,
                    request.activityStatus === "DECLINED" &&
                      styles.activityStatusDeclined,
                    request.activityStatus === "EXPIRED" &&
                      styles.activityStatusExpired,
                    request.activityStatus !== "DECLINED" &&
                      request.activityStatus !== "EXPIRED" &&
                      styles.activityStatusUpcoming,
                  ]}
                >
                  <Text
                    style={[
                      styles.activityStatusText,
                      request.activityStatus === "DECLINED" &&
                        styles.activityStatusDeclinedText,
                      request.activityStatus === "EXPIRED" &&
                        styles.activityStatusExpiredText,
                      request.activityStatus !== "DECLINED" &&
                        request.activityStatus !== "EXPIRED" &&
                        styles.activityStatusUpcomingText,
                    ]}
                  >
                    {activityStatusLabel(request.activityStatus)}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#7A929B" />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyActivity}>
            <View style={styles.emptyActivityIcon}>
              <Ionicons name="clipboard-outline" size={25} color="#0A9FB5" />
            </View>

            <Text style={styles.emptyActivityTitle}>No recent activity</Text>

            <Text style={styles.emptyActivitySubtitle}>
              New service requests and updates will appear here.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}

      <View
        style={[
          styles.bottomNav,
          {
            // Keep the app navigation above Android's system navigation area.
            // The bar is in normal layout flow, so dashboard content cannot
            // be hidden behind it.
            height: 68 + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <BottomNavItem icon="home" label="Home" active />

        <BottomNavItem
          icon="clipboard-outline"
          label="Orders"
          onPress={() => router.replace("/professional-requests")}
        />

        <BottomNavItem
          icon="person-outline"
          label="Profile"
          onPress={() => router.replace("/professional-profile")}
        />
      </View>
    </SafeAreaView>
  );
}

/*
 * =========================================================
 * SECTION HEADER
 * =========================================================
 */

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>

        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

/*
 * =========================================================
 * METRIC CARD
 * =========================================================
 */

function MetricCard({
  icon,
  value,
  label,
  tone,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  tone: "teal" | "gold" | "blue" | "purple";
  onPress?: () => void;
}) {
  const content = (
    <>
      <View
        style={[
          styles.metricIcon,
          tone === "gold"
            ? styles.metricIconGold
            : tone === "blue"
              ? styles.metricIconBlue
              : tone === "purple"
                ? styles.metricIconPurple
                : styles.metricIconTeal,
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
          color={
            tone === "gold"
              ? "#E69A16"
              : tone === "blue"
                ? "#2175D9"
                : tone === "purple"
                  ? "#8064D8"
                  : "#0A9FB5"
          }
        />
      </View>

      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>

      <Text style={styles.metricLabel} numberOfLines={2}>
        {label}
      </Text>

      {onPress && (
        <View style={styles.metricArrow}>
          <Ionicons name="arrow-forward" size={13} color="#0A9FB5" />
        </View>
      )}
    </>
  );

  const cardStyle = [
    styles.metricCard,
    tone === "gold"
      ? styles.metricGold
      : tone === "blue"
        ? styles.metricBlue
        : tone === "purple"
          ? styles.metricPurple
          : styles.metricTeal,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        activeOpacity={0.85}
        onPress={onPress}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{content}</View>;
}

/*
 * =========================================================
 * QUICK ACTION
 * =========================================================
 */

function QuickAction({
  icon,
  title,
  subtitle,
  onPress,
  highlight = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  highlight?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickAction, highlight && styles.quickActionHighlight]}
      activeOpacity={0.82}
      onPress={onPress}
    >
      <View
        style={[
          styles.quickActionIcon,
          highlight && styles.quickActionIconHighlight,
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
          color={highlight ? "#D97706" : "#0A9FB5"}
        />
      </View>

      <Text style={styles.quickActionTitle}>{title}</Text>

      <Text style={styles.quickActionSubtitle}>{subtitle}</Text>

      {highlight && <View style={styles.quickActionDot} />}
    </TouchableOpacity>
  );
}

/*
 * =========================================================
 * BOTTOM NAV
 * =========================================================
 */

function BottomNavItem({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.bottomNavItem}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color={active ? "#0A9FB5" : "#8299A3"} />

      <Text
        style={[styles.bottomNavLabel, active && styles.bottomNavLabelActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/*
 * =========================================================
 * REQUEST MAPPING
 * =========================================================
 */

function mapNurseRequest(request: {
  requestId: string;
  patientName: string;
  serviceType: string;
  distanceKm?: number | null;
  offeredPrice: number;
  requestedAt: string;
  priority: "NORMAL" | "URGENT";
  status?: ServiceRequest["status"];
}): ServiceRequest {
  return {
    id: request.requestId,
    serviceType: request.serviceType,
    patientName: request.patientName,
    distance:
      request.distanceKm == null
        ? "Distance unavailable"
        : `${request.distanceKm.toFixed(1)} km`,
    requestedAt: formatRequestTime(request.requestedAt),
    offeredPrice: request.offeredPrice,
    priority: request.priority,
    status: request.status,
  };
}

/*
 * =========================================================
 * ACTIVITY HELPERS
 * =========================================================
 */

function activityStatusLabel(status: string) {
  switch (status) {
    case "ACCEPTED":
      return "Accepted";

    case "EN_ROUTE":
      return "On the way";

    case "ARRIVED":
      return "Arrived";

    case "IN_SERVICE":
      return "In service";

    case "COMPLETED":
      return "Completed";

    case "OFFERED":
      return "New";

    case "DECLINED":
      return "Declined";

    case "EXPIRED":
      return "Expired";

    case "CANCELLED":
      return "Cancelled";

    default:
      return "Upcoming";
  }
}

function formatRequestTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return value;
  }

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

/*
 * =========================================================
 * PROFESSIONAL HELPERS
 * =========================================================
 */

function approvedStatus(value: "PENDING" | "APPROVED") {
  return value === "APPROVED";
}

function toNumber(value?: number | string | null) {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function availabilityLabel(status?: NurseAvailabilityStatus) {
  switch (status) {
    case "AVAILABLE":
      return "Online";

    case "BUSY":
      return "Busy";

    default:
      return "Offline";
  }
}

function availabilityColor(status?: NurseAvailabilityStatus) {
  switch (status) {
    case "AVAILABLE":
      return "#16A34A";

    case "BUSY":
      return "#F59E0B";

    default:
      return "#64748B";
  }
}

function formatCompactRupees(amount: number) {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  }

  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
  }

  return `₹${Math.round(amount)}`;
}

function formatProfessionalType(type: ProfessionalType) {
  switch (type) {
    case "NURSE":
      return "Nurse";

    case "HEALTH_WORKER":
    case "HEALTHCARE_WORKER":
      return "Health Worker";

    case "PHARMACIST":
      return "Pharmacist";

    default:
      return "Healthcare Professional";
  }
}

/*
 * =========================================================
 * STYLES
 * =========================================================
 */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FCFD",
  },

  container: {
    flex: 1,
    backgroundColor: "#F7FCFD",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 5,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7FCFD",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 12,
    color: "#64748B",
  },

  /*
   * HEADER
   */

  header: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 8,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E4F7F8",
    borderWidth: 1,
    borderColor: "#CDECEF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },

  headerInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 10,
  },

  greeting: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    color: "#102A35",
  },

  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4E6973",
  },

  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#D1DEE2",
    marginHorizontal: 8,
  },

  professionalType: {
    fontSize: 11,
    color: "#70858D",
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFECEE",
    alignItems: "center",
    justifyContent: "center",
  },

  notificationBadge: {
    position: "absolute",
    right: -1,
    top: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F7FCFD",
  },

  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  /*
   * AVAILABILITY
   */

  availabilityCard: {
    minHeight: 80,
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#DDECEE",
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  availabilityLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },

  availabilityIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  availabilityIconOnline: {
    backgroundColor: "#E7F9F1",
  },

  availabilityIconOffline: {
    backgroundColor: "#F1F5F7",
  },

  availabilityCopy: {
    flex: 1,
    marginLeft: 11,
  },

  availabilityTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#173541",
  },

  availabilitySubtitle: {
    fontSize: 10,
    lineHeight: 15,
    color: "#71868E",
    marginTop: 3,
  },

  switch: {
    width: 58,
    height: 34,
    borderRadius: 18,
    padding: 4,
    justifyContent: "center",
  },

  switchOn: {
    backgroundColor: "#0A9FB5",
  },

  switchOff: {
    backgroundColor: "#B8C7CC",
  },

  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 3,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    elevation: 2,
  },

  switchThumbOn: {
    alignSelf: "flex-end",
  },

  switchThumbOff: {
    alignSelf: "flex-start",
  },

  /*
   * PENDING
   */

  pendingCard: {
    minHeight: 70,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 16,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  pendingIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },

  pendingContent: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },

  pendingTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#92400E",
  },

  pendingSubtitle: {
    fontSize: 10,
    lineHeight: 14,
    color: "#A16207",
    marginTop: 3,
  },

  /*
   * SECTION
   */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#102A35",
  },

  sectionSubtitle: {
    fontSize: 10,
    color: "#71868E",
    marginTop: 3,
  },

  countBadge: {
    minWidth: 21,
    height: 21,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: "#E6F7F8",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 7,
  },

  countBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#0A8194",
  },

  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingBottom: 2,
  },

  viewAllText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0A9FB5",
  },

  requestsHeader: {
    marginTop: 2,
  },

  /*
   * ACTIVE SERVICE
   */

  activeServiceCard: {
    backgroundColor: "#0A8194",
    borderRadius: 18,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#0A8194",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  activeServiceTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  activeServiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  activeServiceInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  activeServiceTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  activeServicePatient: {
    fontSize: 10,
    color: "rgba(255,255,255,0.78)",
    marginTop: 3,
  },

  activeStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  activeStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A7F3D0",
    marginRight: 5,
  },

  activeStatusText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  activeServiceFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.16)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  activeServiceMeta: {
    flexDirection: "row",
    alignItems: "center",
  },

  activeServiceMetaText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.78)",
    marginLeft: 5,
  },

  openMapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  openMapText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#087486",
    marginRight: 5,
  },

  /*
   * REQUESTS
   */

  requestList: {
    gap: 9,
    marginBottom: 20,
  },

  requestCard: {
    minHeight: 76,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCECEE",
    paddingHorizontal: 11,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  requestIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#E8F8F8",
    alignItems: "center",
    justifyContent: "center",
  },

  requestInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },

  requestTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#183542",
  },

  requestMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  requestMetaText: {
    fontSize: 9,
    color: "#71868E",
    marginLeft: 3,
  },

  smallDivider: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#B7C6CA",
    marginHorizontal: 6,
  },

  requestRight: {
    alignItems: "flex-end",
  },

  requestPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: "#173B46",
  },

  viewRequestText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#0A9FB5",
    marginTop: 4,
  },

  noRequestsCard: {
    minHeight: 82,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DDECEE",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  noRequestsIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#E8F8F8",
    alignItems: "center",
    justifyContent: "center",
  },

  noRequestsCopy: {
    flex: 1,
    marginLeft: 10,
  },

  noRequestsTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#183542",
  },

  noRequestsSubtitle: {
    fontSize: 9,
    lineHeight: 14,
    color: "#71868E",
    marginTop: 3,
  },

  /*
   * SECURITY
   */

  securityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDECEF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 21,
  },

  securityCardAction: {
    backgroundColor: "#FFF9EA",
    borderColor: "#E7AE3D",
    borderWidth: 1.5,
  },

  securityIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9F8FA",
    marginRight: 11,
  },

  securityIconAction: {
    backgroundColor: "#FFECC1",
  },

  securityContent: {
    flex: 1,
    minWidth: 0,
  },

  securityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },

  securityTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5E777F",
  },

  securityAmount: {
    fontSize: 19,
    fontWeight: "900",
    color: "#173B46",
  },

  securitySubtitle: {
    fontSize: 10,
    color: "#7A9299",
    marginTop: 2,
  },

  securitySubtitleAction: {
    color: "#A15C00",
    fontWeight: "700",
  },

  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE6A8",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginLeft: 7,
  },

  actionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D97706",
    marginRight: 4,
  },

  actionBadgeText: {
    fontSize: 7.5,
    fontWeight: "900",
    color: "#975A00",
  },

  securityArrow: {
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D97706",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  reviewText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
    marginRight: 4,
  },

  /*
   * METRICS
   */

  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 21,
  },

  metricCard: {
    width: "48.6%",
    minHeight: 108,
    borderRadius: 16,
    padding: 12,
    marginBottom: 9,
    borderWidth: 1,
    position: "relative",
  },

  metricTeal: {
    backgroundColor: "#EAF9F7",
    borderColor: "#D3EFEB",
  },

  metricBlue: {
    backgroundColor: "#EEF6FF",
    borderColor: "#DCEBFA",
  },

  metricGold: {
    backgroundColor: "#FFF9E9",
    borderColor: "#F6E7BC",
  },

  metricPurple: {
    backgroundColor: "#F5F1FF",
    borderColor: "#E8DFFF",
  },

  metricIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  metricIconTeal: {
    backgroundColor: "#D7F2ED",
  },

  metricIconBlue: {
    backgroundColor: "#DDEEFF",
  },

  metricIconGold: {
    backgroundColor: "#FFF0C8",
  },

  metricIconPurple: {
    backgroundColor: "#EAE2FF",
  },

  metricValue: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "900",
    color: "#172F3B",
  },

  metricLabel: {
    fontSize: 10,
    lineHeight: 13,
    color: "#617982",
    marginTop: 2,
  },

  metricArrow: {
    position: "absolute",
    right: 11,
    top: 13,
  },

  /*
   * QUICK ACCESS
   */

  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  quickAction: {
    width: "48.6%",
    minHeight: 88,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DFECEE",
    paddingHorizontal: 11,
    paddingVertical: 11,
    marginBottom: 9,
    position: "relative",
  },

  quickActionHighlight: {
    backgroundColor: "#FFF9EA",
    borderColor: "#E7AE3D",
  },

  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#E8F8F8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },

  quickActionIconHighlight: {
    backgroundColor: "#FFECC1",
  },

  quickActionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#183542",
  },

  quickActionSubtitle: {
    fontSize: 8.5,
    color: "#81939A",
    marginTop: 2,
  },

  quickActionDot: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D97706",
  },

  /*
   * RECENT ACTIVITY
   */

  recentHeader: {
    marginTop: 1,
  },

  activityList: {
    gap: 9,
    marginBottom: 20,
  },

  activityCard: {
    minHeight: 70,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DFECEE",
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  activityIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#E8F8F8",
    alignItems: "center",
    justifyContent: "center",
  },

  activityInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 7,
  },

  activityService: {
    fontSize: 12,
    fontWeight: "800",
    color: "#183542",
  },

  activityPatient: {
    fontSize: 10,
    color: "#657D86",
    marginTop: 2,
  },

  activityTime: {
    fontSize: 9,
    color: "#8A9DA4",
    marginTop: 2,
  },

  activityStatus: {
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 6,
  },

  activityStatusUpcoming: {
    backgroundColor: "#E8F3FF",
  },

  activityStatusDeclined: {
    backgroundColor: "#FEF2F2",
  },

  activityStatusExpired: {
    backgroundColor: "#F1F5F9",
  },

  activityStatusText: {
    fontSize: 8,
    fontWeight: "800",
  },

  activityStatusUpcomingText: {
    color: "#2879E8",
  },

  activityStatusDeclinedText: {
    color: "#DC2626",
  },

  activityStatusExpiredText: {
    color: "#64748B",
  },

  emptyActivity: {
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DFECEE",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    paddingHorizontal: 20,
  },

  emptyActivityIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#E8F8F8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  emptyActivityTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#183542",
  },

  emptyActivitySubtitle: {
    fontSize: 10,
    color: "#71868E",
    textAlign: "center",
    marginTop: 3,
  },

  /*
   * BOTTOM NAV
   */

  bottomNav: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E1ECEE",
    paddingHorizontal: 18,
    paddingTop: 6,
    elevation: 14,
  },

  bottomNavItem: {
    flex: 1,
    height: 55,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomNavLabel: {
    fontSize: 9,
    color: "#8299A3",
    marginTop: 4,
    fontWeight: "600",
  },

  bottomNavLabelActive: {
    color: "#0A9FB5",
    fontWeight: "800",
  },
});
