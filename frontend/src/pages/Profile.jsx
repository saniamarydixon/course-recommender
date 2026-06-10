import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Tooltip,
  Link,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StarRateIcon from '@mui/icons-material/StarRate';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LaunchIcon from '@mui/icons-material/Launch';
import Rating from '@mui/material/Rating';
import { toast } from 'react-toastify';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import CertificateModal from '../components/Certificate/CertificateModal';
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

export default function Profile() {
  const [user, setUser] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [saving, setSaving] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [activeCourseTitle, setActiveCourseTitle] = useState('');

  const handleOpenCertificate = (courseId, courseTitle) => {
    setActiveCourseId(courseId);
    setActiveCourseTitle(courseTitle);
    setCertOpen(true);
  };

  const navigate = useNavigate();

  // Edit Mode state
  const [editMode, setEditMode] = useState(false);
  
  // New profile fields states
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');
  const [socialGithub, setSocialGithub] = useState('');
  const [socialLinkedin, setSocialLinkedin] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Reviews and uploading states
  const [myReviews, setMyReviews] = useState([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  const fetchProfileData = async () => {
    try {
      const userRes = await api.get('/users/me');
      setUser(userRes.data);
      setFullName(userRes.data.full_name || '');
      setBio(userRes.data.bio || '');
      setLocation(userRes.data.location || '');
      setSkills(userRes.data.skills || '');
      setSocialGithub(userRes.data.social_links?.github || '');
      setSocialLinkedin(userRes.data.social_links?.linkedin || '');
      setSocialTwitter(userRes.data.social_links?.twitter || '');
      setIsPublic(userRes.data.is_public || false);
      setAvatarUrlInput(userRes.data.avatar_url || '');
      
      const interestList = userRes.data.interests
        ? userRes.data.interests.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      setSelectedInterests(interestList);

      localStorage.setItem('user', JSON.stringify(userRes.data));

      const enrolledRes = await api.get('/users/me/enrolled-courses');
      setEnrolledCourses(enrolledRes.data);

      const reviewsRes = await api.get('/users/me/reviews');
      setMyReviews(reviewsRes.data);
    } catch (err) {
      console.error("Failed to fetch profile data:", err);
      toast.error("Error loading profile details");
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleInterestChange = (category) => {
    if (selectedInterests.includes(category)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== category));
    } else {
      setSelectedInterests([...selectedInterests, category]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        full_name: fullName,
        bio: bio,
        interests: selectedInterests.join(','),
        location: location,
        skills: skills,
        social_links: {
          github: socialGithub,
          linkedin: socialLinkedin,
          twitter: socialTwitter,
        },
        is_public: isPublic,
      };

      const res = await api.put('/users/me', payload);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      toast.success('Profile updated successfully!');
      setEditMode(false);
      fetchProfileData(); // Reload
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingAvatar(true);
    try {
      const res = await api.post('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Avatar uploaded successfully!');
      setUser(prev => ({ ...prev, avatar_url: res.data.avatar_url }));
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.avatar_url = res.data.avatar_url;
        localStorage.setItem('user', JSON.stringify(parsed));
      }
      // Trigger header refresh
      window.dispatchEvent(new Event('userUpdated'));
      fetchProfileData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload avatar image');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarUrlUpdate = async () => {
    if (!avatarUrlInput) {
      toast.error("Please enter a valid URL");
      return;
    }
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar_url', avatarUrlInput);
      const res = await api.post('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Avatar URL updated successfully!');
      setUser(prev => ({ ...prev, avatar_url: res.data.avatar_url }));
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.avatar_url = res.data.avatar_url;
        localStorage.setItem('user', JSON.stringify(parsed));
      }
      window.dispatchEvent(new Event('userUpdated'));
      fetchProfileData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update avatar URL');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteMyReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success("Review deleted successfully!");
      fetchProfileData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete review");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const coursesInProgress = enrolledCourses.filter(item => item.progress < 100).length;
  const coursesCompleted = enrolledCourses.filter(item => item.progress >= 100).length;
  const totalHours = enrolledCourses.reduce((sum, item) => sum + (item.course?.duration_hours || 0), 0);

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Typography variant="body1" sx={{ fontFamily: "'Outfit', sans-serif" }}>Loading Profile...</Typography>
      </Box>
    );
  }

  const displayName = user.full_name || user.username;
  const displayLetter = displayName.charAt(0).toUpperCase();
  const joinedDate = new Date(user.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });

  const skillsList = user.skills
    ? user.skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  // Compile Activities
  const activities = [];
  enrolledCourses.forEach(item => {
    if (item.course) {
      activities.push({
        type: 'enrollment',
        title: `Enrolled in ${item.course.title}`,
        date: new Date(item.last_accessed || item.course.created_at || Date.now()),
        link: `/courses/${item.course.id}`
      });
      if (item.progress >= 100) {
        activities.push({
          type: 'completion',
          title: `Completed ${item.course.title}! 🎉`,
          date: new Date(item.last_accessed || Date.now()),
          link: `/courses/${item.course.id}`
        });
      }
    }
  });
  myReviews.forEach(rev => {
    activities.push({
      type: 'review',
      title: `Reviewed course (Rating: ${rev.rating}/5)`,
      subtitle: rev.comment,
      date: new Date(rev.created_at),
      link: `/courses/${rev.course_id}`
    });
  });
  activities.sort((a, b) => b.date - a.date);
  const recentActivities = activities.slice(0, 5);

  return (
    <Box sx={{ flexGrow: 1, py: 2 }}>
      <Grid container spacing={4}>
        {/* Left Side - Profile Summary & Stats */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3} sx={{ position: { md: 'sticky' }, top: '96px' }}>
            {/* User Info Card */}
            <Card
              sx={{
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                textAlign: 'center',
                p: 3,
              }}
            >
              <Avatar
                src={user.avatar_url || undefined}
                sx={{
                  width: 90,
                  height: 90,
                  bgcolor: '#667eea',
                  mx: 'auto',
                  mb: 2,
                  fontSize: '2rem',
                  fontWeight: 800,
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: '0 4px 10px rgba(102, 126, 234, 0.3)',
                }}
              >
                {displayLetter}
              </Avatar>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: '#1e293b',
                  fontFamily: "'Outfit', sans-serif",
                  mb: 0.5,
                }}
              >
                {displayName}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: '#64748b',
                  fontWeight: 600,
                  fontFamily: "'Outfit', sans-serif",
                  mb: 1.5,
                }}
              >
                @{user.username}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: '#475569',
                  fontWeight: 500,
                  fontFamily: "'Outfit', sans-serif",
                  mb: 1,
                }}
              >
                {user.email}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  color: '#94a3b8',
                  fontWeight: 500,
                  fontFamily: "'Outfit', sans-serif",
                  display: 'block',
                  mb: 2,
                }}
              >
                Joined {joinedDate}
              </Typography>

              <Stack direction="row" justifyContent="center" spacing={1} sx={{ mb: 3 }}>
                <Chip
                  icon={user.is_public ? <PublicIcon /> : <LockIcon />}
                  label={user.is_public ? 'Public Profile' : 'Private Profile'}
                  size="small"
                  sx={{
                    bgcolor: user.is_public ? 'rgba(34, 197, 94, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                    color: user.is_public ? '#22c55e' : '#64748b',
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                />
                {user.is_public && (
                  <Chip
                    icon={<LaunchIcon />}
                    label="View Public Link"
                    size="small"
                    onClick={() => navigate(`/users/${user.username}`)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      color: '#667eea',
                      fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  />
                )}
              </Stack>

              {!editMode ? (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setEditMode(true)}
                  startIcon={<EditIcon />}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    mb: 1.5,
                  }}
                >
                  Edit Profile
                </Button>
              ) : (
                <Stack spacing={1} sx={{ mb: 1.5 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setEditMode(false)}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Cancel
                  </Button>
                </Stack>
              )}

              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={handleLogout}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Logout
              </Button>
            </Card>

            {/* Learning Stats Card */}
            <Card
              sx={{
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                p: 3,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  color: '#1e293b',
                  fontFamily: "'Outfit', sans-serif",
                  mb: 2.5,
                }}
              >
                Learning Stats
              </Typography>

              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <SchoolIcon sx={{ color: '#667eea' }} />
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                      Enrolled Courses
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b', fontFamily: "'Outfit', sans-serif" }}>
                    {enrolledCourses.length}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <SchoolIcon sx={{ color: '#3b82f6' }} />
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                      In Progress
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b', fontFamily: "'Outfit', sans-serif" }}>
                    {coursesInProgress}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CheckCircleIcon sx={{ color: '#22c55e' }} />
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                      Courses Completed
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b', fontFamily: "'Outfit', sans-serif" }}>
                    {coursesCompleted}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <SchoolIcon sx={{ color: '#8b5cf6' }} />
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                      Hours of Learning
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b', fontFamily: "'Outfit', sans-serif" }}>
                    {totalHours} hrs
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <VisibilityIcon sx={{ color: '#764ba2' }} />
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                      Courses Viewed
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b', fontFamily: "'Outfit', sans-serif" }}>
                    {enrolledCourses.length > 0 ? enrolledCourses.length * 2 : 0}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <StarRateIcon sx={{ color: '#f59e0b' }} />
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                      Reviews Submitted
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b', fontFamily: "'Outfit', sans-serif" }}>
                    {myReviews.length}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Stack>
        </Grid>

        {/* Right Side - Form and Courses */}
        <Grid item xs={12} md={8}>
          <Stack spacing={4}>
            {/* profile details Card */}
            <Card
              sx={{
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                p: { xs: 3, sm: 4 },
              }}
            >
              {editMode ? (
                // EDIT MODE
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: '#1e293b',
                      fontFamily: "'Outfit', sans-serif",
                      mb: 3,
                    }}
                  >
                    Edit Profile Details
                  </Typography>

                  {/* Avatar upload subform */}
                  <Box sx={{ mb: 4, p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: "'Outfit', sans-serif", mb: 1.5 }}>
                      Profile Image Settings
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <Button
                          variant="contained"
                          component="label"
                          disabled={uploadingAvatar}
                          startIcon={<PhotoCameraIcon />}
                          sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 700,
                            fontFamily: "'Outfit', sans-serif",
                            bgcolor: '#667eea',
                          }}
                        >
                          {uploadingAvatar ? 'Uploading...' : 'Upload Image'}
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleAvatarUpload}
                          />
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <Stack direction="row" spacing={1}>
                          <TextField
                            size="small"
                            fullWidth
                            label="Or paste Avatar URL"
                            value={avatarUrlInput}
                            onChange={(e) => setAvatarUrlInput(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                          />
                          <Button
                            variant="outlined"
                            disabled={uploadingAvatar}
                            onClick={handleAvatarUrlUpdate}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontFamily: "'Outfit', sans-serif" }}
                          >
                            Update
                          </Button>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>

                  <form onSubmit={handleSave}>
                    <Stack spacing={3}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Username"
                            fullWidth
                            disabled
                            value={user.username}
                            helperText="Username cannot be changed"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Email Address"
                            fullWidth
                            disabled
                            value={user.email}
                            helperText="Email address cannot be changed"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                          />
                        </Grid>
                      </Grid>

                      <TextField
                        label="Full Name"
                        fullWidth
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />

                      <TextField
                        label="Location"
                        fullWidth
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. New York, USA"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />

                      <TextField
                        label="Bio"
                        fullWidth
                        multiline
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself, your learning goals, and experience..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />

                      <TextField
                        label="Skills / Expertise"
                        fullWidth
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        placeholder="e.g. React, Python, Data Analysis (comma-separated)"
                        helperText="Separate skills with commas"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />

                      <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: "'Outfit', sans-serif", mb: 1.5 }}>
                          Social Media Profiles
                        </Typography>
                        <Stack spacing={2}>
                          <TextField
                            size="small"
                            label="GitHub Profile URL"
                            value={socialGithub}
                            onChange={(e) => setSocialGithub(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                          />
                          <TextField
                            size="small"
                            label="LinkedIn Profile URL"
                            value={socialLinkedin}
                            onChange={(e) => setSocialLinkedin(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                          />
                          <TextField
                            size="small"
                            label="Twitter / X Profile URL"
                            value={socialTwitter}
                            onChange={(e) => setSocialTwitter(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                          />
                        </Stack>
                      </Box>

                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                            color: '#475569',
                            fontFamily: "'Outfit', sans-serif",
                            mb: 1.5,
                          }}
                        >
                          Interests Checkboxes
                        </Typography>
                        <Grid container spacing={1}>
                          {CATEGORIES.map((category) => (
                            <Grid item xs={6} sm={4} key={category}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={selectedInterests.includes(category)}
                                    onChange={() => handleInterestChange(category)}
                                    sx={{
                                      color: '#cbd5e1',
                                      '&.Mui-checked': {
                                        color: '#667eea',
                                      },
                                    }}
                                  />
                                }
                                label={
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: '#475569',
                                      fontWeight: 500,
                                      fontFamily: "'Outfit', sans-serif",
                                    }}
                                  >
                                    {category}
                                  </Typography>
                                }
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>

                      <Divider />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            sx={{
                              color: '#cbd5e1',
                              '&.Mui-checked': {
                                color: '#667eea',
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#1e293b',
                              fontWeight: 700,
                              fontFamily: "'Outfit', sans-serif",
                            }}
                          >
                            Make Profile Public (other users can view your profile details and courses)
                          </Typography>
                        }
                      />

                      <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        sx={{
                          py: 1.25,
                          alignSelf: 'flex-start',
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontFamily: "'Outfit', sans-serif",
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5a6fd6 0%, #683fa3 100%)',
                          },
                        }}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Stack>
                  </form>
                </Box>
              ) : (
                // VIEW MODE
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: '#1e293b',
                      fontFamily: "'Outfit', sans-serif",
                      mb: 2,
                    }}
                  >
                    Personal Biography
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#475569',
                      fontFamily: "'Outfit', sans-serif",
                      lineHeight: 1.7,
                      mb: 3,
                    }}
                  >
                    {user.bio || "No biography provided yet. Edit your profile to tell us about your goals."}
                  </Typography>

                  {user.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475569', mb: 3 }}>
                      <LocationOnIcon sx={{ color: '#ef4444' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                        Location: {user.location}
                      </Typography>
                    </Box>
                  )}

                  {selectedInterests.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, color: '#1e293b', fontFamily: "'Outfit', sans-serif", mb: 1 }}
                      >
                        Interests
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedInterests.map((interest) => (
                          <Chip
                            key={interest}
                            label={interest}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(118, 75, 162, 0.08)',
                              color: '#764ba2',
                              fontWeight: 600,
                              fontFamily: "'Outfit', sans-serif",
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {skillsList.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, color: '#1e293b', fontFamily: "'Outfit', sans-serif", mb: 1 }}
                      >
                        Skills & Expertise
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {skillsList.map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(102, 126, 234, 0.08)',
                              color: '#667eea',
                              fontWeight: 600,
                              fontFamily: "'Outfit', sans-serif",
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {user.social_links && Object.values(user.social_links).some(Boolean) && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, color: '#1e293b', fontFamily: "'Outfit', sans-serif", mb: 1.5 }}
                      >
                        Social Profiles
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {user.social_links.github && (
                          <Tooltip title="GitHub">
                            <IconButton component={Link} href={user.social_links.github} target="_blank" rel="noopener">
                              <GitHubIcon sx={{ color: '#1e293b' }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {user.social_links.linkedin && (
                          <Tooltip title="LinkedIn">
                            <IconButton component={Link} href={user.social_links.linkedin} target="_blank" rel="noopener">
                              <LinkedInIcon sx={{ color: '#0a66c2' }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {user.social_links.twitter && (
                          <Tooltip title="Twitter">
                            <IconButton component={Link} href={user.social_links.twitter} target="_blank" rel="noopener">
                              <TwitterIcon sx={{ color: '#1d9bf0' }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Box>
                  )}
                </Box>
              )}
            </Card>

            {/* My Reviews Card */}
            <Card
              sx={{
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                p: { xs: 3, sm: 4 },
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
                My Reviews ({myReviews.length})
              </Typography>
              {myReviews.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#64748b', fontFamily: "'Outfit', sans-serif", fontStyle: 'italic' }}>
                  You haven't reviewed any courses yet.
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {myReviews.map((rev, idx) => (
                    <Box key={rev.id}>
                      {idx > 0 && <Divider sx={{ my: 2 }} />}
                      <ListItem
                        disablePadding
                        alignItems="flex-start"
                        secondaryAction={
                          <IconButton edge="end" color="error" onClick={() => handleDeleteMyReview(rev.id)}>
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle1"
                              onClick={() => navigate(`/courses/${rev.course_id}`)}
                              sx={{
                                fontWeight: 800,
                                color: '#1e293b',
                                fontFamily: "'Outfit', sans-serif",
                                cursor: 'pointer',
                                '&:hover': { color: '#667eea' }
                              }}
                            >
                              {rev.course?.title || `Course ID: ${rev.course_id}`}
                            </Typography>
                          }
                          secondary={
                            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                              <Rating value={rev.rating} readOnly size="small" sx={{ color: '#f59e0b' }} />
                              <Typography variant="body2" sx={{ color: '#475569', fontFamily: "'Outfit', sans-serif", mt: 0.5 }}>
                                {rev.comment || 'No comments.'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: "'Outfit', sans-serif" }}>
                                Reviewed on {new Date(rev.created_at).toLocaleDateString()}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </Card>

            {/* Recent Activity Card */}
            <Card
              sx={{
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                p: { xs: 3, sm: 4 },
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
                Recent Activity
              </Typography>
              {recentActivities.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#64748b', fontFamily: "'Outfit', sans-serif", fontStyle: 'italic' }}>
                  No recent activities logged.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {recentActivities.map((act, idx) => (
                    <Box key={idx} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography
                          variant="body2"
                          onClick={() => navigate(act.link)}
                          sx={{
                            fontWeight: 700,
                            color: '#1e293b',
                            fontFamily: "'Outfit', sans-serif",
                            cursor: 'pointer',
                            '&:hover': { color: '#667eea' }
                          }}
                        >
                          {act.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: "'Outfit', sans-serif" }}>
                          {act.date.toLocaleDateString()}
                        </Typography>
                      </Stack>
                      {act.subtitle && (
                        <Typography variant="body2" sx={{ color: '#64748b', fontFamily: "'Outfit', sans-serif", mt: 0.5, fontStyle: 'italic' }}>
                          "{act.subtitle}"
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </Card>

            {/* My Enrolled Courses Section */}
            <Card
              sx={{
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                p: { xs: 3, sm: 4 },
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
                My Enrolled Courses
              </Typography>

              {enrolledCourses.length === 0 ? (
                <Stack spacing={2} alignItems="center" sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ color: '#64748b', fontFamily: "'Outfit', sans-serif" }}>
                    You haven't enrolled in any courses yet. Start browsing to find the perfect course!
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
                </Stack>
              ) : (
                <List sx={{ width: '100%' }}>
                  {enrolledCourses.map((item, index) => {
                    const c = item.course;
                    if (!c) return null;
                    return (
                      <Box key={c.id}>
                        {index > 0 && <Divider sx={{ my: 2 }} />}
                        <ListItem
                          alignItems="flex-start"
                          disablePadding
                          sx={{ display: 'block' }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6}>
                              <ListItemText
                                primary={
                                  <Typography
                                    variant="subtitle1"
                                    onClick={() => navigate(`/courses/${c.id}`)}
                                    sx={{
                                      fontWeight: 800,
                                      color: '#1e293b',
                                      fontFamily: "'Outfit', sans-serif",
                                      cursor: 'pointer',
                                      '&:hover': { color: '#667eea' },
                                    }}
                                  >
                                    {c.title}
                                  </Typography>
                                }
                                secondary={
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: '#64748b',
                                        fontFamily: "'Outfit', sans-serif",
                                      }}
                                    >
                                      Category: {c.category} | Level: {c.level}
                                    </Typography>
                                    <Chip
                                      label={item.progress >= 100 ? 'Completed' : 'In Progress'}
                                      size="small"
                                      sx={{
                                        fontSize: '0.65rem',
                                        height: 20,
                                        fontWeight: 700,
                                        fontFamily: "'Outfit', sans-serif",
                                        backgroundColor: item.progress >= 100 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(102, 126, 234, 0.1)',
                                        color: item.progress >= 100 ? '#22c55e' : '#667eea',
                                        border: item.progress >= 100 ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(102, 126, 234, 0.2)',
                                      }}
                                    />
                                    {item.progress >= 100 && c.has_certificate && (
                                      <Chip
                                        icon={<WorkspacePremiumIcon sx={{ color: '#ffd700 !important', fontSize: '0.9rem !important' }} />}
                                        label="Certificate Earned"
                                        size="small"
                                        sx={{
                                          fontSize: '0.65rem',
                                          height: 20,
                                          fontWeight: 700,
                                          fontFamily: "'Outfit', sans-serif",
                                          backgroundColor: 'rgba(15, 23, 42, 0.85)',
                                          color: '#ffffff',
                                          border: '1px solid rgba(255, 215, 0, 0.3)',
                                        }}
                                      />
                                    )}
                                  </Stack>
                                }
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Box sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', fontFamily: "'Outfit', sans-serif" }}>
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
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: '#e2e8f0',
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 4,
                                      backgroundColor: item.progress >= 100 ? '#22c55e' : '#667eea',
                                    },
                                  }}
                                />
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={2.5} sx={{ textAlign: { sm: 'right' } }}>
                              <Stack spacing={1} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => navigate(`/courses/${c.id}`)}
                                  sx={{
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontFamily: "'Outfit', sans-serif",
                                    borderColor: '#e2e8f0',
                                    color: '#667eea',
                                    width: '100%',
                                    maxWidth: '130px',
                                    '&:hover': {
                                      borderColor: '#667eea',
                                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                                    },
                                  }}
                                >
                                  {item.progress >= 100 ? 'Review' : 'Continue'}
                                </Button>
                                {item.progress >= 100 && c.has_certificate && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => handleOpenCertificate(c.id, c.title)}
                                    sx={{
                                      borderRadius: '8px',
                                      textTransform: 'none',
                                      fontWeight: 700,
                                      fontFamily: "'Outfit', sans-serif",
                                      background: 'linear-gradient(135deg, #ffd700 0%, #d4af37 100%)',
                                      color: '#1e293b',
                                      fontSize: '0.7rem',
                                      width: '100%',
                                      maxWidth: '130px',
                                      boxShadow: 'none',
                                      '&:hover': {
                                        background: 'linear-gradient(135deg, #e5b800 0%, #b8901c 100%)',
                                      },
                                    }}
                                  >
                                    Certificate
                                  </Button>
                                )}
                              </Stack>
                            </Grid>
                          </Grid>
                        </ListItem>
                      </Box>
                    );
                  })}
                </List>
              )}
            </Card>
          </Stack>
        </Grid>
      </Grid>
      {activeCourseId && (
        <CertificateModal
          open={certOpen}
          onClose={() => {
            setCertOpen(false);
            setActiveCourseId(null);
            setActiveCourseTitle('');
          }}
          courseId={activeCourseId}
          courseTitle={activeCourseTitle}
        />
      )}
    </Box>
  );
}

