import { Route, Routes } from 'react-router-dom'
import Login from './pages/login'
import Dashboard from './pages/dashboard'
import AppLayout from './layouts/app-layout'
import WarehousePage from './pages/warehouses'
import AgentList from './pages/agents/agents'
import VIPClients from './pages/clients/vip'
import RegularClients from './pages/clients/regular'
import Inventory from './pages/inventory/Inventory'
import Remittance from './pages/remittance'
import Accounting from './pages/accounting'
import { ToastContainer } from 'react-toastify'
import { SettingsPage } from './pages/settings'
import { OrdersList } from './pages/orders'
import VendorSummary from './pages/clients/vendorSummary'
const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/" element={<AppLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="warehouses" element={<WarehousePage />} />
          <Route path="vendor/:id" element={<VendorSummary />} />
          <Route path="agents" element={<AgentList />} />
          <Route path="/vip-clients" element={<VIPClients />} />
          <Route path="/regular-clients" element={<RegularClients />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/remittance" element={<Remittance />} />
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/orders" element={<OrdersList />} />
        </Route>
      </Routes>
      <ToastContainer />
    </div>
  )
}

export default App
