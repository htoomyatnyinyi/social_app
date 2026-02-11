import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  user: any | null;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      { payload: { user, token } }: PayloadAction<{ user: any; token: string }>,
    ) => {
      state.user = user;
      state.token = token;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
    },
  },
});

// Persistence Configuration
const authPersistConfig = {
  key: "auth",
  storage: AsyncStorage,
};

export const { setCredentials, logout } = authSlice.actions;
// Export the persisted reducer
export default persistReducer(authPersistConfig, authSlice.reducer);

// import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// interface AuthState {
//   user: any | null;
//   token: string | null;
// }

// const initialState: AuthState = {
//   user: null,
//   token: null,
// };

// const authSlice = createSlice({
//   name: "auth",
//   initialState,
//   reducers: {
//     setCredentials: (
//       state,
//       { payload: { user, token } }: PayloadAction<{ user: any; token: string }>,
//     ) => {
//       state.user = user;
//       state.token = token;
//     },
//     logout: (state) => {
//       state.user = null;
//       state.token = null;
//     },
//   },
// });

// export const { setCredentials, logout } = authSlice.actions;
// export default authSlice.reducer;
