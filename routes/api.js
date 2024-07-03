import { Router } from "express";
import AuthController from "../controllers/AuthController.js";
import authMiddleware from "../middleware/Authenticate.js";
import ProfileController from "../controllers/profileController.js";

const router = Router();

//* Authentication routes
router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);

//* profile routes
router.get("/profile", authMiddleware, ProfileController.index); //private route
router.put("/profile/:id", authMiddleware, ProfileController.update);

export default router;
