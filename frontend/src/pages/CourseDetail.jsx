import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
  Rating,
  Grid,
  CircularProgress,
  Divider,
  Stack,
  LinearProgress,
  Slider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TranslateIcon from '@mui/icons-material/Translate';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes = await api.get(`/courses/${id}`);
        setCourse(courseRes.data);

        // Fetch enrollment status and progress
        const statusRes = await api.get(`/courses/${id}/enrollment-status`);
        setEnrolled(statusRes.data.is_enrolled);
        setProgress(statusRes.data.progress || 0);
      } catch (err) {
        console.error("Error loading course details:", err);
        toast.error("Failed to load course details");
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/courses/${id}/enroll`);
      setEnrolled(true);
      setProgress(0);
      toast.success('Successfully enrolled in the course!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const handleUpdateProgress = async (val) => {
    try {
      const res = await api.put(`/courses/${id}/progress`, { progress: val });
      setProgress(res.data.progress);
      if (val >= 100) {
        toast.success('Congratulations! You completed the course! 🎉');
      } else {
        toast.success(`Progress updated to ${val}%`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update progress');
    }
  };

  const handleSliderChange = (val) => {
    setProgress(val);
  };

  const handleUnenroll = async () => {
    if (!window.confirm('Are you sure you want to unenroll from this course? Your progress will be lost.')) {
      return;
    }
    try {
      await api.delete(`/courses/${id}/enroll`);
      setEnrolled(false);
      setProgress(0);
      toast.success('Successfully unenrolled from the course.');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to unenroll');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, py: 8 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!course) return null;

  const thumbnail = course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800';
  const priceText = course.price === 0 || !course.price ? 'FREE' : `$${course.price.toFixed(2)}`;

  return (
    <Box sx={{ flexGrow: 1, py: 2 }}>
      {/* Back Button */}
      <Button
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{
          color: '#64748b',
          fontWeight: 600,
          fontFamily: "'Outfit', sans-serif",
          textTransform: 'none',
          mb: 3,
          '&:hover': {
            backgroundColor: 'rgba(100, 116, 139, 0.08)',
          },
        }}
      >
        Back to courses
      </Button>

      <Grid container spacing={4}>
        {/* Left Side - Details */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              borderRadius: '16px',
              border: '1px solid #f1f5f9',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              mb: 4,
            }}
          >
            <Box sx={{ position: 'relative', height: { xs: 240, sm: 360 } }}>
              <CardMedia
                component="img"
                image={thumbnail}
                alt={course.title}
                sx={{ height: '100%', width: '100%', objectFit: 'cover' }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  display: 'flex',
                  gap: 1.5,
                }}
              >
                <Chip
                  label={course.category}
                  sx={{
                    backgroundColor: '#667eea',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                />
                <Chip
                  label={course.level}
                  sx={{
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                />
              </Box>
            </Box>

            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  color: '#1e293b',
                  fontFamily: "'Outfit', sans-serif",
                  lineHeight: 1.3,
                  mb: 1.5,
                }}
              >
                {course.title}
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: '#64748b',
                  fontWeight: 600,
                  fontFamily: "'Outfit', sans-serif",
                  mb: 3,
                }}
              >
                Instructed by {course.instructor || 'Expert Instructor'}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                <Rating
                  value={course.rating || 4.5}
                  precision={0.1}
                  readOnly
                  sx={{ color: '#f59e0b' }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: '#1e293b',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {(course.rating || 4.5).toFixed(1)} (
                  {course.enrollment_count || 120} ratings)
                </Typography>
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#64748b',
                    fontWeight: 600,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {course.enrollment_count || 120} students enrolled
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: '#1e293b',
                  fontFamily: "'Outfit', sans-serif",
                  mb: 2,
                }}
              >
                Course Description
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#475569',
                  fontFamily: "'Outfit', sans-serif",
                  lineHeight: 1.7,
                  whiteSpace: 'pre-line',
                }}
              >
                {course.description ||
                  'No detailed description is currently available for this course. In this course, you will learn standard modern techniques, tools, and paradigms through structured modules and hands-on exercises.'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side - Sticky Card */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: '16px',
              border: '1px solid #f1f5f9',
              boxShadow: '0 8px 16px -1px rgba(0, 0, 0, 0.08)',
              p: 3,
              position: 'sticky',
              top: '96px',
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                color: '#667eea',
                fontFamily: "'Outfit', sans-serif",
                mb: 3,
              }}
            >
              {priceText}
            </Typography>

            <Stack spacing={2} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccessTimeIcon sx={{ color: '#94a3b8' }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#475569',
                    fontWeight: 600,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  Duration: {course.duration_hours || 12} hours of video
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TranslateIcon sx={{ color: '#94a3b8' }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#475569',
                    fontWeight: 600,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  Language: English
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SchoolIcon sx={{ color: '#94a3b8' }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#475569',
                    fontWeight: 600,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  Level: {course.level || 'Beginner'}
                </Typography>
              </Box>
            </Stack>

            {enrolled ? (
              <Stack spacing={2.5}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    py: 1,
                    borderRadius: '8px',
                    backgroundColor: progress >= 100 ? '#f0fdf4' : '#f0fdfa',
                    border: progress >= 100 ? '1px solid #bbf7d0' : '1px solid #99f6e4',
                  }}
                >
                  <CheckCircleIcon sx={{ color: progress >= 100 ? '#22c55e' : '#0d9488' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: progress >= 100 ? '#166534' : '#115e59',
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {progress >= 100 ? 'Course Completed!' : 'Enrolled & Learning'}
                  </Typography>
                </Box>

                {/* Progress bar */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', fontFamily: "'Outfit', sans-serif" }}>
                      Your Progress
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#667eea', fontFamily: "'Outfit', sans-serif" }}>
                      {progress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        backgroundColor: progress >= 100 ? '#22c55e' : '#667eea',
                      },
                    }}
                  />
                </Box>

                {/* Progress quick buttons */}
                <Stack spacing={1}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', fontFamily: "'Outfit', sans-serif", mb: 0.5 }}>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        onClick={() => handleUpdateProgress(25)}
                        sx={{
                          fontSize: '0.75rem',
                          py: 0.75,
                          fontFamily: "'Outfit', sans-serif",
                          borderColor: '#cbd5e1',
                          color: '#475569',
                          '&:hover': {
                            borderColor: '#667eea',
                            color: '#667eea',
                          }
                        }}
                      >
                        25%
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        onClick={() => handleUpdateProgress(50)}
                        sx={{
                          fontSize: '0.75rem',
                          py: 0.75,
                          fontFamily: "'Outfit', sans-serif",
                          borderColor: '#cbd5e1',
                          color: '#475569',
                          '&:hover': {
                            borderColor: '#667eea',
                            color: '#667eea',
                          }
                        }}
                      >
                        50%
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        size="small"
                        variant="contained"
                        onClick={() => handleUpdateProgress(100)}
                        sx={{
                          fontSize: '0.75rem',
                          py: 0.75,
                          fontFamily: "'Outfit', sans-serif",
                          background: progress >= 100 ? '#22c55e' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#ffffff',
                          boxShadow: 'none',
                          '&:hover': {
                            background: progress >= 100 ? '#1ea350' : 'linear-gradient(135deg, #5a6fd6 0%, #683fa3 100%)',
                          }
                        }}
                      >
                        100%
                      </Button>
                    </Grid>
                  </Grid>
                </Stack>

                {/* Slider option for granular control */}
                <Box sx={{ px: 1, pt: 1 }}>
                  <Slider
                    value={progress}
                    onChange={(e, val) => handleSliderChange(val)}
                    onChangeCommitted={(e, val) => handleUpdateProgress(val)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={100}
                    sx={{
                      color: '#667eea',
                      '& .MuiSlider-thumb': {
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: '0px 0px 0px 8px rgba(102, 126, 234, 0.16)',
                        },
                      },
                    }}
                  />
                </Box>

                <Divider sx={{ my: 1 }} />

                <Button
                  fullWidth
                  variant="text"
                  color="error"
                  onClick={handleUnenroll}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '0.9rem',
                    '&:hover': {
                      backgroundColor: '#fef2f2',
                    },
                  }}
                >
                  Unenroll from Course
                </Button>
              </Stack>
            ) : (
              <Button
                fullWidth
                variant="contained"
                onClick={handleEnroll}
                disabled={enrolling}
                sx={{
                  py: 1.5,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  fontFamily: "'Outfit', sans-serif",
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd6 0%, #683fa3 100%)',
                    transform: 'scale(1.02)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                {enrolling ? 'Enrolling...' : 'Enroll in Course'}
              </Button>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
