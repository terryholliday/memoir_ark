import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from './auth';

export const narrativeRoutes = Router();

// GET /api/narrative/chapters - Get all chapters with their events for narrative view
narrativeRoutes.get('/chapters', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.authUser!.uid;
    const chapters = await prisma.chapter.findMany({
      where: { userId },
      include: {
        events: {
          where: { userId },
          include: {
            traumaCycle: true,
            personLinks: {
              include: { person: true },
            },
            songLinks: {
              include: { song: true },
            },
            artifactLinks: {
              include: { artifact: true },
            },
            synchronicityLinks: {
              include: { synchronicity: true },
            },
          },
          orderBy: { date: 'asc' },
        },
        _count: {
          select: { events: true },
        },
      },
      orderBy: { number: 'asc' },
    });

    const narrativeChapters = chapters.map((chapter) => ({
      id: chapter.id,
      number: chapter.number,
      title: chapter.title,
      summary: chapter.summary,
      yearsCovered: JSON.parse(chapter.yearsCovered),
      eventCount: chapter._count.events,
      events: chapter.events.map((event) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        location: event.location,
        summary: event.summary,
        emotionTags: JSON.parse(event.emotionTags),
        notes: event.notes,
        isKeystone: event.isKeystone,
        traumaCycle: event.traumaCycle,
        persons: event.personLinks.map((l) => l.person),
        songs: event.songLinks.map((l) => l.song),
        artifacts: event.artifactLinks.map((l) => l.artifact),
        synchronicities: event.synchronicityLinks.map((l) => l.synchronicity),
      })),
    }));

    res.json(narrativeChapters);
  } catch (error) {
    console.error('Error fetching narrative chapters:', error);
    res.status(500).json({ error: 'Failed to fetch narrative chapters' });
  }
});

// GET /api/narrative/chapters/:id - Get single chapter narrative view
narrativeRoutes.get('/chapters/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.authUser!.uid;
    const { id } = req.params;

    const chapter = await prisma.chapter.findUnique({
      where: { id, userId },
      include: {
        events: {
          where: { userId },
          include: {
            traumaCycle: true,
            personLinks: {
              include: { person: true },
            },
            songLinks: {
              include: { song: true },
            },
            artifactLinks: {
              include: { artifact: true },
            },
            synchronicityLinks: {
              include: { synchronicity: true },
            },
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    // Get adjacent chapters for navigation
    const [prevChapter, nextChapter] = await Promise.all([
      prisma.chapter.findFirst({
        where: { number: chapter.number - 1, userId },
        select: { id: true, number: true, title: true },
      }),
      prisma.chapter.findFirst({
        where: { number: chapter.number + 1, userId },
        select: { id: true, number: true, title: true },
      }),
    ]);

    const narrativeChapter = {
      id: chapter.id,
      number: chapter.number,
      title: chapter.title,
      summary: chapter.summary,
      yearsCovered: JSON.parse(chapter.yearsCovered),
      prevChapter,
      nextChapter,
      events: chapter.events.map((event) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        location: event.location,
        summary: event.summary,
        emotionTags: JSON.parse(event.emotionTags),
        notes: event.notes,
        isKeystone: event.isKeystone,
        traumaCycle: event.traumaCycle,
        persons: event.personLinks.map((l) => l.person),
        songs: event.songLinks.map((l) => l.song),
        artifacts: event.artifactLinks.map((l) => l.artifact),
        synchronicities: event.synchronicityLinks.map((l) => l.synchronicity),
      })),
    };

    res.json(narrativeChapter);
  } catch (error) {
    console.error('Error fetching chapter narrative:', error);
    res.status(500).json({ error: 'Failed to fetch chapter narrative' });
  }
});
