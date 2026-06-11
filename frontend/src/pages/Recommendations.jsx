import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Rating,
  CircularProgress,
  OutlinedInput,
  CardActionArea,
  CardMedia,
  IconButton,
  Skeleton,
  Container,
  Alert
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { toast } from 'react-toastify';
import api from '../services/api';

const CATEGORIES = [
  'Programming',
  'Web Dev',
  'Data Science',
  'ML',
  'AI',
  'Mobile Dev',
  'Cloud',
  'Cybersecurity',
  'Design',
  'Business',
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const ALGORITHMS = ['Rule-Based (Default)', 'Collaborative Filtering', 'Content-Based'];

export default function Recommendations() {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('Rule-Based (Default)');
  const [recommendations, setRecommendations] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  const handleWishlistToggle = async (e, courseId) => {
    e.stopPropagation();
    e.preventDefault();
    const isWishlisted = wishlistIds.includes(courseId);
    try {
      if (isWishlisted) {
        await api.delete(`/courses/${courseId}/wishlist`);
        setWishlistIds(wishlistIds.filter(id => id !== courseId));
        toast.success('Removed from wishlist');
      } else {
        await api.post(`/courses/${courseId}/wishlist`);
        setWishlistIds([...wishlistIds, courseId]);
        toast.success('Added to wishlist!');
      }
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update wishlist');
    }
  };

  const handleCategoryChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedCategories(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value
    );
  };

  const fetchRecommendations = async (mountedRef) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        limit: 9,
        categories: selectedCategories.length > 0 ? selectedCategories : null,
        level: selectedLevel || null,
      };

      let algoParam = 'hybrid';
      if (selectedAlgorithm === 'Collaborative Filtering') {
        algoParam = 'collaborative';
      } else if (selectedAlgorithm === 'Content-Based') {
        algoParam = 'content';
      }

      const response = await api.post(`/recommendations/generate?algorithm=${algoParam}`, payload);
      if (mountedRef.current) {
        setRecommendations(response.data || []);
      }
    } catch (err) {
      if (mountedRef.current) {
        console.error(err);
        setError(err.response?.data?.detail || err.message || 'Failed to generate recommendations');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const fetchWishlist = async (mountedRef) => {
    try {
      const res = await api.get('/users/me/wishlist');
      if (mountedRef.current) {
        setWishlistIds((res.data || []).map(c => c.id));
      }
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    }
  };

  useEffect(() => {
    const mountedRef = { current: true };
    fetchRecommendations(mountedRef);
    fetchWishlist(mountedRef);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleRegenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const payload = {
        limit: 9,
        categories: selectedCategories.length > 0 ? selectedCategories : null,
        level: selectedLevel || null,
      };

      let algoParam = 'hybrid';
      if (selectedAlgorithm === 'Collaborative Filtering') {
        algoParam = 'collaborative';
      } else if (selectedAlgorithm === 'Content-Based') {
        algoParam = 'content';
      }

      const response = await api.post(`/recommendations/generate?algorithm=${algoParam}`, payload);
      setRecommendations(response.data);
      toast.success('Recommendations regenerated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate recommendations');
    } finally {
      setGenerating(false);
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
        ✨ AI Recommendation Center
      </Typography>

      {/* Filter Bar */}
      <Card
        sx={{
          mb: 4,
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Focus Categories */}
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="categories-label" sx={{ fontFamily: "'Outfit', sans-serif" }}>Focus Categories</InputLabel>
                <Select
                  labelId="categories-label"
                  multiple
                  value={selectedCategories}
                  onChange={handleCategoryChange}
                  input={<OutlinedInput label="Focus Categories" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                  sx={{ borderRadius: '8px' }}
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat} sx={{ fontFamily: "'Outfit', sans-serif" }}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Target Level */}
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="level-label" sx={{ fontFamily: "'Outfit', sans-serif" }}>Target Level</InputLabel>
                <Select
                  labelId="level-label"
                  value={selectedLevel}
                  label="Target Level"
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="" sx={{ fontFamily: "'Outfit', sans-serif" }}>All Levels</MenuItem>
                  {LEVELS.map((lvl) => (
                    <MenuItem key={lvl} value={lvl} sx={{ fontFamily: "'Outfit', sans-serif" }}>
                      {lvl}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Algorithm Mode */}
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="algo-label" sx={{ fontFamily: "'Outfit', sans-serif" }}>Algorithm Mode</InputLabel>
                <Select
                  labelId="algo-label"
                  value={selectedAlgorithm}
                  label="Algorithm Mode"
                  onChange={(e) => setSelectedAlgorithm(e.target.value)}
                  sx={{ borderRadius: '8px' }}
                >
                  {ALGORITHMS.map((algo) => (
                    <MenuItem key={algo} value={algo} sx={{ fontFamily: "'Outfit', sans-serif" }}>
                      {algo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Regenerate Button */}
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleRegenerate}
                disabled={generating || loading}
                startIcon={<AutoAwesomeIcon />}
                sx={{
                  py: 1.25,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontFamily: "'Outfit', sans-serif",
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd6 0%, #683fa3 100%)',
                  },
                }}
              >
                {generating ? 'Regenerating...' : 'Regenerate'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Recommended Content */}
      <Box>
          {/* Header Title with Counts */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#1e293b',
              fontFamily: "'Outfit', sans-serif",
              mb: 3,
            }}
          >
            Recommended Learning Paths ({(recommendations || []).length} courses)
          </Typography>

          {(recommendations || []).length === 0 ? (
            <Typography variant="body1" sx={{ color: '#64748b', textAlign: 'center', mt: 4, fontFamily: "'Outfit', sans-serif" }}>
              No recommendations found matching these filters. Try choosing different categories or levels.
            </Typography>
          ) : (
            <Grid container spacing={4}>
              {(recommendations || []).map((rec) => {
                const course = rec.course;
                if (!course) return null;

                const priceText = course.price === 0 || !course.price ? 'FREE' : `$${course.price.toFixed(2)}`;
                const thumbnail = course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500';
                const matchPct = Math.round(rec.score * 100);

                return (
                  <Grid item xs={12} sm={6} md={4} key={rec.id}>
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
                        onClick={(e) => handleWishlistToggle(e, course.id)}
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
                          color: wishlistIds.includes(course.id) ? '#ef4444' : '#64748b',
                        }}
                        size="small"
                      >
                        {wishlistIds.includes(course.id) ? (
                          <FavoriteIcon fontSize="small" />
                        ) : (
                          <FavoriteBorderIcon fontSize="small" />
                        )}
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
                            }}
                          />
                          {/* Match Score Badge - Top Right */}
                          <Chip
                            label={`${matchPct}% Match`}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              backgroundColor: '#22c55e',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              fontFamily: "'Outfit', sans-serif",
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
                              mb: 1,
                            }}
                          >
                            By {course.instructor || 'Expert Instructor'}
                          </Typography>

                          {/* Recommendation Reason Banner */}
                          {rec.reason && (
                            <Box
                              sx={{
                                p: 1,
                                px: 1.5,
                                borderRadius: '8px',
                                backgroundColor: 'rgba(102, 126, 234, 0.08)',
                                border: '1px dashed rgba(102, 126, 234, 0.3)',
                                mb: 2,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#764ba2',
                                  fontWeight: 600,
                                  fontFamily: "'Outfit', sans-serif",
                                  display: 'block',
                                }}
                              >
                                ✨ {rec.reason}
                              </Typography>
                            </Box>
                          )}

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

                            {/* Price and Level Row */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#64748b',
                                  fontWeight: 600,
                                  fontFamily: "'Outfit', sans-serif",
                                }}
                              >
                                {course.level}
                              </Typography>
                            </Box>
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
    </Box>
  );
}
