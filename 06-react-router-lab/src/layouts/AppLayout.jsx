// layouts/AppLayout.jsx

import { useState } from 'react'
import './layouts.css'
import Sidebar from "./Sidebar";

function AppLayout({ children, onNavigate, currentPage, pages }) {
    const [collapsed, setCollapsed] = useState(false)
    return (
        <div className="app-layout">
            <Sidebar 
                onNavigate={onNavigate} 
                currentPage={currentPage} 
                pages={pages}
                collapsed={collapsed}
                onCollapse={()=>setCollapsed(true)}
            />

            <main className="app-content">
                {collapsed && (
                    <button 
                        type="button"
                        className="sidebar-expand-button"
                        onClick={()=>setCollapsed(false)}
                        aria-label="Expand sidebar"
                        aria-expanded={false}
                        aria-controls="app-sidebar"
                    >
                        »
                    </button>
                )}

                {children}
            </main>
        </div>
    )
}

export default AppLayout;