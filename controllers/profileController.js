import { messages } from "@vinejs/vine/defaults";
import { generateRandomNum, imageValidator } from "../utils/helper.js";
import prisma from "../DB/db.config.js";

class ProfileController {
  static async index(req, res) {
    try {
      const user = req.user;
      return res.json({ status: 200, user });
    } catch (error) {
      return res.status(500).json({ messages: "Something went wrong!" });
    }
  }

  static async store() {}

  static async show() {}

  static async update(req, res) {
    try {
      const { id } = req.params;

      if (!req.files || Object.keys(req.files).length === 0) {
        return res
          .status(400)
          .json({ status: 400, messages: "Profile image is required" });
      }

      const profile = req.files.profile;
      const message = imageValidator(profile?.size, profile.mimetype);

      if (message !== null) {
        return res.status(400).json({
          errors: {
            profile: message,
          },
        });
      }

      const imgExt = profile?.name.split(".");
      if (imgExt.length < 2) {
        return res.status(400).json({
          errors: {
            profile: "Invalid image file name",
          },
        });
      }

      const imageName = generateRandomNum() + "." + imgExt[imgExt.length - 1];
      const uploadPath = process.cwd() + "/public/images/" + imageName;

      profile.mv(uploadPath, async (err) => {
        if (err) {
          console.error("Error moving the file:", err);
          return res
            .status(500)
            .json({ messages: "Error uploading the image" });
        }

        try {
          await prisma.users.update({
            data: { profile: imageName },
            where: { id: Number(id) },
          });

          return res.json({
            status: 200,
            messages: "Profile updated successfully",
          });
        } catch (updateError) {
          console.error("Error updating the user profile:", updateError);
          return res
            .status(500)
            .json({ messages: "Error updating the user profile" });
        }
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      return res.status(500).json({ messages: "Something went wrong!" });
    }
  }

  static async destroy() {}
}

export default ProfileController;
