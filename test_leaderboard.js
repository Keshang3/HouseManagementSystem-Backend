import axios from "axios";

async function run() {
  try {
    const res = await axios.get("http://localhost:8000/api/gamification/leaderboard/user");
    console.log("Response:", res.data);
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
