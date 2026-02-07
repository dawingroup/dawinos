/**
 * Create Quote Dialog
 * Dialog for creating a new client quote from project estimate
 */

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import { Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { createClientQuote } from '../../services/clientPortalService';
import type { ConsolidatedEstimate } from '../../types/estimate';
import type { DesignProject } from '../../types';

interface CreateQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  onQuoteCreated: () => void;
}

export default function CreateQuoteDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  customerId,
  customerName,
  customerEmail,
  onQuoteCreated,
}: CreateQuoteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingEstimate, setLoadingEstimate] = useState(true);
  const [estimate, setEstimate] = useState<ConsolidatedEstimate | null>(null);
  const [project, setProject] = useState<DesignProject | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validityDays, setValidityDays] = useState('30');
  const [paymentTerms, setPaymentTerms] = useState('50% deposit upon approval, 50% on completion');
  const [depositRequired, setDepositRequired] = useState('50');
  const [depositType, setDepositType] = useState<'percentage' | 'fixed'>('percentage');
  const [internalNotes, setInternalNotes] = useState('');

  // Load project and estimate data
  useEffect(() => {
    async function loadData() {
      if (!open || !projectId) return;

      setLoadingEstimate(true);
      setError(null);

      try {
        const projectRef = doc(db, 'designProjects', projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
          setError('Project not found');
          return;
        }

        const projectData = {
          id: projectSnap.id,
          ...projectSnap.data(),
        } as DesignProject;

        setProject(projectData);

        // Get estimate from project
        const data = projectSnap.data();
        if (data.consolidatedEstimate) {
          setEstimate(data.consolidatedEstimate as ConsolidatedEstimate);
          // Set default title
          setTitle(`Quote for ${projectName}`);
        } else {
          setError('No estimate found. Please generate an estimate first.');
        }
      } catch (err) {
        console.error('Failed to load project data:', err);
        setError('Failed to load project data');
      } finally {
        setLoadingEstimate(false);
      }
    }

    loadData();
  }, [open, projectId, projectName]);

  const handleSubmit = async () => {
    if (!estimate || !project) return;

    setLoading(true);
    setError(null);

    try {
      await createClientQuote(
        {
          projectId,
          customerId,
          title,
          description: description || undefined,
          validityDays: parseInt(validityDays, 10),
          paymentTerms: paymentTerms || undefined,
          depositRequired: depositRequired ? parseFloat(depositRequired) : undefined,
          depositType,
          internalNotes: internalNotes || undefined,
        },
        estimate,
        project,
        customerName,
        customerEmail,
        'current-user' // TODO: Get actual user ID
      );

      onQuoteCreated();
    } catch (err) {
      console.error('Failed to create quote:', err);
      setError('Failed to create quote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'UGX') => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Client Quote</DialogTitle>
          <DialogDescription>
            Generate a quote from the project estimate for {customerName}
          </DialogDescription>
        </DialogHeader>

        {loadingEstimate ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error && !estimate ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : estimate ? (
          <div className="space-y-4">
            {/* Estimate Summary */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Quote Total</span>
                <span className="text-lg font-bold">
                  {formatCurrency(estimate.total, estimate.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">
                  {estimate.lineItems.length} line items
                </span>
                <span className="text-xs text-muted-foreground">
                  Tax: {formatCurrency(estimate.taxAmount, estimate.currency)}
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Quote Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  placeholder="Enter quote title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  placeholder="Brief description of the work"
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validity">Valid For (Days)</Label>
                  <Select value={validityDays} onValueChange={setValidityDays}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deposit">Deposit Required</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="deposit"
                      type="number"
                      value={depositRequired}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositRequired(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={depositType} onValueChange={(v: 'percentage' | 'fixed') => setDepositType(v)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">{estimate.currency}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  id="paymentTerms"
                  value={paymentTerms}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentTerms(e.target.value)}
                  placeholder="e.g., 50% deposit, 50% on completion"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="internalNotes">Internal Notes (Not shown to client)</Label>
                <Textarea
                  id="internalNotes"
                  value={internalNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInternalNotes(e.target.value)}
                  placeholder="Notes for internal reference only"
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !estimate}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Quote'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
