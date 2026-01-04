"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Loader2, Eye } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAlert } from "@/lib/use-alert"

interface ExternalApiLog {
  id: number
  attack_id: number | null
  user_id: number | null
  api_url: string
  request_method: string
  request_headers: any
  response_status: number | null
  response_body: any
  response_headers: any
  duration_ms: number | null
  error_message: string | null
  created_at: string
  attacks?: {
    id: number
    host: string
    port: number
    method: string
  }
  users?: {
    username: string
  }
}

const ITEMS_PER_PAGE = 25

export default function ExternalApiLogsClient() {
  const { showAlert, AlertComponent } = useAlert()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [logs, setLogs] = useState<ExternalApiLog[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<ExternalApiLog | null>(null)
  const [filters, setFilters] = useState({
    attack_id: "",
    user_id: "",
  })

  useEffect(() => {
    fetchLogs()
  }, [currentPage, filters])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE
      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: offset.toString(),
      })

      if (filters.attack_id) params.append('attack_id', filters.attack_id)
      if (filters.user_id) params.append('user_id', filters.user_id)

      const response = await fetch(`/api/admin/external-api-logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error("Failed to fetch external API logs:", error)
      await showAlert("Failed to fetch external API logs", "Error")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchLogs()
    setRefreshing(false)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getStatusColor = (status: number | null) => {
    if (!status) return "secondary"
    if (status >= 200 && status < 300) return "default"
    if (status >= 400 && status < 500) return "destructive"
    if (status >= 500) return "destructive"
    return "secondary"
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return "-"
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <main className="container mx-auto px-4 py-4 lg:py-8">
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">External API Logs</h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            Monitor external attack API requests and responses
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter external API logs by attack ID or user ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="attack_id">Attack ID</Label>
              <Input
                id="attack_id"
                type="number"
                placeholder="Attack ID"
                value={filters.attack_id}
                onChange={(e) => {
                  setFilters({ ...filters, attack_id: e.target.value })
                  setCurrentPage(1)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user_id">User ID</Label>
              <Input
                id="user_id"
                type="number"
                placeholder="User ID"
                value={filters.user_id}
                onChange={(e) => {
                  setFilters({ ...filters, user_id: e.target.value })
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>External API Request Logs</CardTitle>
          <CardDescription>
            Total: {total} logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No external API logs found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Attack</TableHead>
                      <TableHead>API URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {log.users?.username || `ID: ${log.user_id || 'N/A'}`}
                        </TableCell>
                        <TableCell>
                          {log.attacks ? (
                            <div className="text-sm">
                              <div>{log.attacks.host}:{log.attacks.port}</div>
                              <div className="text-xs text-muted-foreground">{log.attacks.method}</div>
                            </div>
                          ) : (
                            `ID: ${log.attack_id || 'N/A'}`
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">
                          {log.api_url}
                        </TableCell>
                        <TableCell>
                          {log.error_message ? (
                            <Badge variant="destructive">Error</Badge>
                          ) : (
                            <Badge variant={getStatusColor(log.response_status)}>
                              {log.response_status || 'N/A'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDuration(log.duration_ms)}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-destructive">
                          {log.error_message || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedLog(log)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>External API Log Details</DialogTitle>
            <DialogDescription>
              Request and response details for external attack API
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Request</h3>
                <div className="bg-muted p-4 rounded-md">
                  <div className="text-sm mb-2">
                    <strong>Method:</strong> {selectedLog.request_method}
                  </div>
                  <div className="text-sm mb-2 break-all">
                    <strong>URL:</strong> {selectedLog.api_url}
                  </div>
                  {selectedLog.request_headers && (
                    <div className="mt-2">
                      <div className="text-sm font-semibold mb-1">Headers:</div>
                      <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                        {JSON.stringify(selectedLog.request_headers, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Response</h3>
                <div className="bg-muted p-4 rounded-md">
                  <div className="text-sm mb-2 flex items-center gap-2">
                    <strong>Status:</strong>
                    {selectedLog.error_message ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : (
                      <Badge variant={getStatusColor(selectedLog.response_status)}>
                        {selectedLog.response_status || 'N/A'}
                      </Badge>
                    )}
                  </div>
                  {selectedLog.error_message && (
                    <div className="text-sm mb-2 text-destructive">
                      <strong>Error:</strong> {selectedLog.error_message}
                    </div>
                  )}
                  {selectedLog.response_body && (
                    <div className="mt-2">
                      <div className="text-sm font-semibold mb-1">Body:</div>
                      <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                        {JSON.stringify(selectedLog.response_body, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.response_headers && (
                    <div className="mt-2">
                      <div className="text-sm font-semibold mb-1">Response Headers:</div>
                      <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                        {JSON.stringify(selectedLog.response_headers, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Metadata</h3>
                <div className="bg-muted p-4 rounded-md text-sm space-y-1">
                  <div><strong>Duration:</strong> {formatDuration(selectedLog.duration_ms)}</div>
                  <div><strong>Timestamp:</strong> {new Date(selectedLog.created_at).toLocaleString()}</div>
                  {selectedLog.attacks && (
                    <>
                      <div><strong>Attack:</strong> {selectedLog.attacks.host}:{selectedLog.attacks.port} ({selectedLog.attacks.method})</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertComponent />
    </main>
  )
}

