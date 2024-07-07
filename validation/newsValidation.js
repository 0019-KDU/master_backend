import vine from "@vinejs/vine";

import { CustomeErrorReporter } from "./CustomeErrorReporter.js";

vine.errorReporter = () => new CustomeErrorReporter();

export const newsSchema = vine.object({
  title: vine.string().minLength(5).maxLength(150),
  content: vine.string().minLength(10).maxLength(10000),
});
