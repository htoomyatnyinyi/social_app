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

// 1. Combine all your reducers
const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  auth: authReducer,
});

// 2. Configure persistence for the entire root or parts of it
const persistConfig = {
  key: "root",
  version: 1,
  storage: AsyncStorage,
  whitelist: ["auth"], // ONLY persist the auth state (user/token)
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
    }).concat(api.middleware),
});

// 4. Setup listeners for cache behaviors
setupListeners(store.dispatch);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// import { configureStore, combineReducers } from "@reduxjs/toolkit";
// import { setupListeners } from "@reduxjs/toolkit/query";
// import {
//   persistStore,
//   persistReducer,
//   FLUSH,
//   REHYDRATE,
//   PAUSE,
//   PERSIST,
//   PURGE,
//   REGISTER,
// } from "redux-persist";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { api } from "./api";
// import authReducer from "./authSlice";

// const persistConfig = {
//   key: "root",
//   version: 1,
//   storage: AsyncStorage,
//   whitelist: ["auth"], // Only persist the auth slice
// };

// const rootReducer = combineReducers({
//   [api.reducerPath]: api.reducer,
//   auth: authReducer,
// });

// const persistedReducer = persistReducer(persistConfig, rootReducer);

// export const store = configureStore({
//   reducer: persistedReducer,
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: {
//         ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
//       },
//     }).concat(api.middleware),
// });

// export const persistor = persistStore(store);

// setupListeners(store.dispatch);

// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
