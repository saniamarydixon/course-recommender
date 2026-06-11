import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Stack,
  LinearProgress,
  CircularProgress,
  Alert
} from '@mui/material';
import BookIcon from '@mui/icons-material/Book';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import api from '../services/api';

export default function Dashboard() {
  const [username, setUsername] = useState('User');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 26,
    recommendations: 9,
    enrolledCourses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // Read username from localStorage immediately
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        setUsername(userObj.full_name || userObj.username || 'User');
      } catch (e) {
        console.error(e);
      }
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const meRes = await api.get('/users/me');
        if (mounted) {
          setUsername(meRes.data.full_name || meRes.data.username || 'User');
          localStorage.setItem('user', JSON.stringify(meRes.data));
        }

        // Fetch courses to get total count
        const coursesRes = await api.get('/courses/');
        const totalC = coursesRes.data?.length || 26;

        // Fetch enrolled courses
        const enrollRes = await api.get('/users/me/enrolled-courses');
        const enrolledC = enrollRes.data?.length || 0;
        
        if (mounted) {
          setEnrolledCourses(enrollRes.data || []);
        }

        // Fetch recommendations history
        const recRes = await api.get('/recommendations/history');
        const recC = recRes.data?.length || 9;

        if (mounted) {
          setStats({
            totalCourses: totalC,
            recommendations: recC,
            enrolledCourses: enrolledC,
          });
        }
      } catch (err) {
        if (mounted) {
          console.error("Failed to load dashboard statistics:", err);
          setError(err.response?.data?.detail || err.message || 'Failed to load dashboard statistics');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  // ALWAYS show loading exactly as requested
  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2, fontFamily: "'Outfit', sans-serif" }}>Loading...</Typography>
      </Container>
    );
  }

  // ALWAYS show error exactly as requested
  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 2, fontFamily: "'Outfit', sans-serif" }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

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

  const inProgressCourses = (enrolledCourses || []).filter(item => item && item.progress < 100);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
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

      {/* Continue Learning Section */}
      {inProgressCourses.length > 0 && (
        <Box sx={{ mb: 5 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#1e293b',
              fontFamily: "'Outfit', sans-serif",
              mb: 3,
            }}
          >
            🏃 Continue Learning
          </Typography>
          <Grid container spacing={3}>
            {inProgressCourses.map((item) => {
              const c = item.course;
              if (!c) return null;
              const thumbnail = c.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500';
              return (
                <Grid item xs={12} sm={6} md={4} key={c.id}>
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
                    <Box sx={{ height: 140, overflow: 'hidden', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                      <img
                        src={thumbnail}
                        alt={c.title}
                        style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 800,
                          color: '#1e293b',
                          fontFamily: "'Outfit', sans-serif",
                          lineHeight: 1.3,
                          mb: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          height: '2.6rem',
                        }}
                      >
                        {c.title}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', fontFamily: "'Outfit', sans-serif" }}>
                            Progress
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#667eea', fontFamily: "'Outfit', sans-serif" }}>
                            {item.progress}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={item.progress}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor: '#667eea',
                            },
                          }}
                        />
                      </Box>

                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => navigate(`/courses/${c.id}`)}
                        sx={{
                          py: 1,
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontFamily: "'Outfit', sans-serif",
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          boxShadow: '0 2px 4px rgba(102, 126, 234, 0.2)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5a6fd6 0%, #683fa3 100%)',
                          },
                        }}
                      >
                        Resume Learning
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

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
    </Container>
  );
}
