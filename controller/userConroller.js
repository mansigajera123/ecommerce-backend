const User = require("../model/user");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const crypto = require("crypto");

const nodemailer = require("nodemailer");

const { validationResult } = require("express-validator");

exports.signUp = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array()[0].msg });
  }
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email }).then((existingUser) => {
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use" });
    }
    bcrypt.hash(password, 12).then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
      });

      user
        .save()
        .then((user) => {
          res.json(user);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  });
};

exports.login = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email: email }).then((user) => {
    if (!user) {
      res.json({ message: "user not found" });
    }

    bcrypt.compare(password, user.password).then((isMathed) => {
      if (isMathed) {
        const token = jwt.sign(
          { userId: user._id },
          "secretsupersecretsecret",
          { expiresIn: "3h" }
        );
        res.json({ user, token });
      } else {
        res.status(400).json({ message: "Incorrect password" });
      }
    });
  });
};

exports.forgotPassword = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const email = req.body.email;
  User.findOne({ email: email }).then((user) => {
    if (!user) {
      return res.json({ message: "not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetToken = resetToken;

    user.resetTokenExpiration = Date.now() + 3600000;

    console.log(resetToken);
    user
      .save()
      .then(() => {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "mansigajera102@gmail.com",
            pass: "25x12-Mansi",
          },
        });

        const resetUrl = `https://1854-2405-201-2009-e7-d85c-ebd1-2cfe-7ff5.ngrok-free.app/reset-password/${resetToken}`;

        transporter
          .sendMail({
            to: user.email,
            subject: "Password Reset",
            text: `Click the following link to reset password ${resetUrl}`,
          })
          .then(() => {
            res.json({ message: "password reset email sent" });
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

exports.resetPassword = (req, res, next) => {
  const resetToken = req.params.token;
  const newPassword = req.body.password;

  User.findOne({
    resetToken: resetToken,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        return res
          .status(400)
          .json({ message: "Reset token is invalid or expired" });
      }

      bcrypt.hash(newPassword, 12).then((hashedPassword) => {
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiration = undefined;

        user.save().then(() => {
          res.json({ message: "Password reset successful" });
        });
      });
    })
    .catch((err) => {
      res
        .status(500)
        .json({ message: "An error occurred while resetting password" });
    });
};

exports.updateProfilePut = async (req, res) => {
  const userId = req.user.userId;
  const { firstName, lastName, phone, address } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    user.address = address || user.address;

    await user.save();
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile" });
  }
};

exports.getUserData = (req, res, next) => {
  const userId = req.user.userId;
  User.findOne({ _id: userId })
    .then((user) => res.json(user))
    .catch((err) => console.log(err));
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.uploadPicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.profilePicture = `/images/${req.file.filename}`;
    await user.save();

    res.json({
      message: "Profile picture updated",
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile picture", error });
  }
};
