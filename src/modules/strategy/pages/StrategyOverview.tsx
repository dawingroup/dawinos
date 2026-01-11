// ============================================================================
// StrategyOverview PAGE
// DawinOS v2.0 - CEO Strategy Command Module
// Strategic plans overview and management
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

export const StrategyOverview: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Strategic Plans
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        View and manage your organization&apos;s strategic plans, pillars, and objectives.
      </Typography>
      
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <ConstructionIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
            The strategic plans management interface is under development.
            Check back soon for full strategy document management capabilities.
          </Typography>
        </CardContent>
      </Card>
      
      <Alert severity="info" sx={{ mt: 3 }}>
        This page will include strategic plan creation, pillar management, objective tracking, and initiative monitoring.
      </Alert>
    </Box>
  );
};

export default StrategyOverview;
