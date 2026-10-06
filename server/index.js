import express from 'express';
import dotenv from 'dotenv';
import { processYouTubeToClips } from './services/video-clipper.js';
import { uploadToYouTube, initializeYouTubeAuth } from './services/youtube-uploader.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'YouTube Shorts Clipper',
    status: 'running',
    version: '1.0.0',
    description: 'Convert long YouTube videos into AI-powered Shorts clips',
    endpoints: {
      health: 'GET /health',
      clipVideo: 'POST /api/clip-video',
      clipAndUpload: 'POST /api/clip-and-upload'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'YouTube Shorts Clipper' });
});

// Clip a YouTube video
app.post('/api/clip-video', async (req, res) => {
  try {
    const { youtubeUrl } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({ error: 'YouTube URL required' });
    }

    console.log(`🎬 Processing: ${youtubeUrl}`);

    const clips = await processYouTubeToClips(youtubeUrl);

    res.json({
      success: true,
      clipsCount: clips.length,
      clips: clips.map(clip => ({
        path: clip.path,
        title: clip.title,
        duration: clip.duration,
        reason: clip.reason
      })),
      message: `Created ${clips.length} Shorts clips`
    });
  } catch (err) {
    console.error('Clipping error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Clip and upload to YouTube
app.post('/api/clip-and-upload', async (req, res) => {
  try {
    const { youtubeUrl, channelName = 'Money Tips' } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({ error: 'YouTube URL required' });
    }

    console.log(`🚀 Clipping and uploading: ${youtubeUrl}`);

    // Initialize YouTube auth
    await initializeYouTubeAuth();

    // Process video to clips
    const clips = await processYouTubeToClips(youtubeUrl);

    // Upload each clip
    const uploads = [];
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      try {
        const result = await uploadToYouTube({
          videoPath: clip.path,
          title: `💰 ${clip.title}`,
          description: `Money tip from ${channelName}\n\n${clip.reason}\n\n#Shorts #Money #Finance`,
          tags: ['money', 'finance', 'shorts', 'tips', clip.title.toLowerCase()]
        });

        uploads.push({
          title: clip.title,
          videoId: result.id,
          url: result.url,
          status: 'uploaded'
        });

        console.log(`✅ Uploaded clip ${i + 1}: ${result.url}`);
      } catch (uploadErr) {
        console.error(`Failed to upload clip ${i + 1}:`, uploadErr.message);
        uploads.push({
          title: clip.title,
          status: 'failed',
          error: uploadErr.message
        });
      }
    }

    res.json({
      success: true,
      clipsCreated: clips.length,
      clipsUploaded: uploads.filter(u => u.status === 'uploaded').length,
      uploads: uploads,
      message: `Created and uploaded ${uploads.filter(u => u.status === 'uploaded').length}/${clips.length} Shorts`
    });
  } catch (err) {
    console.error('Clip and upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🎬 YouTube Shorts Clipper running on http://localhost:${PORT}`);
  console.log(`📋 API Endpoints:`);
  console.log(`   GET / - Service info`);
  console.log(`   GET /health - Health check`);
  console.log(`   POST /api/clip-video - Clip YouTube video`);
  console.log(`   POST /api/clip-and-upload - Clip and upload to YouTube`);
});
