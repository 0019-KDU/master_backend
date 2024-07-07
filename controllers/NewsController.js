import prisma from "../DB/db.config.js";
import NewsApiTransform from "../transform/newsApiTransform.js";
import { generateRandomNum, imageValidator } from "../utils/helper.js";
import { newsSchema } from "../validation/newsValidation.js";
import vine, { errors } from "@vinejs/vine";

class NewsController {
  static async index(req, res) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 1;

    if (page <= 0) {
      page = 1;
    }

    if (limit <= 0 || limit > 100) {
      limit = 10;
    }

    const skip = (page - 1) * limit;

    const news = await prisma.news.findMany({
      take: limit,
      skip: skip,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: true,
          },
        },
      },
    });
    const newsTransform = news?.map((item) => NewsApiTransform.transform(item));

    const totalNews = await prisma.news.count();
    const totalPages = Math.ceil(totalNews / limit);
    return res.json({
      status: 200,
      news: newsTransform,
      metadata: {
        totalPages,
        currentPage: page,
        currentLimit: limit,
      },
    });
  }

  static async store(req, res) {
    try {
      const user = req.user;
      const body = req.body;
      const validator = vine.compile(newsSchema);
      const payload = await validator.validate(body);

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
          errors: {
            image: "Image field is required",
          },
        });
      }
      const image = req.files?.image;
      //*Image Custome validator
      const message = imageValidator(image?.size, image?.mimetype);
      if (message !== null) {
        return res.status(400).json({
          errors: {
            image: message,
          },
        });
      }
      //*Image upload
      const imgExt = image?.name.split(".");
      if (imgExt.length < 2) {
        return res.status(400).json({
          errors: {
            profile: "Invalid image file name",
          },
        });
      }

      const imageName = generateRandomNum() + "." + imgExt[imgExt.length - 1];
      const uploadPath = process.cwd() + "/public/images/" + imageName;

      image.mv(uploadPath, async (err) => {
        if (err) {
          console.error("Error moving the file:", err);
          return res
            .status(500)
            .json({ messages: "Error uploading the image" });
        }
      });
      payload.image = imageName;
      payload.user_id = user.id;

      const news = await prisma.news.create({
        data: payload,
      });

      return res.json({
        status: 200,
        messages: "News successfully created..!",
        news,
      });
    } catch (error) {
      console.log("The error is", error);
      if (error instanceof errors.E_VALIDATION_ERROR) {
        // console.log(error.messages);
        return res.status(400).json({ errors: error.messages });
      } else {
        return res.status(500).json({
          status: 500,
          message: "Something went wrong.Please try again.",
        });
      }
    }
  }

  static async update(req, res) {}

  static async show(req, res) {}

  static async destroy(req, res) {}
}

export default NewsController;
