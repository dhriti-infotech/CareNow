import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";

const CARENOW_LOGO = require("@/assets/images/carenow-logo.png");

export default function IndexScreen() {
  const { isLoading, isAuthenticated, user, restoreSession } = useAuth();

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={CARENOW_LOGO} style={styles.logo} resizeMode="contain" />
        <ActivityIndicator size="small" color="#0A9FB5" style={styles.spinner} />
      </View>
    );
  }

  if (!isAuthenticated || !user) return <Redirect href="/login" />;
  if (user.role === "USER") return <Redirect href="/(tabs)" />;
  if (user.verificationStatus === "APPROVED") return <Redirect href="/professional-home" />;
  return (
    <Redirect
      href={{
        pathname: "/professional-verification",
        params: { status: user.verificationStatus ?? "PENDING" },
      }}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 32,
  },
  logo: {
    width: "82%",
    maxWidth: 360,
    height: 150,
  },
  spinner: {
    marginTop: 18,
  },
});
