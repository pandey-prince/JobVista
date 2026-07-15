import { createSlice } from "@reduxjs/toolkit";

const dismissedJobsSlice = createSlice({
  name: "dismissedJobs",
  initialState: {
    dismissedJobKeys: [],
    dismissedJobs: [],
    loading: false,
  },
  reducers: {
    setDismissedJobKeys: (state, action) => {
      state.dismissedJobKeys = action.payload;
    },
    setDismissedJobs: (state, action) => {
      state.dismissedJobs = action.payload;
    },
    setDismissedJobsLoading: (state, action) => {
      state.loading = action.payload;
    },
    addDismissedJobKey: (state, action) => {
      if (!state.dismissedJobKeys.includes(action.payload)) {
        state.dismissedJobKeys.push(action.payload);
      }
    },
    removeDismissedJobKey: (state, action) => {
      state.dismissedJobKeys = state.dismissedJobKeys.filter(
        (key) => key !== action.payload,
      );
      state.dismissedJobs = state.dismissedJobs.filter(
        (item) => item.jobKey !== action.payload,
      );
    },
  },
});

export const {
  setDismissedJobKeys,
  setDismissedJobs,
  setDismissedJobsLoading,
  addDismissedJobKey,
  removeDismissedJobKey,
} = dismissedJobsSlice.actions;

export default dismissedJobsSlice.reducer;
