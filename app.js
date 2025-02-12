const express = require("express");

const app = express();

const bodyParser = require("body-parser");

const cors = require("cors");

const mongoose = require("mongoose");

const userRouter = require("./router/user");

const productRouter = require("./router/product");

const path = require("path");

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://2ea3-2405-201-2009-e7-a09c-ce92-1000-91f4.ngrok-free.app",
      "https://e-commerce-vby2.vercel.app",
    ],
    methods: ["POST", "PUT", "GET", "DELETE", "PATCH"],
  })
);

app.use("/images", express.static(path.join(__dirname, "images")));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.json());

app.use("/", userRouter);

app.use(productRouter);

mongoose
  .connect(
    "mongodb+srv://mansigajera2512:h8KYuSDiqjeF4YTE@cluster0.gwch9.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then((result) => app.listen(2000))
  .catch((err) => console.log(err));
