// App.jsx

import { Routes, Route } from 'react-router'
import AppLayout from "./layouts/AppLayout"
import ClientPage from './pages/ClientPage'
import HomePage from "./pages/HomePage"
import DefaultPage from "./pages/DefaultPage"
import CropPlanPage from './pages/CropPlanPage'

const pages = [
  { key: "home", label: "Home", path: "/" },
  { key: "client", label: "Client Management", path: "/clients" },
  { key: "crop-plan", label: "Crop Plan Configuration", path: "/crop-plans" },
  
]

function App(){

  return (
    <Routes>
      <Route element={<AppLayout pages={pages} />}>
        <Route index element={<HomePage />} />
        <Route path="clients" element={<ClientPage />} />
        <Route path="crop-plans" element={<CropPlanPage />} />
        <Route path="*" element={<DefaultPage />} />
      </Route>
    </Routes>
  )
}

export default App;