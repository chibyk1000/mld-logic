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


export default function Accounting() {
  const [incomeRecords, setIncomeRecords] = useState<any[]>([])
  const [expenseRecords, setExpenseRecords] = useState<any[]>([])
  const [incomeFormOpen, setIncomeFormOpen] = useState(false)
  const [expenseFormOpen, setExpenseFormOpen] = useState(false)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
const [summary, setSummary] = useState<any>(null)
  const fetchData = async () => {
    try {
      const incomes = await window.api.getIncomeRecords(period)
      const expenses = await window.api.getExpenseRecords(period)
      const summary = await window.api.getAccountingSummary(period)
      setSummary(summary.data)
      console.log(expenses);
      
    
      setIncomeRecords(incomes.data || [])
      setExpenseRecords(expenses || [])
    } catch (err) {
      console.error('Failed to fetch accounting data:', err)
    }
  }

  console.log(summary);
  
  useEffect(() => {
    fetchData()
  }, [period])

  const totalIncome = incomeRecords.reduce((sum, record) => sum + record.amount, 0)
  const totalExpenses = expenseRecords.reduce((sum, record) => sum + record.amount, 0)
  const profit = totalIncome - totalExpenses
  const totalRemittancePending = incomeRecords
    .filter((record) => record.remittanceDue)
    .reduce((sum, record) => sum + (record.remittanceDue || 0), 0)

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
          <Select value={period} onValueChange={(value) => {
            setPeriod(value as any)
          }}>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Payment Received</TableHead>
                    <TableHead className="text-right">Service Cost</TableHead>
                    <TableHead className="text-right">Remittance Due</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.orderId}</TableCell>
                      <TableCell>{record.client}</TableCell>
                      <TableCell>
                        <Badge variant={record.category.includes('VIP') ? 'default' : 'secondary'}>
                          {record.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">₦{record.amount}</TableCell>
                      <TableCell className="text-right">
                        {record.paymentReceived ? `₦${record.paymentReceived}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">₦{record.serviceCost}</TableCell>
                      <TableCell className="text-right">
                        {record.remittanceDue ? `₦${record.remittanceDue}` : '-'}
                      </TableCell>
                      <TableCell>{record.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  {expenseRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Badge variant="outline">{record.type}</Badge>
                      </TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell className="text-right font-medium">₦{record.amount}</TableCell>
                      <TableCell>{record.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                      ₦{summary.incomeBreakdown.vip.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">Regular Clients</span>
                    <span className="font-bold text-foreground">
                      ₦{summary.incomeBreakdown.regular.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                    <span className="font-medium text-foreground">Total Income</span>
                    <span className="font-bold text-success">
                      ₦{summary.incomeBreakdown.total.toLocaleString()}
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
                          ₦{summary?.profitLoss.totalIncome.toLocaleString()}
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
                          ₦{Math.abs(summary?.profitLoss.profit).toLocaleString()}
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
      <ExpenseRecordForm open={expenseFormOpen} onOpenChange={setExpenseFormOpen} onSuccess={() => {
        fetchData()
      }} />
    </div>
  )
}
