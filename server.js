import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// ENV variables
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// ===============================
// 🔐 Webhook Verification (GET)
// ===============================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Webhook verify request");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified ✅");
    return res.status(200).send(challenge);
  } else {
    console.log("Webhook verification failed ❌");
    return res.sendStatus(403);
  }
});

// ===============================
// 📩 Webhook Events (POST)
// ===============================
app.post("/webhook", async (req, res) => {
  const body = req.body;

  try {
    // Instagram events come under "entry"
    if (body.object) {
      for (const entry of body.entry) {
        for (const change of entry.changes || []) {
          const value = change.value;

          // 🔹 Handle Messages
          if (value.messages) {
            const message = value.messages[0];
            const senderId = message.from.id;
            const text = message.text?.toLowerCase();

            console.log("📩 Message:", text);

            handleMessage(senderId, text);
          }

          // 🔹 Handle Comments
          if (value.text && value.from) {
            const comment = value.text.toLowerCase();
            const userId = value.from.id;

            console.log("💬 Comment:", comment);

            if (comment.includes("price")) {
              await sendDM(userId, "Hey 😊 I sent you details in DM!");
            }
          }
        }
      }

      return res.sendStatus(200);
    }

    res.sendStatus(404);
  } catch (error) {
    console.error("Webhook Error:", error);
    res.sendStatus(500);
  }
});

// ===============================
// 🤖 Chat Logic
// ===============================
async function handleMessage(userId, text) {
  if (!text) return;

  if (text.includes("hi") || text.includes("hello")) {
    await sendDM(userId, "Hey 👋 Welcome!\nType:\n• price\n• product");
  } else if (text.includes("price")) {
    await sendDM(userId, "Our price starts from ₹499 💰");
  } else if (text.includes("product")) {
    await sendDM(userId, "Check this product 👉 https://yourlink.com");
  } else {
    await sendDM(userId, "Sorry 😅 I didn’t understand.\nType 'price' or 'product'");
  }
}

// ===============================
// 📤 Send DM Function
// ===============================
async function sendDM(userId, messageText) {
  try {
    const response = await axios.post(
      "https://graph.facebook.com/v18.0/me/messages",
      {
        recipient: { id: userId },
        message: { text: messageText }
      },
      {
        params: { access_token: EAANoClui0XMBRBcaeby7VkeR5Yaqsi10P2836WZAVATbZCwziZCVG3LXZCUOiULfZBPUSH9oWjmZBQvJh6Ddygc2IKNG3xoY36NiZBvaaY3rxauZBRvHDJT1zIJrkl2FmhJaNPe2TAIArPRzIHsJzWFOF7LuCaGEAueavZCQGdKqrFBfjG1VLyleZBmeI7QaSXGL6U6XVG6aCYZCfewCycD0g69pCicp4TMDUPNTIBLnsgZD }
      }
    );

    console.log("✅ Message sent:", response.data);
  } catch (error) {
    console.error("❌ Send DM Error:", error.response?.data || error.message);
  }
}

// ===============================
// 🔥 Subscribe App to Page (FIX)
// ===============================
app.get("/subscribe", async (req, res) => {
  try {
    const response = await axios.post(
      "https://graph.facebook.com/v18.0/1041070519095310/subscribed_apps",
      {},
      {
        params: {
          access_token: PAGE_ACCESS_TOKEN,
          subscribed_fields: "messages,comments,mentions"
        }
      }
    );

    console.log("✅ Subscription success");
    res.json(response.data);
  } catch (error) {
    console.error("❌ Subscription error:", error.response?.data || error.message);
    res.json(error.response?.data || error.message);
  }
});

// ===============================
// 🟢 Health Check Route
// ===============================
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ===============================
// 🚀 Start Server
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
