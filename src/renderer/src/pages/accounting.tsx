import { useState } from 'react'
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

const incomeRecords = [
  {
    id: 1,
    orderId: 'ORD-001',
    client: 'TechStore Inc',
    category: 'VIP Client',
    amount: 450,
    paymentReceived: 500,
    serviceCost: 50,
    remittanceDue: 450,
    date: '2024-01-15'
  },
  {
    id: 2,
    orderId: 'ORD-002',
    client: 'John Doe',
    category: 'Pick & Drop',
    amount: 25,
    serviceCost: 25,
    date: '2024-01-16'
  },
  {
    id: 3,
    orderId: 'ORD-003',
    client: 'Fashion Hub',
    category: 'VIP Client',
    amount: 320,
    paymentReceived: 380,
    serviceCost: 60,
    remittanceDue: 320,
    date: '2024-01-16'
  }
]

const expenseRecords = [
  {
    id: 1,
    type: 'Fuel',
    description: 'Vehicle fuel for deliveries',
    amount: 150,
    date: '2024-01-15'
  },
  {
    id: 2,
    type: 'Maintenance',
    description: 'Vehicle servicing and repairs',
    amount: 280,
    date: '2024-01-14'
  },
  {
    id: 3,
    type: 'Salaries',
    description: 'Driver monthly salary',
    amount: 1200,
    date: '2024-01-10'
  }
]

export default function Accounting() {
  const [incomeFormOpen, setIncomeFormOpen] = useState(false)
  const [expenseFormOpen, setExpenseFormOpen] = useState(false)
  const [period, setPeriod] = useState('monthly')

  const totalIncome = incomeRecords.reduce((sum, record) => sum + record.amount, 0)
  const totalExpenses = expenseRecords.reduce((sum, record) => sum + record.amount, 0)
  const profit = totalIncome - totalExpenses
  const totalRemittancePending = incomeRecords
    .filter((record) => record.remittanceDue)
    //   @ts-ignore
    .reduce((sum, record) => sum + record?.remittanceDue, 0)

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
          <Select value={period} onValueChange={setPeriod}>
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
          value={`$${totalIncome.toLocaleString()}`}
          icon={TrendingUp}
          variant="success"
        />
        <MetricCard
          title="Total Expenses"
          value={`$${totalExpenses.toLocaleString()}`}
          icon={TrendingDown}
          variant="destructive"
        />
        <MetricCard
          title="Net Profit"
          value={`$${profit.toLocaleString()}`}
          icon={DollarSign}
          variant={profit >= 0 ? 'success' : 'destructive'}
        />
        <MetricCard
          title="Remittance Pending"
          value={`$${totalRemittancePending.toLocaleString()}`}
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
              <Button onClick={() => setIncomeFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Income
              </Button>
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
                      <TableCell className="text-right font-medium">${record.amount}</TableCell>
                      <TableCell className="text-right">
                        {record.paymentReceived ? `$${record.paymentReceived}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">${record.serviceCost}</TableCell>
                      <TableCell className="text-right">
                        {record.remittanceDue ? `$${record.remittanceDue}` : '-'}
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
                      <TableCell className="text-right font-medium">${record.amount}</TableCell>
                      <TableCell>{record.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Income Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">VIP Clients</span>
                  <span className="font-bold text-foreground">$770</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Regular Clients</span>
                  <span className="font-bold text-foreground">$25</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <span className="font-medium text-foreground">Total Income</span>
                  <span className="font-bold text-success">${totalIncome}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Fuel</span>
                  <span className="font-bold text-foreground">$150</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Maintenance</span>
                  <span className="font-bold text-foreground">$280</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Salaries</span>
                  <span className="font-bold text-foreground">$1,200</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <span className="font-medium text-foreground">Total Expenses</span>
                  <span className="font-bold text-destructive">${totalExpenses}</span>
                </div>
              </CardContent>
            </Card>

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
                        ${totalIncome.toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-success" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-destructive/10 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                      <p className="text-2xl font-bold text-destructive">
                        ${totalExpenses.toLocaleString()}
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-destructive" />
                  </div>
                  <div
                    className={`flex justify-between items-center p-4 rounded-lg ${
                      profit >= 0 ? 'bg-primary/10' : 'bg-destructive/10'
                    }`}
                  >
                    <div>
                      <p className="text-sm text-muted-foreground">Net Profit</p>
                      <p
                        className={`text-3xl font-bold ${
                          profit >= 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        ${Math.abs(profit).toLocaleString()}
                      </p>
                    </div>
                    <DollarSign
                      className={`h-8 w-8 ${profit >= 0 ? 'text-success' : 'text-destructive'}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <IncomeRecordForm open={incomeFormOpen} onOpenChange={setIncomeFormOpen} />
      <ExpenseRecordForm open={expenseFormOpen} onOpenChange={setExpenseFormOpen} />
    </div>
  )
}
