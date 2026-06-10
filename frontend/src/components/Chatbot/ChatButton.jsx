import React, { useState } from 'react';
import { Box, Fab, Zoom } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ChatBot from './ChatBot';

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box sx={{ position: 'fixed', bottom: 30, right: 30, zIndex: 9999 }}>
      {/* The Chat Button */}
      <Zoom in={true} style={{ transitionDelay: '300ms' }}>
        <Fab
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            width: 60,
            height: 60,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.5)',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: '0 6px 24px rgba(102, 126, 234, 0.7)',
            },
            '@keyframes pulse': {
              '0%': {
                boxShadow: '0 0 0 0 rgba(102, 126, 234, 0.4)',
              },
              '70%': {
                boxShadow: '0 0 0 15px rgba(102, 126, 234, 0)',
              },
              '100%': {
                boxShadow: '0 0 0 0 rgba(102, 126, 234, 0)',
              },
            },
            animation: isOpen ? 'none' : 'pulse 2s infinite',
          }}
        >
          <SmartToyIcon sx={{ fontSize: 30 }} />
        </Fab>
      </Zoom>

      {/* The Chat Window Panel */}
      <ChatBot isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </Box>
  );
}
