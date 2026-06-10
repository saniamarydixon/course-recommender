import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Checkbox,
  FormControlLabel,
  FormGroup,
  Slider,
  Radio,
  RadioGroup,
  Pagination,
  Divider,
  Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FilterListIcon from '@mui/icons-material/FilterList';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
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
  'Business'
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const SORT_OPTIONS = [
  'Default',
  'Highest Rated',
  'Lowest Price',
  'Highest Price',
  'Most Popular',
  'Newest',
  'Shortest',
  'Longest'
];

const DURATIONS = [
  { label: 'Under 10 hours', value: 'under-10' },
  { label: '10-30 hours', value: '10-30' },
  { label: '30-50 hours', value: '30-50' },
  { label: '50+ hours', value: 'over-50' }
];

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Retrieve current active filters from URL search parameters
  const categories = searchParams.get('category') ? searchParams.get('category').split(',') : [];
  const levels = searchParams.get('level') ? searchParams.get('level').split(',') : [];
  const minPrice = searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')) : 0;
  const maxPrice = searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')) : 200;
  const isFree = searchParams.get('is_free') === 'true';
  const minRating = searchParams.get('min_rating') ? parseFloat(searchParams.get('min_rating')) : '';
  const durations = searchParams.get('duration') ? searchParams.get('duration').split(',') : [];
  const hasCertificate = searchParams.get('has_certificate') === 'true';
  const sortBy = searchParams.get('sort_by') || 'Default';
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')) : 1;
  const q = searchParams.get('q') || '';

  // Local States
  const [coursesData, setCoursesData] = useState({ courses: [], total: 0, page: 1, per_page: 12, pages: 1 });
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localSearch, setLocalSearch] = useState(q);
  const [localPriceRange, setLocalPriceRange] = useState([minPrice, maxPrice]);

  // Sync local states with URL values when URL updates
  useEffect(() => {
    setLocalSearch(q);
  }, [q]);

  useEffect(() => {
    setLocalPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  // Debounce search typing to URL parameters
  useEffect(() => {
    const handler = setTimeout(() => {
      const currentQ = searchParams.get('q') || '';
      if (localSearch !== currentQ) {
        const newParams = new URLSearchParams(searchParams);
        if (localSearch) {
          newParams.set('q', localSearch);
        } else {
          newParams.delete('q');
        }
        newParams.set('page', '1'); // reset page to 1
        setSearchParams(newParams);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [localSearch]);

  // Fetch course list and wishlist ids
  useEffect(() => {
    const controller = new AbortController();
    api.get('/users/me/wishlist', { signal: controller.signal })
      .then(res => {
        setWishlistIds((res.data || []).map(c => c.id));
      })
      .catch(err => {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error("Failed to fetch wishlist:", err);
        }
      });
    return () => controller.abort();
  }, []);

  const fetchFilteredCourses = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (q) params.q = q;
      if (categories.length > 0) params.categories = categories;
      if (levels.length > 0) params.levels = levels;
      if (isFree) {
        params.is_free = true;
      } else {
        if (minPrice > 0) params.min_price = minPrice;
        if (maxPrice < 200) params.max_price = maxPrice;
      }
      if (minRating) params.min_rating = minRating;
      if (hasCertificate) params.has_certificate = true;
      if (sortBy && sortBy !== 'Default') {
        const sortMap = {
          'Highest Rated': 'highest_rated',
          'Lowest Price': 'lowest_price',
          'Highest Price': 'highest_price',
          'Most Popular': 'most_popular',
          'Newest': 'newest',
          'Shortest': 'shortest',
          'Longest': 'longest'
        };
        params.sort_by = sortMap[sortBy] || sortBy;
      }

      if (durations.length > 0) {
        const mins = [];
        const maxes = [];
        if (durations.includes('under-10')) { mins.push(0); maxes.push(10); }
        if (durations.includes('10-30')) { mins.push(10); maxes.push(30); }
        if (durations.includes('30-50')) { mins.push(30); maxes.push(50); }
        if (durations.includes('over-50')) { mins.push(50); maxes.push(999); }
        params.min_duration = Math.min(...mins);
        params.max_duration = Math.max(...maxes);
      }

      params.page = page;
      params.per_page = 12;

      const res = await api.get('/courses/search', { params, signal });
      setCoursesData(res.data);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        console.error("Failed to search courses:", err);
        setError(err.message || 'Failed to search courses');
        toast.error("Failed to load courses");
      }
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchFilteredCourses(controller.signal);
    return () => {
      controller.abort();
    };
  }, [searchParams]);

  // Wishlist actions
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

  // Filter handlers
  const handleCategoryToggle = (cat) => {
    const newParams = new URLSearchParams(searchParams);
    let cats = searchParams.get('category') ? searchParams.get('category').split(',') : [];
    if (cats.includes(cat)) {
      cats = cats.filter(c => c !== cat);
    } else {
      cats.push(cat);
    }
    if (cats.length > 0) {
      newParams.set('category', cats.join(','));
    } else {
      newParams.delete('category');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleLevelToggle = (lvl) => {
    const newParams = new URLSearchParams(searchParams);
    let lvls = searchParams.get('level') ? searchParams.get('level').split(',') : [];
    if (lvls.includes(lvl)) {
      lvls = lvls.filter(l => l !== lvl);
    } else {
      lvls.push(lvl);
    }
    if (lvls.length > 0) {
      newParams.set('level', lvls.join(','));
    } else {
      newParams.delete('level');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleDurationToggle = (dur) => {
    const newParams = new URLSearchParams(searchParams);
    let durs = searchParams.get('duration') ? searchParams.get('duration').split(',') : [];
    if (durs.includes(dur)) {
      durs = durs.filter(d => d !== dur);
    } else {
      durs.push(dur);
    }
    if (durs.length > 0) {
      newParams.set('duration', durs.join(','));
    } else {
      newParams.delete('duration');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePriceRangeCommit = (event, newValue) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('min_price', newValue[0].toString());
    newParams.set('max_price', newValue[1].toString());
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleIsFreeToggle = (e) => {
    const checked = e.target.checked;
    const newParams = new URLSearchParams(searchParams);
    if (checked) {
      newParams.set('is_free', 'true');
      newParams.delete('min_price');
      newParams.delete('max_price');
    } else {
      newParams.delete('is_free');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleHasCertificateToggle = (e) => {
    const checked = e.target.checked;
    const newParams = new URLSearchParams(searchParams);
    if (checked) {
      newParams.set('has_certificate', 'true');
    } else {
      newParams.delete('has_certificate');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleRatingChange = (e) => {
    const val = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set('min_rating', val);
    } else {
      newParams.delete('min_rating');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (val && val !== 'Default') {
      newParams.set('sort_by', val);
    } else {
      newParams.delete('sort_by');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  const handleClearAllFilters = () => {
    setLocalSearch('');
    setSearchParams(new URLSearchParams());
  };

  // Chip removers
  const handleRemoveCategoryChip = (cat) => {
    const newParams = new URLSearchParams(searchParams);
    let cats = searchParams.get('category') ? searchParams.get('category').split(',') : [];
    cats = cats.filter(c => c !== cat);
    if (cats.length > 0) {
      newParams.set('category', cats.join(','));
    } else {
      newParams.delete('category');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleRemoveLevelChip = (lvl) => {
    const newParams = new URLSearchParams(searchParams);
    let lvls = searchParams.get('level') ? searchParams.get('level').split(',') : [];
    lvls = lvls.filter(l => l !== lvl);
    if (lvls.length > 0) {
      newParams.set('level', lvls.join(','));
    } else {
      newParams.delete('level');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleRemoveDurationChip = (dur) => {
    const newParams = new URLSearchParams(searchParams);
    let durs = searchParams.get('duration') ? searchParams.get('duration').split(',') : [];
    durs = durs.filter(d => d !== dur);
    if (durs.length > 0) {
      newParams.set('duration', durs.join(','));
    } else {
      newParams.delete('duration');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleRemovePriceChip = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('min_price');
    newParams.delete('max_price');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleRemoveFreeChip = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('is_free');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleRemoveRatingChip = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('min_rating');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleRemoveCertificateChip = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('has_certificate');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleRemoveSortChip = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('sort_by');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleRemoveSearchChip = () => {
    setLocalSearch('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('q');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Helper to check if any filters are active
  const hasActiveFilters = q || categories.length > 0 || levels.length > 0 || 
    (minPrice > 0 || maxPrice < 200) || isFree || minRating || durations.length > 0 || 
    hasCertificate || sortBy !== 'Default';

  return (
    <Box sx={{ flexGrow: 1, py: 2 }}>
      {/* Title Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: '#1e293b',
            fontFamily: "'Outfit', sans-serif",
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
          }}
        >
          🎓 Advanced Courses Explorer
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontFamily: "'Outfit', sans-serif" }}>
          Find, filter, and master high-quality interactive lectures using professional parameters.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Side: Advanced Filters Panel */}
        <Grid item xs={12} md={3.5}>
          <Card
            sx={{
              p: 3,
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              backgroundColor: '#ffffff',
              position: 'sticky',
              top: '24px',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1, fontFamily: "'Outfit', sans-serif" }}>
                <FilterListIcon sx={{ color: '#667eea' }} /> Filters
              </Typography>
              {hasActiveFilters && (
                <Button 
                  onClick={handleClearAllFilters} 
                  size="small" 
                  sx={{ textTransform: 'none', fontWeight: 700, color: '#667eea' }}
                >
                  Clear All
                </Button>
              )}
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={3}>
              {/* Search Bar inside Sidebar */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', mb: 1, fontFamily: "'Outfit', sans-serif" }}>
                  Search keywords
                </Typography>
                <TextField
                  placeholder="Title, instructor, tag..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: localSearch && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setLocalSearch('')} edge="end" size="small">
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>

              {/* Categories Checklist */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', mb: 1, fontFamily: "'Outfit', sans-serif" }}>
                  Categories
                </Typography>
                <FormGroup sx={{ maxHeight: 180, overflowY: 'auto', pr: 1 }}>
                  {CATEGORIES.map((cat) => (
                    <FormControlLabel
                      key={cat}
                      control={
                        <Checkbox
                          size="small"
                          checked={categories.includes(cat)}
                          onChange={() => handleCategoryToggle(cat)}
                          sx={{
                            color: '#cbd5e1',
                            '&.Mui-checked': { color: '#667eea' },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#334155', fontFamily: "'Outfit', sans-serif" }}>
                          {cat}
                        </Typography>
                      }
                    />
                  ))}
                </FormGroup>
              </Box>

              {/* Levels Checklist */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', mb: 1, fontFamily: "'Outfit', sans-serif" }}>
                  Levels
                </Typography>
                <FormGroup>
                  {LEVELS.map((lvl) => (
                    <FormControlLabel
                      key={lvl}
                      control={
                        <Checkbox
                          size="small"
                          checked={levels.includes(lvl)}
                          onChange={() => handleLevelToggle(lvl)}
                          sx={{
                            color: '#cbd5e1',
                            '&.Mui-checked': { color: '#667eea' },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#334155', fontFamily: "'Outfit', sans-serif" }}>
                          {lvl}
                        </Typography>
                      }
                    />
                  ))}
                </FormGroup>
              </Box>

              {/* Price Filter */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', fontFamily: "'Outfit', sans-serif" }}>
                    Price Range
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#667eea', fontFamily: "'Outfit', sans-serif" }}>
                    {isFree ? 'Free' : `$${localPriceRange[0]} - $${localPriceRange[1]}`}
                  </Typography>
                </Stack>
                <Slider
                  disabled={isFree}
                  value={localPriceRange}
                  onChange={(e, val) => setLocalPriceRange(val)}
                  onChangeCommitted={handlePriceRangeCommit}
                  valueLabelDisplay="auto"
                  min={0}
                  max={200}
                  sx={{
                    color: '#667eea',
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#ffffff',
                      border: '2px solid #667eea',
                    },
                    '& .MuiSlider-track': { height: 6 },
                    '& .MuiSlider-rail': { height: 6, opacity: 0.2 },
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={isFree}
                      onChange={handleIsFreeToggle}
                      sx={{
                        color: '#cbd5e1',
                        '&.Mui-checked': { color: '#667eea' },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#334155', fontFamily: "'Outfit', sans-serif" }}>
                      Free courses only
                    </Typography>
                  }
                />
              </Box>

              {/* Ratings Radio Selector */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', mb: 1, fontFamily: "'Outfit', sans-serif" }}>
                  Minimum Rating
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup value={minRating.toString()} onChange={handleRatingChange}>
                    <FormControlLabel
                      value=""
                      control={<Radio size="small" sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#667eea' } }} />}
                      label={<Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#334155', fontFamily: "'Outfit', sans-serif" }}>Any Rating</Typography>}
                    />
                    <FormControlLabel
                      value="4"
                      control={<Radio size="small" sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#667eea' } }} />}
                      label={
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#334155', fontFamily: "'Outfit', sans-serif" }}>4.0+ Stars</Typography>
                          <Rating value={4} readOnly size="small" max={4} sx={{ color: '#f59e0b', fontSize: '0.85rem' }} />
                        </Stack>
                      }
                    />
                    <FormControlLabel
                      value="3"
                      control={<Radio size="small" sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#667eea' } }} />}
                      label={
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#334155', fontFamily: "'Outfit', sans-serif" }}>3.0+ Stars</Typography>
                          <Rating value={3} readOnly size="small" max={3} sx={{ color: '#f59e0b', fontSize: '0.85rem' }} />
                        </Stack>
                      }
                    />
                    <FormControlLabel
                      value="2"
                      control={<Radio size="small" sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#667eea' } }} />}
                      label={
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#334155', fontFamily: "'Outfit', sans-serif" }}>2.0+ Stars</Typography>
                          <Rating value={2} readOnly size="small" max={2} sx={{ color: '#f59e0b', fontSize: '0.85rem' }} />
                        </Stack>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </Box>

              {/* Durations Filter */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', mb: 1, fontFamily: "'Outfit', sans-serif" }}>
                  Video Duration
                </Typography>
                <FormGroup>
                  {DURATIONS.map((dur) => (
                    <FormControlLabel
                      key={dur.value}
                      control={
                        <Checkbox
                          size="small"
                          checked={durations.includes(dur.value)}
                          onChange={() => handleDurationToggle(dur.value)}
                          sx={{
                            color: '#cbd5e1',
                            '&.Mui-checked': { color: '#667eea' },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#334155', fontFamily: "'Outfit', sans-serif" }}>
                          {dur.label}
                        </Typography>
                      }
                    />
                  ))}
                </FormGroup>
              </Box>

              {/* Extra Features */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', mb: 1, fontFamily: "'Outfit', sans-serif" }}>
                  Features
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={hasCertificate}
                      onChange={handleHasCertificateToggle}
                      sx={{
                        color: '#cbd5e1',
                        '&.Mui-checked': { color: '#667eea' },
                      }}
                    />
                  }
                  label={
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <WorkspacePremiumIcon size="small" sx={{ color: '#ffd700', fontSize: '1.1rem' }} />
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#334155', fontFamily: "'Outfit', sans-serif" }}>
                        Includes Certificate
                      </Typography>
                    </Stack>
                  }
                />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Right Side: Main Grid Area */}
        <Grid item xs={12} md={8.5}>
          {/* Active Chips & Sort Row */}
          <Card
            sx={{
              p: 2,
              mb: 3,
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              backgroundColor: '#ffffff',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={2}
            >
              {/* Sort selector */}
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="sort-selector-label">Sort By</InputLabel>
                <Select
                  labelId="sort-selector-label"
                  value={sortBy}
                  label="Sort By"
                  onChange={handleSortChange}
                  sx={{ borderRadius: '8px' }}
                >
                  {SORT_OPTIONS.map(opt => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Stats info */}
              <Typography
                variant="body2"
                sx={{
                  color: '#64748b',
                  fontWeight: 600,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Showing {(coursesData?.courses || []).length} of {(coursesData?.total || 0)} courses
              </Typography>
            </Stack>

            {/* Render Active Filter Chips */}
            {hasActiveFilters && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {q && (
                  <Chip
                    label={`Search: ${q}`}
                    size="small"
                    onDelete={handleRemoveSearchChip}
                    sx={{ backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 600 }}
                  />
                )}
                {categories.map(cat => (
                  <Chip
                    key={cat}
                    label={`Category: ${cat}`}
                    size="small"
                    onDelete={() => handleRemoveCategoryChip(cat)}
                    sx={{ backgroundColor: '#667eea', color: '#ffffff', fontWeight: 600 }}
                  />
                ))}
                {levels.map(lvl => (
                  <Chip
                    key={lvl}
                    label={`Level: ${lvl}`}
                    size="small"
                    onDelete={() => handleRemoveLevelChip(lvl)}
                    sx={{ backgroundColor: '#764ba2', color: '#ffffff', fontWeight: 600 }}
                  />
                ))}
                {isFree ? (
                  <Chip
                    label="Price: Free Only"
                    size="small"
                    onDelete={handleRemoveFreeChip}
                    sx={{ backgroundColor: '#10b981', color: '#ffffff', fontWeight: 600 }}
                  />
                ) : (
                  (minPrice > 0 || maxPrice < 200) && (
                    <Chip
                      label={`Price: $${minPrice} - $${maxPrice}`}
                      size="small"
                      onDelete={handleRemovePriceChip}
                      sx={{ backgroundColor: '#cbd5e1', color: '#334155', fontWeight: 600 }}
                    />
                  )
                )}
                {minRating && (
                  <Chip
                    label={`Rating: ${minRating}.0+ Stars`}
                    size="small"
                    onDelete={handleRemoveRatingChip}
                    sx={{ backgroundColor: '#f59e0b', color: '#ffffff', fontWeight: 600 }}
                  />
                )}
                {durations.map(dur => (
                  <Chip
                    key={dur}
                    label={`Duration: ${dur}`}
                    size="small"
                    onDelete={() => handleRemoveDurationChip(dur)}
                    sx={{ backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 600 }}
                  />
                ))}
                {hasCertificate && (
                  <Chip
                    label="Includes Certificate"
                    size="small"
                    onDelete={handleRemoveCertificateChip}
                    sx={{ backgroundColor: '#ffd700', color: '#334155', fontWeight: 600 }}
                  />
                )}
                {sortBy !== 'Default' && (
                  <Chip
                    label={`Sorted: ${sortBy}`}
                    size="small"
                    onDelete={handleRemoveSortChip}
                    sx={{ backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 600 }}
                  />
                )}
              </Box>
            )}
          </Card>

          {/* Results courses list or empty state */}
          {loading ? (
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', p: 0 }}>
                    <Skeleton variant="rounded" height={160} />
                    <CardContent sx={{ p: 2 }}>
                      <Skeleton variant="text" height={28} width="80%" sx={{ mb: 1 }} />
                      <Skeleton variant="text" height={20} width="60%" sx={{ mb: 2 }} />
                      <Skeleton variant="rounded" height={36} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : error ? (
            <Box sx={{ p: 4, textAlign: 'center', width: '100%', bgcolor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <Typography variant="h5" color="error" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                😕 Failed to load courses
              </Typography>
              <Typography sx={{ my: 2, color: 'text.secondary', fontFamily: "'Outfit', sans-serif" }}>
                {error}
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => fetchFilteredCourses()}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontFamily: "'Outfit', sans-serif",
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                Retry
              </Button>
            </Box>
          ) : (coursesData?.courses || []).length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 10,
                px: 4,
                textAlign: 'center',
                bgcolor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              }}
            >
              <SearchOffIcon sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#334155', mb: 1, fontFamily: "'Outfit', sans-serif" }}>
                No courses match your criteria
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', mb: 3, maxWidth: 450, fontFamily: "'Outfit', sans-serif" }}>
                Try relaxing your rating requirements, expanding the price slider range, or clearing tags.
              </Typography>
              <Button
                variant="contained"
                onClick={handleClearAllFilters}
                sx={{
                  py: 1,
                  px: 4,
                  borderRadius: '10px',
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
            <>
              <Grid container spacing={3}>
                {(coursesData?.courses || []).map((course) => {
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
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                          transition: 'all 0.25s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-6px)',
                            boxShadow: '0 12px 24px -4px rgba(102, 126, 234, 0.2)',
                          },
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {/* Heart Wishlist Overlay */}
                        <IconButton
                          onClick={(e) => handleWishlistToggle(e, course.id)}
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            zIndex: 10,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
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
                          {/* Course image container */}
                          <Box sx={{ position: 'relative', height: 160, overflow: 'hidden' }}>
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
                            {/* Badges overlay */}
                            <Box sx={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              <Chip
                                label={course.category}
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(102, 126, 234, 0.9)',
                                  color: '#ffffff',
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                  fontFamily: "'Outfit', sans-serif",
                                  backdropFilter: 'blur(4px)',
                                }}
                              />
                              <Chip
                                label={course.level}
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                  color: '#475569',
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                  fontFamily: "'Outfit', sans-serif",
                                  backdropFilter: 'blur(4px)',
                                }}
                              />
                            </Box>

                            {/* Certificate Badge */}
                            {course.has_certificate && (
                              <Chip
                                icon={<WorkspacePremiumIcon sx={{ color: '#ffd700 !important', fontSize: '0.9rem !important' }} />}
                                label="Cert"
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: 12,
                                  left: 12,
                                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                  color: '#ffffff',
                                  fontWeight: 700,
                                  fontSize: '0.65rem',
                                  fontFamily: "'Outfit', sans-serif",
                                  backdropFilter: 'blur(4px)',
                                  border: '1px solid rgba(255, 215, 0, 0.4)',
                                }}
                              />
                            )}
                          </Box>

                          {/* Content details */}
                          <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Typography
                              variant="subtitle1"
                              component="h2"
                              sx={{
                                fontWeight: 800,
                                color: '#1e293b',
                                fontFamily: "'Outfit', sans-serif",
                                lineHeight: 1.3,
                                mb: 0.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                height: '2.5rem',
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
                              {/* Rating and Reviews count */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
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

                              {/* Price and duration */}
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography
                                  variant="subtitle1"
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
                                    color: '#94a3b8',
                                    fontWeight: 600,
                                    fontFamily: "'Outfit', sans-serif",
                                  }}
                                >
                                  ⏱️ {course.duration_hours} hrs
                                </Typography>
                              </Stack>
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Bottom Pagination Controls */}
              {coursesData.pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                  <Pagination
                    count={coursesData.pages}
                    page={page}
                    onChange={(e, val) => handlePageChange(val)}
                    color="primary"
                    sx={{
                      '& .MuiPaginationItem-root': {
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 700,
                      },
                      '& .Mui-selected': {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important',
                        color: '#ffffff',
                      }
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
