import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getMenuItems, apiFetch } from "@/lib/api";

/* ---------------- FETCH MENU ---------------- */
export const fetchAllMenu = createAsyncThunk("menu/fetchAll", async () => {
  const data = await getMenuItems();
  return data.items;
});

/* ---------------- TOGGLE ACTIVE ---------------- */
export const toggleMenuItemActive = createAsyncThunk(
  "menu/toggleActive",
  async ({ id, isActive, token }, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        "/api/admin/menu/update-active",
        {
          method: "POST",
          body: JSON.stringify({
            menuItemId: id,
            isActive,
          }),
        },
        token
      );

      return { id, isActive: res.isActive };
    } catch (err) {
      return rejectWithValue(err?.message || "Update failed");
    }
  }
);

/* ================= UPDATE MENU ITEM (EDIT MODAL) ================= */
export const updateMenuItem = createAsyncThunk(
  "menu/updateItem",
  async ({ menuItemId, data, token }, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        "/api/admin/menu/update",
        {
          method: "POST",
          body: JSON.stringify({
            menuItemId,
            ...data,
          }),
        },
        token
      );
      return res.item; // return FULL updated item
    } catch (err) {
      return rejectWithValue(err?.message || "Update failed");
    }
  }
);

export const reorderItems = createAsyncThunk(
  "menu/reorderItems",
  async ({ categorySlug, orders, token }, { rejectWithValue }) => {
    try {
      await apiFetch(
        "/api/admin/menu/reorder",
        {
          method: "POST",
          body: JSON.stringify({ categorySlug, orders }),
        },
        token
      );
      return { categorySlug, orders };
    } catch (err) {
      return rejectWithValue(err?.message || "Reorder failed");
    }
  }
);

export const createMenuItem = createAsyncThunk(
  "menu/createMenuItem",
  async ({ data, token }, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        "/api/admin/menu/create",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        token
      );

      return res.item;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteMenuItem = createAsyncThunk(
  "menu/deleteItem",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      await apiFetch(
        "/api/admin/menu/delete",
        {
          method: "POST",
          body: JSON.stringify({ menuItemId: id }),
        },
        token
      );
      return id;
    } catch (err) {
      return rejectWithValue(err?.message || "Delete failed");
    }
  }
);

const menuSlice = createSlice({
  name: "menu",
  initialState: {
    allItems: [],
    loading: false,
    updating: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* FETCH MENU */
      .addCase(fetchAllMenu.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllMenu.fulfilled, (state, action) => {
        state.allItems = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllMenu.rejected, (state) => {
        state.loading = false;
        state.error = action.error?.message || "Failed to load menu";
      })

      /* TOGGLE ACTIVE */
      .addCase(toggleMenuItemActive.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(toggleMenuItemActive.fulfilled, (state, action) => {
        const { id, isActive } = action.payload;

        const itemIndex = state.allItems.findIndex((i) => i._id === id);
        if (itemIndex !== -1) {
          state.allItems[itemIndex] = {
            ...state.allItems[itemIndex],
            isActive,
          };
        }

        state.updating = false;
      })
      .addCase(toggleMenuItemActive.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })

      /* ---------- UPDATE MENU ITEM ---------- */
      .addCase(updateMenuItem.pending, (state) => {
        state.updating = true;
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.allItems.findIndex((i) => i._id === updated._id);

        if (index !== -1) {
          // FULL replace so modifiers, images, flags all update
          state.allItems[index] = updated;
        }

        state.updating = false;
      })
      .addCase(updateMenuItem.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })

      // /* ---------- REORDER CATEGORIES (OPTIMISTIC) ---------- */
      // .addCase(reorderCategories.pending, (state, action) => {
      //   // optimistic: update local category order
      //   action.meta.arg.orders.forEach(({ slug, order }) => {
      //     const cat = state.allItems.find(
      //       (i) => i.category?.slug === slug
      //     )?.category;
      //     if (cat) cat.order = order;
      //   });
      // })

      /* ---------- REORDER ITEMS (OPTIMISTIC) ---------- */
      .addCase(reorderItems.pending, (state, action) => {
        const { orders } = action.meta.arg;
        orders.forEach(({ id, order }) => {
          const item = state.allItems.find((i) => i._id === id);
          if (item) item.order = order;
        });
      })

      .addCase(createMenuItem.fulfilled, (state, action) => {
        state.allItems.push(action.payload);
      })

      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.allItems = state.allItems.filter(
          (item) => item._id !== action.payload
        );
      });
  },
});

export default menuSlice.reducer;
