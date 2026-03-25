import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
      trim: true,
      required: true,
      unique: true,
    },
    image: {
      url: { type: String, default: "" }, // link ảnh Cloudinary
      public_id: { type: String, default: "" }, // dùng để xoá ảnh
    },
  },
  { timestamps: true }
);

categorySchema.index({ createdAt: -1 });

const CategoryModels = mongoose.model("Category", categorySchema);
export default CategoryModels;
