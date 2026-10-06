import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const youtube = google.youtube({
  version: 'v3',
  auth: new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
);

let oauth2Client;

// Initialize OAuth2
export async function initializeYouTubeAuth() {
  oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Check if refresh token exists
  if (process.env.YOUTUBE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
    });
    console.log('✅ YouTube OAuth2 initialized');
  } else {
    console.log('⚠️ YouTube refresh token not found. Run auth flow first.');
  }

  return oauth2Client;
}

// Get authorization URL
export function getAuthUrl() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = ['https://www.googleapis.com/auth/youtube.upload'];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

  return authUrl;
}

// Handle OAuth2 callback
export async function handleAuthCallback(code) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('✅ YouTube authentication successful');
    console.log(`Refresh token: ${tokens.refresh_token}`);
    console.log('Add this to your .env file as YOUTUBE_REFRESH_TOKEN');

    return tokens;
  } catch (err) {
    console.error('Authentication error:', err);
    throw err;
  }
}

// Upload video to YouTube
export async function uploadToYouTube({
  videoPath,
  title,
  description,
  tags = [],
  categoryId = '22' // People & Blogs
}) {
  try {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    console.log(`📤 Uploading to YouTube: ${title}`);

    const fileSize = fs.statSync(videoPath).size;
    console.log(`File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    // Initialize auth if needed
    if (!oauth2Client) {
      await initializeYouTubeAuth();
    }

    const youtubeService = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    // Upload video
    const response = await youtubeService.videos.insert(
      {
        part: 'snippet,status',
        requestBody: {
          snippet: {
            title: title,
            description: description,
            tags: tags,
            categoryId: categoryId,
            defaultLanguage: 'en',
            defaultAudioLanguage: 'en'
          },
          status: {
            privacyStatus: 'public', // Can be 'public', 'unlisted', or 'private'
            madeForKids: false,
            selfDeclaredMadeForKids: false
          }
        },
        media: {
          body: fs.createReadStream(videoPath)
        }
      },
      {
        onUploadProgress: (evt) => {
          const progress = (evt.bytesRead / fileSize * 100).toFixed(2);
          console.log(`⏳ Upload progress: ${progress}%`);
        }
      }
    );

    const videoId = response.data.id;
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    console.log(`✅ Video uploaded successfully!`);
    console.log(`📹 Video ID: ${videoId}`);
    console.log(`🔗 URL: ${url}`);

    return {
      id: videoId,
      url: url,
      title: title,
      uploadedAt: new Date()
    };
  } catch (err) {
    console.error('Upload error:', err);
    throw err;
  }
}

// Get video analytics
export async function getVideoAnalytics(videoId) {
  try {
    if (!oauth2Client) {
      await initializeYouTubeAuth();
    }

    const youtubeAnalytics = google.youtubeAnalytics({
      version: 'v2',
      auth: oauth2Client
    });

    const response = await youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate: '2026-01-01',
      endDate: new Date().toISOString().split('T')[0],
      metrics: 'views,estimatedMinutesWatched,likes,dislikes,shares,subscribersGained',
      filters: `video==${videoId}`
    });

    return response.data.rows[0];
  } catch (err) {
    console.error('Analytics error:', err);
    throw err;
  }
}

// List uploaded videos
export async function getUploadedVideos(maxResults = 10) {
  try {
    if (!oauth2Client) {
      await initializeYouTubeAuth();
    }

    const youtubeService = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    const response = await youtubeService.search.list({
      part: 'snippet',
      forMine: true,
      maxResults: maxResults,
      order: 'date',
      type: 'video'
    });

    return response.data.items;
  } catch (err) {
    console.error('List videos error:', err);
    throw err;
  }
}

// Update video metadata
export async function updateVideoMetadata(videoId, updates) {
  try {
    if (!oauth2Client) {
      await initializeYouTubeAuth();
    }

    const youtubeService = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    const response = await youtubeService.videos.update({
      part: 'snippet',
      requestBody: {
        id: videoId,
        snippet: {
          title: updates.title || undefined,
          description: updates.description || undefined,
          tags: updates.tags || undefined,
          categoryId: updates.categoryId || '22'
        }
      }
    });

    console.log(`✅ Video metadata updated: ${videoId}`);
    return response.data;
  } catch (err) {
    console.error('Update error:', err);
    throw err;
  }
}

export default {
  initializeYouTubeAuth,
  getAuthUrl,
  handleAuthCallback,
  uploadToYouTube,
  getVideoAnalytics,
  getUploadedVideos,
  updateVideoMetadata
};
