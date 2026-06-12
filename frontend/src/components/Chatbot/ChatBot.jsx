import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Avatar,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Paper,
  Slide,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import api from '../../services/api';
import ReactMarkdown from 'react-markdown';

const DEFAULT_SUGGESTIONS = [
  "What courses do you recommend for me?",
  "Help me create a learning path",
  "What should I learn first?",
  "How can I become a data scientist?"
];

export default function ChatBot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm CourseRec AI, your learning assistant. Ask me anything about our courses or tell me about your career goals, and I will recommend a personalized learning path!"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [lastSentMessage, setLastSentMessage] = useState('');
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom whenever messages or loading state changes
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      // Fetch initial suggestions from backend
      api.get('/chatbot/suggestions')
        .then((res) => {
          if (res.data && res.data.suggestions) {
            setSuggestions(res.data.suggestions.slice(0, 3));
          }
        })
        .catch((err) => {
          console.error("Failed to load chatbot suggestions:", err);
        });
    }
  }, [isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    // Track last sent message for retry capability
    setLastSentMessage(text);

    // Add user message
    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // Format history (map 'assistant' to 'assistant' / 'model')
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const payload = {
        message: text,
        history: chatHistory,
      };

      const res = await api.post('/chatbot/chat', payload);
      
      const botResponse = {
        role: 'assistant',
        content: res.data.response,
        poweredBy: res.data.powered_by,
        responseTime: res.data.response_time_ms,
      };

      setMessages((prev) => [...prev, botResponse]);
      if (res.data.suggestions && res.data.suggestions.length > 0) {
        setSuggestions(res.data.suggestions);
      } else {
        setSuggestions(DEFAULT_SUGGESTIONS);
      }
    } catch (err) {
      console.log('Chatbot temporarily unavailable');
      const friendlyError = {
        role: 'assistant',
        content: "🙏 I'm taking a quick break! Please try again in a minute. Meanwhile, you can browse courses or check recommendations! 💪"
      };
      setMessages((prev) => [...prev, friendlyError]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Safe ReactMarkdown formatter
  const renderMessageContent = (text, isBot) => {
    if (!text) return '';
    if (!isBot) {
      return (
        <Typography 
          sx={{ 
            fontSize: '0.92rem', 
            lineHeight: 1.5,
            fontFamily: "'Outfit', sans-serif",
            whiteSpace: 'pre-wrap'
          }}
        >
          {text}
        </Typography>
      );
    }

    return (
      <div 
        style={{ 
          fontSize: '0.92rem', 
          lineHeight: 1.5,
          fontFamily: "'Outfit', sans-serif" 
        }}
      >
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <Typography 
                sx={{ 
                  mb: 1, 
                  fontSize: '0.92rem', 
                  lineHeight: 1.5, 
                  fontFamily: "'Outfit', sans-serif" 
                }}
              >
                {children}
              </Typography>
            ),
            strong: ({ children }) => {
              const str = String(children);
              if (str.startsWith("Course ")) {
                return (
                  <Typography 
                    component="div" 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 800, 
                      color: '#4f46e5', 
                      mt: 1.5, 
                      mb: 0.5, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.75,
                      fontSize: '0.95rem',
                      fontFamily: "'Outfit', sans-serif"
                    }}
                  >
                    📚 {str}
                  </Typography>
                );
              }
              return <strong style={{ fontWeight: 700 }}>{children}</strong>;
            },
            ul: ({ children }) => (
              <Box 
                component="ul" 
                sx={{ 
                  pl: 0, 
                  listStyleType: 'none', 
                  my: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 0.5 
                }}
              >
                {children}
              </Box>
            ),
            ol: ({ children }) => (
              <Box 
                component="ol" 
                sx={{ 
                  pl: 2, 
                  my: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 0.5 
                }}
              >
                {children}
              </Box>
            ),
            li: ({ children }) => {
              // Safely extract text content
              const childrenArray = React.Children.toArray(children);
              const fullText = childrenArray.map(c => {
                if (typeof c === 'string') return c;
                if (c && c.props && c.props.children) return String(c.props.children);
                return '';
              }).join('');
              
              const isMetadata = fullText.includes("Level:") || 
                                 fullText.includes("Price:") || 
                                 fullText.includes("Instructor:") || 
                                 fullText.includes("Why:");
                                 
              if (isMetadata) {
                let icon = "•";
                let label = "";
                let value = "";
                
                if (fullText.includes("Level:")) {
                  icon = "📊";
                  label = "Level";
                  value = fullText.split("Level:")[1]?.trim() || '';
                } else if (fullText.includes("Price:")) {
                  icon = "💰";
                  label = "Price";
                  value = fullText.split("Price:")[1]?.trim() || '';
                } else if (fullText.includes("Instructor:")) {
                  icon = "👨‍🏫";
                  label = "Instructor";
                  value = fullText.split("Instructor:")[1]?.trim() || '';
                } else if (fullText.includes("Why:")) {
                  icon = "✨";
                  label = "Why";
                  value = fullText.split("Why:")[1]?.trim() || '';
                }
                
                if (value) {
                  if (label === "Price") {
                    const isFree = value.toUpperCase().includes("FREE");
                    return (
                      <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.25, pl: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                          {icon} {label}:
                        </Typography>
                        <Chip 
                          label={value} 
                          size="small" 
                          sx={{ 
                            bgcolor: isFree ? '#def7ec' : '#e1effe', 
                            color: isFree ? '#03543f' : '#1e429f',
                            fontWeight: 700, 
                            fontSize: '0.75rem',
                            height: '20px'
                          }} 
                        />
                      </Box>
                    );
                  }
                  if (label === "Level") {
                    const valLower = value.toLowerCase();
                    const isBeg = valLower.includes("begin");
                    const isAdv = valLower.includes("adv");
                    const chipBg = isBeg ? '#e1f5fe' : isAdv ? '#fde8e8' : '#fefcbf';
                    const chipColor = isBeg ? '#0288d1' : isAdv ? '#9b1c1c' : '#b7791f';
                    return (
                      <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.25, pl: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                          {icon} {label}:
                        </Typography>
                        <Chip 
                          label={value} 
                          size="small" 
                          sx={{ 
                            bgcolor: chipBg, 
                            color: chipColor,
                            fontWeight: 700, 
                            fontSize: '0.75rem',
                            height: '20px'
                          }} 
                        />
                      </Box>
                    );
                  }
                  return (
                    <Box component="div" sx={{ my: 0.25, pl: 1, fontFamily: "'Outfit', sans-serif" }}>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.4, fontFamily: "'Outfit', sans-serif" }}>
                        {icon} <strong>{label}:</strong> {value}
                      </Typography>
                    </Box>
                  );
                }
              }
              
              return (
                <Box component="li" sx={{ fontSize: '0.88rem', color: '#334155', ml: 1, my: 0.25, fontFamily: "'Outfit', sans-serif" }}>
                  {children}
                </Box>
              );
            },
            h3: ({ children }) => (
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 800, 
                  color: '#1e293b', 
                  mt: 2, 
                  mb: 1, 
                  borderBottom: '1px solid #e2e8f0', 
                  pb: 0.5,
                  fontSize: '0.92rem',
                  fontFamily: "'Outfit', sans-serif"
                }}
              >
                {children}
              </Typography>
            )
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
      <Card
        sx={{
          position: 'fixed',
          bottom: { xs: 0, sm: 100 },
          right: { xs: 0, sm: 30 },
          width: { xs: '100vw', sm: 380 },
          height: { xs: '100vh', sm: 600 },
          borderRadius: { xs: 0, sm: '16px' },
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            px: 2.5,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 10px rgba(118, 75, 162, 0.25)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                width: 36,
                height: 36,
              }}
            >
              <SmartToyIcon sx={{ color: '#ffffff' }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif", fontSize: '0.95rem' }}>
                CourseRec AI Assistant
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 6, height: 6, bgcolor: '#22c55e', borderRadius: '50%' }} />
                <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600, fontSize: '0.75rem', fontFamily: "'Outfit', sans-serif" }}>
                  Online
                </Typography>
              </Box>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: '#ffffff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Message Log Body */}
        <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {messages.map((msg, index) => {
            const isBot = msg.role === 'assistant';
            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignSelf: isBot ? 'flex-start' : 'flex-end',
                  flexDirection: isBot ? 'row' : 'row-reverse',
                  gap: 1.25,
                  maxWidth: '85%',
                }}
              >
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: isBot ? '#f1f5f9' : '#667eea',
                    color: isBot ? '#475569' : '#ffffff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  {isBot ? <SmartToyIcon sx={{ fontSize: 16 }} /> : <PersonIcon sx={{ fontSize: 16 }} />}
                </Avatar>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isBot ? 'flex-start' : 'flex-end' }}>
                  <Paper
                    sx={{
                      p: 1.5,
                      borderRadius: isBot ? '0px 12px 12px 12px' : '12px 0px 12px 12px',
                      bgcolor: isBot ? '#ffffff' : '#667eea',
                      color: isBot ? '#1e293b' : '#ffffff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      border: isBot ? '1px solid #f1f5f9' : 'none',
                    }}
                  >
                    {renderMessageContent(msg.content, isBot)}
                  </Paper>

                  {/* Debug / Provider Info */}
                  {isBot && (msg.poweredBy || msg.responseTime) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5, px: 0.5, opacity: 0.6 }}>
                      {msg.poweredBy && (
                        <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', fontFamily: "'Outfit', sans-serif" }}>
                          ⚡ {msg.poweredBy}
                        </Typography>
                      )}
                      {msg.responseTime && (
                        <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#64748b', fontFamily: "'Outfit', sans-serif" }}>
                          ⏱️ {msg.responseTime} ms
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <Box sx={{ display: 'flex', alignSelf: 'flex-start', gap: 1.25, maxWidth: '85%' }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: '#f1f5f9' }}>
                <SmartToyIcon sx={{ fontSize: 16, color: '#475569' }} />
              </Avatar>
              <Paper sx={{ p: 1.5, borderRadius: '0px 12px 12px 12px', bgcolor: '#ffffff', border: '1px solid #f1f5f9' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, fontFamily: "'Outfit', sans-serif" }}>
                    🤖 AI is thinking...
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Box sx={{ width: 6, height: 6, bgcolor: '#667eea', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }} />
                    <Box sx={{ width: 6, height: 6, bgcolor: '#667eea', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }} />
                    <Box sx={{ width: 6, height: 6, bgcolor: '#667eea', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }} />
                  </Box>
                </Box>
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Suggestion Chips */}
        {suggestions.length > 0 && (
          <Box sx={{ px: 2, py: 1, borderTop: '1px solid #f1f5f9', bgcolor: '#ffffff' }}>
            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
              {suggestions.map((suggestion, idx) => (
                <Chip
                  key={idx}
                  label={suggestion}
                  onClick={() => handleSend(suggestion)}
                  disabled={loading}
                  clickable
                  size="small"
                  sx={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: '#667eea',
                    borderColor: '#e2e8f0',
                    bgcolor: 'rgba(102, 126, 234, 0.05)',
                    '&:hover': {
                      bgcolor: 'rgba(102, 126, 234, 0.12)',
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Input Textbox Area */}
        <Box sx={{ p: 1.5, borderTop: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <TextField
            placeholder="Ask me anything about courses..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            fullWidth
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => handleSend()}
                    disabled={loading || !inputValue.trim()}
                    sx={{
                      color: '#667eea',
                      '&:hover': {
                        bgcolor: 'rgba(102, 126, 234, 0.08)',
                      },
                    }}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: '24px',
                fontFamily: "'Outfit', sans-serif",
              }
            }}
          />
        </Box>

        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0.3); opacity: 0.3; }
            40% { transform: scale(1.0); opacity: 1.0; }
          }
        `}</style>
      </Card>
    </Slide>
  );
}
