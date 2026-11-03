// App.jsx

import { useState } from 'react'
import AppLayout from "./layouts/AppLayout"
import ClientPage from './pages/ClientPage'
import HomePage from "./pages/HomePage"
import DefaultPage from "./pages/DefaultPage"
import CropPlanPage from './pages/CropPlanPage'

const pages = [
  { key: "home", label: "Home", component: HomePage },
  { key: "client", label: "Client Management", component: ClientPage },
  { key: "crop-plan", label: "Crop Plan Configuration", component: CropPlanPage },
  
]

function App(){
  const [currentPage, setCurrentPage] = useState("home")
  const match = pages.find((page)=>page.key===currentPage)
  const SelectedPage = match ? match.component : DefaultPage

  return (
    <AppLayout 
      onNavigate={setCurrentPage} 
      currentPage={currentPage} 
      pages={pages}
    >
      <SelectedPage />
    </AppLayout>
  )
}

export default App;