import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json("Authentication required");
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();
    } catch (err) {
        return res.status(401).json("Invalid or expired token");
    }
};

export const verifyAdmin = (req, res, next) => {
    if (!req.user || req.user.isAdmin !== true) {
        return res.status(403).json("Admin access required");
    }

    next();
};