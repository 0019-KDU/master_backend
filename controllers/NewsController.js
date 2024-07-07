import { messages } from "@vinejs/vine/defaults";
import prisma from "../DB/db.config.js";
import NewsApiTransform from "../transform/newsApiTransform.js";
import {
  generateRandomNum,
  imageValidator,
  removeImage,
  uploadImage,
} from "../utils/helper.js";
import { newsSchema } from "../validation/newsValidation.js";
import vine, { errors } from "@vinejs/vine";

class NewsController {
  static async index(req, res) {
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;

    // Ensure page is at least 1
    page = page > 0 ? page : 1;

    // Ensure limit is between 1 and 100
    limit = limit > 0 && limit <= 100 ? limit : 10;

    const skip = (page - 1) * limit;

    try {
      // Fetch paginated news
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

      // Transform news data if transformation function is defined
      const newsTransform =
        news?.map((item) => NewsApiTransform.transform(item)) || [];

      // Get total count of news items
      const totalNews = await prisma.news.count();
      const totalPages = Math.ceil(totalNews / limit);

      // Return the paginated response
      return res.json({
        status: 200,
        news: newsTransform,
        metadata: {
          totalPages,
          currentPage: page,
          currentLimit: limit,
        },
      });
    } catch (error) {
      // Handle any errors
      console.error(error);
      return res.status(500).json({
        status: 500,
        message: "An error occurred while fetching news.",
      });
    }
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

  static async update(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;
      const body = req.body;
      const news = await prisma.news.findUnique({
        where: {
          id: Number(id),
        },
      });

      if (!news) {
        return res.status(404).json({ message: "News not found" });
      }

      if (user.id !== news.user_id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const validator = vine.compile(newsSchema);
      const payload = await validator.validate(body);
      const image = req?.files?.image;

      if (image) {
        const message = imageValidator(image.size, image.mimetype);
        if (message !== null) {
          return res.status(400).json({
            errors: {
              image: message,
            },
          });
        }

        // * Upload new image
        const imageName = await uploadImage(image);
        payload.image = imageName;

        // * Delete old image
        if (news.image) {
          removeImage(news.image);
        }
      }

      await prisma.news.update({
        data: payload,
        where: {
          id: Number(id),
        },
      });

      return res.status(200).json({ message: "News updated successfully!" });
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

  static async show(req, res) {
    try {
      const { id } = req.params;

      // Validate the ID parameter
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ status: 400, message: "Invalid news ID" });
      }

      // Fetch the news item by ID
      const news = await prisma.news.findUnique({
        where: {
          id: Number(id),
        },
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

      // If news item not found, return 404
      if (!news) {
        return res
          .status(404)
          .json({ status: 404, message: "News item not found" });
      }

      // Transform the news item if necessary
      const transFormNews = NewsApiTransform.transform(news);

      // Return the transformed news item
      return res.json({ status: 200, news: transFormNews });
    } catch (error) {
      // Handle errors and return a 500 status code
      console.error(error);
      return res.status(500).json({
        status: 500,
        message: "Something went wrong, please try again",
      });
    }
  }

  static async destroy(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;
      const news = await prisma.news.findUnique({
        where: {
          id: Number(id),
        },
      });
      if (user.id !== news?.user_id) {
        return res.status(401).json({ message: "Un Authorized" });
      }

      // * Delete image from filesystem
      removeImage(news.image);
      await prisma.news.delete({
        where: {
          id: Number(id),
        },
      });
      return res.json({ message: "News deleted successfully!" });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Something went wrong.Please try again.",
      });
    }
  }
}

export default NewsController;
