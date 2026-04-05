// import React, { useState, useCallback, memo } from "react";
// import {
//   View,
//   TextInput,
//   FlatList,
//   Text,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { useSearchUsersQuery } from "../../store/authApi";
// import { useSelector } from "react-redux";
// import { SafeAreaView } from "react-native-safe-area-context";
// import FollowerSuggestions from "@/components/FollowerSuggestions";
// // import { useDebounce } from "use-debounce";

// interface User {
//   id: string;
//   name: string;
//   username: string;
//   image?: string;
// }

// const UserItem = memo(
//   ({ item, onPress }: { item: User; onPress: (id: string) => void }) => {
//     return (
//       <TouchableOpacity
//         onPress={() => onPress(item.id)}
//         className="flex-row items-center p-4 border-b border-gray-50 bg-white"
//       >
//         <Image
//           source={{ uri: item.image || "https://via.placeholder.com/50" }}
//           className="w-12 h-12 rounded-full bg-gray-200"
//         />

//         <View className="ml-3 flex-1">
//           <Text className="font-bold text-base text-gray-900">{item.name}</Text>
//           <Text className="text-gray-500 text-sm">@{item.username}</Text>
//         </View>

//         <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
//       </TouchableOpacity>
//     );
//   },
// );

// UserItem.displayName = "UserItem";

// export default function ExploreScreen() {
//   const router = useRouter();
//   const [search, setSearch] = useState("");

//   const currentUser = useSelector((state: any) => state.auth.user);

//   // const debouncedSearch = useDebounce(search, 400);

//   // const { data: users = [], isLoading } = useSearchUsersQuery(debouncedSearch, {
//   //   skip: !debouncedSearch,
//   // });

//   const { data: users = [], isLoading } = useSearchUsersQuery(search, {
//     skip: !search,
//   });

//   // remove current user from results
//   const filteredUsers = users.filter(
//     (user: User) => user.id !== currentUser?.id,
//   );

//   const handleUserPress = useCallback(
//     (id: string) => {
//       router.push(`/profile/${id}`);
//     },
//     [router],
//   );

//   const renderItem = useCallback(
//     ({ item }: { item: User }) => (
//       <UserItem item={item} onPress={handleUserPress} />
//     ),
//     [handleUserPress],
//   );

//   const keyExtractor = useCallback((item: User) => item.id, []);

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       {/* Search Header */}
//       <View className="px-4 py-3 border-b border-gray-50">
//         <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2.5">
//           <Ionicons name="search" size={20} color="#6B7280" />

//           <TextInput
//             placeholder="Search Society"
//             placeholderTextColor="#6B7280"
//             className="flex-1 ml-3 text-[16px] text-gray-900"
//             value={search}
//             onChangeText={setSearch}
//             autoCapitalize="none"
//           />

//           {search.length > 0 && (
//             <TouchableOpacity onPress={() => setSearch("")}>
//               <Ionicons name="close-circle" size={18} color="#6B7280" />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* Content */}
//       <FlatList
//         data={filteredUsers}
//         keyExtractor={keyExtractor}
//         renderItem={renderItem}
//         keyboardShouldPersistTaps="handled"
//         contentContainerStyle={{ flexGrow: 1 }}
//         ListHeaderComponent={!search ? <FollowerSuggestions /> : null}
//         ListEmptyComponent={
//           !isLoading ? (
//             <View className="flex-1 items-center justify-center mt-20 px-8">
//               {!search ? (
//                 <>
//                   <Text className="text-xl font-bold text-gray-900 mb-2">
//                     Search for people
//                   </Text>
//                   <Text className="text-gray-500 text-center leading-5">
//                     Find your friends, family, and favorite creators on Society.
//                   </Text>
//                 </>
//               ) : (
//                 <Text className="text-gray-500">
//                   No users found for {search}
//                 </Text>
//               )}
//             </View>
//           ) : (
//             <View className="mt-10">
//               <ActivityIndicator size="small" color="#1d9bf0" />
//             </View>
//           )
//         }
//       />
//     </SafeAreaView>
//   );
// }

import React, { useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useGlobalSearchQuery } from "../../store/searchApi";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import FollowerSuggestions from "@/components/FollowerSuggestions";
import PostCard from "../../components/PostCard";
import PostOptionsModal from "../../components/PostOptionsModal";
import {
  useLikePostMutation,
  useRepostPostMutation,
  useBookmarkPostMutation,
  useDeletePostMutation,
} from "../../store/postApi";

