'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface SecurityMetric {
  id: number;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  icon: string;
  status: 'healthy' | 'warning' | 'critical';
}

interface SecurityEvent {
  id: number;
  timestamp: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  status: 'resolved' | 'investigating' | 'monitoring';
}

const SecurityMonitoring = () => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const securityMetrics: SecurityMetric[] = [
    {
      id: 1,
      label: "System Uptime",
      value: "99.98%",
      trend: "stable",
      icon: "ServerIcon",
      status: "healthy"
    },
    {
      id: 2,
      label: "Blocked Threats",
      value: "1,247",
      trend: "down",
      icon: "ShieldExclamationIcon",
      status: "healthy"
    },
    {
      id: 3,
      label: "Active Sessions",
      value: "45,892",
      trend: "up",
      icon: "UsersIcon",
      status: "healthy"
    },
    {
      id: 4,
      label: "Failed Login Attempts",
      value: "23",
      trend: "down",
      icon: "LockClosedIcon",
      status: "healthy"
    },
    {
      id: 5,
      label: "API Response Time",
      value: "127ms",
      trend: "stable",
      icon: "BoltIcon",
      status: "healthy"
    },
    {
      id: 6,
      label: "Data Encryption Rate",
      value: "100%",
      trend: "stable",
      icon: "KeyIcon",
      status: "healthy"
    }
  ];

  const recentSecurityEvents: SecurityEvent[] = [
    {
      id: 1,
      timestamp: "04/01/2026 11:45",
      type: "Suspicious Login Attempt",
      severity: "medium",
      description: "Multiple failed login attempts from unusual location blocked",
      status: "resolved"
    },
    {
      id: 2,
      timestamp: "04/01/2026 10:22",
      type: "DDoS Mitigation",
      severity: "high",
      description: "Automated DDoS attack detected and mitigated successfully",
      status: "resolved"
    },
    {
      id: 3,
      timestamp: "04/01/2026 09:15",
      type: "Unusual Transaction Pattern",
      severity: "low",
      description: "Velocity check triggered for merchant account, under review",
      status: "monitoring"
    },
    {
      id: 4,
      timestamp: "04/01/2026 08:30",
      type: "Security Scan Completed",
      severity: "low",
      description: "Daily vulnerability scan completed with no issues found",
      status: "resolved"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-success bg-success/10';
      case 'warning':
        return 'text-warning bg-warning/10';
      case 'critical':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'text-success bg-success/10';
      case 'medium':
        return 'text-warning bg-warning/10';
      case 'high':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-success bg-success/10';
      case 'investigating':
        return 'text-warning bg-warning/10';
      case 'monitoring':
        return 'text-primary bg-primary/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  if (!isHydrated) {
    return (
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-12">
            <h2 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-4">
              Real-Time Security Monitoring
            </h2>
            <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
              Loading security dashboard...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center mb-12">
          <h2 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-4">
            Real-Time Security Monitoring
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
            24/7 automated monitoring with instant threat detection and response capabilities
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {securityMetrics.map((metric) => (
            <div key={metric.id} className="bg-card rounded-lg shadow-md p-6 border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getStatusColor(metric.status)}`}>
                  <Icon name={metric.icon as any} size={24} variant="outline" />
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(metric.status)}`}>
                  {metric.status.toUpperCase()}
                </div>
              </div>
              
              <h3 className="font-body text-sm text-muted-foreground mb-2">
                {metric.label}
              </h3>
              
              <div className="flex items-end justify-between">
                <span className="font-headline font-bold text-3xl text-foreground">
                  {metric.value}
                </span>
                {metric.trend === 'up' && (
                  <Icon name="ArrowTrendingUpIcon" size={20} variant="outline" className="text-success" />
                )}
                {metric.trend === 'down' && (
                  <Icon name="ArrowTrendingDownIcon" size={20} variant="outline" className="text-success" />
                )}
                {metric.trend === 'stable' && (
                  <Icon name="MinusIcon" size={20} variant="outline" className="text-muted-foreground" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-lg shadow-md border border-border overflow-hidden">
          <div className="px-6 py-4 bg-muted/50 border-b border-border">
            <h3 className="font-headline font-semibold text-xl text-foreground">
              Recent Security Events
            </h3>
          </div>
          
          <div className="divide-y divide-border">
            {recentSecurityEvents.map((event) => (
              <div key={event.id} className="p-6 hover:bg-muted/30 transition-colors duration-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-body font-semibold text-base text-foreground">
                        {event.type}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(event.severity)}`}>
                        {event.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getEventStatusColor(event.status)}`}>
                        {event.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="font-body text-sm text-muted-foreground mb-2">
                      {event.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Icon name="ClockIcon" size={14} variant="outline" />
                      <span>{event.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityMonitoring;