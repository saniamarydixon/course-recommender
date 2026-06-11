import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Badge,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteIcon from '@mui/icons-material/Favorite';
import TimelineIcon from '@mui/icons-material/Timeline';
import api from '../../services/api';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Courses', icon: <LibraryBooksIcon />, path: '/courses' },
  { text: 'AI Recommendations', icon: <AutoAwesomeIcon />, path: '/recommendations' },
  { text: 'Wishlist', icon: <FavoriteIcon />, path: '/wishlist' },
  { text: 'Learning Paths', icon: <TimelineIcon />, path: '/learning-paths' },
  { text: 'My Profile', icon: <PersonIcon />, path: '/profile' },
];

export default function Sidebar({ mobileOpen, handleDrawerToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [wishlistCount, setWishlistCount] = useState(0);

  const fetchWishlistCount = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      if (!token) return;
      const res = await api.get('/users/me/wishlist');
      setWishlistCount(res.data?.length || 0);
    } catch (err) {
      console.error("Failed to fetch wishlist count:", err);
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    fetchWishlistCount();
  }, [location.pathname]);

  useEffect(() => {
    const handleWishlistUpdate = () => {
      fetchWishlistCount();
    };

    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, []);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Area */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
          color: '#fff',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '0.5px',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          CourseRec AI
        </Typography>
      </Box>

      {/* Menu List */}
      <List sx={{ px: 2, py: 3, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (mobileOpen) {
                    handleDrawerToggle();
                  }
                }}
                sx={{
                  borderRadius: '12px',
                  py: 1.5,
                  px: 2.5,
                  backgroundColor: isActive ? 'rgba(102, 126, 234, 0.15)' : 'transparent',
                  color: isActive ? '#667eea' : '#64748b',
                  '&:hover': {
                    backgroundColor: 'rgba(102, 126, 234, 0.08)',
                    color: '#667eea',
                    '& .MuiListItemIcon-root': {
                      color: '#667eea',
                    },
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? '#667eea' : '#94a3b8',
                    minWidth: '40px',
                    transition: 'color 0.2s ease-in-out',
                  }}
                >
                  {item.text === 'Wishlist' ? (
                    <Badge badgeContent={wishlistCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', height: 16, minWidth: 16 } }}>
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.95rem',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            borderRight: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            borderRight: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
