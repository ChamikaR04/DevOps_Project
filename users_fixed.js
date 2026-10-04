import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";

const router = express.Router()

/* Getting user by id */
router.get("/getuser/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate("activeTransactions").populate("prevTransactions")
        const { password, updatedAt, ...other } = user._doc;
        res.status(200).json(other);
    } 
    catch (err) {
        return res.status(500).json(err);
    }
})

/* Getting all members in the library */
// ============================================================================
// VP 1: Data Minimization / Masking Sensitive Fields
// Fix: Used map() to remove password field, returning safeUsers only.
// ============================================================================
router.get("/allmembers", async (req,res)=>{
    try{
        const users = await User.find({})
            .populate("activeTransactions")
            .populate("prevTransactions")
            .sort({_id:-1})

        const safeUsers = users.map(user => {
            const { password, ...other } = user._doc
            return other
        })
        res.status(200).json(safeUsers) 
    }
    catch(err){
        return res.status(500).json(err);
    }
})

/* Update user by id */
// ============================================================================
// VP 2: Server-Side Auth, Field Whitelisting & Password Hashing
// Fix 1: Verified identity via server token (req.user), NOT req.body.
// Fix 2: Whitelisted update fields in updateData to block mass assignment.
// Fix 3: Hashes new passwords with bcrypt before saving to DB.
// ============================================================================
router.put("/updateuser/:id", async (req, res) => {
    try {
        // Authorization is based on authenticated server-side user token
        const isOwnAccount = req.user && req.user.id === req.params.id
        const isAdmin = req.user && req.user.isAdmin === true

        if (!isOwnAccount && !isAdmin) {
            return res.status(403).json("You can update only your account!")
        }

        // Only allow approved fields to be updated (Whitelisting)
        const {
            userFullName,
            age,
            dob,
            gender,
            address,
            mobileNumber,
            email,
            password
        } = req.body

        const updateData = {
            userFullName,
            age,
            dob,
            gender,
            address,
            mobileNumber,
            email
        }

        // Hash password if a new password was supplied
        if (password) {
            const salt = await bcrypt.genSalt(10)
            updateData.password = await bcrypt.hash(password, salt)
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                $set: updateData
            },
            {
                new: true
            }
        )

        if (!user) {
            return res.status(404).json("User not found")
        }

        return res.status(200).json("Account has been updated")

    } catch (err) {
        console.error("UPDATE USER ERROR:", err)
        return res.status(500).json("Internal server error")
    }
})

/* Adding transaction to active transactions list */
// ============================================================================
// VP 3: Server-Side Admin Role Verification
// Fix: Verified req.user.isAdmin from server auth token/JWT middleware.
// ============================================================================
router.put("/:id/move-to-activetransactions", async (req, res) => {
    try {
        // Only authenticated administrators can perform this operation
        if (!req.user || req.user.isAdmin !== true) {
            return res.status(403).json(
                "Only Admin can add a transaction"
            )
        }

        const user = await User.findById(req.body.userId)

        if (!user) {
            return res.status(404).json("User not found")
        }

        await user.updateOne({
            $push: {
                activeTransactions: req.params.id
            }
        })

        return res.status(200).json(
            "Added to Active Transaction"
        )

    } catch (err) {
        console.error(
            "MOVE TO ACTIVE TRANSACTION ERROR:",
            err
        )

        return res.status(500).json(
            "Internal server error"
        )
    }
})

/* Adding transaction to previous transactions list and removing from active transactions list */
// ============================================================================
// VP 4: Secure Transaction Relocation
// Fix: Relies on server-validated req.user token for admin updates.
// ============================================================================
router.put("/:id/move-to-prevtransactions", async (req, res) => {
    try {
        // Only authenticated administrators can perform this operation
        if (!req.user || req.user.isAdmin !== true) {
            return res.status(403).json(
                "Only Admin can do this"
            )
        }

        const user = await User.findById(req.body.userId)

        if (!user) {
            return res.status(404).json("User not found")
        }

        // Remove transaction from active transactions
        await user.updateOne({
            $pull: {
                activeTransactions: req.params.id
            }
        })

        // Add transaction to previous transactions
        await user.updateOne({
            $push: {
                prevTransactions: req.params.id
            }
        })

        return res.status(200).json(
            "Added to Previous Transactions"
        )

    } catch (err) {
        console.error(
            "MOVE TO PREVIOUS TRANSACTION ERROR:",
            err
        )

        return res.status(500).json(
            "Internal server error"
        )
    }
})

/* Delete user by id */
// ============================================================================
// VP 5: Protected Account Deletion
// Fix: Deletion allowed strictly via verified req.user identity.
// ============================================================================
router.delete("/deleteuser/:id", async (req, res) => {
    try {
        // Determine identity from authenticated user
        const isOwnAccount =
            req.user && req.user.id === req.params.id

        const isAdmin =
            req.user && req.user.isAdmin === true

        if (!isOwnAccount && !isAdmin) {
            return res.status(403).json(
                "You can delete only your account!"
            )
        }

        const user = await User.findByIdAndDelete(
            req.params.id
        )

        if (!user) {
            return res.status(404).json(
                "User not found"
            )
        }

        return res.status(200).json(
            "Account has been deleted"
        )

    } catch (err) {
        console.error("DELETE USER ERROR:", err)

        return res.status(500).json(
            "Internal server error"
        )
    }
})

export default router
