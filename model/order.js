const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    user: {
      email: {
        type: String,
        required: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    products: [
      {
        product: { type: Object, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    paymentStatus: {
      type: String,
      enum: ["pending", "success"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
