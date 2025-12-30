import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from './auth';

export const devRoutes = Router();

function ensureNotProduction(res: Response): boolean {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'Not found' });
    return false;
  }
  return true;
}

devRoutes.post('/seed-artifacts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!ensureNotProduction(res)) return;

    const userId = req.authUser?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const now = Date.now();

    const artifacts = await prisma.$transaction([
      prisma.artifact.create({
        data: {
          userId,
          type: 'journal',
          sourceSystem: 'dev_seed',
          sourcePathOrUrl: '',
          importedFrom: 'dev-seed-journal.txt',
          shortDescription: 'Journal excerpt (dev seed)',
          transcribedText:
            "March 2009\n\nI can still smell the hospital hand soap. It was everywhere—on my hands, on the railings, on the air itself. I remember sitting in the parking lot before I went in, rehearsing what I was going to say, because I was afraid if I spoke freely I would fall apart.\n\nMy mother kept making small talk, like if we named the weather we could control the day. I watched her hands, how she folded and unfolded the same paper, over and over. I don’t think she knew she was doing it.\n\nThere was a moment—quiet, almost nothing—when I realized I had been carrying the role of ‘the strong one’ for so long that I didn’t know how to put it down. I didn’t say any of this out loud. I just nodded. I smiled when I needed to.\n\nIf I’m honest, what I wanted was someone to look at me and say: ‘You don’t have to perform right now.’",
        },
      }),
      prisma.artifact.create({
        data: {
          userId,
          type: 'document',
          sourceSystem: 'dev_seed',
          sourcePathOrUrl: '',
          importedFrom: 'dev-seed-letter.txt',
          shortDescription: 'Letter draft (dev seed)',
          transcribedText:
            "Letter draft — undated\n\nDad,\n\nI’ve started and deleted this more times than I can count. I keep wanting to make it clean and reasonable, like if I write it the right way you’ll finally understand. But the truth is messier than that.\n\nWhen you left that night, you didn’t just leave the house—you left a silence behind you that we all learned to live inside. I became good at reading moods and predicting storms. I became good at being useful. I became good at not needing anything.\n\nI don’t know if you ever meant to teach me that, but it’s what I learned.\n\nThe hardest part is that I still miss you. I miss the version of you I kept hoping would come back.\n\nI’m not writing this to punish you. I’m writing it because I don’t want to keep carrying it alone.",
        },
      }),
      prisma.artifact.create({
        data: {
          userId,
          type: 'document',
          sourceSystem: 'dev_seed',
          sourcePathOrUrl: '',
          importedFrom: 'dev-seed-speech.txt',
          shortDescription: 'Graduation speech notes (dev seed)',
          transcribedText:
            "Graduation speech notes — May 2012\n\n- Thank Ms. Alvarez for seeing me when I was invisible\n- Tell the story about the bus stop mornings + the library after school\n- Mention Grandma’s kitchen table: where the real lessons happened\n- The sentence I keep circling: ‘I didn’t get here alone.’\n\nWhat I’m afraid to say:\n- I was terrified I’d become the statistic everyone expected\n- I used achievement like armor\n- I still don’t know what I want when no one is grading me",
        },
      }),
    ]);

    res.json({
      ok: true,
      seededCount: artifacts.length,
      artifacts,
      seedTag: `dev_seed_${now}`,
    });
  } catch (error) {
    console.error('Dev seed artifacts error:', error);
    res.status(500).json({ error: 'Failed to seed artifacts' });
  }
});
