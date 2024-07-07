import { supportedMimes } from "../config/filesystem.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

export const imageValidator = (size, mime) => {
  if (bytesToMb(size) > 2) {
    return "Image size must be less than 2 MB";
  } else if (!supportedMimes.includes(mime)) {
    return "Image must be type of png,jpg,jpeg,svg,webp,gif....";
  }

  return null;
};

export const bytesToMb = (bytes) => {
  return (bytes / 1024 / 1024).toFixed(2);
};

export const generateRandomNum = () => {
  return uuidv4();
};

export const getImageUrl = (imgName) => {
  return `${process.env.APP_URL}/images/${imgName}`;
};

export const removeImage = (imgName) => {
  const path = process.cwd() + "/public/images/" + imgName;

  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
    console.log("Image deleted successfully");
  }
};

export const uploadImage = (imgName) => {
  const imgExt = imgName?.name.split(".");
  if (imgExt.length < 2) {
    return res.status(400).json({
      errors: {
        profile: "Invalid image file name",
      },
    });
  }

  const imageName = generateRandomNum() + "." + imgExt[imgExt.length - 1];
  const uploadPath = process.cwd() + "/public/images/" + imageName;

  imgName.mv(uploadPath, async (err) => {
    if (err) {
      console.error("Error moving the file:", err);
      return res.status(500).json({ messages: "Error uploading the image" });
    }
  });

  return imageName;
};
