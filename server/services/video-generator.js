import OpenAI from 'openai';
import { ElevenLabs } from 'elevenlabs';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let openai;
let elevenlabs;

function initializeClients() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  if (!elevenlabs) {
    elevenlabs = new ElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY
    });
  }
}

// Money/Finance tips database
const moneyTips = [
  "The 50/30/20 rule: Spend 50% on needs, 30% on wants, 20% on savings",
  "Start investing early. Even $100/month compounds into wealth over 30 years",
  "Emergency fund first: Save 3-6 months of expenses before investing",
  "Automate your savings. Out of sight, out of mind leads to consistent growth",
  "Track every expense for one month. You'll be shocked where money goes",
  "Compound interest is the eighth wonder of the world. Einstein said so",
  "Diversify your portfolio. Don't put all eggs in one basket",
  "Pay yourself first. Save before spending on anything else",
  "Negotiate everything: Salary, rent, bills. Most companies expect it",
  "Learn about taxes. Tax-efficient investing can double your wealth long-term"
];

export async function generateVideo(topic, duration = 60) {
  try {
    initializeClients();
    console.log(`📝 Generating script for: ${topic}`);

    // Step 1: Generate script using ChatGPT
    const script = await generateScript(topic);
    console.log(`✅ Script generated:\n${script}\n`);

    // Step 2: Generate voiceover using ElevenLabs
    console.log(`🎤 Generating voiceover...`);
    const audioPath = await generateVoiceover(script);
    console.log(`✅ Voiceover created: ${audioPath}`);

    // Step 3: Generate background image using DALL-E
    console.log(`🖼️ Generating background image...`);
    const imagePath = await generateBackgroundImage(topic);
    console.log(`✅ Background image created: ${imagePath}`);

    // Step 4: Combine into video using FFmpeg
    console.log(`🎬 Combining into video...`);
    const videoPath = await createVideo(imagePath, audioPath, script, duration);
    console.log(`✅ Video created: ${videoPath}`);

    return videoPath;
  } catch (err) {
    console.error('Video generation error:', err);
    throw err;
  }
}

async function generateScript(topic) {
  const prompt = `Create a short, engaging YouTube Shorts script (max 100 words) about: "${topic}".
Make it punchy, include a hook in the first 3 words, and end with a call-to-action.
Format: Just the script text, ready to read aloud.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 150,
    temperature: 0.7
  });

  return response.choices[0].message.content;
}

async function generateVoiceover(text) {
  try {
    const audioPath = path.join(__dirname, '../output/voiceover.mp3');

    // Ensure output directory exists
    if (!fs.existsSync(path.dirname(audioPath))) {
      fs.mkdirSync(path.dirname(audioPath), { recursive: true });
    }

    // Generate speech using ElevenLabs
    const response = await elevenlabs.textToSpeech({
      text: text,
      voiceId: 'Adam', // Professional male voice
      stability: 0.5,
      similarityBoost: 0.75
    });

    // Save audio
    fs.writeFileSync(audioPath, response);

    return audioPath;
  } catch (err) {
    console.error('Voiceover generation error:', err);
    throw err;
  }
}

async function generateBackgroundImage(topic) {
  try {
    const imagePath = path.join(__dirname, '../output/background.png');

    // Ensure output directory exists
    if (!fs.existsSync(path.dirname(imagePath))) {
      fs.mkdirSync(path.dirname(imagePath), { recursive: true });
    }

    // Generate image using DALL-E
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Professional YouTube Shorts background for topic: "${topic}".
      Modern, clean design. Text overlay space at top. 1080x1920 vertical format.
      Use bright colors, financial/money theme. Professional quality.`,
      n: 1,
      size: '1024x1024',
      quality: 'hd'
    });

    const imageUrl = response.data[0].url;

    // Download and save image
    const axios = (await import('axios')).default;
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });

    fs.writeFileSync(imagePath, imageResponse.data);

    // Resize to YouTube Shorts dimensions (1080x1920)
    await sharp(imagePath)
      .resize(1080, 1920, {
        fit: 'fill',
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      })
      .toFile(imagePath.replace('.png', '_resized.png'));

    return imagePath.replace('.png', '_resized.png');
  } catch (err) {
    console.error('Image generation error:', err);
    // Return a fallback placeholder image
    return await createPlaceholderImage(topic);
  }
}

async function createPlaceholderImage(topic) {
  const imagePath = path.join(__dirname, '../output/placeholder.png');

  // Create a simple placeholder image
  await sharp({
    create: {
      width: 1080,
      height: 1920,
      channels: 3,
      background: { r: 20, g: 40, b: 80 } // Dark blue background
    }
  })
    .composite([
      {
        input: Buffer.from(`<svg width="1080" height="1920">
          <text x="540" y="960" font-size="72" fill="white" text-anchor="middle" font-weight="bold">
            ${topic}
          </text>
        </svg>`),
        gravity: 'center'
      }
    ])
    .png()
    .toFile(imagePath);

  return imagePath;
}

async function createVideo(imagePath, audioPath, script, duration) {
  return new Promise((resolve, reject) => {
    const videoPath = path.join(__dirname, `../output/video_${Date.now()}.mp4`);

    // Ensure output directory exists
    if (!fs.existsSync(path.dirname(videoPath))) {
      fs.mkdirSync(path.dirname(videoPath), { recursive: true });
    }

    ffmpeg()
      .input(imagePath)
      .input(audioPath)
      .inputOptions('-loop 1')
      .outputOptions([
        '-c:v libx264',
        '-c:a aac',
        '-b:a 192k',
        '-shortest',
        '-pix_fmt yuv420p',
        `-vf scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2`
      ])
      .output(videoPath)
      .on('end', () => {
        console.log(`✅ Video created: ${videoPath}`);
        resolve(videoPath);
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .run();
  });
}

export async function getRandomTip() {
  return moneyTips[Math.floor(Math.random() * moneyTips.length)];
}
