import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, 
  User, 
  Database, 
  BookOpen, 
  Send, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  ChevronRight,
  Menu,
  X,
  History,
  Activity,
  HeartPulse,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatService, formatTime, generateSessionTitle, MODELS } from '@/lib/chat';
import type { Message, SessionInfo } from '../../worker/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast, Toaster } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
// --- Types ---
interface HealthIdentity {
  id: string;
  name: string;
  bloodType: string;
  allergies: string[];
  lastCheckup: string;
}
const DEMO_PATIENT: HealthIdentity = {
  id: "VER-9928-XA",
  name: "Alex Sterling",
  bloodType: "O Positive",
  allergies: ["Penicillin", "Peanuts"],
  lastCheckup: "2024-12-15"
};
// --- Main Page Component ---
export function HomePage() {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(chatService.getSessionId());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Initialize
  useEffect(() => {
    loadSessions();
    loadMessages();
    // Default open auth for demo
    const timer = setTimeout(() => setIsAuthModalOpen(true), 1500);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  const loadSessions = async () => {
    const res = await chatService.listSessions();
    if (res.success && res.data) {
      setSessions(res.data);
    }
  };
  const loadMessages = async () => {
    const res = await chatService.getMessages();
    if (res.success && res.data) {
      setMessages(res.data.messages);
    }
  };
  const handleSendMessage = async (e?: React.FormEvent, presetMessage?: string) => {
    e?.preventDefault();
    const content = presetMessage || input;
    if (!content.trim() || isLoading) return;
    // If it's the first message of a new session, create it in registry
    if (messages.length === 0) {
      const title = generateSessionTitle(content);
      await chatService.createSession(title, currentSessionId, content);
      loadSessions();
    }
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    let assistantContent = '';
    const res = await chatService.sendMessage(content, MODELS[0].id, (chunk) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant') {
          return [...prev.slice(0, -1), { ...last, content: assistantContent }];
        } else {
          return [...prev, { id: 'temp-ai', role: 'assistant', content: assistantContent, timestamp: Date.now() }];
        }
      });
    });
    if (!res.success) {
      toast.error("Failed to reach Veridia intelligence.");
    }
    setIsLoading(false);
    loadMessages(); // Sync final state
  };
  const handleNewChat = () => {
    chatService.newSession();
    setCurrentSessionId(chatService.getSessionId());
    setMessages([]);
    loadSessions();
  };
  const switchSession = async (id: string) => {
    chatService.switchSession(id);
    setCurrentSessionId(id);
    await loadMessages();
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };
  const deleteSession = async (id: string) => {
    await chatService.deleteSession(id);
    if (id === currentSessionId) handleNewChat();
    else loadSessions();
    toast.info("Session archived");
  };
  const authenticate = () => {
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    toast.success("Identity verified via Veridia Vault");
  };
  // --- Components ---
  const QuickAction = ({ icon: Icon, label, query, color }: { icon: any, label: string, query: string, color: string }) => (
    <button 
      onClick={() => handleSendMessage(undefined, query)}
      className={cn(
        "flex flex-col items-start p-4 rounded-3xl border border-border/40 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all hover:scale-[1.02] active:scale-[0.98] text-left group",
        "shadow-sm hover:shadow-md"
      )}
    >
      <div className={cn("p-2 rounded-2xl mb-3", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="font-medium text-sm text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Ask Veridia →</span>
    </button>
  );
  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0F172A] overflow-hidden selection:bg-teal-100 dark:selection:bg-teal-900">
      <Toaster richColors position="top-center" />
      {/* --- Sidebar --- */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed md:relative z-40 w-72 h-full glass border-r border-border/50 flex flex-col"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl tracking-tight">Veridia</h1>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Health Intelligence</p>
                </div>
              </div>
              <Button 
                onClick={handleNewChat}
                variant="outline" 
                className="w-full justify-start gap-2 rounded-2xl border-dashed border-2 py-6 mb-6 hover:bg-accent/50"
              >
                <Plus className="w-4 h-4" />
                New Consultation
              </Button>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground px-2 mb-2 uppercase tracking-tighter">Recent Consults</p>
                <ScrollArea className="h-[30vh]">
                  {sessions.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-2 italic">No previous logs</p>
                  ) : (
                    sessions.map(s => (
                      <div key={s.id} className="group relative">
                        <button
                          onClick={() => switchSession(s.id)}
                          className={cn(
                            "w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2",
                            s.id === currentSessionId ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/30 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <History className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{s.title}</span>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </div>
            </div>
            <div className="mt-auto p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/10">
                <div className="flex items-center gap-2 mb-2 text-teal-600 dark:text-teal-400">
                  <Database className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Memory Drive</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your clinical history is securely indexed for contextual intelligence.
                </p>
              </div>
              <Separator className="bg-border/40" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 ring-2 ring-background shadow-sm">
                    <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop" />
                    <AvatarFallback>AS</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">{isAuthenticated ? DEMO_PATIENT.name : "Guest User"}</span>
                    <span className="text-[10px] text-muted-foreground">{isAuthenticated ? "Identity Verified" : "Unverified"}</span>
                  </div>
                </div>
                <ThemeToggle className="static" />
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border/40 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl z-30">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-xl hover:bg-accent/50"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="flex flex-col">
              <h2 className="text-sm font-bold">Veridia Intelligence</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Active Core</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Badge variant="secondary" className="hidden sm:flex rounded-full px-3 py-1 font-medium text-[11px] bg-white/80 dark:bg-slate-800/80 border-border/50">
               <Activity className="w-3 h-3 mr-1.5 text-teal-500" />
               V-Secure 2.4
             </Badge>
             {!isAuthenticated && (
                <Button 
                  size="sm" 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="rounded-full bg-teal-600 hover:bg-teal-700 text-white text-[11px] h-8 px-4 font-bold shadow-lg shadow-teal-600/20"
                >
                  Verify Identity
                </Button>
             )}
          </div>
        </header>
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Hero / Empty State */}
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12 md:py-20 text-center space-y-10"
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold border border-teal-500/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Health Companion
                  </div>
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
                    Your Health <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">Reimagined</span>.
                  </h1>
                  <p className="text-muted-foreground max-w-xl mx-auto text-lg">
                    Verify your identity, store medical records, and query medical knowledge through our secure liquid-glass intelligence layer.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
                  <QuickAction 
                    icon={Activity} 
                    label="Health Check" 
                    query="What should I check for my annual physical?" 
                    color="bg-rose-500/10 text-rose-600"
                  />
                  <QuickAction 
                    icon={Database} 
                    label="Medical ID" 
                    query="Show my current medical identity summary." 
                    color="bg-blue-500/10 text-blue-600"
                  />
                  <QuickAction 
                    icon={Brain} 
                    label="Brain Health" 
                    query="Tips for improving cognitive focus and sleep." 
                    color="bg-purple-500/10 text-purple-600"
                  />
                  <QuickAction 
                    icon={HeartPulse} 
                    label="Cardio Vitality" 
                    query="Analyze the benefits of zone 2 heart rate training." 
                    color="bg-emerald-500/10 text-emerald-600"
                  />
                </div>
              </motion.div>
            )}
            {/* Messages */}
            <div className="space-y-6">
              {messages.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex w-full gap-4",
                    m.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    m.role === 'user' ? "bg-white dark:bg-slate-800 border border-border" : "bg-gradient-to-br from-teal-500 to-blue-500 text-white"
                  )}>
                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "flex flex-col max-w-[85%] md:max-w-[70%]",
                    m.role === 'user' ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "px-5 py-3.5 rounded-3xl text-[14px] leading-relaxed shadow-sm",
                      m.role === 'user' 
                        ? "bg-teal-600 text-white rounded-tr-none shadow-teal-500/10" 
                        : "bg-white dark:bg-slate-900 border border-border/60 rounded-tl-none"
                    )}>
                      {m.content || <div className="flex gap-1 py-1"><div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" /></div>}
                      {m.toolCalls && m.toolCalls.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border/50 space-y-2">
                          {m.toolCalls.map(tc => (
                            <div key={tc.id} className="flex items-center gap-2 text-[11px] font-bold text-teal-600 uppercase tracking-tight">
                              <Badge variant="outline" className="bg-teal-500/5 text-teal-600 border-teal-500/20 text-[10px]">
                                Tool Executed: {tc.name}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="mt-1.5 text-[10px] text-muted-foreground font-medium px-1">
                      {formatTime(m.timestamp)}
                    </span>
                  </div>
                </motion.div>
              ))}
              <div ref={scrollRef} className="h-4" />
            </div>
          </div>
        </div>
        {/* Input Bar */}
        <div className="p-4 md:p-8 pt-0 z-30">
          <div className="max-w-4xl mx-auto relative">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full flex justify-center pointer-events-none">
              <AnimatePresence>
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="bg-white/90 dark:bg-slate-900/90 border border-border/60 px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2"
                  >
                    <div className="flex gap-0.5">
                      <div className="w-1 h-1 bg-teal-500 rounded-full animate-ping" />
                      <div className="w-1 h-1 bg-teal-500 rounded-full animate-ping [animation-delay:0.2s]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600">Processing Stream</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <form 
              onSubmit={handleSendMessage}
              className="glass p-2 rounded-[2.5rem] flex items-center gap-2 border border-border/60 shadow-2xl"
            >
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-accent/50 h-12 w-12"
              >
                <Plus className="w-5 h-5 text-muted-foreground" />
              </Button>
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your health records, meds, or clinical info..."
                className="flex-1 bg-transparent border-none focus-visible:ring-0 text-[15px] h-12 px-2"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className={cn(
                  "rounded-full h-12 w-12 transition-all p-0",
                  input.trim() ? "bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20" : "bg-muted text-muted-foreground"
                )}
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] text-muted-foreground/60 font-medium px-4">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                <span>HIPAA-Compliant Logic</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3" />
                <span>Encrypted Memory</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartPulse className="w-3 h-3" />
                <span>AI Consult Only - Not a Doctor</span>
              </div>
            </div>
            <p className="mt-6 text-[10px] text-center text-muted-foreground/40 leading-relaxed uppercase tracking-[0.2em] font-bold">
              Important: AI server capacity is limited. Please use responsibly.
            </p>
          </div>
        </div>
      </main>
      {/* --- Authentication Modal --- */}
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] glass-dark border-border/20 p-8">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center mb-6 shadow-xl shadow-teal-500/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">Veridia Identity</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Please verify your patient credentials to access clinical memory drive and medical records.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">Demo Patient ID</span>
                <span className="text-white font-mono">{DEMO_PATIENT.id}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">Full Name</span>
                <span className="text-white font-mono">{DEMO_PATIENT.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">Blood Profile</span>
                <span className="text-white font-mono">{DEMO_PATIENT.bloodType}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-500 font-medium">
              <HeartPulse className="w-3.5 h-3.5 shrink-0" />
              <span>Verifying your clinical identity will enable context-aware AI summaries.</span>
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button 
              onClick={authenticate}
              className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-bold text-md shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Verify & Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}