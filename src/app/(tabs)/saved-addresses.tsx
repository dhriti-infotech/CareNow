import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AddressOwnerType = "SELF" | "DEPENDENT" | "FRIEND";

type SavedAddress = {
  id: string;
  ownerType: AddressOwnerType;
  ownerName: string;
  relationship?: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
};

const savedAddresses: SavedAddress[] = [
  {
    id: "1",
    ownerType: "SELF",
    ownerName: "My Address",
    label: "Home",
    addressLine1: "Flat 402, ABC Apartments",
    addressLine2: "Begumpet",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500016",
    isDefault: true,
  },
  {
    id: "2",
    ownerType: "DEPENDENT",
    ownerName: "Vamika",
    relationship: "Daughter",
    label: "Home",
    addressLine1: "Flat 201, XYZ Residency",
    addressLine2: "Bowenpally",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500011",
  },
  {
    id: "3",
    ownerType: "FRIEND",
    ownerName: "Rahul",
    relationship: "Friend",
    label: "Home",
    addressLine1: "12-4-221, Market Road",
    addressLine2: "Secunderabad",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500003",
  },
];

export default function SavedAddressesScreen() {
  const router = useRouter();

  const handleAddressMenu = (address: SavedAddress) => {
    Alert.alert(address.ownerName, "Manage this saved address", [
      {
        text: "Edit",
        onPress: () => {
          router.push(`/saved-addresses/edit/${address.id}`);
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Delete Address",
            `Are you sure you want to delete ${address.ownerName}'s address?`,
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Delete",
                style: "destructive",
              },
            ],
          );
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const getOwnerIcon = (ownerType: AddressOwnerType) => {
    switch (ownerType) {
      case "DEPENDENT":
        return "people-outline";

      case "FRIEND":
        return "person-add-outline";

      case "SELF":
      default:
        return "person-outline";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={21} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Saved Addresses</Text>

            <Text style={styles.subtitle}>
              Manage service locations for you, your dependents and friends.
            </Text>
          </View>
        </View>

        {/* Address List */}
        <View style={styles.addressList}>
          {savedAddresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.ownerSection}>
                  <View style={styles.rowIcon}>
                    <Ionicons
                      name={getOwnerIcon(address.ownerType)}
                      size={20}
                      color="#2563EB"
                    />
                  </View>

                  <View style={styles.ownerContent}>
                    <View style={styles.nameRow}>
                      <Text style={styles.ownerName}>{address.ownerName}</Text>

                      {address.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultText}>DEFAULT</Text>
                        </View>
                      )}
                    </View>

                    {address.relationship && (
                      <Text style={styles.relationship}>
                        {address.relationship}
                      </Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.menuButton}
                  activeOpacity={0.7}
                  onPress={() => handleAddressMenu(address)}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              {/* Address */}
              <View style={styles.addressSection}>
                <View style={styles.addressLabelRow}>
                  <Ionicons name="location-outline" size={16} color="#64748B" />

                  <Text style={styles.addressLabel}>{address.label}</Text>
                </View>

                <Text style={styles.addressText}>
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                </Text>

                <Text style={styles.addressText}>
                  {address.city}, {address.state} - {address.pincode}
                </Text>
              </View>

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.editButton}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push(`/saved-addresses/edit/${address.id}`)
                  }
                >
                  <Ionicons name="create-outline" size={16} color="#2563EB" />

                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.serviceButton}
                  activeOpacity={0.7}
                  onPress={() => {
                    Alert.alert(
                      "Select Address",
                      `${address.ownerName}'s address selected.`,
                    );
                  }}
                >
                  <Text style={styles.serviceButtonText}>Use this address</Text>

                  <Ionicons name="chevron-forward" size={16} color="#2563EB" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Add Address */}
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={() => router.push("/add")}
        >
          <View style={styles.addIcon}>
            <Ionicons name="add" size={22} color="#2563EB" />
          </View>

          <View style={styles.addContent}>
            <Text style={styles.addTitle}>Add New Address</Text>

            <Text style={styles.addSubtitle}>
              Add an address for yourself, a dependent or a friend
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Bottom Information */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#2563EB"
          />

          <Text style={styles.infoText}>
            You can save multiple service locations and choose the appropriate
            address whenever you book a service.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 22,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headerTextContainer: {
    flex: 1,
    paddingTop: 2,
  },

  title: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
  },

  addressList: {
    width: "100%",
    gap: 12,
  },

  addressCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },

  cardHeader: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingTop: 10,
    paddingBottom: 10,
  },

  ownerSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  ownerContent: {
    flex: 1,
    marginLeft: 11,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  ownerName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },

  relationship: {
    marginTop: 3,
    fontSize: 11,
    color: "#64748B",
  },

  defaultBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginLeft: 7,
  },

  defaultText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#2563EB",
  },

  menuButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  addressSection: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },

  addressLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  addressLabel: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },

  addressText: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 18,
  },

  cardFooter: {
    minHeight: 50,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 13,
  },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingRight: 10,
  },

  editText: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },

  serviceButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },

  serviceButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
    marginRight: 3,
  },

  addButton: {
    width: "100%",
    minHeight: 72,
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },

  addIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  addContent: {
    flex: 1,
    marginLeft: 11,
  },

  addTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },

  addSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: "#64748B",
    lineHeight: 15,
  },

  infoBox: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 16,
  },

  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 10,
    lineHeight: 15,
    color: "#475569",
  },
});
