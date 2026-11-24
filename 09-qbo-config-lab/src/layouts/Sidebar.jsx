// layouts/Sidebar.jsx

import { NavLink } from 'react-router'
import { PanelLeftClose, ChartNoAxesCombined, Waypoints, Atom } from 'lucide-react'
import { navItems } from '../app/navigation';


function Sidebar({ collapsed, onCollapse }) {

    return (
        <aside
            id="app-sidebar" 
            className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}
        >
            <div className="sidebar-inner">
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <span className="sidebar-brand-mark">
                            <Atom className="icon" aria-hidden="true" />
                        </span>

                        <div className="sidebar-brand-text">
                            <p className="sidebar-brand-name">GrowLytics</p>
                            <p className="sidebar-brand-tagline">Management Portal</p>
                        </div>
                    </div>

                    <button 
                        type="button"
                        className="sidebar-icon-button"
                        onClick={onCollapse}
                        aria-label="Collapse sidebar"
                        aria-expanded={true}
                        aria-controls="app-sidebar"
                    >
                        <PanelLeftClose className="icon" aria-hidden="true" />
                    </button>
                </div>

                <div className="sidebar-section">
                    <p className="sidebar-section-label">Configuration</p>

                    <nav className="sidebar-nav">
                        {navItems.map((page)=>(
                            <NavLink 
                                key={page.path}
                                to={page.path}
                                end={page.path === "/"}
                                className={({ isActive }) => isActive ? "sidebar-link sidebar-link--active" : "sidebar-link"}
                            >
                                <page.icon className="icon" aria-hidden="true" />
                                <span>{page.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>
            
                <p className="sidebar-footer">Powered by GrowLytics Inc.</p>
            </div>
            
        </aside>
    )
}

export default Sidebar;