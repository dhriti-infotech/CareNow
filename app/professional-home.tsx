import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AppUser,
  getSession,
  updateSessionStatus,
} from "../services/auth";

import { useAuth } from "../context/auth-context";

import {
  developmentProfessionalStats,
  ProfessionalStats,
  ProfessionalType,
} from "../services/professional-stats";

import {
  developmentPrescriptionOrders,
  developmentServiceRequests,
  PrescriptionOrder,
  ServiceRequest,
} from "../services/professional-requests";

export default function ProfessionalHomeScreen() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<AppUser | null>(null);

  const [status, setStatus] = useState<
    "PENDING" | "APPROVED"
  >("PENDING");

  const [loading, setLoading] = useState(true);

  /*
   * Load the logged-in professional.
   *
   * Existing APPROVED professional:
   *      directly open dashboard
   *
   * Newly registered PENDING professional:
   *      show pending
   *      automatically approve after 5 seconds
   */
  useEffect(() => {
    let timer:
      | ReturnType<typeof setTimeout>
      | undefined;

    const initializeProfessional = async () => {
      const session = await getSession();
      const fallbackProfessionalUser = authUser && authUser.role === "PROFESSIONAL"
        ? {
            id: String(authUser.id),
            name: authUser.email.split("@")[0] || "Professional",
            mobile: "",
            otp: "",
            role: "PROFESSIONAL" as const,
            status: "APPROVED",
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
        setLoading(false);

        return;
      }

      setStatus("PENDING");
      setLoading(false);

      timer = setTimeout(async () => {
        const updatedUser = await updateSessionStatus("APPROVED");

        if (updatedUser) {
          setUser(updatedUser);
        }

        setStatus("APPROVED");
      }, 5000);
    };

    initializeProfessional();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [authUser]);

  /*
   * Loading screen
   */
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text style={styles.loadingText}>
            Loading your dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const approved = status === "APPROVED";

  /*
   * Professional type
   */
  const professionalType =
    user?.professionalType as
      | ProfessionalType
      | undefined;

  const isPharmacist =
    professionalType === "PHARMACIST";

  const isServiceProfessional =
    professionalType === "NURSE" ||
    professionalType === "HEALTH_WORKER";

  /*
   * Get profession-specific sample statistics.
   *
   * user.id MUST match PRO001 / PRO002 / PRO003 / PRO004.
   */
  const dashboardStats: ProfessionalStats =
    (user?.id &&
      developmentProfessionalStats[user.id]) ||
    developmentProfessionalStats.PRO003;

  /*
   * Service completion percentage
   */
  const requestsReceived =
    dashboardStats.requestsReceived ?? 0;

  const servicesCompleted =
    dashboardStats.servicesCompleted ?? 0;

  const serviceCompletionRate =
    requestsReceived > 0
      ? Math.round(
          (servicesCompleted /
            requestsReceived) *
            100
        )
      : 0;

  /*
   * Pharmacist fulfillment percentage
   */
  const ordersReceived =
    dashboardStats.ordersReceived ?? 0;

  const ordersFulfilled =
    dashboardStats.ordersFulfilled ?? 0;

  const fulfillmentRate =
    ordersReceived > 0
      ? Math.round(
          (ordersFulfilled /
            ordersReceived) *
            100
        )
      : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              Welcome back
            </Text>

            <Text
              style={styles.name}
              numberOfLines={1}
            >
              {user?.name || "Professional"}
            </Text>

            {professionalType && (
              <Text style={styles.professionalType}>
                {formatProfessionalType(
                  professionalType
                )}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            activeOpacity={0.8}
            onPress={() =>
              router.push(
                "/professional-profile"
              )
            }
          >
            <Ionicons
              name="person-outline"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* ================================================= */}
        {/* AVAILABILITY */}
        {/* ================================================= */}

        {approved && (
          <View style={styles.availabilityCard}>
            <View
              style={styles.availabilityLeft}
            >
              <View
                style={styles.onlineDot}
              />

              <View>
                <Text
                  style={
                    styles.availabilityTitle
                  }
                >
                  You are Available
                </Text>

                <Text
                  style={
                    styles.availabilitySubtitle
                  }
                >
                  Ready to receive service
                  requests
                </Text>
              </View>
            </View>

            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#16A34A"
            />
          </View>
        )}

        {/* ================================================= */}
        {/* PENDING VERIFICATION */}
        {/* ================================================= */}

        {!approved && (
          <View style={styles.pendingCard}>
            <View style={styles.pendingIcon}>
              <Ionicons
                name="time-outline"
                size={22}
                color="#B45309"
              />
            </View>

            <View
              style={styles.pendingContent}
            >
              <Text
                style={styles.pendingTitle}
              >
                Verification in progress
              </Text>

              <Text
                style={
                  styles.pendingSubtitle
                }
              >
                Your professional profile is
                being verified.
              </Text>
            </View>

            <ActivityIndicator
              size="small"
              color="#F59E0B"
            />
          </View>
        )}

        {/* ================================================= */}
        {/* EARNINGS */}
        {/* ================================================= */}

        <Text style={styles.sectionTitle}>
          Earnings
        </Text>

        <View style={styles.earningsCard}>
          <View style={styles.earningsIcon}>
            <Ionicons
              name="wallet-outline"
              size={25}
              color="#2563EB"
            />
          </View>

          <View
            style={styles.earningsContent}
          >
            <Text
              style={styles.earningsLabel}
            >
              Lifetime Earnings
            </Text>

            <Text
              style={styles.earningsAmount}
            >
              ₹
              {dashboardStats.lifetimeEarnings.toLocaleString(
                "en-IN"
              )}
            </Text>

            <Text
              style={
                styles.earningsSubtext
              }
            >
              Total earnings from completed
              services
            </Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* NURSE / HEALTH WORKER */}
        {/* ================================================= */}

        {isServiceProfessional && (
          <>
            <Text
              style={styles.sectionTitle}
            >
              Service Activity
            </Text>

            <View style={styles.statsRow}>
              <StatCard
                icon="notifications-outline"
                value={
                  dashboardStats
                    .requestsReceived ?? 0
                }
                label="Requests Received"
              />

              <View
                style={styles.statsGap}
              />

              <StatCard
                icon="checkmark-circle-outline"
                value={
                  dashboardStats
                    .servicesCompleted ?? 0
                }
                label="Services Completed"
              />
            </View>

            <View
              style={styles.completionCard}
            >
              <View
                style={styles.completionHeader}
              >
                <View
                  style={
                    styles.completionText
                  }
                >
                  <Text
                    style={
                      styles.completionTitle
                    }
                  >
                    Service Completion Rate
                  </Text>

                  <Text
                    style={
                      styles.completionSubtitle
                    }
                  >
                    Completed services vs
                    received requests
                  </Text>
                </View>

                <Text
                  style={
                    styles.completionPercentage
                  }
                >
                  {serviceCompletionRate}%
                </Text>
              </View>

              <ProgressBar
                percentage={
                  serviceCompletionRate
                }
              />
            </View>
          </>
        )}

        {/* ================================================= */}
        {/* PHARMACIST */}
        {/* ================================================= */}

        {isPharmacist && (
          <>
            <Text
              style={styles.sectionTitle}
            >
              Medicine Orders
            </Text>

            <View style={styles.statsRow}>
              <StatCard
                icon="receipt-outline"
                value={
                  dashboardStats
                    .ordersReceived ?? 0
                }
                label="Orders Received"
              />

              <View
                style={styles.statsGap}
              />

              <StatCard
                icon="checkmark-circle-outline"
                value={
                  dashboardStats
                    .ordersFulfilled ?? 0
                }
                label="Orders Fulfilled"
              />
            </View>

            <View
              style={styles.statsRowSecond}
            >
              <StatCard
                icon="document-text-outline"
                value={
                  dashboardStats
                    .prescriptionsReceived ?? 0
                }
                label="Prescriptions Received"
              />

              <View
                style={styles.statsGap}
              />

              <StatCard
                icon="checkmark-done-outline"
                value={
                  dashboardStats
                    .ordersAccepted ?? 0
                }
                label="Orders Accepted"
              />
            </View>

            <View
              style={styles.completionCard}
            >
              <View
                style={styles.completionHeader}
              >
                <View
                  style={
                    styles.completionText
                  }
                >
                  <Text
                    style={
                      styles.completionTitle
                    }
                  >
                    Order Fulfillment Rate
                  </Text>

                  <Text
                    style={
                      styles.completionSubtitle
                    }
                  >
                    Fulfilled orders vs
                    received orders
                  </Text>
                </View>

                <Text
                  style={[
                    styles.completionPercentage,
                    styles.pharmacyPercentage,
                  ]}
                >
                  {fulfillmentRate}%
                </Text>
              </View>

              <ProgressBar
                percentage={fulfillmentRate}
                pharmacist
              />
            </View>
          </>
        )}

        {/* ================================================= */}
        {/* NEW SERVICE REQUESTS */}
        {/* ================================================= */}

        {approved &&
          isServiceProfessional && (
            <>
              <SectionHeader
                title="New Service Requests"
              />

              {developmentServiceRequests
                .slice(0, 3)
                .map((request) => (
                  <ServiceRequestCard
                    key={request.id}
                    request={request}
                  />
                ))}
            </>
          )}

        {/* ================================================= */}
        {/* NEW PRESCRIPTION ORDERS */}
        {/* ================================================= */}

        {approved && isPharmacist && (
          <>
            <SectionHeader
              title="New Prescription Orders"
            />

            {developmentPrescriptionOrders
              .slice(0, 3)
              .map((order) => (
                <PrescriptionOrderCard
                  key={order.id}
                  order={order}
                />
              ))}
          </>
        )}

        {/* ================================================= */}
        {/* RATING */}
        {/* ================================================= */}

        <Text style={styles.sectionTitle}>
          Your Rating
        </Text>

        <View style={styles.ratingCard}>
          <View style={styles.ratingScore}>
            <Text
              style={styles.ratingNumber}
            >
              {dashboardStats.rating.toFixed(
                1
              )}
            </Text>

            <View style={styles.stars}>
              {Array.from({
                length: 5,
              }).map((_, index) => (
                <Ionicons
                  key={index}
                  name={
                    index <
                    Math.round(
                      dashboardStats.rating
                    )
                      ? "star"
                      : "star-outline"
                  }
                  size={17}
                  color="#F59E0B"
                  style={styles.star}
                />
              ))}
            </View>

            <Text
              style={styles.ratingCount}
            >
              {dashboardStats.totalRatings}{" "}
              ratings
            </Text>
          </View>

          <View
            style={styles.ratingDivider}
          />

          <View
            style={styles.ratingMessage}
          >
            <Ionicons
              name="thumbs-up-outline"
              size={24}
              color="#16A34A"
            />

            <Text
              style={
                styles.ratingMessageText
              }
            >
              Great work! Keep providing
              excellent service.
            </Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* PENDING CHARGES */}
        {/* ================================================= */}

        <Text style={styles.sectionTitle}>
          Pending Charges
        </Text>

        <View style={styles.chargesCard}>
          <View style={styles.chargesHeader}>
            <View style={styles.chargesIcon}>
              <Ionicons
                name="receipt-outline"
                size={23}
                color="#DC2626"
              />
            </View>

            <View
              style={styles.chargesContent}
            >
              <Text
                style={styles.chargesTitle}
              >
                Payable to CareNow
              </Text>

              <Text
                style={
                  styles.chargesSubtitle
                }
              >
                Platform charges pending
                settlement
              </Text>
            </View>
          </View>

          <View
            style={styles.chargesBottom}
          >
            <Text
              style={styles.chargesAmount}
            >
              ₹
              {dashboardStats.pendingCharges.toLocaleString(
                "en-IN"
              )}
            </Text>

            <TouchableOpacity
              style={
                styles.viewChargesButton
              }
              activeOpacity={0.8}
              onPress={() => {}}
            >
              <Text
                style={
                  styles.viewChargesText
                }
              >
                View Details
              </Text>

              <Ionicons
                name="chevron-forward"
                size={15}
                color="#2563EB"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ================================================= */}
        {/* DEVELOPMENT NOTICE */}
        {/* ================================================= */}

        <View style={styles.devNotice}>
          <Ionicons
            name="construct-outline"
            size={16}
            color="#B45309"
          />

          <Text
            style={styles.devNoticeText}
          >
            Development mode — dashboard
            statistics and requests are sample
            data.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ========================================================= */
