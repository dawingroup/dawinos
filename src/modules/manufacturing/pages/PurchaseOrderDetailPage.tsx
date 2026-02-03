/**
 * Purchase Order Detail Page
 * Full PO view with line items, landed costs, approvals, and goods receipt
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LockIcon from '@mui/icons-material/Lock';
import CancelIcon from '@mui/icons-material/Cancel';
import InventoryIcon from '@mui/icons-material/Inventory';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { useParams, Link } from 'react-router-dom';
import { usePurchaseOrder } from '../hooks/usePurchaseOrder';
import { PO_STATUS_LABELS } from '../types/purchaseOrder';
import type { POLineItem } from '../types/purchaseOrder';
import { useAuth } from '@/shared/hooks/useAuth';
import { useWarehouses } from '@/modules/inventory/hooks/useWarehouses';
import { GoodsReceiptDialog } from '../components/po/GoodsReceiptDialog';

export default function PurchaseOrderDetailPage() {
  const { poId } = useParams<{ poId: string }>();
  const { user } = useAuth();
  const { order, loading, error, actions } = usePurchaseOrder(poId ?? null, user?.uid ?? '');
  const { warehouses } = useWarehouses('finishes');
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);

  // Line item editing
  const [editing, setEditing] = useState(false);
  const [editLineItems, setEditLineItems] = useState<POLineItem[]>([]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Purchase order not found</Alert>
      </Box>
    );
  }

  const wrap = async (fn: () => Promise<void>) => {
    setActionLoading(true);
    try { await fn(); } catch { /* hook handles */ }
    setActionLoading(false);
  };

  const approverName = user?.displayName ?? 'Manager';
  const isDraft = order.status === 'draft';
  const isPending = order.status === 'pending-approval';
  const canEdit = isDraft || isPending;
  const canReceive = order.status === 'sent' || order.status === 'partially-received';
  const canCancel = !['closed', 'cancelled'].includes(order.status);

  // Line item editing helpers
  const startEditing = () => {
    setEditLineItems(order.lineItems.map((li) => ({ ...li })));
    setEditing(true);
  };

  const updateEditLine = (id: string, field: keyof POLineItem, value: string | number) => {
    setEditLineItems((prev) =>
      prev.map((li) => {
        if (li.id !== id) return li;
        const updated = { ...li, [field]: value };
        if (field === 'quantity' || field === 'unitCost') {
          updated.totalCost = (updated.quantity || 0) * (updated.unitCost || 0);
        }
        return updated;
      }),
    );
  };

  const addEditLine = () => {
    setEditLineItems((prev) => [
      ...prev,
      {
        id: `LI-${Date.now()}-${prev.length}`,
        description: '',
        quantity: 0,
        unitCost: 0,
        totalCost: 0,
        currency: order.totals.currency,
        unit: 'pcs',
        quantityReceived: 0,
      },
    ]);
  };

  const removeEditLine = (id: string) => {
    setEditLineItems((prev) => prev.filter((li) => li.id !== id));
  };

  const saveLineItems = async () => {
    const valid = editLineItems.filter((li) => li.description && li.quantity > 0);
    if (valid.length === 0) return;
    await wrap(async () => {
      await actions.update({ lineItems: valid });
      setEditing(false);
    });
  };

  const handleReject = async () => {
    if (!rejectNotes.trim()) return;
    await wrap(() => actions.reject(approverName, rejectNotes));
    setShowRejectDialog(false);
    setRejectNotes('');
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    await wrap(() => actions.cancel(cancelReason));
    setShowCancelDialog(false);
    setCancelReason('');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">{order.poNumber}</Typography>
          <Typography color="text.secondary">
            Supplier: {order.supplierName}
            {order.supplierContact && ` — ${order.supplierContact}`}
          </Typography>
        </Box>
        <Chip label={PO_STATUS_LABELS[order.status]} color="primary" />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Linked References */}
      {(order.linkedMOIds?.length || order.linkedProjectId) && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {order.linkedMOIds?.map((moId) => (
            <Chip
              key={moId}
              label={`MO: ${moId.slice(0, 8)}...`}
              size="small"
              variant="outlined"
              component={Link}
              to={`/manufacturing/orders/${moId}`}
              clickable
            />
          ))}
          {order.linkedProjectId && (
            <Chip
              label="View Project"
              size="small"
              variant="outlined"
              component={Link}
              to={`/design/project/${order.linkedProjectId}`}
              clickable
            />
          )}
        </Box>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {isDraft && (
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => wrap(() => actions.submitForApproval())}
            disabled={actionLoading}
          >
            Submit for Approval
          </Button>
        )}
        {isPending && (
          <>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => wrap(() => actions.approve(approverName))}
              disabled={actionLoading}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setShowRejectDialog(true)}
              disabled={actionLoading}
            >
              Reject
            </Button>
          </>
        )}
        {order.status === 'approved' && (
          <Button
            variant="contained"
            startIcon={<LocalShippingIcon />}
            onClick={() => wrap(() => actions.markSent())}
            disabled={actionLoading}
          >
            Mark as Sent
          </Button>
        )}
        {canReceive && (
          <Button
            variant="contained"
            color="success"
            startIcon={<InventoryIcon />}
            onClick={() => setShowReceiptDialog(true)}
            disabled={actionLoading}
          >
            Receive Goods
          </Button>
        )}
        {['received', 'partially-received'].includes(order.status) && (
          <Button
            variant="outlined"
            startIcon={<LockIcon />}
            onClick={() => wrap(() => actions.close())}
            disabled={actionLoading}
          >
            Close PO
          </Button>
        )}
        {canCancel && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => setShowCancelDialog(true)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Line Items */}
        <Grid size={12}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Line Items</Typography>
                {canEdit && !editing && (
                  <Button size="small" startIcon={<EditIcon />} onClick={startEditing}>
                    Edit Items
                  </Button>
                )}
                {editing && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" startIcon={<AddIcon />} onClick={addEditLine}>
                      Add Item
                    </Button>
                    <Button size="small" variant="contained" startIcon={<SaveIcon />} onClick={saveLineItems} disabled={actionLoading}>
                      Save
                    </Button>
                    <Button size="small" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>

              {editing ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 180 }}>Description</TableCell>
                        <TableCell sx={{ width: 100 }}>SKU</TableCell>
                        <TableCell sx={{ width: 80 }} align="right">Qty</TableCell>
                        <TableCell sx={{ width: 100 }} align="right">Unit Cost</TableCell>
                        <TableCell sx={{ width: 100 }} align="right">Total</TableCell>
                        <TableCell sx={{ width: 50 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editLineItems.map((li) => (
                        <TableRow key={li.id}>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={li.description}
                              onChange={(e) => updateEditLine(li.id, 'description', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={li.sku ?? ''}
                              onChange={(e) => updateEditLine(li.id, 'sku', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              fullWidth
                              value={li.quantity}
                              onChange={(e) => updateEditLine(li.id, 'quantity', parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              fullWidth
                              value={li.unitCost}
                              onChange={(e) => updateEditLine(li.id, 'unitCost', parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{li.totalCost.toLocaleString()}</Typography>
                          </TableCell>
                          <TableCell>
                            {li.quantityReceived === 0 && (
                              <IconButton size="small" color="error" onClick={() => removeEditLine(li.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell>SKU</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Unit Cost</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Landed Alloc.</TableCell>
                        <TableCell align="right">Effective Cost</TableCell>
                        <TableCell align="right">Received</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.lineItems.map((li) => (
                        <TableRow key={li.id}>
                          <TableCell>{li.description}</TableCell>
                          <TableCell>{li.sku ?? '—'}</TableCell>
                          <TableCell align="right">{li.quantity}</TableCell>
                          <TableCell align="right">{li.unitCost.toLocaleString()}</TableCell>
                          <TableCell align="right">{li.totalCost.toLocaleString()}</TableCell>
                          <TableCell align="right">{(li.landedCostAllocation ?? 0).toLocaleString()}</TableCell>
                          <TableCell align="right">{(li.effectiveUnitCost ?? li.unitCost).toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {li.quantityReceived}/{li.quantity}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Landed Costs */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Landed Costs</Typography>
              {[
                ['Shipping', order.landedCosts.shipping],
                ['Customs', order.landedCosts.customs],
                ['Duties', order.landedCosts.duties],
                ['Insurance', order.landedCosts.insurance],
                ['Handling', order.landedCosts.handling],
                ['Other', order.landedCosts.other],
              ].map(([label, value]) => (
                <Box key={label as string} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography color="text.secondary">{label as string}</Typography>
                  <Typography>{(value as number).toLocaleString()} {order.landedCosts.currency}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography fontWeight="bold">Total Landed</Typography>
                <Typography fontWeight="bold">
                  {order.landedCosts.totalLandedCost.toLocaleString()} {order.landedCosts.currency}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Distribution: {order.landedCosts.distributionMethod.replace(/_/g, ' ')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Totals */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Totals</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography>{order.totals.subtotal.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography color="text.secondary">Landed Costs</Typography>
                <Typography>{order.totals.landedCostTotal.toLocaleString()}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography fontWeight="bold">Grand Total</Typography>
                <Typography fontWeight="bold">
                  {order.totals.grandTotal.toLocaleString()} {order.totals.currency}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Receiving History */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Receiving History ({order.receivingHistory.length})
              </Typography>
              {order.receivingHistory.length > 0 ? (
                order.receivingHistory.map((receipt) => (
                  <Box key={receipt.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="bold">{receipt.id}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {receipt.lines.length} line(s) received
                      {receipt.deliveryReference && ` — Ref: ${receipt.deliveryReference}`}
                    </Typography>
                    {receipt.notes && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {receipt.notes}
                      </Typography>
                    )}
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">No goods received yet</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Purchase Order</DialogTitle>
        <DialogContent>
          <TextField
            label="Rejection Reason"
            multiline
            rows={3}
            fullWidth
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            sx={{ mt: 1 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={!rejectNotes.trim() || actionLoading}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Purchase Order</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will cancel the purchase order. This action cannot be undone.
          </Typography>
          <TextField
            label="Cancellation Reason"
            multiline
            rows={3}
            fullWidth
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>Keep PO</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            disabled={!cancelReason.trim() || actionLoading}
          >
            Cancel PO
          </Button>
        </DialogActions>
      </Dialog>

      {/* Goods Receipt Dialog */}
      {showReceiptDialog && (
        <GoodsReceiptDialog
          open={showReceiptDialog}
          onClose={() => setShowReceiptDialog(false)}
          order={order}
          warehouses={warehouses}
          onReceive={(receipt) => actions.receive(receipt)}
          userId={user?.uid ?? ''}
        />
      )}
    </Box>
  );
}
