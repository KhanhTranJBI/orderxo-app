import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "@/lib/api";

/* ================= FETCH MODIFIERS ================= */
export const fetchModifierGroups = createAsyncThunk(
  "modifiers/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiFetch("/api/modifiers");
      return res.groups;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to load modifiers");
    }
  },
);

/* ================= CREATE / UPDATE ================= */
export const upsertModifierGroup = createAsyncThunk(
  "modifiers/upsert",
  async ({ data, token }, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        "/api/admin/modifiers/upsert",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        token,
      );
      return res.group;
    } catch (err) {
      return rejectWithValue(err?.message || "Save failed");
    }
  },
);

/* ================= DELETE ================= */
export const deleteModifierGroup = createAsyncThunk(
  "modifiers/delete",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      await apiFetch(
        "/api/admin/modifiers/delete",
        {
          method: "POST",
          body: JSON.stringify({ id }),
        },
        token,
      );
      return id;
    } catch (err) {
      return rejectWithValue(err?.message || "Delete failed");
    }
  },
);

const modifierSlice = createSlice({
  name: "modifiers",
  initialState: {
    all: {}, // 🔑 normalized by _id
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* ---------- FETCH ---------- */
      .addCase(fetchModifierGroups.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchModifierGroups.fulfilled, (state, action) => {
        state.loading = false;
        action.payload.forEach((group) => {
          state.all[group._id] = group;
        });
      })
      .addCase(fetchModifierGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------- UPSERT ---------- */
      .addCase(upsertModifierGroup.fulfilled, (state, action) => {
        state.all[action.payload._id] = action.payload;
      })

      /* ---------- DELETE ---------- */
      .addCase(deleteModifierGroup.fulfilled, (state, action) => {
        delete state.all[action.payload];
      });
  },
});

export default modifierSlice.reducer;
