import express from 'express';
import dotenv from 'dotenv';
import { generateVideo } from './services/video-generator.js';
import { uploadToYouTube } from './services/youtube-uploader.js';
import { scheduleVideos } from './services/scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Generate a video on demand
app.post('/api/generate', async (req, res) => {
  try {
    const { topic, duration = 60 } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic required' });
    }

    console.log(`🎬 Generating video for topic: ${topic}`);

    const videoPath = await generateVideo(topic, duration);

    res.json({
      success: true,
      videoPath,
      message: 'Video generated successfully'
    });
  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Upload video to YouTube
app.post('/api/upload', async (req, res) => {
  try {
    const { videoPath, title, description, tags } = req.body;

    if (!videoPath || !title) {
      return res.status(400).json({ error: 'Video path and title required' });
    }

    console.log(`📤 Uploading to YouTube: ${title}`);

    const result = await uploadToYouTube({
      videoPath,
      title,
      description,
      tags
    });

    res.json({
      success: true,
      videoId: result.id,
      url: result.url,
      message: 'Video uploaded successfully'
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Generate and upload in one call
app.post('/api/create-and-upload', async (req, res) => {
  try {
    const { topic, title, description, tags, duration = 60 } = req.body;

    if (!topic || !title) {
      return res.status(400).json({ error: 'Topic and title required' });
    }

    console.log(`🚀 Creating and uploading: ${title}`);

    // Generate video
    const videoPath = await generateVideo(topic, duration);

    // Upload to YouTube
    const result = await uploadToYouTube({
      videoPath,
      title,
      description: description || `Money tip: ${topic}`,
      tags: tags || ['money', 'finance', 'shorts', 'investing']
    });

    res.json({
      success: true,
      videoPath,
      videoId: result.id,
      url: result.url,
      message: 'Video created and uploaded successfully'
    });
  } catch (err) {
    console.error('Create and upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Schedule daily video generation
app.post('/api/schedule', async (req, res) => {
  try {
    const { frequency = 'daily', time = '09:00' } = req.body;

    console.log(`⏰ Scheduling videos: ${frequency} at ${time}`);

    await scheduleVideos(frequency, time);

    res.json({
      success: true,
      message: `Videos scheduled ${frequency} at ${time}`
    });
  } catch (err) {
    console.error('Schedule error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'YouTube Shorts Generator' });
});

app.listen(PORT, () => {
  console.log(`🎬 YouTube Shorts Generator running on http://localhost:${PORT}`);
  console.log(`📋 API Endpoints:`);
  console.log(`   POST /api/generate - Generate video`);
  console.log(`   POST /api/upload - Upload to YouTube`);
  console.log(`   POST /api/create-and-upload - Create & upload`);
  console.log(`   POST /api/schedule - Schedule videos`);
});
