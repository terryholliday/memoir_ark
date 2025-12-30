import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from './auth';

export const statsRoutes = Router();

// GET /api/stats - Get counts for dashboard
statsRoutes.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.authUser!.uid;
    const [
      eventsCount,
      chaptersCount,
      traumaCyclesCount,
      songsCount,
      personsCount,
      artifactsCount,
      synchronicitiesCount,
    ] = await Promise.all([
      prisma.event.count({ where: { userId } }),
      prisma.chapter.count({ where: { userId } }),
      prisma.traumaCycle.count({ where: { userId } }),
      prisma.song.count({ where: { userId } }),
      prisma.person.count({ where: { userId } }),
      prisma.artifact.count({ where: { userId } }),
      prisma.synchronicity.count({ where: { userId } }),
    ]);

    res.json({
      events: eventsCount,
      chapters: chaptersCount,
      traumaCycles: traumaCyclesCount,
      songs: songsCount,
      persons: personsCount,
      artifacts: artifactsCount,
      synchronicities: synchronicitiesCount,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
