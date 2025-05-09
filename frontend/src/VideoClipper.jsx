import React, { useState } from "react";
import axios from "axios";

const VideoClipper = () => {
  const [ytUrl, setYtUrl] = useState("");
  const [customText, setCustomText] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8800/makeclip",
        {
          ytUrl,
          customText,
          startTime,
          endTime,
        },
        {
          responseType: "blob", // Important: for file download
        }
      );

      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "clip.mp4");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Clip creation failed:", error);
      alert("Clip creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h2>Create YouTube Video Clip</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>YouTube URL:</label><br />
          <input
            type="text"
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Custom Text:</label><br />
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Start Time (HH:MM:SS):</label><br />
          <input
            type="text"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div>
          <label>End Time (HH:MM:SS):</label><br />
          <input
            type="text"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
        <br />
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Generate Clip"}
        </button>
      </form>
    </div>
  );
};

export default VideoClipper;
