/**
 * Goods Receipt Dialog
 * Per-line quantity entry for receiving goods against a PO
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
import type { PurchaseOrder, GoodsReceiptLine } from '../../types/purchaseOrder';
import type { Warehouse } from '@/modules/inventory/types/warehouse';

interface Props {
  open: boolean;
  onClose: () => void;
  order: PurchaseOrder;
  warehouses: Warehouse[];
  onReceive: (receipt: {
    receivedAt: Date;
    receivedBy: string;
    lines: GoodsReceiptLine[];
    notes?: string;
    deliveryReference?: string;
  }) => Promise<void>;
  userId: string;
}

export function GoodsReceiptDialog({ open, onClose, order, warehouses, onReceive, userId }: Props) {
  const [quantities, setQuantities] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    order.lineItems.forEach((li) => {
      const remaining = li.quantity - li.quantityReceived;
      init[li.id] = remaining > 0 ? String(remaining) : '0';
    });
    return init;
  });
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? '');
  const [deliveryRef, setDeliveryRef] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const lines: GoodsReceiptLine[] = [];
    for (const li of order.lineItems) {
      const qty = parseFloat(quantities[li.id] || '0');
      if (qty <= 0) continue;

      const remaining = li.quantity - li.quantityReceived;
      if (qty > remaining) {
        setError(`Cannot receive ${qty} for "${li.description}" — only ${remaining} remaining`);
        return;
      }

      lines.push({
        lineItemId: li.id,
        quantityReceived: qty,
        inventoryItemId: li.inventoryItemId,
        warehouseId,
      });
    }

    if (lines.length === 0) {
      setError('Enter at least one quantity to receive');
      return;
    }

    if (!warehouseId) {
      setError('Please select a warehouse');
      return;
    }

    setSaving(true);
    try {
      await onReceive({
        receivedAt: new Date(),
        receivedBy: userId,
        lines,
        notes: notes || undefined,
        deliveryReference: deliveryRef || undefined,
      });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Receive Goods — {order.poNumber}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Receive to Warehouse</InputLabel>
          <Select
            value={warehouseId}
            label="Receive to Warehouse"
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            {warehouses.map((w) => (
              <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TableContainer sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">Ordered</TableCell>
                <TableCell align="right">Previously Received</TableCell>
                <TableCell align="right">Remaining</TableCell>
                <TableCell align="right" sx={{ width: 120 }}>Receive Now</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.lineItems.map((li) => {
                const remaining = li.quantity - li.quantityReceived;
                return (
                  <TableRow key={li.id}>
                    <TableCell>{li.description}</TableCell>
                    <TableCell>{li.sku ?? '—'}</TableCell>
                    <TableCell align="right">{li.quantity}</TableCell>
                    <TableCell align="right">{li.quantityReceived}</TableCell>
                    <TableCell align="right">{remaining}</TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={quantities[li.id] || ''}
                        onChange={(e) =>
                          setQuantities((prev) => ({ ...prev, [li.id]: e.target.value }))
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

        <TextField
          label="Delivery Reference (e.g. waybill number)"
          fullWidth
          size="small"
          value={deliveryRef}
          onChange={(e) => setDeliveryRef(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          label="Notes"
          fullWidth
          multiline
          rows={2}
          size="small"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          Confirm Receipt
        </Button>
      </DialogActions>
    </Dialog>
  );
}
