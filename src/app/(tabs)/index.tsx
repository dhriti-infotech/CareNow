import { useAuth } from "@/context/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getProfilePictureSource } from "@/api/profilePicture";

const quickServices = [
  {
    title: "Nurse at Home",
    subtitle: "Professional care",
    icon: "medkit-outline" as const,
    route: "/request-nurse",
  },
  {
    title: "Injection Service",
    subtitle: "With prescription",
    icon: "fitness-outline" as const,
    route: "/services",
  },
  {
    title: "Prescription Medicines",
    subtitle: "Delivered to you",
    icon: "medical-outline" as const,
    route: "/services",
  },
  {
    title: "Medical Equipment",
    subtitle: "Buy or rent",
    icon: "bandage-outline" as const,
    route: "/services",
  },
];

export default function HomeScreen() {
  const { user } = useAuth();

  const [profilePicture, setProfilePicture] =
    useState<Awaited<ReturnType<typeof getProfilePictureSource>>>(null);

  const [profilePictureLoading, setProfilePictureLoading] = useState(true);
  const [locationText, setLocationText] = useState("Select your location");
  const [locationLoading, setLocationLoading] = useState(false);

  const loadProfilePicture = useCallback(async () => {
    try {
      setProfilePictureLoading(true);

      const source = await getProfilePictureSource("USER", Date.now());

      setProfilePicture(source);
    } catch {
      setProfilePicture(null);
    } finally {
      setProfilePictureLoading(false);
    }
  }, []);

  const detectCurrentLocation = useCallback(async () => {
    try {
      setLocationLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location permission required",
          "Please allow CareNow to use your location so we can show your current location.",
        );
        return;
      }

      try {
        await Location.enableNetworkProviderAsync();
      } catch {
        // Continue with available device location provider.
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = currentLocation.coords;

      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const place = addresses[0];

        const primary =
          place.district || place.city || place.subregion || place.region;

        const secondary =
          place.city && place.city !== primary
            ? place.city
            : place.region && place.region !== primary
              ? place.region
              : undefined;

        const formatted = [primary, secondary].filter(Boolean).join(", ");

        setLocationText(formatted || place.name || "Current location");
      } else {
        setLocationText("Current location");
      }
    } catch (error) {
      console.error("Home location detection failed:", error);

      Alert.alert(
        "Location unavailable",
        "We couldn't detect your current location. Please check that Location Services are enabled and try again.",
      );
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfilePicture();

      return undefined;
    }, [loadProfilePicture]),
  );

  useEffect(() => {
    void detectCurrentLocation();
  }, [detectCurrentLocation]);

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Good morning";
    }

    if (hour < 17) {
      return "Good afternoon";
    }

    if (hour < 21) {
      return "Good evening";
    }

    return "Good night";
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Location + Profile */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.locationContainer}
              onPress={() => void detectCurrentLocation()}
              activeOpacity={0.75}
              disabled={locationLoading}
            >
              <View style={styles.locationIcon}>
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#0A9FB5" />
                ) : (
                  <Ionicons name="location" size={18} color="#0A9FB5" />
                )}
              </View>

              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Your location</Text>

                <View style={styles.locationRow}>
                  <Text
                    style={styles.locationText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {locationLoading ? "Detecting location..." : locationText}
                  </Text>

                  <Ionicons name="chevron-down" size={15} color="#526973" />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.8}
            >
              {profilePictureLoading ? (
                <ActivityIndicator size="small" color="#0A9FB5" />
              ) : profilePicture ? (
                <Image
                  source={profilePicture}
                  style={styles.profileImage}
                  contentFit="cover"
                  onError={() => setProfilePicture(null)}
                />
              ) : (
                <Ionicons name="person-outline" size={20} color="#182A33" />
              )}
            </TouchableOpacity>
          </View>

          {/* Greeting */}
          <View style={styles.greeting}>
            <Text style={styles.greetingTitle}>
              {getGreeting()}, {user?.name || "there"} 👋
            </Text>

            <Text style={styles.greetingSubtitle}>
              How can we help you today?
            </Text>
          </View>

          {/* Search */}
          <TouchableOpacity style={styles.searchBox} activeOpacity={0.8}>
            <View style={styles.searchIcon}>
              <Ionicons name="search-outline" size={20} color="#687F89" />
            </View>

            <Text style={styles.searchText}>Search for a service</Text>
          </TouchableOpacity>

          {/* Services */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>What do you need?</Text>
          </View>

          <View style={styles.serviceGrid}>
            {quickServices.map((service) => (
              <TouchableOpacity
                key={service.title}
                style={styles.serviceCard}
                activeOpacity={0.82}
                onPress={() => router.push(service.route as any)}
              >
                <View style={styles.serviceIcon}>
                  <Ionicons name={service.icon} size={25} color="#0A9FB5" />
                </View>

                <View style={styles.serviceText}>
                  <Text style={styles.serviceTitle} numberOfLines={2}>
                    {service.title}
                  </Text>

                  <Text style={styles.serviceSubtitle} numberOfLines={1}>
                    {service.subtitle}
                  </Text>
                </View>

                <View style={styles.serviceArrow}>
                  <Ionicons name="chevron-forward" size={15} color="#9AAEB5" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Healthcare Request */}
          <TouchableOpacity
            style={styles.quickRequestCard}
            activeOpacity={0.88}
            onPress={() => router.push("/services")}
          >
            <View style={styles.quickRequestIcon}>
              <Ionicons name="flash" size={23} color="#FFFFFF" />
            </View>

            <View style={styles.quickRequestContent}>
              <Text style={styles.quickRequestTitle}>
                Need healthcare quickly?
              </Text>

              <Text style={styles.quickRequestSubtitle}>
                Find a healthcare professional near you
              </Text>
            </View>

            <View style={styles.quickRequestArrow}>
              <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Trust / reassurance */}
          <View style={styles.trustRow}>
            <View style={styles.trustIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#16A34A"
              />
            </View>

            <View style={styles.trustContent}>
              <Text style={styles.trustTitle}>
                Trusted healthcare at your doorstep
              </Text>

              <Text style={styles.trustSubtitle}>
                Local • Secure • Convenient
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FBFC",
  },

  container: {
    flex: 1,
    backgroundColor: "#F7FBFC",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  /* --------------------------------
     TOP BAR
  -------------------------------- */

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 7,
    paddingBottom: 7,
  },

  locationContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 14,
  },

  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EAF9FC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  locationTextContainer: {
    flex: 1,
  },

  locationLabel: {
    fontSize: 11,
    lineHeight: 15,
    color: "#71858D",
    marginBottom: 1,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },

  locationText: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
    color: "#182A33",
    marginRight: 4,
  },

  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D7E8EB",
    overflow: "hidden",
  },

  profileImage: {
    width: "100%",
    height: "100%",
  },

  /* --------------------------------
     GREETING
  -------------------------------- */

  greeting: {
    marginTop: 18,
    marginBottom: 17,
  },

  greetingTitle: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "800",
    color: "#10242C",
    letterSpacing: -0.4,
  },

  greetingSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#687F89",
    marginTop: 4,
  },

  /* --------------------------------
     SEARCH
  -------------------------------- */

  searchBox: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7E8EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginBottom: 25,
  },

  searchIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  searchText: {
    fontSize: 14,
    color: "#91A6AE",
    marginLeft: 5,
  },

  /* --------------------------------
     SERVICES
  -------------------------------- */

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "800",
    color: "#10242C",
    letterSpacing: -0.2,
  },

  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  serviceCard: {
    width: "48.4%",
    minHeight: 132,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 13,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#D9E8EB",
    position: "relative",
  },

  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EAF9FC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  serviceText: {
    paddingRight: 5,
  },

  serviceTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    color: "#182A33",
  },

  serviceSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    color: "#71858D",
    marginTop: 4,
  },

  serviceArrow: {
    position: "absolute",
    right: 11,
    top: 13,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#F5F9FA",
    alignItems: "center",
    justifyContent: "center",
  },

  /* --------------------------------
     QUICK REQUEST
  -------------------------------- */

  quickRequestCard: {
    minHeight: 82,
    borderRadius: 17,
    backgroundColor: "#0A9FB5",
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 15,
  },

  quickRequestIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  quickRequestContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  quickRequestTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  quickRequestSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: "#D7F2F5",
    marginTop: 2,
  },

  quickRequestArrow: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* --------------------------------
     TRUST
  -------------------------------- */

  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 8,
  },

  trustIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ECFDF3",
    alignItems: "center",
    justifyContent: "center",
  },

  trustContent: {
    flex: 1,
    marginLeft: 10,
  },

  trustTitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    color: "#166534",
  },

  trustSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: "#66836E",
    marginTop: 1,
  },

  bottomSpacing: {
    height: 12,
  },
});
