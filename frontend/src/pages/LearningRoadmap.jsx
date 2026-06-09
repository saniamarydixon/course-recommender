import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Modal,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  IconButton,
  Chip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Checkbox,
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { toast } from 'react-toastify';
import api from '../services/api';

const SKILLS = [
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

const MODAL_STYLE = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 500 },
  bgcolor: 'background.paper',
  borderRadius: '16px',
  boxShadow: 24,
  p: 4,
};

export default function LearningRoadmap() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Form State
  const [skill, setSkill] = useState('');
  const [targetLevel, setTargetLevel] = useState('Beginner');
  const [timeline, setTimeline] = useState('8 Weeks');
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  const fetchRoadmaps = async () => {
    try {
      const response = await api.get('/roadmap/my-roadmaps');
      setRoadmaps(response.data);
    } catch (err) {
      console.error("Error fetching roadmaps:", err);
      toast.error("Failed to load learning paths");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const handleOpenModal = () => {
    setSkill('');
    setTargetLevel('Beginner');
    setTimeline('8 Weeks');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!skill) {
      toast.error("Please select a skill category");
      return;
    }

    setGenerating(true);
    try {
      await api.post('/roadmap/generate', {
        skill,
        target_level: targetLevel,
        timeline,
      });
      toast.success("Learning path generated successfully!");
      setModalOpen(false);
      fetchRoadmaps();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to generate roadmap");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (roadmapId) => {
    if (!window.confirm("Are you sure you want to delete this learning path?")) {
      return;
    }

    try {
      await api.delete(`/roadmap/${roadmapId}`);
      toast.success("Learning path deleted");
      fetchRoadmaps();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete learning path");
    }
  };

  const handleToggleStep = async (stepId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
    try {
      await api.put(`/roadmap/step/${stepId}`, { status: newStatus });
      toast.success(newStatus === 'completed' ? "Step completed!" : "Step marked in progress");
      fetchRoadmaps();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update step progress");
    }
  };

  const getStepIcon = (status) => {
    if (status === 'completed') {
      return <CheckCircleIcon sx={{ color: '#22c55e' }} />;
    }
    if (status === 'in_progress') {
      return <PlayCircleOutlineIcon sx={{ color: '#667eea' }} />;
    }
    return <LockIcon sx={{ color: '#94a3b8' }} />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, py: 8 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, py: 2 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#1e293b',
              fontFamily: "'Outfit', sans-serif",
              mb: 1,
            }}
          >
            🗺️ Your Learning Roadmaps
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#64748b',
              fontWeight: 500,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Personalized learning paths
          </Typography>
        </Box>

        {roadmaps.length > 0 && (
          <Button
            variant="contained"
            onClick={handleOpenModal}
            startIcon={<AddIcon />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)',
            }}
          >
            Create New Roadmap
          </Button>
        )}
      </Box>

      {/* Main Content / Empty State */}
      {roadmaps.length === 0 ? (
        <Card
          sx={{
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            py: 8,
            px: 4,
            textAlign: 'center',
          }}
        >
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5 }}>
            <TimelineIcon sx={{ fontSize: 80, color: '#94a3b8' }} />
            
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: '#334155',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              No Learning Paths Yet
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: '#64748b',
                maxWidth: '450px',
                fontFamily: "'Outfit', sans-serif",
                lineHeight: 1.6,
                mb: 1.5,
              }}
            >
              Generate your first structured learning curriculum. Choose a skill and target level, and we will build a guided course roadmap for you.
            </Typography>

            <Button
              variant="contained"
              onClick={handleOpenModal}
              startIcon={<AddIcon />}
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                fontFamily: "'Outfit', sans-serif",
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.35)',
              }}
            >
              Create Your First Roadmap
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={4}>
          {roadmaps.map((roadmap) => (
            <Card
              key={roadmap.id}
              sx={{
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
              }}
            >
              {/* Roadmap Header Panel */}
              <Box
                sx={{
                  p: 3,
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 900,
                        color: '#1e293b',
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      {roadmap.skill_name}
                    </Typography>
                    <Chip
                      label={roadmap.target_level}
                      size="small"
                      sx={{
                        backgroundColor: '#667eea',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    />
                    {roadmap.timeline && (
                      <Chip
                        label={roadmap.timeline}
                        size="small"
                        sx={{
                          backgroundColor: '#764ba2',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontFamily: "'Outfit', sans-serif",
                        }}
                      />
                    )}
                  </Stack>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                    Generated on {new Date(roadmap.created_at).toLocaleDateString()}
                  </Typography>
                </Box>

                <IconButton
                  color="error"
                  onClick={() => handleDelete(roadmap.id)}
                  sx={{
                    border: '1px solid #fee2e2',
                    backgroundColor: '#fef2f2',
                    borderRadius: '8px',
                    '&:hover': { backgroundColor: '#fee2e2' },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              {/* Roadmap Steps Content */}
              <CardContent sx={{ p: 4 }}>
                <Stepper orientation="vertical" connector={<Box sx={{ ml: '12px', borderLeft: '2px solid #e2e8f0', width: 2, height: '100%', minHeight: 30 }} />}>
                  {roadmap.steps.map((step) => {
                    const c = step.course;
                    if (!c) return null;

                    const isLocked = step.status === 'locked';
                    const isCompleted = step.status === 'completed';
                    const isInProgress = step.status === 'in_progress';

                    return (
                      <Step key={step.id} active={isInProgress} completed={isCompleted}>
                        <StepLabel
                          icon={getStepIcon(step.status)}
                          sx={{
                            '& .MuiStepLabel-label': {
                              fontFamily: "'Outfit', sans-serif",
                              fontWeight: isInProgress ? 700 : 500,
                              color: isLocked ? '#94a3b8' : '#1e293b',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 1 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: isInProgress || isCompleted ? 800 : 600,
                                color: isLocked ? '#94a3b8' : '#1e293b',
                                cursor: isLocked ? 'default' : 'pointer',
                                textDecoration: isCompleted ? 'line-through' : 'none',
                                '&:hover': { color: isLocked ? '#94a3b8' : '#667eea' },
                              }}
                              onClick={() => !isLocked && navigate(`/courses/${c.id}`)}
                            >
                              Step {step.step_number}: {c.title}
                            </Typography>
                            
                            {/* Actions / Checkboxes */}
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              {!isLocked && (
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={isCompleted}
                                      onChange={() => handleToggleStep(step.id, step.status)}
                                      size="small"
                                      sx={{
                                        color: '#cbd5e1',
                                        '&.Mui-checked': { color: '#22c55e' },
                                      }}
                                    />
                                  }
                                  label={
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', fontFamily: "'Outfit', sans-serif" }}>
                                      Done
                                    </Typography>
                                  }
                                />
                              )}
                              {isLocked && (
                                <Chip
                                  label="Locked"
                                  size="small"
                                  sx={{
                                    height: '20px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    fontFamily: "'Outfit', sans-serif",
                                    backgroundColor: '#f1f5f9',
                                    color: '#94a3b8',
                                  }}
                                />
                              )}
                            </Stack>
                          </Box>
                        </StepLabel>

                        <StepContent>
                          <Box sx={{ pl: 1, pb: 2 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#64748b',
                                fontFamily: "'Outfit', sans-serif",
                                mb: 1.5,
                              }}
                            >
                              Instructor: {c.instructor} | Duration: {step.estimated_hours} Hours
                            </Typography>
                            {step.prerequisites && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#e11d48',
                                  fontWeight: 600,
                                  fontFamily: "'Outfit', sans-serif",
                                  display: 'block',
                                  mb: 1.5,
                                }}
                              >
                                ⚠️ {step.prerequisites}
                              </Typography>
                            )}
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => navigate(`/courses/${c.id}`)}
                              sx={{
                                borderRadius: '6px',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                fontFamily: "'Outfit', sans-serif",
                              }}
                            >
                              Go to Course
                            </Button>
                          </Box>
                        </StepContent>
                      </Step>
                    );
                  })}
                </Stepper>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Creation Modal */}
      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Card sx={MODAL_STYLE}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: '#1e293b',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Create New Learning Path
            </Typography>
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleGenerate}>
            <Stack spacing={3}>
              {/* Skill Dropdown */}
              <FormControl fullWidth>
                <InputLabel id="skill-label" sx={{ fontFamily: "'Outfit', sans-serif" }}>Skill Category</InputLabel>
                <Select
                  labelId="skill-label"
                  value={skill}
                  label="Skill Category"
                  onChange={(e) => setSkill(e.target.value)}
                  sx={{ borderRadius: '8px' }}
                >
                  {SKILLS.map((s) => (
                    <MenuItem key={s} value={s} sx={{ fontFamily: "'Outfit', sans-serif" }}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Target Level Radio */}
              <FormControl>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: '#475569',
                    fontFamily: "'Outfit', sans-serif",
                    mb: 1,
                  }}
                >
                  Target Level
                </Typography>
                <RadioGroup
                  row
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                >
                  <FormControlLabel
                    value="Beginner"
                    control={<Radio sx={{ '&.Mui-checked': { color: '#667eea' } }} />}
                    label={<Typography variant="body2" sx={{ fontFamily: "'Outfit', sans-serif" }}>Beginner</Typography>}
                  />
                  <FormControlLabel
                    value="Intermediate"
                    control={<Radio sx={{ '&.Mui-checked': { color: '#667eea' } }} />}
                    label={<Typography variant="body2" sx={{ fontFamily: "'Outfit', sans-serif" }}>Intermediate</Typography>}
                  />
                  <FormControlLabel
                    value="Advanced"
                    control={<Radio sx={{ '&.Mui-checked': { color: '#667eea' } }} />}
                    label={<Typography variant="body2" sx={{ fontFamily: "'Outfit', sans-serif" }}>Advanced</Typography>}
                  />
                </RadioGroup>
              </FormControl>

              {/* Timeline field */}
              <TextField
                label="Timeline (e.g. 4 Weeks)"
                fullWidth
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={generating}
                sx={{
                  py: 1.5,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  fontFamily: "'Outfit', sans-serif",
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.35)',
                }}
              >
                {generating ? 'Generating Path...' : 'Generate Roadmap'}
              </Button>
            </Stack>
          </form>
        </Card>
      </Modal>
    </Box>
  );
}
