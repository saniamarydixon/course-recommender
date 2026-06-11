import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent, CardMedia,
  Box, Chip, Button, CircularProgress, Alert, IconButton,
  LinearProgress, Stack, Avatar
} from '@mui/material';
import { 
  ArrowBack as BackIcon,
  School as SchoolIcon,
  AccessTime as TimeIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon,
  PlayArrow as PlayIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function LearningPathDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let mounted = true;
    
    const fetchPath = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/learning-paths/${id}`);
        if (mounted) {
          setPath(response.data);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load learning path');
          console.error(err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchPath();
    return () => { mounted = false; };
  }, [id]);
  
  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }
  
  if (error || !path) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ fontFamily: "'Outfit', sans-serif" }}>{error || 'Path not found'}</Alert>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/learning-paths')}
          sx={{ mt: 2, fontFamily: "'Outfit', sans-serif", textTransform: 'none', fontWeight: 700 }}
        >
          Back to Learning Paths
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button 
        startIcon={<BackIcon />} 
        onClick={() => navigate('/learning-paths')}
        sx={{ mb: 3, fontFamily: "'Outfit', sans-serif", textTransform: 'none', fontWeight: 700, color: '#64748b' }}
      >
        Back to Learning Paths
      </Button>
      
      {/* Header Section */}
      <Card 
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${path.color}22 0%, ${path.color}44 100%)`,
          borderLeft: `8px solid ${path.color}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          <Typography variant="h1" sx={{ fontSize: { xs: 60, sm: 80 } }}>
            {path.icon}
          </Typography>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ fontFamily: "'Outfit', sans-serif" }}>
              {path.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, fontFamily: "'Outfit', sans-serif" }}>
              {path.description}
            </Typography>
          </Box>
        </Box>
        
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
          <Chip 
            icon={<TimeIcon />} 
            label={path.duration} 
            sx={{ bgcolor: 'white', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}
          />
          <Chip 
            label={path.level}
            sx={{ bgcolor: path.color, color: 'white', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}
          />
          <Chip 
            icon={<SchoolIcon />} 
            label={`${path.total_courses} courses`}
            sx={{ bgcolor: 'white', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}
          />
          <Chip 
            icon={<TimeIcon />} 
            label={`${path.total_hours} hours total`}
            sx={{ bgcolor: 'white', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}
          />
        </Stack>
      </Card>
      
      {/* Courses Timeline */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, fontFamily: "'Outfit', sans-serif" }}>
        📚 Recommended Course Sequence
      </Typography>
      
      <Stack spacing={2}>
        {path.courses.map((course, index) => (
          <Card 
            key={course.id}
            sx={{ 
              p: 3,
              borderRadius: 3,
              borderLeft: `6px solid ${path.color}`,
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateX(8px)',
                boxShadow: 4
              }
            }}
          >
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
              <Avatar 
                sx={{ 
                  width: 56, 
                  height: 56, 
                  bgcolor: path.color,
                  color: 'white',
                  fontSize: 24,
                  fontWeight: 'bold',
                  fontFamily: "'Outfit', sans-serif"
                }}
              >
                {index + 1}
              </Avatar>
              
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: "'Outfit', sans-serif" }}>
                  {course.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontFamily: "'Outfit', sans-serif" }}>
                  By {course.instructor}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                  <Chip 
                    label={course.level} 
                    size="small"
                    color={course.level === 'Beginner' ? 'success' : course.level === 'Intermediate' ? 'warning' : 'error'}
                    sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}
                  />
                  <Chip 
                    icon={<TimeIcon />}
                    label={`${course.duration_hours}h`} 
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: "'Outfit', sans-serif" }}
                  />
                  <Chip 
                    icon={<StarIcon sx={{ color: '#f59e0b !important' }} />}
                    label={course.rating?.toFixed(1) || 'N/A'} 
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: "'Outfit', sans-serif" }}
                  />
                  <Chip 
                    label={course.price === 0 ? 'FREE' : `$${course.price}`}
                    size="small"
                    color={course.price === 0 ? 'success' : 'primary'}
                    sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}
                  />
                </Stack>
              </Box>
              
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={() => navigate(`/courses/${course.id}`)}
                sx={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  background: `linear-gradient(135deg, ${path.color} 0%, ${path.color}dd 100%)`,
                  color: 'white',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${path.color}ee 0%, ${path.color} 100%)`,
                  }
                }}
              >
                View Course
              </Button>
            </Box>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}

export default LearningPathDetail;
