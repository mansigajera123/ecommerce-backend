const express = require("express");

const router = express.Router();

const userConroller = require("../controller/userConroller");

const authenticate = require("../middleware/auth");

const validator = require("../middleware/validator");

const upload = require("../middleware/upload");

router.post("/signup", validator.signupValidator, userConroller.signUp);

router.post(
  "/login",
  validator.loginValidator,
  authenticate,
  userConroller.login
);

router.post(
  "/forgot-password",
  validator.forgotPasswordValidator,
  userConroller.forgotPassword
);

router.post("/reset-password/:token", userConroller.resetPassword);

router.patch(
  "/toggle-favorite/:id",
  authenticate,
  userConroller.toggleFavorite
);

router.get("/favorites", authenticate, userConroller.getFavourite);

router.delete(
  "/favorites/:productId",
  authenticate,
  userConroller.removeFavorite
);

router.put("/update-profile", authenticate, userConroller.updateProfilePut);

router.get("/user", authenticate, userConroller.getUserData);

router.get("/get-profile", authenticate, userConroller.getUserProfile);

module.exports = router;
