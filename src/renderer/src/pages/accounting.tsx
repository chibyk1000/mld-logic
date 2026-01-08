import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Plus, Download, DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { MetricCard } from '@renderer/components/MetricCard'
import { IncomeRecordForm } from '@renderer/components/IncomeRecordForm'
import { ExpenseRecordForm } from '@renderer/components/ExpenseRecordForm'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import dayjs from 'dayjs'

export default function Accounting() {
  const [incomeRecords, setIncomeRecords] = useState<any[]>([])
  const [expenseRecords, setExpenseRecords] = useState<any[]>([])
  const [incomeFormOpen, setIncomeFormOpen] = useState(false)
  const [incomeSearch, setIncomeSearch] = useState('')

  const [incomePage, setIncomePage] = useState(1)
  const [expensePage, setExpensePage] = useState(1)
  const pageSize = 10 // you can adjust the number of rows per page

  const [expenseFormOpen, setExpenseFormOpen] = useState(false)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const [summary, setSummary] = useState<any>(null)
  const fetchData = async () => {
    try {
      const incomes = await window.api.getIncomeRecords(period)
      const expenses = await window.api.getExpenseRecords(period)
      const summary = await window.api.getAccountingSummary(period)
      setSummary(summary.data)
      setIncomeRecords(incomes.data || [])
      setExpenseRecords(expenses || [])
    } catch (err) {
      console.error('Failed to fetch accounting data:', err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [period])

  const totalIncome = incomeRecords.reduce((sum, record) => sum + record.paymentReceived, 0)
  const totalCharges = incomeRecords.reduce((sum, record) => sum + record.amountCharged, 0)
  const totalExpenses = expenseRecords.reduce((sum, record) => sum + record.amount, 0)
  const profit = totalCharges - totalExpenses
  const totalRemittancePending = incomeRecords
    .filter((record) => record.outstanding)
    .reduce((sum, record) => sum + (Math.abs(record.outstanding) || 0), 0)
  const filteredIncomeRecords = incomeRecords.filter((record) =>
    (record.client || record.vendor)?.toLowerCase().includes(incomeSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Accounting Module</h2>
          <p className="text-muted-foreground mt-1">
            Track income, expenses, and financial performance
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={period}
            onValueChange={(value) => {
              setPeriod(value as any)
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Income"
          value={`₦${totalIncome.toLocaleString()}`}
          icon={TrendingUp}
          variant="success"
        />
        <MetricCard
          title="Total Expenses"
          value={`₦${totalExpenses.toLocaleString()}`}
          icon={TrendingDown}
          variant="destructive"
        />
        <MetricCard
          title="Net Profit"
          value={`₦${profit.toLocaleString()}`}
          icon={DollarSign}
          variant={profit >= 0 ? 'success' : 'destructive'}
        />
        <MetricCard
          title="Remittance Pending"
          value={`₦${totalRemittancePending.toLocaleString()}`}
          icon={Calendar}
          variant="warning"
        />
      </div>

      <Tabs defaultValue="income" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="income">Income Records</TabsTrigger>
          <TabsTrigger value="expenses">Expense Records</TabsTrigger>
          <TabsTrigger value="summary">Financial Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Income Records</CardTitle>
              {/* <Button onClick={() => setIncomeFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Income
              </Button> */}
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by client or vendor..."
                  value={incomeSearch}
                  onChange={(e) => {
                    setIncomeSearch(e.target.value)
                    setIncomePage(1) // reset to first page on search
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    {/* <TableHead>Order ID</TableHead> */}
                    <TableHead>Client</TableHead>
                    <TableHead>Category</TableHead>

                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Service Charge</TableHead>
                    <TableHead className="text-center">Outstanding Payment</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncomeRecords
                    .slice((incomePage - 1) * pageSize, incomePage * pageSize)
                    .map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.client || record.vendor}</TableCell>
                        <TableCell>
                          <Badge
                            variant={record.category.includes('VIP') ? 'default' : 'secondary'}
                          >
                            {record.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {record.paymentReceived ? `₦${record.paymentReceived}` : '-'}
                        </TableCell>
                        <TableCell className="text-center">₦{record.amountCharged}</TableCell>
                        <TableCell className="text-center">
                          {record.vendor && (record.outstanding ? `₦${record.outstanding}` : '-')}
                        </TableCell>
                        <TableCell>{dayjs(record.date).format('YYYY MMMM, DD')}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center mt-2">
                <Button
                  size="sm"
                  disabled={incomePage === 1}
                  onClick={() => setIncomePage((prev) => prev - 1)}
                >
                  Previous
                </Button>
                <span>
                  Page {incomePage} of {Math.ceil(filteredIncomeRecords.length / pageSize)}
                </span>
                <Button
                  size="sm"
                  disabled={incomePage === Math.ceil(filteredIncomeRecords.length / pageSize)}
                  onClick={() => setIncomePage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Expense Records</CardTitle>
              <Button onClick={() => setExpenseFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableBody>
                    {expenseRecords
                      .slice((expensePage - 1) * pageSize, expensePage * pageSize)
                      .map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <Badge variant="outline">{record.type}</Badge>
                          </TableCell>
                          <TableCell>{record.description}</TableCell>
                          <TableCell className="text-right font-medium">₦{record.amount}</TableCell>
                          <TableCell>{dayjs(record.date).format('YYYY MMMM, DD')}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </TableBody>
              </Table>

              <div className="flex justify-between items-center mt-2">
                <Button
                  size="sm"
                  disabled={expensePage === 1}
                  onClick={() => setExpensePage((prev) => prev - 1)}
                >
                  Previous
                </Button>
                <span>
                  Page {expensePage} of {Math.ceil(expenseRecords.length / pageSize)}
                </span>
                <Button
                  size="sm"
                  disabled={expensePage === Math.ceil(expenseRecords.length / pageSize)}
                  onClick={() => setExpensePage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          {summary && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Income Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Income Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">VIP Clients</span>
                    <span className="font-bold text-foreground">
                      ₦{summary.incomeBreakdown.vip.received.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">Regular Clients</span>
                    <span className="font-bold text-foreground">
                      ₦{summary.incomeBreakdown.regular.received.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                    <span className="font-medium text-foreground">Total Income</span>
                    <span className="font-bold text-success">
                      ₦{summary?.incomeBreakdown?.totals.received.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Expense Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(summary.expenseBreakdown.byType).map(([type, amount]) => (
                    <div
                      key={type}
                      className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="text-muted-foreground">{type}</span>
                      <span className="font-bold text-foreground">
                        ₦{(amount as number).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                    <span className="font-medium text-foreground">Total Expenses</span>
                    <span className="font-bold text-destructive">
                      ₦{summary.expenseBreakdown.total.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Profit & Loss */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Profit & Loss Statement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-success/10 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold text-success">
                          ₦{summary?.profitLoss.profit.toLocaleString()}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-success" />
                    </div>
                    <div className="flex justify-between items-center p-4 bg-destructive/10 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Expenses</p>
                        <p className="text-2xl font-bold text-destructive">
                          ₦{summary?.profitLoss.totalExpenses.toLocaleString()}
                        </p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-destructive" />
                    </div>
                    <div
                      className={`flex justify-between items-center p-4 rounded-lg ${
                        summary?.profitLoss.profit >= 0 ? 'bg-primary/10' : 'bg-destructive/10'
                      }`}
                    >
                      <div>
                        <p className="text-sm text-muted-foreground">Net Profit</p>
                        <p
                          className={`text-3xl font-bold ${
                            summary?.profitLoss.profit >= 0 ? 'text-success' : 'text-destructive'
                          }`}
                        >
                          ₦
                          {Math.abs(
                            summary?.profitLoss.profit + summary?.profitLoss.outstanding
                          ).toLocaleString()}
                        </p>
                      </div>
                      <DollarSign
                        className={`h-8 w-8 ${
                          summary?.profitLoss.profit >= 0 ? 'text-success' : 'text-destructive'
                        }`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <IncomeRecordForm open={incomeFormOpen} onOpenChange={setIncomeFormOpen} />
      <ExpenseRecordForm
        open={expenseFormOpen}
        onOpenChange={setExpenseFormOpen}
        onSuccess={() => {
          fetchData()
        }}
      />
    </div>
  )
}
