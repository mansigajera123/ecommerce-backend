const Product = require("../model/product");

const Cart = require("../model/cart");

const PDFDocument = require("pdfkit");

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

exports.addToCart = (req, res, next) => {
  const { productId, quantity } = req.body;
  const userId = req.user.userId;

  Cart.findOne({ userId: userId })
    .then((cart) => {
      if (!cart) {
        const newcart = new Cart({
          userId: userId,
          items: [
            {
              productId: productId,
              quantity: quantity,
            },
          ],
        });
        return newcart.save();
      }
      const existing = cart.items.findIndex(
        (item) => item.productId.toString() === productId.toString()
      );
      if (existing !== -1) {
        cart.items[existing].quantity += quantity;
      } else {
        cart.items.push({ productId, quantity });
      }
      return cart.save();
    })
    .then((cart) => res.json(cart))
    .catch((err) => console.log(err));
};

exports.getCart = async (req, res, next) => {
  Cart.findOne({
    userId: req.user.userId,
  })
    .populate("items.productId", "title price image")
    .then((cart) => res.json(cart))
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

  let query = {
    title: { $regex: searchQuery, $options: "i" },
    price: { $gte: minPrice, $lte: maxPrice },
  };

  if (category) {
    query.category = { $regex: category, $options: "i" };
  }

  Product.find(query)
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

exports.generatePdf = async (req, res, next) => {
  const { items } = req.body;
  const userId = req.user.userId;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const doc = new PDFDocument();
  let totalPrice = 0;
  doc.moveDown();
  doc.fontSize(18).text("Invoice", { align: "center" }).moveDown();
  doc.fontSize(12).text(`Name: ${user.firstName || ""} ${user.lastName || ""}`);
  doc.text(`Email: ${user.email}`);
  doc.text(`Phone: ${user.phone || "N/A"}`);
  doc.text(`Address: ${user.address || "N/A"}`);
  doc.moveDown();

  doc.text("Order Details:");
  items.forEach((item, index) => {
    const product = item.productId;
    const itemTotalPrice = product.price * item.quantity;
    doc.text(
      `${index + 1}. ${product.title} - Quantity: ${item.quantity} - Price: $${
        product.price
      } - Total: $${itemTotalPrice.toFixed(2)}`
    );
    totalPrice += itemTotalPrice;
  });
  doc
    .moveDown()
    .text(`Total Bill: $${totalPrice.toFixed(2)}`, { underline: true });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=order.pdf");
  doc.pipe(res);
  doc.end();

  try {
    const updatedCart = await Cart.updateOne(
      { userId: req.user.userId },
      { $set: { items: [] } }
    );
  } catch (error) {
    console.error("Error emptying the cart:", error);
  }
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
      console.log(product.reviews);
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

const stripe = require("stripe")(
  "sk_test_51QgjlSL56fvSGhWQNvsWqyDYHQ5RNeciDa4sUwiQsl6xAmOA5f3iUrcZbbpwjyMUL9LC3WsG838pQzvkEj7ZDJNS00GhmrVZdo"
);

exports.createPaymentIntent = async (req, res, next) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "USD",
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error creating payment intent");
  }

  try {
    const updatedCart = await Cart.updateOne(
      { userId: req.user.userId },
      { $set: { items: [] } }
    );
  } catch (error) {
    console.error("Error emptying the cart:", error);
  }
};


