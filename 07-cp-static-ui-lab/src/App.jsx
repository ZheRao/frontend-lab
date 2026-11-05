// App.jsx

import { Routes, Route } from 'react-router'
import AppLayout from "./layouts/AppLayout"
import ClientPage from './pages/ClientPage'
import HomePage from "./pages/HomePage"
import NotFoundPage from './pages/NotFoundPage'
import CropPlanOverview from './pages/CropPlanOverview'
import CropPlanEditor from './pages/CropPlanEditor'

function App(){

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="clients" element={<ClientPage />} />
        <Route path="crop-plans">
          <Route index element={<CropPlanOverview />} />
          <Route path=":cropId" element={<CropPlanEditor />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App;