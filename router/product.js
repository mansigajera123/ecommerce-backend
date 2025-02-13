const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const productController = require("../controller/productController");

const authenticate = require("../middleware/auth");

const cartController = require("../controller/cartController");

router.get("/product", authenticate, productController.getProduct);

router.get("/allproduct", authenticate, productController.getAllProduct);

router.post(
  "/addProduct",
  upload.single("image"),
  authenticate,
  productController.postProduct
);

router.delete("/delete/:id", authenticate, productController.deleteProduct);

router.put(
  "/edit/:id",
  upload.single("image"),
  authenticate,
  productController.editProduct
);

router.get("/detail/:id", authenticate, productController.detailView);

router.post("/addtocart", authenticate, cartController.addToCart);

router.get("/cart", authenticate, cartController.getCart);

router.post("/order", authenticate, cartController.generatePdf);

router.get("/:id/reviews", productController.getReviews);

router.post("/:id/reviews", authenticate, productController.addReview);

router.get("/products", authenticate, productController.getProductsByCategory);

router.post("/payment-intent", cartController.createPaymentIntent);

router.post("/place-order", authenticate, cartController.placeOrder);

router.get("/my-orders", authenticate, cartController.getOrders);

router.delete("/cart/:productId", authenticate, cartController.deleteCartItem);

router.get("/order-invoice/:orderId", authenticate, cartController.generatePdf);

router.post("/confirm-order", authenticate, cartController.confirmPayment);

router.get("/order-detail/:id", authenticate, cartController.getOrderDetails);

module.exports = router;
