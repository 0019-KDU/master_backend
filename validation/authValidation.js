import vine from "@vinejs/vine";
import { CustomeErrorReporter } from "./CustomeErrorReporter.js";

vine.errorReporter = () => new CustomeErrorReporter();

export const registerSchema = vine.object({
  name: vine.string().minLength(2).maxLength(150),
  email: vine.string().email(),
  password: vine.string().minLength(6).maxLength(150).confirmed(),
});

export const loginSchema = vine.object({
  email: vine.string().email(),
  password: vine.string(),
});
