import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Button,
  InputItem,
  List,
  WhiteSpace,
  WingBlank,
  Tabs,
  Toast,
} from "@ant-design/react-native";
import { useSignupMutation, useSigninMutation } from "../store/authApi";
import { useDispatch } from "react-redux";
import { setCredentials } from "../store/authSlice";
import { useRouter } from "expo-router";

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [signup, { isLoading: isSignupLoading }] = useSignupMutation();
  const [signin, { isLoading: isSigninLoading }] = useSigninMutation();
  const dispatch = useDispatch();
  const router = useRouter();

  const handleAuth = async () => {
    try {
      if (activeTab === 0) {
        // Sign In
        const res = await signin({ email, password }).unwrap();
        console.log(res, "signin return");
        dispatch(setCredentials({ user: res.user, token: res.token }));
        Toast.success("Welcome back!");
        router.replace("/(tabs)");
      } else {
        // Sign Up
        const res = await signup({ email, password, name }).unwrap();
        dispatch(setCredentials({ user: res.user, token: res.token }));
        Toast.success("Account created!");
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      Toast.fail(err.data?.message || "Authentication failed");
    }
  };

  const tabs = [{ title: "Sign In" }, { title: "Sign Up" }];

  return (
    <ScrollView style={styles.container}>
      <WingBlank size="lg">
        <WhiteSpace size="xl" />
        <Tabs
          tabs={tabs}
          page={activeTab}
          onChange={(_, index) => setActiveTab(index)}
        >
          <View style={styles.tabContent}>
            <List>
              <InputItem
                placeholder="Email"
                value={email}
                onChange={(value) => setEmail(value)}
              >
                Email
              </InputItem>
              <InputItem
                placeholder="Password"
                type="password"
                value={password}
                onChange={(value) => setPassword(value)}
              >
                Pass
              </InputItem>
            </List>
          </View>
          <View style={styles.tabContent}>
            <List>
              <InputItem
                placeholder="Name"
                value={name}
                onChange={(value) => setName(value)}
              >
                Name
              </InputItem>
              <InputItem
                placeholder="Email"
                value={email}
                onChange={(value) => setEmail(value)}
              >
                Email
              </InputItem>
              <InputItem
                placeholder="Password"
                type="password"
                value={password}
                onChange={(value) => setPassword(value)}
              >
                Pass
              </InputItem>
            </List>
          </View>
        </Tabs>

        <WhiteSpace size="xl" />
        <Button
          type="primary"
          onPress={handleAuth}
          loading={isSignupLoading || isSigninLoading}
        >
          {activeTab === 0 ? "Sign In" : "Sign Up"}
        </Button>
      </WingBlank>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f9",
  },
  tabContent: {
    backgroundColor: "#fff",
    paddingVertical: 20,
  },
});
