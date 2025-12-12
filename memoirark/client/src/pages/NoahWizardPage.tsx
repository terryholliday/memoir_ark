import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Home, Save, RotateCcw } from 'lucide-react'

interface Message {
  id: string
  speaker: 'noah' | 'user'
  text: string
  timestamp: Date
}

interface InterviewState {
  questionCount: number
  mentionedPeople: string[]
  emotionalWords: string[]
  hasGottenDeep: boolean
}

// Barbara Walters-style question generation - reactive to what they actually say
function generateNextQuestion(messages: Message[], state: InterviewState): string {
  const lastUserMessage = messages.filter(m => m.speaker === 'user').slice(-1)[0]?.text || ''
  const lastText = lastUserMessage.toLowerCase()
  
  // Opening - get them talking
  if (state.questionCount === 0) {
    return pickRandom([
      "Tell me what's on your mind today. What memory keeps coming back to you?",
      "I want to hear your story. Where should we begin?",
      "What moment from your past do you find yourself thinking about?",
    ])
  }

  // Detect if they're being brief or evasive
  if (lastUserMessage.length < 50 && state.questionCount > 1) {
    return pickRandom([
      "I need more than that. Take me there. What did it look like? What did it smell like?",
      "You're giving me the headline. I want the story beneath it.",
      "Stay with me here. Close your eyes and go back to that moment. What do you see?",
      "That's the polished version. What's the real one?",
    ])
  }

  // React to emotional words
  if (lastText.includes('angry') || lastText.includes('furious') || lastText.includes('mad')) {
    return pickRandom([
      "Anger. That's a powerful word. But anger usually protects something softer. What's underneath it?",
      "When you felt that anger—where did you feel it in your body?",
      "And what did you do with that anger? Where did it go?",
    ])
  }

  if (lastText.includes('scared') || lastText.includes('afraid') || lastText.includes('terrified')) {
    return pickRandom([
      "Fear. What exactly were you afraid would happen?",
      "And did the thing you feared actually happen? Or was it something else entirely?",
      "When you were that scared—who did you want to protect you?",
    ])
  }

  if (lastText.includes('love') || lastText.includes('loved')) {
    return pickRandom([
      "You said 'love.' That word means different things to different people. What did love look like in your family?",
      "Did you feel loved in return? How did you know?",
      "And when did you first learn what love was supposed to feel like?",
    ])
  }

  if (lastText.includes('hurt') || lastText.includes('pain') || lastText.includes('broken')) {
    return pickRandom([
      "That hurt you're describing—do you still carry it? Where?",
      "Pain like that leaves a mark. What mark did it leave on you?",
      "Have you ever told anyone how much that hurt? Really told them?",
    ])
  }

  if (lastText.includes('never') || lastText.includes('always')) {
    return pickRandom([
      "You said 'never' — or 'always.' Those are big words. Is it really never? Or does it just feel that way?",
      "Absolutes like that usually come from somewhere deep. When did you first start believing that?",
    ])
  }

  // React to mentioned people
  if (lastText.includes('mother') || lastText.includes('mom')) {
    return pickRandom([
      "Your mother. Tell me about her. Not who she was to the world—who was she to you?",
      "When you think of your mother, what's the first image that comes to mind?",
      "What did you need from your mother that you didn't get?",
      "And what would you say to her now, if she were sitting right here?",
    ])
  }

  if (lastText.includes('father') || lastText.includes('dad')) {
    return pickRandom([
      "Your father. What did you learn from him—not what he taught, but what you learned by watching?",
      "Was your father the kind of man you wanted to become? Or the kind you swore you'd never be?",
      "What did you need from your father that you never got?",
      "If your father could see you now, what would he think?",
    ])
  }

  if (lastText.includes('brother') || lastText.includes('sister') || lastText.includes('sibling')) {
    return pickRandom([
      "Siblings see things parents miss. What did they see?",
      "Were you close? Or was there distance? Tell me about that.",
      "What role did you play in that family? The responsible one? The rebel? The invisible one?",
    ])
  }

  if (lastText.includes('friend')) {
    return pickRandom([
      "This friend—are they still in your life? Why or why not?",
      "What did this friendship teach you about yourself?",
    ])
  }

  // Probing deeper based on question count
  if (state.questionCount >= 3 && !state.hasGottenDeep) {
    return pickRandom([
      "We've been circling something. What is it you're not saying?",
      "I can feel you holding back. What's the part of this story you've never told anyone?",
      "Let's go deeper. What's the thing about this that still keeps you up at night?",
      "You're telling me what happened. But what did it mean? What did you decide about yourself that day?",
      "Here's what I'm hearing between the lines... there's something you're protecting. What is it?",
    ])
  }

  // Emotional core questions
  if (state.questionCount >= 5) {
    return pickRandom([
      "If the child you were then could see you now, what would they think?",
      "What did this teach you about yourself that you still believe today?",
      "Is that belief true? Or is it just a story you've been telling yourself?",
      "What would it mean to let this go? What are you afraid you'd lose?",
      "If you could go back and whisper something to yourself in that moment, what would it be?",
    ])
  }

  // Meaning and closing
  if (state.questionCount >= 7) {
    return pickRandom([
      "How did this moment change the trajectory of your life?",
      "What pattern in your life started here?",
      "Looking back now, with everything you know—what do you understand that you didn't then?",
      "Is there anything else you need to say about this? Anything we haven't touched?",
    ])
  }

  // Default follow-ups
  return pickRandom([
    "Tell me more about that.",
    "And then what happened?",
    "How did that make you feel?",
    "What were you thinking in that moment?",
    "Who else was there? What did they see?",
    "And what did you do?",
    "What happened next?",
    "Why do you think that happened?",
    "What did you want to happen instead?",
  ])
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function extractTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(m => m.speaker === 'user')?.text || ''
  const words = firstUserMessage.split(' ').slice(0, 8).join(' ')
  return words.length > 5 ? words + '...' : 'Untitled Memory'
}

