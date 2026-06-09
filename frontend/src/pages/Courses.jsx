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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Stack,
  Button,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import api from '../services/api';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [sortBy, setSortBy] = useState('Default');

  const navigate = useNavigate();

  useEffect(() => {
    api.get('/courses/')
      .then((res) => {
        setCourses(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch courses:", err);
        setLoading(false);
      });
  }, []);

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategory('All');
    setLevel('All');
    setSortBy('Default');
  };

  const isFilterActive = searchTerm !== '' || category !== 'All' || level !== 'All' || sortBy !== 'Default';

  // Compute filtered courses
  const filteredCourses = courses.filter((course) => {
    // 1. Search filter
    const searchLower = searchTerm.toLowerCase();
    const titleMatch = course.title?.toLowerCase().includes(searchLower);
    const descMatch = course.description?.toLowerCase().includes(searchLower);
    const instMatch = course.instructor?.toLowerCase().includes(searchLower);
    
    let tagsMatch = false;
    if (course.tags) {
      if (Array.isArray(course.tags)) {
        tagsMatch = course.tags.some(tag => tag.toLowerCase().includes(searchLower));
      } else {
        tagsMatch = course.tags.toLowerCase().includes(searchLower);
      }
    }
    const matchesSearch = !searchTerm || titleMatch || descMatch || instMatch || tagsMatch;

    // 2. Category filter
    const matchesCategory = category === 'All' || course.category?.toLowerCase() === category.toLowerCase();

    // 3. Level filter
    const matchesLevel = level === 'All' || course.level?.toLowerCase() === level.toLowerCase();

    return matchesSearch && matchesCategory && matchesLevel;
  });

  // Compute sorted courses
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortBy === 'Highest Rated') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sortBy === 'Lowest Price') {
      return (a.price || 0) - (b.price || 0);
    }
    if (sortBy === 'Most Enrolled') {
      return (b.enrollment_count || 0) - (a.enrollment_count || 0);
    }
    return 0; // Default: Original order
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, py: 8 }}>
        <CircularProgress color="primary" />
      </Box>
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
        📚 All Courses
      </Typography>

      {/* Search and Filters panel */}
      <Card
        sx={{
          p: 3,
          mb: 3,
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          backgroundColor: '#ffffff',
          border: '1px solid #f1f5f9',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="center"
          sx={{ width: '100%' }}
        >
          {/* Search Input */}
          <TextField
            placeholder="Search courses by title, instructor, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            size="small"
            sx={{ maxWidth: { md: '500px' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchTerm('')} edge="end" size="small">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          {/* Category Dropdown */}
          <FormControl size="small" fullWidth sx={{ maxWidth: { md: '180px' } }}>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value)}
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="All">All Categories</MenuItem>
              <MenuItem value="Programming">Programming</MenuItem>
              <MenuItem value="Web Dev">Web Dev</MenuItem>
              <MenuItem value="Data Science">Data Science</MenuItem>
              <MenuItem value="ML">ML</MenuItem>
              <MenuItem value="AI">AI</MenuItem>
              <MenuItem value="Mobile Dev">Mobile Dev</MenuItem>
              <MenuItem value="Cloud">Cloud</MenuItem>
              <MenuItem value="Cybersecurity">Cybersecurity</MenuItem>
              <MenuItem value="Design">Design</MenuItem>
              <MenuItem value="Business">Business</MenuItem>
            </Select>
          </FormControl>

          {/* Level Dropdown */}
          <FormControl size="small" fullWidth sx={{ maxWidth: { md: '150px' } }}>
            <InputLabel id="level-label">Level</InputLabel>
            <Select
              labelId="level-label"
              value={level}
              label="Level"
              onChange={(e) => setLevel(e.target.value)}
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="All">All Levels</MenuItem>
              <MenuItem value="Beginner">Beginner</MenuItem>
              <MenuItem value="Intermediate">Intermediate</MenuItem>
              <MenuItem value="Advanced">Advanced</MenuItem>
            </Select>
          </FormControl>

          {/* Sort Dropdown */}
          <FormControl size="small" fullWidth sx={{ maxWidth: { md: '150px' } }}>
            <InputLabel id="sort-label">Sort By</InputLabel>
            <Select
              labelId="sort-label"
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="Default">Default</MenuItem>
              <MenuItem value="Highest Rated">Highest Rated</MenuItem>
              <MenuItem value="Lowest Price">Lowest Price</MenuItem>
              <MenuItem value="Most Enrolled">Most Enrolled</MenuItem>
            </Select>
          </FormControl>

          {/* Clear Button */}
          {isFilterActive && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                whiteSpace: 'nowrap',
                fontWeight: 600,
                py: 1,
              }}
            >
              Clear
            </Button>
          )}
        </Stack>
      </Card>

      {/* Results count label */}
      <Typography
        variant="body2"
        sx={{
          color: '#64748b',
          fontWeight: 600,
          fontFamily: "'Outfit', sans-serif",
          mb: 3,
        }}
      >
        Showing {sortedCourses.length} of {courses.length} courses
      </Typography>

      {/* Render Grid or Empty State */}
      {sortedCourses.length === 0 ? (
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
          <SearchOffIcon sx={{ fontSize: 70, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#334155', mb: 1, fontFamily: "'Outfit', sans-serif" }}>
            No courses found
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3, fontFamily: "'Outfit', sans-serif" }}>
            Try adjusting your search or filters
          </Typography>
          <Button
            variant="contained"
            onClick={handleClearFilters}
            sx={{
              py: 1,
              px: 3,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Clear All Filters
          </Button>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {sortedCourses.map((course) => {
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
                  }}
                >
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
                      {/* Level Badge - Top Right */}
                      <Chip
                        label={course.level}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
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

