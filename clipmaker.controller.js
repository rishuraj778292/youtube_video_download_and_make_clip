
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const makeSingleClip = async (req, res) => {
    const { driveUrl, customText, startTime, endTime } = req.body;

    if (!driveUrl || !customText || !startTime || !endTime) {
        return res.status(400).send("Missing required fields");
    }

    if (customText.length > 90) {
        return res.status(400).send("Text is too long (max 90 chars)");
    }

    const match = driveUrl.match(/[-\w]{25,}/);
    if (!match) return res.status(400).send("Invalid Google Drive URL");

    const fileId = match[0];
    const downloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`;

    const clipsBase = path.join(__dirname, "clips");
    if (!fs.existsSync(clipsBase)) fs.mkdirSync(clipsBase);

    const rawVideoPath = path.join(clipsBase, `${uuidv4()}.mp4`);
    const writer = fs.createWriteStream(rawVideoPath);

    try {
        const response = await axios({
            url: downloadLink,
            method: "GET",
            responseType: "stream",
            timeout: 60000
        });

        await new Promise((resolve, reject) => {
            response.data.pipe(writer);
            writer.on("finish", resolve);
            writer.on("error", reject);
        });
    } catch (err) {
        console.error("Download error:", err);
        return res.status(500).send("Failed to download video");
    }

    const wrapText = (text, maxLen = 30) => {
        const words = text.split(" ");
        let result = "", line = "";
        for (const word of words) {
            if ((line + word).length <= maxLen) {
                line += word + " ";
            } else {
                result += line.trim() + "\n";
                line = word + " ";
            }
        }
        return result + line.trim();
    };

    const wrappedText = wrapText(customText);
    const logoPath = path.join(__dirname, "logo.png");
    const outputClipPath = path.join(clipsBase, `clip-${Date.now()}.mp4`);

    const timetoSecond = (time) => {
        const parts = time.split(":").map(Number);
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    };

    const duration = timetoSecond(endTime) - timetoSecond(startTime);
    if (duration <= 0) return res.status(400).send("Invalid time range");

    const safeTextFilePath = path.join(clipsBase, "text.txt");
    fs.writeFileSync(safeTextFilePath, wrappedText);
    const escapedTextFilePath = safeTextFilePath.replace(/\\/g, "\\\\").replace(/:/g, "\\:");

    const ffmpegCmd = `ffmpeg -ss ${startTime} -t ${duration} -i "${rawVideoPath}" -i "${logoPath}" -filter_complex "[0:v]scale=720:-1[vid]; color=color=black:size=720x1280:d=${duration}[bg]; [bg][vid]overlay=(W-w)/2:(H-h)/2[video_on_bg]; [video_on_bg][1:v]overlay=(W-w)/2:60[with_logo]; [with_logo]drawtext=textfile='${escapedTextFilePath}':fontcolor=white:fontsize=30:x=(w-text_w)/2+20:y=200:box=1:boxcolor=black@0.5:boxborderw=10[outv]" -map "[outv]" -map 0:a? -y "${outputClipPath}"`;

    exec(ffmpegCmd, (err, stdout, stderr) => {
        fs.unlinkSync(safeTextFilePath);
        fs.unlinkSync(rawVideoPath);

        if (err) {
            console.error("FFmpeg error:", stderr);
            return res.status(500).send("Failed to generate clip");
        }

        res.sendFile(outputClipPath, () => {
            fs.unlinkSync(outputClipPath); // Clean up after sending
        });
    });
};

export default makeSingleClip;