export default function NoahWizardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [isNoahTyping, setIsNoahTyping] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [interviewState, setInterviewState] = useState<InterviewState>({
    questionCount: 0,
    mentionedPeople: [],
    emotionalWords: [],
    hasGottenDeep: false,
  })
  const [isSaved, setIsSaved] = useState(false)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Start with Noah's opening
  useEffect(() => {
    if (messages.length === 0) {
      setIsNoahTyping(true)
      setTimeout(() => {
        setMessages([{
          id: '1',
          speaker: 'noah',
          text: "Welcome. I'm Noah. Think of this as a conversation, not an interview. There are no wrong answers here—only your truth. So... tell me what's on your mind today. What memory keeps coming back to you?",
          timestamp: new Date(),
        }])
        setIsNoahTyping(false)
      }, 1500)
    }
  }, [])

  const { mutate: createEvent, isPending: isSaving } = useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setIsSaved(true)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        speaker: 'noah',
        text: "This conversation has been saved to your archive. You've done important work here today. The truth you've shared—that's the raw material of memoir. Until next time.",
        timestamp: new Date(),
      }])
    },
  })

  const handleSend = () => {
    if (!inputValue.trim() || isNoahTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      speaker: 'user',
      text: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsNoahTyping(true)

    // Update state
    const newState: InterviewState = {
      ...interviewState,
      questionCount: interviewState.questionCount + 1,
      hasGottenDeep: interviewState.questionCount >= 4,
    }
    setInterviewState(newState)

    // Simulate Noah thinking and responding
    const thinkTime = 1500 + Math.random() * 1500
    setTimeout(() => {
      const nextQuestion = generateNextQuestion([...messages, userMessage], newState)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        speaker: 'noah',
        text: nextQuestion,
        timestamp: new Date(),
      }])
      setIsNoahTyping(false)
      textareaRef.current?.focus()
    }, thinkTime)
  }

  const handleSaveInterview = () => {
    if (messages.filter(m => m.speaker === 'user').length < 2) return
    
    const title = extractTitle(messages)
    const transcript = messages.map(m => 
      m.speaker === 'noah' ? `**Noah:** ${m.text}` : m.text
    ).join('\n\n')

    createEvent({
      title,
      date: new Date().toISOString().split('T')[0],
      summary: messages.find(m => m.speaker === 'user')?.text.slice(0, 200) || '',
      notes: `## Interview with Noah\n\n${transcript}`,
      emotionTags: [],
      location: null,
      chapterId: null,
      traumaCycleId: null,
    })
  }

  const handleStartOver = () => {
    setMessages([])
    setIsSaved(false)
    setInterviewState({
      questionCount: 0,
      mentionedPeople: [],
      emotionalWords: [],
      hasGottenDeep: false,
    })
    setTimeout(() => {
      setIsNoahTyping(true)
      setTimeout(() => {
        setMessages([{
          id: '1',
          speaker: 'noah',
          text: "Let's begin again. What's on your mind?",
          timestamp: new Date(),
        }])
        setIsNoahTyping(false)
      }, 1000)
    }, 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const userMessageCount = messages.filter(m => m.speaker === 'user').length

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <Home className="w-4 h-4 mr-2" />
            Exit
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 flex items-center justify-center text-lg">
              🧔
            </div>
            <span className="font-display font-semibold">Interview with Noah</span>
          </div>
          <div className="flex gap-2">
            {userMessageCount >= 2 && !isSaved && (
              <Button variant="outline" size="sm" onClick={handleSaveInterview} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
            {userMessageCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleStartOver}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.speaker === 'noah' && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 flex items-center justify-center text-xl flex-shrink-0">
                  🧔
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.speaker === 'noah'
                    ? 'bg-muted rounded-tl-sm'
                    : 'bg-primary text-primary-foreground rounded-tr-sm'
                }`}
              >
                <p className={`text-sm leading-relaxed ${message.speaker === 'noah' ? 'font-narrative italic' : ''}`}>
                  {message.speaker === 'noah' ? `"${message.text}"` : message.text}
                </p>
              </div>
            </div>
          ))}

          {isNoahTyping && (
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 flex items-center justify-center text-xl flex-shrink-0">
                🧔
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {!isSaved && (
        <div className="border-t bg-card/80 backdrop-blur sticky bottom-0">
          <div className="container max-w-3xl mx-auto px-4 py-4">
            <div className="flex gap-3">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Take your time. Be honest..."
                className="min-h-[60px] max-h-[200px] resize-none"
                disabled={isNoahTyping}
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isNoahTyping}
                size="icon"
                className="h-[60px] w-[60px]"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      {/* Saved state */}
      {isSaved && (
        <div className="border-t bg-card/80 backdrop-blur sticky bottom-0">
          <div className="container max-w-3xl mx-auto px-4 py-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">Interview saved to your archive</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/events')}>
                View Events
              </Button>
              <Button onClick={handleStartOver}>
                Start New Interview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
