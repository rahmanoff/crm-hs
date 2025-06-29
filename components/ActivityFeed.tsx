import React from 'react';
import { format } from 'date-fns';
import { 
  User, 
  Building2, 
  DollarSign, 
  CheckSquare,
  Clock
} from 'lucide-react';

interface Activity {
  type: 'contact' | 'company' | 'deal' | 'task';
  id: string;
  title: string;
  date: string;
  description: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  title?: string;
}

export default function ActivityFeed({ activities, title = 'Recent Activity' }: ActivityFeedProps) {
  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'contact':
        return <User className="w-4 h-4" />;
      case 'company':
        return <Building2 className="w-4 h-4" />;
      case 'deal':
        return <DollarSign className="w-4 h-4" />;
      case 'task':
        return <CheckSquare className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'contact':
        return 'bg-blue-100 text-blue-600';
      case 'company':
        return 'bg-green-100 text-green-600';
      case 'deal':
        return 'bg-purple-100 text-purple-600';
      case 'task':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else if (diffInHours < 168) { // 7 days
        return `${Math.floor(diffInHours / 24)}d ago`;
      } else {
        return format(date, 'MMM dd');
      }
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div key={`${activity.type}-${activity.id}-${index}`} className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(activity.type)}`}>
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatDate(activity.date)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 