import express from "express";
import { exec } from "child_process";
import cors from "cors"

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.get('/info', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send({ error: 'Missing url query param' });
  exec(`yt-dlp -j "${url}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('yt-dlp error:', stderr);
      return res.status(500).send({ error: 'Failed to fetch video info' });
    }

    try {
      const info = JSON.parse(stdout);
      const filteredFormats = info.formats.filter(f =>
        f.acodec !== 'none'
      );
      const videoInfo = {
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        uploader: info.uploader,
        formats: filteredFormats.map(f => ({
          itag: f.format_id,
          ext: f.ext,
          resolution: f.resolution || `${f.width || ''}x${f.height || ''}`,
          filesize: f.filesize,
          format_note: f.format_note,
          acodec: f.acodec,
          vcodec: f.vcodec,
          url: f.url
        }))
      };

      res.json(videoInfo);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr);
      res.status(500).send({ error: 'Failed to parse video info' });
    }
  });
});

app.get("/instainfo", (req, res) => {
  const url = req.query.url;

  if (!url) return res.status(400).json({ error: "Missing Instagram URL" });

  exec(`yt-dlp -j "${url}"`, (err, stdout, stderr) => {
    if (err) {
      console.error("yt-dlp error:", stderr);
      return res.status(500).json({ error: "Failed to fetch video info" });
    }

    try {
      const info = JSON.parse(stdout);

      // Filter formats with audio
      const formatsWithAudio = info.formats.filter(
        f => f.acodec !== "none" && f.vcodec !== "none"
      ).map(f => ({
        itag: f.format_id,
        ext: f.ext,
        resolution: f.resolution || `${f.width || 0}x${f.height || 0}`,
        filesize: f.filesize,
        format_note: f.format_note,
        url: f.url
      }));

      const result = {
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        formats: formatsWithAudio
      };

      res.json(result);
    } catch (e) {
      console.error("Parse error:", e);
      res.status(500).json({ error: "Failed to parse video info" });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});