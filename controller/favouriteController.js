const User = require("../model/user");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const crypto = require("crypto");

const nodemailer = require("nodemailer");

const { validationResult } = require("express-validator");

const Product = require("../model/product");

exports.toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const productId = req.params.id;
    const { isFavorite } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (isFavorite) {
      if (user.favorites.includes(productId)) {
        return res
          .status(400)
          .json({ message: "Product is already in your favorites" });
      }
      user.favorites.push(productId);
    } else {
      user.favorites = user.favorites.filter(
        (id) => id.toString() !== productId
      );
    }

    await user.save();

    res.json({ message: "Favorite status updated", isFavorite: !isFavorite });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong!" });
  }
};

exports.getFavourite = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).populate("favorites");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong!" });
  }
};

exports.removeFavorite = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.favorites.includes(productId)) {
      return res
        .status(400)
        .json({ message: "Product is not in the favorites list" });
    }

    user.favorites = user.favorites.filter((id) => id.toString() !== productId);

    await user.save();
    res.status(200).json({ message: "Product removed from favorites" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
