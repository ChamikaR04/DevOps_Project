import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

/* User Registration */
router.post("/register", async (req, res) => {
  try {
    /* Salting and Hashing the Password */
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(req.body.password, salt);

    /* Create a new user */
    const newuser = await new User({
      userType: req.body.userType,
      userFullName: req.body.userFullName,
      admissionId: req.body.admissionId,
      employeeId: req.body.employeeId,
      age: req.body.age,
      dob: req.body.dob,
      gender: req.body.gender,
      address: req.body.address,
      mobileNumber: req.body.mobileNumber,
      email: req.body.email,
      password: hashedPass,
      isAdmin: false,
    });

    /* Save User and Return */
    const user = await newuser.save();
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
});

/* User Login */
router.post("/signin", async (req, res) => {
    try {
        const user = req.body.admissionId
            ? await User.findOne({ admissionId: req.body.admissionId })
            : await User.findOne({ employeeId: req.body.employeeId });

        if (!user) {
            return res.status(404).json("User not found");
        }

        const validPass = await bcrypt.compare(
            req.body.password,
            user.password
        );

        if (!validPass) {
            return res.status(400).json("Wrong Password");
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                isAdmin: user.isAdmin === true
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        const { password, ...safeUser } = user._doc;

        res.status(200).json({
            ...safeUser,
            token
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json("Login failed");
    }
});
export default router;
