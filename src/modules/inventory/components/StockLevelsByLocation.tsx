/**
 * StockLevelsByLocation Component
 * Multi-location stock view for inventory items, grouped by warehouse
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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { useSubsidiary } from '@/contexts/SubsidiaryContext';
import { useWarehouses } from '../hooks/useWarehouses';
import { useWarehouseStock } from '../hooks/useStockLevels';
import type { StockLevel } from '../types/warehouse';

interface StockLevelsByLocationProps {
  onItemClick?: (stockLevel: StockLevel) => void;
}

export default function StockLevelsByLocation({ onItemClick }: StockLevelsByLocationProps) {
  const { currentSubsidiary } = useSubsidiary();
  const { warehouses, loading: whLoading } = useWarehouses(currentSubsidiary?.id || null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');

  const { stockLevels, loading: stockLoading } = useWarehouseStock(selectedWarehouse || null);

  if (whLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (warehouses.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No warehouses configured. Create warehouses in the Warehouse Manager tab to track stock by location.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Warehouse selector */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <WarehouseIcon color="action" />
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel>Select Warehouse</InputLabel>
          <Select
            value={selectedWarehouse}
            label="Select Warehouse"
            onChange={(e) => setSelectedWarehouse(e.target.value)}
          >
            {warehouses.map((wh) => (
              <MenuItem key={wh.id} value={wh.id}>
                {wh.name} ({wh.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!selectedWarehouse ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Select a warehouse to view stock levels
        </Typography>
      ) : stockLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>SKU</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell align="right">On Hand</TableCell>
                <TableCell align="right">Reserved</TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stockLevels.map((sl) => {
                const isLow = sl.reorderLevel && sl.quantityAvailable <= sl.reorderLevel;
                return (
                  <TableRow
                    key={sl.id}
                    hover
                    sx={{ cursor: onItemClick ? 'pointer' : 'default' }}
                    onClick={() => onItemClick?.(sl)}
                  >
                    <TableCell>{sl.sku}</TableCell>
                    <TableCell>{sl.itemName}</TableCell>
                    <TableCell align="right">{sl.quantityOnHand}</TableCell>
                    <TableCell align="right">{sl.quantityReserved}</TableCell>
                    <TableCell align="right">{sl.quantityAvailable}</TableCell>
                    <TableCell>
                      {isLow ? (
                        <Chip label="Low Stock" size="small" color="warning" />
                      ) : sl.quantityOnHand === 0 ? (
                        <Chip label="Out of Stock" size="small" color="error" />
                      ) : (
                        <Chip label="In Stock" size="small" color="success" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {stockLevels.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No stock at this location</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Summary cards */}
      {selectedWarehouse && stockLevels.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Paper variant="outlined" sx={{ p: 2, flex: 1, textAlign: 'center' }}>
            <Typography variant="h5" color="primary">
              {stockLevels.reduce((sum, sl) => sum + sl.quantityOnHand, 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">Total On Hand</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, flex: 1, textAlign: 'center' }}>
            <Typography variant="h5" color="warning.main">
              {stockLevels.reduce((sum, sl) => sum + sl.quantityReserved, 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">Total Reserved</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, flex: 1, textAlign: 'center' }}>
            <Typography variant="h5" color="success.main">
              {stockLevels.reduce((sum, sl) => sum + sl.quantityAvailable, 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">Total Available</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, flex: 1, textAlign: 'center' }}>
            <Typography variant="h5" color="error.main">
              {stockLevels.filter((sl) => sl.reorderLevel && sl.quantityAvailable <= sl.reorderLevel).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">Low Stock Items</Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
