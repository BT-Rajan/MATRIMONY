import { Component } from 'react';
import { Box, Typography, Button } from '@mui/material';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In production this should be sent to a logging endpoint (Pass 9).
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: 3, textAlign: 'center' }}>
          <Typography variant="h6">ஏதோ தவறாகிவிட்டது</Typography>
          <Typography color="text.secondary">பக்கத்தை மீண்டும் ஏற்றவும்.</Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            மீண்டும் ஏற்று
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
