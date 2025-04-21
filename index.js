const express = require("express");
const cors = require("cors");
const multer = require("multer");
const XLSX = require("xlsx");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  engine: "gpt-3.5-turbo" // Especificando a versão correta
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Smart Biz Whisper API is running.");
});

app.post("/analyze", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const prompt = `Analyze the following business spreadsheet data and provide insights:\n\n${JSON.stringify(data).slice(0, 6000)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a business analyst." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const result = completion.choices[0].message.content;
    res.json({ summary: result });
  } catch (err) {
    console.error("Error analyzing file:", err);
    res.status(500).send("Internal Server Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
