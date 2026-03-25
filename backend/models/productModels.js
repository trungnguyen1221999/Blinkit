import mongoose from "mongoose";
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      unique: true,
    },
    images: [
      {
        url: { type: String, default: "" }, // link ảnh Cloudinary
        public_id: { type: String, default: "" }, // dùng để xoá ảnh
      }
    ],
    category: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    SubCategory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
      },
    ],
    unit: {
      type: String,
      default: "",
    },
    stock: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      default: null,
    },
    discount: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
    more_details: {
      type: Object,
      default: {},
    },
    publish: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

productSchema.index({ category: 1 });
productSchema.index({ SubCategory: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ publish: 1, createdAt: -1 });

export const ProductModels = mongoose.model("Product", productSchema);
