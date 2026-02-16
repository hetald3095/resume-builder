import { useEffect, useMemo, useRef, useState } from "react";
import { emptyResume } from "./data/emptyResume";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, token, logout, authedFetch } = useAuth();

  // ✅ Local fallback (still useful if offline / logged out)
  const STORAGE_KEY = useMemo(() => {
    if (!user?.id) return "rb_resume_v1";
    return `rb_resume_${user.id}_v1`;
  }, [user?.id]);

  // ✅ Version history key (per user) - kept in localStorage
  const HISTORY_KEY = useMemo(
    () => `${STORAGE_KEY}__drafts_history_v1`,
    [STORAGE_KEY]
  );

  // ✅ Default resume while Mongo loads
  const [resume, setResume] = useState(emptyResume);
  const [status, setStatus] = useState("");

  // ✅ Template selector
  const [template, setTemplate] = useState("taupe"); // taupe | blue | maroon

  // ✅ Load Draft dropdown state (local history)
  const [showDrafts, setShowDrafts] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const draftsWrapRef = useRef(null);

  // ✅ Template color mapping for select + draft styles
  const templateTheme = useMemo(() => {
    const map = {
      taupe: { bg: "#b7a6a1", border: "#b7a6a1" },
      blue: { bg: "#0b4a7a", border: "#0b4a7a" },
      maroon: { bg: "#5b0f0f", border: "#5b0f0f" },
    };
    return map[template] || map.taupe;
  }, [template]);

  const getThemeForTemplate = (tpl) => {
    const map = {
      taupe: { bg: "#b7a6a1", border: "#b7a6a1" },
      blue: { bg: "#0b4a7a", border: "#0b4a7a" },
      maroon: { bg: "#5b0f0f", border: "#5b0f0f" },
    };
    return map[tpl] || map.taupe;
  };

  const readHistory = () => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  };

  const writeHistory = (list) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  // ✅ Close draft dropdown on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (!showDrafts) return;
      if (!draftsWrapRef.current) return;
      if (!draftsWrapRef.current.contains(e.target)) setShowDrafts(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showDrafts]);

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(""), 1800);
    return () => clearTimeout(t);
  }, [status]);

  const formatDraftTime = (ts) => {
    try {
      return new Date(ts).toLocaleString("en-AU", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // ✅ initials for header welcome (RS for Ravi Soni)
  const userInitials = useMemo(() => {
    const name = user?.name || "";
    return getInitialsFromName(name) || "U";
  }, [user?.name]);

  // =====================================================
  // ✅ MONGO: Load latest resume from DB on login
  // =====================================================
  useEffect(() => {
    // Reset UI state when user changes
    setShowDrafts(false);
    setDrafts(readHistory());

    // If not logged in, fallback to localStorage
    if (!token || !user?.id) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setResume(parsed || emptyResume);
        } else {
          setResume(emptyResume);
        }
      } catch {
        setResume(emptyResume);
      }
      return;
    }

    // Logged in: load from MongoDB
    (async () => {
      try {
        const data = await authedFetch("/api/resume/me", { method: "GET" });

        // Support both shapes:
        // 1) { template, data }
        // 2) { resume, template }
        const tpl = data?.template;
        const resData = data?.data || data?.resume;

        if (tpl) setTemplate(tpl);
        if (resData) {
          setResume(resData);

          // also cache locally (backup)
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(resData));
          } catch {}
        } else {
          setResume(emptyResume);
        }
      } catch (e) {
        // if API fails, fallback to localStorage so app remains usable
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            setResume(parsed || emptyResume);
          } else {
            setResume(emptyResume);
          }
        } catch {
          setResume(emptyResume);
        }
        setStatus(
          e?.message ? `⚠️ ${e.message}` : "⚠️ Could not load from database"
        );
      }
    })();
  }, [user?.id, token, STORAGE_KEY, HISTORY_KEY, authedFetch]);

  // -------------------------
  // Personal
  // -------------------------
  const updatePersonal = (e) => {
    const { name, value } = e.target;
    setResume((prev) => ({
      ...prev,
      personal: { ...prev.personal, [name]: value },
    }));
  };

  // -------------------------
  // Generic helpers for array sections
  // -------------------------
  const updateArrayField = (section, index, field, value) => {
    setResume((prev) => {
      const next = [...prev[section]];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, [section]: next };
    });
  };

  const addItem = (section, item) => {
    setResume((prev) => ({ ...prev, [section]: [...prev[section], item] }));
  };

  const removeItem = (section, index) => {
    setResume((prev) => {
      const next = prev[section].filter((_, i) => i !== index);
      return { ...prev, [section]: next.length ? next : prev[section] };
    });
  };

  // -------------------------
  // Bullets helpers (experience/projects)
  // -------------------------
  const updateBullet = (section, index, bulletIndex, value) => {
    setResume((prev) => {
      const next = [...prev[section]];
      const item = { ...next[index] };
      const bullets = [...(item.bullets || [])];
      bullets[bulletIndex] = value;
      item.bullets = bullets;
      next[index] = item;
      return { ...prev, [section]: next };
    });
  };

  const addBullet = (section, index) => {
    setResume((prev) => {
      const next = [...prev[section]];
      const item = { ...next[index] };
      item.bullets = [...(item.bullets || []), ""];
      next[index] = item;
      return { ...prev, [section]: next };
    });
  };

  const removeBullet = (section, index, bulletIndex) => {
    setResume((prev) => {
      const next = [...prev[section]];
      const item = { ...next[index] };
      const bullets = (item.bullets || []).filter((_, i) => i !== bulletIndex);
      item.bullets = bullets.length ? bullets : [""];
      next[index] = item;
      return { ...prev, [section]: next };
    });
  };

  // -------------------------
  // Skills
  // -------------------------
  const updateSkills = (e) => {
    const { name, value } = e.target;
    setResume((prev) => ({
      ...prev,
      skills: { ...prev.skills, [name]: value },
    }));
  };

  // =====================================================
  // ✅ MONGO: Save latest resume to DB
  // =====================================================
  const saveLatestToMongo = async (resumeSnapshot, tplSnapshot) => {
    if (!token || !user?.id) return; // not logged in
    await authedFetch("/api/resume/me", {
      method: "POST",
      body: { template: tplSnapshot, data: resumeSnapshot },
    });
  };

  // ✅ Auto-save template changes to Mongo (keeps latest template synced)
  useEffect(() => {
    if (!token || !user?.id) return;
    saveLatestToMongo(resume, template).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  // -------------------------
  // Save/Load/Reset
  // -------------------------
  const saveDraft = async () => {
    try {
      // ✅ Local backup of latest (optional)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));

      // ✅ Local version history (your dropdown)
      const prev = readHistory();
      const id =
        (window.crypto && crypto.randomUUID && crypto.randomUUID()) ||
        `d_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      const entry = {
        id,
        createdAt: Date.now(),
        number: prev.length + 1,
        template,
        resume,
      };

      const next = [...prev, entry];

      // cap to last 50
      const capped = next.slice(-50);
      const renumbered = capped.map((d, idx) => ({ ...d, number: idx + 1 }));

      writeHistory(renumbered);
      setDrafts(renumbered);

      // ✅ Mongo save (latest)
      await saveLatestToMongo(resume, template);

      setStatus("✅ Draft saved");
    } catch (e) {
      setStatus(e?.message ? `❌ ${e.message}` : "❌ Could not save draft");
    }
  };

  // ✅ Load latest from MongoDB (fallback to local)
  const loadDraft = async () => {
    try {
      if (token && user?.id) {
        const data = await authedFetch("/api/resume/me", { method: "GET" });
        const tpl = data?.template;
        const resData = data?.data || data?.resume;

        if (!resData) return setStatus("ℹ️ No saved draft found in DB");

        setResume(resData);
        if (tpl) setTemplate(tpl);

        // local backup
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(resData));
        } catch {}

        setStatus("✅ Draft loaded (from DB)");
        return;
      }

      // fallback: local
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return setStatus("ℹ️ No saved draft found");
      setResume(JSON.parse(saved));
      setStatus("✅ Draft loaded");
    } catch (e) {
      setStatus(e?.message ? `❌ ${e.message}` : "❌ Could not load draft");
    }
  };

  const loadDraftById = (draftId) => {
    const list = readHistory();
    const found = list.find((d) => d.id === draftId);
    if (!found) return setStatus("❌ Draft not found");

    setResume(found.resume || emptyResume);
    if (found.template) setTemplate(found.template);
    setShowDrafts(false);
    setStatus(`✅ Loaded Draft #${found.number}`);
  };

  // ✅ Delete a specific draft (local history)
  const deleteDraftById = (draftId) => {
    const list = readHistory();
    const next = list.filter((d) => d.id !== draftId);
    const renumbered = next.map((d, idx) => ({ ...d, number: idx + 1 }));

    writeHistory(renumbered);
    setDrafts(renumbered);
    setStatus("🗑️ Draft deleted");
  };

  const reset = async () => {
    setResume(emptyResume);
    setStatus("✅ Reset done");

    // Optional: also save reset as latest in DB so next login is empty
    try {
      await saveLatestToMongo(emptyResume, template);
    } catch {
      // ignore
    }
  };

  // -------------------------
  // Download (Print to PDF)
  // -------------------------
  const downloadPDF = async () => {
    try {
      // Save latest to DB before print
      await saveLatestToMongo(resume, template);

      // also local backup
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
      } catch {}
    } catch {
      // ignore
    }

    setStatus("📄 Opening PDF export...");
    window.print();
  };

  const { personal, education, experience, projects, skills } = resume;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.h1}>Resume Builder</h1>
        </div>

        <div style={styles.actions}>
          {/* ✅ Template selector with dynamic color + white text */}
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            style={{
              ...styles.select,
              background: templateTheme.bg,
              border: `1px solid ${templateTheme.border}`,
              color: "white",
              fontWeight: 700,
            }}
            title="Choose a resume design"
          >
            <option value="taupe">Template 1 — Taupe Header</option>
            <option value="blue">Template 2 — Blue Header</option>
            <option value="maroon">Template 3 — Maroon Sidebar</option>
          </select>

          {/* ✅ Save Draft: Red background + white text */}
          <button style={styles.btnSaveDraft} onClick={saveDraft}>
            Save Draft
          </button>

          {/* ✅ Load Draft Dropdown */}
          <div ref={draftsWrapRef} style={{ position: "relative" }}>
            <button
              style={styles.btn}
              onClick={() => {
                const list = readHistory();
                setDrafts(list);
                setShowDrafts((p) => !p);
              }}
              title="Load a previously saved draft"
            >
              Load Draft ▾
            </button>

            {showDrafts && (
              <div style={styles.dropdown}>
                <div style={styles.dropdownHeader}>
                  <strong>Saved drafts</strong>
                  <span style={{ color: "#6b7280", fontSize: 12 }}>
                    {drafts.length ? `${drafts.length} saved` : "none"}
                  </span>
                </div>

                {!drafts.length ? (
                  <div style={styles.dropdownEmpty}>
                    No drafts yet. Click <strong>Save Draft</strong> to create
                    versions.
                  </div>
                ) : (
                  <div style={styles.dropdownList}>
                    {[...drafts]
                      .slice()
                      .reverse()
                      .map((d) => {
                        const th = getThemeForTemplate(d.template);
                        return (
                          <button
                            key={d.id}
                            onClick={() => loadDraftById(d.id)}
                            style={{
                              ...styles.dropdownItem,
                              background: th.bg,
                              border: `1px solid ${th.border}`,
                              color: "white",
                            }}
                            title="Click to load this draft"
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 10,
                                alignItems: "flex-start",
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 900 }}>
                                  Draft #{d.number}
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    opacity: 0.92,
                                    marginTop: 4,
                                  }}
                                >
                                  Template: {d.template || "taupe"}
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    opacity: 0.92,
                                    marginTop: 4,
                                  }}
                                >
                                  {formatDraftTime(d.createdAt)}
                                </div>
                              </div>

                              {/* ✅ Delete icon */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteDraftById(d.id);
                                }}
                                style={styles.deleteIconBtn}
                                title="Delete this draft"
                                aria-label="Delete draft"
                              >
                                🗑️
                              </button>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}

                <div style={styles.dropdownFooter}>
                  <button style={styles.dropdownGhostBtn} onClick={loadDraft}>
                    Load latest draft
                  </button>
                  <button
                    style={styles.dropdownGhostBtn}
                    onClick={() => setShowDrafts(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          <button style={styles.btnPrimary} onClick={downloadPDF}>
            Download PDF
          </button>
          <button style={styles.btnDanger} onClick={reset}>
            Reset
          </button>

          {/* ✅ Welcome initials beside Logout (not a button) */}
          <div style={styles.userInline}>
            <span style={styles.welcomeInline}>Welcome, {userInitials}</span>
            <button style={styles.btn} onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {status ? <div style={styles.status}>{status}</div> : null}

      <main style={styles.grid}>
        {/* ===================== EDITOR ===================== */}
        <section style={styles.card}>
          <h2 style={styles.h2}>Editor</h2>

          <SectionTitle title="Personal" />
          <div style={styles.fieldGrid}>
            <Field
              label="Full Name"
              name="fullName"
              value={personal.fullName}
              onChange={updatePersonal}
            />
            <Field
              label="Title"
              name="title"
              value={personal.title}
              onChange={updatePersonal}
            />
            <Field
              label="Email"
              name="email"
              value={personal.email}
              onChange={updatePersonal}
            />
            <Field
              label="Phone"
              name="phone"
              value={personal.phone}
              onChange={updatePersonal}
            />
            <Field
              label="Location"
              name="location"
              value={personal.location}
              onChange={updatePersonal}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={styles.label}>Summary</label>
            <textarea
              name="summary"
              value={personal.summary}
              onChange={updatePersonal}
              placeholder="2–4 lines about your strengths and the role you want..."
              style={styles.textarea}
              rows={5}
            />
          </div>

          <SectionTitle title="Education" />
          {education.map((ed, i) => (
            <div key={i} style={styles.itemBox}>
              <div style={styles.itemHeader}>
                <strong>Education #{i + 1}</strong>
                {education.length > 1 && (
                  <button
                    style={styles.smallBtn}
                    onClick={() => removeItem("education", i)}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div style={styles.fieldGrid}>
                <Field
                  label="Degree"
                  value={ed.degree}
                  onChange={(e) =>
                    updateArrayField("education", i, "degree", e.target.value)
                  }
                />
                <Field
                  label="Institution"
                  value={ed.institution}
                  onChange={(e) =>
                    updateArrayField(
                      "education",
                      i,
                      "institution",
                      e.target.value
                    )
                  }
                />
                <Field
                  label="Year"
                  value={ed.year}
                  onChange={(e) =>
                    updateArrayField("education", i, "year", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
          <button
            style={styles.btn}
            onClick={() =>
              addItem("education", { degree: "", institution: "", year: "" })
            }
          >
            + Add Education
          </button>

          <SectionTitle title="Experience" />
          {experience.map((ex, i) => (
            <div key={i} style={styles.itemBox}>
              <div style={styles.itemHeader}>
                <strong>Experience #{i + 1}</strong>
                {experience.length > 1 && (
                  <button
                    style={styles.smallBtn}
                    onClick={() => removeItem("experience", i)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div style={styles.fieldGrid}>
                <Field
                  label="Role"
                  value={ex.role}
                  onChange={(e) =>
                    updateArrayField("experience", i, "role", e.target.value)
                  }
                />
                <Field
                  label="Company"
                  value={ex.company}
                  onChange={(e) =>
                    updateArrayField("experience", i, "company", e.target.value)
                  }
                />
                <Field
                  label="Duration"
                  value={ex.duration}
                  onChange={(e) =>
                    updateArrayField("experience", i, "duration", e.target.value)
                  }
                />
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={styles.miniTitle}>Bullets</div>
                {(ex.bullets || [""]).map((b, bi) => (
                  <div key={bi} style={styles.bulletRow}>
                    <input
                      style={styles.input}
                      value={b}
                      placeholder="e.g., Improved reporting accuracy by 30%..."
                      onChange={(e) =>
                        updateBullet("experience", i, bi, e.target.value)
                      }
                    />
                    <button
                      style={styles.smallBtn}
                      onClick={() => removeBullet("experience", i, bi)}
                      title="Remove bullet"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  style={styles.smallBtn}
                  onClick={() => addBullet("experience", i)}
                >
                  + Add bullet
                </button>
              </div>
            </div>
          ))}
          <button
            style={styles.btn}
            onClick={() =>
              addItem("experience", {
                role: "",
                company: "",
                duration: "",
                bullets: [""],
              })
            }
          >
            + Add Experience
          </button>

          <SectionTitle title="Projects" />
          {projects.map((p, i) => (
            <div key={i} style={styles.itemBox}>
              <div style={styles.itemHeader}>
                <strong>Project #{i + 1}</strong>
                {projects.length > 1 && (
                  <button
                    style={styles.smallBtn}
                    onClick={() => removeItem("projects", i)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div style={styles.fieldGrid}>
                <Field
                  label="Project Name"
                  value={p.name}
                  onChange={(e) =>
                    updateArrayField("projects", i, "name", e.target.value)
                  }
                />
                <Field
                  label="Tech Stack"
                  value={p.tech}
                  onChange={(e) =>
                    updateArrayField("projects", i, "tech", e.target.value)
                  }
                />
                <Field
                  label="Link"
                  value={p.link}
                  onChange={(e) =>
                    updateArrayField("projects", i, "link", e.target.value)
                  }
                  placeholder="GitHub / Live URL"
                />
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={styles.miniTitle}>Bullets</div>
                {(p.bullets || [""]).map((b, bi) => (
                  <div key={bi} style={styles.bulletRow}>
                    <input
                      style={styles.input}
                      value={b}
                      placeholder="e.g., Built a resume builder with templates and PDF export..."
                      onChange={(e) =>
                        updateBullet("projects", i, bi, e.target.value)
                      }
                    />
                    <button
                      style={styles.smallBtn}
                      onClick={() => removeBullet("projects", i, bi)}
                      title="Remove bullet"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  style={styles.smallBtn}
                  onClick={() => addBullet("projects", i)}
                >
                  + Add bullet
                </button>
              </div>
            </div>
          ))}
          <button
            style={styles.btn}
            onClick={() =>
              addItem("projects", {
                name: "",
                tech: "",
                link: "",
                bullets: [""],
              })
            }
          >
            + Add Project
          </button>

          <SectionTitle title="Skills" />
          <div style={styles.fieldGrid}>
            <Field
              label="Technical (comma separated)"
              name="technical"
              value={skills.technical}
              onChange={updateSkills}
              placeholder="JavaScript, React, SQL, Python..."
            />
            <Field
              label="Tools (comma separated)"
              name="tools"
              value={skills.tools}
              onChange={updateSkills}
              placeholder="Git, Docker, Power BI, Excel..."
            />
            <Field
              label="Soft Skills (comma separated)"
              name="soft"
              value={skills.soft}
              onChange={updateSkills}
              placeholder="Communication, teamwork..."
            />
          </div>
        </section>

        {/* ===================== PREVIEW ===================== */}
        <section style={styles.card}>
          <h2 style={styles.h2}>Preview</h2>

          <div className="previewViewport">
            <div className="paperWrap" style={{ ["--scale"]: 0.78 }}>
              <div className="paper">
                <div id="resume-preview" style={styles.preview}>
                  {template === "taupe" && <TemplateTaupe resume={resume} />}
                  {template === "blue" && <TemplateBlue resume={resume} />}
                  {template === "maroon" && <TemplateMaroon resume={resume} />}
                </div>
              </div>
            </div>
          </div>

          <p style={styles.note}>
            Switch template → Download PDF prints the selected one.
          </p>
        </section>
      </main>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <input style={styles.input} {...props} />
    </div>
  );
}

function SectionTitle({ title }) {
  return <h3 style={styles.h3}>{title}</h3>;
}

function Divider() {
  return <div style={shared.divider} />;
}

/* =========================================
   TEMPLATE 1 — Taupe Header + Left Labels
========================================= */
function TemplateTaupe({ resume }) {
  const { personal, education, experience, projects, skills } = resume;

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ background: "#b7a6a1", color: "white", padding: 18 }}>
        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 0.6 }}>
          {(personal.fullName || "Your Name").toUpperCase()}
        </div>
        <div style={{ marginTop: 8, fontSize: 13.5, opacity: 0.95 }}>
          {personal.email || "email@example.com"} • {personal.phone || "+61 ..."}{" "}
          • {personal.location || "City, State"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "160px 1fr",
          columnGap: 16,
          rowGap: 18,
          padding: 18,
        }}
      >
        <LeftLabel title="SUMMARY" />
        <div>
          <div style={t1.text}>
            {personal.summary || "Write a short professional summary..."}
          </div>
          <Divider />
        </div>

        <LeftLabel title="SKILLS" />
        <div>
          <div style={t1.twoCol}>
            <BulletsFromCSV text={skills.technical} />
            <BulletsFromCSV text={skills.tools} />
          </div>
          <Divider />
        </div>

        <LeftLabel title="EXPERIENCE" />
        <div>
          {experience.map((ex, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={t1.titleLine}>
                {(ex.role || "Role").toUpperCase()}
              </div>
              <div style={t1.meta}>
                {ex.company || "Company"} • {ex.duration || "Duration"}
              </div>
              <ul style={t1.ul}>
                {(ex.bullets || [])
                  .filter((x) => x.trim())
                  .map((b, bi) => (
                    <li key={bi} style={t1.li}>
                      {b}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          <Divider />
        </div>

        <LeftLabel title="EDUCATION" />
        <div>
          {education.map((ed, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={t1.titleLine}>{ed.institution || "Institution"}</div>
              <div style={t1.meta}>
                {ed.degree || "Degree"} • {ed.year || "Year"}
              </div>
            </div>
          ))}
          <Divider />
        </div>

        <LeftLabel title="PROJECTS" />
        <div>
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={t1.titleLine}>
                {p.name || "Project Name"}
                {p.tech ? (
                  <span style={{ fontWeight: 400 }}> • {p.tech}</span>
                ) : null}
              </div>
              {p.link ? <div style={t1.link}>{p.link}</div> : null}
              <ul style={t1.ul}>
                {(p.bullets || [])
                  .filter((x) => x.trim())
                  .map((b, bi) => (
                    <li key={bi} style={t1.li}>
                      {b}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeftLabel({ title }) {
  return (
    <div
      style={{
        fontSize: 11.5,
        letterSpacing: 1.2,
        fontWeight: 700,
        color: "#9b8b87",
        marginTop: 3,
      }}
    >
      {title}
    </div>
  );
}

const shared = {
  divider: {
    borderTop: "1.5px solid #d1d5db",
    marginTop: 14,
    marginBottom: 2,
  },
};

const t1 = {
  text: { fontSize: 14.2, lineHeight: 1.75, color: "#111827" },
  titleLine: { fontWeight: 900, fontSize: 14.2, color: "#111827" },
  meta: { fontSize: 12.8, color: "#6b7280", marginTop: 5 },
  ul: { margin: "10px 0 0 20px", padding: 0 },
  li: { fontSize: 13.8, marginBottom: 6, color: "#111827" },
  link: {
    fontSize: 12.8,
    color: "#4f46e5",
    marginTop: 7,
    wordBreak: "break-word",
  },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 },
};

/* =========================================
   TEMPLATE 2 — Blue Header ATS Clean
========================================= */
function TemplateBlue({ resume }) {
  const { personal, education, experience, projects, skills } = resume;

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div
        style={{
          background: "#0b4a7a",
          color: "white",
          padding: 18,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 900 }}>
          {personal.fullName || "Your Name"}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.95 }}>
          {personal.location || "City, State"} • {personal.phone || "+61 ..."}{" "}
          • {personal.email || "email@example.com"}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <BlueSection title="Summary">
          <div style={t2.text}>
            {personal.summary || "Write a short professional summary..."}
          </div>
        </BlueSection>

        <BlueSection title="Skills">
          <div style={t2.skillsGrid}>
            <div>
              <div style={t2.skillLabel}>Technical</div>
              <BulletsFromCSV text={skills.technical} />
            </div>
            <div>
              <div style={t2.skillLabel}>Tools</div>
              <BulletsFromCSV text={skills.tools} />
            </div>
          </div>
        </BlueSection>

        <BlueSection title="Experience">
          {experience.map((ex, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={t2.titleLine}>
                {ex.role || "Role"}{" "}
                <span style={t2.muted}>— {ex.company || "Company"}</span>
              </div>
              <div style={t2.muted}>{ex.duration || "Duration"}</div>
              <ul style={t2.ul}>
                {(ex.bullets || [])
                  .filter((x) => x.trim())
                  .map((b, bi) => (
                    <li key={bi} style={t2.li}>
                      {b}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </BlueSection>

        <BlueSection title="Education">
          {education.map((ed, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={t2.titleLine}>{ed.institution || "Institution"}</div>
              <div style={t2.muted}>
                {ed.degree || "Degree"} • {ed.year || "Year"}
              </div>
            </div>
          ))}
        </BlueSection>

        <BlueSection title="Projects">
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={t2.titleLine}>
                {p.name || "Project Name"}{" "}
                {p.tech ? <span style={t2.muted}>• {p.tech}</span> : null}
              </div>
              {p.link ? <div style={t2.link}>{p.link}</div> : null}
              <ul style={t2.ul}>
                {(p.bullets || [])
                  .filter((x) => x.trim())
                  .map((b, bi) => (
                    <li key={bi} style={t2.li}>
                      {b}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </BlueSection>
      </div>
    </div>
  );
}

function BlueSection({ title, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={t2.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

const t2 = {
  sectionTitle: {
    fontWeight: 900,
    fontSize: 12,
    color: "#0b4a7a",
    borderBottom: "2px solid #0b4a7a",
    paddingBottom: 6,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  text: { fontSize: 12.8, lineHeight: 1.6, color: "#111827" },
  titleLine: { fontWeight: 900, fontSize: 13, color: "#111827" },
  muted: { fontSize: 12, color: "#6b7280" },
  ul: { margin: "8px 0 0 18px" },
  li: { fontSize: 12.6, marginBottom: 4, color: "#111827" },
  link: {
    fontSize: 11.5,
    color: "#4f46e5",
    marginTop: 4,
    wordBreak: "break-word",
  },
  skillsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  skillLabel: {
    fontWeight: 900,
    fontSize: 11.5,
    color: "#111827",
    marginBottom: 6,
  },
};

/* =========================================
   TEMPLATE 3 — Maroon Sidebar + Monogram
========================================= */
function TemplateMaroon({ resume }) {
  const { personal, education, experience, projects, skills } = resume;
  const initials = getInitials(personal.fullName);

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "190px 1fr",
          minHeight: 520,
        }}
      >
        <div style={{ borderRight: "1px solid #e5e7eb", padding: 14 }}>
          <div style={t3.logoBox}>
            <div style={t3.initials}>{initials}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={t3.sideRow}>
              <strong>📍</strong> {personal.location || "City, State"}
            </div>
            <div style={t3.sideRow}>
              <strong>📞</strong> {personal.phone || "+61 ..."}
            </div>
            <div style={t3.sideRow}>
              <strong>✉️</strong> {personal.email || "email@example.com"}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={t3.sideTitle}>EDUCATION</div>
            {education.map((ed, i) => (
              <div key={i} style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 900, fontSize: 12 }}>
                  {ed.degree || "Degree"}
                </div>
                <div style={{ fontSize: 11.5, color: "#6b7280" }}>
                  {ed.institution || "Institution"}
                </div>
                <div style={{ fontSize: 11.5, color: "#6b7280" }}>
                  {ed.year || "Year"}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={t3.sideTitle}>SKILLS</div>
            <div style={{ marginTop: 8 }}>
              <div style={t3.skillLabel}>Technical</div>
              <BulletsFromCSV text={skills.technical} />
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={t3.skillLabel}>Tools</div>
              <BulletsFromCSV text={skills.tools} />
            </div>
          </div>
        </div>

        <div>
          <div style={t3.topBar}>
            <div style={{ fontSize: 22, fontWeight: 900 }}>
              {(personal.fullName || "Your Name").toUpperCase()}
            </div>
            <div style={{ marginTop: 4, opacity: 0.92 }}>
              {personal.title || "Your Title"}
            </div>
          </div>

          <div style={{ padding: 14 }}>
            <MaroonSection title="Summary">
              <div style={{ fontSize: 12.8, lineHeight: 1.6 }}>
                {personal.summary || "Write a short professional summary..."}
              </div>
            </MaroonSection>

            <MaroonSection title="Experience">
              {experience.map((ex, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={t3.mainTitle}>
                    {(ex.role || "Role").toUpperCase()}{" "}
                    <span style={t3.muted}>
                      {ex.company ? `— ${ex.company}` : "— Company"}
                    </span>
                  </div>
                  <div style={t3.muted}>{ex.duration || "Duration"}</div>
                  <ul style={t3.ul}>
                    {(ex.bullets || [])
                      .filter((x) => x.trim())
                      .map((b, bi) => (
                        <li key={bi} style={t3.li}>
                          {b}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </MaroonSection>

            <MaroonSection title="Projects">
              {projects.map((p, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={t3.mainTitle}>
                    {p.name || "Project Name"}{" "}
                    {p.tech ? <span style={t3.muted}>• {p.tech}</span> : null}
                  </div>
                  {p.link ? <div style={t3.link}>{p.link}</div> : null}
                  <ul style={t3.ul}>
                    {(p.bullets || [])
                      .filter((x) => x.trim())
                      .map((b, bi) => (
                        <li key={bi} style={t3.li}>
                          {b}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </MaroonSection>
          </div>
        </div>
      </div>
    </div>
  );
}

function MaroonSection({ title, children }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={t3.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

const t3 = {
  topBar: { background: "#5b0f0f", color: "white", padding: 14 },
  sectionTitle: {
    fontWeight: 900,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 6,
    color: "#5b0f0f",
  },
  sideTitle: {
    fontWeight: 900,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: "#5b0f0f",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 6,
  },
  sideRow: {
    fontSize: 12,
    color: "#111827",
    marginTop: 8,
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  logoBox: {
    width: "100%",
    border: "2px solid #5b0f0f",
    padding: 16,
    textAlign: "center",
  },
  initials: {
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: 2,
    color: "#111827",
  },
  skillLabel: {
    fontWeight: 900,
    fontSize: 11.5,
    marginBottom: 6,
    color: "#111827",
  },
  mainTitle: { fontWeight: 900, fontSize: 12.8, color: "#111827" },
  muted: { fontSize: 12, color: "#6b7280" },
  ul: { margin: "8px 0 0 18px" },
  li: { fontSize: 12.6, marginBottom: 4, color: "#111827" },
  link: { fontSize: 11.5, color: "#4f46e5", marginTop: 4, wordBreak: "break-word" },
};

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "DJ";
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  const res = (a + b).toUpperCase();
  return res || "DJ";
}

// ✅ For header welcome initials (RS)
function getInitialsFromName(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const a = parts[0][0] || "";
  const b = parts[parts.length - 1][0] || "";
  return (a + b).toUpperCase();
}

function BulletsFromCSV({ text }) {
  const items = (text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!items.length)
    return <div style={{ fontSize: 12, color: "#6b7280" }}>—</div>;

  return (
    <ul style={{ margin: "0 0 0 20px", padding: 0 }}>
      {items.slice(0, 10).map((it, i) => (
        <li key={i} style={{ fontSize: 13.2, marginBottom: 6 }}>
          {it}
        </li>
      ))}
    </ul>
  );
}

const styles = {
  page: { padding: 18, fontFamily: "Arial, Helvetica, sans-serif" },

  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    marginBottom: 10,
    flexWrap: "wrap",
  },

  h1: { margin: 0, fontSize: 28 },

  actions: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },

  userInline: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginLeft: 6,
  },
  welcomeInline: {
    fontSize: 13,
    color: "#555",
    whiteSpace: "nowrap",
  },

  select: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
  },

  btn: {
    padding: "10px 12px",
    border: "1px solid #ccc",
    borderRadius: 8,
    background: "white",
    cursor: "pointer",
  },

  btnSaveDraft: {
    padding: "10px 12px",
    border: "1px solid #b91c1c",
    borderRadius: 8,
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
  },

  btnPrimary: {
    padding: "10px 12px",
    border: "1px solid #c7d2fe",
    borderRadius: 8,
    background: "#eef2ff",
    cursor: "pointer",
    fontWeight: 700,
  },

  btnDanger: {
    padding: "10px 12px",
    border: "1px solid #ccc",
    borderRadius: 8,
    background: "white",
    cursor: "pointer",
  },

  smallBtn: {
    padding: "6px 10px",
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "white",
    cursor: "pointer",
  },

  status: {
    margin: "10px 0 16px",
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 10,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    alignItems: "start",
  },

  card: { border: "1px solid #ddd", borderRadius: 14, padding: 14 },
  h2: { margin: "0 0 12px" },
  h3: { margin: "18px 0 10px", fontSize: 16 },

  fieldGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },

  label: { display: "block", fontSize: 12, marginBottom: 6, color: "#444" },

  input: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ccc",
    outline: "none",
  },

  textarea: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ccc",
    outline: "none",
    resize: "vertical",
  },

  itemBox: {
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  miniTitle: { fontSize: 12, color: "#444", fontWeight: 700, marginBottom: 6 },

  bulletRow: { display: "flex", gap: 8, alignItems: "center", marginBottom: 8 },

  preview: {
    padding: 0,
    borderRadius: 0,
    border: "none",
    overflow: "hidden",
    width: "794px",
    minHeight: "1123px",
    background: "white",
  },

  note: { marginTop: 12, fontSize: 12, color: "#555" },

  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    width: 330,
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
    overflow: "hidden",
    zIndex: 999,
  },

  dropdownHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    borderBottom: "1px solid #f1f5f9",
    background: "#fafafa",
  },

  dropdownEmpty: { padding: 12, fontSize: 13, color: "#374151" },

  dropdownList: {
    maxHeight: 320,
    overflowY: "auto",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  dropdownItem: {
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    outline: "none",
  },

  dropdownFooter: {
    display: "flex",
    gap: 10,
    padding: 10,
    borderTop: "1px solid #f1f5f9",
    background: "#fafafa",
    justifyContent: "space-between",
  },

  dropdownGhostBtn: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 12,
  },

  deleteIconBtn: {
    border: "1px solid rgba(255,255,255,0.55)",
    background: "rgba(255,255,255,0.18)",
    color: "white",
    borderRadius: 10,
    padding: "6px 8px",
    cursor: "pointer",
    lineHeight: 1,
    flexShrink: 0,
  },
};

export default App;
