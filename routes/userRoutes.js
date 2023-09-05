const express = require("express");
const userController = require("./../controllers/userController.js");
const authController = require("./../controllers/authController.js");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updatePassword,
);

router.patch(
  "/updateMe",
  authController.protect,
  userController.updateMe,
);

router.delete(
  "/deleteMe",
  authController.protect,
  userController.deleteMe,
);

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser)
  .put(() => {});

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
