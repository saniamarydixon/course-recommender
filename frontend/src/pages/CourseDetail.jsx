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
  Avatar,
  TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TranslateIcon from '@mui/icons-material/Translate';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import { toast } from 'react-toastify';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import CertificateModal from '../components/Certificate/CertificateModal';
import api from '../services/api';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [certOpen, setCertOpen] = useState(false);

  const handleCopyShareableLink = () => {
    const courseUrl = `${window.location.origin}/courses/${id}`;
    navigator.clipboard.writeText(courseUrl);
    toast.success("Shareable course completion link copied to clipboard!");
  };

  // Reviews and current user states
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRatingInput, setEditRatingInput] = useState(5);
  const [editCommentInput, setEditCommentInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (reviews.length > 0 && currentUser) {
      const myReview = reviews.find(r => r.user_id === currentUser.id);
      setUserReview(myReview || null);
    } else {
      setUserReview(null);
    }
  }, [reviews, currentUser]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes = await api.get(`/courses/${id}`);
        setCourse(courseRes.data);

        // Fetch enrollment status and progress
        const statusRes = await api.get(`/courses/${id}/enrollment-status`);
        setEnrolled(statusRes.data.is_enrolled);
        setProgress(statusRes.data.progress || 0);

        // Fetch reviews
        const reviewsRes = await api.get(`/courses/${id}/reviews`);
        setReviews(reviewsRes.data);
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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (ratingInput < 1 || ratingInput > 5) {
      toast.error("Rating must be between 1 and 5 stars");
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post(`/courses/${id}/reviews`, {
        rating: ratingInput,
        comment: commentInput
      });
      toast.success("Review submitted successfully!");
      setCommentInput('');
      setRatingInput(5);
      
      // Refresh reviews and course data (to update avg rating)
      const reviewsRes = await api.get(`/courses/${id}/reviews`);
      setReviews(reviewsRes.data);
      const courseRes = await api.get(`/courses/${id}`);
      setCourse(courseRes.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleStartEdit = (review) => {
    setEditingReviewId(review.id);
    setEditRatingInput(review.rating);
    setEditCommentInput(review.comment || '');
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/reviews/${editingReviewId}`, {
        rating: editRatingInput,
        comment: editCommentInput
      });
      toast.success("Review updated successfully!");
      setEditingReviewId(null);
      
      // Refresh reviews and course data
      const reviewsRes = await api.get(`/courses/${id}/reviews`);
      setReviews(reviewsRes.data);
      const courseRes = await api.get(`/courses/${id}`);
      setCourse(courseRes.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update review");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete your review?")) {
      return;
    }
    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success("Review deleted successfully!");
      
      // Refresh reviews and course data
      const reviewsRes = await api.get(`/courses/${id}/reviews`);
      setReviews(reviewsRes.data);
      const courseRes = await api.get(`/courses/${id}`);
      setCourse(courseRes.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to delete review");
    }
  };

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
                  value={course.average_rating || 0}
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
                  {course.average_rating ? course.average_rating.toFixed(1) : '0.0'} ({course.total_reviews || 0} reviews)
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

          {/* Reviews & Ratings Card */}
          <Card
            sx={{
              borderRadius: '16px',
              border: '1px solid #f1f5f9',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              p: { xs: 3, sm: 4 },
              mb: 4,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: '#1e293b',
                fontFamily: "'Outfit', sans-serif",
                mb: 3,
              }}
            >
              Course Reviews ({reviews.length})
            </Typography>

            {/* Write a Review Form - only show if enrolled and user hasn't reviewed yet */}
            {enrolled && !userReview && (
              <Box sx={{ mb: 4, p: 3, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    color: '#1e293b',
                    fontFamily: "'Outfit', sans-serif",
                    mb: 2,
                  }}
                >
                  Write a Review
                </Typography>
                <form onSubmit={handleSubmitReview}>
                  <Stack spacing={2.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', fontFamily: "'Outfit', sans-serif" }}>
                        Your Rating:
                      </Typography>
                      <Rating
                        value={ratingInput}
                        onChange={(e, val) => setRatingInput(val || 5)}
                        sx={{ color: '#f59e0b' }}
                      />
                    </Box>
                    <TextField
                      label="Your Comment"
                      multiline
                      rows={3}
                      fullWidth
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Share your thoughts about the course contents, teaching style, and pacing..."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={submittingReview}
                      sx={{
                        alignSelf: 'flex-start',
                        py: 1,
                        px: 3,
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontFamily: "'Outfit', sans-serif",
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      }}
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </Stack>
                </form>
              </Box>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <Typography
                variant="body2"
                sx={{
                  color: '#64748b',
                  fontFamily: "'Outfit', sans-serif",
                  fontStyle: 'italic',
                  py: 2,
                }}
              >
                No reviews yet. Be the first to share your thoughts!
              </Typography>
            ) : (
              <Stack spacing={3}>
                {reviews.map((rev) => {
                  const isOwnReview = currentUser && rev.user_id === currentUser.id;
                  const isEditing = editingReviewId === rev.id;
                  const reviewUser = rev.user || {};
                  const reviewDisplayName = reviewUser.full_name || reviewUser.username || "Anonymous";
                  const reviewDisplayLetter = reviewDisplayName.charAt(0).toUpperCase();

                  return (
                    <Box key={rev.id}>
                      <Divider sx={{ mb: 3 }} />
                      {isEditing ? (
                        <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #667eea' }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700, fontFamily: "'Outfit', sans-serif", mb: 2 }}
                          >
                            Edit Your Review
                          </Typography>
                          <form onSubmit={handleUpdateReview}>
                            <Stack spacing={2}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', fontFamily: "'Outfit', sans-serif" }}>
                                  Rating:
                                </Typography>
                                <Rating
                                  value={editRatingInput}
                                  onChange={(e, val) => setEditRatingInput(val || 5)}
                                  sx={{ color: '#f59e0b' }}
                                />
                              </Box>
                              <TextField
                                label="Comment"
                                multiline
                                rows={3}
                                fullWidth
                                value={editCommentInput}
                                onChange={(e) => setEditCommentInput(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                              />
                              <Stack direction="row" spacing={1.5}>
                                <Button
                                  type="submit"
                                  variant="contained"
                                  size="small"
                                  sx={{
                                    py: 0.75,
                                    px: 2.5,
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontFamily: "'Outfit', sans-serif",
                                    bgcolor: '#667eea',
                                    '&:hover': { bgcolor: '#5a6fd6' },
                                  }}
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={handleCancelEdit}
                                  sx={{
                                    py: 0.75,
                                    px: 2.5,
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontFamily: "'Outfit', sans-serif",
                                    borderColor: '#cbd5e1',
                                    color: '#475569',
                                    '&:hover': { borderColor: '#94a3b8' },
                                  }}
                                >
                                  Cancel
                                </Button>
                              </Stack>
                            </Stack>
                          </form>
                        </Box>
                      ) : (
                        <Grid container spacing={2}>
                          {/* Avatar Column */}
                          <Grid item xs={2} sm={1} sx={{ textAlign: 'center' }}>
                            <Avatar
                              src={reviewUser.avatar_url || undefined}
                              onClick={() => reviewUser.username && navigate(`/users/${reviewUser.username}`)}
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: '#667eea',
                                mx: 'auto',
                                cursor: reviewUser.username ? 'pointer' : 'default',
                                '&:hover': { opacity: reviewUser.username ? 0.85 : 1 },
                              }}
                            >
                              {reviewDisplayLetter}
                            </Avatar>
                          </Grid>

                          {/* Content Column */}
                          <Grid item xs={10} sm={11}>
                            <Stack spacing={0.5}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                  <Typography
                                    variant="subtitle2"
                                    onClick={() => reviewUser.username && navigate(`/users/${reviewUser.username}`)}
                                    sx={{
                                      fontWeight: 700,
                                      color: '#1e293b',
                                      fontFamily: "'Outfit', sans-serif",
                                      cursor: reviewUser.username ? 'pointer' : 'default',
                                      '&:hover': { color: reviewUser.username ? '#667eea' : 'inherit' },
                                    }}
                                  >
                                    {reviewDisplayName}
                                  </Typography>
                                  <Rating
                                    value={rev.rating}
                                    readOnly
                                    size="small"
                                    sx={{ color: '#f59e0b', mt: 0.25 }}
                                  />
                                </Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography
                                    variant="caption"
                                    sx={{ color: '#94a3b8', fontFamily: "'Outfit', sans-serif" }}
                                  >
                                    {new Date(rev.created_at).toLocaleDateString()}
                                  </Typography>
                                  {isOwnReview && (
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleStartEdit(rev)}
                                        sx={{ color: '#64748b', '&:hover': { color: '#667eea' } }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteReview(rev.id)}
                                        sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  )}
                                </Stack>
                              </Box>

                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#475569',
                                  fontFamily: "'Outfit', sans-serif",
                                  lineHeight: 1.6,
                                  mt: 1,
                                }}
                              >
                                {rev.comment || 'No comment provided.'}
                              </Typography>
                            </Stack>
                          </Grid>
                        </Grid>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            )}
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

                {progress >= 100 && course.has_certificate && (
                  <Stack spacing={1}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<WorkspacePremiumIcon sx={{ color: '#ffd700 !important' }} />}
                      onClick={() => setCertOpen(true)}
                      sx={{
                        py: 1,
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontFamily: "'Outfit', sans-serif",
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#ffffff',
                        boxShadow: '0 4px 10px rgba(102, 126, 234, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a6fd6 0%, #693db6 100%)',
                        },
                      }}
                    >
                      Download Certificate
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleCopyShareableLink}
                      sx={{
                        py: 0.75,
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontFamily: "'Outfit', sans-serif",
                        color: '#667eea',
                        borderColor: '#667eea',
                        '&:hover': {
                          borderColor: '#5a6fd6',
                          backgroundColor: 'rgba(102, 126, 234, 0.04)',
                        },
                      }}
                    >
                      Share Certificate
                    </Button>
                  </Stack>
                )}

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
      <CertificateModal
        open={certOpen}
        onClose={() => setCertOpen(false)}
        courseId={parseInt(id)}
        courseTitle={course?.title || ''}
      />
    </Box>
  );
}
