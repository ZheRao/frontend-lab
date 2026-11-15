// layouts/AppLayout.jsx

import { useState } from 'react'
import { Outlet } from 'react-router'
import {PanelLeftOpen } from 'lucide-react'
import './layouts.css'
import Sidebar from "./Sidebar"

function AppLayout() {
    const [collapsed, setCollapsed] = useState(false)
    return (
        <div className="app-layout">
            <Sidebar
                collapsed={collapsed}
                onCollapse={()=>setCollapsed(true)}
            />

            <main className="app-content">
                {collapsed && (
                    <button 
                        type="button"
                        className="sidebar-icon-button sidebar-expand-button"
                        onClick={()=>setCollapsed(false)}
                        aria-label="Expand sidebar"
                        aria-expanded={false}
                        aria-controls="app-sidebar"
                    >
                        <PanelLeftOpen className="icon" aria-hidden="true" />
                    </button>
                )}

                <Outlet />
            </main>
        </div>
    )
}

export default AppLayout;