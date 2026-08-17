import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterUserScreen() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

  const handleContinue = () => {
    const cleanedMobile = mobile.replace(/\D/g, "");

    if (!name.trim()) {
      Alert.alert(
        "Name required",
        "Please enter your full name."
      );
      return;
    }

    if (cleanedMobile.length !== 10) {
      Alert.alert(
        "Invalid mobile number",
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    router.push({
      pathname: "/verify-otp",
      params: {
        mobile: cleanedMobile,
        mode: "user-registration",
        name,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#0F172A"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Create Account
          </Text>

          <View style={styles.spacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name="person-add-outline"
              size={32}
              color="#2563EB"
            />
          </View>

          <Text style={styles.title}>
            Create your RuralCare account
          </Text>

          <Text style={styles.subtitle}>
            Register to request healthcare services at
            your doorstep.
          </Text>

          <Text style={styles.label}>
            Full name
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          <Text style={styles.label}>
            Mobile number
          </Text>

          <View style={styles.phoneContainer}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>
                +91
              </Text>
            </View>

            <TextInput
              value={mobile}
              onChangeText={setMobile}
              placeholder="Enter mobile number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.phoneInput}
            />
          </View>

          <View style={styles.infoCard}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#2563EB"
            />

            <Text style={styles.infoText}>
              We'll verify your mobile number using a
              one-time password.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              Continue
            </Text>

            <Ionicons
              name="arrow-forward"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </ScrollView>
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

  spacer: {
    width: 40,
  },

  content: {
    padding: 20,
    paddingBottom: 35,
  },

  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 25,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginTop: 17,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 28,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 7,
  },

  input: {
    height: 51,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 17,
  },

  phoneContainer: {
    height: 51,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 11,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    marginBottom: 17,
  },

  countryCode: {
    width: 62,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
  },

  countryCodeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },

  phoneInput: {
    flex: 1,
    paddingHorizontal: 13,
    fontSize: 14,
    color: "#0F172A",
  },

  infoCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 5,
  },

  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 11,
    lineHeight: 17,
    color: "#1E40AF",
  },

  button: {
    height: 52,
    borderRadius: 11,
    backgroundColor: "#2563EB",
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginRight: 8,
  },
});