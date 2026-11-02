import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAdmin: false,
  showSuccess: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginAdmin: (state) => {
      state.isAdmin = true;
      state.showSuccess = true;
    },
    hideSuccess: (state) => {
      state.showSuccess = false;
    },
  },
});

export const { loginAdmin, hideSuccess } = authSlice.actions;
export default authSlice.reducer;
