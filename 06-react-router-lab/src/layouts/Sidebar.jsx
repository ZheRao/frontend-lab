// layouts/Sidebar.jsx

import './layouts.css'

function Sidebar({ onNavigate, currentPage, pages, collapsed, onCollapse }) {

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
                    {pages.map((page)=>(
                        <button 
                            key={page.key}
                            type="button"
                            onClick={()=>onNavigate(page.key)} 
                            className={page.key === currentPage ? "page-active" : "regular-page-button"}
                            aria-current={currentPage === page.key ? "page": undefined}
                        >
                            {page.label}
                        </button>
                    ))}
                </nav>
            </div>
            
        </aside>
    )
}

export default Sidebar;