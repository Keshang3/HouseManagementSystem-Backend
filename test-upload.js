import dotenv from "dotenv";
dotenv.config();
import { uploadImage } from "./src/config/imagekit.js";

(async () => {
  try {
    const base64Str = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const res = await uploadImage(base64Str, "test.png");
    console.log("Success with base64 string:", res);
  } catch (err) {
    console.error("Error with base64 string:", err);
  }
})();
