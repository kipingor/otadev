import { Head, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Calendar,
  Users,
  DollarSign,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  X,
  Filter,
} from 'lucide-react';
import {
  type ProjectWithProgress,
  type ProjectsIndexProps,
  type ProjectStatus,
  PROJECT_STATUS_CONFIG,
  type ProjectViewMode,
} from '@/types/project.types';

export default function ProjectsIndex({
  projects,
  filters,
  statistics,
}: ProjectsIndexProps) {
  const [viewMode, setViewMode] = useState<ProjectViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'all'>(
    filters.status || 'all'
  );

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    router.get(
      '/projects',
      { ...filters, search: value || undefined },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleStatusFilter = (status: ProjectStatus | 'all') => {
    setSelectedStatus(status);
    router.get(
      '/projects',
      { ...filters, status: status === 'all' ? undefined : status },
      { preserveState: true, preserveScroll: true }
    );
  };

  return (
    <>
      <Head title="Projects" />

      <AppLayout>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage and track all your projects
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => router.visit('/projects/archived')}>
                    Archived
                  </Button>
                  <Button onClick={() => router.visit('/projects/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-5 gap-4 mb-6">
                <Card className="p-4">
                  <div className="text-sm text-gray-600">Total Projects</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {statistics.total}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    Active
                  </div>
                  <div className="text-2xl font-bold text-green-600 mt-1">
                    {statistics.by_status.active}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <Pause className="h-3 w-3" />
                    On Hold
                  </div>
                  <div className="text-2xl font-bold text-yellow-600 mt-1">
                    {statistics.by_status.on_hold}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                  </div>
                  <div className="text-2xl font-bold text-gray-600 mt-1">
                    {statistics.by_status.completed}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Overdue
                  </div>
                  <div className="text-2xl font-bold text-red-600 mt-1">
                    {statistics.overdue}
                  </div>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex items-center justify-between gap-4">
                {/* Status Tabs */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStatusFilter('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      selectedStatus === 'all'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All Projects
                  </button>
                  <button
                    onClick={() => handleStatusFilter('active')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      selectedStatus === 'active'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => handleStatusFilter('planning')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      selectedStatus === 'planning'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Planning
                  </button>
                  <button
                    onClick={() => handleStatusFilter('on_hold')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      selectedStatus === 'on_hold'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    On Hold
                  </button>
                  <button
                    onClick={() => handleStatusFilter('completed')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      selectedStatus === 'completed'
                        ? 'bg-gray-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Completed
                  </button>
                </div>

                {/* Search and View Mode */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-white rounded-lg border p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${
                        viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${
                        viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <ListIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="p-6">
            {projects.data.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <LayoutGrid className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No projects found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Get started by creating your first project
                  </p>
                  <Button onClick={() => router.visit('/projects/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </div>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.data.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {projects.data.map((project) => (
                  <ProjectListItem key={project.id} project={project} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {projects.last_page > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {Array.from({ length: projects.last_page }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() =>
                        router.get('/projects', { ...filters, page })
                      }
                      className={`px-4 py-2 text-sm font-medium rounded-lg ${
                        page === projects.current_page
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}

function ProjectCard({ project }: { project: ProjectWithProgress }) {
  const statusConfig = PROJECT_STATUS_CONFIG[project.status];

  return (
    <Card className="hover:shadow-lg transition-all group cursor-pointer">
      <Link href={`/projects/${project.id}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {project.description || 'No description'}
              </p>
            </div>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor}`}>
              {statusConfig.label}
            </Badge>
            {project.overdue && (
              <Badge className="ml-2 bg-red-100 text-red-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">
                {project.progress?.overall || 0}%
              </span>
            </div>
            <Progress value={project.progress?.overall || 0} className="h-2" />
          </div>

          {/* Tasks */}
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {project.completedTasksCount || 0}/{project.tasksCount || 0} tasks
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {/* Team Avatars */}
            <div className="flex -space-x-2">
              {project.teamMembers?.slice(0, 3).map((member) => (
                <Avatar key={member.id} className="h-6 w-6 border-2 border-white">
                  <AvatarImage src={member.user.avatar} />
                  <AvatarFallback className="text-xs">
                    {member.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {(project.teamMembersCount || 0) > 3 && (
                <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-gray-600">
                    +{(project.teamMembersCount || 0) - 3}
                  </span>
                </div>
              )}
            </div>

            {/* Dates */}
            {project.end_date && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {new Date(project.end_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}

function ProjectListItem({ project }: { project: ProjectWithProgress }) {
  const statusConfig = PROJECT_STATUS_CONFIG[project.status];

  return (
    <Card className="hover:shadow-md transition-all">
      <Link href={`/projects/${project.id}`}>
        <div className="p-4 flex items-center gap-4">
          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900">{project.name}</h3>
              <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor}`}>
                {statusConfig.label}
              </Badge>
              {project.overdue && (
                <Badge className="bg-red-100 text-red-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-1">
              {project.description || 'No description'}
            </p>
          </div>

          {/* Progress */}
          <div className="w-48">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{project.progress?.overall || 0}%</span>
            </div>
            <Progress value={project.progress?.overall || 0} className="h-2" />
          </div>

          {/* Tasks */}
          <div className="w-32 text-sm text-gray-600">
            {project.completedTasksCount || 0}/{project.tasksCount || 0} tasks
          </div>

          {/* Team */}
          <div className="w-32 flex -space-x-2">
            {project.teamMembers?.slice(0, 5).map((member) => (
              <Avatar key={member.id} className="h-6 w-6 border-2 border-white">
                <AvatarImage src={member.user.avatar} />
                <AvatarFallback className="text-xs">
                  {member.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>

          {/* Date */}
          <div className="w-24 text-sm text-gray-600 flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {project.end_date
              ? new Date(project.end_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'No due date'}
          </div>
        </div>
      </Link>
    </Card>
  );
}