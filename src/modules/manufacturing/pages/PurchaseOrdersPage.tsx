/**
 * Purchase Orders List Page
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePurchaseOrders } from '../hooks/usePurchaseOrders';
import { PO_STATUS_LABELS } from '../types/purchaseOrder';
import type { PurchaseOrderStatus } from '../types/purchaseOrder';
import { CreatePurchaseOrderDialog } from '../components/po/CreatePurchaseOrderDialog';
import { useAuth } from '@/shared/hooks/useAuth';

const SUBSIDIARY_ID = 'finishes';

const STATUS_COLORS: Record<PurchaseOrderStatus, 'default' | 'warning' | 'success' | 'error' | 'info' | 'primary'> = {
  draft: 'default',
  'pending-approval': 'warning',
  approved: 'info',
  rejected: 'error',
  sent: 'primary',
  'partially-received': 'warning',
  received: 'success',
  closed: 'default',
  cancelled: 'default',
};

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') ?? '');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filters = {
    search: search || undefined,
    status: statusFilter ? (statusFilter as PurchaseOrderStatus) : undefined,
  };

  const { orders, loading } = usePurchaseOrders(SUBSIDIARY_ID, filters);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Purchase Orders</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
        >
          Create PO
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search PO number or supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {Object.entries(PO_STATUS_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PO Number</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Subtotal</TableCell>
                <TableCell align="right">Landed Cost</TableCell>
                <TableCell align="right">Grand Total</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((po) => (
                <TableRow
                  key={po.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/manufacturing/purchase-orders/${po.id}`)}
                >
                  <TableCell>{po.poNumber}</TableCell>
                  <TableCell>{po.supplierName}</TableCell>
                  <TableCell>
                    <Chip
                      label={PO_STATUS_LABELS[po.status]}
                      size="small"
                      color={STATUS_COLORS[po.status]}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {po.totals.subtotal.toLocaleString()} {po.totals.currency}
                  </TableCell>
                  <TableCell align="right">
                    {po.totals.landedCostTotal.toLocaleString()} {po.totals.currency}
                  </TableCell>
                  <TableCell align="right">
                    {po.totals.grandTotal.toLocaleString()} {po.totals.currency}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small">
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No purchase orders found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CreatePurchaseOrderDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={(poId) => navigate(`/manufacturing/purchase-orders/${poId}`)}
        subsidiaryId={SUBSIDIARY_ID}
        userId={user?.uid ?? ''}
      />
    </Box>
  );
}
