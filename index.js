import express from "express";
import ytdlp from 'yt-dlp-exec';
import cors from "cors"

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.get('/info', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send({ error: 'Missing url query param' });

  try {
    const info = await ytdlp(url, { dumpSingleJson: true });
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
  } catch (err) {
    console.error('yt-dlp error:', err);
    res.status(500).json({ error: 'Failed to fetch video info' });
  }
});


app.get("/instainfo", async (req, res) => {
  const url = req.query.url;

  if (!url) return res.status(400).json({ error: "Missing Instagram URL" });

  try {
    const info = await ytdlp(url, { dumpSingleJson: true });

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
  } catch (err) {
    console.error("yt-dlp error:", err);
    res.status(500).json({ error: "Failed to fetch video info" });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
