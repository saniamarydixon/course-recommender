import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Stack,
  useTheme,
} from '@mui/material';
import BookIcon from '@mui/icons-material/Book';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import api from '../services/api';

export default function Dashboard() {
  const [username, setUsername] = useState('User');
  const [stats, setStats] = useState({
    totalCourses: 25,
    recommendations: 9,
    enrolledCourses: 0,
  });
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    // Read username from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        setUsername(userObj.full_name || userObj.username || 'User');
      } catch (e) {
        console.error(e);
      }
    }

    // Fetch latest user details and actual counts
    const fetchDashboardData = async () => {
      try {
        const meRes = await api.get('/users/me');
        setUsername(meRes.data.full_name || meRes.data.username || 'User');
        localStorage.setItem('user', JSON.stringify(meRes.data));

        // Fetch courses to get total count
        const coursesRes = await api.get('/courses/');
        const totalC = coursesRes.data.length || 25;

        // Fetch enrolled courses
        const enrollRes = await api.get('/users/me/enrolled-courses');
        const enrolledC = enrollRes.data.length || 0;

        // Fetch recommendations history
        const recRes = await api.get('/recommendations/history');
        const recC = recRes.data.length || 9;

        setStats({
          totalCourses: totalC,
          recommendations: recC,
          enrolledCourses: enrolledC,
        });
      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      }
    };

    fetchDashboardData();
  }, []);

  const statsCards = [
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      icon: <BookIcon sx={{ fontSize: 40, color: '#667eea' }} />,
      bgColor: 'rgba(102, 126, 234, 0.08)',
    },
    {
      title: 'AI Recommendations',
      value: stats.recommendations,
      icon: <AutoAwesomeIcon sx={{ fontSize: 40, color: '#764ba2' }} />,
      bgColor: 'rgba(118, 75, 162, 0.08)',
    },
    {
      title: 'Enrolled Courses',
      value: stats.enrolledCourses,
      icon: <SchoolIcon sx={{ fontSize: 40, color: '#22c55e' }} />,
      bgColor: 'rgba(34, 197, 94, 0.08)',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, py: 2 }}>
      {/* Welcome Banner */}
      <Card
        sx={{
          mb: 4,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#ffffff',
          boxShadow: '0 10px 20px rgba(102, 126, 234, 0.2)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={2} sx={{ maxWidth: '600px', zIndex: 2, position: 'relative' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
              Welcome back, {username}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, fontFamily: "'Outfit', sans-serif" }}>
              Discover curated paths, unlock intelligence-driven course recommendations, and advance your professional skills today.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Statistics Section */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          color: '#1e293b',
          fontFamily: "'Outfit', sans-serif",
          mb: 3,
        }}
      >
        Overview Statistics
      </Typography>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        {statsCards.map((card, idx) => (
          <Grid item xs={12} sm={4} key={idx}>
            <Card
              sx={{
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 1, fontFamily: "'Outfit', sans-serif" }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: '#1e293b', fontFamily: "'Outfit', sans-serif" }}>
                    {card.value}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: card.bgColor,
                    borderRadius: '16px',
                  }}
                >
                  {card.icon}
                </Avatar>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          color: '#1e293b',
          fontFamily: "'Outfit', sans-serif",
          mb: 3,
        }}
      >
        Quick Actions
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/courses')}
            startIcon={<SearchIcon />}
            sx={{
              py: 2.5,
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              fontFamily: "'Outfit', sans-serif",
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd6 0%, #683fa3 100%)',
                transform: 'scale(1.02)',
              },
              transition: 'all 0.2s',
            }}
          >
            Browse Courses
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/recommendations')}
            startIcon={<AutoAwesomeIcon />}
            sx={{
              py: 2.5,
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              fontFamily: "'Outfit', sans-serif",
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd6 0%, #683fa3 100%)',
                transform: 'scale(1.02)',
              },
              transition: 'all 0.2s',
            }}
          >
            Get Recommendations
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/profile')}
            startIcon={<PersonIcon />}
            sx={{
              py: 2.5,
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              fontFamily: "'Outfit', sans-serif",
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd6 0%, #683fa3 100%)',
                transform: 'scale(1.02)',
              },
              transition: 'all 0.2s',
            }}
          >
            View Profile
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
