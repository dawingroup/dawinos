/**
 * Create Purchase Order Dialog
 * Standalone PO creation with supplier picker, line item builder, and landed costs
 */

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { SupplierPicker } from './SupplierPicker';
import { createPurchaseOrder } from '../../services/purchaseOrderService';
import type { POLineItem, LandedCosts, LandedCostDistributionMethod } from '../../types/purchaseOrder';

interface LineItemDraft {
  key: string;
  description: string;
  sku: string;
  quantity: string;
  unitCost: string;
  unit: string;
  weight: string;
}

const emptyLineItem = (): LineItemDraft => ({
  key: crypto.randomUUID(),
  description: '',
  sku: '',
  quantity: '',
  unitCost: '',
  unit: 'pcs',
  weight: '',
});

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (poId: string) => void;
  subsidiaryId: string;
  userId: string;
}

export function CreatePurchaseOrderDialog({ open, onClose, onCreated, subsidiaryId, userId }: Props) {
  const [supplierValue, setSupplierValue] = useState<{ id: string; name: string; contactPerson?: string } | null>(null);
  const [supplierContact, setSupplierContact] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([emptyLineItem()]);
  const [currency, setCurrency] = useState('USD');
  const [landedCosts, setLandedCosts] = useState({
    shipping: '',
    customs: '',
    duties: '',
    insurance: '',
    handling: '',
    other: '',
  });
  const [distributionMethod, setDistributionMethod] = useState<LandedCostDistributionMethod>('proportional_value');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setSupplierValue(null);
    setSupplierContact('');
    setNotes('');
    setLineItems([emptyLineItem()]);
    setCurrency('USD');
    setLandedCosts({ shipping: '', customs: '', duties: '', insurance: '', handling: '', other: '' });
    setDistributionMethod('proportional_value');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const updateLineItem = (key: string, field: keyof LineItemDraft, value: string) => {
    setLineItems((prev) =>
      prev.map((li) => (li.key === key ? { ...li, [field]: value } : li)),
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, emptyLineItem()]);
  };

  const removeLineItem = (key: string) => {
    setLineItems((prev) => prev.filter((li) => li.key !== key));
  };

  const calcLineTotal = (li: LineItemDraft): number => {
    const qty = parseFloat(li.quantity) || 0;
    const cost = parseFloat(li.unitCost) || 0;
    return qty * cost;
  };

  const subtotal = lineItems.reduce((sum, li) => sum + calcLineTotal(li), 0);
  const totalLanded = Object.values(landedCosts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

  const handleSubmit = async () => {
    setError(null);

    if (!supplierValue) {
      setError('Please select a supplier');
      return;
    }

    const validLines = lineItems.filter((li) => li.description && parseFloat(li.quantity) > 0 && parseFloat(li.unitCost) > 0);
    if (validLines.length === 0) {
      setError('At least one line item with description, quantity, and unit cost is required');
      return;
    }

    setSaving(true);
    try {
      const poLineItems: POLineItem[] = validLines.map((li, idx) => ({
        id: `LI-${Date.now()}-${idx}`,
        description: li.description,
        sku: li.sku || undefined,
        quantity: parseFloat(li.quantity),
        unitCost: parseFloat(li.unitCost),
        totalCost: calcLineTotal(li),
        currency,
        unit: li.unit,
        quantityReceived: 0,
        weight: li.weight ? parseFloat(li.weight) : undefined,
      }));

      const landedCostsData: LandedCosts = {
        shipping: parseFloat(landedCosts.shipping) || 0,
        customs: parseFloat(landedCosts.customs) || 0,
        duties: parseFloat(landedCosts.duties) || 0,
        insurance: parseFloat(landedCosts.insurance) || 0,
        handling: parseFloat(landedCosts.handling) || 0,
        other: parseFloat(landedCosts.other) || 0,
        totalLandedCost: totalLanded,
        currency,
        distributionMethod,
      };

      const poId = await createPurchaseOrder(
        {
          supplierName: supplierValue.name,
          supplierContact: supplierContact || supplierValue.contactPerson || undefined,
          supplierId: supplierValue.id,
          lineItems: poLineItems,
          landedCosts: landedCostsData,
          subsidiaryId,
          notes: notes || undefined,
        },
        userId,
      );

      handleClose();
      onCreated(poId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Create Purchase Order</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Supplier Section */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Supplier</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <SupplierPicker
              value={supplierValue}
              onChange={(val) => {
                setSupplierValue(val);
                if (val?.contactPerson) setSupplierContact(val.contactPerson);
              }}
              label="Select Supplier"
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Contact Person"
              fullWidth
              size="small"
              value={supplierContact}
              onChange={(e) => setSupplierContact(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Currency</InputLabel>
              <Select value={currency} label="Currency" onChange={(e) => setCurrency(e.target.value)}>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="UGX">UGX</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="GBP">GBP</MenuItem>
                <MenuItem value="KES">KES</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Line Items */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2">Line Items</Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={addLineItem}>
            Add Item
          </Button>
        </Box>
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 200 }}>Description *</TableCell>
                <TableCell sx={{ width: 100 }}>SKU</TableCell>
                <TableCell sx={{ width: 80 }}>Qty *</TableCell>
                <TableCell sx={{ width: 70 }}>Unit</TableCell>
                <TableCell sx={{ width: 100 }}>Unit Cost *</TableCell>
                <TableCell sx={{ width: 80 }}>Weight (kg)</TableCell>
                <TableCell sx={{ width: 100 }} align="right">Total</TableCell>
                <TableCell sx={{ width: 50 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {lineItems.map((li) => (
                <TableRow key={li.key}>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      value={li.description}
                      onChange={(e) => updateLineItem(li.key, 'description', e.target.value)}
                      placeholder="Item description"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      value={li.sku}
                      onChange={(e) => updateLineItem(li.key, 'sku', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      fullWidth
                      value={li.quantity}
                      onChange={(e) => updateLineItem(li.key, 'quantity', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      value={li.unit}
                      onChange={(e) => updateLineItem(li.key, 'unit', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      fullWidth
                      value={li.unitCost}
                      onChange={(e) => updateLineItem(li.key, 'unitCost', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      fullWidth
                      value={li.weight}
                      onChange={(e) => updateLineItem(li.key, 'weight', e.target.value)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {calcLineTotal(li).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {lineItems.length > 1 && (
                      <IconButton size="small" onClick={() => removeLineItem(li.key)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ mb: 2 }} />

        {/* Landed Costs */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Landed Costs (optional)</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {(['shipping', 'customs', 'duties', 'insurance', 'handling', 'other'] as const).map((field) => (
            <Grid size={{ xs: 6, md: 2 }} key={field}>
              <TextField
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                size="small"
                type="number"
                fullWidth
                value={landedCosts[field]}
                onChange={(e) => setLandedCosts((prev) => ({ ...prev, [field]: e.target.value }))}
              />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Cost Distribution</InputLabel>
              <Select
                value={distributionMethod}
                label="Cost Distribution"
                onChange={(e) => setDistributionMethod(e.target.value as LandedCostDistributionMethod)}
              >
                <MenuItem value="proportional_value">Proportional by Value</MenuItem>
                <MenuItem value="proportional_weight">Proportional by Weight</MenuItem>
                <MenuItem value="equal">Equal Split</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        {/* Notes */}
        <TextField
          label="Notes"
          fullWidth
          multiline
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
          <Typography>Subtotal: <strong>{subtotal.toLocaleString()} {currency}</strong></Typography>
          <Typography>Landed: <strong>{totalLanded.toLocaleString()} {currency}</strong></Typography>
          <Typography>Grand Total: <strong>{(subtotal + totalLanded).toLocaleString()} {currency}</strong></Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          Create Purchase Order
        </Button>
      </DialogActions>
    </Dialog>
  );
}
