import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Chip,
  Rating,
  CircularProgress,
  Button,
  IconButton,
  Stack,
  Skeleton,
  Container,
  Alert
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function Wishlist() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchWishlist = async (mountedRef) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/users/me/wishlist');
      if (mountedRef.current) {
        setCourses(res.data || []);
      }
    } catch (err) {
      if (mountedRef.current) {
        console.error('Failed to fetch wishlist courses:', err);
        setError(err.response?.data?.detail || err.message || 'Failed to load wishlist');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const mountedRef = { current: true };
    fetchWishlist(mountedRef);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleRemoveFromWishlist = async (e, courseId) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await api.delete(`/courses/${courseId}/wishlist`);
      // Update local state
      setCourses((courses || []).filter((course) => course.id !== courseId));
      toast.success('Removed from wishlist');
      
      // Dispatch custom event to notify Sidebar count update
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove course from wishlist');
    }
  };

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

  return (
    <Box sx={{ flexGrow: 1, py: 2 }}>
      {/* Header */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: '#1e293b',
          fontFamily: "'Outfit', sans-serif",
          mb: 4,
        }}
      >
        ❤️ My Wishlist
      </Typography>

      {courses.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            px: 4,
            textAlign: 'center',
            bgcolor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          }}
        >
          <FavoriteBorderIcon sx={{ fontSize: 70, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#334155', mb: 1, fontFamily: "'Outfit', sans-serif" }}>
            Your wishlist is empty
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3, fontFamily: "'Outfit', sans-serif" }}>
            Explore our catalog to save courses you want to take later.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/courses')}
            endIcon={<ArrowForwardIcon />}
            sx={{
              py: 1.25,
              px: 3,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Browse Courses
          </Button>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {courses.map((course) => {
            const priceText = course.price === 0 || !course.price ? 'FREE' : `$${course.price.toFixed(2)}`;
            const thumbnail = course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500';

            return (
              <Grid item xs={12} sm={6} md={4} key={course.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '16px',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 12px 20px -3px rgba(0, 0, 0, 0.1)',
                    },
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {/* Heart Toggle Button - Top Right Overlay */}
                  <IconButton
                    onClick={(e) => handleRemoveFromWishlist(e, course.id)}
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 10,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      '&:hover': {
                        backgroundColor: '#ffffff',
                        transform: 'scale(1.1)',
                      },
                      transition: 'all 0.2s',
                      color: '#ef4444',
                    }}
                    size="small"
                  >
                    <FavoriteIcon fontSize="small" />
                  </IconButton>

                  <CardActionArea
                    onClick={() => navigate(`/courses/${course.id}`)}
                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    {/* Course Image Container with Badges */}
                    <Box sx={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                      <CardMedia
                        component="img"
                        image={thumbnail}
                        alt={course.title}
                        sx={{
                          height: '100%',
                          width: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      {/* Category Badge - Top Left */}
                      <Chip
                        label={course.category}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          backgroundColor: '#667eea',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          fontFamily: "'Outfit', sans-serif",
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                        }}
                      />
                      {/* Level Badge - below Category badge or slightly shifted */}
                      <Chip
                        label={course.level}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 48,
                          left: 12,
                          backgroundColor: '#ffffff',
                          color: '#475569',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          fontFamily: "'Outfit', sans-serif",
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                        }}
                      />
                    </Box>

                    {/* Course Details Content */}
                    <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography
                        variant="h6"
                        component="h2"
                        sx={{
                          fontWeight: 800,
                          color: '#1e293b',
                          fontFamily: "'Outfit', sans-serif",
                          lineHeight: 1.3,
                          mb: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          height: '2.6rem',
                        }}
                      >
                        {course.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: '#64748b',
                          fontWeight: 500,
                          fontFamily: "'Outfit', sans-serif",
                          mb: 2,
                        }}
                      >
                        By {course.instructor || 'Expert Instructor'}
                      </Typography>

                      <Box sx={{ mt: 'auto' }}>
                        {/* Rating Row */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <Rating
                            value={course.rating || 4.5}
                            precision={0.1}
                            readOnly
                            size="small"
                            sx={{ color: '#f59e0b' }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: '#475569',
                              fontFamily: "'Outfit', sans-serif",
                            }}
                          >
                            {(course.rating || 4.5).toFixed(1)} ({course.enrollment_count || 120})
                          </Typography>
                        </Box>

                        {/* Price Row */}
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 900,
                            color: '#667eea',
                            fontFamily: "'Outfit', sans-serif",
                          }}
                        >
                          {priceText}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
