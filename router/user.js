const express = require("express");

const router = express.Router();

const userConroller = require("../controller/userConroller");

const authenticate = require("../middleware/auth");

const validator = require("../middleware/validator");

const upload = require("../middleware/upload");

const favouriteController = require("../controller/favouriteController");

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
  favouriteController.toggleFavorite
);

router.get("/favorites", authenticate, favouriteController.getFavourite);

router.delete(
  "/favorites/:productId",
  authenticate,
  favouriteController.removeFavorite
);

router.put("/update-profile", authenticate, userConroller.updateProfilePut);

router.get("/user", authenticate, userConroller.getUserData);

router.get("/get-profile", authenticate, userConroller.getUserProfile);

router.put(
  "/upload-profile-picture",
  authenticate,
  upload.single("profilePicture"),
  userConroller.uploadPicture
);

module.exports = router;
