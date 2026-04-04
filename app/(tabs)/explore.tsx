import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useGlobalSearchQuery, useGetTrendingQuery } from "../../store/searchApi";
import { useSelector } from "react-redux";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import PostCard from "../../components/PostCard";
import PostOptionsModal from "../../components/PostOptionsModal";
import {
  useLikePostMutation,
  useRepostPostMutation,
  useBookmarkPostMutation,
  useDeletePostMutation,
} from "../../store/postApi";
import Animated, { 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate
} from "react-native-reanimated";

const { width } = Dimensions.get('window');

const EXPLORE_CATEGORIES = [
  { id: '1', name: 'Trending', icon: 'flame', color: '#F59E0B' },
  { id: '2', name: 'Mindful', icon: 'leaf', color: '#10B981' },
  { id: '3', name: 'Tech', icon: 'hardware-chip', color: '#6366F1' },
  { id: '4', name: 'Art', icon: 'color-palette', color: '#EC4899' },
  { id: '5', name: 'Gaming', icon: 'game-controller', color: '#8B5CF6' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const handleLike = useCallback(async (id: string) => {
    try {
      await likePost({ postId: id }).unwrap();
    } catch (err) {
      console.error("Like failed", err);
    }
  }, [likePost]);

  const handleBookmark = useCallback(async (id: string) => {
    try {
      await bookmarkPost(id).unwrap();
    } catch (err) {
      console.error("Bookmark failed", err);
    }
  }, [bookmarkPost]);

  const handleRepostAction = useCallback(async (post: any) => {
    try {
      await repostPost({ id: post.id }).unwrap();
    } catch (err) {
      console.error("Repost failed", err);
    }
  }, [repostPost]);

  const handlePressPost = useCallback((id: string) => {
    router.push(`/post/${id}`);
  }, [router]);

  const handlePressProfile = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(id === currentUser?.id ? "/profile" : `/profile/${id}`);
  }, [router, currentUser?.id]);

  const handlePressOptions = useCallback((p: any) => {
    setPostForOptions(p);
    setOptionsModalVisible(true);
  }, []);

  const filteredUsers = useMemo(() => {
    return searchResults?.users?.filter((user: any) => user.id !== currentUser?.id) || [];
  }, [searchResults, currentUser]);

  const tabProgress = useSharedValue(0);

  const handleTabChange = (tab: "users" | "posts" | "hashtags", index: number) => {
    if (tab === activeTab) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    tabProgress.value = withSpring(index * (1/3), { damping: 20, stiffness: 120 });
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    left: `${interpolate(tabProgress.value, [0, 1], [0, 100])}%`,
  }));

  const renderTrendingHashtag = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50)}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSearch(`#${item.name}`);
          setActiveTab("posts");
          tabProgress.value = withSpring(1/3, { damping: 20 });
        }}
        className="flex-row items-center p-5 border-b border-gray-100/50 bg-[#F8FAFC] justify-between"
      >
        <View className="flex-1 mr-4">
          <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Rising · #{index + 1}</Text>
          <Text className="font-black text-[18px] text-gray-900 tracking-tight">#{item.name}</Text>
          <Text className="text-gray-500 font-bold text-[11px] mt-1.5 uppercase tracking-wider">{item.count} Posts</Text>
        </View>
        <TouchableOpacity className="bg-gray-100/80 w-10 h-10 rounded-2xl items-center justify-center border border-gray-200/50">
            <Ionicons name="trending-up" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderHeroTrending = () => {
    if (!trendingData?.posts?.[0]) return null;
    const hero = trendingData.posts[0];
    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        className="mx-5 mt-4 mb-8 rounded-[40px] overflow-hidden shadow-xl shadow-sky-100 border border-white"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push(`/post/${hero.id}`);
        }}
      >
        <Image
          source={{ uri: hero.image || `https://api.dicebear.com/7.x/shapes/png?seed=${hero.id}` }}
          className="w-full h-56 bg-sky-200"
          contentFit="cover"
          transition={500}
        />
        <BlurView intensity={95} tint="light" className="p-6 bg-white/40 absolute bottom-0 left-0 right-0">
          <Text className="text-[10px] font-black text-sky-600 uppercase tracking-[3px] mb-2">Featured Post</Text>
          <Text className="text-xl font-black text-gray-900 tracking-tight leading-7" numberOfLines={2}>
            {hero.content}
          </Text>
          <View className="flex-row items-center mt-4">
            <View className="shadow-sm shadow-gray-200">
               <Image 
                 source={{ uri: hero.author?.image || `https://api.dicebear.com/7.x/avataaars/png?seed=${hero.author?.id}` }} 
                 className="w-7 h-7 rounded-xl mr-3 bg-white border border-gray-50" 
               />
            </View>
            <Text className="text-gray-500 font-black text-[12px] uppercase tracking-wider">@official</Text>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  const renderDefaultView = () => (
    <FlatList
      data={trendingData?.hashtags || []}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={() => (
        <View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}
          >
            {EXPLORE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => {
                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                   setSelectedCategory(cat.id);
                }}
                className={`flex-row items-center px-6 py-3 rounded-[24px] mr-3 shadow-sm ${
                  selectedCategory === cat.id ? 'bg-white border-sky-100' : 'bg-gray-100/50 border-gray-50'
                } border shadow-gray-200`}
              >
                <Ionicons 
                  name={cat.icon as any} 
                  size={16} 
                  color={selectedCategory === cat.id ? cat.color : '#94A3B8'} 
                />
                <Text className={`ml-3 font-black uppercase text-[11px] tracking-widest ${selectedCategory === cat.id ? 'text-gray-900' : 'text-gray-400'}`}>
                    {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {renderHeroTrending()}

          <View className="px-6 pb-4">
            <Text className="text-xl font-black text-gray-900 tracking-tighter uppercase">Trending Topics</Text>
          </View>
        </View>
      )}
      renderItem={renderTrendingHashtag}
      ListFooterComponent={() => ( trendingData?.hashtags?.length > 0 ? (
          <View className="p-12 items-center opacity-40">
             <Ionicons name="infinite" size={24} color="#94A3B8" />
          </View>
      ) : null)}
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => {
            if (activeTab === "users") {
                return (
                    <TouchableOpacity
                     onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/profile/${item.id}`);
                     }}
                     className="flex-row items-center p-5 border-b border-gray-100/50 bg-[#F8FAFC]"
                    >
                        <Image 
                          source={{ uri: item.image || `https://api.dicebear.com/7.x/avataaars/png?seed=${item.id}` }} 
                          className="w-14 h-14 rounded-[22px] bg-white border border-gray-50 shadow-sm" 
                        />
                        <View className="ml-4 flex-1">
                            <Text className="font-black text-[16px] text-gray-900 tracking-tight">{item.name}</Text>
                            <Text className="text-sky-500 font-bold text-[12px] uppercase tracking-wider">@{item.username}</Text>
                        </View>
                        <View className="bg-gray-100 w-10 h-10 rounded-2xl items-center justify-center">
                           <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                        </View>
                    </TouchableOpacity>
                );
            }
            if (activeTab === "hashtags") {
                 return renderTrendingHashtag({ item, index: 0 });
            }
            return (
                <View className="px-3">
                    <PostCard
                        item={item}
                        user={currentUser}
                        onPressPost={handlePressPost}
                        onPressProfile={handlePressProfile}
                        onPressOptions={handlePressOptions}
                        onPressComment={handlePressPost}
                        onPressRepost={handleRepostAction}
                        onLike={handleLike}
                        onBookmark={handleBookmark}
                    />
                </View>
            );
        }}
        ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center mt-20 px-10">
              <View className="w-20 h-20 bg-gray-100 rounded-[40px] items-center justify-center mb-6">
                 <Ionicons name="search" size={32} color="#CBD5E1" />
              </View>
              <Text className="text-gray-400 font-black uppercase text-xs tracking-widest text-center">No results found for &quot;{search}&quot;</Text>
            </View>
        )}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    );
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Search Header - Sticky Blur */}
      <BlurView intensity={90} tint="light" className="z-50 border-b border-gray-100/50" style={{ paddingTop: insets.top + 10 }}>
        <View className="px-5 pb-4">
            <View className="flex-row items-center bg-white rounded-[24px] px-5 py-3 border border-gray-100 shadow-sm shadow-gray-100/50">
                <Ionicons name="search" size={20} color="#94A3B8" />
                <TextInput
                    placeholder="Search Posts..."
                    placeholderTextColor="#CBD5E1"
                    className="flex-1 ml-4 text-[16px] text-gray-900 font-medium"
                    value={search}
                    onChangeText={(text) => {
                        setSearch(text);
                        if (text.length >= 2) {
                            // Optionally trigger vibration on typing results
                        }
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSearch("");
                    }}>
                        <Ionicons name="close-circle" size={20} color="#CBD5E1" />
                    </TouchableOpacity>
                )}
            </View>
        </View>

        {/* Tab System for Results */}
        {search.length >= 2 && (
            <View className="flex-row bg-white/20 h-14 relative px-2">
                {["users", "posts", "hashtags"].map((tab, index) => (
                    <TouchableOpacity
                        key={tab}
                        className="flex-1 items-center justify-center"
                        onPress={() => handleTabChange(tab as any, index)}
                    >
                        <Text className={`font-black uppercase text-[10px] tracking-widest ${activeTab === tab ? "text-gray-900" : "text-gray-400"}`}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
                <Animated.View 
                    style={[
                        { position: 'absolute', bottom: 0, width: '33.33%', height: 3, backgroundColor: '#0EA5E9', borderRadius: 3 },
                        indicatorStyle
                    ]} 
                />
            </View>
        )}
      </BlurView>

      {/* Main Content Area */}
      <View className="flex-1">
        {search.length < 2 ? renderDefaultView() : renderSearchContent()}
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/compose/post");
        }}
        style={{
          shadowColor: "#0EA5E9",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 15,
          elevation: 10,
        }}
        className="absolute bottom-28 right-6 bg-sky-500 w-16 h-16 rounded-[24px] items-center justify-center border-2 border-white/20"
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      <PostOptionsModal
        isVisible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        isOwner={postForOptions?.author?.id === currentUser?.id}
        onDelete={async () => {
          if (!postForOptions?.id) return;
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deletePost({ id: postForOptions.id }).unwrap();
            setOptionsModalVisible(false);
          } catch (err) {
            console.error("Delete failed", err);
          }
        }}
      />
    </View>
  );
}
