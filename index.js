const express = require("express");
const cors = require("cors");
const multer = require("multer");
const xlsx = require("xlsx");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

app.get("/", (req, res) => {
  res.send("Smart Biz Whisper API is running.");
});

app.post("/analyze", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  try {
    const prompt = `Analyze the following business spreadsheet data and give a summary with key insights:\n\n${JSON.stringify(data).slice(0, 2000)}`;

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({
      summary: completion.data.choices[0].message.content,
      rows: data.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing file");
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Server running on port ${port}`));