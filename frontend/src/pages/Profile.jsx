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
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StarRateIcon from '@mui/icons-material/StarRate';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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

export default function Profile() {
  const [user, setUser] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const fetchProfileData = async () => {
    try {
      const userRes = await api.get('/users/me');
      setUser(userRes.data);
      setFullName(userRes.data.full_name || '');
      setBio(userRes.data.bio || '');
      
      const interestList = userRes.data.interests
        ? userRes.data.interests.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      setSelectedInterests(interestList);

      localStorage.setItem('user', JSON.stringify(userRes.data));

      const enrolledRes = await api.get('/users/me/enrolled-courses');
      setEnrolledCourses(enrolledRes.data);
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
      };

      const res = await api.put('/users/me', payload);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      toast.success('Profile updated successfully!');
      fetchProfileData(); // Reload
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
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
                  mb: 2,
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
                  mb: 3,
                }}
              >
                Joined {joinedDate}
              </Typography>

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
                    0
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Stack>
        </Grid>

        {/* Right Side - Form and Courses */}
        <Grid item xs={12} md={8}>
          <Stack spacing={4}>
            {/* Edit Profile Form */}
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
                Edit Profile
              </Typography>

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
                    label="Bio"
                    fullWidth
                    multiline
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself, your learning goals, and experience..."
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />

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
                            <Grid item xs={12} sm={2} sx={{ textAlign: { sm: 'right' } }}>
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
                                  '&:hover': {
                                    borderColor: '#667eea',
                                    backgroundColor: 'rgba(102, 126, 234, 0.04)',
                                  },
                                }}
                              >
                                {item.progress >= 100 ? 'Review' : 'Continue'}
                              </Button>
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
    </Box>
  );
}
