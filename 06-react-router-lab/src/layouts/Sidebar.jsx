// layouts/Sidebar.jsx

import { NavLink } from 'react-router'
import './layouts.css'
import { navItems } from '../app/navigation';

function Sidebar({ collapsed, onCollapse }) {

    return (
        <aside
            id="app-sidebar" 
            className={`sidebar ${collapsed ? "collapsed" : ""}`}
        >
            <div className="sidebar-inner">
                <div className="sidebar-header">
                    <h2>GrowLytics Management Portal</h2>

                    <button 
                        type="button"
                        className="sidebar-collapse-button"
                        onClick={onCollapse}
                        aria-label="Collapse sidebar"
                        aria-expanded={true}
                        aria-controls="app-sidebar"
                    >
                        «
                    </button>
                </div>
            
                <nav>
                    {navItems.map((page)=>(
                        <NavLink 
                            key={page.path}
                            to={page.path}
                            end={page.path === "/"}
                            className={({ isActive }) => isActive ? "page-active" : "regular-page-button"}
                        >
                            {page.label}
                        </NavLink>
                    ))}
                </nav>
            </div>
            
        </aside>
    )
}

export default Sidebar;