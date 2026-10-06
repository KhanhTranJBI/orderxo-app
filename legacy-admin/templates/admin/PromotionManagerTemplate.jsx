"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Power, Loader2, X, Tag } from "lucide-react";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import clsx from "clsx";

import {
  fetchAllPromotions,
  createPromotion,
  updatePromotion,
  togglePromotionActive,
} from "@/store/promotionSlice";

export default function AdminPromotionManagerTemplate() {
  const { data: session, status } = useSession();
  const dispatch = useDispatch();

  /* ================= REDUX ================= */

  const { allPromotions, loading, creating, updating, error } = useSelector(
    (state) => state.promotion,
  );

  const promotions = allPromotions || [];

  /* ================= LOCAL STATE ================= */

  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);

  const [deactivatePromotion, setDeactivatePromotion] = useState(null);
  const [deactivatingId, setDeactivatingId] = useState(null);

  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "percent",
    discountValue: "",
    maxDiscountAmount: "",
    minSubtotal: "",
    startsAt: "",
    endsAt: "",
    usageLimit: "",
    perCustomerLimit: "1",
    channels: ["online"],
    active: true,
  });

  /* ================= FETCH ================= */

  useEffect(() => {
    if (session?.jwt) {
      dispatch(fetchAllPromotions({ token: session.jwt }));
    }
  }, [dispatch, session?.jwt]);

  /* ================= FORM ================= */

  const resetForm = () => {
    setForm({
      code: "",
      description: "",
      discountType: "percent",
      discountValue: "",
      maxDiscountAmount: "",
      minSubtotal: "",
      startsAt: "",
      endsAt: "",
      usageLimit: "",
      perCustomerLimit: "1",
      channels: ["online"],
      active: true,
    });
  };

  const openCreate = () => {
    setEditingPromotion(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (promotion) => {
    setEditingPromotion(promotion);

    setForm({
      code: promotion.code || "",
      description: promotion.description || "",

      discountType: promotion.discountType || "percent",

      discountValue: promotion.discountValue != null ? String(promotion.discountValue) : "",

      maxDiscountAmount:
        promotion.maxDiscountAmount != null ? String(promotion.maxDiscountAmount) : "",

      minSubtotal: promotion.minSubtotal != null ? String(promotion.minSubtotal) : "",

      startsAt: promotion.startsAt ? toDateTimeLocal(promotion.startsAt) : "",

      endsAt: promotion.endsAt ? toDateTimeLocal(promotion.endsAt) : "",

      usageLimit: promotion.usageLimit != null ? String(promotion.usageLimit) : "",

      perCustomerLimit:
        promotion.perCustomerLimit != null ? String(promotion.perCustomerLimit) : "1",

      channels:
        Array.isArray(promotion.channels) && promotion.channels.length
          ? promotion.channels
          : ["online"],

      active: promotion.active !== false,
    });

    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleChannel = (channel) => {
    setForm((prev) => {
      const exists = prev.channels.includes(channel);

      if (exists) {
        // Don't allow an empty channel list
        if (prev.channels.length === 1) {
          return prev;
        }

        return {
          ...prev,
          channels: prev.channels.filter((c) => c !== channel),
        };
      }

      return {
        ...prev,
        channels: [...prev.channels, channel],
      };
    });
  };

  /* ================= SAVE ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session?.jwt) {
      toast.error("Not authenticated");
      return;
    }

    if (!form.code.trim()) {
      toast.error("Promo code is required");
      return;
    }

    if (form.discountValue === "" || Number(form.discountValue) < 0) {
      toast.error("Enter a valid discount value");
      return;
    }

    if (form.discountType === "percent" && Number(form.discountValue) > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }

    if (form.maxDiscountAmount !== "" && Number(form.maxDiscountAmount) < 0) {
      toast.error("Maximum discount must be valid");
      return;
    }

    if (form.minSubtotal !== "" && Number(form.minSubtotal) < 0) {
      toast.error("Minimum subtotal must be valid");
      return;
    }

    if (form.usageLimit !== "" && Number(form.usageLimit) < 1) {
      toast.error("Usage limit must be at least 1");
      return;
    }

    if (form.perCustomerLimit !== "" && Number(form.perCustomerLimit) < 1) {
      toast.error("Per customer limit must be at least 1");
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),

      description: form.description.trim(),

      discountType: form.discountType,

      discountValue: Number(form.discountValue),

      maxDiscountAmount:
        form.discountType === "percent" && form.maxDiscountAmount !== ""
          ? Number(form.maxDiscountAmount)
          : null,

      minSubtotal: form.minSubtotal !== "" ? Number(form.minSubtotal) : 0,

      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,

      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,

      usageLimit: form.usageLimit !== "" ? Number(form.usageLimit) : null,

      perCustomerLimit: form.perCustomerLimit !== "" ? Number(form.perCustomerLimit) : 1,

      channels: form.channels,

      active: form.active,
    };

    try {
      if (editingPromotion) {
        await dispatch(
          updatePromotion({
            promotionId: editingPromotion._id,
            data: payload,
            token: session.jwt,
          }),
        ).unwrap();

        toast.success("Promotion updated");
      } else {
        await dispatch(
          createPromotion({
            data: payload,
            token: session.jwt,
          }),
        ).unwrap();

        toast.success("Promotion created");
      }

      setShowModal(false);
      setEditingPromotion(null);
      resetForm();
    } catch (err) {
      console.error(err);

      toast.error(err || `Failed to ${editingPromotion ? "update" : "create"} promotion`);
    }
  };

  /* ================= DEACTIVATE ================= */

  const handleDeactivate = (promotion) => {
    if (!session?.jwt) {
      toast.error("Not authenticated");
      return;
    }

    setDeactivatePromotion(promotion);
  };

  const confirmDeactivate = async () => {
    if (!deactivatePromotion || !session?.jwt) return;

    const promotion = deactivatePromotion;

    setDeactivatingId(promotion._id);

    try {
      await dispatch(
        togglePromotionActive({
          id: promotion._id,
          isActive: false,
          token: session.jwt,
        }),
      ).unwrap();

      toast.success("Promotion deactivated");

      setDeactivatePromotion(null);
    } catch (err) {
      console.error(err);

      toast.error(err?.message || err || "Failed to deactivate promotion");
    } finally {
      setDeactivatingId(null);
    }
  };

  /* ================= REACTIVATE ================= */

  const handleActivate = async (promotion) => {
    if (!session?.jwt) {
      toast.error("Not authenticated");
      return;
    }

    setDeactivatingId(promotion._id);

    try {
      await dispatch(
        togglePromotionActive({
          id: promotion._id,
          isActive: true,
          token: session.jwt,
        }),
      ).unwrap();

      toast.success("Promotion activated");
    } catch (err) {
      console.error(err);

      toast.error(err || "Failed to activate promotion");
    } finally {
      setDeactivatingId(null);
    }
  };

  /* ================= LOADING ================= */

  if (status === "loading" || (loading && promotions.length === 0)) {
    return (
      <div className="flex justify-center py-10">
        {" "}
        <Loader2 className="animate-spin text-primary" size={32} />{" "}
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="py-4 md:py-6 px-2 xl:px-16">
      {/* HEADER */}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Promotions</h1>

          <p className="text-sm text-gray-500 mt-1">Create and manage promo codes</p>
        </div>

        <button
          onClick={openCreate}
          className="
        flex items-center gap-2
        px-4 py-2
        bg-primary text-white
        rounded-xl
        font-bold
        hover:bg-primary/90
        active:scale-[0.98]
        transition-all
        shadow-lg
      "
        >
          <Plus size={18} />
          Add Promotion
        </button>
      </div>

      {/* REDUX ERROR */}

      {/* {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )} */}

      {/* PROMOTIONS */}

      <div className="space-y-3">
        {promotions.length === 0 ? (
          <div className="bg-white border rounded-xl p-10 text-center">
            <Tag className="mx-auto text-gray-400 mb-3" size={32} />

            <p className="font-semibold text-gray-700">No promotions yet</p>

            <p className="text-sm text-gray-500 mt-1">
              Create your first promotion to get started.
            </p>
          </div>
        ) : (
          promotions.map((promotion) => (
            <div
              key={promotion._id}
              className={clsx("bg-white border rounded-xl p-4", !promotion.active && "opacity-70")}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* INFO */}

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Tag size={20} className="text-primary" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-lg">{promotion.code}</h2>

                      {promotion.active ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>

                    {promotion.description && (
                      <p className="text-sm text-gray-500 mt-1">{promotion.description}</p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-2">
                      <span className="font-semibold">{formatDiscount(promotion)}</span>

                      {Number(promotion.minSubtotal) > 0 && (
                        <span className="text-gray-500">
                          Min ${Number(promotion.minSubtotal).toFixed(2)}
                        </span>
                      )}

                      <span className="text-gray-500">{promotion.channels?.join(" + ")}</span>

                      <span className="text-gray-500">
                        Usage: {promotion.usageCount || 0}
                        {promotion.usageLimit != null ? ` / ${promotion.usageLimit}` : " / ∞"}
                      </span>

                      <span className="text-gray-500">
                        Per Customer Limit:{" "}
                        {promotion.perCustomerLimit != null ? promotion.perCustomerLimit : "∞"}
                      </span>
                    </div>

                    {(promotion.startsAt || promotion.endsAt) && (
                      <div className="text-xs text-gray-400 mt-2">
                        {formatDateRange(promotion.startsAt, promotion.endsAt)}
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTIONS */}

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(promotion)}
                    disabled={updating || deactivatingId === promotion._id}
                    className="
                    flex items-center gap-1
                    px-3 py-2
                    rounded-lg
                    hover:bg-gray-100
                    text-sm font-medium
                    disabled:opacity-50
                  "
                  >
                    <Pencil size={16} />
                    Edit
                  </button>

                  {promotion.active ? (
                    <button
                      disabled={deactivatingId === promotion._id}
                      onClick={() => handleDeactivate(promotion)}
                      className="
                      flex items-center gap-1
                      px-3 py-2
                      rounded-lg
                      text-red-600
                      hover:bg-red-50
                      text-sm font-medium
                      disabled:opacity-50
                    "
                    >
                      {deactivatingId === promotion._id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Power size={16} />
                      )}
                      Deactivate
                    </button>
                  ) : (
                    <button
                      disabled={deactivatingId === promotion._id}
                      onClick={() => handleActivate(promotion)}
                      className="
                      flex items-center gap-1
                      px-3 py-2
                      rounded-lg
                      text-green-600
                      hover:bg-green-50
                      text-sm font-medium
                      disabled:opacity-50
                    "
                    >
                      {deactivatingId === promotion._id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Power size={16} />
                      )}
                      Activate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT MODAL */}

      {showModal && (
        <div
          className="
      fixed inset-0 z-50
      bg-black/50
      flex items-center justify-center
      p-4
    "
        >
          <div
            className="
        bg-white
        rounded-2xl
        shadow-xl
        w-full
        max-w-2xl
        max-h-[90vh]
        flex
        flex-col
        overflow-hidden
      "
          >
            {/* MODAL HEADER */}
            <div className="shrink-0 bg-white border-b px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  {editingPromotion ? "Edit Promotion" : "Create Promotion"}
                </h2>

                <p className="text-sm text-gray-500">
                  {editingPromotion ? "Update this promo code" : "Create a new promo code"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => !creating && !updating && setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                disabled={creating || updating}
              >
                <X size={20} />
              </button>
            </div>

            {/* SCROLLABLE CONTENT */}

            {/* FORM */}

            <form
              id="promotion-form"
              onSubmit={handleSubmit}
              className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5"
            >
              {/* CODE */}

              <div>
                <label className="block text-sm font-semibold mb-1">Promo Code</label>

                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="SAVE10"
                  className="
                w-full
                border
                rounded-lg
                px-3 py-2.5
                uppercase
              "
                  disabled={creating || updating}
                />

                <p className="text-xs text-gray-500 mt-1">Example: SAVE10, WELCOME5</p>
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>

                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="10% off your order"
                  className="
                w-full
                border
                rounded-lg
                px-3 py-2.5
              "
                  disabled={creating || updating}
                />
              </div>

              {/* DISCOUNT */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Discount Type</label>

                  <select
                    name="discountType"
                    value={form.discountType}
                    onChange={handleChange}
                    className="
                  w-full
                  border
                  rounded-lg
                  px-3 py-2.5
                  bg-white
                "
                    disabled={creating || updating}
                  >
                    <option value="percent">Percentage</option>

                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Discount Value</label>

                  <div className="relative">
                    <input
                      name="discountValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.discountValue}
                      onChange={handleChange}
                      placeholder={form.discountType === "percent" ? "10" : "5"}
                      className="
                    w-full
                    border
                    rounded-lg
                    px-3 py-2.5
                    pr-12
                  "
                      disabled={creating || updating}
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      {form.discountType === "percent" ? "%" : "$"}
                    </span>
                  </div>
                </div>
              </div>

              {/* MAX DISCOUNT */}

              {form.discountType === "percent" && (
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Maximum Discount
                    <span className="font-normal text-gray-500"> (optional)</span>
                  </label>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>

                    <input
                      name="maxDiscountAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.maxDiscountAmount}
                      onChange={handleChange}
                      placeholder="10.00"
                      className="
                    w-full
                    border
                    rounded-lg
                    px-3 py-2.5
                    pl-7
                  "
                      disabled={creating || updating}
                    />
                  </div>

                  <p className="text-xs text-gray-500 mt-1">Example: 20% off, maximum $10.</p>
                </div>
              )}

              {/* MINIMUM */}

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Minimum Subtotal
                  <span className="font-normal text-gray-500"> (optional)</span>
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>

                  <input
                    name="minSubtotal"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minSubtotal}
                    onChange={handleChange}
                    placeholder="20.00"
                    className="
                  w-full
                  border
                  rounded-lg
                  px-3 py-2.5
                  pl-7
                "
                    disabled={creating || updating}
                  />
                </div>
              </div>

              {/* CHANNELS */}

              <div>
                <label className="block text-sm font-semibold mb-2">Available On</label>

                <div className="flex gap-3">
                  {[
                    {
                      id: "online",
                      label: "Online Ordering",
                    },
                    {
                      id: "terminal",
                      label: "Terminal",
                    },
                  ].map((channel) => {
                    const selected = form.channels.includes(channel.id);

                    return (
                      <button
                        type="button"
                        key={channel.id}
                        onClick={() => toggleChannel(channel.id)}
                        className={clsx(
                          "px-4 py-2 rounded-lg border text-sm font-medium transition",
                          selected
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
                        )}
                        disabled={creating || updating}
                      >
                        {channel.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* USAGE */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Total Usage Limit
                    <span className="font-normal text-gray-500"> (optional)</span>
                  </label>

                  <input
                    name="usageLimit"
                    type="number"
                    min="1"
                    step="1"
                    value={form.usageLimit}
                    onChange={handleChange}
                    placeholder="100"
                    className="
                  w-full
                  border
                  rounded-lg
                  px-3 py-2.5
                "
                    disabled={creating || updating}
                  />

                  <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Per Customer Limit</label>

                  <input
                    name="perCustomerLimit"
                    type="number"
                    min="1"
                    step="1"
                    value={form.perCustomerLimit}
                    onChange={handleChange}
                    className="
                  w-full
                  border
                  rounded-lg
                  px-3 py-2.5
                "
                    disabled={creating || updating}
                  />
                </div>
              </div>

              {/* DATES */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Starts</label>

                  <input
                    name="startsAt"
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={handleChange}
                    className="
                  w-full
                  border
                  rounded-lg
                  px-3 py-2.5
                "
                    disabled={creating || updating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Ends</label>

                  <input
                    name="endsAt"
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={handleChange}
                    className="
                  w-full
                  border
                  rounded-lg
                  px-3 py-2.5
                "
                    disabled={creating || updating}
                  />
                </div>
              </div>

              {/* ACTIVE */}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                  className="w-4 h-4"
                  disabled={creating || updating}
                />

                <div>
                  <div className="font-semibold text-sm">Active</div>

                  <div className="text-xs text-gray-500">Customers can use this promotion.</div>
                </div>
              </label>
            </form>

            {/* ACTIONS */}

            <div
              className="
          shrink-0
          border-t
          bg-white
          px-5
          py-4
          flex
          justify-end
          gap-3
        "
            >
              <button
                type="button"
                onClick={() => !creating && !updating && setShowModal(false)}
                className="
            px-4 py-2
            rounded-lg
            bg-gray-100
            hover:bg-gray-200
            font-semibold
          "
                disabled={creating || updating}
              >
                Cancel
              </button>

              <button
                type="submit"
                form="promotion-form"
                disabled={creating || updating}
                className="
            px-5 py-2
            rounded-lg
            bg-primary
            text-white
            font-bold
            hover:bg-primary/90
            disabled:opacity-50
            flex items-center gap-2
          "
              >
                {(creating || updating) && <Loader2 size={17} className="animate-spin" />}

                {editingPromotion ? "Save Changes" : "Create Promotion"}
              </button>
            </div>
          </div>
        </div>
      )}
      {deactivatePromotion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Deactivate Promotion</h2>

              <button
                type="button"
                onClick={() => setDeactivatePromotion(null)}
                disabled={deactivatingId === deactivatePromotion._id}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <p className="text-gray-700">
                Are you sure you want to deactivate{" "}
                <span className="font-semibold text-gray-900">"{deactivatePromotion.code}"</span>?
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Customers will no longer be able to use this promotion. You can reactivate it later.
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeactivatePromotion(null)}
                disabled={deactivatingId === deactivatePromotion._id}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeactivate}
                disabled={deactivatingId === deactivatePromotion._id}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deactivatingId === deactivatePromotion._id ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
HELPERS
========================================================= */

function formatDiscount(promotion) {
  if (promotion.discountType === "percent") {
    let text = `${Number(promotion.discountValue)}% off`;

    if (promotion.maxDiscountAmount != null) {
      text += ` up to $${Number(promotion.maxDiscountAmount).toFixed(2)}`;
    }

    return text;
  }

  return `$${Number(promotion.discountValue).toFixed(2)} off`;
}

function toDateTimeLocal(date) {
  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  const pad = (n) => String(n).padStart(2, "0");

  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function formatDateRange(startsAt, endsAt) {
  const parts = [];

  if (startsAt) {
    parts.push(`Starts ${new Date(startsAt).toLocaleString()}`);
  }

  if (endsAt) {
    parts.push(`Ends ${new Date(endsAt).toLocaleString()}`);
  }

  return parts.join(" • ");
}
