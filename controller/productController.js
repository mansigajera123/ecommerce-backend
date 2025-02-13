const Product = require("../model/product");

const Cart = require("../model/cart");

const User = require("../model/user");

exports.getProduct = (req, res, next) => {
  const userId = req.user.userId;
  Product.find({ userId: userId })
    .then((product) => res.json(product))
    .catch((err) => console.log(err));
};

exports.postProduct = (req, res, next) => {
  const product = new Product({
    title: req.body.title,
    image: req.file.path,
    price: req.body.price,
    description: req.body.description,
    userId: req.user.userId,
    category: req.body.category,
  });

  product
    .save()
    .then((product) => res.json(product))
    .catch((err) => console.log(err));
};

exports.deleteProduct = (req, res, next) => {
  const id = req.params.id;

  Product.findByIdAndDelete(id)
    .then((product) => res.json(product))
    .catch((err) => console.log(err));
};

exports.editProduct = (req, res, next) => {
  const id = req.params.id;
  const updatedTitle = req.body.title;
  const updatedImage = req.file ? req.file.path : null;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;
  const updatedCategory = req.body.category;
  Product.findByIdAndUpdate(
    id,
    {
      title: updatedTitle,
      image: updatedImage,
      price: updatedPrice,
      description: updatedDescription,
      category: updatedCategory,
      userId: req.user.userId,
    },
    { new: true }
  )
    .then((product) => {
      res.json(product);
    })
    .catch((err) => console.log(err));
};

exports.detailView = (req, res, next) => {
  const id = req.params.id;

  Product.findById(id)
    .populate("userId", "email")
    .then((product) => res.json(product))
    .catch((err) => console.log(err));
};

exports.getAllProduct = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 14;
  const skip = (page - 1) * limit;
  const searchQuery = req.query.search || "";
  const category = req.query.category || "";
  const minPrice = parseInt(req.query.minPrice) || 0;
  const maxPrice = req.query.maxPrice
    ? parseInt(req.query.maxPrice)
    : Number.MAX_VALUE;
  const sortBy = req.query.sortBy || "none";

  let query = {
    $or: [
      { title: { $regex: searchQuery, $options: "i" } },
      { description: { $regex: searchQuery, $options: "i" } },
    ],
    price: { $gte: minPrice, $lte: maxPrice },
  };

  if (category) {
    query.category = { $regex: category, $options: "i" };
  }

  let sortQuery = {};
  if (sortBy === "lowToHigh") {
    sortQuery.price = 1;
  } else if (sortBy === "highToLow") {
    sortQuery.price = -1;
  }

  Product.find(query)
    .sort(sortQuery)
    .skip(skip)
    .limit(limit)
    .exec()
    .then((product) => {
      Product.countDocuments(query)
        .then((totalProducts) => {
          const totalPages = Math.ceil(totalProducts / limit);
          res.json({
            product,
            totalProducts,
            totalPages,
            currentPage: page,
          });
        })
        .catch((err) => {
          res.status(500).json({ message: "Error counting products" });
        });
    })
    .catch((err) => console.log(err));
};

exports.addReview = (req, res, next) => {
  const productId = req.params.id;
  const { rating, reviewText } = req.body;
  const userId = req.user.userId;

  Product.findById(productId)
    .then((product) => {
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      product.reviews.push({ userId, rating, reviewText });
      const totalReviews = product.reviews.length;
      const totalRating = product.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      product.avgRating = totalRating / totalReviews;
      return product.save();
    })
    .then((product) => {
      res.status(201).json({ message: "Review added successfully", product });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Something went wrong!" });
    });
};

exports.getReviews = (req, res, next) => {
  const productId = req.params.id;

  Product.findById(productId)
    .populate("reviews.userId", "email")
    .then((product) => {
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(200).json({ reviews: product.reviews });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Something went wrong!" });
    });
};

exports.getProductsByCategory = (req, res, next) => {
  const category = req.query.category;

  Product.find({ category: category })
    .then((products) => {
      res.json(products);
    })
    .catch((err) => console.log(err));
};
