import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { useTheme } from "@/context/ThemeContext";
import { useReadingMode } from "@/context/ReadingModeContext";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, 
  Send, 
  ArrowLeft,
  MessageCircle,
  Plus,
  Clock,
  User,
  Sun,
  Moon,
  BookOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

export default function ChatPage() {
  const { user, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { readingMode, toggleReadingMode, fontSize, increaseFontSize, decreaseFontSize, resetFontSize } = useReadingMode();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showReadingControls, setShowReadingControls] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API}/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Could not load your past conversations.");
    }
  };

  const loadSession = async (sid) => {
    try {
      const response = await axios.get(`${API}/chat/history/${sid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
      setSessionId(sid);
    } catch (error) {
      console.error("Error loading session:", error);
    }
  };

  const startNewSession = () => {
    setMessages([]);
    setSessionId(null);
  };

  const deleteSession = async (e, sid) => {
    e.stopPropagation(); // don't trigger loadSession
    try {
      await axios.delete(`${API}/chat/session/${sid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(prev => prev.filter(s => s.session_id !== sid));
      if (sessionId === sid) startNewSession();
      toast.success("Conversation deleted");
    } catch {
      toast.error("Couldn't remove that conversation. Try again in a moment.");
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage, timestamp: new Date().toISOString() }]);
    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/chat`,
        { message: userMessage, session_id: sessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: response.data.response,
        timestamp: new Date().toISOString()
      }]);
      
      if (!sessionId) {
        setSessionId(response.data.session_id);
        fetchSessions();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const status = error.response?.status;
      const detail = error.response?.data?.detail;
      if (status === 429) {
        toast.error(detail || "Daily message limit reached. Upgrade your plan to continue.", {
          action: { label: "Upgrade", onClick: () => window.location.href = "/pricing" }
        });
      } else {
        toast.error("Something went wrong on our end. Your data is safe — try again in a moment.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background cosmic-page-bg flex">
      {/* Sessions Sidebar */}
      <aside className="w-72 bg-card/50 backdrop-blur-sm border-r border-border flex flex-col h-screen">
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Dashboard</span>
            </Link>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          
          <Button 
            className="w-full bg-primary/10 text-primary hover:bg-primary/20 rounded-xl"
            onClick={startNewSession}
            data-testid="new-chat-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {sessions.map((session) => (
              <div key={session.session_id} className="relative group">
                <button
                  onClick={() => loadSession(session.session_id)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    sessionId === session.session_id 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted'
                  }`}
                  data-testid={`session-${session.session_id}`}
                >
                  <p className="text-sm text-foreground truncate mb-1 pr-6">
                    {session.preview}...
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(session.timestamp).toLocaleDateString()}
                  </div>
                </button>
                <button
                  onClick={(e) => deleteSession(e, session.session_id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            
            {sessions.length === 0 && (
              <div className="text-center py-8">
                <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col h-screen">
        {/* Header */}
        <header className="p-4 border-b border-border bg-card/30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-medium text-foreground">Gab44 AI Coach</h1>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Online - Ready to guide you
                </p>
              </div>
            </div>
            
            {/* Reading Mode Controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReadingControls(!showReadingControls)}
                  className={`h-9 px-3 rounded-xl transition-colors ${
                    readingMode 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'hover:bg-muted'
                  }`}
                  data-testid="reading-mode-btn"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Reading Mode
                </Button>
                
                {showReadingControls && (
                  <div className="absolute right-0 top-full mt-2 z-50 glass-card rounded-xl p-4 shadow-lg w-64">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Reading Mode</span>
                        <button
                          onClick={toggleReadingMode}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            readingMode ? 'bg-primary' : 'bg-muted'
                          }`}
                          data-testid="reading-mode-toggle"
                        >
                          <span className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                            readingMode ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-sm text-foreground">Font Size: {fontSize}px</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={decreaseFontSize}
                            className="h-8 w-8 p-0 rounded-lg"
                            data-testid="decrease-font-btn"
                          >
                            <ZoomOut className="w-4 h-4" />
                          </Button>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${((fontSize - 12) / 12) * 100}%` }}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={increaseFontSize}
                            className="h-8 w-8 p-0 rounded-lg"
                            data-testid="increase-font-btn"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFontSize}
                            className="h-8 w-8 p-0 rounded-lg"
                            data-testid="reset-font-btn"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Reading mode increases line height and letter spacing for better readability.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="font-serif text-xl text-foreground mb-2">
                  Your AI Coach
                </h2>
                <p className="text-muted-foreground mb-2 max-w-md mx-auto leading-relaxed">
                  I have your complete birth chart — every planet, house, and aspect. Ask me about a current transit, a life decision, or what any part of your chart means.
                </p>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Each conversation remembers its context. Start a new session to change topics.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "What do my transits mean today?",
                    "Explain my rising sign",
                    "Career guidance from my chart"
                  ].map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      className="border-border text-sm rounded-xl"
                      onClick={async () => {
                        setInput("");
                        const userMessage = prompt;
                        setMessages(prev => [...prev, { role: "user", content: userMessage, timestamp: new Date().toISOString() }]);
                        setLoading(true);
                        try {
                          const response = await axios.post(
                            `${API}/chat`,
                            { message: userMessage, session_id: sessionId },
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          setMessages(prev => [...prev, { role: "assistant", content: response.data.response, timestamp: new Date().toISOString() }]);
                          if (!sessionId) { setSessionId(response.data.session_id); fetchSessions(); }
                        } catch (error) {
                          const status = error.response?.status;
                          const detail = error.response?.data?.detail;
                          if (status === 429) { toast.error(detail || "Daily message limit reached.", { action: { label: "Upgrade", onClick: () => window.location.href = "/pricing" } }); }
                          else { toast.error("Something went wrong — try again in a moment."); }
                        } finally { setLoading(false); }
                      }}
                      data-testid={`prompt-${prompt.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div 
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                )}
                
                <div 
                  className={`max-w-xl rounded-2xl p-4 ${
                    message.role === 'user' 
                      ? 'chat-bubble-user rounded-tr-sm' 
                      : 'chat-bubble-assistant rounded-tl-sm'
                  }`}
                  data-testid={`message-${index}`}
                >
                  <p 
                    className={`text-foreground whitespace-pre-wrap ${
                      readingMode 
                        ? 'leading-loose tracking-wide' 
                        : 'leading-relaxed'
                    }`}
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {message.content}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="chat-bubble-assistant rounded-2xl rounded-tl-sm p-4">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card/30 backdrop-blur-sm">
          <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your AI coach anything..."
              className="flex-1 bg-muted/30 border-border h-12 rounded-xl focus-glow"
              disabled={loading}
              data-testid="chat-input"
            />
            <Button 
              type="submit" 
              className="bg-primary text-primary-foreground h-12 px-6 rounded-xl"
              disabled={loading || !input.trim()}
              data-testid="send-btn"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
