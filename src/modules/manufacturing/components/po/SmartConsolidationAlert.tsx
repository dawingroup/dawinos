/**
 * Smart Consolidation Alert
 *
 * Shows when other MOs have pending requirements for the same supplier.
 * Allows users to add those requirements to the current PO for consolidated purchasing.
 */

import { useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import type { ConsolidationOpportunity, MORequirementSummary } from '../../services/smartConsolidationService';
import type { ProcurementRequirement } from '../../types/procurement';

interface Props {
  opportunity: ConsolidationOpportunity | null;
  loading: boolean;
  /** Called when user selects requirements to add */
  onAddRequirements: (requirements: ProcurementRequirement[]) => void;
}

export function SmartConsolidationAlert({ opportunity, loading, onAddRequirements }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [selectedMOs, setSelectedMOs] = useState<Set<string>>(new Set());

  // Don't render if no opportunities
  if (!loading && (!opportunity || opportunity.otherMOs.length === 0)) {
    return null;
  }

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const handleToggleMO = (moId: string) => {
    setSelectedMOs((prev) => {
      const next = new Set(prev);
      if (next.has(moId)) {
        next.delete(moId);
      } else {
        next.add(moId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!opportunity) return;
    if (selectedMOs.size === opportunity.otherMOs.length) {
      setSelectedMOs(new Set());
    } else {
      setSelectedMOs(new Set(opportunity.otherMOs.map((mo) => mo.moId)));
    }
  };

  const handleAddSelected = () => {
    if (!opportunity) return;

    const selectedRequirements: ProcurementRequirement[] = [];
    for (const mo of opportunity.otherMOs) {
      if (selectedMOs.has(mo.moId)) {
        selectedRequirements.push(...mo.requirements);
      }
    }

    if (selectedRequirements.length > 0) {
      onAddRequirements(selectedRequirements);
      setSelectedMOs(new Set());
      setExpanded(false);
    }
  };

  if (loading) {
    return (
      <Alert
        severity="info"
        icon={<LightbulbIcon />}
        sx={{ mb: 2 }}
      >
        <Skeleton width={300} />
      </Alert>
    );
  }

  const totalSelectedValue = opportunity
    ? opportunity.otherMOs
        .filter((mo) => selectedMOs.has(mo.moId))
        .reduce((sum, mo) => sum + mo.totalEstimatedCost, 0)
    : 0;

  return (
    <Alert
      severity="info"
      icon={<LightbulbIcon />}
      sx={{ mb: 2 }}
      action={
        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{ mt: -0.5 }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      }
    >
      <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        Consolidation Opportunity
        <Chip
          label={`${opportunity?.totalRequirementCount} items`}
          size="small"
          color="info"
          sx={{ ml: 1 }}
        />
      </AlertTitle>

      <Typography variant="body2" sx={{ mb: 1 }}>
        {opportunity?.otherMOs.length} other manufacturing order(s) need materials from{' '}
        <strong>{opportunity?.supplierName}</strong> totaling{' '}
        <strong>{formatCurrency(opportunity?.totalPotentialValue ?? 0, opportunity?.currency ?? 'USD')}</strong>.
        Consolidate for better pricing.
      </Typography>

      <Collapse in={expanded}>
        <Box sx={{ mt: 2, bgcolor: 'background.paper', borderRadius: 1, p: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Button size="small" onClick={handleSelectAll}>
              {selectedMOs.size === opportunity?.otherMOs.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selectedMOs.size > 0 && (
              <Typography variant="caption" color="text.secondary">
                Selected: {formatCurrency(totalSelectedValue, opportunity?.currency ?? 'USD')}
              </Typography>
            )}
          </Box>

          <List dense disablePadding>
            {opportunity?.otherMOs.map((mo) => (
              <MOListItem
                key={mo.moId}
                mo={mo}
                selected={selectedMOs.has(mo.moId)}
                onToggle={() => handleToggleMO(mo.moId)}
              />
            ))}
          </List>

          {selectedMOs.size > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleAddSelected}
              >
                Add {selectedMOs.size} MO(s) to this PO
              </Button>
            </Box>
          )}
        </Box>
      </Collapse>
    </Alert>
  );
}

interface MOListItemProps {
  mo: MORequirementSummary;
  selected: boolean;
  onToggle: () => void;
}

function MOListItem({ mo, selected, onToggle }: MOListItemProps) {
  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <ListItem disablePadding>
      <ListItemButton onClick={onToggle} dense>
        <ListItemIcon sx={{ minWidth: 36 }}>
          <Checkbox edge="start" checked={selected} tabIndex={-1} size="small" />
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight={500}>
                {mo.moNumber}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {mo.projectCode}
              </Typography>
            </Box>
          }
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption">{mo.designItemName}</Typography>
              <Chip
                label={`${mo.requirementCount} items`}
                size="small"
                variant="outlined"
                sx={{ height: 18, '& .MuiChip-label': { px: 1, py: 0 } }}
              />
            </Box>
          }
        />
        <Typography variant="body2" color="primary" fontWeight={500}>
          {formatCurrency(mo.totalEstimatedCost, mo.currency)}
        </Typography>
      </ListItemButton>
    </ListItem>
  );
}
