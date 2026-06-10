import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  IconButton,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Sidebar from './Sidebar';
import api from '../../services/api';
import ChatButton from '../Chatbot/ChatButton';

const DRAWER_WIDTH = 260;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error("Failed to fetch unread notifications count:", err);
    }
  };

  const fetchRecentNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await api.get('/notifications/?limit=5');
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch recent notifications:", err);
    }
  };

  const handleNotifOpen = (event) => {
    setNotifAnchor(event.currentTarget);
    fetchRecentNotifications();
  };

  const handleNotifClose = () => {
    setNotifAnchor(null);
  };

  const handleNotificationClick = async (notif) => {
    handleNotifClose();
    if (!notif.is_read) {
      try {
        await api.put(`/notifications/${notif.id}/read`);
        fetchUnreadCount();
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchUnreadCount();
      fetchRecentNotifications();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  useEffect(() => {
    // Load initial user details from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }

    // Fetch latest user details from API
    api.get('/users/me')
      .then(res => {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      })
      .catch(err => {
        console.error("Failed to fetch current user profile:", err);
      });

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Get display name
  const displayName = user ? (user.full_name || user.username) : 'User';
  const displayLetter = displayName.charAt(0).toUpperCase();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <CssBaseline />

      {/* Top Header */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          boxShadow: 'none',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          color: '#1e293b',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          {/* Menu button for mobile */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Page Title or Breadcrumb (optional, can be empty or just generic) */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              fontSize: '1.25rem',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Learning Platform
          </Typography>
          <Box sx={{ display: { xs: 'block', sm: 'none' } }} />

          {/* User profile dropdown and Logout */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Notification Bell */}
            <IconButton
              color="inherit"
              onClick={handleNotifOpen}
              sx={{
                color: '#64748b',
                '&:hover': {
                  color: '#667eea',
                  backgroundColor: 'rgba(102, 126, 234, 0.08)',
                },
              }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* Notifications Popover */}
            <Popover
              open={Boolean(notifAnchor)}
              anchorEl={notifAnchor}
              onClose={handleNotifClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  width: 320,
                  maxWidth: '100%',
                  borderRadius: '16px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #f1f5f9',
                },
              }}
            >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                  Notifications
                </Typography>
                {unreadCount > 0 && (
                  <Button
                    size="small"
                    onClick={handleMarkAllRead}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}
                  >
                    Mark all read
                  </Button>
                )}
              </Box>
              <Divider />
              <List sx={{ p: 0, maxHeight: 300, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', fontFamily: "'Outfit', sans-serif" }}>
                      No notifications yet
                    </Typography>
                  </ListItem>
                ) : (
                  notifications.map((notif) => (
                    <Box key={notif.id}>
                      <ListItem
                        onClick={() => handleNotificationClick(notif)}
                        sx={{
                          py: 1.5,
                          px: 2,
                          backgroundColor: notif.is_read ? 'transparent' : 'rgba(102, 126, 234, 0.04)',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          },
                          display: 'block'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: notif.is_read ? 500 : 700,
                                color: '#1e293b',
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: '0.875rem',
                              }}
                            >
                              {notif.title}
                            </Typography>
                          }
                          secondary={
                            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#64748b',
                                  fontFamily: "'Outfit', sans-serif",
                                  lineHeight: 1.3,
                                  display: 'block'
                                }}
                              >
                                {notif.message}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>
                                {new Date(notif.created_at).toLocaleDateString()}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </Box>
                  ))
                )}
              </List>
              <Box sx={{ p: 1.5, textAlign: 'center' }}>
                <Button
                  fullWidth
                  size="small"
                  onClick={() => {
                    handleNotifClose();
                    navigate('/notifications');
                  }}
                  sx={{ textTransform: 'none', fontWeight: 700, fontFamily: "'Outfit', sans-serif", fontSize: '0.8rem' }}
                >
                  View All Notifications
                </Button>
              </Box>
            </Popover>

            <Box
              onClick={handleMenuOpen}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                p: 0.5,
                pr: 1.5,
                borderRadius: '50px',
                transition: 'background-color 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: '#667eea',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: '0 2px 4px rgba(102, 126, 234, 0.25)',
                }}
              >
                {displayLetter}
              </Avatar>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#334155',
                  fontFamily: "'Outfit', sans-serif",
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {displayName}
              </Typography>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1,
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid #f1f5f9',
                  minWidth: 150,
                },
              }}
            >
              <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }} sx={{ py: 1.25, px: 2, fontFamily: "'Outfit', sans-serif" }}>
                My Profile
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); handleLogout(); }} sx={{ py: 1.25, px: 2, color: '#ef4444', fontFamily: "'Outfit', sans-serif" }}>
                Logout
              </MenuItem>
            </Menu>

            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontFamily: "'Outfit', sans-serif",
                borderColor: '#fee2e2',
                color: '#ef4444',
                backgroundColor: '#fef2f2',
                '&:hover': {
                  backgroundColor: '#fee2e2',
                  borderColor: '#fca5a5',
                },
                display: { xs: 'none', md: 'inline-flex' },
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          mt: '64px',
        }}
      >
        <Outlet />
      </Box>

      {/* Floating AI Chatbot Assistant */}
      <ChatButton />
    </Box>
  );
}
