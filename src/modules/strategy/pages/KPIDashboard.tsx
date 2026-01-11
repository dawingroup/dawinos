// ============================================================================
// KPIDashboard PAGE
// DawinOS v2.0 - CEO Strategy Command Module
// KPI management and scorecard dashboard
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

export const KPIDashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        KPIs & Scorecards
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Monitor Key Performance Indicators and manage scorecards.
      </Typography>
      
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <ConstructionIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
            The KPI management interface is under development.
            Check back soon for full KPI definition, tracking, and scorecard capabilities.
          </Typography>
        </CardContent>
      </Card>
      
      <Alert severity="info" sx={{ mt: 3 }}>
        This page will include KPI definition, target setting, trend analysis, and balanced scorecard management.
      </Alert>
    </Box>
  );
};

export default KPIDashboard;
