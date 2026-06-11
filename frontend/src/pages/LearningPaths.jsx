import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent,
  Box, Chip, Button, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, FormControl, InputLabel, Select,
  RadioGroup, FormControlLabel, Radio, Stack, Paper
} from '@mui/material';
import { 
  School as SchoolIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingIcon,
  PlayArrow as PlayIcon,
  Work as WorkIcon,
  AutoAwesome as MagicIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

function LearningPaths() {
  const navigate = useNavigate();
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Custom Roadmap States
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [skill, setSkill] = useState('');
  const [targetLevel, setTargetLevel] = useState('Beginner');
  const [timeline, setTimeline] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [customRoadmap, setCustomRoadmap] = useState(null);
  const [showCustomResult, setShowCustomResult] = useState(false);
  
  const skills = [
    'Python', 'JavaScript', 'Web Development', 
    'Data Science', 'Machine Learning', 'AI',
    'Mobile Development', 'Cloud Computing', 
    'Cybersecurity', 'Design', 'Business'
  ];
  
  useEffect(() => {
    let mounted = true;
    
    const fetchPaths = async () => {
      try {
        setLoading(true);
        const response = await api.get('/learning-paths/');
        if (mounted) {
          setPaths(response.data.learning_paths || []);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load learning paths');
          console.error(err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchPaths();
    return () => { mounted = false; };
  }, []);
  
  const handleGenerateCustom = async () => {
    if (!skill) {
      toast.error('Please select a skill');
      return;
    }
    
    setGenerating(true);
    try {
      const response = await api.post('/learning-paths/generate-custom', {
        skill,
        target_level: targetLevel,
        timeline_months: timeline
      });
      
      setCustomRoadmap(response.data);
      setShowCustomResult(true);
      setCustomDialogOpen(false);
      toast.success(`🎉 ${skill} roadmap generated!`);
      
      // Reset form
      setSkill('');
      setTargetLevel('Beginner');
      setTimeline(3);
    } catch (err) {
      toast.error('Failed to generate roadmap');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };
  
  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2, fontFamily: "'Outfit', sans-serif" }}>Loading learning paths...</Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontFamily: "'Outfit', sans-serif" }}>
          🗺️ Learning Paths
        </Typography>
        <Typography color="text.secondary" sx={{ fontFamily: "'Outfit', sans-serif" }}>
          Choose from recommended paths or create your own custom roadmap
        </Typography>
      </Box>
      
      {/* Create Custom Roadmap Section */}
      <Paper 
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: '0 8px 32px 0 rgba(102, 126, 234, 0.2)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontFamily: "'Outfit', sans-serif" }}>
              ✨ Create Your Custom Roadmap
            </Typography>
            <Typography sx={{ opacity: 0.9, mb: 2, fontFamily: "'Outfit', sans-serif" }}>
              Generate a personalized learning path based on your skill, level, and timeline
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<MagicIcon />}
            onClick={() => setCustomDialogOpen(true)}
            sx={{
              bgcolor: 'white',
              color: '#667eea',
              fontWeight: 800,
              fontFamily: "'Outfit', sans-serif",
              px: 4,
              py: 1.5,
              textTransform: 'none',
              borderRadius: '12px',
              '&:hover': {
                bgcolor: '#f1f5f9'
              }
            }}
          >
            Generate Custom Path
          </Button>
        </Box>
      </Paper>
      
      {/* Show Generated Custom Roadmap */}
      {showCustomResult && customRoadmap && (
        <Card 
          sx={{ 
            mb: 4, 
            p: 4, 
            borderRadius: 3,
            border: `3px solid ${customRoadmap.color}`,
            background: `linear-gradient(135deg, ${customRoadmap.color}11 0%, ${customRoadmap.color}33 100%)`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            <Typography variant="h1" sx={{ fontSize: { xs: 60, sm: 80 } }}>
              {customRoadmap.icon}
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ fontFamily: "'Outfit', sans-serif" }}>
                {customRoadmap.title}
              </Typography>
              <Typography color="text.secondary" sx={{ fontFamily: "'Outfit', sans-serif", mt: 0.5 }}>
                {customRoadmap.description}
              </Typography>
            </Box>
            <Button 
              variant="outlined" 
              onClick={() => setShowCustomResult(false)}
              sx={{ 
                fontFamily: "'Outfit', sans-serif", 
                fontWeight: 700, 
                textTransform: 'none',
                borderColor: '#cbd5e1',
                color: '#475569',
                '&:hover': { borderColor: '#94a3b8' }
              }}
            >
              Hide
            </Button>
          </Box>
          
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 3, gap: 1 }}>
            <Chip 
              icon={<SchoolIcon sx={{ color: 'white !important' }} />} 
              label={`${customRoadmap.total_courses} courses`}
              sx={{ bgcolor: customRoadmap.color, color: 'white', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}
            />
            <Chip 
              icon={<TimeIcon sx={{ color: 'white !important' }} />} 
              label={`${customRoadmap.total_hours} hours total`}
              sx={{ bgcolor: customRoadmap.color, color: 'white', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}
            />
            <Chip 
              icon={<TrendingIcon />} 
              label={`Target: ${customRoadmap.target_level}`}
              variant="outlined"
              sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}
            />
            <Chip 
              icon={<TimeIcon />} 
              label={`${customRoadmap.timeline_months} months timeline`}
              variant="outlined"
              sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}
            />
          </Stack>
          
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, fontFamily: "'Outfit', sans-serif" }}>
            📚 Recommended Course Sequence
          </Typography>
          
          <Stack spacing={2}>
            {customRoadmap.courses.map((course, index) => (
              <Card 
                key={course.id}
                sx={{ 
                  p: 2.5,
                  borderRadius: 3,
                  borderLeft: `6px solid ${customRoadmap.color}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateX(8px)',
                    boxShadow: 3
                  }
                }}
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                  <Box 
                    sx={{ 
                      bgcolor: customRoadmap.color,
                      color: 'white',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontFamily: "'Outfit', sans-serif"
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ fontFamily: "'Outfit', sans-serif" }}>
                      {course.title}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5, gap: 0.5 }}>
                      <Chip label={course.level} size="small" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }} />
                      <Chip label={`${course.duration_hours}h`} size="small" variant="outlined" sx={{ fontFamily: "'Outfit', sans-serif" }} />
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
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/courses/${course.id}`);
                    }}
                    sx={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: '8px',
                      background: `linear-gradient(135deg, ${customRoadmap.color} 0%, ${customRoadmap.color}dd 100%)`,
                      color: 'white',
                      '&:hover': {
                        background: `linear-gradient(135deg, ${customRoadmap.color}ee 0%, ${customRoadmap.color} 100%)`,
                      }
                    }}
                  >
                    View Course
                  </Button>
                </Box>
              </Card>
            ))}
          </Stack>
        </Card>
      )}
      
      {/* Pre-defined Learning Paths */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, fontFamily: "'Outfit', sans-serif" }}>
        🌟 Popular Learning Paths
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2, fontFamily: "'Outfit', sans-serif" }}>{error}</Alert>
      )}
      
      <Grid container spacing={3}>
        {paths.map((path) => (
          <Grid item xs={12} md={6} lg={4} key={path.id}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 3,
                transition: 'all 0.3s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 8
                }
              }}
              onClick={() => navigate(`/learning-paths/${path.id}`)}
            >
              <Box 
                sx={{ 
                  p: 4,
                  background: `linear-gradient(135deg, ${path.color}22 0%, ${path.color}55 100%)`,
                  borderBottom: `4px solid ${path.color}`,
                  textAlign: 'center'
                }}
              >
                <Typography variant="h1" sx={{ fontSize: '64px' }}>
                  {path.icon}
                </Typography>
              </Box>
              
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontFamily: "'Outfit', sans-serif" }}>
                  {path.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mb: 2, minHeight: 50, fontFamily: "'Outfit', sans-serif" }}
                >
                  {path.description}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    icon={<WorkIcon sx={{ color: 'white !important' }} />} 
                    label={path.career} 
                    size="small"
                    sx={{ bgcolor: path.color, color: 'white', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip icon={<TimeIcon />} label={path.duration} size="small" sx={{ fontFamily: "'Outfit', sans-serif" }} />
                  <Chip icon={<TrendingIcon />} label={path.level} size="small" variant="outlined" sx={{ fontFamily: "'Outfit', sans-serif" }} />
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  mb: 2,
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 2
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <SchoolIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: "'Outfit', sans-serif" }}>
                      {path.total_courses}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: "'Outfit', sans-serif" }}>Courses</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <TimeIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: "'Outfit', sans-serif" }}>
                      {path.total_hours}h
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: "'Outfit', sans-serif" }}>Total Hours</Typography>
                  </Box>
                </Box>
                
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<PlayIcon />}
                  sx={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${path.color} 0%, ${path.color}dd 100%)`,
                    color: 'white',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${path.color}ee 0%, ${path.color} 100%)`,
                    }
                  }}
                >
                  Start Learning Path
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Custom Roadmap Dialog */}
      <Dialog 
        open={customDialogOpen} 
        onClose={() => setCustomDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', p: 1 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <MagicIcon color="primary" />
            <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: "'Outfit', sans-serif" }}>
              Create Custom Roadmap
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontFamily: "'Outfit', sans-serif" }}>Choose Skill *</InputLabel>
              <Select
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                label="Choose Skill *"
                sx={{ fontFamily: "'Outfit', sans-serif", borderRadius: '8px' }}
              >
                {skills.map((s) => (
                  <MenuItem key={s} value={s} sx={{ fontFamily: "'Outfit', sans-serif" }}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary', fontFamily: "'Outfit', sans-serif" }}>
                Target Level *
              </Typography>
              <RadioGroup
                row
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
              >
                <FormControlLabel value="Beginner" control={<Radio />} label="Beginner" slotProps={{ typography: { sx: { fontFamily: "'Outfit', sans-serif" } } }} />
                <FormControlLabel value="Intermediate" control={<Radio />} label="Intermediate" slotProps={{ typography: { sx: { fontFamily: "'Outfit', sans-serif" } } }} />
                <FormControlLabel value="Advanced" control={<Radio />} label="Advanced" slotProps={{ typography: { sx: { fontFamily: "'Outfit', sans-serif" } } }} />
              </RadioGroup>
            </Box>
            
            <FormControl fullWidth>
              <InputLabel sx={{ fontFamily: "'Outfit', sans-serif" }}>Timeline</InputLabel>
              <Select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                label="Timeline"
                sx={{ fontFamily: "'Outfit', sans-serif", borderRadius: '8px' }}
              >
                <MenuItem value={1} sx={{ fontFamily: "'Outfit', sans-serif" }}>1 Month - Intensive</MenuItem>
                <MenuItem value={3} sx={{ fontFamily: "'Outfit', sans-serif" }}>3 Months - Balanced</MenuItem>
                <MenuItem value={6} sx={{ fontFamily: "'Outfit', sans-serif" }}>6 Months - Relaxed</MenuItem>
                <MenuItem value={12} sx={{ fontFamily: "'Outfit', sans-serif" }}>1 Year - Comprehensive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setCustomDialogOpen(false)}
            sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, textTransform: 'none', color: '#64748b' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleGenerateCustom}
            disabled={generating || !skill}
            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <MagicIcon />}
            sx={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              px: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd6 0%, #683fa3 100%)',
              }
            }}
          >
            {generating ? 'Generating...' : 'Generate Roadmap'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default LearningPaths;