/* SECTION HEADER */
/* ========================================================= */

function SectionHeader({
  title,
}: {
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {}}
      >
        <Text style={styles.viewAllText}>
          View All
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ========================================================= */
/* STAT CARD */
/* ========================================================= */

function StatCard({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons
          name={icon}
          size={21}
          color="#2563EB"
        />
      </View>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

/* ========================================================= */
/* PROGRESS BAR */
/* ========================================================= */

function ProgressBar({
  percentage,
  pharmacist = false,
}: {
  percentage: number;
  pharmacist?: boolean;
}) {
  const safePercentage = Math.min(
    Math.max(percentage, 0),
    100
  );

  return (
    <View
      style={styles.progressBackground}
    >
      <View
        style={[
          styles.progressFill,
          pharmacist &&
            styles.pharmacyProgress,
          {
            width: `${safePercentage}%`,
          },
        ]}
      />
    </View>
  );
}

/* ========================================================= */
/* SERVICE REQUEST CARD */
/* ========================================================= */

function ServiceRequestCard({
  request,
}: {
  request: ServiceRequest;
}) {
  const urgent =
    request.priority === "URGENT";

  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestIcon}>
          <Ionicons
            name="medical-outline"
            size={22}
            color="#2563EB"
          />
        </View>

        <View
          style={
            styles.requestHeaderContent
          }
        >
          <Text
            style={styles.requestType}
          >
            {request.serviceType}
          </Text>

          <Text
            style={styles.requestId}
          >
            {request.id} •{" "}
            {request.requestedAt}
          </Text>
        </View>

        {urgent && (
          <View
            style={styles.urgentBadge}
          >
            <Text
              style={styles.urgentText}
            >
              URGENT
            </Text>
          </View>
        )}
      </View>

      <View
        style={styles.requestDetails}
      >
        <RequestDetail
          icon="person-outline"
          text={request.patientName}
        />

        <RequestDetail
          icon="location-outline"
          text={request.distance}
        />
      </View>

      <View
        style={styles.requestBottom}
      >
        <View>
          <Text
            style={styles.offeredLabel}
          >
            Offered Price
          </Text>

          <Text
            style={styles.offeredPrice}
          >
            ₹{request.offeredPrice}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.acceptButton}
          activeOpacity={0.8}
          onPress={() => {}}
        >
          <Text
            style={
              styles.acceptButtonText
            }
          >
            View & Accept
          </Text>

          <Ionicons
            name="arrow-forward"
            size={15}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ========================================================= */
/* PHARMACIST ORDER CARD */
/* ========================================================= */

function PrescriptionOrderCard({
  order,
}: {
  order: PrescriptionOrder;
}) {
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View
          style={styles.prescriptionIcon}
        >
          <Ionicons
            name="document-text-outline"
            size={22}
            color="#7C3AED"
          />
        </View>

        <View
          style={
            styles.requestHeaderContent
          }
        >
          <Text
            style={styles.requestType}
          >
            Prescription Order
          </Text>

          <Text
            style={styles.requestId}
          >
            {order.id} •{" "}
            {order.requestedAt}
          </Text>
        </View>

        <View style={styles.newBadge}>
          <Text
            style={styles.newBadgeText}
          >
            NEW
          </Text>
        </View>
      </View>

      <View
        style={styles.requestDetails}
      >
        <RequestDetail
          icon="person-outline"
          text={order.patientName}
        />

        <RequestDetail
          icon="medkit-outline"
          text={`${order.medicineCount} medicines`}
        />

        <RequestDetail
          icon="location-outline"
          text={order.distance}
        />
      </View>

      <View
        style={styles.requestBottom}
      >
        <View>
          <Text
            style={styles.offeredLabel}
          >
            Estimated Order
          </Text>

          <Text
            style={styles.offeredPrice}
          >
            ₹{order.estimatedAmount}
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.prescriptionButton
          }
          activeOpacity={0.8}
          onPress={() => {}}
        >
          <Ionicons
            name="document-text-outline"
            size={15}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.acceptButtonText
            }
          >
            View Prescription
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ========================================================= */
/* REQUEST DETAIL */
/* ========================================================= */

function RequestDetail({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.requestDetail}>
      <Ionicons
        name={icon}
        size={15}
        color="#64748B"
      />

      <Text
        style={styles.requestDetailText}
      >
        {text}
      </Text>
    </View>
  );
}

