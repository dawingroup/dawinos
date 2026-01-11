/**
 * HR Dashboard Component - DawinOS v2.0
 * Main HR dashboard showing key metrics and quick access
 */

import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  BeachAccess as LeaveIcon,
  ExitToApp as ExitIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { differenceInDays } from 'date-fns';

import { useEmployeeStats, useExpiringProbations } from '../../hooks/useEmployee';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down';
  };
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  onClick,
}) => (
  <Card>
    <CardActionArea onClick={onClick} disabled={!onClick}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h3" sx={{ my: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                {trend.direction === 'up' ? (
                  <TrendingUpIcon fontSize="small" color="success" />
                ) : (
                  <TrendingDownIcon fontSize="small" color="error" />
                )}
                <Typography
                  variant="body2"
                  color={trend.direction === 'up' ? 'success.main' : 'error.main'}
                >
                  {trend.value}% {trend.label}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: `${color}15`,
              color: color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </CardActionArea>
  </Card>
);

export const HRDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { stats, loading: statsLoading, error: statsError } = useEmployeeStats();
  const { employees: expiringProbations, loading: probationsLoading } = useExpiringProbations(30);

  // Loading state
  if (statsLoading) {
    return (
      <Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={160} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={300} />
      </Box>
    );
  }

  // Error state
  if (statsError) {
    return (
      <Alert severity="error">
        Error loading dashboard: {statsError.message}
      </Alert>
    );
  }

  const onLeaveCount = stats?.byStatus?.on_leave || 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        HR Dashboard
      </Typography>

      {/* Stat cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Employees"
            value={stats?.totalEmployees || 0}
            subtitle={`${stats?.byStatus?.active || 0} active`}
            icon={<PeopleIcon />}
            color="#1976d2"
            onClick={() => navigate('/hr/employees')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="New Hires"
            value={stats?.newHiresCount || 0}
            subtitle="Last 30 days"
            icon={<PersonAddIcon />}
            color="#4caf50"
            onClick={() => navigate('/hr/employees?filter=new')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="On Leave"
            value={onLeaveCount}
            subtitle="Currently away"
            icon={<LeaveIcon />}
            color="#ff9800"
            onClick={() => navigate('/hr/employees?status=on_leave')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Exits"
            value={stats?.exitCount || 0}
            subtitle="Last 30 days"
            icon={<ExitIcon />}
            color="#f44336"
            trend={
              stats?.turnoverRate
                ? {
                    value: Math.round(stats.turnoverRate * 100) / 100,
                    label: 'turnover rate',
                    direction: stats.turnoverRate > 5 ? 'down' : 'up',
                  }
                : undefined
            }
          />
        </Grid>
      </Grid>

      {/* Probations ending soon */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <WarningIcon color="warning" />
            <Typography variant="h6">
              Probations Ending Soon
            </Typography>
            <Chip
              label={expiringProbations.length}
              size="small"
              color="warning"
            />
          </Box>

          {probationsLoading ? (
            <Box>
              {[1, 2, 3].map(i => (
                <Skeleton key={i} height={60} sx={{ mb: 1 }} />
              ))}
            </Box>
          ) : expiringProbations.length === 0 ? (
            <Typography color="text.secondary">
              No probations ending in the next 30 days
            </Typography>
          ) : (
            <List>
              {expiringProbations.slice(0, 5).map(employee => {
                const daysLeft = employee.employmentDates?.probationEndDate
                  ? differenceInDays(employee.employmentDates.probationEndDate.toDate(), new Date())
                  : null;

                return (
                  <ListItem
                    key={employee.id}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/hr/employees/${employee.id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar src={employee.photoUrl || undefined}>
                        {employee.firstName?.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${employee.firstName} ${employee.lastName}`}
                      secondary={employee.position?.title}
                    />
                    <Chip
                      label={
                        daysLeft !== null
                          ? daysLeft <= 0
                            ? 'Overdue'
                            : `${daysLeft} days left`
                          : 'Unknown'
                      }
                      size="small"
                      color={daysLeft !== null && daysLeft <= 7 ? 'error' : 'warning'}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}

          {expiringProbations.length > 5 && (
            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: 'pointer', mt: 2 }}
              onClick={() => navigate('/hr/employees?status=probation')}
            >
              View all {expiringProbations.length} probations
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default HRDashboard;
