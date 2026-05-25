import express from "express";
import authMiddleware from "../middlwares/auth.middleware.js";
import { getLeaderboard, getRewards } from "../services/gamification.service.js";
const router = express.Router();

router.get("/leaderboard/:type", async (req, res) => {
    try {
        const { type } = req.params;
        const leaderboard = await getLeaderboard(type);
        res.status(200).json({ leaderboard });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/rewards/:type/:badge", async (req, res) => {
    try {
        const { type, badge } = req.params;
        const rewards = getRewards(type, badge);
        res.status(200).json({ rewards });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});





export default router;
