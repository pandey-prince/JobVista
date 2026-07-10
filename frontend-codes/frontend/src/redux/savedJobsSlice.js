import { createSlice } from "@reduxjs/toolkit";

const savedJobsSlice = createSlice({
  name: "savedJobs",
  initialState: {
    savedJobKeys: [],
    savedJobs: [],
    loading: false,
  },
  reducers: {
    setSavedJobKeys: (state, action) => {
      state.savedJobKeys = action.payload;
    },
    setSavedJobs: (state, action) => {
      state.savedJobs = action.payload;
    },
    setSavedJobsLoading: (state, action) => {
      state.loading = action.payload;
    },
    addSavedJobKey: (state, action) => {
      if (!state.savedJobKeys.includes(action.payload)) {
        state.savedJobKeys.push(action.payload);
      }
    },
    removeSavedJobKey: (state, action) => {
      state.savedJobKeys = state.savedJobKeys.filter((key) => key !== action.payload);
      state.savedJobs = state.savedJobs.filter((item) => item.jobKey !== action.payload);
    },
  },
});

export const {
  setSavedJobKeys,
  setSavedJobs,
  setSavedJobsLoading,
  addSavedJobKey,
  removeSavedJobKey,
} = savedJobsSlice.actions;

export default savedJobsSlice.reducer;
