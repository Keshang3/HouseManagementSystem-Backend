import User from "../models/user.model.js";
import Vendor from "../models/vendor.model.js";
import Booking from "../models/booking.model.js";
import { createAndEmitNotification } from "../controllers/notification.controller.js";

const calculateUserLevel = (points) => {
    if (points >= 7000) return "Platinum";
    if (points >= 3001) return "Gold";
    if (points >= 1001) return "Silver";
    return "Bronze";
};

export const rewardUser = async (userId, action) => {
    const pointsMap = {
        "LOGIN": 5,
        "COMPLETE_SERVICE": 30,
        "RATE": 5,
        "REVIEW": 10
    };

    const pointsToAdd = pointsMap[action] || 0;
    if (pointsToAdd === 0) return null;

    const user = await User.findById(userId);
    if (!user) return null;

    user.points += pointsToAdd;

    let actionText = "";
    switch(action) {
        case "LOGIN": actionText = "Daily Login"; break;
        case "COMPLETE_SERVICE": actionText = "completing a service"; break;
        case "RATE": actionText = "rating a service"; break;
        case "REVIEW": actionText = "writing a review"; break;
        default: actionText = action;
    }
    await createAndEmitNotification(userId, "User", `You earned ${pointsToAdd} points for ${actionText}!`, "SUCCESS");

    if (action === "COMPLETE_SERVICE") {
        user.completedBookings += 1;
    }
    if (action === "REVIEW") {
        user.reviewsGiven += 1;
    }

    const newLevel = calculateUserLevel(user.points);
    const levelChanged = newLevel !== user.level;
    
    if (levelChanged) {
        user.level = newLevel;
        await createAndEmitNotification(userId, "User", `Level Up! You are now a ${newLevel} member!`, "SUCCESS");
    }

    await user.save();
    return { user, pointsAdded: pointsToAdd, levelChanged, newLevel };
};

export const processDailyLogin = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return null;

    const now = new Date();
    const lastLogin = user.lastLoginDate;

    let rewardResult = null;
    let streakIncreased = false;

    if (!lastLogin) {
        // First time login
        user.streak = 1;
        user.lastLoginDate = now;
        await user.save();
        rewardResult = await rewardUser(userId, "LOGIN");
        streakIncreased = true;
    } else {
        const diffTime = Math.abs(now - new Date(lastLogin));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 1) {
            // New day
            if (diffDays === 1) {
                user.streak += 1;
                streakIncreased = true;
                
                // Streak bonuses
                if (user.streak === 3) {
                    user.points += 10;
                    await createAndEmitNotification(userId, "User", "3-Day Streak! +10 bonus points!", "SUCCESS");
                } else if (user.streak === 7) {
                    user.points += 20;
                    await createAndEmitNotification(userId, "User", "7-Day Streak! +20 bonus points!", "SUCCESS");
                }
            } else {
                // Missed a day
                user.streak = 1;
                streakIncreased = true;
            }
            user.lastLoginDate = now;
            await user.save();
            rewardResult = await rewardUser(userId, "LOGIN");
        }
    }

    return { user, rewardResult, streakIncreased };
};

export const getLeaderboard = async (type) => {
    // Only user leaderboard is supported now
    let users = await User.find()
        .select('fullName userName profileImage points level completedBookings')
        .sort({ points: -1 })
        .limit(10)
        .lean();
        
    // Fetch accurate booking count from DB
    for (let user of users) {
        const count = await Booking.countDocuments({ userId: user._id, status: "completed" });
        user.completedBookings = count;
    }
    return users;
};

export const getRewards = (type, badge) => {
    // Return dummy rewards for UI if needed
    return [];
};
