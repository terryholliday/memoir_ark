import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

type NoahMood = 'welcoming' | 'thinking' | 'encouraging' | 'serious' | 'pleased'

interface NoahTip {
  message: string
  mood: NoahMood
}

// Noah speaks with authority - commanding, baritone voice style
const PAGE_TIPS: Record<string, NoahTip[]> = {
  '/': [
    { message: "I am Noah. I have been appointed to guide you in preserving your story. Your memories are precious cargo—let us build your ark together.", mood: 'welcoming' },
    { message: "Every journey of a thousand miles begins with a single step. Create your first event, and we shall begin.", mood: 'encouraging' },
    { message: "The rains will come and go, but your story will endure. Let us make it worthy of preservation.", mood: 'serious' },
  ],
  '/events': [
    { message: "Events are the timbers of your ark. Each one strengthens the vessel that carries your legacy.", mood: 'serious' },
    { message: "Mark your most transformative moments as Keystone events. These are the pillars of your narrative.", mood: 'encouraging' },
    { message: "Do not rush. A well-built ark takes time. Record each event with the care it deserves.", mood: 'thinking' },
  ],
  '/events/new': [
    { message: "What memory do you bring to me today? Speak it plainly, and I shall help you preserve it.", mood: 'welcoming' },
    { message: "The details matter. Where were you? Who was there? How did it change you?", mood: 'thinking' },
    { message: "I will suggest tags to help organize your thoughts. Trust the process.", mood: 'encouraging' },
  ],
  '/people': [
    { message: "No one builds an ark alone. Who are the souls that have shaped your journey?", mood: 'thinking' },
    { message: "Some people are pillars, others are passing waves. Both matter to your story.", mood: 'serious' },
  ],
  '/people/new': [
    { message: "Tell me of this person. What role did they play in the chapters of your life?", mood: 'welcoming' },
    { message: "Even those who wounded you deserve a place in your record. Truth is the foundation of memoir.", mood: 'serious' },
  ],
  '/artifacts': [
    { message: "These are your relics—the physical evidence of a life lived. Guard them well.", mood: 'serious' },
    { message: "A photograph, a letter, a recording... each one is a window to the past.", mood: 'thinking' },
  ],
  '/upload': [
    { message: "You bring me recordings. Good. The voice carries truths that words on paper cannot.", mood: 'pleased' },
    { message: "Once processed, I will help you extract the meaning from these sounds.", mood: 'encouraging' },
  ],
  '/chapters': [
    { message: "Chapters are the rooms of your ark. How shall we arrange them?", mood: 'thinking' },
    { message: "Some organize by time, others by theme. There is wisdom in both approaches.", mood: 'serious' },
  ],
  '/timeline': [
    { message: "Behold your life laid out before you. What patterns do you see?", mood: 'serious' },
    { message: "The gaps in your timeline are not empty—they are memories waiting to surface.", mood: 'thinking' },
  ],
  '/synchronicities': [
    { message: "Ah, the mysterious threads that connect seemingly unrelated events. I know them well.", mood: 'thinking' },
    { message: "Dreams, signs, meaningful coincidences—the universe speaks to those who listen.", mood: 'serious' },
  ],
  '/search': [
    { message: "What do you seek? Speak, and I shall help you find it within your archive.", mood: 'welcoming' },
    { message: "Search by emotion, by person, by place. Your memories are organized and waiting.", mood: 'encouraging' },
  ],
  '/export': [
    { message: "The time has come to share your story with the world. Are you ready?", mood: 'serious' },
    { message: "Export your work and take it to the next stage. Your memoir awaits its final form.", mood: 'encouraging' },
  ],
  '/guide': [
    { message: "Wisdom is knowing what you do not know. You have come to the right place.", mood: 'pleased' },
    { message: "Study these instructions well. I am always here when you need guidance.", mood: 'welcoming' },
  ],
}

const IDLE_TIPS: NoahTip[] = [
  { message: "I am here when you need me. Simply call upon me.", mood: 'welcoming' },
  { message: "Every memory matters, no matter how small it may seem.", mood: 'thinking' },
  { message: "Have you connected your events to the people and artifacts involved?", mood: 'encouraging' },
  { message: "Use tags to track the emotional currents that run through your story.", mood: 'thinking' },
  { message: "The best memoirs are built on honesty. Do not shy away from difficult truths.", mood: 'serious' },
]

