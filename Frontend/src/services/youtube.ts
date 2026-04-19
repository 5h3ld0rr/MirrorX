import axios from 'axios';

const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  viewCount?: string;
  duration?: string;
}

const youtubeApi = axios.create({
  baseURL: BASE_URL,
  params: {
    key: API_KEY,
  },
});

export const youtubeService = {
  async searchVideos(query: string, maxResults = 12): Promise<YouTubeVideo[]> {
    try {
      const response = await youtubeApi.get('/search', {
        params: {
          q: query,
          part: 'snippet',
          type: 'video',
          maxResults,
        },
      });

      return response.data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      }));
    } catch (error) {
      console.error('Error searching YouTube videos:', error);
      return [];
    }
  },

  async getTrendingMusic(maxResults = 12): Promise<YouTubeVideo[]> {
    try {
      const response = await youtubeApi.get('/videos', {
        params: {
          chart: 'mostPopular',
          part: 'snippet,statistics,contentDetails',
          videoCategoryId: '10', // Music
          maxResults,
        },
      });

      return response.data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        viewCount: item.statistics.viewCount,
        duration: item.contentDetails.duration,
      }));
    } catch (error) {
      console.error('Error fetching trending music:', error);
      return [];
    }
  },

  async getTrendingVideos(maxResults = 12): Promise<YouTubeVideo[]> {
    try {
      const response = await youtubeApi.get('/videos', {
        params: {
          chart: 'mostPopular',
          part: 'snippet,statistics,contentDetails',
          maxResults,
        },
      });

      return response.data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        viewCount: item.statistics.viewCount,
        duration: item.contentDetails.duration,
      }));
    } catch (error) {
      console.error('Error fetching trending videos:', error);
      return [];
    }
  },

  async searchMusic(query: string, maxResults = 20): Promise<YouTubeVideo[]> {
    try {
      const response = await youtubeApi.get('/search', {
        params: {
          q: query,
          part: 'snippet',
          type: 'video',
          videoCategoryId: '10', // Music category
          maxResults,
        },
      });

      return response.data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      }));
    } catch (error) {
      console.error('Error searching YouTube music:', error);
      return [];
    }
  },

  async getRelatedVideos(videoId: string, maxResults = 10): Promise<YouTubeVideo[]> {
    try {
      const response = await youtubeApi.get('/search', {
        params: {
          relatedToVideoId: videoId,
          part: 'snippet',
          type: 'video',
          maxResults,
        },
      });

      return response.data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      }));
    } catch (error) {
      console.error('Error fetching related videos:', error);
      return [];
    }
  },
};