export default function ExploreScreen() {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [search, setSearch] = useState(q || "");
  const [activeTab, setActiveTab] = useState<"users" | "posts" | "hashtags">(
    q?.startsWith("#") ? "posts" : "users",
  );

  const { data, isLoading } = useGlobalSearchQuery(search, {
    skip: search.length < 2,
  });
  const [likePost] = useLikePostMutation();
  const [repostPost] = useRepostPostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [deletePost] = useDeletePostMutation();

  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [postForOptions, setPostForOptions] = useState<any>(null);

  const currentUser = useSelector((state: any) => state.auth.user);

  const filteredUsers =
    data?.users?.filter((user: any) => user.id !== currentUser?.id) || [];

  const renderUser = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/profile/${item.id}`)}
      className="flex-row items-center p-4 border-b border-gray-50 bg-white"
    >
      <Image
        source={{ uri: item.image || "https://via.placeholder.com/50" }}
        className="w-12 h-12 rounded-full bg-gray-200"
      />
      <View className="ml-3 flex-1">
        <Text className="font-bold text-base text-gray-900">{item.name}</Text>
        <Text className="text-gray-500 text-sm">@{item.username}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const renderPost = ({ item }: { item: any }) => (
    <PostCard
      item={item}
      user={currentUser}
      onPressPost={(id) => router.push(`/post/${id}`)}
      onPressProfile={(id) =>
        id === currentUser?.id
          ? router.push("/profile")
          : router.push(`/profile/${id}`)
      }
      onPressOptions={(p) => {
        setPostForOptions(p);
        setOptionsModalVisible(true);
      }}
      onPressComment={(id) => router.push(`/post/${id}`)}
      onPressRepost={(p) => repostPost({ id: p.id })}
      onLike={(id) => likePost({ postId: id }).unwrap()}
      onBookmark={(id) => bookmarkPost(id).unwrap()}
    />
  );

  const renderHashtag = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => {
        setSearch(`#${item.name}`);
        setActiveTab("posts");
      }}
      className="flex-row items-center p-4 border-b border-gray-50 bg-white justify-between"
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-sky-50 items-center justify-center mr-3">
          <Text className="text-xl font-bold text-sky-500">#</Text>
        </View>
        <Text className="font-bold text-lg text-gray-900">{item.name}</Text>
      </View>
      <Text className="text-gray-400 text-sm">{item.count} posts</Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (!search || search.length < 2) return <FollowerSuggestions />;
    if (isLoading)
      return (
        <ActivityIndicator size="large" color="#1d9bf0" className="mt-10" />
      );

    let listData = [];
    let renderItemFn: any;

    if (activeTab === "users") {
      listData = filteredUsers;
      renderItemFn = renderUser;
    } else if (activeTab === "posts") {
      listData = data?.posts || [];
      renderItemFn = renderPost;
    } else {
      listData = data?.hashtags || [];
      renderItemFn = renderHashtag;
    }

    if (listData.length === 0) {
      return (
        <View className="flex-1 items-center justify-center mt-20 px-8">
          <Text className="text-gray-500">No {activeTab} found for search</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        renderItem={renderItemFn}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1">
      {/* Search Header */}
      <View className="px-4 py-3 border-b border-gray-100 bg-white shadow-sm z-10">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2.5">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            placeholder="Search Ananta..."
            placeholderTextColor="#6B7280"
            className="flex-1 ml-3 text-[16px] text-gray-900"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      {search.length >= 2 && (
        <View className="flex-row border-b border-gray-100 bg-white">
          <TouchableOpacity
            className={`flex-1 py-3 items-center border-b-2 ${activeTab === "users" ? "border-[#1d9bf0]" : "border-transparent"}`}
            onPress={() => setActiveTab("users")}
          >
            <Text
              className={`font-bold ${activeTab === "users" ? "text-gray-900" : "text-gray-500"}`}
            >
              Accounts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 items-center border-b-2 ${activeTab === "posts" ? "border-[#1d9bf0]" : "border-transparent"}`}
            onPress={() => setActiveTab("posts")}
          >
            <Text
              className={`font-bold ${activeTab === "posts" ? "text-gray-900" : "text-gray-500"}`}
            >
              Posts
            </Text>
          </TouchableOpacity>
          {/* <TouchableOpacity
            className={`flex-1 py-3 items-center border-b-2 ${activeTab === "hashtags" ? "border-[#1d9bf0]" : "border-transparent"}`}
            onPress={() => setActiveTab("hashtags")}
          >
            <Text
              className={`font-bold ${activeTab === "hashtags" ? "text-gray-900" : "text-gray-500"}`}
            >
              Tags
            </Text>
          </TouchableOpacity> */}
        </View>
      )}

      {/* Content */}
      <View className="flex-1">{renderContent()}</View>

      <PostOptionsModal
        isVisible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        isOwner={postForOptions?.author?.id === currentUser?.id}
        onDelete={async () => {
          if (!postForOptions?.id) return;
          try {
            await deletePost({ id: postForOptions.id }).unwrap();
            setOptionsModalVisible(false);
          } catch (err) {
            console.error("Delete failed", err);
          }
        }}
      />
    </SafeAreaView>
  );
}
