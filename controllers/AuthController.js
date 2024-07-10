import prisma from "../DB/db.config.js";
import vine, { errors } from "@vinejs/vine";
import { registerSchema, loginSchema } from "../validation/authValidation.js";
import bcrypt from "bcryptjs";
import { messages } from "@vinejs/vine/defaults";
import jwt from "jsonwebtoken";
import { sendEmail } from "../config/mailer.js";
import logger from "../config/logger.js";
import { emailQueue, emailQueueName } from "../jobs/SendEmailJobs.js";

class AuthController {
  static async register(req, res) {
    try {
      const body = req.body;
      const validator = vine.compile(registerSchema);
      const payload = await validator.validate(body);

      //* check if email exists
      const findUser = await prisma.users.findUnique({
        where: { email: payload.email },
      });

      if (findUser) {
        return res.status(400).json({ errors: ["Email already exists"] });
      }

      //*Encrypt the password
      const salt = bcrypt.genSaltSync(10);
      payload.password = bcrypt.hashSync(payload.password, salt);

      const user = await prisma.users.create({
        data: payload,
      });

      return res.json({
        status: 200,
        messages: "user created successfully",
        user,
      });
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        // console.log(error.messages);'
        return res.status(400).json({ errors: error.messages });
      } else {
        return res
          .status(500)
          .json({ status: 500, message: "Something went wrong.pls try again" });
      }
    }
  }

  static async login(req, res) {
    try {
      const body = req.body;
      const validator = vine.compile(loginSchema);
      const payload = await validator.validate(body);

      //   * Find user with email
      const findUser = await prisma.users.findUnique({
        where: {
          email: payload.email,
        },
      });

      if (findUser) {
        if (!bcrypt.compareSync(payload.password, findUser.password)) {
          return res.status(400).json({
            errors: {
              email: "Invalid Credentials.",
            },
          });
        }

        // * Issue token to user
        const payloadData = {
          id: findUser.id,
          name: findUser.name,
          email: findUser.email,
          profile: findUser.profile,
        };
        const token = jwt.sign(payloadData, process.env.JWT_SECRET, {
          expiresIn: "365d",
        });

        return res.json({
          message: "Logged in",
          access_token: `Bearer ${token}`,
        });
      }

      return res.status(400).json({
        errors: {
          email: "No user found with this email.",
        },
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

  // * Send  Test Email
  static async sendTestEmail(req, res) {
    try {
      const { email } = req.query;

      const payloads = [
        {
          toEmail: email,
          subject: "Test Email 1",
          body: "<h1>Hello, This is test email 1.</h1>",
        },
        {
          toEmail: email,
          subject: "Test Email 2",
          body: "<h1>Hello, This is test email 2.</h1>",
        },
        {
          toEmail: email,
          subject: "Test Email 3",
          body: "<h1>Hello, This is test email 3.</h1>",
        },
        {
          toEmail: email,
          subject: "Test Email 4",
          body: "<h1>Hello, This is test email 4.</h1>",
        },
        {
          toEmail: email,
          subject: "Test Email 5",
          body: "<h1>Hello, This is test email 5.</h1>",
        },
      ];

      await emailQueue.add(emailQueueName, payload);
      // await sendEmail(payload.toEmail, payload.subject, payload.body);

      return res.json({ status: 200, messages: "Email sent successfully!" });
    } catch (error) {
      logger.error({ type: "Email Error", body: error });
      return res
        .status(500)
        .json({ messages: "Something went wrong. Please try again later" });
    }
  }
}

export default AuthController;
