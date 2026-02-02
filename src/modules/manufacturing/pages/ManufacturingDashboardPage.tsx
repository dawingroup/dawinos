/**
 * Manufacturing Dashboard Page
 * Overview of MOs by stage, PO status, and key metrics
 * Cards link to filtered list pages
 */

import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
} from '@mui/material';
import FactoryIcon from '@mui/icons-material/Factory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useNavigate } from 'react-router-dom';
import { useManufacturingOrders } from '../hooks/useManufacturingOrders';
import { usePurchaseOrders } from '../hooks/usePurchaseOrders';
import { MO_STAGE_LABELS, MO_STATUS_LABELS } from '../types';
import { PO_STATUS_LABELS } from '../types/purchaseOrder';

const SUBSIDIARY_ID = 'finishes';

export default function ManufacturingDashboardPage() {
  const navigate = useNavigate();
  const { stats: moStats } = useManufacturingOrders(SUBSIDIARY_ID);
  const { stats: poStats } = usePurchaseOrders(SUBSIDIARY_ID);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Manufacturing Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FactoryIcon />}
            onClick={() => navigate('/manufacturing/orders')}
          >
            Manufacturing Orders
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShoppingCartIcon />}
            onClick={() => navigate('/manufacturing/purchase-orders')}
          >
            Purchase Orders
          </Button>
        </Box>
      </Box>

      {/* MO Stage Pipeline */}
      <Typography variant="h6" sx={{ mb: 2 }}>Production Pipeline</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {Object.entries(MO_STAGE_LABELS).map(([stage, label]) => {
          const count = moStats.byStage[stage as keyof typeof moStats.byStage] ?? 0;
          return (
            <Grid key={stage} size={{ xs: 6, sm: 4, md: 2 }}>
              <Card variant="outlined">
                <CardActionArea
                  onClick={() => navigate(`/manufacturing/orders?stage=${stage}`)}
                  disabled={count === 0}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color={count > 0 ? 'primary' : 'text.disabled'}>
                      {count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {label}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* MO Status Summary */}
      <Typography variant="h6" sx={{ mb: 2 }}>MO Status</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {(['draft', 'in-progress', 'on-hold', 'completed'] as const).map((status) => {
          const count = moStats.byStatus[status] ?? 0;
          return (
            <Grid key={status} size={{ xs: 6, sm: 3 }}>
              <Card variant="outlined">
                <CardActionArea
                  onClick={() => navigate(`/manufacturing/orders?status=${status}`)}
                  disabled={count === 0}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color={count > 0 ? 'text.primary' : 'text.disabled'}>
                      {count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {MO_STATUS_LABELS[status]}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* PO Status Summary */}
      <Typography variant="h6" sx={{ mb: 2 }}>Purchase Orders</Typography>
      <Grid container spacing={2}>
        {(['draft', 'pending-approval', 'sent', 'partially-received', 'received'] as const).map((status) => {
          const count = poStats.byStatus[status] ?? 0;
          return (
            <Grid key={status} size={{ xs: 6, sm: 4 }}>
              <Card variant="outlined">
                <CardActionArea
                  onClick={() => navigate(`/manufacturing/purchase-orders?status=${status}`)}
                  disabled={count === 0}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color={count > 0 ? 'text.primary' : 'text.disabled'}>
                      {count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {PO_STATUS_LABELS[status]}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
