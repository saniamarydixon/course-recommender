import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  Tabs,
  Tab,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Chip,
  Skeleton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SchoolIcon from '@mui/icons-material/School';
import InfoIcon from '@mui/icons-material/Info';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const navigate = useNavigate();

  const fetchNotifications = async (signal) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/notifications/', { signal });
      setNotifications(res.data);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        console.error('Failed to fetch notifications:', err);
        setError(err.message || 'Failed to load notifications');
        toast.error('Failed to load notifications');
      }
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchNotifications(controller.signal);
    return () => {
      controller.abort();
    };
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(
        (notifications || []).map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      toast.success('Notification marked as read');
      window.dispatchEvent(new Event('wishlistUpdated')); // Reuse event dispatch to refresh count in layout
    } catch (err) {
      console.error(err);
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((notifications || []).map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((notifications || []).filter((n) => n.id !== id));
      toast.success('Notification deleted');
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete notification');
    }
  };

  const handleTabChange = (event, newValue) => {
    setFilterType(newValue);
  };

  const filteredNotifications = (notifications || []).filter((notif) => {
    if (filterType === 'all') return true;
    return notif.type === filterType;
  });

  const getNotifIcon = (type) => {
    switch (type) {
      case 'recommendation':
        return <AutoAwesomeIcon sx={{ color: '#764ba2' }} />;
      case 'enrollment':
        return <SchoolIcon sx={{ color: '#667eea' }} />;
      default:
        return <InfoIcon sx={{ color: '#3b82f6' }} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, py: 2 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: '#1e293b',
            fontFamily: "'Outfit', sans-serif",
            mb: 4,
          }}
        >
          🔔 Notification Center
        </Typography>
        <Stack spacing={2}>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: '12px' }} />
          ))}
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', mt: 8 }}>
        <Typography variant="h5" color="error" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 1 }}>
          😕 Failed to load notifications
        </Typography>
        <Typography sx={{ my: 2, color: 'text.secondary', fontFamily: "'Outfit', sans-serif" }}>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            fontFamily: "'Outfit', sans-serif",
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Box sx={{ flexGrow: 1, py: 2 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: '#1e293b',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          🔔 Notification Center
        </Typography>

        {unreadCount > 0 && (
          <Button
            variant="outlined"
            onClick={handleMarkAllRead}
            startIcon={<MarkEmailReadIcon />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              borderColor: '#e2e8f0',
              color: '#667eea',
              '&:hover': {
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.04)',
              },
            }}
          >
            Mark all as read
          </Button>
        )}
      </Stack>

      {/* Tabs Filter */}
      <Card sx={{ mb: 4, borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: 'none' }}>
        <Tabs
          value={filterType}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{
            px: 2,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600,
              textTransform: 'none',
              minWidth: 100,
            },
          }}
        >
          <Tab label="All" value="all" />
          <Tab label="Recommendations" value="recommendation" />
          <Tab label="Enrollments" value="enrollment" />
          <Tab label="System" value="system" />
        </Tabs>
      </Card>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card
          sx={{
            py: 8,
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px solid #f1f5f9',
            boxShadow: 'none',
          }}
        >
          <NotificationsIcon sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#334155', mb: 1, fontFamily: "'Outfit', sans-serif" }}>
            No notifications found
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontFamily: "'Outfit', sans-serif" }}>
            We'll let you know when something new and exciting happens!
          </Typography>
        </Card>
      ) : (
        <Card sx={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: 'none', overflow: 'hidden' }}>
          <List sx={{ p: 0 }}>
            {filteredNotifications.map((notif, idx) => (
              <Box key={notif.id}>
                {idx > 0 && <Divider />}
                <ListItem
                  sx={{
                    py: 2.5,
                    px: { xs: 2, sm: 3 },
                    backgroundColor: notif.is_read ? 'transparent' : 'rgba(102, 126, 234, 0.03)',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2,
                  }}
                >
                  {/* Icon */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, bgcolor: 'rgba(102, 126, 234, 0.06)', borderRadius: '10px' }}>
                    {getNotifIcon(notif.type)}
                  </Box>

                  {/* Content */}
                  <Box sx={{ flexGrow: 1, cursor: notif.link ? 'pointer' : 'default' }} onClick={() => notif.link && navigate(notif.link)}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: notif.is_read ? 600 : 800,
                          color: '#1e293b',
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: '1rem',
                        }}
                      >
                        {notif.title}
                      </Typography>
                      {!notif.is_read && (
                        <Chip
                          label="New"
                          size="small"
                          color="primary"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            fontFamily: "'Outfit', sans-serif",
                          }}
                        />
                      )}
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#475569',
                        fontFamily: "'Outfit', sans-serif",
                        lineHeight: 1.4,
                      }}
                    >
                      {notif.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block' }}>
                      {new Date(notif.created_at).toLocaleString()}
                    </Typography>
                  </Box>

                  {/* Actions */}
                  <Stack direction="row" spacing={1} alignSelf={{ xs: 'flex-end', sm: 'center' }}>
                    {!notif.is_read && (
                      <IconButton
                        color="primary"
                        onClick={() => handleMarkRead(notif.id)}
                        title="Mark as read"
                        sx={{ '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.08)' } }}
                      >
                        <MarkEmailReadIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(notif.id)}
                      title="Delete"
                      sx={{ '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </ListItem>
              </Box>
            ))}
          </List>
        </Card>
      )}
    </Box>
  );
}
