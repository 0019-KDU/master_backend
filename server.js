import express from "express";
import "dotenv/config";

const app = express();
import fileUpload from "express-fileupload";
import helmet from "helmet";
import cors from "cors";
const PORT = process.env.PORT || 8000;

//*Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(fileUpload());
app.use(helmet());
app.use(cors());

app.get("/", (req, res) => {
  return res.json({ message: "Hello, It's Working..." });
});

//*import routes
import ApiRoutes from "./routes/api.js";
app.use("/api", ApiRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
