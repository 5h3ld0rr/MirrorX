import { Router, Request, Response } from "express";
import axios from "axios";

const router = Router();

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

export default router;
