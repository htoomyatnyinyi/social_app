import React, { useState } from "react";
import { View, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import {
  Card,
  Button,
  Icon,
  List,
  WhiteSpace,
  WingBlank,
  Tabs,
} from "@ant-design/react-native";
import { useGetPostsQuery, useLikePostMutation } from "../../store/postApi";

export default function FeedScreen() {
  const [activeTab, setActiveTab] = useState("public");
  const { data: posts, isLoading, refetch } = useGetPostsQuery(activeTab);
  const [likePost] = useLikePostMutation();

  const tabs = [
    { title: "Public Feed", key: "public" },
    { title: "Private Feed", key: "private" },
  ];

  if (isLoading && !posts) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#108ee9" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => (
    <WingBlank size="lg">
      <WhiteSpace size="lg" />
      <Card>
        <Card.Header
          title={item.author?.name || "Anonymous"}
          thumbStyle={{ width: 30, height: 30 }}
          extra={new Date(item.createdAt).toLocaleDateString()}
        />
        <Card.Body>
          <View style={{ padding: 16 }}>
            <List.Item wrap>{item.content}</List.Item>
          </View>
        </Card.Body>
        <Card.Footer
          content={
            <Button
              type="ghost"
              size="small"
              onPress={() => likePost(item.id)}
              style={styles.actionButton}
            >
              <Icon name="heart" color="red" size="xs" />{" "}
              {item._count?.likes || 0}
            </Button>
          }
          extra={
            <View style={{ flexDirection: "row" }}>
              <Button type="ghost" size="small" style={styles.actionButton}>
                <Icon name="message" size="xs" /> {item._count?.comments || 0}
              </Button>
              <Button type="ghost" size="small" style={styles.actionButton}>
                <Icon name="share-alt" size="xs" /> {item._count?.shares || 0}
              </Button>
            </View>
          }
        />
      </Card>
    </WingBlank>
  );

  return (
    <View style={styles.container}>
      <Tabs
        tabs={tabs}
        onChange={(tab) => {
          setActiveTab(tab.key);
          refetch();
        }}
      >
        <View style={{ flex: 1 }}>
          <FlatList
            data={posts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            refreshing={isLoading}
            onRefresh={refetch}
          />
        </View>
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f9",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButton: {
    borderWidth: 0,
    paddingHorizontal: 10,
  },
});
