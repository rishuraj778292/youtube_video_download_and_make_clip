
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const makeSingleClip = async (req, res) => {
    const { driveUrl, customText, startTime, endTime, username, designation, clipName } = req.body;

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

    const splitTextIntoLines = (text, maxCharsPerLine = 30, maxLines = 3) => {
        const trimmedText = text.trim();
        const lines = [];

        let remainingText = trimmedText;

        for (let i = 0; i < maxLines; i++) {
            if (remainingText.length === 0) break;

            if (remainingText.length <= maxCharsPerLine) {
                // If remaining text fits in one line
                lines.push(remainingText);
                remainingText = '';
            } else {
                // Find the best place to break the line
                let cutIndex = maxCharsPerLine;

                // Try to cut at a space to avoid breaking words
                while (cutIndex > 0 && remainingText.charAt(cutIndex) !== ' ' && remainingText.charAt(cutIndex - 1) !== ' ') {
                    cutIndex--;
                }

                // If we couldn't find a good breaking point, just cut at the maximum length
                if (cutIndex === 0) {
                    cutIndex = maxCharsPerLine;
                } else if (remainingText.charAt(cutIndex) === ' ') {
                    // If we're cutting at a space, don't include the space in the output
                    cutIndex++;
                }

                lines.push(remainingText.substring(0, cutIndex).trim());
                remainingText = remainingText.substring(cutIndex).trim();
            }
        }

        // Pad remaining lines with empty strings
        while (lines.length < maxLines) {
            lines.push("");
        }

        return lines;
    }
    
    // Calculate appropriate font size based on text length
    const calculateFontSize = (text, defaultSize = 42, maxWidth = 600) => {
        // If text is very short, use default size
        if (!text || text.length <= 15) return defaultSize;
        
        // Scale down font size for longer text
        // This is a simple linear scale-down algorithm
        const estimatedWidth = text.length * (defaultSize * 0.5);  // Rough estimate of text width
        if (estimatedWidth <= maxWidth) return defaultSize;
        
        // Scale down proportionally if estimated width exceeds max width
        const newSize = Math.max(22, Math.floor(defaultSize * (maxWidth / estimatedWidth)));
        return newSize;
    };

    const [line1, line2, line3] = splitTextIntoLines(customText);

    const logoPath = path.join(__dirname, "logo.png");
    // Use clipName if provided, otherwise use timestamp
    const outputFileName = clipName ? `${clipName}.mp4` : `clip-${Date.now()}.mp4`;
    const outputClipPath = path.join(clipsBase, outputFileName);

    const timetoSecond = (time) => {
        const parts = time.split(":").map(Number);
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    };

    const duration = timetoSecond(endTime) - timetoSecond(startTime);
    if (duration <= 0) return res.status(400).send("Invalid time range");

    const escapeText = (text) => text ? text.replace(/'/g, "\\'") : "";

    // Get username and designation with defaults if not provided
    const usernameText = escapeText(username || "");
    const designationText = escapeText(designation || "");
    
    // Calculate font sizes based on text length
    const line1FontSize = calculateFontSize(line1);
    const line2FontSize = calculateFontSize(line2);
    const line3FontSize = calculateFontSize(line3);
    const usernameFontSize = calculateFontSize(usernameText, 35);
    const designationFontSize = calculateFontSize(designationText);
    

    
    // Use system serif font with explicit bold variant
    const ffmpegCmd = `ffmpeg -ss ${startTime} -t ${duration} -i "${rawVideoPath}" -i "${logoPath}" -filter_complex "\
[0:v]scale=720:-1[vid]; \
color=color=black:size=720x1280:d=${duration}[bg]; \
[bg][vid]overlay=(W-w)/2:(H-h)/2[video_on_bg]; \
[video_on_bg][1:v]overlay=(W-w)/2:60[with_logo]; \
[with_logo]drawtext=text='${escapeText(line1)}':fontfile=./ARIALBD.TTF:fontcolor=white:fontsize=${line1FontSize}:x=(w-text_w)/2:y=200:box=1:boxcolor=black@0.5:boxborderw=10[line1]; \
[line1]drawtext=text='${escapeText(line2)}':fontfile=./ARIALBD.TTF:fontcolor=white:fontsize=${line2FontSize}:x=(w-text_w)/2:y=250:box=1:boxcolor=black@0.5:boxborderw=10[line2]; \
[line2]drawtext=text='${escapeText(line3)}':fontfile=./ARIALBD.TTF:fontcolor=white:fontsize=${line3FontSize}:x=(w-text_w)/2:y=300:box=1:boxcolor=black@0.5:boxborderw=10[line3]; \
[line3]drawtext=text='${usernameText}':fontfile=./ARIALBD.TTF:fontcolor=white:fontsize=${usernameFontSize}:x=(w-text_w)/2:y=(h-300):box=1:boxcolor=black@0.5:boxborderw=10[username]; \
[username]drawtext=text='${designationText}':fontfile=./ARIALBD.TTF:fontcolor=#00e0ff:fontsize=${designationFontSize}:x=(w-text_w)/2:y=(h-250)+10:box=1:boxcolor=black@0.5:boxborderw=10[outv]\
" -map "[outv]" -map 0:a? -y "${outputClipPath}"`;

    exec(ffmpegCmd, (err, stdout, stderr) => {
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