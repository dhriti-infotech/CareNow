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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { getProfilePictureSource } from "@/api/profilePicture";
import { AppUser, getSession } from "@/services/auth";

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

import { useAuth } from "@/context/auth-context";

import { registerProfessionalPushNotifications } from "@/services/professional-notifications";

import {
  ServiceRequest
} from "@/services/professional-requests";

import type { ProfessionalType } from "@/services/professional-stats";

export default function ProfessionalHomeScreen() {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();

  const [user, setUser] = useState<AppUser | null>(null);

  const [status, setStatus] = useState<
    "PENDING" | "APPROVED"
  >("PENDING");

  const [loading, setLoading] = useState(true);

  const [serviceRequests, setServiceRequests] =
    useState<ServiceRequest[]>([]);

  const [nurseProfile, setNurseProfile] =
    useState<NurseProfile | null>(null);

  const [dashboard, setDashboard] =
    useState<NurseDashboard | null>(null);

  const [securityWallet, setSecurityWallet] =
    useState<NurseSecurityWallet | null>(null);

  const [availabilityUpdating, setAvailabilityUpdating] =
    useState(false);

  const [profilePictureSource, setProfilePictureSource] =
    useState<string | null>(null);

  /*
   * Load professional profile picture.
   */
  useFocusEffect(
    useCallback(() => {
      if (
        authUser?.role !== "PROFESSIONAL" ||
        !authUser.accountId
      ) {
        setProfilePictureSource(null);
        return undefined;
      }

      let active = true;

      void getProfilePictureSource(
        "PROFESSIONAL",
        Date.now()
      ).then((source) => {
        if (active) {
          setProfilePictureSource(source);
        }
      });

      return () => {
        active = false;
      };
    }, [authUser?.accountId, authUser?.role])
  );

  /*
   * Load professional dashboard.
   */
  useEffect(() => {
    let timer:
      | ReturnType<typeof setTimeout>
      | undefined;

    if (authUser?.role !== "PROFESSIONAL") {
      setLoading(false);
      setServiceRequests([]);
      setNurseProfile(null);
      setDashboard(null);
      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }

    const initializeProfessional = async () => {
      const session = await getSession();

      const fallbackProfessionalUser =
        authUser && authUser.role === "PROFESSIONAL"
          ? {
              id: authUser.accountId,
              name:
                authUser.email.split("@")[0] ||
                "Professional",
              mobile: "",
              otp: "",
              role: "PROFESSIONAL" as const,
              status:
                authUser.verificationStatus ||
                "PENDING",
              professionalType:
                authUser.professionalType ||
                "NURSE",
            }
          : null;

      const activeUser =
        session ?? fallbackProfessionalUser;

      if (!activeUser) {
        router.replace("/login");
        return;
      }

      setUser(activeUser);

      if (activeUser.status === "APPROVED") {
        setStatus("APPROVED");

        const activeProfessionalType =
          activeUser.professionalType;

        const isNurseServiceProfessional =
          activeProfessionalType === "NURSE" ||
          activeProfessionalType ===
            "HEALTHCARE_WORKER" ||
          activeProfessionalType ===
            "HEALTH_WORKER";

        if (isNurseServiceProfessional) {
          try {
            const [
              profile,
              dashboardData,
              requests,
              wallet,
            ] = await Promise.all([
              getNurseProfile(),
              getNurseDashboard(),
              getNurseRequests(),
              getNurseSecurityWallet(),
            ]);

            setNurseProfile(profile);
            setDashboard(dashboardData);
            setSecurityWallet(wallet);
            setServiceRequests(
              requests.map(mapNurseRequest)
            );
          } catch (error: any) {
            console.warn(
              "Unable to load nurse profile/service requests",
              error
            );
          }
        }

        setLoading(false);
        return;
      }

      setStatus("PENDING");

      const pendingProfessionalType =
        activeUser.professionalType;

      const isPendingNurse =
        pendingProfessionalType === "NURSE" ||
        pendingProfessionalType ===
          "HEALTHCARE_WORKER" ||
        pendingProfessionalType ===
          "HEALTH_WORKER";

      if (isPendingNurse) {
        try {
          setSecurityWallet(
            await getNurseSecurityWallet()
          );
        } catch (error) {
          console.warn(
            "Unable to load professional security wallet",
            error
          );
        }
      }

      setLoading(false);
    };

    initializeProfessional();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [authUser]);

  /*
   * Register professional push notifications.
   */
  useEffect(() => {
    if (
      authUser?.role !== "PROFESSIONAL" ||
      status !== "APPROVED"
    ) {
      return;
    }

    void registerProfessionalPushNotifications();
  }, [authUser?.role, status]);

  /*
   * Keep professional GPS location updated.
   */
  useEffect(() => {
    if (
      authUser?.role !== "PROFESSIONAL" ||
      status !== "APPROVED"
    ) {
      return;
    }

    if (
      nurseProfile?.availabilityStatus !==
        "AVAILABLE" &&
      nurseProfile?.availabilityStatus !== "BUSY"
    ) {
      return;
    }

    let cancelled = false;

    let subscription:
      | Location.LocationSubscription
      | null = null;

    const startLocationUpdates = async () => {
      try {
        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (
          permission.status !==
          Location.PermissionStatus.GRANTED
        ) {
          console.warn(
            "Location permission is required for live nurse tracking"
          );
          return;
        }

        if (cancelled) {
          return;
        }

        subscription =
          await Location.watchPositionAsync(
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
                console.warn(
                  "Unable to update nurse live location",
                  error
                );
              });
            }
          );
      } catch (error) {
        console.warn(
          "Unable to start nurse location tracking",
          error
        );
      }
    };

    void startLocationUpdates();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [
    authUser?.role,
    status,
    nurseProfile?.availabilityStatus,
  ]);

  /*
   * Refresh requests and dashboard.
   */
  useEffect(() => {
    if (
      authUser?.role !== "PROFESSIONAL"
    ) {
      return;
    }

    if (
      !approvedStatus(status) ||
      nurseProfile?.availabilityStatus !==
        "AVAILABLE"
    ) {
      return;
    }

    let cancelled = false;

    const refreshRequests = async () => {
      try {
        const [
          requests,
          dashboardData,
        ] = await Promise.all([
          getNurseRequests(),
          getNurseDashboard(),
        ]);

        if (!cancelled) {
          setServiceRequests(
            requests.map(mapNurseRequest)
          );

          setDashboard(dashboardData);

          setNurseProfile((current) =>
            current
              ? {
                  ...current,
                  availabilityStatus:
                    dashboardData.availabilityStatus,
                }
              : current
          );
        }
      } catch (error) {
        console.warn(
          "Unable to refresh nurse dashboard data",
          error
        );
      }
    };

    const interval = setInterval(
      refreshRequests,
      5000
    );

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    authUser?.role,
    status,
    nurseProfile?.availabilityStatus,
  ]);

  /*
   * Show only the latest 3 activities.
   */
  const activityRequests = useMemo(() => {
    const activities =
      dashboard?.recentActivities ?? [];

    if (activities.length <= 3) {
      return activities;
    }

    return activities.slice(0, 3);
  }, [dashboard]);

  /*
   * Loading.
   */
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#0A9FB5"
          />

          <Text style={styles.loadingText}>
            Loading your dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * Don't render professional dashboard for a user account.
   */
  if (authUser?.role !== "PROFESSIONAL") {
    return null;
  }

  const approved =
    status === "APPROVED";

  const professionalType =
    user?.professionalType as
      | ProfessionalType
      | undefined;

  const isPharmacist =
    professionalType === "PHARMACIST";

  /*
   * Dashboard metrics.
   */
  const servicesCompleted =
    dashboard?.serviceActivity
      .servicesCompleted ?? 0;

  const serviceCompletionRate =
    dashboard?.serviceActivity
      .completionRate ?? 0;

  const lifetimeEarnings =
    dashboard?.earnings.lifetime ?? 0;

  const rating =
    dashboard?.rating.average ?? 0;

  const ordersFulfilled = 0;
  const fulfillmentRate = 0;

  /*
   * Availability.
   */
  const handleAvailabilityChange = async (
    nextStatus: NurseAvailabilityStatus
  ) => {
    if (
      !nurseProfile ||
      availabilityUpdating ||
      nurseProfile.availabilityStatus ===
        nextStatus
    ) {
      return;
    }

    setAvailabilityUpdating(true);

    try {
      let latitude = toNumber(
        nurseProfile.latitude
      );

      let longitude = toNumber(
        nurseProfile.longitude
      );

      if (
        nextStatus === "AVAILABLE" &&
        (latitude == null ||
          longitude == null)
      ) {
        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (
          permission.status !==
          Location.PermissionStatus.GRANTED
        ) {
          Alert.alert(
            "Location required",
            "Please allow location access so CareNow can match nearby service requests."
          );

          return;
        }

        const position =
          await Location.getCurrentPositionAsync(
            {}
          );

        latitude =
          position.coords.latitude;

        longitude =
          position.coords.longitude;
      }

      const updated =
        await updateNurseAvailability({
          availabilityStatus: nextStatus,
          latitude,
          longitude,
          serviceRadiusKm:
            toNumber(
              nurseProfile.serviceRadiusKm
            ) ?? 10,
        });

      setNurseProfile(updated);

      if (
        nextStatus === "AVAILABLE"
      ) {
        const requests =
          await getNurseRequests();

        setServiceRequests(
          requests.map(mapNurseRequest)
        );
      } else {
        setServiceRequests([]);
      }
    } catch (error: any) {
      Alert.alert(
        "Unable to update availability",
        error?.message ??
          "Please try again."
      );
    } finally {
      setAvailabilityUpdating(false);
    }
  };

  const displayName =
    user?.name || "Professional";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 92 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <View style={styles.topHeader}>
          <View
            style={styles.profileSummary}
          >
            <TouchableOpacity
              style={styles.avatarWrap}
              activeOpacity={0.8}
              onPress={() =>
                router.push(
                  "/professional-profile"
                )
              }
            >
              {profilePictureSource ? (
                <Image
                  source={
                    profilePictureSource
                  }
                  style={
                    styles.avatarImage
                  }
                  contentFit="cover"
                  onError={() =>
                    setProfilePictureSource(
                      null
                    )
                  }
                />
              ) : (
                <Ionicons
                  name="person"
                  size={31}
                  color="#0A9FB5"
                />
              )}
            </TouchableOpacity>

            <View
              style={
                styles.headerIdentity
              }
            >
              <Text
                style={styles.welcome}
              >
                Hi, {displayName}!
              </Text>

              <View
                style={styles.onlineRow}
              >
                <View
                  style={[
                    styles.onlineDot,
                    availabilityDotStyle(
                      nurseProfile?.availabilityStatus
                    ),
                  ]}
                />

                <Text
                  style={
                    styles.onlineText
                  }
                >
                  {availabilityLabel(
                    nurseProfile?.availabilityStatus
                  )}
                </Text>
              </View>

              <Text
                style={
                  styles.professionalType
                }
              >
                {formatProfessionalType(
                  professionalType ||
                    "NURSE"
                )}
              </Text>
            </View>
          </View>

          {/* Zepto-style compact header actions */}
          <View
            style={styles.headerActions}
          >
            {securityWallet && (
              <TouchableOpacity
                style={[
                  styles.walletPill,
                  securityWallet.depositRequired &&
                    styles.walletPillWarning,
                ]}
                activeOpacity={0.85}
                onPress={() =>
                  router.push(
                    "/professional-wallet"
                  )
                }
              >
                <View
                  style={[
                    styles.walletPillIcon,
                    securityWallet.depositRequired &&
                      styles.walletPillIconWarning,
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={17}
                    color={
                      securityWallet.depositRequired
                        ? "#B45309"
                        : "#FFFFFF"
                    }
                  />
                </View>

                <View
                  style={
                    styles.walletPillTextWrap
                  }
                >
                  <Text
                    style={[
                      styles.walletPillLabel,
                      securityWallet.depositRequired &&
                        styles.walletPillLabelWarning,
                    ]}
                  >
                    Security
                  </Text>

                  <Text
                    style={[
                      styles.walletPillBalance,
                      securityWallet.depositRequired &&
                        styles.walletPillBalanceWarning,
                    ]}
                    numberOfLines={1}
                  >
                    {formatCompactRupees(
                      securityWallet.securityBalance
                    )}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={
                styles.notificationButton
              }
              activeOpacity={0.8}
              onPress={() =>
                router.push(
                  "/professional-requests"
                )
              }
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#173B46"
              />

              <View
                style={
                  styles.notificationBadge
                }
              >
                <Text
                  style={
                    styles.notificationBadgeText
                  }
                >
                  {Math.min(
                    serviceRequests.length,
                    9
                  )}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ================================================= */}
        {/* AVAILABILITY */}
        {/* ================================================= */}

        {approved && (
          <View
            style={
              styles.availabilityCard
            }
          >
            <View
              style={
                styles.availabilityTopRow
              }
            >
              <View
                style={
                  styles.availabilityCopy
                }
              >
                <View
                  style={
                    styles.availableLine
                  }
                >
                  <View
                    style={
                      styles.availableDot
                    }
                  />

                  <Text
                    style={
                      styles.availableTitle
                    }
                  >
                    Available for new
                    requests
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.bigSwitch,
                  nurseProfile?.availabilityStatus !==
                    "AVAILABLE" &&
                    styles.bigSwitchOff,
                ]}
                activeOpacity={0.9}
                disabled={
                  availabilityUpdating
                }
                onPress={() =>
                  handleAvailabilityChange(
                    nurseProfile?.availabilityStatus ===
                      "AVAILABLE"
                      ? "OFFLINE"
                      : "AVAILABLE"
                  )
                }
              >
                <View
                  style={[
                    styles.switchThumb,
                    nurseProfile?.availabilityStatus !==
                      "AVAILABLE" &&
                      styles.switchThumbOff,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================================================= */}
        {/* PENDING */}
        {/* ================================================= */}

        {!approved && (
          <View
            style={styles.pendingCard}
          >
            <Ionicons
              name="time-outline"
              size={22}
              color="#B45309"
            />

            <View
              style={styles.pendingContent}
            >
              <Text
                style={
                  styles.pendingTitle
                }
              >
                Verification in progress
              </Text>

              <Text
                style={
                  styles.pendingSubtitle
                }
              >
                Your professional profile
                is being verified.
              </Text>
            </View>

            <ActivityIndicator
              size="small"
              color="#F59E0B"
            />
          </View>
        )}

        {/* ================================================= */}
        {/* METRICS */}
        {/* ================================================= */}

        <View
          style={styles.metricGrid}
        >
          <MetricCard
            icon="wallet-outline"
            value={`₹${lifetimeEarnings.toLocaleString(
              "en-IN"
            )}`}
            label="Lifetime Earnings"
            tone="teal"
          />

          <MetricCard
            icon="clipboard-outline"
            value={`${
              isPharmacist
                ? ordersFulfilled
                : servicesCompleted
            }`}
            label="Services Provided"
            tone="teal"
          />

          <MetricCard
            icon="star"
            value={rating.toFixed(1)}
            label="Avg. Rating"
            tone="gold"
          />

          <MetricCard
            icon="checkmark-circle-outline"
            value={`${
              isPharmacist
                ? fulfillmentRate
                : serviceCompletionRate
            }%`}
            label="Completion Rate"
            tone="blue"
          />
        </View>

        {/* ================================================= */}
        {/* TODAY'S ACTIVITY */}
        {/* ================================================= */}

        <View
          style={styles.activityHeader}
        >
          <Text
            style={styles.activityTitle}
          >
            Today's Activity
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/professional-requests"
              )
            }
            style={styles.viewAllRow}
          >
            <Text
              style={styles.viewAllText}
            >
              View All
            </Text>

            <Ionicons
              name="arrow-forward"
              size={17}
              color="#0A9FB5"
            />
          </TouchableOpacity>
        </View>

        <View
          style={styles.activityList}
        >
          {activityRequests.map(
            (request, index) => (
              <TouchableOpacity
                key={request.requestId}
                style={
                  styles.activityCard
                }
                activeOpacity={0.85}
                onPress={() => {
                  if (
                    request.requestStatus ===
                      "ACCEPTED" ||
                    request.requestStatus ===
                      "EN_ROUTE" ||
                    request.requestStatus ===
                      "ARRIVED" ||
                    request.requestStatus ===
                      "IN_SERVICE"
                  ) {
                    router.push({
                      pathname:
                        "/nurse-service-map",
                      params: {
                        requestId:
                          request.requestId,
                      },
                    });
                  } else {
                    router.push({
                      pathname:
                        "/professional-requests",
                      params: {
                        requestId:
                          request.requestId,
                      },
                    });
                  }
                }}
              >
                <View
                  style={
                    styles.activityIcon
                  }
                >
                  <Ionicons
                    name={
                      index === 0
                        ? "home-outline"
                        : index === 1
                        ? "medkit-outline"
                        : "pulse-outline"
                    }
                    size={23}
                    color="#0A9FB5"
                  />
                </View>

                <View
                  style={
                    styles.activityInfo
                  }
                >
                  <Text
                    style={
                      styles.activityService
                    }
                    numberOfLines={1}
                  >
                    {request.serviceType}
                  </Text>

                  <Text
                    style={
                      styles.activityPatient
                    }
                    numberOfLines={1}
                  >
                    {request.patientName}
                  </Text>

                  <Text
                    style={
                      styles.activityTime
                    }
                  >
                    {formatRequestTime(
                      request.activityAt
                    )}
                  </Text>
                </View>

                <View
                  style={[
                    styles.activityStatus,
                    request.activityStatus ===
                      "DECLINED" &&
                      styles.activityStatusDeclined,
                    request.activityStatus ===
                      "EXPIRED" &&
                      styles.activityStatusExpired,
                    request.activityStatus !==
                      "DECLINED" &&
                      request.activityStatus !==
                        "EXPIRED" &&
                      styles.activityStatusUpcoming,
                  ]}
                >
                  <Text
                    style={[
                      styles.activityStatusText,
                      request.activityStatus ===
                        "DECLINED" &&
                        styles.activityStatusDeclinedText,
                      request.activityStatus ===
                        "EXPIRED" &&
                        styles.activityStatusExpiredText,
                      request.activityStatus !==
                        "DECLINED" &&
                        request.activityStatus !==
                          "EXPIRED" &&
                        styles.activityStatusUpcomingText,
                    ]}
                  >
                    {activityStatusLabel(
                      request.activityStatus
                    )}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color="#2D7481"
                />
              </TouchableOpacity>
            )
          )}
        </View>

        {/* ================================================= */}
        {/* CARENOW BANNER */}
        {/* ================================================= */}

        <View
          style={styles.careBanner}
        >
          <Image
            source={require(
              "@/assets/images/professional-home-img-1.png"
            )}
            style={
              styles.careBannerImage
            }
            contentFit="cover"
          />

          <View
            style={
              styles.careBannerOverlay
            }
          />

          <View
            style={styles.bannerArrow}
          >
            <Ionicons
              name="arrow-forward"
              size={18}
              color="#173B46"
            />
          </View>
        </View>
      </ScrollView>

      {/* ================================================= */}
      {/* BOTTOM NAVIGATION */}
      {/* ================================================= */}

      <View
        style={[
          styles.bottomNav,
          { bottom: insets.bottom },
        ]}
      >
        <BottomNavItem
          icon="home"
          label="Home"
          active
        />

        <BottomNavItem
          icon="clipboard-outline"
          label="Requests"
          onPress={() =>
            router.replace(
              "/professional-requests"
            )
          }
        />

        <BottomNavItem
          icon="wallet-outline"
          label="Earnings"
          onPress={() =>
            router.replace(
              "/professional-wallet"
            )
          }
        />

        <BottomNavItem
          icon="chatbubble-outline"
          label="Messages"
          badge="3"
        />

        <BottomNavItem
          icon="person-outline"
          label="Profile"
          onPress={() =>
            router.replace(
              "/professional-profile"
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

/* ========================================================= */
/* METRIC CARD */
/* ========================================================= */

function MetricCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  tone: "teal" | "gold" | "blue";
}) {
  return (
    <View
      style={[
        styles.metricCard,
        tone === "gold"
          ? styles.metricGold
          : tone === "blue"
          ? styles.metricBlue
          : styles.metricTeal,
      ]}
    >
      <View
        style={[
          styles.metricIcon,
          tone === "gold"
            ? styles.metricIconGold
            : tone === "blue"
            ? styles.metricIconBlue
            : styles.metricIconTeal,
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={
            tone === "gold"
              ? "#F4A62A"
              : tone === "blue"
              ? "#2175D9"
              : "#0A9FB5"
          }
        />
      </View>

      <Text
        style={styles.metricValue}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      <Text
        style={styles.metricLabel}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}

/* ========================================================= */
/* BOTTOM NAV ITEM */
/* ========================================================= */

function BottomNavItem({
  icon,
  label,
  active = false,
  badge,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  badge?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.bottomNavItem}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View>
        <Ionicons
          name={icon}
          size={22}
          color={
            active
              ? "#0A9FB5"
              : "#6F8D99"
          }
        />

        {badge && (
          <View
            style={styles.navBadge}
          >
            <Text
              style={
                styles.navBadgeText
              }
            >
              {badge}
            </Text>
          </View>
        )}
      </View>

      <Text
        style={[
          styles.bottomNavLabel,
          active &&
            styles.bottomNavLabelActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ========================================================= */
/* REQUEST MAPPING */
/* ========================================================= */

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
    serviceType:
      request.serviceType,
    patientName:
      request.patientName,
    distance:
      request.distanceKm == null
        ? "Distance unavailable"
        : `${request.distanceKm.toFixed(
            1
          )} km`,
    requestedAt:
      formatRequestTime(
        request.requestedAt
      ),
    offeredPrice:
      request.offeredPrice,
    priority:
      request.priority,
    status:
      request.status,
  };
}

/* ========================================================= */
/* ACTIVITY HELPERS */
/* ========================================================= */

function activityStatusLabel(
  status: string
) {
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

function formatRequestTime(
  value: string
) {
  const timestamp =
    new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return value;
  }

  const minutes = Math.max(
    0,
    Math.floor(
      (Date.now() - timestamp) /
        60000
    )
  );

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  return `${Math.floor(
    hours / 24
  )} day ago`;
}

/* ========================================================= */
/* PROFESSIONAL HELPERS */
/* ========================================================= */

function approvedStatus(
  value: "PENDING" | "APPROVED"
) {
  return value === "APPROVED";
}

function toNumber(
  value?: number | string | null
) {
  if (
    value == null ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function availabilityLabel(
  status?: NurseAvailabilityStatus
) {
  switch (status) {
    case "AVAILABLE":
      return "Online";

    case "BUSY":
      return "Busy";

    default:
      return "Offline";
  }
}

function availabilityColor(
  status?: NurseAvailabilityStatus
) {
  switch (status) {
    case "AVAILABLE":
      return "#16A34A";

    case "BUSY":
      return "#F59E0B";

    default:
      return "#64748B";
  }
}

function availabilityDotStyle(
  status?: NurseAvailabilityStatus
) {
  return {
    backgroundColor:
      availabilityColor(status),
  };
}

/*
 * Compact wallet display:
 *
 * 100000 → ₹1L
 * 50000  → ₹50K
 * 1500   → ₹1.5K
 * 500    → ₹500
 */
function formatCompactRupees(
  amount: number
) {
  if (amount >= 100000) {
    return `₹${(
      amount / 100000
    ).toFixed(
      amount % 100000 === 0
        ? 0
        : 1
    )}L`;
  }

  if (amount >= 1000) {
    return `₹${(
      amount / 1000
    ).toFixed(
      amount % 1000 === 0
        ? 0
        : 1
    )}K`;
  }

  return `₹${Math.round(
    amount
  )}`;
}

function formatProfessionalType(
  type: ProfessionalType
) {
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

/* ========================================================= */
/* STYLES */
/* ========================================================= */

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
    paddingTop: 8,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 12,
    color: "#64748B",
  },

  /* ======================================================= */
  /* HEADER */
  /* ======================================================= */

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 14,
  },

  profileSummary: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#DCEEF2",
    borderWidth: 1,
    borderColor: "#C9E3E8",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
  },

  headerIdentity: {
    marginLeft: 12,
    flex: 1,
  },

  welcome: {
    fontSize: 21,
    fontWeight: "800",
    color: "#10283A",
  },

  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  onlineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 7,
  },

  onlineText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16A765",
  },

  professionalType: {
    fontSize: 13,
    color: "#6C8296",
    marginTop: 2,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },

  /*
   * Compact Zepto-inspired wallet pill.
   */
  walletPill: {
    minWidth: 82,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#173B46",
    paddingLeft: 7,
    paddingRight: 11,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#173B46",
    shadowOpacity: 0.12,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  walletPillWarning: {
    backgroundColor: "#FFF7E6",
    borderWidth: 1,
    borderColor: "#F4D89B",
  },

  walletPillIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0A9FB5",
    alignItems: "center",
    justifyContent: "center",
  },

  walletPillIconWarning: {
    backgroundColor: "#FDE7B0",
  },

  walletPillTextWrap: {
    marginLeft: 6,
    minWidth: 34,
  },

  walletPillLabel: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "800",
    color: "#B9E8ED",
  },

  walletPillLabelWarning: {
    color: "#9A6700",
  },

  walletPillBalance: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  walletPillBalanceWarning: {
    color: "#8A5A00",
  },

  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F8F8",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  notificationBadge: {
    position: "absolute",
    right: -1,
    top: -1,
    minWidth: 21,
    height: 21,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: "#F04444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F7FCFD",
  },

  notificationBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "800",
  },

  /* ======================================================= */
  /* AVAILABILITY */
  /* ======================================================= */

  availabilityCard: {
    backgroundColor: "#E9FAF7",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 18,
  },

  availabilityTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  availabilityCopy: {
    flex: 1,
  },

  availableLine: {
    flexDirection: "row",
    alignItems: "center",
  },

  availableDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#20B66B",
    marginRight: 10,
  },

  availableTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#173B46",
  },

  bigSwitch: {
    width: 70,
    height: 42,
    borderRadius: 22,
    backgroundColor: "#0A9FB5",
    padding: 4,
    justifyContent: "center",
  },

  bigSwitchOff: {
    backgroundColor: "#B9CBD0",
  },

  switchThumb: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-end",

    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 3,
    shadowOffset: {
      width: 0,
      height: 1,
    },

    elevation: 2,
  },

  switchThumbOff: {
    alignSelf: "flex-start",
  },

  /* ======================================================= */
  /* PENDING */
  /* ======================================================= */

  pendingCard: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  pendingContent: {
    flex: 1,
    marginLeft: 10,
  },

  pendingTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#92400E",
  },

  pendingSubtitle: {
    fontSize: 11,
    color: "#A16207",
    marginTop: 3,
  },

  /* ======================================================= */
  /* METRICS */
  /* ======================================================= */

  metricGrid: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 24,
  },

  metricCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 13,
    paddingVertical: 12,
    paddingHorizontal: 7,
    alignItems: "center",
    borderWidth: 1,
  },

  metricTeal: {
    backgroundColor: "#E8FAF6",
    borderColor: "#D2F0EA",
  },

  metricGold: {
    backgroundColor: "#FFF9EA",
    borderColor: "#F6E8BE",
  },

  metricBlue: {
    backgroundColor: "#EDF6FF",
    borderColor: "#DCEBFA",
  },

  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },

  metricIconTeal: {
    backgroundColor: "#D7F3ED",
  },

  metricIconGold: {
    backgroundColor: "#FFF0C8",
  },

  metricIconBlue: {
    backgroundColor: "#DDEEFF",
  },

  metricValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#13273A",
    textAlign: "center",
    maxWidth: "100%",
  },

  metricLabel: {
    fontSize: 9,
    lineHeight: 12,
    color: "#4F687A",
    textAlign: "center",
    marginTop: 3,
  },

  /* ======================================================= */
  /* ACTIVITY */
  /* ======================================================= */

  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 11,
  },

  activityTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#10283A",
  },

  viewAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  viewAllText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0A9FB5",
  },

  activityList: {
    gap: 9,
  },

  activityCard: {
    minHeight: 68,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E1EEF0",
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#0A7F8E",
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 1,
  },

  activityIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E6F8F7",
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
    color: "#183247",
  },

  activityPatient: {
    fontSize: 10,
    color: "#607A8C",
    marginTop: 2,
  },

  activityTime: {
    fontSize: 9,
    color: "#7690A0",
    marginTop: 1,
  },

  activityStatus: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    fontSize: 9,
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

  /* ======================================================= */
  /* BANNER */
  /* ======================================================= */

  careBanner: {
    height: 126,
    borderRadius: 15,
    overflow: "hidden",
    marginTop: 16,
    position: "relative",
    backgroundColor: "#DDF6F5",
  },

  careBannerImage: {
    width: "100%",
    height: "100%",
  },

  careBannerOverlay: {
    position: "absolute",
    left: 16,
    top: 31,
  },

  bannerArrow: {
    position: "absolute",
    right: 12,
    bottom: 13,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ======================================================= */
  /* BOTTOM NAVIGATION */
  /* ======================================================= */

  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2EFF1",
    paddingHorizontal: 6,
    paddingTop: 9,
    paddingBottom: 8,
    zIndex: 20,
    elevation: 12,
  },

  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },

  bottomNavLabel: {
    fontSize: 9,
    color: "#6F8D99",
    marginTop: 4,
  },

  bottomNavLabelActive: {
    color: "#0A9FB5",
    fontWeight: "800",
  },

  navBadge: {
    position: "absolute",
    right: -9,
    top: -6,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#F04444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },

  navBadgeText: {
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "800",
  },
});