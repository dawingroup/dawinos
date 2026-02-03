/**
 * Material Consumption Dialog
 * Record material consumption against BOM entries during manufacturing
 */

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type { ManufacturingOrder } from '../../types';
import { MO_STAGE_LABELS } from '../../types';
import type { Warehouse } from '@/modules/inventory/types/warehouse';

interface Props {
  open: boolean;
  onClose: () => void;
  order: ManufacturingOrder;
  warehouses: Warehouse[];
  onConsume: (items: Array<{ inventoryItemId: string; warehouseId: string; quantity: number }>) => Promise<void>;
}

export function MaterialConsumptionDialog({ open, onClose, order, warehouses, onConsume }: Props) {
  const [quantities, setQuantities] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    order.bom.forEach((entry) => {
      init[entry.id] = '';
    });
    return init;
  });
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getConsumedForEntry = (bomEntryId: string): number => {
    const entry = order.bom.find((e) => e.id === bomEntryId);
    if (!entry) return 0;
    return order.materialConsumptions
      .filter((c) => c.inventoryItemId === entry.inventoryItemId)
      .reduce((sum, c) => sum + c.quantityConsumed, 0);
  };

  const handleSubmit = async () => {
    setError(null);

    const items: Array<{ inventoryItemId: string; warehouseId: string; quantity: number }> = [];
    for (const entry of order.bom) {
      const qty = parseFloat(quantities[entry.id] || '0');
      if (qty <= 0) continue;

      const consumed = getConsumedForEntry(entry.id);
      const remaining = entry.quantityRequired - consumed;
      if (qty > remaining) {
        setError(`Cannot consume ${qty} of "${entry.itemName}" — only ${remaining} remaining`);
        return;
      }

      items.push({
        inventoryItemId: entry.inventoryItemId,
        warehouseId: entry.warehouseId || warehouseId,
        quantity: qty,
      });
    }

    if (items.length === 0) {
      setError('Enter at least one quantity to consume');
      return;
    }

    if (!warehouseId) {
      setError('Please select a warehouse');
      return;
    }

    setSaving(true);
    try {
      await onConsume(items);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Record Material Consumption — {order.moNumber}
        <Typography variant="body2" color="text.secondary">
          Current Stage: {MO_STAGE_LABELS[order.currentStage]}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Consume from Warehouse</InputLabel>
          <Select
            value={warehouseId}
            label="Consume from Warehouse"
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            {warehouses.map((w) => (
              <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Material</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Required</TableCell>
                <TableCell align="right">Consumed</TableCell>
                <TableCell align="right">Remaining</TableCell>
                <TableCell align="right" sx={{ width: 120 }}>Consume Now</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.bom.map((entry) => {
                const consumed = getConsumedForEntry(entry.id);
                const remaining = entry.quantityRequired - consumed;
                return (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.itemName}</TableCell>
                    <TableCell>{entry.category}</TableCell>
                    <TableCell align="right">{entry.quantityRequired}</TableCell>
                    <TableCell align="right">{consumed}</TableCell>
                    <TableCell align="right">{remaining}</TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={quantities[entry.id] || ''}
                        onChange={(e) =>
                          setQuantities((prev) => ({ ...prev, [entry.id]: e.target.value }))
                        }
                        inputProps={{ min: 0, max: remaining, step: 1 }}
                        sx={{ width: 100 }}
                        disabled={remaining <= 0}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          Record Consumption
        </Button>
      </DialogActions>
    </Dialog>
  );
}
