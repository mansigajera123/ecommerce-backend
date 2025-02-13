const Product = require("../model/product");

const Cart = require("../model/cart");

const PDFDocument = require("pdfkit");

const User = require("../model/user");

const Order = require("../model/order");

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

exports.generatePdf = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await Order.findById(orderId).populate("user.userId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const user = order.user.userId;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const doc = new PDFDocument();
    let totalPrice = 0;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=order-${orderId}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text("Invoice", { align: "center" }).moveDown();
    doc
      .fontSize(12)
      .text(`Name: ${user.firstName || "N/A"} ${user.lastName || ""}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Phone: ${user.phone || "N/A"}`);
    doc.text(`Address: ${user.address || "N/A"}`);
    doc.moveDown();

    doc.text("Order Details:");
    order.products.forEach((item, index) => {
      const product = item.product;
      const itemTotalPrice = product.price * item.quantity;
      doc.text(
        `${index + 1}. ${product.title} - Quantity: ${
          item.quantity
        } - Price: ₹ ${product.price} - Total: ₹ ${itemTotalPrice}`
      );
      totalPrice += itemTotalPrice;
    });

    doc.moveDown().text(`Total Bill: ₹ ${totalPrice}`, { underline: true });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Error generating PDF" });
  }
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
};

exports.placeOrder = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const order = new Order({
      user: {
        email: user.email,
        userId: userId,
      },
      products: cart.items.map((item) => ({
        product: {
          title: item.productId.title,
          price: item.productId.price,
          image: item.productId.image,
        },
        quantity: item.quantity,
      })),
    });

    await order.save();
    await Cart.findOneAndUpdate({ userId }, { items: [] });
    return res
      .status(201)
      .json({ message: "Order placed successfully", order });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const orders = await Order.find({
      "user.userId": userId,
      paymentStatus: "success",
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteCartItem = (req, res) => {
  const userId = req.user.userId;
  const productId = req.params.productId;

  Cart.findOne({ userId })
    .then((cart) => {
      if (!cart) return res.status(404).json({ message: "Cart not found" });

      cart.items = cart.items.filter(
        (item) => item.productId.toString() !== productId
      );
      return cart.save();
    })
    .then(() => res.status(200).json({ message: "Item removed from cart" }))
    .catch((err) => res.status(500).json({ message: "Error removing item" }));
};

exports.confirmPayment = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (message !== "payment successful") {
      return res.status(400).json({ message: "Invalid payment message" });
    }

    const existingOrder = await Order.findOne({
      "user.userId": req.user.userId,
      paymentStatus: "pending",
    });

    if (!existingOrder) {
      return res.status(404).json({ message: "No pending order found" });
    }

    if (existingOrder.paymentStatus === "success") {
      return res
        .status(200)
        .json({ message: "Order already confirmed", existingOrder });
    }

    existingOrder.paymentStatus = "success";
    await existingOrder.save();

    return res
      .status(200)
      .json({ message: "Order updated successfully", existingOrder });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error conforming payment", error });
  }
};

exports.getOrderDetails = (req, res, next) => {
  const orderId = req.params.id;
  Order.findById(orderId).then((order) => {
    res.json(order);
  });
};
