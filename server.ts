import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support large base64 uploads from smartphones and high-res images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Ensure persistent uploads directory exists
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));
  app.use(express.static(path.join(process.cwd(), "public")));

  // API Routes FIRST
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      shop: "TECHFIX MOBILE REPAIRING SHOP",
      location: "Goalpara, Assam",
      contact: "+91 98642 45987"
    });
  });

  // Dedicated Server-side Shop Logo Upload Route (preserves transparent PNG background)
  app.post("/api/upload-logo", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64 || typeof imageBase64 !== "string") {
        return res.status(400).json({ success: false, error: "No image data provided" });
      }

      let buffer: Buffer;
      let ext = "png";

      const matches = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1].toLowerCase();
        if (mime.includes("svg")) ext = "svg";
        else if (mime.includes("webp")) ext = "webp";
        else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
        else ext = "png";
        buffer = Buffer.from(matches[2], "base64");
      } else {
        buffer = Buffer.from(imageBase64, "base64");
      }

      // Remove any existing older logo formats so new format is never shadowed
      try {
        const existingFiles = await fs.promises.readdir(uploadsDir);
        for (const file of existingFiles) {
          if (file.startsWith("techfix_shop_logo.")) {
            await fs.promises.unlink(path.join(uploadsDir, file)).catch(() => {});
          }
        }
      } catch (cleanErr) {}

      const targetPath = path.join(uploadsDir, `techfix_shop_logo.${ext}`);
      await fs.promises.writeFile(targetPath, buffer);

      // Also create permanent backups in public root and data directory
      try {
        const publicRootPath = path.join(process.cwd(), "public", `techfix_shop_logo.${ext}`);
        await fs.promises.writeFile(publicRootPath, buffer);
        const dataLogosDir = path.join(process.cwd(), "data", "logos");
        if (!fs.existsSync(dataLogosDir)) {
          fs.mkdirSync(dataLogosDir, { recursive: true });
        }
        await fs.promises.writeFile(path.join(dataLogosDir, `techfix_shop_logo.${ext}`), buffer);
      } catch (backupErr) {
        console.warn("Logo backup note:", backupErr);
      }

      const publicUrl = `/uploads/techfix_shop_logo.${ext}?v=${Date.now()}`;
      return res.json({ success: true, logoUrl: publicUrl });
    } catch (err: any) {
      console.error("Error in /api/upload-logo:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to save logo" });
    }
  });

  // Dedicated Server-side URL Logo Fetcher (bypasses browser CORS & extracts from image hosting links)
  app.post("/api/fetch-logo-url", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ success: false, error: "Valid image link is required" });
      }

      let targetUrl = url.trim();

      // 1. Google Drive direct export / thumbnail conversion
      const gDriveMatch = targetUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
      if (gDriveMatch && gDriveMatch[1]) {
        targetUrl = `https://lh3.googleusercontent.com/d/${gDriveMatch[1]}`;
      }

      // 2. Dropbox raw image
      if (targetUrl.includes("dropbox.com")) {
        targetUrl = targetUrl.replace(/\?dl=0$/, "").replace(/\?dl=1$/, "") + "?raw=1";
      }

      // 3. Imgur single image page
      const imgurMatch = targetUrl.match(/^https?:\/\/imgur\.com\/([a-zA-Z0-9]+)$/);
      if (imgurMatch && imgurMatch[1]) {
        targetUrl = `https://i.imgur.com/${imgurMatch[1]}.png`;
      }

      // Fetch with desktop headers to bypass anti-hotlink protections
      let response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "image/*,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        redirect: "follow"
      });

      if (!response.ok && gDriveMatch && gDriveMatch[1]) {
        // Fallback for Google Drive
        response = await fetch(`https://drive.google.com/uc?export=view&id=${gDriveMatch[1]}`);
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch link (HTTP ${response.status})`);
      }

      const contentType = response.headers.get("content-type") || "";

      // If user pasted a web page from Postimages or ImgBB or similar:
      if (contentType.includes("text/html")) {
        const html = await response.text();
        const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                        html.match(/<img[^>]*id=["']main-image["'][^>]*src=["']([^"']+)["']/i);

        if (ogMatch && ogMatch[1]) {
          let directImg = ogMatch[1];
          if (directImg.startsWith("//")) directImg = "https:" + directImg;
          const imgRes = await fetch(directImg, { headers: { "User-Agent": "Mozilla/5.0" } });
          if (imgRes.ok) {
            const arr = await imgRes.arrayBuffer();
            const buffer = Buffer.from(arr);
            const ct = imgRes.headers.get("content-type") || "image/png";
            const ext = ct.includes("svg") ? "svg" : ct.includes("webp") ? "webp" : ct.includes("jpeg") || ct.includes("jpg") ? "jpg" : "png";
            const mime = ct.split(";")[0].trim() || "image/png";
            const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
            const targetPath = path.join(uploadsDir, `techfix_shop_logo.${ext}`);
            await fs.promises.writeFile(targetPath, buffer);
            return res.json({ success: true, logoUrl: `/uploads/techfix_shop_logo.${ext}?v=${Date.now()}`, dataUrl });
          }
        }
        throw new Error("Could not find direct image in webpage link. Please provide direct image link.");
      }

      const arr = await response.arrayBuffer();
      const buffer = Buffer.from(arr);
      let ext = "png";
      if (contentType.includes("svg")) ext = "svg";
      else if (contentType.includes("webp")) ext = "webp";
      else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";

      const mime = contentType.split(";")[0].trim() || (ext === "svg" ? "image/svg+xml" : `image/${ext === "jpg" ? "jpeg" : ext}`);
      const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
      const targetPath = path.join(uploadsDir, `techfix_shop_logo.${ext}`);
      await fs.promises.writeFile(targetPath, buffer);

      return res.json({ success: true, logoUrl: `/uploads/techfix_shop_logo.${ext}?v=${Date.now()}`, dataUrl });
    } catch (err: any) {
      console.error("Error in /api/fetch-logo-url:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to download image from link" });
    }
  });

  // Check currently uploaded logo on server (always returns the latest uploaded file)
  app.get("/api/logo", async (_req, res) => {
    try {
      const candidates: Array<{ url: string; mtime: number }> = [];

      // 1. Check uploads directory
      try {
        const upFiles = await fs.promises.readdir(uploadsDir);
        for (const f of upFiles) {
          if (f.startsWith("techfix_shop_logo.")) {
            const p = path.join(uploadsDir, f);
            const stat = fs.statSync(p);
            candidates.push({ url: `/uploads/${f}?v=${stat.mtimeMs}`, mtime: stat.mtimeMs });
          }
        }
      } catch (e) {}

      // 2. Check public directory
      try {
        const pubFiles = await fs.promises.readdir(path.join(process.cwd(), "public"));
        for (const f of pubFiles) {
          if (f.startsWith("techfix_shop_logo.")) {
            const p = path.join(process.cwd(), "public", f);
            const stat = fs.statSync(p);
            candidates.push({ url: `/${f}?v=${stat.mtimeMs}`, mtime: stat.mtimeMs });
          }
        }
      } catch (e) {}

      // 3. Check data/logos backup directory
      try {
        const dataLogos = path.join(process.cwd(), "data", "logos");
        if (fs.existsSync(dataLogos)) {
          const bFiles = await fs.promises.readdir(dataLogos);
          for (const f of bFiles) {
            if (f.startsWith("techfix_shop_logo.")) {
              const p = path.join(dataLogos, f);
              const stat = fs.statSync(p);
              // Ensure it's copied to uploads if missing
              const dest = path.join(uploadsDir, f);
              if (!fs.existsSync(dest)) {
                await fs.promises.copyFile(p, dest).catch(() => {});
              }
              candidates.push({ url: `/uploads/${f}?v=${stat.mtimeMs}`, mtime: stat.mtimeMs });
            }
          }
        }
      } catch (e) {}

      if (candidates.length > 0) {
        // Sort newest first
        candidates.sort((a, b) => b.mtime - a.mtime);
        return res.json({ success: true, logoUrl: candidates[0].url });
      }

      return res.json({ success: true, logoUrl: null });
    } catch (e: any) {
      return res.json({ success: false, logoUrl: null });
    }
  });

  // Delete uploaded logo completely across all server storage locations
  app.delete("/api/logo", async (_req, res) => {
    try {
      const exts = ["png", "webp", "svg", "jpg", "jpeg"];
      const directories = [
        uploadsDir,
        path.join(process.cwd(), "public"),
        path.join(process.cwd(), "public", "uploads"),
        path.join(process.cwd(), "data", "logos"),
        path.join(process.cwd(), "dist"),
        path.join(process.cwd(), "dist", "uploads")
      ];

      for (const dir of directories) {
        if (!fs.existsSync(dir)) continue;
        for (const ext of exts) {
          const filePath = path.join(dir, `techfix_shop_logo.${ext}`);
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) {}
          }
        }
      }

      // Also remove cached base64
      const base64File = path.join(process.cwd(), "data", "current_logo_base64.txt");
      if (fs.existsSync(base64File)) {
        try { fs.unlinkSync(base64File); } catch (e) {}
      }

      return res.json({ success: true, message: "Logo deleted successfully" });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });



  // Persistent JSON Storage directory for repair bookings and proposals
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const requestsFilePath = path.join(dataDir, "repair_requests.json");
  const proposalsFilePath = path.join(dataDir, "proposals.json");


  function readRepairRequestsFromDisk(): any[] {
    try {
      if (fs.existsSync(requestsFilePath)) {
        const raw = fs.readFileSync(requestsFilePath, "utf8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error reading repair_requests.json:", e);
    }
    return [];
  }

  function writeRepairRequestsToDisk(items: any[]) {
    try {
      fs.writeFileSync(requestsFilePath, JSON.stringify(items, null, 2), "utf8");
    } catch (e) {
      console.error("Error writing repair_requests.json:", e);
    }
  }

  function readProposalsFromDisk(): any[] {
    try {
      if (fs.existsSync(proposalsFilePath)) {
        const raw = fs.readFileSync(proposalsFilePath, "utf8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error reading proposals.json:", e);
    }
    return [];
  }

  function writeProposalsToDisk(items: any[]) {
    try {
      fs.writeFileSync(proposalsFilePath, JSON.stringify(items, null, 2), "utf8");
    } catch (e) {
      console.error("Error writing proposals.json:", e);
    }
  }

  // 1. GET /api/repair-requests - Fetch all persisted repair bookings
  app.get("/api/repair-requests", (_req, res) => {
    try {
      const requests = readRepairRequestsFromDisk();
      return res.json({ success: true, count: requests.length, requests });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message, requests: [] });
    }
  });

  // 2. POST /api/repair-requests - Save or bulk save customer repair booking(s)
  app.post("/api/repair-requests", (req, res) => {
    try {
      const body = req.body;
      const currentList = readRepairRequestsFromDisk();
      const map = new Map<string, any>();
      currentList.forEach(item => {
        const key = (item.requestId || item.id || '').toLowerCase();
        if (key) map.set(key, item);
      });

      const incomingItems = Array.isArray(body) ? body : [body];
      incomingItems.forEach(item => {
        if (!item) return;
        const key = (item.requestId || item.id || '').toLowerCase();
        if (key) {
          const existing = map.get(key) || {};
          map.set(key, { ...existing, ...item, updatedAtTimestamp: Date.now() });
        }
      });

      const updated = Array.from(map.values()).sort((a, b) => {
        const timeA = a.updatedAtTimestamp || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.updatedAtTimestamp || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });

      writeRepairRequestsToDisk(updated);
      return res.json({ success: true, count: updated.length, requests: updated });
    } catch (err: any) {
      console.error("POST /api/repair-requests error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. PATCH /api/repair-requests/:id - Update specific repair status or details
  app.patch("/api/repair-requests/:id", (req, res) => {
    try {
      const targetId = req.params.id.toLowerCase();
      const patchData = req.body;
      const currentList = readRepairRequestsFromDisk();
      let found = false;

      const updated = currentList.map(item => {
        const match = (item.id && item.id.toLowerCase() === targetId) ||
                      (item.requestId && item.requestId.toLowerCase() === targetId);
        if (match) {
          found = true;
          return { ...item, ...patchData, updatedAtTimestamp: Date.now() };
        }
        return item;
      });

      if (!found) {
        // If not found, add it
        updated.unshift({ ...patchData, id: req.params.id, updatedAtTimestamp: Date.now() });
      }

      writeRepairRequestsToDisk(updated);
      return res.json({ success: true, requests: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. DELETE /api/repair-requests/:id - Delete repair request
  app.delete("/api/repair-requests/:id", (req, res) => {
    try {
      const targetId = req.params.id.toLowerCase();
      const currentList = readRepairRequestsFromDisk();
      const filtered = currentList.filter(item => {
        return !((item.id && item.id.toLowerCase() === targetId) ||
                 (item.requestId && item.requestId.toLowerCase() === targetId));
      });
      writeRepairRequestsToDisk(filtered);
      return res.json({ success: true, count: filtered.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. GET /api/proposals - Fetch all persisted proposals
  app.get("/api/proposals", (_req, res) => {
    try {
      const proposals = readProposalsFromDisk();
      return res.json({ success: true, count: proposals.length, proposals });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message, proposals: [] });
    }
  });

  // 6. POST /api/proposals - Save or bulk save proposal(s)
  app.post("/api/proposals", (req, res) => {
    try {
      const body = req.body;
      const currentList = readProposalsFromDisk();
      const map = new Map<string, any>();
      currentList.forEach(item => {
        const key = (item.proposalNumber || item.id || '').toLowerCase();
        if (key) map.set(key, item);
      });

      const incomingItems = Array.isArray(body) ? body : [body];
      incomingItems.forEach(item => {
        if (!item) return;
        const key = (item.proposalNumber || item.id || '').toLowerCase();
        if (key) {
          const existing = map.get(key) || {};
          map.set(key, { ...existing, ...item, updatedAtTimestamp: Date.now() });
        }
      });

      const updated = Array.from(map.values());
      writeProposalsToDisk(updated);
      return res.json({ success: true, count: updated.length, proposals: updated });
    } catch (err: any) {
      console.error("POST /api/proposals error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. PATCH /api/proposals/:id - Update specific proposal
  app.patch("/api/proposals/:id", (req, res) => {
    try {
      const targetId = req.params.id.toLowerCase();
      const patchData = req.body;
      const currentList = readProposalsFromDisk();
      let found = false;

      const updated = currentList.map(item => {
        const match = (item.id && item.id.toLowerCase() === targetId) ||
                      (item.proposalNumber && item.proposalNumber.toLowerCase() === targetId);
        if (match) {
          found = true;
          return { ...item, ...patchData, updatedAtTimestamp: Date.now() };
        }
        return item;
      });

      if (!found) {
        updated.unshift({ ...patchData, id: req.params.id, updatedAtTimestamp: Date.now() });
      }

      writeProposalsToDisk(updated);
      return res.json({ success: true, proposals: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. DELETE /api/proposals/:id - Delete proposal
  app.delete("/api/proposals/:id", (req, res) => {
    try {
      const targetId = req.params.id.toLowerCase();
      const currentList = readProposalsFromDisk();
      const filtered = currentList.filter(item => {
        return !((item.id && item.id.toLowerCase() === targetId) ||
                 (item.proposalNumber && item.proposalNumber.toLowerCase() === targetId));
      });
      writeProposalsToDisk(filtered);
      return res.json({ success: true, count: filtered.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });





  // Server-side AI Mobile Diagnostics & Proposal Generator Route
  app.post("/api/ai/diagnose", async (req, res) => {
    try {
      const { deviceBrand, deviceModel, symptoms } = req.body;

      if (!deviceBrand || !deviceModel || !symptoms) {
        return res.status(400).json({ error: "Missing device parameters (brand, model, symptoms)." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback response if GEMINI_API_KEY is not set yet
        return res.json({
          primaryIssue: `${symptoms.slice(0, 50)}... - Hardware / Circuit Inspection Needed`,
          recommendedCategory: "Hardware",
          technicalAnalysis: `Based on customer report for ${deviceBrand} ${deviceModel}: "${symptoms}". Preliminary technician check indicates line continuity test, battery rail verification, and board inspection required.`,
          proposedLineItems: [
            {
              description: "Complete Physical & Multi-Meter Diagnostics",
              category: "Diagnosis",
              cost: 150,
              timeEstimate: "30 Mins",
              warrantyPeriod: "N/A"
            },
            {
              description: `Primary Repair / Module Replacement for ${deviceBrand} ${deviceModel}`,
              category: "Hardware",
              cost: 1200,
              timeEstimate: "1-2 Hours",
              warrantyPeriod: "90 Days"
            }
          ],
          estimatedHours: 2,
          estimatedDays: "Same Day",
          riskAssessment: "Standard repair procedure. Back up personal data if device powers on.",
          clientSummary: `TECHFIX senior technician will inspect the ${deviceBrand} ${deviceModel} for ${symptoms}. We will test all hardware rails and components before completing repair.`
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are a Senior Master Mobile Repair Technician & Proposal Estimator at TECHFIX MOBILE REPAIRING SHOP in Assam, India.
Analyze this mobile repair request:
- Device Brand: ${deviceBrand}
- Device Model: ${deviceModel}
- Reported Symptoms: ${symptoms}

Please produce an accurate, professional repair proposal analysis in JSON format.
Items pricing should be in Indian Rupees (₹ INR). Prices should reflect realistic repair costs in India (e.g. Display 1200-3500 INR, Software 300-800 INR, IC Repair 800-2000 INR, Battery 600-1400 INR, Charging Port 250-500 INR).

Return JSON matching this exact structure:
{
  "primaryIssue": "short headline of diagnosis",
  "recommendedCategory": "Hardware" | "Software" | "IC-Level" | "Parts & Accessories" | "Diagnosis",
  "technicalAnalysis": "technical explanation for technician and customer",
  "proposedLineItems": [
    {
      "description": "item service name",
      "category": "Hardware" | "Software" | "IC-Level" | "Parts & Accessories" | "Diagnosis",
      "cost": number_in_inr,
      "timeEstimate": "e.g. 1 Hour",
      "warrantyPeriod": "e.g. 90 Days"
    }
  ],
  "estimatedHours": number,
  "estimatedDays": "e.g. Same Day (3 Hours) or 1-2 Days",
  "riskAssessment": "risk factor or backup advice",
  "clientSummary": "reassuring customer-friendly proposal note"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              primaryIssue: { type: Type.STRING },
              recommendedCategory: { type: Type.STRING },
              technicalAnalysis: { type: Type.STRING },
              proposedLineItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                    cost: { type: Type.NUMBER },
                    timeEstimate: { type: Type.STRING },
                    warrantyPeriod: { type: Type.STRING }
                  },
                  required: ["description", "category", "cost", "timeEstimate", "warrantyPeriod"]
                }
              },
              estimatedHours: { type: Type.NUMBER },
              estimatedDays: { type: Type.STRING },
              riskAssessment: { type: Type.STRING },
              clientSummary: { type: Type.STRING }
            },
            required: [
              "primaryIssue",
              "recommendedCategory",
              "technicalAnalysis",
              "proposedLineItems",
              "estimatedHours",
              "estimatedDays",
              "riskAssessment",
              "clientSummary"
            ]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("No text returned from Gemini API");
      }

      const parsed = JSON.parse(resultText);
      return res.json(parsed);
    } catch (err: any) {
      console.error("AI Diagnosis Error:", err);
      return res.status(500).json({
        error: "Failed to generate AI proposal diagnosis.",
        details: err?.message || String(err)
      });
    }
  });

  // AI Client Proposal Summary Generator (Gemini 3.7)
  app.post("/api/ai/proposal-summary", async (req, res) => {
    try {
      const { clientName, deviceModel, items, totalCost } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          summary: `Dear ${clientName || "Valued Customer"}, TECHFIX MOBILE REPAIRING SHOP has prepared a comprehensive repair proposal for your ${deviceModel || "smartphone"}. Total estimated cost is ₹${totalCost || "0"} with quality testing and shop warranty included. "Your Mobile, Our Responsibility."`
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Write a 2-3 sentence polite, professional, and reassuring repair proposal letter for a client named ${clientName} who brought their ${deviceModel} to TECHFIX MOBILE REPAIRING SHOP. Total estimate is ₹${totalCost}. Proposed services: ${JSON.stringify(items)}. Emphasize genuine parts, pre-repair testing, and warranty guarantee. End with the shop slogan "Your Mobile, Our Responsibility."`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt
      });

      return res.json({ summary: response.text || "" });
    } catch (err: any) {
      console.error("Proposal summary error:", err);
      return res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  // AI Interactive Repair Assistant Chat Route (Gemini 3.7)
  app.post("/api/ai/assistant-chat", async (req, res) => {
    try {
      const { userQuery, deviceBrand, deviceModel } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          answer: `[TECHFIX AI Assistant - Powered by Gemini 3.7 (Offline Mode)]\nFor ${deviceBrand || "Smartphone"} ${deviceModel || ""}: "${userQuery}".\n\nPreliminary Assessment:\n• Line continuity test & battery voltage check recommended.\n• Estimated repair price range: ₹500 - ₹1,800 INR.\n• Estimated repair time: 1 to 3 hours.\n\nPlease visit TECHFIX shop at Dubapara Lupta Char, Goalpara for microscopic board analysis!`,
          estimatedCostRange: "₹500 - ₹1,800 INR",
          recommendedAction: "Micro-soldering inspection & Battery rail measurement",
          riskLevel: "Medium"
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemContext = `You are "TECHFIX AI Master Repair Assistant", an expert AI engineer powered by Google Gemini 3.7, specialized in Android smartphone hardware, IC micro-soldering (Charging IC, Power IC, Audio IC, Display Light IC, PMIC, CPU reballing), firmware flashing, eMMC/UFS troubleshooting, and shop estimations at TECHFIX MOBILE REPAIRING SHOP in Goalpara, Assam, India.

Respond with a well-formatted, friendly, highly technical yet understandable diagnosis for the user's issue. Include:
1. Probable Root Cause (e.g. short circuit on VBUS/VBAT rail, corroded flex, damaged display driver, bootloop from bad update).
2. Recommended Diagnostic Steps & Tools (e.g. DC power supply amperage test, digital microscope check, multi-meter diode mode testing).
3. Estimated Repair Cost Range in Indian Rupees (₹ INR).
4. Estimated Repair Duration & Risk Level.
5. Slogan: "Your Mobile, Our Responsibility."`;

      const fullPrompt = `${systemContext}\n\nDevice: ${deviceBrand || 'Android'} ${deviceModel || 'Smartphone'}\nUser/Customer Question or Symptom: "${userQuery}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: fullPrompt
      });

      return res.json({
        answer: response.text || "No response received.",
        deviceModel: `${deviceBrand} ${deviceModel}`.trim()
      });
    } catch (err: any) {
      console.error("AI Assistant Chat Error:", err);
      return res.status(500).json({ error: "Failed to process AI query", details: err?.message });
    }
  });

  // AI WhatsApp Customer Update Message Generator Route (Gemini 3.7)
  app.post("/api/ai/generate-whatsapp-msg", async (req, res) => {
    try {
      const { clientName, deviceModel, proposalNumber, status, finalPrice, language = "English" } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          message: `Hello ${clientName || "Customer"}, your ${deviceModel || "phone"} (${proposalNumber || "TECHFIX"}) status is updated to: *${status}*. Total repair amount: ₹${finalPrice}. Thank you for choosing TECHFIX MOBILE REPAIRING SHOP, Goalpara!`
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are a polite customer communication bot powered by Google Gemini 3.7 for TECHFIX MOBILE REPAIRING SHOP in Goalpara, Assam.
Generate a concise, well-formatted WhatsApp message to send to a customer in the requested language: ${language}.
Message details:
- Client Name: ${clientName}
- Device: ${deviceModel}
- Ticket/Proposal ID: ${proposalNumber}
- Current Repair Status: ${status}
- Final Amount: ₹${finalPrice}
- Shop Location: Dubapara Lupta Char, Goalpara, Assam
- Slogan: "Your Mobile, Our Responsibility."

Format with suitable WhatsApp bold formatting (*text*), clean bullet points, and appropriate emojis. Keep it under 100 words.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt
      });

      return res.json({ message: response.text || "" });
    } catch (err: any) {
      console.error("AI WhatsApp Msg Error:", err);
      return res.status(500).json({ error: "Failed to generate message" });
    }
  });

  // Dedicated Deep Circuit & Chip-Level Diagnostics endpoint (Gemini 3.7)
  app.post("/api/ai/circuit-diagnostics", async (req, res) => {
    try {
      const { deviceBrand, deviceModel, symptom, currentMeasurement, diodeReadings } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          circuitFault: "Power Management IC (PMIC) / Shorted VDD Main Rail",
          testPoints: ["VBUS 5.0V test point", "VBAT 3.8V-4.2V battery rail", "PMIC LDO outputs"],
          suggestedRemedy: "Inject 3.8V at 2.5A with thermal camera/rosin smoke to find hot capacitor.",
          safetyWarning: "Disconnect battery connector before applying heat to prevent cell thermal runaway."
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are a Senior Chip-Level Micro-Soldering Engineer using Google Gemini 3.7 at TECHFIX MOBILE REPAIRING SHOP.
Analyze this deep hardware circuit issue:
- Device: ${deviceBrand} ${deviceModel}
- Symptom: ${symptom}
- DC Power Supply Current Reading: ${currentMeasurement || 'Not specified'}
- Diode Mode / Multimeter Measurements: ${diodeReadings || 'Not specified'}

Provide a structured chip-level diagnosis in JSON format:
{
  "circuitFault": "Exact suspected component or rail (e.g. Buck Converter, PMIC, OVP IC, Short on VPH_PWR)",
  "testPoints": ["array of exact test points to probe"],
  "suggestedRemedy": "step by step micro-soldering instructions (reballing, jumper wire, flux temperature)",
  "safetyWarning": "critical safety caution for technician"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (err: any) {
      console.error("Circuit Diagnostics Error:", err);
      return res.status(500).json({ error: "Failed circuit diagnosis", details: err?.message });
    }
  });

  // AI Mobile IMEI OCR Scanner Route (Gemini 3.7)
  app.post("/api/ai/scan-imei", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing image data" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, '');

      if (!apiKey) {
        return res.status(503).json({ 
          error: "Gemini API key not configured on server", 
          fallback: true 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are an expert mobile hardware technician assistant powered by Google Gemini 3.7 at TECHFIX Mobile Repairing Shop.
Analyze this photo taken by the technician's camera.
The technician is pointing the camera at a smartphone screen showing *#06# IMEI popup (e.g. "IMEI1: 860586053685290", "IMEI2: 860586053685282", "MEID", "SN") OR a phone box barcode sticker OR phone back sticker.

Extract all IMEI numbers (standard mobile IMEIs are exactly 15 digits).
Return ONLY a valid JSON object matching this schema:
{
  "found": boolean,
  "imeis": string[],
  "primaryImei": string,
  "imei1": string,
  "imei2": string,
  "details": string
}
Do NOT return markdown backticks or any other text, only valid JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: cleanBase64
                }
              }
            ]
          }
        ]
      });

      const rawText = response.text || "{}";
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      let parsed = { found: false, imeis: [] as string[], primaryImei: "", imei1: "", imei2: "", details: "" };

      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e) {}
      }

      // Regex fallback check across full response
      const all15DigitMatches = rawText.match(/\b\d{15}\b/g) || [];
      if (all15DigitMatches.length > 0 && (!parsed.imeis || parsed.imeis.length === 0)) {
        parsed.found = true;
        parsed.imeis = Array.from(new Set(all15DigitMatches));
        parsed.primaryImei = parsed.imeis[0];
        parsed.imei1 = parsed.imeis[0];
        if (parsed.imeis[1]) parsed.imei2 = parsed.imeis[1];
      }

      return res.json(parsed);
    } catch (err: any) {
      console.error("AI IMEI Scan Error:", err);
      return res.status(500).json({ error: "Failed to scan IMEI", details: err?.message });
    }
  });

  // Vite middleware setup for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TECHFIX Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
