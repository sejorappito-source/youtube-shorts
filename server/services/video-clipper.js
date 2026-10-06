import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let openai;

function initializeOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
}

// Download YouTube video using yt-dlp
export async function downloadYouTubeVideo(videoUrl) {
  try {
    const videoPath = path.join(__dirname, '../output', `video_${Date.now()}.mp4`);

    // Ensure output directory exists
    if (!fs.existsSync(path.dirname(videoPath))) {
      fs.mkdirSync(path.dirname(videoPath), { recursive: true });
    }

    console.log(`📥 Downloading from YouTube: ${videoUrl}`);

    // Using ffmpeg to download from YouTube
    return new Promise((resolve, reject) => {
      ffmpeg(videoUrl)
        .output(videoPath)
        .on('end', () => {
          console.log(`✅ Video downloaded: ${videoPath}`);
          resolve(videoPath);
        })
        .on('error', (err) => {
          console.error('Download error:', err);
          reject(err);
        })
        .run();
    });
  } catch (err) {
    console.error('YouTube download error:', err);
    throw err;
  }
}

// Extract audio from video
export async function extractAudio(videoPath) {
  try {
    const audioPath = videoPath.replace('.mp4', '_audio.mp3');

    console.log(`🎤 Extracting audio...`);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(audioPath)
        .audioCodec('libmp3lame')
        .audioChannels(2)
        .audioBitrate('192k')
        .on('end', () => {
          console.log(`✅ Audio extracted: ${audioPath}`);
          resolve(audioPath);
        })
        .on('error', (err) => {
          console.error('Audio extraction error:', err);
          reject(err);
        })
        .run();
    });
  } catch (err) {
    console.error('Extract audio error:', err);
    throw err;
  }
}

// Get video duration
export async function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) reject(err);
      resolve(metadata.format.duration);
    });
  });
}

// Analyze video and find highlight segments using AI
export async function analyzeHighlights(audioPath, transcript) {
  try {
    initializeOpenAI();

    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`🤖 Analyzing highlights...`);

    const prompt = `You are a video editing expert. Analyze this transcript and identify the TOP MOMENTS for YouTube Shorts (15-60 seconds each).

Transcript:
${transcript}

For each highlight, provide:
1. Start time (in seconds)
2. End time (in seconds)
3. Why it's interesting
4. Suggested title

Format as JSON array: [{"start": 0, "end": 30, "reason": "...", "title": "..."}]

Find 3-5 of the BEST moments that would make great Shorts.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content;

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse highlights from AI response');
    }

    const highlights = JSON.parse(jsonMatch[0]);
    console.log(`✅ Found ${highlights.length} highlights`);

    return highlights;
  } catch (err) {
    console.error('Highlight analysis error:', err);
    throw err;
  }
}

// Cut video into clips based on timestamps
export async function cutVideoClips(videoPath, highlights) {
  try {
    console.log(`✂️ Creating ${highlights.length} clips...`);

    const clips = [];

    for (let i = 0; i < highlights.length; i++) {
      const highlight = highlights[i];
      const clipPath = videoPath.replace('.mp4', `_clip_${i}.mp4`);

      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .setStartTime(highlight.start)
          .duration(highlight.end - highlight.start)
          .outputOptions([
            '-c:v libx264',
            '-c:a aac',
            '-pix_fmt yuv420p',
            '-vf scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2'
          ])
          .output(clipPath)
          .on('end', () => {
            console.log(`✅ Clip ${i + 1} created: ${clipPath}`);
            clips.push({
              path: clipPath,
              title: highlight.title,
              duration: highlight.end - highlight.start,
              reason: highlight.reason
            });
            resolve();
          })
          .on('error', (err) => {
            console.error(`Error creating clip ${i}:`, err);
            reject(err);
          })
          .run();
      });
    }

    return clips;
  } catch (err) {
    console.error('Video cutting error:', err);
    throw err;
  }
}

// Extract transcript from audio using Whisper (via OpenAI)
export async function transcribeAudio(audioPath) {
  try {
    initializeOpenAI();

    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`📝 Transcribing audio...`);

    const audioFile = fs.createReadStream(audioPath);

    const transcript = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile
    });

    console.log(`✅ Transcription complete`);
    return transcript.text;
  } catch (err) {
    console.error('Transcription error:', err);
    throw err;
  }
}

// Main: Process YouTube video into clips
export async function processYouTubeToClips(youtubeUrl) {
  try {
    console.log(`\n🎬 Starting YouTube to Shorts conversion...`);

    // Step 1: Download video
    const videoPath = await downloadYouTubeVideo(youtubeUrl);

    // Step 2: Extract audio
    const audioPath = await extractAudio(videoPath);

    // Step 3: Transcribe audio
    const transcript = await transcribeAudio(audioPath);
    console.log(`\n📄 Transcript:\n${transcript}\n`);

    // Step 4: Analyze highlights
    const highlights = await analyzeHighlights(audioPath, transcript);

    // Step 5: Cut clips
    const clips = await cutVideoClips(videoPath, highlights);

    console.log(`\n✅ Conversion complete! Created ${clips.length} Shorts`);

    return clips;
  } catch (err) {
    console.error('Processing error:', err);
    throw err;
  }
}

export default {
  downloadYouTubeVideo,
  extractAudio,
  getVideoDuration,
  analyzeHighlights,
  cutVideoClips,
  transcribeAudio,
  processYouTubeToClips
};
