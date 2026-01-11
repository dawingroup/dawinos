// ============================================================================
// DEAL DETAIL PAGE
// DawinOS v2.0 - Capital Hub Module
// Comprehensive deal view with all related information
// ============================================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  MoreVertical,
  CheckCircle,
  Circle,
  FileText,
  UserPlus,
  Plus,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Progress } from '@/core/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/core/components/ui/tooltip';

import { useDeal } from '../hooks/useDeal';
import { DealStageChip } from '../components/shared/DealStageChip';
import { formatCurrency } from '../components/shared/CurrencyDisplay';
import { MODULE_COLOR, DEAL_STAGES, DEAL_TYPES, SECTORS } from '../constants';

const DealDetailPage: React.FC = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');

  const { deal, loading, error, updateDeal, addActivity } = useDeal(dealId);

  const handleStageChange = async (newStage: string) => {
    if (deal) {
      await updateDeal({ stage: newStage });
      await addActivity({
        type: 'stage_change',
        description: `Stage changed to ${DEAL_STAGES.find(s => s.id === newStage)?.label}`,
      });
    }
    setStageDialogOpen(false);
  };

  const handleAddNote = async () => {
    if (deal && newNote.trim()) {
      await addActivity({
        type: 'note',
        description: newNote,
      });
      setNewNote('');
      setNoteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">{error?.message || 'Deal not found'}</p>
        <Button onClick={() => navigate('/capital/deals')}>Back to Deals</Button>
      </div>
    );
  }

  const currentStageIndex = DEAL_STAGES.findIndex(s => s.id === deal.stage);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/capital/deals')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold">{deal.name}</h1>
            <DealStageChip stage={deal.stage} />
          </div>
          <p className="text-muted-foreground">
            {deal.companyName} · {SECTORS.find(s => s.id === deal.sector)?.label} · {DEAL_TYPES.find(t => t.id === deal.dealType)?.label}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setNoteDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
          <Button variant="outline" onClick={() => setStageDialogOpen(true)}>
            Change Stage
          </Button>
          <Button
            onClick={() => navigate(`/capital/deals/${dealId}/edit`)}
            style={{ backgroundColor: MODULE_COLOR }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Clone Deal</DropdownMenuItem>
              <DropdownMenuItem>Export to PDF</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Archive Deal</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stage Progress */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">Deal Progress</p>
          <div className="flex gap-1">
            {DEAL_STAGES.filter(s => s.id !== 'lost').map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = stage.id === deal.stage;
              return (
                <TooltipProvider key={stage.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex-1 h-2 rounded-full transition-all"
                        style={{
                          backgroundColor: isCompleted || isCurrent ? stage.color : '#E5E7EB',
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{stage.label}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Sourcing</span>
            <span>Closed</span>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Deal Size</p>
            <p className="text-xl font-semibold">{formatCurrency(deal.dealSize || 0, 'USD', true)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Our Investment</p>
            <p className="text-xl font-semibold">{formatCurrency(deal.targetInvestment || 0, 'USD', true)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Probability</p>
            <p className="text-xl font-semibold">{deal.probability || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Target Close</p>
            <p className="text-xl font-semibold">
              {deal.targetCloseDate ? format(new Date(deal.targetCloseDate), 'MMM d') : 'TBD'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="due_diligence">Due Diligence</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="team">Team & Contacts</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Investment Thesis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {deal.investmentThesis || 'No investment thesis provided.'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Key Highlights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {deal.highlights?.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    )) || (
                      <p className="text-sm text-muted-foreground">No highlights added</p>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Key Risks</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {deal.risks?.map((risk, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Circle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>{risk}</span>
                      </li>
                    )) || (
                      <p className="text-sm text-muted-foreground">No risks identified</p>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Company Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{deal.companyName}</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {deal.companyDescription || 'No description provided.'}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Founded</p>
                      <p>{deal.companyFounded || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Employees</p>
                      <p>{deal.companyEmployees || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Location</p>
                      <p>{deal.companyLocation || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Website</p>
                      <p>{deal.companyWebsite || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Deal Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 flex-wrap">
                    {deal.teamMembers?.map(member => (
                      <TooltipProvider key={member.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-medium"
                              style={{ backgroundColor: MODULE_COLOR }}
                            >
                              {member.name[0]}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Due Diligence Tab */}
        <TabsContent value="due_diligence" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Due Diligence Checklist</CardTitle>
                <Badge>
                  {deal.dueDiligenceChecklist?.filter(i => i.completed).length || 0}/
                  {deal.dueDiligenceChecklist?.length || 0} completed
                </Badge>
              </div>
              <Progress
                value={
                  deal.dueDiligenceChecklist?.length
                    ? (deal.dueDiligenceChecklist.filter(i => i.completed).length / deal.dueDiligenceChecklist.length) * 100
                    : 0
                }
                className="h-2"
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deal.dueDiligenceChecklist?.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      className="h-4 w-4 rounded"
                      readOnly
                    />
                    <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                      {item.item}
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {item.category}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-muted-foreground text-center py-4">No checklist items</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Documents</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Upload
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deal.documents?.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded border hover:bg-muted/50 cursor-pointer"
                  >
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.type}</p>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground text-center py-4">No documents uploaded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Internal Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deal.teamMembers?.map(member => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: MODULE_COLOR }}
                      >
                        {member.name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground">No team members assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Company Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deal.contacts?.map(contact => (
                    <div key={contact.id} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-medium">
                        {contact.name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contact.title} · {contact.email}
                        </p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground">No contacts added</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {deal.financials ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">Revenue 2024</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(deal.financials.revenue2024 || 0, 'USD', true)}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">Revenue 2023</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(deal.financials.revenue2023 || 0, 'USD', true)}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">Gross Margin</p>
                    <p className="text-lg font-semibold">
                      {((deal.financials.grossMargin || 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">Runway (months)</p>
                    <p className="text-lg font-semibold">{deal.financials.runway || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No financial data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deal.activities?.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: MODULE_COLOR }}
                      >
                        {activity.userName[0]}
                      </div>
                      {index < (deal.activities?.length || 0) - 1 && (
                        <div className="w-0.5 flex-1 bg-muted mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{activity.userName}</span>
                        <Badge variant="outline" className="text-xs">{activity.type}</Badge>
                      </div>
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground text-center py-4">No activity recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stage Change Dialog */}
      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Deal Stage</DialogTitle>
            <DialogDescription>Select a new stage for this deal</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {DEAL_STAGES.map(stage => (
              <div
                key={stage.id}
                className={`flex items-center gap-3 p-3 rounded cursor-pointer hover:bg-muted/50 ${
                  stage.id === deal.stage ? 'bg-muted' : ''
                }`}
                onClick={() => handleStageChange(stage.id)}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span>{stage.label}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Enter your note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              style={{ backgroundColor: MODULE_COLOR }}
            >
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DealDetailPage;
