const axios = require("axios");

const apiBaseUrl = (process.env.MYCLUB_API_BASE_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
const email = process.env.MYCLUB_TEST_EMAIL;
const password = process.env.MYCLUB_TEST_PASSWORD;

async function testLogin() {
  if (!email || !password) {
    console.error("Set MYCLUB_TEST_EMAIL and MYCLUB_TEST_PASSWORD before running this smoke check.");
    process.exitCode = 2;
    return;
  }

  try {
    const { data } = await axios.post(`${apiBaseUrl}/auth/login/`, { email, password }, { timeout: 10000 });
    if (!data.access || !data.refresh) {
      throw new Error("The API response did not contain both JWT tokens.");
    }
    console.log("Login endpoint returned access and refresh tokens.");
  } catch (error) {
    const status = error.response?.status;
    console.error(status ? `Login request failed (HTTP ${status}).` : "Login request failed before receiving an HTTP response.");
    process.exitCode = 1;
  }
}

testLogin();
