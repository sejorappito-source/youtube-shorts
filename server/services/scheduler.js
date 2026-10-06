import schedule from 'node-schedule';
import { generateVideo, getRandomTip } from './video-generator.js';
import { uploadToYouTube } from './youtube-uploader.js';

const moneyTopics = [
  "The 50/30/20 budgeting rule explained",
  "How to start investing with $100",
  "Emergency fund: Your financial safety net",
  "Compound interest: Money working for you",
  "Passive income ideas for beginners",
  "How to negotiate your salary",
  "Cryptocurrency basics for beginners",
  "Real estate investment tips",
  "Stock market for beginners",
  "Paying off debt fast",
  "Retirement planning 101",
  "Tax optimization strategies",
  "Side hustles to earn extra money",
  "How to build wealth",
  "Financial independence secrets"
];

let scheduledJobs = [];

export async function scheduleVideos(frequency = 'daily', time = '09:00') {
  try {
    console.log(`⏰ Scheduling video generation: ${frequency} at ${time}`);

    let cronExpression;

    switch (frequency.toLowerCase()) {
      case 'hourly':
        cronExpression = '0 * * * *'; // Every hour
        break;
      case 'daily':
        cronExpression = `0 ${parseInt(time.split(':')[0])} * * *`; // Daily at specific time
        break;
      case 'weekly':
        cronExpression = `0 ${parseInt(time.split(':')[0])} * * 1`; // Every Monday
        break;
      case 'twice-daily':
        // 9 AM and 6 PM
        scheduleVideoGeneration('0 9 * * *');
        scheduleVideoGeneration('0 18 * * *');
        console.log('✅ Scheduled for 9 AM and 6 PM daily');
        return;
      default:
        cronExpression = '0 9 * * *'; // Default: 9 AM daily
    }

    scheduleVideoGeneration(cronExpression);
    console.log(`✅ Videos scheduled: ${frequency} (${cronExpression})`);
  } catch (err) {
    console.error('Schedule error:', err);
    throw err;
  }
}

function scheduleVideoGeneration(cronExpression) {
  const job = schedule.scheduleJob(cronExpression, async () => {
    try {
      console.log(`\n🎬 [${new Date().toISOString()}] Starting scheduled video generation...`);

      // Pick random topic
      const topic = moneyTopics[Math.floor(Math.random() * moneyTopics.length)];
      console.log(`📝 Topic: ${topic}`);

      // Generate video
      const videoPath = await generateVideo(topic, 60);
      console.log(`✅ Video generated: ${videoPath}`);

      // Upload to YouTube
      const title = `💰 ${topic}`;
      const description = `Quick money tip: ${topic}\n\n⏰ Subscribe for daily financial wisdom!\n\n#Money #Finance #Shorts #Investing`;
      const tags = ['money', 'finance', 'investing', 'tips', 'shorts', 'financial-literacy'];

      const result = await uploadToYouTube({
        videoPath,
        title,
        description,
        tags
      });

      console.log(`✅ [${new Date().toISOString()}] Video uploaded: ${result.url}`);

      // Log to file
      const logEntry = `[${new Date().toISOString()}] Generated: ${topic} -> ${result.url}\n`;
      console.log(logEntry);

    } catch (err) {
      console.error(`❌ Scheduled task error: ${err.message}`);
    }
  });

  scheduledJobs.push(job);
}

// Manually generate and upload video
export async function generateAndUploadNow(topic = null) {
  try {
    const selectedTopic = topic || moneyTopics[Math.floor(Math.random() * moneyTopics.length)];

    console.log(`\n🚀 Generating video immediately...`);
    console.log(`📝 Topic: ${selectedTopic}`);

    // Generate video
    const videoPath = await generateVideo(selectedTopic, 60);
    console.log(`✅ Video generated: ${videoPath}`);

    // Upload to YouTube
    const title = `💰 ${selectedTopic}`;
    const description = `Quick money tip: ${selectedTopic}\n\n⏰ Subscribe for daily financial wisdom!\n\n#Money #Finance #Shorts #Investing`;
    const tags = ['money', 'finance', 'investing', 'tips', 'shorts', 'financial-literacy'];

    const result = await uploadToYouTube({
      videoPath,
      title,
      description,
      tags
    });

    console.log(`\n✅ Video uploaded successfully!`);
    console.log(`🔗 Watch here: ${result.url}`);

    return result;
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}

// Stop all scheduled jobs
export function stopScheduler() {
  scheduledJobs.forEach(job => {
    job.cancel();
  });
  scheduledJobs = [];
  console.log('⏹️ All scheduled jobs stopped');
}

// Get scheduler status
export function getSchedulerStatus() {
  return {
    activeJobs: scheduledJobs.length,
    jobs: scheduledJobs.map(job => ({
      nextInvocation: job.nextInvocation()
    }))
  };
}

export default {
  scheduleVideos,
  generateAndUploadNow,
  stopScheduler,
  getSchedulerStatus
};
