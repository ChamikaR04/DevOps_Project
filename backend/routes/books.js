import express from "express"
import Book from "../models/Book.js"
import BookCategory from "../models/BookCategory.js"
import User from "../models/User.js"

const router = express.Router()

/* Get all books in the db */
router.get("/allbooks", async (req, res) => {
    try {
        const books = await Book.find({}).populate("transactions").sort({ _id: -1 })
        res.status(200).json(books)
    }
    catch (err) {
        return res.status(504).json(err);
    }
})

/* Get Book by book Id */
router.get("/getbook/:id", async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate("transactions")

        if (!book) {
            return res.status(404).json("Book not found")
        }

        res.status(200).json(book)

    } catch (err) {
        return res.status(400).json("Invalid book ID")
    }
})

/* Get books by category name */
router.get("/", async (req, res) => {
    const category = req.query.category

    try {
        const books = await BookCategory.findOne({
            categoryName: category
        }).populate("books")

        res.status(200).json(books)
    }
    catch (err) {
        return res.status(504).json(err)
    }
})

/* Adding book */
router.post("/addbook", async (req, res) => {

    try {
        const user = await User.findById(req.body.userId);

        if (!user || !user.isAdmin) {
            return res.status(403).json(
                "You dont have permission to add a book!"
            );
        }

        const newbook = await new Book({
            bookName: req.body.bookName,
            alternateTitle: req.body.alternateTitle,
            author: req.body.author,
            bookCountAvailable: req.body.bookCountAvailable,
            language: req.body.language,
            publisher: req.body.publisher,
            bookStatus: req.body.bookSatus,
            categories: req.body.categories
        })

        const book = await newbook.save()

        await BookCategory.updateMany(
            { '_id': book.categories },
            { $push: { books: book._id } }
        );

        res.status(200).json(book)

    } catch (err) {
        return res.status(504).json(err)
    }
})

/* Updating book */
router.put("/updatebook/:id", async (req, res) => {

    try {
        const user = await User.findById(req.body.userId);

        if (!user || !user.isAdmin) {
            return res.status(403).json(
                "You dont have permission to update a book!"
            );
        }

        await Book.findByIdAndUpdate(
            req.params.id,
            {
                $set: req.body,
            }
        );

        res.status(200).json(
            "Book details updated successfully"
        );

    } catch (err) {
        return res.status(504).json(err);
    }
})

/* Remove book */
router.delete("/removebook/:id", async (req, res) => {

    try {
        const user = await User.findById(req.body.userId);

        if (!user || !user.isAdmin) {
            return res.status(403).json(
                "You dont have permission to delete a book!"
            );
        }

        const _id = req.params.id

        const book = await Book.findOne({ _id })

        if (!book) {
            return res.status(404).json(
                "Book not found"
            );
        }

        await book.remove()

        await BookCategory.updateMany(
            { '_id': book.categories },
            { $pull: { books: book._id } }
        );

        res.status(200).json(
            "Book has been deleted"
        );

    } catch (err) {
        return res.status(504).json(err);
    }
})

export default router