import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  FormControlLabel,
  Checkbox,
  Grid,
} from '@mui/material';
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

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInterestChange = (category) => {
    if (selectedInterests.includes(category)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== category));
    } else {
      setSelectedInterests([...selectedInterests, category]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !username || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (username.length < 3) {
      toast.error('Username must be at least 3 characters long');
      return;
    }

    setLoading(true);
    try {
      // 1. Register user
      const registerRes = await api.post('/auth/register', {
        email,
        username,
        password,
        full_name: fullName,
      });

      const { access_token } = registerRes.data;
      
      // Save token in localStorage
      localStorage.setItem('token', access_token);

      // 2. If interests selected, save them via user profile update
      const interestsString = selectedInterests.join(',');
      
      // Call PUT /users/me to save interests
      await api.put('/users/me', {
        full_name: fullName,
        interests: interestsString,
      });

      // 3. Fetch latest user details and save to localStorage
      const profileRes = await api.get('/users/me');
      localStorage.setItem('user', JSON.stringify(profileRes.data));

      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Registration failed';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 6,
        px: 2,
      }}
    >
      <Container maxWidth="md">
        <Card
          sx={{
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: { xs: 4, sm: 6 } }}>
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontFamily: "'Outfit', sans-serif",
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                Create Account
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#64748b',
                  fontWeight: 500,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Sign up to get personalized course recommendations
              </Typography>
            </Box>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Details Section */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField
                      label="Full Name"
                      fullWidth
                      variant="outlined"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                    <TextField
                      label="Username"
                      fullWidth
                      variant="outlined"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                    <TextField
                      label="Email Address"
                      type="email"
                      fullWidth
                      variant="outlined"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                    <TextField
                      label="Password (min 8 chars)"
                      type="password"
                      fullWidth
                      variant="outlined"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Box>
                </Grid>

                {/* Interests Section */}
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      color: '#475569',
                      fontFamily: "'Outfit', sans-serif",
                      mb: 1,
                    }}
                  >
                    Select Your Interests:
                  </Typography>
                  <Grid container spacing={1}>
                    {CATEGORIES.map((category) => (
                      <Grid item xs={6} key={category}>
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
                </Grid>

                {/* Submit button */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
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
                        transform: 'scale(1.01)',
                        boxShadow: '0 6px 16px rgba(102, 126, 234, 0.45)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </Grid>
              </Grid>
            </form>

            {/* Login Link */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#64748b',
                  fontWeight: 500,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Already have an account?{' '}
                <RouterLink
                  to="/login"
                  style={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                >
                  Sign In
                </RouterLink>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
