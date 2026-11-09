// App.jsx

import { Routes, Route } from 'react-router'
import AppLayout from "./layouts/AppLayout"
import ClientPage from './pages/ClientPage'
import HomePage from "./pages/HomePage"
import NotFoundPage from './pages/NotFoundPage'
import CropPlanOverview from './pages/CropPlanOverview'

function App(){

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="clients" element={<ClientPage />} />
        <Route path="crop-plans" element={<CropPlanOverview />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App;