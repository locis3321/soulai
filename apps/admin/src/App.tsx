import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminApp from './admin/AdminApp'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  )
}
