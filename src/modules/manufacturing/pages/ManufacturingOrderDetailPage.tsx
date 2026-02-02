/**
 * Manufacturing Order Detail Page
 * Full MO view with BOM, parts, stage tracker, and actions
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
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseIcon from '@mui/icons-material/Pause';
import CancelIcon from '@mui/icons-material/Cancel';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import VerifiedIcon from '@mui/icons-material/Verified';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { useParams, Link } from 'react-router-dom';
import { useManufacturingOrder } from '../hooks/useManufacturingOrder';
import { useProcurementRequirements } from '../hooks/useProcurementRequirements';
import { useWarehouses } from '@/modules/inventory/hooks/useWarehouses';
import { MO_STAGES, MO_STAGE_LABELS, MO_STATUS_LABELS } from '../types';
import type { BOMEntry } from '../types';
import { PROCUREMENT_STATUS_LABELS } from '../types/procurement';
import { useAuth } from '@/shared/hooks/useAuth';
import { MaterialConsumptionDialog } from '../components/mo/MaterialConsumptionDialog';
import { QCInspectionDialog } from '../components/mo/QCInspectionDialog';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/shared/services/firebase';

export default function ManufacturingOrderDetailPage() {
  const { moId } = useParams<{ moId: string }>();
  const { user } = useAuth();
  const { order, loading, error, actions } = useManufacturingOrder(moId ?? null, user?.uid ?? '');
  const { requirements: procurementReqs } = useProcurementRequirements({
    subsidiaryId: 'finishes',
    filters: { moId: moId ?? undefined },
  });
  const { warehouses } = useWarehouses('finishes');
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states
  const [stageNotes, setStageNotes] = useState('');
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approveWarehouseId, setApproveWarehouseId] = useState('');
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [shortageAlert, setShortageAlert] = useState<string | null>(null);
  const [showConsumeDialog, setShowConsumeDialog] = useState(false);
  const [showQCDialog, setShowQCDialog] = useState(false);

  // BOM editing state
  const [bomEditing, setBomEditing] = useState(false);
  const [editedBom, setEditedBom] = useState<BOMEntry[]>([]);
  const [bomSaving, setBomSaving] = useState(false);

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
        <Alert severity="error">Manufacturing order not found</Alert>
      </Box>
    );
  }

  const currentStageIndex = MO_STAGES.indexOf(order.currentStage);

  const handleApprove = async () => {
    if (!approveWarehouseId) return;
    setActionLoading(true);
    try {
      const result = await actions.approve(approveWarehouseId);
      if (!result.success && result.shortages.length > 0) {
        setShortageAlert(
          result.shortages
            .map((s) => `${s.itemName}: need ${s.required}, have ${s.available}`)
            .join('\n'),
        );
      }
      setShowApproveDialog(false);
    } catch {
      // Error handled by hook
    }
    setActionLoading(false);
  };

  const handleAdvanceStage = async () => {
    setActionLoading(true);
    try {
      await actions.advanceStage(stageNotes || undefined);
      setShowAdvanceDialog(false);
      setStageNotes('');
    } catch {
      // Error handled by hook
    }
    setActionLoading(false);
  };

  const handleHold = async () => {
    if (!holdReason.trim()) return;
    setActionLoading(true);
    try {
      await actions.hold(holdReason);
      setShowHoldDialog(false);
      setHoldReason('');
    } catch {
      // Error handled by hook
    }
    setActionLoading(false);
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    setActionLoading(true);
    try {
      await actions.cancel(cancelReason);
      setShowCancelDialog(false);
      setCancelReason('');
    } catch {
      // Error handled by hook
    }
    setActionLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">{order.moNumber}</Typography>
          <Typography variant="body1" color="text.secondary">
            {order.projectId && order.designItemId ? (
              <Link
                to={`/design/project/${order.projectId}/item/${order.designItemId}`}
                style={{ color: 'inherit', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                {order.designItemName} — {order.projectCode}
              </Link>
            ) : (
              <>{order.designItemName} — {order.projectCode}</>
            )}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={MO_STATUS_LABELS[order.status]} color="primary" />
          <Chip
            label={order.priority}
            variant="outlined"
            color={order.priority === 'urgent' ? 'error' : order.priority === 'high' ? 'warning' : 'default'}
          />
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {shortageAlert && (
        <Alert severity="warning" sx={{ mb: 2, whiteSpace: 'pre-line' }} onClose={() => setShortageAlert(null)}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Material Shortages Detected</Typography>
          {shortageAlert}
        </Alert>
      )}

      {/* Stage Tracker */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Production Stage</Typography>
          <Stepper activeStep={currentStageIndex} alternativeLabel>
            {MO_STAGES.map((stage, index) => (
              <Step key={stage} completed={index < currentStageIndex}>
                <StepLabel>{MO_STAGE_LABELS[stage]}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {order.status === 'draft' && (
          <Button
            variant="contained"
            color="success"
            startIcon={actionLoading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
            onClick={() => {
              setApproveWarehouseId(warehouses[0]?.id ?? '');
              setShowApproveDialog(true);
            }}
            disabled={actionLoading}
          >
            Approve & Reserve Materials
          </Button>
        )}
        {order.status === 'approved' && (
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={async () => {
              setActionLoading(true);
              await actions.startProduction();
              setActionLoading(false);
            }}
            disabled={actionLoading}
          >
            Start Production
          </Button>
        )}
        {order.status === 'in-progress' && order.currentStage !== 'ready' && (
          <Button
            variant="contained"
            startIcon={<SkipNextIcon />}
            onClick={() => setShowAdvanceDialog(true)}
            disabled={actionLoading}
          >
            Advance Stage
          </Button>
        )}
        {order.status === 'in-progress' && (
          <Button
            variant="outlined"
            color="warning"
            startIcon={<PauseIcon />}
            onClick={() => setShowHoldDialog(true)}
            disabled={actionLoading}
          >
            Put on Hold
          </Button>
        )}
        {order.status === 'on-hold' && (
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={async () => {
              setActionLoading(true);
              await actions.resume();
              setActionLoading(false);
            }}
            disabled={actionLoading}
          >
            Resume
          </Button>
        )}
        {order.status === 'in-progress' && (
          <Button
            variant="outlined"
            startIcon={<InventoryIcon />}
            onClick={() => setShowConsumeDialog(true)}
            disabled={actionLoading}
          >
            Consume Materials
          </Button>
        )}
        {order.status === 'in-progress' && order.currentStage === 'qc' && (
          <Button
            variant="outlined"
            color="success"
            startIcon={<VerifiedIcon />}
            onClick={() => setShowQCDialog(true)}
            disabled={actionLoading}
          >
            Record QC
          </Button>
        )}
        {!['completed', 'cancelled'].includes(order.status) && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => setShowCancelDialog(true)}
            disabled={actionLoading}
          >
            Cancel Order
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* BOM Table */}
        <Grid size={12}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Bill of Materials</Typography>
                {['draft', 'approved'].includes(order.status) && !bomEditing && (
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setEditedBom(order.bom.map((e) => ({ ...e })));
                      setBomEditing(true);
                    }}
                  >
                    Edit BOM
                  </Button>
                )}
                {bomEditing && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setEditedBom((prev) => [
                          ...prev,
                          {
                            id: `BOM-${Date.now()}`,
                            inventoryItemId: '',
                            sku: '',
                            itemName: '',
                            category: '',
                            quantityRequired: 0,
                            unit: 'pcs',
                            unitCost: 0,
                            totalCost: 0,
                          },
                        ]);
                      }}
                    >
                      Add Entry
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setBomEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={bomSaving ? <CircularProgress size={14} /> : <SaveIcon />}
                      disabled={bomSaving}
                      onClick={async () => {
                        setBomSaving(true);
                        try {
                          const recalculated = editedBom.map((e) => ({
                            ...e,
                            totalCost: e.quantityRequired * e.unitCost,
                          }));
                          await updateDoc(doc(db, 'manufacturingOrders', order.id), {
                            bom: recalculated,
                            'costSummary.materialCost': recalculated.reduce((s, e) => s + e.totalCost, 0),
                            'costSummary.totalCost':
                              recalculated.reduce((s, e) => s + e.totalCost, 0) + order.costSummary.laborCost,
                            updatedAt: new Date(),
                            updatedBy: user?.uid ?? '',
                          });
                          setBomEditing(false);
                        } catch (e) {
                          setShortageAlert((e as Error).message);
                        } finally {
                          setBomSaving(false);
                        }
                      }}
                    >
                      Save BOM
                    </Button>
                  </Box>
                )}
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Supplier</TableCell>
                      <TableCell align="right">Qty Required</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell align="right">Unit Cost</TableCell>
                      <TableCell align="right">Total Cost</TableCell>
                      {bomEditing && <TableCell sx={{ width: 50 }} />}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bomEditing ? (
                      editedBom.map((entry, idx) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <TextField
                              size="small"
                              value={entry.itemName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditedBom((prev) => prev.map((b, i) => i === idx ? { ...b, itemName: val } : b));
                              }}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={entry.category}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditedBom((prev) => prev.map((b, i) => i === idx ? { ...b, category: val } : b));
                              }}
                              sx={{ width: 120 }}
                            />
                          </TableCell>
                          <TableCell>{entry.supplierName ?? '—'}</TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={entry.quantityRequired}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setEditedBom((prev) => prev.map((b, i) => i === idx ? { ...b, quantityRequired: val, totalCost: val * b.unitCost } : b));
                              }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={entry.unit}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditedBom((prev) => prev.map((b, i) => i === idx ? { ...b, unit: val } : b));
                              }}
                              sx={{ width: 70 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={entry.unitCost}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setEditedBom((prev) => prev.map((b, i) => i === idx ? { ...b, unitCost: val, totalCost: b.quantityRequired * val } : b));
                              }}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {(entry.quantityRequired * entry.unitCost).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setEditedBom((prev) => prev.filter((_, i) => i !== idx))}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      order.bom.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.itemName}</TableCell>
                          <TableCell>{entry.category}</TableCell>
                          <TableCell>{entry.supplierName ?? '—'}</TableCell>
                          <TableCell align="right">{entry.quantityRequired}</TableCell>
                          <TableCell>{entry.unit}</TableCell>
                          <TableCell align="right">{entry.unitCost.toLocaleString()}</TableCell>
                          <TableCell align="right">{entry.totalCost.toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                    {(bomEditing ? editedBom : order.bom).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={bomEditing ? 8 : 7} align="center">
                          <Typography color="text.secondary">No BOM entries</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Summary */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Cost Summary</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Materials</Typography>
                <Typography>{order.costSummary.materialCost.toLocaleString()} {order.costSummary.currency}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Labor</Typography>
                <Typography>{order.costSummary.laborCost.toLocaleString()} {order.costSummary.currency}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography fontWeight="bold">Total</Typography>
                <Typography fontWeight="bold">{order.costSummary.totalCost.toLocaleString()} {order.costSummary.currency}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Material Reservations */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Material Reservations ({order.materialReservations.length})
              </Typography>
              {order.materialReservations.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Reserved</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.materialReservations.map((res) => (
                        <TableRow key={res.id}>
                          <TableCell>{res.inventoryItemId}</TableCell>
                          <TableCell align="right">{res.quantityReserved}</TableCell>
                          <TableCell>
                            <Chip
                              label={res.status}
                              size="small"
                              color={res.status === 'active' ? 'success' : res.status === 'consumed' ? 'default' : 'warning'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">No materials reserved yet</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Procurement Requirements */}
        {procurementReqs.length > 0 && (
          <Grid size={12}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Procurement Requirements ({procurementReqs.length})
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ShoppingCartIcon />}
                    component={Link}
                    to="/manufacturing/procurement"
                  >
                    Procurement Dashboard
                  </Button>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell>Supplier</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Est. Cost</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>PO</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {procurementReqs.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell>{req.itemDescription}</TableCell>
                          <TableCell>{req.supplierName ?? '—'}</TableCell>
                          <TableCell align="right">{req.quantityRequired}</TableCell>
                          <TableCell align="right">{req.estimatedTotalCost.toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip
                              label={PROCUREMENT_STATUS_LABELS[req.status]}
                              size="small"
                              color={
                                req.status === 'pending' ? 'warning' :
                                req.status === 'ordered' ? 'primary' :
                                req.status === 'received' ? 'success' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {req.poId ? (
                              <Chip
                                label="View PO"
                                size="small"
                                variant="outlined"
                                component={Link}
                                to={`/manufacturing/purchase-orders/${req.poId}`}
                                clickable
                              />
                            ) : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Linked Purchase Orders */}
        {order.linkedPOIds && order.linkedPOIds.length > 0 && (
          <Grid size={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Linked Purchase Orders ({order.linkedPOIds.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {order.linkedPOIds.map((poId) => (
                    <Chip
                      key={poId}
                      label={`PO: ${poId.slice(0, 8)}...`}
                      variant="outlined"
                      component={Link}
                      to={`/manufacturing/purchase-orders/${poId}`}
                      clickable
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Approve Dialog with Warehouse Selection */}
      <Dialog open={showApproveDialog} onClose={() => setShowApproveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve & Reserve Materials</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select the warehouse to reserve materials from for this manufacturing order.
          </Typography>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Warehouse</InputLabel>
            <Select
              value={approveWarehouseId}
              label="Warehouse"
              onChange={(e) => setApproveWarehouseId(e.target.value)}
            >
              {warehouses.map((w) => (
                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
              ))}
              {warehouses.length === 0 && (
                <MenuItem value="" disabled>No warehouses available</MenuItem>
              )}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApproveDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={!approveWarehouseId || actionLoading}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Advance Stage Dialog */}
      <Dialog open={showAdvanceDialog} onClose={() => setShowAdvanceDialog(false)}>
        <DialogTitle>
          Advance to {order.currentStage !== 'ready' && MO_STAGE_LABELS[MO_STAGES[currentStageIndex + 1]]}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Stage Notes (optional)"
            multiline
            rows={3}
            fullWidth
            value={stageNotes}
            onChange={(e) => setStageNotes(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAdvanceDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAdvanceStage}
            disabled={actionLoading}
          >
            Advance
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hold Dialog */}
      <Dialog open={showHoldDialog} onClose={() => setShowHoldDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Put Order on Hold</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason for Hold"
            multiline
            rows={3}
            fullWidth
            value={holdReason}
            onChange={(e) => setHoldReason(e.target.value)}
            sx={{ mt: 1 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHoldDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleHold}
            disabled={!holdReason.trim() || actionLoading}
          >
            Put on Hold
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Manufacturing Order</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will cancel the manufacturing order and release any material reservations. This action cannot be undone.
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
          <Button onClick={() => setShowCancelDialog(false)}>Keep Order</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            disabled={!cancelReason.trim() || actionLoading}
          >
            Cancel Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Material Consumption Dialog */}
      {showConsumeDialog && (
        <MaterialConsumptionDialog
          open={showConsumeDialog}
          onClose={() => setShowConsumeDialog(false)}
          order={order}
          warehouses={warehouses}
          onConsume={actions.consumeMaterials}
        />
      )}

      {/* QC Inspection Dialog */}
      {showQCDialog && (
        <QCInspectionDialog
          open={showQCDialog}
          onClose={() => setShowQCDialog(false)}
          order={order}
          userId={user?.uid ?? ''}
          onRecordQC={actions.recordQC}
        />
      )}
    </Box>
  );
}
