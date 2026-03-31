import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";
import { useDeleteAccountMutation } from "../../store/settingsApi";

const DeleteAccount = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();
  const [confirmed, setConfirmed] = useState(false);

  const handleDeleteAccount = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert(
      "Final Erasure",
      "This action is absolute. Your existence in the Oasis will be permanently dissolved. All your artifacts, connections, and progress will vanish into the void. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Dissolve Forever",
          style: "destructive",
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              await deleteAccount({}).unwrap();
              router.replace("/auth");
              setTimeout(() => {
                dispatch(logout());
                Alert.alert("Presence Dissolved", "Your account has been successfully erased from the Ananta.");
              }, 100);
            } catch (error: any) {
              if (error?.status === 404) {
                router.replace("/auth");
                setTimeout(() => dispatch(logout()), 100);
              } else {
                Alert.alert("Error", "Failed to erase existence. The system encountered an error.");
              }
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <BlurView
        intensity={90}
        tint="light"
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={20} color="#64748B" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Erasure</Text>
            <Text style={styles.headerSubtitle}>Dissolve Presence</Text>
          </View>
        </View>
      </BlurView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="trash-outline" size={40} color="#F43F5E" />
          </View>
          <Text style={styles.heroTitle}>Leaving the Ananta?</Text>
          <Text style={styles.heroSubtitle}>
            Dissolving your presence is a permanent procedure. Once the process is complete, your soul's data, artifacts, and connections will be lost to the void forever.
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningLabel}>Warning Sequence</Text>
          <View>
            {[
              "All posts and media artifacts will be deleted.",
              "Followers and following links will be broken.",
              "Chat history will be permanently encrypted.",
              "Points and achievements will be nullified.",
            ].map((msg, i) => (
              <View key={i} style={styles.warningRow}>
                <Ionicons name="alert-circle-outline" size={16} color="#F43F5E" style={{ marginTop: 2 }} />
                <Text style={styles.warningText}>{msg}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setConfirmed(!confirmed);
            }}
            style={styles.checkRow}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                confirmed ? styles.checkboxChecked : styles.checkboxUnchecked,
              ]}
            >
              {confirmed && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
            <Text style={styles.checkLabel}>
              I understand that this action is irreversible and absolute.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            disabled={!confirmed || isDeleting}
            activeOpacity={confirmed ? 0.8 : 1}
            style={[
              styles.deleteBtn,
              confirmed ? styles.deleteBtnActive : styles.deleteBtnInactive,
            ]}
          >
            <Text style={[styles.deleteBtnText, confirmed ? styles.deleteBtnTextActive : styles.deleteBtnTextInactive]}>
              {isDeleting ? "Dissolving..." : "Dissolve Permanent Presence"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "rgba(241,245,249,0.5)", zIndex: 50 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  backBtn: { width: 40, height: 40, borderRadius: 16, backgroundColor: "white", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#F8FAFC", shadowColor: "#94A3B8", shadowOpacity: 0.1, shadowRadius: 4, marginRight: 16 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#111827", letterSpacing: -1, textTransform: "uppercase" },
  headerSubtitle: { fontSize: 10, color: "#9CA3AF", fontWeight: "700", textTransform: "uppercase", letterSpacing: 2, marginTop: 2 },
  scroll: { flex: 1, paddingHorizontal: 32 },
  heroSection: { marginTop: 48, alignItems: "center" },
  iconCircle: { width: 96, height: 96, backgroundColor: "#FFF1F2", borderRadius: 40, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(254,205,211,0.5)", marginBottom: 32 },
  heroTitle: { fontSize: 30, fontWeight: "900", color: "#111827", textAlign: "center", letterSpacing: -1, textTransform: "uppercase", lineHeight: 36 },
  heroSubtitle: { color: "#9CA3AF", textAlign: "center", fontWeight: "500", marginTop: 24, lineHeight: 24, fontSize: 15 },
  warningBox: { marginTop: 40, backgroundColor: "white", borderRadius: 32, padding: 32, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#94A3B8", shadowOpacity: 0.07, shadowRadius: 8 },
  warningLabel: { color: "#F43F5E", fontWeight: "900", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 },
  warningRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  warningText: { color: "#4B5563", fontWeight: "500", marginLeft: 12, flex: 1 },
  actionSection: { marginTop: 40, marginBottom: 48 },
  checkRow: { flexDirection: "row", alignItems: "center", marginBottom: 32 },
  checkbox: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  checkboxChecked: { backgroundColor: "#0EA5E9", borderColor: "#0EA5E9" },
  checkboxUnchecked: { backgroundColor: "white", borderColor: "#D1D5DB" },
  checkLabel: { color: "#6B7280", fontWeight: "700", marginLeft: 12, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, lineHeight: 20, flex: 1 },
  deleteBtn: { paddingVertical: 24, borderRadius: 32, alignItems: "center", borderWidth: 1 },
  deleteBtnActive: { backgroundColor: "#F43F5E", borderColor: "#E11D48", shadowColor: "#F43F5E", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  deleteBtnInactive: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" },
  deleteBtnText: { fontWeight: "900", textTransform: "uppercase", letterSpacing: 2 },
  deleteBtnTextActive: { color: "white" },
  deleteBtnTextInactive: { color: "#9CA3AF" },
});

export default DeleteAccount;