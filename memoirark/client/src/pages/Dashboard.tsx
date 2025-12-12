import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { statsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  BookOpen, 
  Users, 
  FileText, 
  Sparkles, 
  Upload, 
  Search, 
  Clock, 
  Download,
  Plus,
  ArrowRight,
  HelpCircle,
  Tag,
  FolderOpen,
  Filter,
} from 'lucide-react'

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: statsApi.getStats,
  })

  const quickActions = [
    {
      title: 'Noah\'s Wizard',
      description: 'Guided memory capture',
      icon: Sparkles,
      href: '/wizard',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Add Event',
      description: 'Record a memory or moment',
      icon: Calendar,
      href: '/events/new',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Add Person',
      description: 'Someone in your story',
      icon: Users,
      href: '/people/new',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Upload Audio',
      description: 'Therapy sessions, voicemails',
      icon: Upload,
      href: '/upload',
      color: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    {
      title: 'Add Artifact',
      description: 'Photos, letters, documents',
      icon: FileText,
      href: '/artifacts/new',
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
  ]

  const browseActions = [
    { title: 'Timeline', description: 'View chronologically', icon: Clock, href: '/timeline' },
    { title: 'Events', description: `${stats?.events ?? 0} recorded`, icon: Calendar, href: '/events' },
    { title: 'People', description: `${stats?.persons ?? 0} in your story`, icon: Users, href: '/people' },
    { title: 'Chapters', description: `${stats?.chapters ?? 0} chapters`, icon: BookOpen, href: '/chapters' },
    { title: 'Artifacts', description: `${stats?.artifacts ?? 0} items`, icon: FileText, href: '/artifacts' },
    { title: 'Synchronicities', description: `${stats?.synchronicities ?? 0} recorded`, icon: Sparkles, href: '/synchronicities' },
  ]

  const toolActions = [
    { title: 'Search', description: 'Find anything', icon: Search, href: '/search' },
    { title: 'Query Builder', description: 'Advanced filters', icon: Filter, href: '/query' },
    { title: 'Tags', description: 'Organize by theme', icon: Tag, href: '/tags' },
    { title: 'Collections', description: 'Group content', icon: FolderOpen, href: '/collections' },
    { title: 'Export', description: 'Download memoir', icon: Download, href: '/export' },
    { title: 'User Guide', description: 'How to use', icon: HelpCircle, href: '/guide' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display">MemoirArk</h1>
          <p className="text-muted-foreground">Your story, preserved</p>
        </div>
        {!isLoading && stats && (
          <div className="text-right text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{stats.events}</span> events · 
            <span className="font-semibold text-foreground ml-1">{stats.persons}</span> people · 
            <span className="font-semibold text-foreground ml-1">{stats.artifacts}</span> artifacts
          </div>
        )}
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} to={action.href}>
                <Card className="h-full hover:shadow-md transition-all hover:border-primary/50 cursor-pointer group">
                  <CardContent className="pt-6">
                    <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Browse Your Archive
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {browseActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} to={action.href}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{action.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{action.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Tools
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {toolActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} to={action.href}>
                <Button variant="outline" className="w-full justify-start h-auto py-3 px-4">
                  <Icon className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              </Link>
            )
          })}
        </div>
      </section>

      <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-lg">Getting Started</CardTitle>
          <CardDescription>Build your memoir step by step</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">1</div>
            <div>
              <p className="font-medium">Capture memories</p>
              <p className="text-sm text-muted-foreground">Add events, upload recordings, scan photos</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">2</div>
            <div>
              <p className="font-medium">Connect the dots</p>
              <p className="text-sm text-muted-foreground">Link events to people, artifacts, and chapters</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">3</div>
            <div>
              <p className="font-medium">Export your story</p>
              <p className="text-sm text-muted-foreground">Download as Markdown for editing and publishing</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
