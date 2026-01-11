// ============================================================================
// OKRDashboard PAGE
// DawinOS v2.0 - CEO Strategy Command Module
// OKR management and tracking dashboard
// ============================================================================

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';

export const OKRDashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        OKRs
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage Objectives and Key Results across your organization.
      </Typography>
      
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <ConstructionIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
            The OKR management interface is under development.
            Check back soon for full OKR creation, tracking, and alignment capabilities.
          </Typography>
        </CardContent>
      </Card>
      
      <Alert severity="info" sx={{ mt: 3 }}>
        This page will include objective creation, key result tracking, OKR cycles, and alignment visualization.
      </Alert>
    </Box>
  );
};

export default OKRDashboard;
