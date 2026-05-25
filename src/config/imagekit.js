import ImageKit from "imagekit";
import dotenv from "dotenv";

dotenv.config();
console.log("PUBLIC:", process.env.IMAGEKIT_PUBLIC_KEY);
console.log("PRIVATE:", process.env.IMAGEKIT_PRIVATE_KEY);
console.log("URL:", process.env.IMAGEKIT_URL_ENDPOINT);

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});



export const uploadImage = async (fileBuffer, fileName) => {
  try {
    const fileData = Buffer.isBuffer(fileBuffer) ? fileBuffer : fileBuffer;
    const response = await imagekit.upload({
      file: fileData, // buffer
      fileName: fileName, // fileName
      folder: "/users_avatars",
    });
    return response;
  } catch (error) {
    console.error("Error uploading to ImageKit DETAILS:", JSON.stringify(error, null, 2));
    console.warn("Falling back to base64 data URI because ImageKit failed.");
    
    const base64Data = Buffer.isBuffer(fileBuffer) ? fileBuffer.toString('base64') : Buffer.from(fileBuffer).toString('base64');
    let mimeType = 'image/jpeg';
    if (fileName && fileName.endsWith('.png')) mimeType = 'image/png';
    else if (fileName && fileName.endsWith('.gif')) mimeType = 'image/gif';
    else if (fileName && fileName.endsWith('.webp')) mimeType = 'image/webp';
    else if (fileName && fileName.endsWith('.svg')) mimeType = 'image/svg+xml';
    
    return {
      url: `data:${mimeType};base64,${base64Data}`,
      fileId: `fallback-${Date.now()}`
    };
  }
};

export default imagekit;
