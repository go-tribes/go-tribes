import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable-serverless";
import fs from "fs";
import path from "path";

// Import Google Vision
const vision = require("@google-cloud/vision");

const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(process.cwd(), "google-vision-key.json"),
});

export const config = {
  api: { bodyParser: false },
};

// Helper: extract hotel info (edit to fit your booking format)
function extractBookingInfo(text: string) {
  const nameMatch = text.match(/(Hotel|Accommodation)[\s:,-]*(.+)/i);
  const addrMatch = text.match(/(Address|Location)[\s:,-]*(.+)/i);
  const priceMatch = text.match(/(Total|Amount|Price)[\s:,-]*([£$RM]?\s*\d+(\.\d+)?)/i);

  return {
    hotelName: nameMatch?.[2]?.split('\n')[0]?.trim() || "",
    address: addrMatch?.[2]?.split('\n')[0]?.trim() || "",
    price: priceMatch?.[2]?.replace(/[^0-9.]/g, "") || "",
    rawText: text,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const form = new formidable.IncomingForm();
  form.uploadDir = path.join(process.cwd(), "tmp");
  form.keepExtensions = true;

  form.parse(req, async (err: any, fields, files) => {

    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ error: "Upload failed", detail: err.toString() });
    }

    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    let filePath = file.filepath || file.path;
    if (!filePath) {
      filePath = file[0]?.filepath || file[0]?.path;
    }
    if (!filePath) {
      return res.status(400).json({ error: "Cannot find uploaded file path" });
    }

    try {
      let text = "";
      const ext = path.extname(file.originalFilename || file.name).toLowerCase();

      if ([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(ext)) {
        const [result] = await client.textDetection(filePath);
        text = result.fullTextAnnotation ? result.fullTextAnnotation.text : "";
      } else {
        return res.status(400).json({ error: "Only image files supported for now. Please upload a screenshot/photo of your booking." });
      }

      fs.unlinkSync(filePath); // Clean up temp file

      const info = extractBookingInfo(text);
      return res.json({ success: true, data: info });
    } catch (err) {
      console.error('Processing failed:', err);
      return res.status(500).json({
        error: "Processing failed",
        detail: (err as any).toString(),
      });
    }
  });
}
