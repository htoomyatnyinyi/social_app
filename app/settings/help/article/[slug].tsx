import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../../context/ThemeContext";
import { BlurView } from "expo-blur";

// Reuse the same data object from your HelpCenter
const allFAQs = [
  {
    id: "1",
    title: "How do I delete my account?",
    slug: "delete-account",
    category: "account",
  },
  {
    id: "2",
    title: "Recovering a lost password",
    slug: "password-recovery",
    category: "account",
    content:
      "To recover your password:\n\n1. On the login screen, tap 'Forgot Password?'\n2. Enter your registered email address\n3. Check your email for a reset link\n4. Click the link and create a new password\n5. Login with your new password\n\nIf you don't receive the email within 5 minutes, check your spam folder.",
  },
  {
    id: "3",
    title: "Community guidelines & safety",
    slug: "guidelines",
    category: "safety",
  },
  {
    id: "4",
    title: "Changing my username",
    slug: "change-username",
    category: "features",
  },
  {
    id: "5",
    title: "Troubleshooting login issues",
    slug: "login-help",
    category: "account",
  },
];

export default function ArticleDetailScreen() {
  const { slug } = useLocalSearchParams();
  const { isDark, accentColor } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const article = allFAQs.find((f) => f.slug === slug);

  if (!article) return null;

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {" "}
      {/* FIXED */}
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={{ paddingTop: insets.top + 10 }}
        className="px-5 pb-4 z-50 border-b border-slate-800/10"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={isDark ? "white" : "black"}
          />
          <Text
            className={`ml-2 font-black uppercase tracking-widest text-xs ${isDark ? "text-white" : "text-black"}`}
          >
            Back to Help
          </Text>
        </TouchableOpacity>
      </BlurView>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text
          style={{ color: accentColor }}
          className="font-black uppercase tracking-[3px] text-[10px] mb-4"
        >
          {article.category} Support
        </Text>
        <Text
          className={`text-3xl font-black mb-8 leading-tight ${isDark ? "text-white" : "text-slate-900"}`}
        >
          {article.title}
        </Text>

        <View
          className={`p-6 rounded-[32px] ${isDark ? "bg-slate-900/50 border border-slate-800" : "bg-white shadow-sm"}`}
        >
          <Text
            className={`text-base leading-7 font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            {article.content}
          </Text>
        </View>

        <View className="mt-12 p-8 rounded-[40px] border border-dashed border-slate-500/30 items-center">
          <Text
            className={`font-bold mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            Was this article helpful?
          </Text>
          <View className="flex-row mt-4">
            <TouchableOpacity className="bg-green-500/10 px-6 py-3 rounded-2xl mr-4">
              <Text className="text-green-500 font-black text-xs uppercase">
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-rose-500/10 px-6 py-3 rounded-2xl">
              <Text className="text-rose-500 font-black text-xs uppercase">
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
// import { FAQ_DATA } from "@/app/settings/help";
// import { useLocalSearchParams } from "expo-router";
// import { ScrollView, Text, View } from "react-native";

// export default function ArticleScreen() {
//   const { slug } = useLocalSearchParams();
//   const article = FAQ_DATA[slug as string];
//   return (
//     <View>
//       <Text className="text-2xl font-bold">{article?.title}</Text>

//       <ScrollView>
//         <Text className="text-gray-600">{article?.content}</Text>
//       </ScrollView>
//     </View>
//   );
// }
