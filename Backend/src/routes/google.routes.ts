import { Router, Request, Response } from "express";
import axios from "axios";

const router = Router();
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Proxy for Google Calendar API to avoid CORS issues.
 * Stabilizing the MirrorX Enterprise Gateway for regional holidays.
 */
router.get("/calendar/v3/calendars/:calendarId/events", async (req: Request, res: Response) => {
  try {
    const { calendarId } = req.params;
    const { key, timeMin, timeMax, singleEvents } = req.query;

    const response = await axios.get(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId as string)}/events`,
      {
        params: {
          key: key as any,
          timeMin: timeMin as any,
          timeMax: timeMax as any,
          singleEvents: singleEvents as any,
          maxResults: 250
        }
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error("❌ Google Calendar Proxy Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to proxy Google Calendar" });
  }
});

/**
 * Proxy for YouTube Data API v3.
 * Supports searching and fetching trending music metadata.
 */
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
