import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }
  
  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };
  
  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ mb: 2 }}>😕</Typography>
          <Typography variant="h5" sx={{ mb: 2, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
            Oops! Something went wrong
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, fontFamily: "'Outfit', sans-serif" }}>
            Don't worry, just refresh the page to continue
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<RefreshIcon />}
            onClick={this.handleReload}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textTransform: 'none',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
            }}
          >
            Refresh Page
          </Button>
        </Container>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
