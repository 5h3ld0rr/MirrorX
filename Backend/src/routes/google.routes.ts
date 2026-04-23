import { Router } from 'express';
import axios from 'axios';

const router = Router();
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

// Proxy YouTube API requests to avoid CORS and hide KEY
// Supporting all sub-paths under v3
router.get('/youtube/v3/:endpoint', async (req, res) => {
  const { endpoint } = req.params;
  console.log(`[YouTube Proxy] Request to endpoint: ${endpoint}`, req.query);
  
  try {
    const response = await axios.get(`${YOUTUBE_API_URL}/${endpoint}`, {
      params: req.query,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MirrorX-Backend/1.0'
      }
    });
    
    console.log(`[YouTube Proxy] Success: ${endpoint}`);
    res.json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { error: 'Internal Server Error', message: error.message };
    
    console.error(`[YouTube Proxy] Error (${status}) on ${endpoint}:`, JSON.stringify(errorData));
    res.status(status).json(errorData);
  }
});

export default router;
