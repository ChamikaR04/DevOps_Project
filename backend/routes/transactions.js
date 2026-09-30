import express from "express"
import Book from "../models/Book.js"
import BookTransaction from "../models/BookTransaction.js"

const router = express.Router()

router.post("/add-transaction", async (req, res) => {
    try {
        // Only authenticated administrators can add transactions
        if (!req.user || req.user.isAdmin !== true) {
            return res.status(403).json(
                "You are not allowed to add a Transaction"
            )
        }

        const newtransaction = new BookTransaction({
            bookId: req.body.bookId,
            borrowerId: req.body.borrowerId,
            bookName: req.body.bookName,
            borrowerName: req.body.borrowerName,
            transactionType: req.body.transactionType,
            fromDate: req.body.fromDate,
            toDate: req.body.toDate
        })

        const transaction = await newtransaction.save()

        const book = await Book.findById(
            req.body.bookId
        )

        if (!book) {
            return res.status(404).json(
                "Book not found"
            )
        }

        await book.updateOne({
            $push: {
                transactions: transaction._id
            }
        })

        return res.status(200).json(transaction)

    } catch (err) {
        console.error("ADD TRANSACTION ERROR:", err)

        return res.status(500).json(
            "Internal server error"
        )
    }
})

router.get("/all-transactions", async (req, res) => {
    try {
        const transactions = await BookTransaction.find({}).sort({ _id: -1 })
        res.status(200).json(transactions)
    }
    catch (err) {
        return res.status(504).json(err)
    }
})

router.put("/update-transaction/:id", async (req, res) => {
    try {
        // Only authenticated administrators can update transactions
        if (!req.user || req.user.isAdmin !== true) {
            return res.status(403).json(
                "Only administrators can update transactions"
            )
        }

        // Only allow legitimate transaction fields
        const {
            bookId,
            borrowerId,
            bookName,
            borrowerName,
            transactionType,
            fromDate,
            toDate
        } = req.body

        const updateData = {
            bookId,
            borrowerId,
            bookName,
            borrowerName,
            transactionType,
            fromDate,
            toDate
        }

        const transaction =
            await BookTransaction.findByIdAndUpdate(
                req.params.id,
                {
                    $set: updateData
                },
                {
                    new: true
                }
            )

        if (!transaction) {
            return res.status(404).json(
                "Transaction not found"
            )
        }

        return res.status(200).json(
            "Transaction details updated successfully"
        )

    } catch (err) {
        console.error(
            "UPDATE TRANSACTION ERROR:",
            err
        )

        return res.status(500).json(
            "Internal server error"
        )
    }
})

router.delete("/remove-transaction/:id", async (req, res) => {
    try {
        // Only authenticated administrators can delete transactions
        if (!req.user || req.user.isAdmin !== true) {
            return res.status(403).json(
                "Only administrators can delete transactions"
            )
        }

        const data =
            await BookTransaction.findByIdAndDelete(
                req.params.id
            )

        if (!data) {
            return res.status(404).json(
                "Transaction not found"
            )
        }

        const book = await Book.findById(data.bookId)

        if (!book) {
            return res.status(404).json(
                "Book not found"
            )
        }

        await book.updateOne({
            $pull: {
                transactions: req.params.id
            }
        })

        return res.status(200).json(
            "Transaction deleted successfully"
        )

    } catch (err) {
        console.error(
            "DELETE TRANSACTION ERROR:",
            err
        )

        return res.status(500).json(
            "Internal server error"
        )
    }
})

export default router