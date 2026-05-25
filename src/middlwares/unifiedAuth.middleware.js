import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Vendor from "../models/vendor.model.js";

/**
 * Middleware to authenticate either a User, Vendor, or Admin.
 * Attaches { id, role, account } to req.user.
 */
export const unifiedAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let account;
        let role;

        if (decoded.id === "super_admin" || decoded.role === "admin") {
            account = { _id: "super_admin", fullName: "System Admin" };
            role = "Admin";
        } else {
            // Try User first
            account = await User.findById(decoded.id);
            role = "User";

            if (!account) {
                // Try Vendor
                account = await Vendor.findById(decoded.id);
                role = "Vendor";
            }
        }

        if (!account) {
            return res.status(401).json({ message: "Account not found" });
        }

        // Attach to req.user in a standardized way
        req.user = {
            id: account._id,
            role: role,
            account: account // Full document (User or Vendor)
        };

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
