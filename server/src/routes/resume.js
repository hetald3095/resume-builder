import express from "express";
import Resume from "../models/Resume.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * ✅ BACKWARD COMPAT: GET latest resume for user
 * GET /api/resume/me
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const doc = await Resume.findOne({ userId: req.user.id }).sort({ updatedAt: -1 });
    // return same shape your frontend expects
    res.json(doc || null);
  } catch (err) {
    console.error("Get resume /me error:", err.message);
    res.status(500).json({ message: "Failed to fetch resume" });
  }
});

/**
 * ✅ BACKWARD COMPAT: UPSERT "latest" resume for user
 * POST /api/resume/me
 * If user has no resumes yet → create one
 * If user has resumes → update the MOST RECENT one
 */
router.post("/me", requireAuth, async (req, res) => {
  try {
    const { data, template, title } = req.body;
    if (!data) return res.status(400).json({ message: "Missing resume data" });

    // Find latest resume
    const latest = await Resume.findOne({ userId: req.user.id }).sort({ updatedAt: -1 });

    if (!latest) {
      // none exists → create first resume
      const created = await Resume.create({
        userId: req.user.id,
        title: title?.trim() || "Untitled Resume",
        template: template || "taupe",
        data,
      });
      return res.status(201).json(created);
    }

    // update latest
    latest.data = data;
    latest.template = template || latest.template;
    if (typeof title === "string") latest.title = title.trim() || latest.title;

    await latest.save();
    res.json(latest);
  } catch (err) {
    console.error("Save resume /me error:", err.message);
    res.status(500).json({ message: "Failed to save resume" });
  }
});

/**
 * ✅ LIST ALL RESUMES for logged-in user
 * GET /api/resume
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const list = await Resume.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .select("_id title template updatedAt createdAt");

    res.json(list);
  } catch (err) {
    console.error("List resumes error:", err.message);
    res.status(500).json({ message: "Failed to fetch resumes" });
  }
});

/**
 * ✅ GET ONE RESUME by id
 * GET /api/resume/:id
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const doc = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) return res.status(404).json({ message: "Resume not found" });
    res.json(doc);
  } catch (err) {
    console.error("Get resume by id error:", err.message);
    res.status(500).json({ message: "Failed to fetch resume" });
  }
});

/**
 * ✅ CREATE NEW RESUME
 * POST /api/resume
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { data, template, title } = req.body;
    if (!data) return res.status(400).json({ message: "Missing resume data" });

    const doc = await Resume.create({
      userId: req.user.id,
      title: title?.trim() || "Untitled Resume",
      template: template || "taupe",
      data,
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error("Create resume error:", err.message);
    res.status(500).json({ message: "Failed to create resume" });
  }
});

/**
 * ✅ UPDATE EXISTING RESUME
 * PUT /api/resume/:id
 */
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { data, template, title } = req.body;

    const updates = {};
    if (typeof title === "string") updates.title = title.trim() || "Untitled Resume";
    if (typeof template === "string") updates.template = template;
    if (data) updates.data = data;

    const doc = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: "Resume not found" });
    res.json(doc);
  } catch (err) {
    console.error("Update resume error:", err.message);
    res.status(500).json({ message: "Failed to update resume" });
  }
});

/**
 * ✅ DELETE A RESUME
 * DELETE /api/resume/:id
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const doc = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!doc) return res.status(404).json({ message: "Resume not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete resume error:", err.message);
    res.status(500).json({ message: "Failed to delete resume" });
  }
});

export default router;
