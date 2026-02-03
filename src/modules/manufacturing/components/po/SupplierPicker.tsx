/**
 * SupplierPicker
 * Autocomplete component for searching and selecting suppliers from matflow
 */

import { useEffect } from 'react';
import { Autocomplete, TextField, Box, Typography, Chip } from '@mui/material';
import type { Supplier } from '@/subsidiaries/advisory/matflow/types/supplier';
import { useSupplierPicker } from '../../hooks/useSupplierPicker';

interface SupplierPickerProps {
  value: { supplierId: string; supplierName: string } | null;
  onChange: (value: { supplierId: string; supplierName: string } | null) => void;
  label?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  disabled?: boolean;
}

export function SupplierPicker({
  value,
  onChange,
  label = 'Supplier',
  size = 'medium',
  fullWidth = true,
  disabled = false,
}: SupplierPickerProps) {
  const { suppliers, loading, search, loadAll } = useSupplierPicker();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <Autocomplete
      options={suppliers}
      loading={loading}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      getOptionLabel={(option) => option.name || option.code}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      value={suppliers.find((s) => s.id === value?.supplierId) ?? null}
      onChange={(_event, newValue: Supplier | null) => {
        if (newValue) {
          onChange({ supplierId: newValue.id, supplierName: newValue.name });
        } else {
          onChange(null);
        }
      }}
      onInputChange={(_event, inputValue, reason) => {
        if (reason === 'input') {
          search(inputValue);
        }
      }}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight="bold">
              {option.name || option.code}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {option.contactPerson && `${option.contactPerson} — `}
              {option.phone}
              {option.address?.city && ` — ${option.address.city}`}
            </Typography>
          </Box>
          {option.rating != null && option.rating > 0 && (
            <Chip
              label={`${option.rating.toFixed(1)}`}
              size="small"
              color={option.rating >= 4 ? 'success' : option.rating >= 3 ? 'warning' : 'error'}
              variant="outlined"
              sx={{ ml: 1 }}
            />
          )}
          <Chip
            label={option.status}
            size="small"
            variant="outlined"
            sx={{ ml: 0.5 }}
          />
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Search suppliers..."
        />
      )}
    />
  );
}
