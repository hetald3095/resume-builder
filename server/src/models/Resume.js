import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // ✅ New fields for multiple resumes
    title: { type: String, default: "Untitled Resume" }, // e.g. "DevOps Resume", "Software Engineer"
    template: { type: String, default: "taupe" },

    // full resume JSON
    data: { type: Object, required: true },
  },
  { timestamps: true }
);

// ✅ Useful index for list sorting
resumeSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model("Resume", resumeSchema);