function NoahAvatar({ mood, className = '' }: { mood: NoahMood; className?: string }) {
  // Eye and mouth expressions for different moods
  const eyeStyles: Record<NoahMood, string> = {
    welcoming: 'M32 38 Q35 34 38 38 M52 38 Q55 34 58 38', // friendly curved
    thinking: 'M32 37 L38 37 M52 37 L58 37', // flat, contemplative
    encouraging: 'M32 38 Q35 33 38 38 M52 38 Q55 33 58 38', // bright
    serious: 'M32 38 L38 38 M52 38 L58 38', // stern
    pleased: 'M32 39 Q35 35 38 39 M52 39 Q55 35 58 39', // happy squint
  }

  const browStyles: Record<NoahMood, string> = {
    welcoming: 'M30 32 Q35 30 40 32 M50 32 Q55 30 60 32',
    thinking: 'M30 31 L40 33 M50 33 L60 31', // one raised
    encouraging: 'M30 31 Q35 29 40 31 M50 31 Q55 29 60 31',
    serious: 'M30 33 L40 31 M50 31 L60 33', // furrowed
    pleased: 'M30 32 Q35 31 40 32 M50 32 Q55 31 60 32',
  }

  const mouthStyles: Record<NoahMood, string> = {
    welcoming: 'M38 62 Q45 68 52 62', // warm smile
    thinking: 'M40 64 Q45 62 50 64', // slight frown
    encouraging: 'M36 61 Q45 70 54 61', // big smile
    serious: 'M40 64 L50 64', // straight line
    pleased: 'M38 62 Q45 69 52 62', // content smile
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 90 100" className="w-full h-full">
        {/* Background circle */}
        <circle cx="45" cy="45" r="42" fill="#E8DCC8" />
        
        {/* Headcovering */}
        <path
          d="M10 40 Q10 10 45 5 Q80 10 80 40 L82 55 Q75 60 45 62 Q15 60 8 55 Z"
          fill="#D4C4A8"
        />
        
        {/* Headband */}
        <path
          d="M12 42 Q28 35 45 33 Q62 35 78 42"
          stroke="#8B6914"
          strokeWidth="3"
          fill="none"
        />
        
        {/* Face */}
        <ellipse cx="45" cy="48" rx="25" ry="28" fill="#F5DEB3" />
        
        {/* Beard */}
        <path
          d="M25 55 Q22 70 28 85 Q38 95 45 96 Q52 95 62 85 Q68 70 65 55 Q55 50 45 48 Q35 50 25 55"
          fill="#9CA3AF"
        />
        
        {/* Beard texture lines */}
        <path
          d="M30 60 Q32 75 35 85 M45 55 L45 90 M60 60 Q58 75 55 85"
          stroke="#6B7280"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />
        
        {/* Eyes */}
        <path
          d={eyeStyles[mood]}
          stroke="#2D1B0E"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Eyebrows */}
        <path
          d={browStyles[mood]}
          stroke="#6B7280"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Nose */}
        <path
          d="M45 45 Q48 52 45 55"
          stroke="#D4A574"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Mouth */}
        <path
          d={mouthStyles[mood]}
          stroke="#8B4513"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  )
}

export default function NoahGuide() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [currentTip, setCurrentTip] = useState<NoahTip | null>(null)
  const [tipIndex, setTipIndex] = useState(0)
  const [hasSeenPage, setHasSeenPage] = useState<Set<string>>(new Set())

  // Get tips for current page
  const getPageTips = (): NoahTip[] => {
    const path = location.pathname
    if (PAGE_TIPS[path]) return PAGE_TIPS[path]
    const basePath = '/' + path.split('/')[1]
    if (PAGE_TIPS[basePath]) return PAGE_TIPS[basePath]
    return IDLE_TIPS
  }

  // Show Noah when page changes (first visit to each page)
  useEffect(() => {
    const tips = getPageTips()
    const isNewPage = !hasSeenPage.has(location.pathname)
    
    if (isNewPage) {
      setHasSeenPage(prev => new Set([...prev, location.pathname]))
      setCurrentTip(tips[0])
      setTipIndex(0)
      setIsOpen(true)
    }
  }, [location.pathname])

  const handleNextTip = () => {
    const tips = getPageTips()
    const nextIndex = (tipIndex + 1) % tips.length
    setTipIndex(nextIndex)
    setCurrentTip(tips[nextIndex])
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleSummonNoah = () => {
    const tips = getPageTips()
    setCurrentTip(tips[tipIndex])
    setIsOpen(true)
  }

  // When closed, show small summon button in corner
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleSummonNoah}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-amber-100 dark:from-blue-900 dark:to-amber-900 border-2 border-blue-300 dark:border-blue-600 shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center overflow-hidden"
          title="Summon Noah"
        >
          <NoahAvatar mood="welcoming" className="w-12 h-16" />
        </button>
      </div>
    )
  }

  // Full Noah modal - centered on screen
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-card border-2 border-primary/20 rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center justify-center"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Noah illustration */}
          <div className="bg-gradient-to-br from-blue-50 via-amber-50 to-blue-100 dark:from-blue-950 dark:via-amber-950 dark:to-blue-900 p-6 flex items-center justify-center md:w-48">
            <NoahAvatar mood={currentTip?.mood || 'welcoming'} className="w-32 h-44" />
          </div>

          {/* Speech content */}
          <div className="flex-1 p-6">
            <div className="mb-2">
              <h3 className="text-lg font-display font-semibold text-primary">Noah</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Your Memoir Guide</p>
            </div>
            
            <div className="min-h-[80px] mb-4">
              <p className="text-base leading-relaxed font-narrative">
                "{currentTip?.message}"
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextTip}
              >
                Another Word
              </Button>
              <Button
                size="sm"
                onClick={handleClose}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
