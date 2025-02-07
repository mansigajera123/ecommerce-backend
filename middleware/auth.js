const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const token = req.headers.authorization
    ? req.headers.authorization.split(" ")[1]
    : null;

  jwt.verify(token, "secretsupersecretsecret", (err, decodedToken) => {
    console.log(decodedToken);
    req.user = decodedToken;
    next();
  });
};

module.exports = authenticate;

// const jwt = require("jsonwebtoken");
// const passport = require("passport");

// exports.googleAuth = passport.authenticate("google", { scope: ["profile", "email"] });

// exports.googleAuthCallback = (req, res) => {
//   // Generate JWT token after successful authentication
//   const token = jwt.sign(
//     { id: req.user.id, email: req.user.email },
//     "secretsupersecretsecret", // Use a strong secret (store in env file)
//     { expiresIn: "1h" }
//   );

//   res.json({ message: "Login successful", token, user: req.user });
// };
