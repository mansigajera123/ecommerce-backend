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
      "http://localhost:3001",
      "https://f74a-2405-201-2009-e7-62da-449-ff63-9291.ngrok-free.app",
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
  .then((result) => app.listen(8080))
  .catch((err) => console.log(err));
