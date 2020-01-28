require("dotenv").config();
const axios = require("axios").default;
const moment = require("moment");
const fs = require("fs");

const REDIRECT_URL = "https://baxley.dev";

const { ID, SECRET, FB_TOKEN } = process.env;

const b64PW = Buffer.from(`${ID}:${SECRET}`).toString("base64");

// Think this comes from the website?  I forget
const TEMP = "";

// Might be useful if this breaks
async function getInitialToken() {
  try {
    const res = await axios.post(
      `https://api.fitbit.com/oauth2/token?code=${TEMP}&grant_type=authorization_code&client_id=${ID}&redirect_uri=${REDIRECT_URL}`,
      {},
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${b64PW}`
        }
      }
    );
    console.log(res.data);
    return res.data;
  } catch (err) {
    console.error(err.response.status);
    console.error(err.response.statusText);
    console.error(err.response.data);
    process.exit(1);
  }
}

async function getTokenStuff(refreshToken) {
  try {
    const res = await axios.post(
      `https://api.fitbit.com/oauth2/token?grant_type=refresh_token&refresh_token=${refreshToken}`,
      {},
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${b64PW}`
        }
      }
    );
    return res.data;
  } catch (err) {
    console.error(err.response.status);
    console.error(err.response.statusText);
    console.error(err.response.data);
    process.exit(1);
  }
}

function getInstance(token, uid) {
  return axios.create({
    baseURL: `https://api.fitbit.com/1.2/user/${uid}/`,
    headers: { Authorization: `Bearer ${token}` }
  });
}

const refreshTokenURL = `https://rest-db-6f88a.firebaseio.com/fitbit/refresh_token.json?auth=${FB_TOKEN}`;

async function getRefreshToken() {
  try {
    const res = await axios.get(refreshTokenURL);
    return res.data;
  } catch (err) {
    console.error(err.response.status);
    console.error(err.response.statusText);
    console.error(err.response.data);
    process.exit(1);
  }
}

async function updateRefreshToken(token) {
  try {
    const res = await axios.put(refreshTokenURL, JSON.stringify(token));
  } catch (err) {
    console.error(err.response.status);
    console.error(err.response.statusText);
    console.error(err.response.data);
    process.exit(1);
  }
}

async function getSleepLogs(instance) {
  const end = moment()
    .add(1, "day")
    .format("YYYY-MM-DD");
  const start = "2019-10-22";
  try {
    const { data } = await instance.get(`sleep/date/${start}/${end}.json`);
    const summaries = data.sleep.map(s => ({
      date: s.dateOfSleep,
      summary: s.levels.summary
    }));
    if (!fs.existsSync("./src/data")) {
      fs.mkdirSync("./src/data");
    }
    fs.writeFileSync(
      "./src/data/sleep.json",
      JSON.stringify(summaries, null, 2)
    );
  } catch (err) {
    console.error(err.response.data);
  }
}

async function main() {
  // Might be useful to bootstrap if something breaks
  // const res = await getInitialToken();
  // process.exit();

  const lastToken = await getRefreshToken();
  const {
    access_token: token,
    user_id: uid,
    refresh_token
  } = await getTokenStuff(lastToken);
  await updateRefreshToken(refresh_token);
  const instance = getInstance(token, uid);
  await getSleepLogs(instance);
}

main()
  .then(() => console.log("done"))
  .catch(console.error);
