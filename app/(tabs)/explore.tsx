import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useGlobalSearchQuery, useGetTrendingQuery } from "../../store/searchApi";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import PostCard from "../../components/PostCard";
import PostOptionsModal from "../../components/PostOptionsModal";
import {
  useLikePostMutation,
  useRepostPostMutation,
  useBookmarkPostMutation,
  useDeletePostMutation,
} from "../../store/postApi";
import Animated, { 
  FadeIn, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from "react-native-reanimated";

const { width } = Dimensions.get('window');

const EXPLORE_CATEGORIES = [
  { id: '1', name: 'Trending', icon: 'flame-outline' },
  { id: '2', name: 'Mindful', icon: 'leaf-outline' },
  { id: '3', name: 'Tech', icon: 'laptop-outline' },
  { id: '4', name: 'Art', icon: 'color-palette-outline' },
  { id: '5', name: 'Gaming', icon: 'game-controller-outline' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [search, setSearch] = useState(q || "");
  const [activeTab, setActiveTab] = useState<"users" | "posts" | "hashtags">("users");
  const [selectedCategory, setSelectedCategory] = useState('1');

  const { data: searchResults, isLoading: isSearching } = useGlobalSearchQuery(search, {
    skip: search.length < 2,
  });

  const { data: trendingData, isLoading: isTrendingLoading, refetch: refetchTrending } = useGetTrendingQuery();

  const [likePost] = useLikePostMutation();
  const [repostPost] = useRepostPostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [deletePost] = useDeletePostMutation();

  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [postForOptions, setPostForOptions] = useState<any>(null);

  const currentUser = useSelector((state: any) => state.auth.user);

  const filteredUsers = useMemo(() => {
    return searchResults?.users?.filter((user: any) => user.id !== currentUser?.id) || [];
  }, [searchResults, currentUser]);

  const indicatorPos = useSharedValue(0);

  const handleTabChange = (tab: "users" | "posts" | "hashtags", index: number) => {
    setActiveTab(tab);
    indicatorPos.value = withSpring(index * (width / 3));
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPos.value }],
  }));

  const renderTrendingHashtag = ({ item, index }: { item: any, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50)}>
      <TouchableOpacity
        onPress={() => {
          setSearch(`#${item.name}`);
          setActiveTab("posts");
        }}
        className="flex-row items-center p-4 border-b border-gray-50 bg-white justify-between"
      >
        <View>
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Trending #{index + 1}</Text>
          <Text className="font-bold text-[17px] text-gray-900">#{item.name}</Text>
          <Text className="text-gray-500 text-xs mt-1">{item.count} posts</Text>
        </View>
        <TouchableOpacity className="bg-gray-50 w-8 h-8 rounded-full items-center justify-center">
            <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderHeroTrending = () => {
      if (!trendingData?.posts?.[0]) return null;
      const hero = trendingData.posts[0];
      return (
          <TouchableOpacity 
            className="mx-4 mt-2 mb-6 rounded-3xl overflow-hidden shadow-sm border border-gray-100"
            onPress={() => router.push(`/post/${hero.id}`)}
          >
              {hero.image ? (
                  <Image source={{ uri: hero.image }} className="w-full h-48" />
              ) : (
                  <View className="w-full h-32 bg-sky-500 items-center justify-center">
                      <Ionicons name="sparkles" size={40} color="rgba(255,255,255,0.3)" />
                  </View>
              )}
              <BlurView intensity={90} className="p-4 bg-white/60">
                  <Text className="text-xs font-black text-sky-600 uppercase tracking-widest mb-1">Featured Moment</Text>
                  <Text className="text-lg font-bold text-gray-900" numberOfLines={2}>{hero.content}</Text>
                  <View className="flex-row items-center mt-3">
                      <Image source={{ uri: hero.author?.image }} className="w-6 h-6 rounded-full mr-2" />
                      <Text className="text-sm text-gray-500">by {hero.author?.name}</Text>
                  </View>
              </BlurView>
          </TouchableOpacity>
      );
  };

  const renderDefaultView = () => (
    <FlatList
      data={trendingData?.hashtags || []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={() => (
        <View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          >
            {EXPLORE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                className={`flex-row items-center px-5 py-2.5 rounded-2xl mr-3 ${
                  selectedCategory === cat.id ? 'bg-sky-500 border-sky-600' : 'bg-gray-100 border-gray-200'
                } border`}
              >
                <Ionicons 
                  name={cat.icon as any} 
                  size={16} 
                  color={selectedCategory === cat.id ? 'white' : '#64748b'} 
                />
                <Text className={`ml-2 font-bold ${selectedCategory === cat.id ? 'text-white' : 'text-slate-600'}`}>
                    {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {renderHeroTrending()}

          <View className="px-4 pb-2">
            <Text className="text-xl font-black text-gray-900 tracking-tighter">Trending Topics</Text>
          </View>
        </View>
      )}
      renderItem={renderTrendingHashtag}
      ListFooterComponent={() => (
          <View className="p-8 items-center">
              <TouchableOpacity className="px-6 py-3 bg-gray-50 rounded-full border border-gray-100">
                  <Text className="text-gray-400 font-bold">Show more topics</Text>
              </TouchableOpacity>
          </View>
      )}
      refreshing={isTrendingLoading}
      onRefresh={refetchTrending}
    />
  );

  const renderSearchContent = () => {
    if (isSearching)
      return (
        <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      );

    let listData = [];
    if (activeTab === "users") listData = filteredUsers;
    else if (activeTab === "posts") listData = searchResults?.posts || [];
    else listData = searchResults?.hashtags || [];

    return (
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
            if (activeTab === "users") {
                return (
                    <TouchableOpacity
                     onPress={() => router.push(`/profile/${item.id}`)}
                     className="flex-row items-center p-4 border-b border-gray-50 bg-white"
                    >
                        <Image source={{ uri: item.image || "https://via.placeholder.com/50" }} className="w-12 h-12 rounded-full bg-gray-200" />
                        <View className="ml-3 flex-1">
                            <Text className="font-bold text-base text-gray-900">{item.name}</Text>
                            <Text className="text-gray-500 text-sm">@{item.username}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                );
            }
            return (
                <PostCard
                  item={item}
                  user={currentUser}
                  onPressPost={(id) => router.push(`/post/${id}`)}
                  onPressProfile={(id) => router.push(id === currentUser?.id ? "/profile" : `/profile/${id}`)}
                  onPressOptions={(p) => { setPostForOptions(p); setOptionsModalVisible(true); }}
                  onPressComment={(id) => router.push(`/post/${id}`)}
                  onPressRepost={(p) => repostPost({ id: p.id })}
                  onLike={(id) => likePost({ postId: id }).unwrap()}
                  onBookmark={(id) => bookmarkPost(id).unwrap()}
                />
            );
        }}
        ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center mt-20 px-8">
              <Text className="text-gray-400 font-medium">No results found for "{search}"</Text>
            </View>
        )}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Search Header */}
      <View className="px-4 py-3 border-b border-gray-50 z-10 bg-white">
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3">
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            placeholder="Search Oasis..."
            placeholderTextColor="#94a3b8"
            className="flex-1 ml-3 text-[16px] text-gray-900 font-medium"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modern Result Tabs */}
      {search.length >= 2 && (
        <View className="flex-row bg-white relative">
          {["users", "posts", "hashtags"].map((tab, index) => (
            <TouchableOpacity
              key={tab}
              className="flex-1 py-4 items-center"
              onPress={() => handleTabChange(tab as any, index)}
            >
              <Text className={`font-bold uppercase text-[12px] tracking-widest ${activeTab === tab ? "text-sky-500" : "text-gray-400"}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
          <Animated.View 
            style={[
                { position: 'absolute', bottom: 0, width: width / 3, height: 3, backgroundColor: '#0EA5E9', borderRadius: 3 },
                indicatorStyle
            ]} 
          />
        </View>
      )}

      {/* Content */}
      <View className="flex-1">
        {search.length < 2 ? renderDefaultView() : renderSearchContent()}
      </View>

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
