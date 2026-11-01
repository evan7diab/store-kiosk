import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import AdminLayout from "./admin/AdminLayout"
import BottlesPage from "./admin/BottlesPage"
import CashiersPage from "./admin/CashiersPage"
import ComposerPage from "./admin/ComposerPage"
import CustomerPage from "./admin/CustomerPage"
import GuestsPage from "./admin/GuestsPage"
import GroupsPage from "./admin/GroupsPage"
import MessagesPage from "./admin/MessagesPage"
import OverviewPage from "./admin/OverviewPage"
import SettingsPage from "./admin/SettingsPage"
import Kiosk from "./kiosk/Kiosk"
import Home from "./pages/Home"
import { StoreProvider } from "./store"

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/kiosk" element={<Kiosk />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="customers" element={<GuestsPage />} />
            <Route path="customers/:id" element={<CustomerPage />} />
            <Route path="segments" element={<GroupsPage />} />
            <Route path="segments/:spiritId" element={<GroupsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="messages/new" element={<ComposerPage />} />
            <Route path="catalog" element={<BottlesPage />} />
            <Route path="staff" element={<CashiersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
