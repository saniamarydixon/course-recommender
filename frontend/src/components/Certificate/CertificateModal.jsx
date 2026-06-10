import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  CircularProgress,
  Typography,
  Stack,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import ShareIcon from '@mui/icons-material/Share';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function CertificateModal({ open, onClose, courseId, courseTitle }) {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const iframeRef = useRef(null);

  useEffect(() => {
    if (open && courseId) {
      loadCertificate();
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl('');
      }
    };
  }, [open, courseId]);

  const loadCertificate = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/courses/${courseId}/certificate`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error("Failed to load certificate:", err);
      toast.error("Failed to load certificate preview. Make sure you have completed 100% of the course!");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    const safeTitle = courseTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `Certificate_${safeTitle}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Certificate download started!");
  };

  const handlePrint = () => {
    if (!iframeRef.current) return;
    try {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } catch (err) {
      console.error("Failed to print directly:", err);
      // Fallback: open in new tab and trigger print
      const w = window.open(pdfUrl, '_blank');
      if (w) {
        w.print();
      } else {
        toast.error("Popup blocker prevented print window. Please allow popups.");
      }
    }
  };

  const handleShare = () => {
    // Sharing course details link
    const courseUrl = `${window.location.origin}/courses/${courseId}`;
    navigator.clipboard.writeText(courseUrl);
    toast.success("Course details link copied to clipboard! Share it with your network.");
  };

  const handleLinkedInShare = () => {
    const courseUrl = `${window.location.origin}/courses/${courseId}`;
    const text = `I just earned a completion certificate for "${courseTitle}" on CourseRec AI platform! Check out the course here:`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(courseUrl)}`;
    
    window.open(linkedinUrl, '_blank', 'width=600,height=600');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#ffffff',
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <WorkspacePremiumIcon sx={{ color: '#ffd700', fontSize: '2rem' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif", fontSize: '1.15rem' }}>
              Your Certificate of Completion
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontFamily: "'Outfit', sans-serif" }}>
              {courseTitle}
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} sx={{ color: '#ffffff' }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Dialog Body */}
      <DialogContent sx={{ p: 0, height: '60vh', backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        {loading && (
          <Stack spacing={2} alignItems="center" sx={{ zIndex: 10 }}>
            <CircularProgress color="primary" />
            <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
              Generating certificate PDF...
            </Typography>
          </Stack>
        )}
        
        {pdfUrl && (
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            title="Certificate PDF Preview"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        )}
      </DialogContent>

      {/* Dialog Footer Actions */}
      <DialogActions sx={{ p: 2.5, justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Share to LinkedIn">
            <Button
              variant="outlined"
              color="primary"
              onClick={handleLinkedInShare}
              startIcon={<LinkedInIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '8px',
                borderColor: '#0a66c2',
                color: '#0a66c2',
                '&:hover': {
                  borderColor: '#004182',
                  backgroundColor: 'rgba(10, 102, 194, 0.04)',
                },
              }}
            >
              Share on LinkedIn
            </Button>
          </Tooltip>

          <Tooltip title="Copy Shareable Link">
            <IconButton onClick={handleShare} sx={{ border: '1px solid #cbd5e1', borderRadius: '8px', color: '#64748b' }}>
              <ShareIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={handlePrint}
            startIcon={<PrintIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '8px',
              color: '#475569',
              borderColor: '#cbd5e1',
              '&:hover': {
                borderColor: '#94a3b8',
                backgroundColor: '#f8fafc',
              },
            }}
          >
            Print
          </Button>

          <Button
            variant="contained"
            onClick={handleDownload}
            startIcon={<DownloadIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 6px -1px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd6 0%, #693db6 100%)',
              },
            }}
          >
            Download PDF
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
