import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Stack,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Link,
  Tooltip,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import MessageIcon from '@mui/icons-material/Message';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/users/${username}`);
        setProfileUser(res.data);
      } catch (err) {
        console.error("Failed to fetch public profile:", err);
        setError(err.response?.data?.detail || "Could not retrieve profile");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchPublicProfile();
    }
  }, [username]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", color: '#64748b' }}>
          Loading profile...
        </Typography>
      </Box>
    );
  }

  if (error) {
    const isPrivate = error.toLowerCase().includes('private');
    return (
      <Box sx={{ flexGrow: 1, py: 4, maxWidth: '600px', mx: 'auto', textAlign: 'center' }}>
        <Card
          sx={{
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
            p: 4,
          }}
        >
          {isPrivate ? (
            <LockIcon sx={{ fontSize: '4.5rem', color: '#94a3b8', mb: 2 }} />
          ) : (
            <LockIcon sx={{ fontSize: '4.5rem', color: '#ef4444', mb: 2 }} />
          )}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontFamily: "'Outfit', sans-serif",
              color: '#1e293b',
              mb: 1,
            }}
          >
            {isPrivate ? 'Private Profile' : 'Error'}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: "'Outfit', sans-serif",
              color: '#64748b',
              mb: 3,
            }}
          >
            {error}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: '10px',
              px: 3,
              py: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Go Back
          </Button>
        </Card>
      </Box>
    );
  }

  const displayName = profileUser.full_name || profileUser.username;
  const displayLetter = displayName.charAt(0).toUpperCase();
  const joinedDate = new Date(profileUser.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });

  const skillsList = profileUser.skills
    ? profileUser.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const handleSendMessage = () => {
    toast.info(`Messaging system is currently under development. You cannot message @${profileUser.username} yet!`);
  };

  const enrolledCourses = profileUser.enrolled_courses || [];
  const completedCourses = enrolledCourses.filter((c) => c.progress >= 100);

  return (
    <Box sx={{ flexGrow: 1, py: 3 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{
          mb: 3,
          color: '#64748b',
          fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          textTransform: 'none',
          '&:hover': { color: '#667eea', bgcolor: 'transparent' },
        }}
      >
        Back
      </Button>

      <Grid container spacing={4}>
        {/* Left column - Card details */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: '24px',
              border: '1px solid #f1f5f9',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
              textAlign: 'center',
              p: 4,
              background: '#ffffff',
            }}
          >
            <Avatar
              src={profileUser.avatar_url || undefined}
              sx={{
                width: 120,
                height: 120,
                bgcolor: '#667eea',
                mx: 'auto',
                mb: 2,
                fontSize: '2.5rem',
                fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                boxShadow: '0 10px 20px rgba(102, 126, 234, 0.25)',
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
                color: '#667eea',
                fontWeight: 700,
                fontFamily: "'Outfit', sans-serif",
                mb: 1.5,
              }}
            >
              @{profileUser.username}
            </Typography>

            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Chip
                icon={<PublicIcon sx={{ color: '#22c55e !important' }} />}
                label="Public Profile"
                size="small"
                sx={{
                  bgcolor: 'rgba(34, 197, 94, 0.1)',
                  color: '#22c55e',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  fontFamily: "'Outfit', sans-serif",
                }}
              />
            </Stack>

            {profileUser.location && (
              <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ color: '#64748b', mb: 2 }}>
                <LocationOnIcon fontSize="small" sx={{ color: '#ef4444' }} />
                <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: "'Outfit', sans-serif" }}>
                  {profileUser.location}
                </Typography>
              </Stack>
            )}

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
              Member since {joinedDate}
            </Typography>

            {/* Social Links */}
            {profileUser.social_links && Object.values(profileUser.social_links).some(Boolean) && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: '#64748b',
                    fontFamily: "'Outfit', sans-serif",
                    mb: 1.5,
                  }}
                >
                  Social Profiles
                </Typography>
                <Stack direction="row" justifyContent="center" spacing={1.5}>
                  {profileUser.social_links.github && (
                    <Tooltip title="GitHub">
                      <IconButton
                        component={Link}
                        href={profileUser.social_links.github}
                        target="_blank"
                        rel="noopener"
                        sx={{
                          bgcolor: '#f8fafc',
                          color: '#1e293b',
                          '&:hover': { bgcolor: '#e2e8f0' },
                        }}
                      >
                        <GitHubIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {profileUser.social_links.linkedin && (
                    <Tooltip title="LinkedIn">
                      <IconButton
                        component={Link}
                        href={profileUser.social_links.linkedin}
                        target="_blank"
                        rel="noopener"
                        sx={{
                          bgcolor: '#f8fafc',
                          color: '#0a66c2',
                          '&:hover': { bgcolor: '#e2e8f0' },
                        }}
                      >
                        <LinkedInIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {profileUser.social_links.twitter && (
                    <Tooltip title="Twitter">
                      <IconButton
                        component={Link}
                        href={profileUser.social_links.twitter}
                        target="_blank"
                        rel="noopener"
                        sx={{
                          bgcolor: '#f8fafc',
                          color: '#1d9bf0',
                          '&:hover': { bgcolor: '#e2e8f0' },
                        }}
                      >
                        <TwitterIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              startIcon={<MessageIcon />}
              onClick={handleSendMessage}
              sx={{
                py: 1.25,
                borderRadius: '12px',
                fontWeight: 700,
                fontFamily: "'Outfit', sans-serif",
                textTransform: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd6 0%, #683fa3 100%)',
                },
              }}
            >
              Send Message
            </Button>
          </Card>
        </Grid>

        {/* Right column - Bio, Skills, and Enrolled Courses */}
        <Grid item xs={12} md={8}>
          <Stack spacing={4}>
            {/* Bio Card */}
            <Card
              sx={{
                borderRadius: '24px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                p: 4,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: '#1e293b',
                  fontFamily: "'Outfit', sans-serif",
                  mb: 2,
                }}
              >
                About Me
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#475569',
                  fontFamily: "'Outfit', sans-serif",
                  lineHeight: 1.7,
                }}
              >
                {profileUser.bio || "No biography provided yet."}
              </Typography>

              {skillsList.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 800,
                      color: '#1e293b',
                      fontFamily: "'Outfit', sans-serif",
                      mb: 1.5,
                    }}
                  >
                    Skills & Expertise
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {skillsList.map((skill, idx) => (
                      <Chip
                        key={idx}
                        label={skill}
                        sx={{
                          bgcolor: 'rgba(102, 126, 234, 0.08)',
                          color: '#667eea',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          fontFamily: "'Outfit', sans-serif",
                          borderRadius: '8px',
                          border: '1px solid rgba(102, 126, 234, 0.15)',
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </Card>

            {/* Courses Card */}
            <Card
              sx={{
                borderRadius: '24px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                p: 4,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: '#1e293b',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  Enrolled Courses ({enrolledCourses.length})
                </Typography>
                {completedCourses.length > 0 && (
                  <Chip
                    icon={<CheckCircleIcon sx={{ color: '#22c55e !important' }} />}
                    label={`${completedCourses.length} Completed`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(34, 197, 94, 0.1)',
                      color: '#22c55e',
                      fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  />
                )}
              </Box>

              {enrolledCourses.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <SchoolIcon sx={{ fontSize: '3.5rem', color: '#94a3b8', mb: 1.5 }} />
                  <Typography variant="body1" sx={{ color: '#64748b', fontFamily: "'Outfit', sans-serif" }}>
                    Not enrolled in any courses yet.
                  </Typography>
                </Box>
              ) : (
                <List sx={{ width: '100%' }}>
                  {enrolledCourses.map((item, index) => {
                    const c = item.course;
                    if (!c) return null;
                    return (
                      <Box key={c.id}>
                        {index > 0 && <Divider sx={{ my: 2.5 }} />}
                        <ListItem
                          alignItems="flex-start"
                          disablePadding
                          sx={{ display: 'block' }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={7}>
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
                                        fontSize: '0.8rem',
                                      }}
                                    >
                                      Category: {c.category} | Level: {c.level}
                                    </Typography>
                                    <Chip
                                      label={item.progress >= 100 ? 'Completed' : 'In Progress'}
                                      size="small"
                                      sx={{
                                        fontSize: '0.6rem',
                                        height: 18,
                                        fontWeight: 700,
                                        fontFamily: "'Outfit', sans-serif",
                                        backgroundColor: item.progress >= 100 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(102, 126, 234, 0.1)',
                                        color: item.progress >= 100 ? '#22c55e' : '#667eea',
                                      }}
                                    />
                                  </Stack>
                                }
                              />
                            </Grid>
                            <Grid item xs={12} sm={5}>
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
