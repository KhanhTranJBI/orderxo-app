import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { isStoreOpen } from "../lib/storeUtils";
import { getStoreConfig, apiFetch } from "@/lib/api";

/* ---------------- FETCH CONFIG ---------------- */
export const fetchStoreStatus = createAsyncThunk(
  "store/fetchStatus",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getStoreConfig();
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

/* ---------------- UPDATE CONFIG ---------------- */
export const updateStoreConfig = createAsyncThunk(
  "store/updateConfig",
  async ({ isOpenManual, hours, token }, { rejectWithValue }) => {
    try {
      // IMPORTANT: API should return the UPDATED config
      const updatedConfig = await apiFetch(
        "/api/admin/store-config/update",
        {
          method: "POST",
          body: JSON.stringify({
            isOpenManual,
            hours,
          }),
        },
        token,
      );

      return updatedConfig;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

/* ---------------- FETCH NOTICES (PUBLIC) ---------------- */
export const fetchNotices = createAsyncThunk(
  "store/fetchNotices",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiFetch("/api/notices");
      return res.notices;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch notices");
    }
  },
);

/* ---------------- CREATE NOTICE (ADMIN) ---------------- */
export const createNotice = createAsyncThunk(
  "store/createNotice",
  async ({ data, token }, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        "/api/admin/notices/create",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        token,
      );

      return res.notice;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to create notice");
    }
  },
);

/* ---------------- UPDATE NOTICE (ADMIN) ---------------- */
export const updateNotice = createAsyncThunk(
  "store/updateNotice",
  async ({ id, data, token }, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        "/api/admin/notices/update",
        {
          method: "POST",
          body: JSON.stringify({ id, ...data }),
        },
        token,
      );

      return res.notice;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to update notice");
    }
  },
);

export const deleteNotice = createAsyncThunk(
  "store/deleteNotice",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      await apiFetch(
        "/api/admin/notices/delete",
        {
          method: "POST",
          body: JSON.stringify({ id }),
        },
        token,
      );
      return id;
    } catch (err) {
      return rejectWithValue("Delete failed");
    }
  },
);

/* ---------------- UPDATE STORE STATUS ONLY ---------------- */
export const updateStoreStatus = createAsyncThunk(
  "store/updateStatus",
  async ({ isOpenManual, token }, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        "/api/admin/store-config/update-status",
        {
          method: "POST",
          body: JSON.stringify({ isOpenManual }),
        },
        token,
      );

      return res; // { success, isOpenManual }
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to update store status");
    }
  },
);

const storeSlice = createSlice({
  name: "store",
  initialState: {
    config: null,
    isOpen: true,
    notices: [],
    loading: false,
    error: null,
  },
  reducers: {
    refreshOpenStatus: (state) => {
      if (state.config) {
        state.isOpen = isStoreOpen(state.config);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      /* ---------- FETCH ---------- */
      .addCase(fetchStoreStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStoreStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload;
        state.isOpen = isStoreOpen(action.payload);
      })
      .addCase(fetchStoreStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------- UPDATE ---------- */
      .addCase(updateStoreConfig.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateStoreConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload.config;
        state.isOpen = isStoreOpen(action.payload);
      })
      .addCase(updateStoreConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------- FETCH NOTICES ---------- */
      .addCase(fetchNotices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotices.fulfilled, (state, action) => {
        state.loading = false;
        state.notices = action.payload;
      })
      .addCase(fetchNotices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------- CREATE NOTICE ---------- */
      .addCase(createNotice.fulfilled, (state, action) => {
        state.notices.unshift(action.payload); // newest first
      })

      /* ---------- UPDATE NOTICE ---------- */
      .addCase(updateNotice.fulfilled, (state, action) => {
        const index = state.notices.findIndex((n) => n._id === action.payload._id);
        if (index !== -1) {
          state.notices[index] = action.payload;
        }
      })

      /* ---------- DELETE NOTICE ---------- */
      .addCase(deleteNotice.fulfilled, (state, action) => {
        state.notices = state.notices.filter((n) => n._id !== action.payload);
      })

      /* ---------- UPDATE STORE STATUS ---------- */
      .addCase(updateStoreStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateStoreStatus.fulfilled, (state, action) => {
        state.loading = false;

        if (state.config) {
          state.config.isOpenManual = action.payload.isOpenManual;
          state.isOpen = isStoreOpen(state.config);
        }
      })
      .addCase(updateStoreStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { refreshOpenStatus } = storeSlice.actions;
export default storeSlice.reducer;
