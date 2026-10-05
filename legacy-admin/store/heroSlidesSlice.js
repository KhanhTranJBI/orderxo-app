"use client";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "@/lib/api";

/* ================= GET ALL (Public) ================= */
export const fetchHeroSlides = createAsyncThunk(
  "heroSlides/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiFetch("/api/hero-slides", { method: "GET" });
      return Array.isArray(res) ? res : res.slides;
    } catch (err) {
      return rejectWithValue(err?.message || "Fetch failed");
    }
  },
);

/* ================= CREATE ================= */
export const createHeroSlide = createAsyncThunk(
  "heroSlides/create",
  async ({ data, token }, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        "/api/admin/hero-slides",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        token,
      );

      return res;
    } catch (err) {
      return rejectWithValue(err?.message || "Create failed");
    }
  },
);

/* ================= UPDATE ================= */
export const updateHeroSlide = createAsyncThunk(
  "heroSlides/update",
  async ({ id, data, token }, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        "/api/admin/hero-slides",
        {
          method: "PUT",
          body: JSON.stringify({ id, ...data }),
        },
        token,
      );

      return res;
    } catch (err) {
      return rejectWithValue(err?.message || "Update failed");
    }
  },
);

/* ================= DELETE ================= */
export const deleteHeroSlide = createAsyncThunk(
  "heroSlides/delete",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      await apiFetch(
        "/api/admin/hero-slides",
        {
          method: "DELETE",
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

/* ================= REORDER ================= */
export const reorderHeroSlides = createAsyncThunk(
  "heroSlides/reorder",
  async ({ slides, token }, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        "/api/admin/hero-slides/reorder",
        {
          method: "POST",
          body: JSON.stringify({ slides }), // array of { _id, order }
        },
        token,
      );

      return res.slides; // backend should return updated slides
    } catch (err) {
      return rejectWithValue(err?.message || "Reorder failed");
    }
  },
);

/* ================= SLICE ================= */
const heroSlidesSlice = createSlice({
  name: "heroSlides",
  initialState: {
    slides: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* FETCH */
      .addCase(fetchHeroSlides.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHeroSlides.fulfilled, (state, action) => {
        state.loading = false;
        state.slides = action.payload || [];
      })
      .addCase(fetchHeroSlides.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* CREATE */
      .addCase(createHeroSlide.fulfilled, (state, action) => {
        state.slides.push(action.payload);
      })

      /* UPDATE */
      .addCase(updateHeroSlide.fulfilled, (state, action) => {
        const index = state.slides.findIndex(
          (s) => s._id === action.payload._id,
        );
        if (index !== -1) state.slides[index] = action.payload;
      })

      /* DELETE */
      .addCase(deleteHeroSlide.fulfilled, (state, action) => {
        state.slides = state.slides.filter((s) => s._id !== action.payload);
      })

      /* REORDER */
      .addCase(reorderHeroSlides.fulfilled, (state, action) => {
        const orderMap = new Map(action.payload.map((o) => [o._id, o.order]));

        state.slides.forEach((s) => {
          if (orderMap.has(s._id)) {
            s.order = orderMap.get(s._id);
          }
        });

        state.slides.sort((a, b) => a.order - b.order);
      });
  },
});

export default heroSlidesSlice.reducer;
