import axios from 'axios';

const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const BASE_URL = '/api/google/youtube/v3';

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  viewCount?: string;
  duration?: string;
  channelId?: string;
}

interface YouTubeThumbnail {
  url: string;
}

interface YouTubeSnippet {
  title: string;
  thumbnails: {
    high?: YouTubeThumbnail;
    default?: YouTubeThumbnail;
  };
  channelTitle: string;
  channelId?: string;
  publishedAt: string;
}

interface YouTubeItem {
  id: string | { videoId: string };
  snippet: YouTubeSnippet;
  statistics?: { viewCount: string };
  contentDetails?: { duration: string };
}

const youtubeApi = axios.create({
  baseURL: BASE_URL,
  params: {
    key: API_KEY,
  },
});

export const youtubeService = {
  async enrichVideoDetails(videos: YouTubeVideo[]): Promise<YouTubeVideo[]> {
    if (!videos.length) return [];
    try {
      const ids = videos.map(v => v.id).join(',');
      const response = await youtubeApi.get('/videos', {
        params: {
          id: ids,
          part: 'statistics,contentDetails',
        },
      });

      const detailsMap: { [key: string]: any } = {};
      response.data.items?.forEach((item: any) => {
        detailsMap[item.id] = {
          viewCount: item.statistics?.viewCount,
          duration: item.contentDetails?.duration,
        };
      });

      return videos.map(v => ({
        ...v,
        viewCount: detailsMap[v.id]?.viewCount,
        duration: detailsMap[v.id]?.duration,
      }));
    } catch (error) {
      console.error('Error enriching video details:', error);
      return videos;
    }
  },

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

      const results = (response.data.items || []).map((item: YouTubeItem) => ({
        id: typeof item.id === 'string' ? item.id : item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || '',
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
      }));

      return await this.enrichVideoDetails(results);
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
          regionCode: 'LK',
          maxResults,
        },
      });

      return (response.data.items || []).map((item: YouTubeItem) => ({
        id: item.id as string,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || '',
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        viewCount: item.statistics?.viewCount,
        duration: item.contentDetails?.duration,
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
          regionCode: 'LK',
          maxResults,
        },
      });

      return (response.data.items || []).map((item: YouTubeItem) => ({
        id: item.id as string,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || '',
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
        viewCount: item.statistics?.viewCount,
        duration: item.contentDetails?.duration,
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

      const results = (response.data.items || []).map((item: YouTubeItem) => ({
        id: typeof item.id === 'string' ? item.id : item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || '',
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
      }));

      return await this.enrichVideoDetails(results);
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

      const results = (response.data.items || []).map((item: YouTubeItem) => ({
        id: typeof item.id === 'string' ? item.id : item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || '',
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
      }));

      return await this.enrichVideoDetails(results);
    } catch (error) {
      console.error('Error fetching related videos:', error);
      return [];
    }
  },

  async getChannelDetails(channelId: string) {
    try {
      const response = await youtubeApi.get('/channels', {
        params: {
          id: channelId,
          part: 'snippet,statistics',
        },
      });

      const item = response.data.items?.[0];
      if (!item) return null;

      return {
        avatar: item.snippet.thumbnails.default?.url || '',
        subscriberCount: item.statistics.subscriberCount,
      };
    } catch (error) {
      console.error('Error fetching channel details:', error);
      return null;
    }
  },

  async getChannelsAvatars(channelIds: string[]) {
    if (!channelIds.length) return {};
    try {
      const response = await youtubeApi.get('/channels', {
        params: {
          id: channelIds.join(','),
          part: 'snippet',
        },
      });

      const avatars: { [key: string]: string } = {};
      response.data.items?.forEach((item: any) => {
        avatars[item.id] = item.snippet.thumbnails.default?.url || '';
      });
      return avatars;
    } catch (error) {
      console.error('Error fetching channels avatars:', error);
      return {};
    }
  },
};
