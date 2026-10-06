"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";

import {
  createNotice,
  deleteNotice,
  fetchNotices,
  fetchStoreStatus,
  updateNotice,
  updateStoreConfig,
  updateStoreStatus,
} from "@/store/storeSlice";
import { Clock, ImageIcon, Info, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import NoticeModal from "@/components/admin/NoticeModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import HeroSlidesManager from "@/components/admin/HeroSlidesManager";
import { fetchHeroSlides } from "@/store/heroSlidesSlice";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function StoreSettingsTemplate() {
  const { data: session } = useSession();
  const dispatch = useDispatch();

  const { config, loading: storeLoading } = useSelector((state) => state.store);

  const [saving, setSaving] = useState(false);

  const { slides, loading: slidesLoading } = useSelector((state) => state.heroSlides);

  /* ---------- LOCAL FORM STATE ---------- */
  const [isOpenManual, setIsOpenManual] = useState(true);
  const [hours, setHours] = useState(
    DAYS.map((day) => ({
      day,
      open: "11:00",
      close: "19:00",
      isClosed: false,
    })),
  );

  useEffect(() => {
    dispatch(fetchHeroSlides());
  }, [dispatch]);

  const getTabFromHash = () => {
    if (typeof window === "undefined") return "hours";

    const params = new URLSearchParams(window.location.hash.replace("#", ""));

    const tab = params.get("tab");

    if (["hours", "notices", "hero"].includes(tab)) {
      return tab;
    }

    return "hours";
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash); // active | history

  const tabs = [
    { id: "hours", label: "Store Hours", icon: Clock },
    {
      id: "notices",
      label: "Notices",
      icon: Info,
    },
    { id: "hero", label: "Hero Slides", icon: ImageIcon },
  ];

  const { notices } = useSelector((state) => state.store);

  useEffect(() => {
    dispatch(fetchNotices());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.location.hash = `tab=${activeTab}`;
  }, [activeTab]);

  useEffect(() => {
    const onHashChange = () => {
      setActiveTab(getTabFromHash());
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  /* ---------- LOAD FROM REDUX ---------- */
  useEffect(() => {
    if (!config) {
      dispatch(fetchStoreStatus());
    }
  }, [config, dispatch]);

  /* ---------- SYNC FORM WHEN CONFIG LOADS ---------- */
  useEffect(() => {
    if (config) {
      setIsOpenManual(config.isOpenManual);
      setHours(config.hours);
    }
  }, [config]);

  const handleTabClick = (id) => {
    setActiveTab(id);

    window.location.hash = `tab=${id}`;
  };

  const handleToggleStoreStatus = async () => {
    const nextValue = !isOpenManual;

    // Optimistic UI update
    setIsOpenManual(nextValue);

    try {
      await dispatch(
        updateStoreStatus({
          isOpenManual: nextValue,
          token: session.jwt,
        }),
      ).unwrap();

      toast.success(nextValue ? "Store is now OPEN" : "Store is now CLOSED");
    } catch (err) {
      // rollback on failure
      setIsOpenManual(!nextValue);
      toast.error(err || "Failed to update store status");
    }
  };

  /* ---------- UPDATE HOURS ---------- */
  const updateHour = (index, field, value) => {
    setHours((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  };

  /* ---------- SAVE ---------- */
  const handleSave = async () => {
    setSaving(true);
    try {
      await dispatch(
        updateStoreConfig({
          isOpenManual,
          hours,
          token: session.jwt,
        }),
      ).unwrap();

      toast.success("Store hours updated");
    } catch (err) {
      toast.error(err || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const [editing, setEditing] = useState(null);
  const [noticeSaving, setNoticeSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [deletingNotice, setDeletingNotice] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const onSave = async (data) => {
    setNoticeSaving(true);
    try {
      if (editing) {
        await dispatch(
          updateNotice({
            id: editing._id,
            data,
            token: session.jwt,
          }),
        ).unwrap();
        toast.success("Notice updated");
      } else {
        await dispatch(
          createNotice({
            data,
            token: session.jwt,
          }),
        ).unwrap();
        toast.success("Notice created");
      }
      setOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(error || "Failed to save notice");
    } finally {
      setNoticeSaving(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!deletingNotice) return;

    try {
      setDeleting(true);

      await dispatch(
        deleteNotice({
          id: deletingNotice._id,
          token: session.jwt,
        }),
      ).unwrap();

      toast.success("Notice deleted");
      setDeletingNotice(null);
    } catch {
      toast.error("Failed to delete notice");
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="py-4 md:py-6 px-2 xl:px-16">
      <div className="sticky top-16 z-20 bg-white rounded-xl shadow-md mb-6 overflow-hidden">
        <nav className="flex overflow-x-auto no-scrollbar space-x-6 px-4 bg-white">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={clsx(
                  `
                              relative flex items-center gap-2 whitespace-nowrap py-4 font-medium flex-shrink-0
                              text-gray-500 hover:text-gray-700 transition-colors
                              after:absolute after:left-0 after:bottom-0 after:h-[3px] after:w-full
                              after:bg-primary after:origin-left after:scale-x-0
                              after:transition-transform after:duration-300
                              hover:after:scale-x-100
                              `,
                  isActive && "text-primary after:scale-x-100",
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === "hours" && (
        <div className="max-w-2xl mx-auto scroll-mt-16">
          <h2 className="text-lg md:text-xl font-bold mb-3">Store Hours</h2>

          {/* Manual Toggle */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <span className="font-medium">Toggle OPEN/CLOSED Manually</span>
            <button
              disabled={storeLoading}
              onClick={handleToggleStoreStatus}
              className={clsx(
                "px-4 py-2 rounded-full font-bold text-white transition disabled:opacity-60",
                isOpenManual ? "bg-green-600" : "bg-red-600",
              )}
            >
              {isOpenManual ? "OPEN" : "CLOSED"}
            </button>
          </div>

          {/* Weekly Hours */}
          <div className="space-y-4">
            {hours.map((h, i) => (
              <div
                key={h.day}
                className="border rounded-lg p-3 space-y-3 md:space-y-0 md:flex md:items-center md:gap-4 md:justify-center"
              >
                {/* Day + Closed toggle */}
                <div className="flex items-center justify-between md:w-48">
                  <div className="font-semibold">{h.day}</div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={h.isClosed}
                      onChange={(e) => updateHour(i, "isClosed", e.target.checked)}
                    />
                    Closed
                  </label>
                </div>

                {/* Time inputs */}
                {!h.isClosed && (
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                    <input
                      type="time"
                      value={h.open}
                      onChange={(e) => updateHour(i, "open", e.target.value)}
                      className="border rounded px-3 py-2 w-full md:w-auto"
                    />

                    <span className="hidden md:block">–</span>

                    <input
                      type="time"
                      value={h.close}
                      onChange={(e) => updateHour(i, "close", e.target.value)}
                      className="border rounded px-3 py-2 w-full md:w-auto"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-3 bg-white py-2">
            {/* Save */}
            <button
              disabled={saving}
              onClick={handleSave}
              className={
                "w-full flex gap-2 justify-center items-center px-3 py-3 mt-2 btn-primary font-bold bg-primary text-white rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg"
              }
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Save Store Hours
            </button>
          </div>
        </div>
      )}

      {activeTab === "notices" && (
        <div className="max-w-5xl mx-auto p-0 md:p-6">
          <div className="flex justify-between items-center pb-6">
            <h1 className="text-2xl font-bold">Notices</h1>
            <button
              onClick={() => setOpen(true)}
              className="flex gap-2 items-center px-3 py-1 btn-primary font-bold bg-primary text-white rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" /> Add Notice
            </button>
          </div>

          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice._id}
                className="border rounded-xl p-4 flex justify-between items-start bg-white"
              >
                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    Key: <strong>{notice.key}</strong>
                  </div>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: notice.message }}
                  />
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        notice.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {notice.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(notice);
                      setOpen(true);
                    }}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingNotice(notice)}
                    className="p-2 hover:bg-red-50 rounded text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {open && (
            <NoticeModal
              notice={editing}
              loading={noticeSaving}
              onClose={() => {
                setOpen(false);
                setEditing(null);
              }}
              onSave={onSave}
            />
          )}

          <ConfirmDeleteModal
            open={!!deletingNotice}
            title="Delete notice"
            description={`This notice, "${deletingNotice?.key}", will be permanently removed and can’t be recovered.`}
            confirmText="Delete"
            loading={deleting}
            onClose={() => setDeletingNotice(null)}
            onConfirm={onDeleteConfirm}
          />
        </div>
      )}

      {activeTab === "hero" && <HeroSlidesManager session={session} slides={slides} />}
    </div>
  );
}
