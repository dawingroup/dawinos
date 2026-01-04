/**
 * PortfolioListPage
 * List portfolios
 */

import { Helmet } from 'react-helmet-async';
import { Plus, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function PortfolioListPage() {
  return (
    <>
      <Helmet>
        <title>Portfolios | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Portfolios</h1>
            <p className="text-muted-foreground">Manage investment portfolios</p>
          </div>
          <Button asChild>
            <Link to="/advisory/portfolios/new">
              <Plus className="mr-2 h-4 w-4" />
              New Portfolio
            </Link>
          </Button>
        </div>

        <EmptyState
          icon={Wallet}
          title="No portfolios yet"
          description="Create your first portfolio"
          action={{ label: 'Create Portfolio', onClick: () => window.location.href = '/advisory/portfolios/new' }}
        />
      </div>
    </>
  );
}
