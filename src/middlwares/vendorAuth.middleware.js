  import jwt from "jsonwebtoken";
  import Vendor from "../models/vendor.model.js";

  export const vendorAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // decoded.id comes from token payload
      const vendor = await Vendor.findById(decoded.id);

      if (!vendor) {
        return res.status(401).json({ message: "Vendor not found" });
      }

      // ⭐ THIS IS WHERE req.vendor IS CREATED
      req.vendor = vendor;

      next();
    } catch (err) {
      console.error("Vendor Auth Middleware Error:", err);
      return res.status(401).json({ message: "Invalid token", error: err.message });
    }
  };
