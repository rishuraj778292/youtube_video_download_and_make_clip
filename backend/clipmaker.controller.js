import { exec } from "child_process";
import fs from "fs";
import path from "path";

const makeclips = (req, res) => {

    const { ytUrl, customText, startTime, endTime } = req.body;

    if (!ytUrl || !customText || !startTime || !endTime) {
        return res.status(400).send("Missing required fields");
    }

    if (customText.length > 90) {
        return res.status(400).send("Text is too large");
    }

    const timetoSecond = (time) => {
        const parts = time.split(':').map(Number);
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    };

    const duration = timetoSecond(endTime) - timetoSecond(startTime);
    if (duration <= 0) {
        return res.status(400).send("End time must be after start time");
    }
    function wrapText(text, maxLineLength = 30) {
        const words = text.split(' ');
        let wrappedText = '';
        let line = '';

        for (const word of words) {
            if ((line + word).length <= maxLineLength) {
                line += word + ' ';
            } else {
                wrappedText += line.trim() + '\n'; // real newline
                line = word + ' ';
            }
        }

        wrappedText += line.trim();
        return wrappedText;
    }

    const videoId = Date.now();
    const rawVideoPath = `clips/${videoId}.mp4`;
    const finalVideoPath = `clips/final-${videoId}.mp4`;
    const logoPath = "logo.png";
    const textFilePath = 'text.txt';
    const wrappedText = wrapText(customText);

    // Write to file
    fs.writeFileSync(textFilePath, wrappedText);


    const downloadCmd = `yt-dlp -f best -o "${rawVideoPath}" "${ytUrl}"`;

    exec(downloadCmd, (err) => {
        if (err) {
            console.error("Download failed:", err);
            return res.status(500).send("Video download failed");
        }

        

   const ffmpegCmd = `ffmpeg -ss ${startTime} -t ${duration} -i "${rawVideoPath}" -i "${logoPath}" -filter_complex "\
[0:v]scale=720:-1[vid]; \
color=color=black:size=720x1280:d=${duration}[bg]; \
[bg][vid]overlay=(W-w)/2:(H-h)/2 [video_on_bg]; \
[video_on_bg][1:v]overlay=(W-w)/2:60[with_logo]; \
[with_logo]drawtext=textfile='${textFilePath}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontcolor=white:fontsize=30:x=(w-text_w)/2:y=200:box=1:boxcolor=black@0.5:boxborderw=10[outv]" \
-map "[outv]" -map 0:a? -y "${finalVideoPath}"`;



        exec(ffmpegCmd, (err, stdout, stderr) => {
            if (err) {
                console.error("FFmpeg failed:", err);
                console.error("stderr:", stderr);
                return res.status(500).send("Video processing failed");
            }
            fs.unlink(textFilePath, (err) => {
                if (err) console.error('Error deleting text file:', err);
                else console.log('Temporary text file deleted.');
            });

            res.sendFile(path.resolve(finalVideoPath), () => {
                fs.unlinkSync(rawVideoPath);
                fs.unlinkSync(finalVideoPath); // optional
            });
        });
    });
};

export default makeclips;
