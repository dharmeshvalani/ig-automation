import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "snow123";
const PAGE_ACCESS_TOKEN = "YOUR_ACCESS_TOKEN";

/**
 * 🔹 Webhook Verification
 */
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

/**
 * 🔹 Webhook Listener
 */
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "instagram") {
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        const value = change.value;

        // MESSAGE
        if (value.messages) {
          const msg = value.messages[0];
          const senderId = msg.from.id;
          const text = msg.text?.toLowerCase();

          handleMessage(senderId, text);
        }

        // COMMENT
        if (value.text && value.from) {
          const comment = value.text.toLowerCase();
          const userId = value.from.id;

          if (comment.includes("price")) {
            sendDM(userId, "Check your DM 😊");
          }
        }
      }
    }
    return res.sendStatus(200);
  }
});

/**
 * 🤖 Chat Logic
 */
function handleMessage(userId, text) {
  if (!text) return;

  if (text.includes("hi")) {
    sendDM(userId, "Hey 👋 Type 'price' or 'product'");
  } else if (text.includes("price")) {
    sendDM(userId, "Price starts from ₹499");
  } else {
    sendDM(userId, "I didn't understand 😅");
  }
}

/**
 * 📤 Send DM
 */
async function sendDM(userId, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages`,
      {
        recipient: { id: userId },
        message: { text: message }
      },
      {
        params: { access_token: PAGE_ACCESS_TOKEN }
      }
    );
  } catch (err) {
    console.log(err.response?.data || err.message);
  }
}

app.listen(3000, () => console.log("Server running"));
