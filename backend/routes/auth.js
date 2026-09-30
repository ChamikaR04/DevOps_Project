import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";

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
      isAdmin: req.body.isAdmin,
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
        const { admissionId, employeeId, password } = req.body;

        // Validate password type
        if (typeof password !== "string") {
            return res.status(400).json("Invalid password");
        }

        let user;

        if (admissionId !== undefined) {
            // Prevent NoSQL operators such as {$ne: ...}
            if (typeof admissionId !== "string") {
                return res.status(400).json("Invalid admission ID");
            }

            user = await User.findOne({
                admissionId: admissionId
            });
        }
        else if (employeeId !== undefined) {
            // Prevent NoSQL operators such as {$ne: ...}
            if (typeof employeeId !== "string") {
                return res.status(400).json("Invalid employee ID");
            }

            user = await User.findOne({
                employeeId: employeeId
            });
        }
        else {
            return res.status(400).json(
                "Admission ID or Employee ID is required"
            );
        }

        if (!user) {
            return res.status(404).json("User not found");
        }

        const validPass = await bcrypt.compare(password, user.password);

        if (!validPass) {
            return res.status(400).json("Wrong Password");
        }

        // Do not expose the password hash
        const { password: _, ...safeUser } = user._doc;

        return res.status(200).json(safeUser);

    } catch (err) {
        console.log(err);
        return res.status(500).json("Internal server error");
    }
});

export default router;
