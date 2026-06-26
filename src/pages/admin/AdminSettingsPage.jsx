import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import axios from "axios";

const LOGO_PATH = "/achoice logo.png";
const CLOUDINARY_CLOUD = "ds4wspou1";
const CLOUDINARY_PRESET = "achoice_preset";

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState("banner");

  // Banner state
  const [bannerSettings, setBannerSettings] = useState({
    title: "",
    subtitle: "",
    button_text: "Shop Now",
    button_link: "/products",
    image_url: "",
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [savingBanner, setSavingBanner] = useState(false);

  // Video state
  const [videoSettings, setVideoSettings] = useState({
    type: "youtube", // 'youtube' or 'upload'
    url: "",
    title: "",
  });
  const [videoFile, setVideoFile] = useState(null);
  const [savingVideo, setSavingVideo] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Site settings
  const [siteSettings, setSiteSettings] = useState({
    site_name: "ACHOICE LIMITED",
    tagline: "Your needs our solutions",
    contact_email: "support@achoice.ng",
    contact_phone: "09067794991",
    address: "No 6 faith avenue off ekenwan Rd Benin City",
    working_hours: "Mon - Sat: 07:00am to 06:00pm",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    whatsapp_number: "",
  });
  const [savingSite, setSavingSite] = useState(false);

  const [profile, setProfile] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  useEffect(() => {
    // Load existing settings
    api
      .get("/settings/banner")
      .then((r) => {
        if (r.data) {
          setBannerSettings((prev) => ({ ...prev, ...r.data }));
          if (r.data.image_url) setBannerPreview(r.data.image_url);
        }
      })
      .catch(() => {});

    api
      .get("/settings/video")
      .then((r) => {
        if (r.data) setVideoSettings((prev) => ({ ...prev, ...r.data }));
      })
      .catch(() => {});

    api
      .get("/settings/site")
      .then((r) => {
        if (r.data) setSiteSettings((prev) => ({ ...prev, ...r.data }));
      })
      .catch(() => {});

    api
      .get("/admin/profile")
      .then((r) => {
        if (r.data)
          setProfile({ name: r.data.name || "", email: r.data.email || "" });
      })
      .catch(() => {});
  }, []);

  // ── Banner ────────────────────────────────────────────────────────────────
  const handleBannerImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleSaveBanner = async () => {
    setSavingBanner(true);
    try {
      let imageUrl = bannerSettings.image_url;

      // Upload to Cloudinary if new file selected
      if (bannerFile) {
        const form = new FormData();
        form.append("file", bannerFile);
        form.append("upload_preset", CLOUDINARY_PRESET);
        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
          form,
        );
        imageUrl = res.data.secure_url;
      }

      await api.post("/admin/settings/banner", {
        ...bannerSettings,
        image_url: imageUrl,
      });
      setBannerSettings((prev) => ({ ...prev, image_url: imageUrl }));
      setBannerFile(null);
      showToast("✅ Banner settings saved!");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save banner settings.",
      );
    } finally {
      setSavingBanner(false);
    }
  };

  // ── Video ─────────────────────────────────────────────────────────────────
  const handleVideoFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVideoFile(file);
    setVideoSettings((prev) => ({ ...prev, type: "upload" }));
  };

  const handleUploadVideo = async () => {
    if (!videoFile) return showToast("Please select a video file first.");
    setUploadingVideo(true);
    setUploadProgress(0);
    try {
      const form = new FormData();
      form.append("file", videoFile);
      form.append("upload_preset", CLOUDINARY_PRESET);
      form.append("resource_type", "video");

      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/video/upload`,
        form,
        {
          onUploadProgress: (e) => {
            setUploadProgress(Math.round((e.loaded * 100) / e.total));
          },
        },
      );

      const videoUrl = res.data.secure_url;
      setVideoSettings((prev) => ({ ...prev, type: "upload", url: videoUrl }));
      setVideoFile(null);
      showToast("✅ Video uploaded! Click Save to apply.");
    } catch {
      showToast(
        "Video upload failed. Max size 100MB. MP4, MOV, AVI supported.",
      );
    } finally {
      setUploadingVideo(false);
      setUploadProgress(0);
    }
  };

  const handleSaveVideo = async () => {
    setSavingVideo(true);
    try {
      await api.post("/admin/settings/video", videoSettings);
      showToast("✅ Video settings saved! Landing page updated.");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save video settings.",
      );
    } finally {
      setSavingVideo(false);
    }
  };

  // ── Site ──────────────────────────────────────────────────────────────────
  const handleSaveSite = async () => {
    setSavingSite(true);
    try {
      await api.post("/admin/settings/site", siteSettings);
      showToast("✅ Site settings saved!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save site settings.");
    } finally {
      setSavingSite(false);
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  const sidebarItems = [
    { icon: "📊", label: "Dashboard", path: "/admin/dashboard" },
    { icon: "👤", label: "Buyers", path: "/admin/buyers" },
    { icon: "🏪", label: "Sellers", path: "/admin/sellers" },
    { icon: "🌾", label: "Products", path: "/admin/products" },
    { icon: "📦", label: "Orders", path: "/admin/orders" },
    { icon: "💰", label: "Loans", path: "/admin/loans" },
    { icon: "👥", label: "Staff", path: "/admin/staff" },
    { icon: "📈", label: "Reports", path: "/admin/reports" },
    { icon: "⚙️", label: "Loan Settings", path: "/admin/loan-settings" },
    { icon: "🚚", label: "Delivery Zones", path: "/admin/delivery-zones" },
    {
      icon: "🖼️",
      label: "Site Settings",
      path: "/admin/settings",
      active: true,
    },
  ];

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <img src={LOGO_PATH} alt="Achoice" style={s.logoImg} />
          <div>
            <div style={s.sidebarLogoName}>ACHOICE</div>
            <div style={s.sidebarLogoSub}>Admin Panel</div>
          </div>
        </div>
        <nav style={s.sidebarNav}>
          {sidebarItems.map((item) => (
            <div
              key={item.label}
              style={{
                ...s.sidebarItem,
                ...(item.active ? s.sidebarItemActive : {}),
              }}
              onClick={() => navigate(item.path)}
            >
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
        <div style={s.sidebarFooter}>
          <button
            style={s.logoutBtn}
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/admin");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.headerTitle}>Site Settings</h1>
            <p style={s.headerSub}>
              Manage banner, video advert and site information
            </p>
          </div>
        </div>

        {/* Tab Nav */}
        <div style={s.tabNav}>
          {[
            { key: "banner", label: "🖼️ Banner / Advert" },
            { key: "video", label: "🎬 Video Advert" },
            { key: "site", label: "⚙️ Site Information" },
            { key: "profile", label: "👤 My Profile" },
          ].map((tab) => (
            <button
              key={tab.key}
              style={activeTab === tab.key ? s.tabActive : s.tab}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════ BANNER TAB ════ */}
        {activeTab === "banner" && (
          <div style={s.card}>
            <div style={s.cardTitle}>🖼️ Homepage Banner / Advert Image</div>
            <p style={s.cardDesc}>
              This image appears as the main hero/banner on the landing page.
              Recommended size: 1200×600px. JPG or PNG.
            </p>

            {/* Current Preview */}
            {bannerPreview && (
              <div style={s.previewBox}>
                <div style={s.previewLabel}>Current Banner Preview</div>
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  style={s.bannerPreviewImg}
                />
              </div>
            )}

            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Banner Image</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  style={s.fileInput}
                  onChange={handleBannerImageSelect}
                />
                {bannerFile && (
                  <div style={s.fileSelected}>📎 {bannerFile.name}</div>
                )}
                <div style={s.hint}>Or paste an image URL below</div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Or paste Image URL</label>
                <input
                  style={s.input}
                  type="url"
                  placeholder="https://..."
                  value={bannerSettings.image_url}
                  onChange={(e) => {
                    setBannerSettings((p) => ({
                      ...p,
                      image_url: e.target.value,
                    }));
                    setBannerPreview(e.target.value);
                    setBannerFile(null);
                  }}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Banner Title</label>
                <input
                  style={s.input}
                  type="text"
                  placeholder="e.g. Fresh Farm Produce"
                  value={bannerSettings.title}
                  onChange={(e) =>
                    setBannerSettings((p) => ({ ...p, title: e.target.value }))
                  }
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Banner Subtitle</label>
                <input
                  style={s.input}
                  type="text"
                  placeholder="e.g. Direct from Farm to Your Table"
                  value={bannerSettings.subtitle}
                  onChange={(e) =>
                    setBannerSettings((p) => ({
                      ...p,
                      subtitle: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Button Text</label>
                <input
                  style={s.input}
                  type="text"
                  placeholder="e.g. Shop Now"
                  value={bannerSettings.button_text}
                  onChange={(e) =>
                    setBannerSettings((p) => ({
                      ...p,
                      button_text: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Button Link</label>
                <input
                  style={s.input}
                  type="text"
                  placeholder="e.g. /products"
                  value={bannerSettings.button_link}
                  onChange={(e) =>
                    setBannerSettings((p) => ({
                      ...p,
                      button_link: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <button
              style={savingBanner ? s.saveBtnDisabled : s.saveBtn}
              onClick={handleSaveBanner}
              disabled={savingBanner}
            >
              {savingBanner ? "⏳ Saving..." : "💾 Save Banner Settings"}
            </button>
          </div>
        )}

        {/* ════ VIDEO TAB ════ */}
        {activeTab === "video" && (
          <div style={s.card}>
            <div style={s.cardTitle}>🎬 Video Advert Settings</div>
            <p style={s.cardDesc}>
              This video appears in the "Our Story" section on the landing page.
              Use YouTube link (recommended) or upload an MP4 file.
            </p>

            {/* Type Toggle */}
            <div style={s.typeToggle}>
              <button
                style={
                  videoSettings.type === "youtube"
                    ? s.typeToggleBtnActive
                    : s.typeToggleBtn
                }
                onClick={() =>
                  setVideoSettings((p) => ({ ...p, type: "youtube" }))
                }
              >
                📺 YouTube Link
              </button>
              <button
                style={
                  videoSettings.type === "upload"
                    ? s.typeToggleBtnActive
                    : s.typeToggleBtn
                }
                onClick={() =>
                  setVideoSettings((p) => ({ ...p, type: "upload" }))
                }
              >
                📁 Upload Video File
              </button>
            </div>

            {/* YouTube Option */}
            {videoSettings.type === "youtube" && (
              <div style={s.videoOption}>
                <div style={s.videoOptionTitle}>
                  Paste your YouTube video link
                </div>
                <div style={s.hint}>
                  Supports: youtube.com/watch?v=... or youtu.be/...
                </div>
                <input
                  style={{ ...s.input, marginTop: 10 }}
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoSettings.url}
                  onChange={(e) =>
                    setVideoSettings((p) => ({ ...p, url: e.target.value }))
                  }
                />

                {/* YouTube Preview */}
                {videoSettings.url && (
                  <div style={s.videoPreviewBox}>
                    <div style={s.previewLabel}>Preview</div>
                    <iframe
                      style={s.videoPreviewPlayer}
                      src={getYouTubeEmbedUrl(videoSettings.url)}
                      title="YouTube preview"
                      frameBorder="0"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            )}

            {/* Upload Option */}
            {videoSettings.type === "upload" && (
              <div style={s.videoOption}>
                <div style={s.videoOptionTitle}>Upload a video file</div>
                <div style={s.hint}>
                  Supported: MP4, MOV, AVI. Max 100MB. Uploaded to Cloudinary.
                </div>

                <div style={s.uploadRow}>
                  <input
                    type="file"
                    accept="video/mp4,video/mov,video/avi,video/*"
                    style={s.fileInput}
                    onChange={handleVideoFileSelect}
                  />
                  <button
                    style={uploadingVideo ? s.uploadBtnDisabled : s.uploadBtn}
                    onClick={handleUploadVideo}
                    disabled={uploadingVideo || !videoFile}
                  >
                    {uploadingVideo
                      ? `⏳ Uploading ${uploadProgress}%...`
                      : "⬆ Upload to Cloudinary"}
                  </button>
                </div>

                {/* Upload progress bar */}
                {uploadingVideo && (
                  <div style={s.progressBarBg}>
                    <div
                      style={{
                        ...s.progressBarFill,
                        width: `${uploadProgress}%`,
                      }}
                    />
                    <div style={s.progressLabel}>{uploadProgress}%</div>
                  </div>
                )}

                {/* Current video URL */}
                <div style={{ marginTop: 16 }}>
                  <label style={s.label}>
                    Current Video URL (auto-filled after upload)
                  </label>
                  <input
                    style={s.input}
                    type="url"
                    placeholder="Video URL will appear here after upload..."
                    value={videoSettings.url}
                    onChange={(e) =>
                      setVideoSettings((p) => ({ ...p, url: e.target.value }))
                    }
                  />
                </div>

                {/* Video Preview */}
                {videoSettings.url && (
                  <div style={s.videoPreviewBox}>
                    <div style={s.previewLabel}>Preview</div>
                    <video style={s.videoPreviewPlayer} controls>
                      <source src={videoSettings.url} type="video/mp4" />
                    </video>
                  </div>
                )}
              </div>
            )}

            <div style={s.field}>
              <label style={s.label}>Video Title (optional)</label>
              <input
                style={s.input}
                type="text"
                placeholder="e.g. ACHOICE — Farm to Table"
                value={videoSettings.title}
                onChange={(e) =>
                  setVideoSettings((p) => ({ ...p, title: e.target.value }))
                }
              />
            </div>

            <button
              style={savingVideo ? s.saveBtnDisabled : s.saveBtn}
              onClick={handleSaveVideo}
              disabled={savingVideo}
            >
              {savingVideo ? "⏳ Saving..." : "💾 Save Video Settings"}
            </button>

            <div style={s.infoBox}>
              💡 <strong>Tip:</strong> YouTube link is recommended — no file
              size limit, loads faster for all users worldwide.
            </div>
          </div>
        )}

        {/* ════ SITE INFO TAB ════ */}
        {activeTab === "site" && (
          <div style={s.card}>
            <div style={s.cardTitle}>⚙️ Site Information</div>
            <p style={s.cardDesc}>
              This information appears in the navigation, footer and contact
              sections of the landing page.
            </p>

            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Site Name</label>
                <input
                  style={s.input}
                  type="text"
                  value={siteSettings.site_name}
                  onChange={(e) =>
                    setSiteSettings((p) => ({
                      ...p,
                      site_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Tagline</label>
                <input
                  style={s.input}
                  type="text"
                  value={siteSettings.tagline}
                  onChange={(e) =>
                    setSiteSettings((p) => ({ ...p, tagline: e.target.value }))
                  }
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Contact Email</label>
                <input
                  style={s.input}
                  type="email"
                  value={siteSettings.contact_email}
                  onChange={(e) =>
                    setSiteSettings((p) => ({
                      ...p,
                      contact_email: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Contact Phone</label>
                <input
                  style={s.input}
                  type="tel"
                  value={siteSettings.contact_phone}
                  onChange={(e) =>
                    setSiteSettings((p) => ({
                      ...p,
                      contact_phone: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>WhatsApp Number</label>
                <input
                  style={s.input}
                  type="tel"
                  placeholder="e.g. 2348012345678"
                  value={siteSettings.whatsapp_number}
                  onChange={(e) =>
                    setSiteSettings((p) => ({
                      ...p,
                      whatsapp_number: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Working Hours</label>
                <input
                  style={s.input}
                  type="text"
                  value={siteSettings.working_hours}
                  onChange={(e) =>
                    setSiteSettings((p) => ({
                      ...p,
                      working_hours: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={{ ...s.field, gridColumn: "span 2" }}>
                <label style={s.label}>Address</label>
                <input
                  style={s.input}
                  type="text"
                  value={siteSettings.address}
                  onChange={(e) =>
                    setSiteSettings((p) => ({ ...p, address: e.target.value }))
                  }
                />
              </div>
            </div>

            <div style={s.sectionDivider}>Social Media Links</div>
            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Facebook URL</label>
                <input
                  style={s.input}
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={siteSettings.facebook_url}
                  onChange={(e) =>
                    setSiteSettings((p) => ({
                      ...p,
                      facebook_url: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Twitter/X URL</label>
                <input
                  style={s.input}
                  type="url"
                  placeholder="https://twitter.com/..."
                  value={siteSettings.twitter_url}
                  onChange={(e) =>
                    setSiteSettings((p) => ({
                      ...p,
                      twitter_url: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Instagram URL</label>
                <input
                  style={s.input}
                  type="url"
                  placeholder="https://instagram.com/..."
                  value={siteSettings.instagram_url}
                  onChange={(e) =>
                    setSiteSettings((p) => ({
                      ...p,
                      instagram_url: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <button
              style={savingSite ? s.saveBtnDisabled : s.saveBtn}
              onClick={handleSaveSite}
              disabled={savingSite}
            >
              {savingSite ? "⏳ Saving..." : "💾 Save Site Settings"}
            </button>

            <div style={s.infoBox}>
              💡 <strong>Note:</strong> After saving, these settings will appear
              on the landing page automatically. Ask Sherif to add the GET/POST
              endpoints for <code>/api/settings/banner</code>,{" "}
              <code>/api/settings/video</code>, and{" "}
              <code>/api/settings/site</code>.
            </div>
          </div>
        )}
      </div>

      {/* ════ MY PROFILE TAB ════ */}
      {activeTab === "profile" && (
        <div style={s.card}>
          <div style={s.cardTitle}>👤 My Profile</div>
          <p style={s.cardDesc}>
            Update your name, email and change your password.
          </p>

          {/* Profile Info */}
          <div style={s.sectionDivider}>Personal Information</div>
          <div style={s.formGrid}>
            <div style={s.field}>
              <label style={s.label}>Full Name</label>
              <input
                style={s.input}
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Email Address</label>
              <input
                style={s.input}
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
          </div>
          <button
            style={savingProfile ? s.saveBtnDisabled : s.saveBtn}
            disabled={savingProfile}
            onClick={async () => {
              setSavingProfile(true);
              try {
                await api.put("/admin/profile", profile);
                showToast("✅ Profile updated successfully!");
              } catch (err) {
                showToast(
                  err.response?.data?.message || "Failed to update profile.",
                );
              } finally {
                setSavingProfile(false);
              }
            }}
          >
            {savingProfile ? "⏳ Saving..." : "💾 Save Profile"}
          </button>

          {/* Change Password */}
          <div style={{ ...s.sectionDivider, marginTop: 32 }}>
            Change Password
          </div>
          <div style={s.formGrid}>
            <div style={s.field}>
              <label style={s.label}>Current Password</label>
              <input
                style={s.input}
                type="password"
                value={passwordForm.current_password}
                onChange={(e) =>
                  setPasswordForm((p) => ({
                    ...p,
                    current_password: e.target.value,
                  }))
                }
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>New Password</label>
              <input
                style={s.input}
                type="password"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm((p) => ({
                    ...p,
                    new_password: e.target.value,
                  }))
                }
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Confirm New Password</label>
              <input
                style={s.input}
                type="password"
                value={passwordForm.new_password_confirmation}
                onChange={(e) =>
                  setPasswordForm((p) => ({
                    ...p,
                    new_password_confirmation: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <button
            style={savingPassword ? s.saveBtnDisabled : s.saveBtn}
            disabled={savingPassword}
            onClick={async () => {
              if (
                passwordForm.new_password !==
                passwordForm.new_password_confirmation
              ) {
                showToast("New passwords do not match.");
                return;
              }
              setSavingPassword(true);
              try {
                await api.post("/auth/change-password", {
                  current_password: passwordForm.current_password,
                  new_password: passwordForm.new_password,
                  new_password_confirmation:
                    passwordForm.new_password_confirmation,
                });
                showToast("✅ Password changed successfully!");
                setPasswordForm({
                  current_password: "",
                  new_password: "",
                  new_password_confirmation: "",
                });
              } catch (err) {
                showToast(
                  err.response?.data?.message || "Failed to change password.",
                );
              } finally {
                setSavingPassword(false);
              }
            }}
          >
            {savingPassword ? "⏳ Saving..." : "🔒 Change Password"}
          </button>
        </div>
      )}
    </div>
  );
}

const s = {
  page: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "Arial, sans-serif",
  },
  toast: {
    position: "fixed",
    top: 20,
    right: 20,
    background: "#1f4d1f",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: 8,
    fontSize: 14,
    zIndex: 9999,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  sidebar: {
    width: 240,
    background: "#1f4d1f",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
  },
  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 20,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  logoImg: { width: 40, height: 40, objectFit: "contain" },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: "#fff" },
  sidebarLogoSub: { fontSize: 10, color: "#a8d5a8" },
  sidebarNav: { flex: 1, padding: "16px 0", overflowY: "auto" },
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 20px",
    color: "#a8d5a8",
    fontSize: 14,
    cursor: "pointer",
  },
  sidebarItemActive: {
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    borderLeft: "3px solid #f0c050",
  },
  sidebarFooter: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  logoutBtn: {
    width: "100%",
    padding: 8,
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  main: { flex: 1, marginLeft: 240, padding: 32, minWidth: 0 },
  header: { marginBottom: 24 },
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#111",
    marginBottom: 4,
  },
  headerSub: { fontSize: 14, color: "#888" },
  tabNav: {
    display: "flex",
    gap: 4,
    marginBottom: 24,
    background: "#fff",
    padding: 6,
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    flexWrap: "wrap",
  },
  tab: {
    flex: 1,
    padding: "10px 16px",
    border: "none",
    borderRadius: 7,
    background: "transparent",
    color: "#555",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    minWidth: 140,
  },
  tabActive: {
    flex: 1,
    padding: "10px 16px",
    border: "none",
    borderRadius: 7,
    background: "#1f4d1f",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    minWidth: 140,
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e8e4dc",
    padding: 28,
  },
  cardTitle: { fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 6 },
  cardDesc: { fontSize: 13, color: "#888", marginBottom: 24, lineHeight: 1.6 },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 20,
    marginBottom: 24,
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: "#444" },
  input: {
    padding: "11px 14px",
    border: "1px solid #ddd",
    borderRadius: 7,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
  },
  fileInput: {
    padding: 8,
    border: "1px dashed #ddd",
    borderRadius: 7,
    fontSize: 13,
    background: "#fafafa",
    cursor: "pointer",
  },
  fileSelected: {
    fontSize: 12,
    color: "#1a7a3a",
    fontWeight: 600,
    padding: "4px 8px",
    background: "#eafaf0",
    borderRadius: 5,
  },
  hint: { fontSize: 11, color: "#aaa", fontStyle: "italic" },
  previewBox: {
    marginBottom: 24,
    background: "#f7f5f0",
    borderRadius: 10,
    padding: 16,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#555",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bannerPreviewImg: {
    width: "100%",
    maxHeight: 280,
    objectFit: "cover",
    borderRadius: 8,
    border: "1px solid #e8e4dc",
  },
  typeToggle: { display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" },
  typeToggleBtn: {
    padding: "12px 24px",
    border: "2px solid #ddd",
    borderRadius: 8,
    background: "#fff",
    color: "#555",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 500,
  },
  typeToggleBtnActive: {
    padding: "12px 24px",
    border: "2px solid #1f4d1f",
    borderRadius: 8,
    background: "#f0f7ec",
    color: "#1f4d1f",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 700,
  },
  videoOption: {
    background: "#f7f5f0",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  videoOptionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#333",
    marginBottom: 4,
  },
  uploadRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 12,
  },
  uploadBtn: {
    padding: "10px 20px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  uploadBtnDisabled: {
    padding: "10px 20px",
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    cursor: "not-allowed",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  progressBarBg: {
    marginTop: 12,
    background: "#eee",
    borderRadius: 99,
    height: 10,
    overflow: "hidden",
    position: "relative",
  },
  progressBarFill: {
    height: "100%",
    background: "#1f4d1f",
    borderRadius: 99,
    transition: "width 0.3s",
  },
  progressLabel: {
    position: "absolute",
    right: 8,
    top: -2,
    fontSize: 11,
    color: "#555",
    fontWeight: 600,
  },
  videoPreviewBox: {
    marginTop: 16,
    background: "#f7f5f0",
    borderRadius: 10,
    padding: 16,
  },
  videoPreviewPlayer: {
    width: "100%",
    height: 260,
    borderRadius: 8,
    border: "none",
    display: "block",
  },
  saveBtn: {
    padding: "13px 32px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: 8,
  },
  saveBtnDisabled: {
    padding: "13px 32px",
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    cursor: "not-allowed",
    fontFamily: "inherit",
    marginTop: 8,
  },
  infoBox: {
    marginTop: 20,
    background: "#f0f7ec",
    border: "1px solid #a8d5a8",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 13,
    color: "#555",
    lineHeight: 1.6,
  },
  sectionDivider: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1f4d1f",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: "1px solid #eee",
    marginTop: 8,
  },
};