/* ========================================================= */
/* PROFESSIONAL TYPE */
/* ========================================================= */

function formatProfessionalType(
  type: ProfessionalType
) {
  switch (type) {
    case "NURSE":
      return "Nurse";

    case "HEALTH_WORKER":
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
    backgroundColor: "#F8FAFC",
  },

  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 35,
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

  /* Header */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
    marginRight: 15,
  },

  greeting: {
    fontSize: 12,
    color: "#64748B",
  },

  name: {
    fontSize: 23,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 3,
  },

  professionalType: {
    fontSize: 11,
    color: "#2563EB",
    fontWeight: "700",
    marginTop: 3,
  },

  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Availability */

  availabilityCard: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 13,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  availabilityLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#16A34A",
    marginRight: 10,
  },

  availabilityTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#15803D",
  },

  availabilitySubtitle: {
    fontSize: 10,
    color: "#166534",
    marginTop: 3,
  },

  /* Pending */

  pendingCard: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 13,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  pendingIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },

  pendingContent: {
    flex: 1,
    marginLeft: 10,
  },

  pendingTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#92400E",
  },

  pendingSubtitle: {
    fontSize: 10,
    color: "#A16207",
    marginTop: 3,
  },

  /* Section */

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 22,
    marginBottom: 10,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  viewAllText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB",
    marginTop: 22,
  },

  /* Earnings */

  earningsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  earningsIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  earningsContent: {
    flex: 1,
    marginLeft: 13,
  },

  earningsLabel: {
    fontSize: 11,
    color: "#64748B",
  },

  earningsAmount: {
    fontSize: 25,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 2,
  },

  earningsSubtext: {
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 3,
  },

  /* Stats */

  statsRow: {
    flexDirection: "row",
  },

  statsRowSecond: {
    flexDirection: "row",
    marginTop: 10,
  },

  statsGap: {
    width: 10,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
  },

  statIcon: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 9,
  },

  statLabel: {
    fontSize: 10,
    lineHeight: 14,
    color: "#64748B",
    marginTop: 2,
  },

  /* Completion */

  completionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 15,
    marginTop: 10,
  },

  completionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  completionText: {
    flex: 1,
    marginRight: 10,
  },

  completionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E293B",
  },

  completionSubtitle: {
    fontSize: 9,
    color: "#64748B",
    marginTop: 3,
  },

  completionPercentage: {
    fontSize: 20,
    fontWeight: "900",
    color: "#16A34A",
  },

  pharmacyPercentage: {
    color: "#7C3AED",
  },

  progressBackground: {
    height: 7,
    backgroundColor: "#E2E8F0",
    borderRadius: 5,
    marginTop: 13,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#16A34A",
    borderRadius: 5,
  },

  pharmacyProgress: {
    backgroundColor: "#7C3AED",
  },

  /* Request Cards */

  requestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 10,
  },

  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  requestIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  prescriptionIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  requestHeaderContent: {
    flex: 1,
    marginLeft: 10,
  },

  requestType: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E293B",
  },

  requestId: {
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 3,
  },

  urgentBadge: {
    backgroundColor: "#FEF2F2",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  urgentText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#DC2626",
  },

  newBadge: {
    backgroundColor: "#F3E8FF",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  newBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#7C3AED",
  },

  requestDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 13,
    gap: 12,
  },

  requestDetail: {
    flexDirection: "row",
    alignItems: "center",
  },

  requestDetailText: {
    fontSize: 10,
    color: "#475569",
    marginLeft: 4,
  },

  requestBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginTop: 13,
    paddingTop: 12,
  },

  offeredLabel: {
    fontSize: 9,
    color: "#64748B",
  },

  offeredPrice: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 2,
  },

  acceptButton: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  prescriptionButton: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: "#7C3AED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  acceptButtonText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    marginRight: 4,
  },

  /* Rating */

  ratingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  ratingScore: {
    alignItems: "center",
    minWidth: 95,
  },

  ratingNumber: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0F172A",
  },

  stars: {
    flexDirection: "row",
    marginTop: 3,
  },

  star: {
    marginHorizontal: 1,
  },

  ratingCount: {
    fontSize: 9,
    color: "#64748B",
    marginTop: 5,
  },

  ratingDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 15,
  },

  ratingMessage: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  ratingMessageText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: "#475569",
    marginLeft: 9,
  },

  /* Charges */

  chargesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 15,
  },

  chargesHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  chargesIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  chargesContent: {
    flex: 1,
    marginLeft: 11,
  },

  chargesTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E293B",
  },

  chargesSubtitle: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 3,
  },

  chargesBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginTop: 13,
    paddingTop: 13,
  },

  chargesAmount: {
    fontSize: 22,
    fontWeight: "900",
    color: "#DC2626",
  },

  viewChargesButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 9,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
  },

  viewChargesText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563EB",
    marginRight: 3,
  },

  /* Development */

  devNotice: {
    marginTop: 22,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  devNoticeText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 14,
    color: "#92400E",
    marginLeft: 7,
  },
});