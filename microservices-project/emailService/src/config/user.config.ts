import axios from "axios";

const USER_SERVICE_URL = "http://user-service:3000";

export async function getUserEmail(userId:string) {
     try {
      const res = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`);
      return res.data.email;
  } catch (err) {
      console.error("Failed to fetch user email", err);
      throw err;
  }
}