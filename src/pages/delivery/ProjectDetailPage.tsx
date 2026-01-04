/**
 * ProjectDetailPage
 * View project details
 */

import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';

export default function ProjectDetailPage() {
  const { projectId } = useParams();

  return (
    <>
      <Helmet>
        <title>Project Details | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Project Details</h1>
        <Card>
          <CardHeader>
            <CardTitle>Project {projectId}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Project details will be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
