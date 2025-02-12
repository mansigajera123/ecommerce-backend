const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const productController = require("../controller/productController");

const authenticate = require("../middleware/auth");

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

router.post("/addtocart", authenticate, productController.addToCart);

router.get("/cart", authenticate, productController.getCart);

router.post("/order", authenticate, productController.generatePdf);

router.get("/:id/reviews", productController.getReviews);

router.post("/:id/reviews", authenticate, productController.addReview);

router.get("/products", authenticate, productController.getProductsByCategory);

router.post("/payment-intent", productController.createPaymentIntent);

router.post("/place-order", authenticate, productController.placeOrder);

router.get("/my-orders", authenticate, productController.getOrders);

router.delete(
  "/cart/:productId",
  authenticate,
  productController.deleteCartItem
);

router.get(
  "/order-invoice/:orderId",
  authenticate,
  productController.generatePdf
);

router.post("/confirm-order", authenticate, productController.confirmPayment);


module.exports = router;
