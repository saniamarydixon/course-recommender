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
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTogglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      
      // Fetch user profile immediately
      const profileResponse = await api.get('/users/me');
      localStorage.setItem('user', JSON.stringify(profileResponse.data));

      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Invalid email or password';
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
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
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
                Sign In
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#64748b',
                  fontWeight: 500,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Welcome back! Log in to continue your learning journey
              </Typography>
            </Box>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    },
                  }}
                />

                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleTogglePassword} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    },
                  }}
                />

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
                  {loading ? 'Connecting to server...' : 'Login'}
                </Button>

                {loading && (
                  <Typography
                    variant="caption"
                    align="center"
                    sx={{
                      color: '#64748b',
                      fontWeight: 500,
                      fontFamily: "'Outfit', sans-serif",
                      mt: 1,
                      display: 'block',
                      animation: 'pulse 1.5s infinite ease-in-out',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 0.6 },
                        '50%': { opacity: 1 },
                      }
                    }}
                  >
                    Connecting to server... This may take 30 seconds on first request
                  </Typography>
                )}
              </Box>
            </form>

            {/* Register Link */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#64748b',
                  fontWeight: 500,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Don't have an account?{' '}
                <RouterLink
                  to="/register"
                  style={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                >
                  Create Account
                </RouterLink>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
