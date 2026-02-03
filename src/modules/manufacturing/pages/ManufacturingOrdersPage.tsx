/**
 * Manufacturing Orders List Page
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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useManufacturingOrders } from '../hooks/useManufacturingOrders';
import { MO_STAGE_LABELS, MO_STATUS_LABELS } from '../types';
import type { ManufacturingOrderStatus, MOStage } from '../types';

const SUBSIDIARY_ID = 'finishes';

const STATUS_COLORS: Record<ManufacturingOrderStatus, 'default' | 'warning' | 'success' | 'error' | 'info' | 'primary'> = {
  draft: 'default',
  'pending-approval': 'warning',
  approved: 'info',
  'in-progress': 'primary',
  'on-hold': 'error',
  completed: 'success',
  cancelled: 'default',
};

export default function ManufacturingOrdersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') ?? '');
  const [stageFilter, setStageFilter] = useState<string>(searchParams.get('stage') ?? '');

  const filters = {
    search: search || undefined,
    status: statusFilter ? (statusFilter as ManufacturingOrderStatus) : undefined,
    currentStage: stageFilter ? (stageFilter as MOStage) : undefined,
  };

  const { orders, loading } = useManufacturingOrders(SUBSIDIARY_ID, filters);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>Manufacturing Orders</Typography>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search MO number or item name..."
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
            {Object.entries(MO_STATUS_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Stage</InputLabel>
          <Select
            value={stageFilter}
            label="Stage"
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {Object.entries(MO_STAGE_LABELS).map(([value, label]) => (
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
                <TableCell>MO Number</TableCell>
                <TableCell>Design Item</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((mo) => (
                <TableRow
                  key={mo.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/manufacturing/orders/${mo.id}`)}
                >
                  <TableCell>{mo.moNumber}</TableCell>
                  <TableCell>{mo.designItemName}</TableCell>
                  <TableCell>{mo.projectCode}</TableCell>
                  <TableCell>
                    <Chip
                      label={MO_STATUS_LABELS[mo.status]}
                      size="small"
                      color={STATUS_COLORS[mo.status]}
                    />
                  </TableCell>
                  <TableCell>{MO_STAGE_LABELS[mo.currentStage]}</TableCell>
                  <TableCell>
                    <Chip
                      label={mo.priority}
                      size="small"
                      variant="outlined"
                      color={mo.priority === 'urgent' ? 'error' : mo.priority === 'high' ? 'warning' : 'default'}
                    />
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
                    <Typography color="text.secondary">No manufacturing orders found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
