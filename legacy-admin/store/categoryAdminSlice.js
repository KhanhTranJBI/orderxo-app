import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "@/lib/api";

/* ---------------- FETCH ALL (ADMIN) ---------------- */
export const fetchAdminCategories = createAsyncThunk(
  "categoryAdmin/fetchAll",
  async (token, { rejectWithValue }) => {
    try {
      const res = await apiFetch("/api/admin/categories", { method: "GET" }, token);
      return res.categories;
    } catch (err) {
      return rejectWithValue(err?.message || "Fetch failed");
    }
  },
);

/* ---------------- CREATE ---------------- */
export const createCategory = createAsyncThunk(
  "categoryAdmin/create",
  async ({ data, token }, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        "/api/admin/categories/create",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        token,
      );
      return res.category;
    } catch (err) {
      return rejectWithValue(err?.message || "Create failed");
    }
  },
);

/* ---------------- UPDATE ---------------- */
export const updateCategory = createAsyncThunk(
  "categoryAdmin/update",
  async ({ data, token }, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        "/api/admin/categories/update",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        token,
      );
      return res.category;
    } catch (err) {
      return rejectWithValue(err?.message || "Update failed");
    }
  },
);

/* ---------------- DELETE ---------------- */
export const deleteCategory = createAsyncThunk(
  "categoryAdmin/delete",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      await apiFetch(
        "/api/admin/categories/delete",
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

/* ---------------- REORDER ---------------- */
export const reorderCategories = createAsyncThunk(
  "categoryAdmin/reorder",
  async ({ orders, token }, { rejectWithValue }) => {
    try {
      await apiFetch(
        "/api/admin/categories/reorder",
        {
          method: "POST",
          body: JSON.stringify({ orders }),
        },
        token,
      );
      return orders;
    } catch (err) {
      return rejectWithValue(err?.message || "Reorder failed");
    }
  },
);

const categoryAdminSlice = createSlice({
  name: "categoryAdmin",
  initialState: {
    categories: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder

      /* -------- FETCH -------- */
      .addCase(fetchAdminCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.loading = false;
      })
      .addCase(fetchAdminCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* -------- CREATE -------- */
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
        state.categories.sort((a, b) => a.order - b.order);
      })

      /* -------- UPDATE -------- */
      .addCase(updateCategory.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.categories.findIndex((c) => c._id === updated._id);

        if (index !== -1) {
          state.categories[index] = {
            ...state.categories[index],
            ...updated,
          };
        }

        state.categories.sort((a, b) => a.order - b.order);
      })

      /* -------- DELETE -------- */
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter((c) => c._id !== action.payload);
      })

      /* -------- OPTIMISTIC REORDER -------- */
      .addCase(reorderCategories.pending, (state, action) => {
        const orderMap = new Map(action.meta.arg.orders.map((o) => [o.id, o.order]));

        state.categories.forEach((cat) => {
          if (orderMap.has(cat._id)) {
            cat.order = orderMap.get(cat._id);
          }
        });

        state.categories.sort((a, b) => a.order - b.order);
      });
  },
});

export default categoryAdminSlice.reducer;
