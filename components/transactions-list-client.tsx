"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Receipt, Search, Wallet, CreditCard, User, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ITEMS_PER_PAGE = 25

interface Transaction {
  id: number
  user_id: number
  plan_id: number | null
  amount: number
  voucher_code: string | null
  status: string
  reason: string | null
  created_at: string
  users: {
    id: number
    username: string
  } | null
  plans: {
    id: number
    name: string
  } | null
}

export function TransactionsClient() {
  const [initialLoading, setInitialLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchUserId, setSearchUserId] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchTransactions = async (page: number, isInitial: boolean = false, userId?: string, status?: string) => {
    try {
      if (isInitial) {
        setInitialLoading(true)
      } else {
        setTableLoading(true)
      }
      const offset = (page - 1) * ITEMS_PER_PAGE
      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: offset.toString(),
      })
      
      const searchValue = userId !== undefined ? userId : searchUserId
      const statusValue = status !== undefined ? status : statusFilter
      
      if (searchValue) {
        params.append('userId', searchValue)
      }
      
      if (statusValue && statusValue !== 'all') {
        params.append('status', statusValue)
      }
      
      const response = await fetch(`/api/admin/transactions?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
    } finally {
      if (isInitial) {
        setInitialLoading(false)
      } else {
        setTableLoading(false)
      }
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchTransactions(1, false, searchUserId, statusFilter)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchUserId, statusFilter])

  useEffect(() => {
    if (!initialLoading) {
      fetchTransactions(currentPage, false, searchUserId, statusFilter)
    }
  }, [currentPage])

  useEffect(() => {
    fetchTransactions(1, true)
  }, [])

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getTransactionType = (transaction: Transaction) => {
    if (transaction.plan_id === null && transaction.reason && transaction.reason.includes("Added to balance")) {
      return { type: "Balance Topup", icon: Wallet, color: "bg-blue-500/10 text-blue-500" }
    } else if (transaction.plan_id !== null && transaction.plans) {
      return { type: `Buy Plan: ${transaction.plans.name}`, icon: CreditCard, color: "bg-green-500/10 text-green-500" }
    } else if (transaction.reason && transaction.reason.includes("Purchased using balance")) {
      return { type: "Buy Plan (Balance)", icon: Wallet, color: "bg-purple-500/10 text-purple-500" }
    } else {
      return { type: "Payment", icon: Receipt, color: "bg-gray-500/10 text-gray-500" }
    }
  }

  // Note: Stats are calculated from current page only for performance
  const calculateStats = () => {
    const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
    const successCount = transactions.filter((t) => t.status === "SUCCESS").length
    const failedCount = transactions.filter((t) => t.status === "FAILED").length
    const topupAmount = transactions
      .filter((t) => t.plan_id === null && t.reason && t.reason.includes("Added to balance"))
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    const purchaseAmount = transactions
      .filter((t) => t.plan_id !== null)
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    return {
      totalAmount,
      successCount,
      failedCount,
      topupAmount,
      purchaseAmount,
    }
  }

  const stats = calculateStats()

  if (initialLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Transaction Logs</h1>
        <p className="text-muted-foreground">
          View all payment transactions and balance usage logs
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{stats.totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Topup Amount</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{stats.topupAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{stats.purchaseAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {total > 0 ? ((stats.successCount / total) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Search & Filters
          </CardTitle>
          <CardDescription>Search by user ID or username and filter by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">User ID or Username</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by user ID or username..."
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Showing {transactions.length} of {total} transactions (Page {currentPage} of {totalPages || 1})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Voucher Code</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}>
                        <div className="flex items-center space-x-4 py-4">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-36" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => {
                    const transactionInfo = getTransactionType(transaction)
                    const Icon = transactionInfo.icon

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-xs">
                          #{transaction.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {transaction.users?.username || `User #${transaction.user_id}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID: {transaction.user_id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={transactionInfo.color}>
                            <Icon className="h-3 w-3 mr-1" />
                            {transactionInfo.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ฿{transaction.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {transaction.plans ? (
                            <span className="font-medium">{transaction.plans.name}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={transaction.status === "SUCCESS" ? "default" : "destructive"}
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {transaction.reason ? (
                            <span className="text-sm text-muted-foreground truncate block">
                              {transaction.reason}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {transaction.voucher_code ? (
                            <a
                              href={`https://gift.truemoney.com/campaign/?v=${transaction.voucher_code}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline cursor-pointer"
                            >
                              {transaction.voucher_code.substring(0, 12)}...
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

