import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  User,
  Database,
  Send,
  Plus,
  Trash2,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  History,
  Activity,
  HeartPulse,
  Brain,
  AlertCircle,
  CheckCircle2,
  Thermometer,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatService, formatTime, generateSessionTitle, MODELS } from '@/lib/chat';
import type { Message, SessionInfo } from '../../worker/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
// --- Types ---
interface HealthIdentity {
  id: string;
  name: string;
  bloodType: string;
  allergies: string[];
  lastCheckup: string;
  medications: string[];
  vitals: {
    heartRate: string;
    bp: string;
    temp: string;
  };
}
const DEMO_PATIENT: HealthIdentity = {
  id: "VER-9928-XA",
  name: "Alex Sterling",
  bloodType: "O Positive",
  allergies: ["Penicillin", "Peanuts"],
  lastCheckup: "2024-12-15",
  medications: ["Vitamin D3", "Lisinopril"],
  vitals: {
    heartRate: "72 bpm",
    bp: "120/80",
    temp: "98.6 °F"
  }
};
// --- View 2: Patient Dashboard Panel ---
const PatientDashboardPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[120]"
        />
        <motion.div
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-950 border-l border-border z-[130] shadow-2xl p-0 flex flex-col"
        >
          <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500 rounded-xl">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold">Health Identity</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X className="w-5 h-5" /></Button>
          </div>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              <Card className="p-4 bg-gradient-to-br from-teal-500/10 to-blue-500/10 border-teal-500/20 rounded-3xl shadow-none">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-800 shadow-sm">
                    <AvatarFallback className="bg-teal-500 text-white font-bold">AS</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg">{DEMO_PATIENT.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{DEMO_PATIENT.id}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-white/20 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Blood Type</p>
                    <p className="text-sm font-bold">{DEMO_PATIENT.bloodType}</p>
                  </div>
                  <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-white/20 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Last Visit</p>
                    <p className="text-sm font-bold">{DEMO_PATIENT.lastCheckup}</p>
                  </div>
                </div>
              </Card>
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Live Vitals</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'HR', val: DEMO_PATIENT.vitals.heartRate, icon: HeartPulse, color: 'text-rose-500' },
                    { label: 'BP', val: DEMO_PATIENT.vitals.bp, icon: Activity, color: 'text-teal-500' },
                    { label: 'Temp', val: DEMO_PATIENT.vitals.temp, icon: Thermometer, color: 'text-blue-500' }
                  ].map((v, i) => (
                    <div key={i} className="p-3 rounded-2xl border border-border bg-slate-50 dark:bg-slate-900 flex flex-col items-center text-center transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                      <v.icon className={cn("w-4 h-4 mb-2", v.color)} />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">{v.label}</span>
                      <span className="text-xs font-bold">{v.val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Allergies & Alerts</h4>
                <div className="flex flex-wrap gap-2">
                  {DEMO_PATIENT.allergies.map(a => (
                    <Badge key={a} variant="outline" className="bg-rose-500/5 border-rose-500/20 text-rose-600 rounded-full py-1 px-3">
                      <AlertCircle className="w-3 h-3 mr-1.5" /> {a}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
// --- View 3: Memory Drive Panel ---
const MemoryDrivePanel = ({ isOpen, onClose, messages }: { isOpen: boolean; onClose: () => void; messages: Message[] }) => {
  const records = messages.filter(m => m.role === 'assistant' && m.content.length > 50).slice(-5);
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[120]"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-950 border-l border-border z-[130] shadow-2xl p-0 flex flex-col"
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-xl">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold">Clinical Memory</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X className="w-5 h-5" /></Button>
            </div>
            <ScrollArea className="flex-1 p-6">
              {records.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                    <Database className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">No indexed health records found. Conversations will be automatically summarized here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground mb-4">Veridia has indexed {records.length} key clinical insights from your session.</p>
                  {records.map((r, i) => (
                    <Card key={i} className="p-4 border-border/60 hover:border-teal-500/40 transition-colors cursor-pointer group shadow-none">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-tighter bg-blue-500/5 text-blue-600">AI Summary</Badge>
                        <span className="text-[10px] text-muted-foreground font-medium">{formatTime(r.timestamp)}</span>
                      </div>
                      <p className="text-xs leading-relaxed line-clamp-3 text-foreground/80 group-hover:text-foreground transition-colors">
                        {r.content}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
// --- Notification UI ---
const Notification = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
      className={cn(
        "fixed top-6 left-1/2 -translate-x-1/2 z-[250] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border backdrop-blur-md min-w-[300px]",
        type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
        type === 'error' ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400" :
        "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
      )}
    >
      {type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      <span className="text-sm font-semibold">{message}</span>
    </motion.div>
  );
};
export function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(chatService.getSessionId());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const showNotify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
  }, []);
  const loadSessions = useCallback(async () => {
    const res = await chatService.listSessions();
    if (res.success && Array.isArray(res.data)) {
      setSessions(res.data);
    }
  }, []);
  const loadMessages = useCallback(async () => {
    if (!currentSessionId) return;
    const res = await chatService.getMessages();
    if (res.success && res.data) {
      setMessages(res.data.messages || []);
    } else if (res.error) {
      showNotify(res.error, 'error');
    }
  }, [currentSessionId, showNotify]);
  useEffect(() => {
    const init = async () => {
      await chatService.validateSession();
      loadSessions();
      loadMessages();
    };
    init();
  }, [currentSessionId, loadSessions, loadMessages]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  const handleSendMessage = async (e?: React.FormEvent, preset?: string) => {
    e?.preventDefault();
    const content = preset || input;
    if (!content.trim() || isLoading) return;
    if (messages.length === 0) {
      const title = generateSessionTitle(content);
      await chatService.createSession(title, currentSessionId, content);
      loadSessions();
    }
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    let assistantContent = '';
    try {
      await chatService.sendMessage(content, MODELS[0].id, (chunk) => {
        assistantContent += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.id === 'temp-ai') {
            return [...prev.slice(0, -1), { ...last, content: assistantContent }];
          }
          return [...prev, { id: 'temp-ai', role: 'assistant', content: assistantContent, timestamp: Date.now() }];
        });
      });
    } catch (err) {
      showNotify("Intelligence core unreachable.", 'error');
    } finally {
      setIsLoading(false);
      loadMessages();
    }
  };
  const handleNewChat = () => {
    chatService.newSession();
    setCurrentSessionId(chatService.getSessionId());
    setMessages([]);
    loadSessions();
  };
  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-teal-100 dark:selection:bg-teal-900">
      <AnimatePresence>
        {notification && <Notification {...notification} onClose={() => setNotification(null)} />}
      </AnimatePresence>
      <PatientDashboardPanel isOpen={isDashboardOpen} onClose={() => setIsDashboardOpen(false)} />
      <MemoryDrivePanel isOpen={isMemoryOpen} onClose={() => setIsMemoryOpen(false)} messages={messages} />
      {/* --- Sidebar --- */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ 
              x: 0, 
              width: isSidebarCollapsed ? 80 : 288 
            }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 240 }}
            className="bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl border-r border-border flex flex-col z-50 fixed md:static inset-y-0 overflow-hidden"
          >
            <div className="p-6 flex-1 flex flex-col overflow-hidden">
              <div className={cn("flex items-center gap-3 mb-8 transition-all", isSidebarCollapsed ? "justify-center" : "")}>
                <div className="w-10 h-10 rounded-2xl bg-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                {!isSidebarCollapsed && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h1 className="font-bold text-lg tracking-tight">Veridia</h1>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Clinical AI</p>
                  </motion.div>
                )}
              </div>
              <Button 
                onClick={handleNewChat} 
                variant="outline" 
                className={cn(
                  "gap-2 rounded-2xl border-dashed border-2 hover:bg-accent/50 transition-all",
                  isSidebarCollapsed ? "w-10 h-10 p-0 mx-auto" : "w-full py-6 mb-6"
                )}
              >
                <Plus className="w-4 h-4" /> 
                {!isSidebarCollapsed && "New Consult"}
              </Button>
              <div className="flex-1 overflow-hidden flex flex-col">
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 transition-all",
                  isSidebarCollapsed ? "text-center opacity-0 h-0 overflow-hidden" : "px-2"
                )}>
                  History
                </p>
                <ScrollArea className="flex-1">
                  <div className="space-y-1">
                    {sessions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { 
                          setCurrentSessionId(s.id); 
                          chatService.switchSession(s.id); 
                        }}
                        className={cn(
                          "w-full text-left rounded-xl text-xs transition-all flex items-center group",
                          isSidebarCollapsed ? "justify-center p-2.5" : "px-3 py-2.5 gap-3",
                          s.id === currentSessionId ? "bg-accent text-accent-foreground font-semibold" : "hover:bg-accent/40 text-muted-foreground"
                        )}
                        title={isSidebarCollapsed ? s.title : ""}
                      >
                        <History className="w-3.5 h-3.5 shrink-0 opacity-50" />
                        {!isSidebarCollapsed && <span className="truncate flex-1">{s.title}</span>}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <div className={cn("p-6 border-t border-border/40 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 transition-all", isSidebarCollapsed ? "flex flex-col items-center p-4" : "")}>
              <div className={cn("flex items-center justify-between", isSidebarCollapsed ? "flex-col gap-4" : "")}>
                <div
                  onClick={() => setIsDashboardOpen(true)}
                  className={cn(
                    "flex items-center gap-3 cursor-pointer hover:bg-white dark:hover:bg-slate-800 p-1 rounded-xl transition-all",
                    isSidebarCollapsed ? "justify-center" : ""
                  )}
                >
                  <Avatar className="h-8 w-8 ring-2 ring-teal-500/20">
                    <AvatarFallback className="bg-teal-500 text-white text-[10px] font-bold">AS</AvatarFallback>
                  </Avatar>
                  {!isSidebarCollapsed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
                      <span className="text-[11px] font-bold">Alex Sterling</span>
                      <span className="text-[9px] text-teal-600 font-bold uppercase tracking-tighter">Verified ID</span>
                    </motion.div>
                  )}
                </div>
                <ThemeToggle className="static" />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                className="hidden md:flex rounded-full self-center"
              >
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      {/* --- Main Area --- */}
      <main className="flex-1 flex flex-col relative min-w-0 transition-all duration-300">
        <header className="h-16 border-b border-border/40 px-4 md:px-8 flex items-center justify-between bg-white/40 dark:bg-slate-950/40 backdrop-blur-md z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden rounded-xl">
              <Menu className="w-5 h-5" />
            </Button>
            {!isSidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="hidden md:flex rounded-xl">
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div className="hidden sm:flex flex-col">
              <h2 className="text-sm font-bold">Clinical Memory Active</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Secure Gateway</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsMemoryOpen(true)} className="rounded-full h-8 text-[11px] font-bold gap-1.5 bg-white dark:bg-slate-900 border-border/60">
              <Database className="w-3 h-3 text-teal-500" /> Drive
            </Button>
            <Badge variant="secondary" className="hidden lg:flex h-8 rounded-full border-border/40 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold px-3">
              V-SECURE 2.5.0
            </Badge>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-8 md:py-10 lg:py-12 max-w-4xl mx-auto space-y-12">
              {messages.length === 0 ? (
                <div className="py-12 text-center space-y-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <Badge variant="outline" className="rounded-full bg-teal-500/5 text-teal-600 border-teal-500/20 py-1 px-4 font-bold text-xs uppercase">
                      <Sparkles className="w-3 h-3 mr-2" /> Medical Intelligence
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Your Health, <span className="text-teal-500">Synthesized</span>.</h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">Veridia indexes your clinical records and provides real-time health intelligence through a secure vault.</p>
                  </motion.div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { icon: Activity, label: "Analyze Vitals", q: "Analyze my current vitals for anomalies." },
                      { icon: ClipboardList, label: "Review Records", q: "Summarize my last 3 health records." },
                      { icon: Brain, label: "Brain Health", q: "Recommend cognitive health routine." }
                    ].map((btn, i) => (
                      <button key={i} onClick={() => handleSendMessage(undefined, btn.q)} className="p-6 rounded-3xl bg-white/50 dark:bg-slate-900/50 border border-border hover:border-teal-500/40 hover:scale-[1.02] transition-all text-left shadow-sm">
                        <btn.icon className="w-6 h-6 text-teal-500 mb-4" />
                        <h3 className="font-bold text-sm mb-1">{btn.label}</h3>
                        <p className="text-xs text-muted-foreground">Ask Veridia Intelligence →</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {messages.map((m) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={m.id} className={cn("flex gap-4", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm font-bold text-[10px]", m.role === 'user' ? "bg-white border text-teal-600" : "bg-teal-500 text-white")}>
                        {m.role === 'user' ? 'AS' : <Sparkles className="w-4 h-4" />}
                      </div>
                      <div className={cn("flex flex-col max-w-[85%] md:max-w-[75%]", m.role === 'user' ? "items-end" : "items-start")}>
                        <div className={cn(
                          "px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-sm",
                          m.role === 'user'
                            ? "bg-teal-600 text-white rounded-tr-none"
                            : "bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-border/60 rounded-tl-none bg-gradient-to-br from-teal-500/5 to-blue-500/5"
                        )}>
                          {m.content}
                        </div>
                        <span className="mt-1 text-[9px] font-bold text-muted-foreground uppercase px-2">{formatTime(m.timestamp)}</span>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-teal-500/20"><Sparkles className="w-4 h-4 animate-pulse" /></div>
                      <div className="px-5 py-4 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse text-xs font-medium text-muted-foreground">Veridia is thinking...</div>
                    </div>
                  )}
                  <div ref={scrollRef} className="h-4" />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 md:p-8 bg-gradient-to-t from-background via-background to-transparent pt-12">
          <div className="max-w-4xl mx-auto space-y-4">
            <form onSubmit={handleSendMessage} className="relative group">
              <div className="absolute inset-0 bg-teal-500/20 rounded-[2.5rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-border rounded-[2.5rem] p-2 flex items-center gap-2 shadow-2xl">
                <Button type="button" variant="ghost" size="icon" className="rounded-full h-12 w-12 hover:bg-slate-200 dark:hover:bg-slate-800">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Veridia about your health history..."
                  className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm h-12"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={cn("rounded-full h-12 w-12 transition-all", input.trim() ? "bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-500/20" : "bg-muted")}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </form>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-tighter"><ShieldCheck className="w-3 h-3 text-teal-500" /> HIPAA Compliant</div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-tighter"><Database className="w-3 h-3 text-blue-500" /> Memory Drive Linked</div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-tighter"><Activity className="w-3 h-3 text-rose-500" /> Live Vital Sync</div>
            </div>
            <p className="text-[9px] text-center text-muted-foreground/40 font-bold tracking-[0.2em] uppercase">Note: Request limits apply across infrastructure</p>
          </div>
        </div>
      </main>
    </div>
  );
}