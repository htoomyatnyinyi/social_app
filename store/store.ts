import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { api } from "./api"; // Your base API
import authReducer from "./authSlice"; // The persisted auth slice
import settingsReducer from "./settingsSlice"; // The persisted settings slice
import { AppState } from "react-native";

// 1. Combine all your reducers
const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  auth: authReducer,
  settings: settingsReducer,
});

// 2. Configure persistence for the entire root or parts of it
const persistConfig = {
  key: "root",
  version: 1,
  storage: AsyncStorage,
  whitelist: ["auth", "settings"], // Persist auth and settings state
  blacklist: [api.reducerPath], // NEVER persist the API cache
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// 3. Configure the Store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions for serialization checks
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(api.middleware as any),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


// THIS IS THE KEY: Custom listener for React Native
setupListeners(store.dispatch, (dispatch, actions) => {
  let isFocused = true;

  // 1. Handle Focus (AppState)
  const subscription = AppState.addEventListener('change', (nextAppState: any) => {
    if (nextAppState === 'active') {
      dispatch(actions.onFocus());
    } else {
      dispatch(actions.onFocusLost());
    }
  });

  // 2. Handle Reconnect (Optional: requires @react-native-community/netinfo)
  // If you have NetInfo installed, uncomment this:
  /*
  NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      dispatch(actions.onOnline());
    } else {
      dispatch(actions.onOffline());
    }
  });
  */

  return () => subscription.remove();
});