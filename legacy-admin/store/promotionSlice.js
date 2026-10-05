import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "@/lib/api";

/* ================= FETCH ALL PROMOTIONS ================= */
export const fetchAllPromotions = createAsyncThunk(
  "promotion/fetchAll",
  async ({ token }, { rejectWithValue }) => {
    try {
      const data = await apiFetch(
        "/api/admin/promotions",
        {
          method: "GET",
        },
        token,
      );

      return data.promotions || [];
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to load promotions");
    }
  },
);

/* ================= CREATE PROMOTION ================= */
export const createPromotion = createAsyncThunk(
  "promotion/createPromotion",
  async ({ data, token }, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        "/api/admin/promotions/create",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        token,
      );

      return res.promotion;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to create promotion");
    }
  },
);

/* ================= UPDATE PROMOTION ================= */
export const updatePromotion = createAsyncThunk(
  "promotion/updatePromotion",
  async ({ promotionId, data, token }, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        "/api/admin/promotions/update",
        {
          method: "PUT",
          body: JSON.stringify({
            id: promotionId,
            ...data,
          }),
        },
        token,
      );

      // Return FULL updated promotion
      return res.promotion;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to update promotion");
    }
  },
);

/* ================= TOGGLE ACTIVE ================= */
export const togglePromotionActive = createAsyncThunk(
  "promotion/togglePromotionActive",
  async ({ id, isActive, token }, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        "/api/admin/promotions/update-active",
        {
          method: "PUT",
          body: JSON.stringify({
            id,
            isActive,
          }),
        },
        token,
      );

      return res.promotion;
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to update promotion");
    }
  },
);

/* ================= DELETE PROMOTION ================= */
export const deletePromotion = createAsyncThunk(
  "promotion/deletePromotion",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      await apiFetch(
        "/api/admin/promotions/delete",
        {
          method: "POST",
          body: JSON.stringify({
            promotionId: id,
          }),
        },
        token,
      );

      return id;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to delete promotion");
    }
  },
);

export const evaluatePromotion = createAsyncThunk(
  "promotion/evaluatePromotion",
  async ({ code, subtotalCents, email, channel }, { rejectWithValue }) => {
    try {
      const res = await apiFetch("/api/promotions/verify", {
        method: "POST",
        body: JSON.stringify({
          code,
          subtotalCents,
          email,
          channel,
        }),
      });

      if (!res.valid) {
        return rejectWithValue(res.message || "Invalid promotion code");
      }

      return {
        code: res.code,
        description: res.description,
        discountAmount: Number(res.discountAmount || 0),
      };
    } catch (err) {
      return rejectWithValue(
        err?.message || "Something went wrong. Please try again.",
      );
    }
  },
);

/* ========================================================= */

const promotionSlice = createSlice({
  name: "promotion",

  initialState: {
    allPromotions: [],

    // Admin
    loading: false,
    updating: false,
    creating: false,
    deleting: false,

    // Checkout
    promotion: null,
    evaluating: false,
    evaluateError: null,

    error: null,
  },

  reducers: {
    clearPromotion: (state) => {
      state.promotion = null;
      state.evaluateError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ================= FETCH ================= */
      .addCase(fetchAllPromotions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchAllPromotions.fulfilled, (state, action) => {
        state.allPromotions = action.payload;
        state.loading = false;
      })

      .addCase(fetchAllPromotions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load promotions";
      })

      /* ================= CREATE ================= */
      .addCase(createPromotion.pending, (state) => {
        state.creating = true;
        state.error = null;
      })

      .addCase(createPromotion.fulfilled, (state, action) => {
        if (action.payload) {
          state.allPromotions.push(action.payload);
        }

        state.creating = false;
      })

      .addCase(createPromotion.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || "Failed to create promotion";
      })

      /* ================= UPDATE ================= */
      .addCase(updatePromotion.pending, (state) => {
        state.updating = true;
        state.error = null;
      })

      .addCase(updatePromotion.fulfilled, (state, action) => {
        const updated = action.payload;

        const index = state.allPromotions.findIndex(
          (promotion) => promotion._id === updated._id,
        );

        if (index !== -1) {
          // FULL replacement
          // Ensures all fields are updated
          state.allPromotions[index] = updated;
        }

        state.updating = false;
      })

      .addCase(updatePromotion.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || "Failed to update promotion";
      })

      /* ================= TOGGLE ACTIVE ================= */
      .addCase(togglePromotionActive.pending, (state) => {
        state.updating = true;
        state.error = null;
      })

      .addCase(togglePromotionActive.fulfilled, (state, action) => {
        const updatedPromotion = action.payload;

        const index = state.allPromotions.findIndex(
          (promotion) => promotion._id === updatedPromotion._id,
        );

        if (index !== -1) {
          state.allPromotions[index] = updatedPromotion;
        }

        state.updating = false;
      })

      .addCase(togglePromotionActive.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || "Failed to update promotion status";
      })

      /* ================= DELETE ================= */
      .addCase(deletePromotion.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })

      .addCase(deletePromotion.fulfilled, (state, action) => {
        state.allPromotions = state.allPromotions.filter(
          (promotion) => promotion._id !== action.payload,
        );

        state.deleting = false;
      })

      .addCase(deletePromotion.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "Failed to delete promotion";
      })

      .addCase(evaluatePromotion.pending, (state) => {
        state.evaluating = true;
        state.evaluateError = null;
      })

      .addCase(evaluatePromotion.fulfilled, (state, action) => {
        state.evaluating = false;
        state.evaluateError = null;
        state.promotion = action.payload;
      })

      .addCase(evaluatePromotion.rejected, (state, action) => {
        state.evaluating = false;
        state.promotion = null;
        state.evaluateError = action.payload || "Invalid promotion code";
      });
  },
});

export const { clearPromotion } = promotionSlice.actions;

export default promotionSlice.reducer;
