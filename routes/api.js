import { Router } from "express";
import AuthController from "../controllers/AuthController.js";
import authMiddleware from "../middleware/Authenticate.js";
import ProfileController from "../controllers/profileController.js";
import NewsController from "../controllers/NewsController.js";
import redisCache from "../DB/redis.config.js";

const router = Router();

//* Authentication routes
router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);

//* profile routes
router.get("/profile", authMiddleware, ProfileController.index); //private route
router.put("/profile/:id", authMiddleware, ProfileController.update);

//* News Routes
router.get("/news", redisCache.route(), NewsController.index);
router.post("/news", authMiddleware, NewsController.store);
router.get("/news/:id", NewsController.show);
router.put("/news/:id", authMiddleware, NewsController.update);
router.delete("/news/:id", authMiddleware, NewsController.destroy);

export default router;
