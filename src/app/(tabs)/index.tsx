import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
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
import { useCallback, useEffect, useState } from "react";

import { getProfilePictureSource } from "@/api/profilePicture";
import { useAuth } from "@/context/auth-context";

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
    route: "/services"
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
  const [profilePicture, setProfilePicture] = useState<Awaited<ReturnType<typeof getProfilePictureSource>>>(null);
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
          "Please allow CareNow to use your location so we can show your current location."
        );
        return;
      }

      try {
        await Location.enableNetworkProviderAsync();
      } catch {
        // Continue with the available device location provider.
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = currentLocation.coords;
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (addresses.length > 0) {
        const place = addresses[0];
        // Prefer the most local locality first (for example,
        // "Uppal, Hyderabad") while keeping the header compact.
        const primary = place.district || place.city || place.subregion || place.region;
        const secondary = place.city && place.city !== primary
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
        "We couldn't detect your current location. Please check that Location Services are enabled and try again."
      );
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfilePicture();
      return undefined;
    }, [loadProfilePicture])
  );

  useEffect(() => {
    void detectCurrentLocation();
  }, [detectCurrentLocation]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
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
                  <Ionicons name="location" size={19} color="#0A9FB5" />
                )}
              </View>

              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Your Location</Text>
                <View style={styles.locationRow}>
                  <Text
                    style={styles.locationText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {locationLoading ? "Detecting current location..." : locationText}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color="#526973"
                  />
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
            <Text style={styles.greetingTitle}>Good Morning 👋</Text>
            <Text style={styles.greetingSubtitle}>
              How can we help you today?
            </Text>
          </View>

          {/* Search */}
          <TouchableOpacity style={styles.searchBox}>
            <Ionicons name="search-outline" size={21} color="#687F89" />

            <Text style={styles.searchText}>
              Search for a service
            </Text>
          </TouchableOpacity>

          {/* Quick Services */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>What do you need?</Text>
          </View>

          <View style={styles.serviceGrid}>
            {quickServices.map((service) => (
              <TouchableOpacity
                key={service.title}
                style={styles.serviceCard}
                activeOpacity={0.8}
                onPress={() => router.push(service.route as any)}
              >
                <View style={styles.serviceIcon}>
                  <Ionicons
                    name={service.icon}
                    size={27}
                    color="#0A9FB5"
                  />
                </View>

                <Text style={styles.serviceTitle}>
                  {service.title}
                </Text>

                <Text style={styles.serviceSubtitle}>
                  {service.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Emergency / Quick Request */}
          <TouchableOpacity
            style={styles.urgentCard}
            activeOpacity={0.85}
            onPress={() => router.push("/services")}
          >
            <View style={styles.urgentIcon}>
              <Ionicons name="flash" size={23} color="#FFFFFF" />
            </View>

            <View style={styles.urgentContent}>
              <Text style={styles.urgentTitle}>
                Need healthcare quickly?
              </Text>

              <Text style={styles.urgentSubtitle}>
                Request a nearby healthcare worker
              </Text>
            </View>

            <View style={styles.urgentArrow}>
              <Ionicons
                name="arrow-forward"
                size={19}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>

          {/* Trust message */}
          <View style={styles.trustCard}>
            <Ionicons
              name="shield-checkmark-outline"
              size={25}
              color="#16A34A"
            />

            <View style={styles.trustTextContainer}>
              <Text style={styles.trustTitle}>
                Healthcare at your doorstep
              </Text>

              <Text style={styles.trustSubtitle}>
                Connecting you with local healthcare services.
              </Text>
            </View>
          </View>
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
    paddingBottom: 30,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
  },

  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },

  locationTextContainer: {
    flexShrink: 1,
  },

  locationIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EAF9FC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  locationLabel: {
    fontSize: 11,
    color: "#687F89",
    marginBottom: 2,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  locationText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#182A33",
    marginRight: 3,
  },

  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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

  greeting: {
    marginTop: 8,
    marginBottom: 16,
  },

  greetingTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#10242C",
  },

  greetingSubtitle: {
    fontSize: 14,
    color: "#687F89",
    marginTop: 4,
  },

  searchBox: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7E8EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 24,
  },

  searchText: {
    fontSize: 14,
    color: "#91A6AE",
    marginLeft: 10,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10242C",
  },


  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  serviceCard: {
    width: "48.2%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#D7E8EB",
  },

  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EAF9FC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },

  serviceTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#182A33",
    lineHeight: 19,
  },

  serviceSubtitle: {
    fontSize: 11,
    color: "#687F89",
    marginTop: 4,
  },

  urgentCard: {
    backgroundColor: "#0A9FB5",
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
  },

  urgentIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  urgentContent: {
    flex: 1,
    marginLeft: 12,
  },

  urgentTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  urgentSubtitle: {
    color: "#D5F1F4",
    fontSize: 11,
    marginTop: 3,
  },

  urgentArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  trustCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    padding: 14,
  },

  trustTextContainer: {
    flex: 1,
    marginLeft: 11,
  },

  trustTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#166534",
  },

  trustSubtitle: {
    fontSize: 11,
    color: "#4D7C0F",
    marginTop: 3,
  },
});
