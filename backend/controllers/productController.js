import { v2 as cloudinary } from "cloudinary";
import { ProductModels } from "../models/productModels.js";

// Get all products
const getProducts = async (req, res) => {
  try {
    const products = await ProductModels.find()
      .populate("category", "name")
      .populate("SubCategory", "name")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProductModels.findById(id)
      .populate("category", "name")
      .populate("SubCategory", "name")
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      SubCategory,
      unit,
      stock,
      price,
      discount,
      description,
      more_details,
      publish
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Product name is required" });
    }

    // Check if product name already exists
    const existingProduct = await ProductModels.findOne({ name });
    if (existingProduct) {
      return res.status(400).json({ message: "Product name already exists" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    // Upload multiple images to Cloudinary
    const imageUploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "products",
            resource_type: "image"
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                public_id: result.public_id
              });
            }
          }
        );
        uploadStream.end(file.buffer);
      });
    });

    const uploadedImages = await Promise.all(imageUploadPromises);

    // Parse JSON fields
    let parsedCategory = [];
    let parsedSubCategory = [];
    let parsedMoreDetails = {};

    if (category) {
      parsedCategory = Array.isArray(category) ? category : JSON.parse(category);
    }
    if (SubCategory) {
      parsedSubCategory = Array.isArray(SubCategory) ? SubCategory : JSON.parse(SubCategory);
    }
    if (more_details) {
      parsedMoreDetails = typeof more_details === 'string' ? JSON.parse(more_details) : more_details;
    }

    // Create product
    const newProduct = new ProductModels({
      name,
      images: uploadedImages,
      category: parsedCategory,
      SubCategory: parsedSubCategory,
      unit: unit || "",
      stock: parseInt(stock) || 0,
      price: parseFloat(price) || null,
      discount: parseFloat(discount) || null,
      description: description || "",
      more_details: parsedMoreDetails,
      publish: publish === 'true' || publish === true
    });

    await newProduct.save();

    // Populate before sending response
    const populatedProduct = await ProductModels.findById(newProduct._id)
      .populate("category", "name")
      .populate("SubCategory", "name");

    res.status(201).json(populatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      SubCategory,
      unit,
      stock,
      price,
      discount,
      description,
      more_details,
      publish
    } = req.body;

    const product = await ProductModels.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check name uniqueness if changing
    if (name && name !== product.name) {
      const existingProduct = await ProductModels.findOne({ name });
      if (existingProduct) {
        return res.status(400).json({ message: "Product name already exists" });
      }
    }

    // Handle image uploads if new images are provided
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      if (product.images && product.images.length > 0) {
        const deletePromises = product.images.map(img => {
          if (img.public_id) {
            return cloudinary.uploader.destroy(img.public_id);
          }
        });
        await Promise.all(deletePromises.filter(Boolean));
      }

      // Upload new images
      const imageUploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "products",
              resource_type: "image"
            },
            (error, result) => {
              if (error) {
                console.error("Cloudinary upload error:", error);
                reject(error);
              } else {
                resolve({
                  url: result.secure_url,
                  public_id: result.public_id
                });
              }
            }
          );
          uploadStream.end(file.buffer);
        });
      });

      const uploadedImages = await Promise.all(imageUploadPromises);
      product.images = uploadedImages;
    }

    // Update other fields
    if (name) product.name = name;
    if (category) {
      product.category = Array.isArray(category) ? category : JSON.parse(category);
    }
    if (SubCategory) {
      product.SubCategory = Array.isArray(SubCategory) ? SubCategory : JSON.parse(SubCategory);
    }
    if (unit !== undefined) product.unit = unit;
    if (stock !== undefined) product.stock = parseInt(stock);
    if (price !== undefined) product.price = parseFloat(price);
    if (discount !== undefined) product.discount = parseFloat(discount);
    if (description !== undefined) product.description = description;
    if (more_details) {
      product.more_details = typeof more_details === 'string' ? JSON.parse(more_details) : more_details;
    }
    if (publish !== undefined) product.publish = publish === 'true' || publish === true;

    await product.save();

    // Populate before sending response
    const populatedProduct = await ProductModels.findById(product._id)
      .populate("category", "name")
      .populate("SubCategory", "name");

    res.status(200).json(populatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await ProductModels.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map(img => {
        if (img.public_id) {
          return cloudinary.uploader.destroy(img.public_id);
        }
      });
      await Promise.all(deletePromises.filter(Boolean));
    }

    // Delete product from database
    await ProductModels.findByIdAndDelete(id);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const products = await ProductModels.find({
      category: { $in: [categoryId] }
    })
      .populate("category", "name")
      .populate("SubCategory", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get products by subcategory
const getProductsBySubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;
    const products = await ProductModels.find({
      SubCategory: { $in: [subCategoryId] }
    })
      .populate("category", "name")
      .populate("SubCategory", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getProductsBySubCategory
};
