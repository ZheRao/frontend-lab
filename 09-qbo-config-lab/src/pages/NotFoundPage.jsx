import { Link, useLocation } from 'react-router'
import { navItems } from '../app/navigation'
import NotFoundIllustration from './NotFoundIllustration'
import './NotFoundPage.css'

function NotFoundPage() {
    const location = useLocation()
    const otherPages = navItems.filter((item) => item.homeCard !== null)

    return (
        <section className="page not-found">
            <div className="not-found-message">
                <p className="not-found-code" aria-hidden="true">404</p>
                <h1 className="not-found-title">This page drifted out of orbit</h1>
                <p className="not-found-text">
                    There's no page at{" "}
                    <code className="not-found-path">{location.pathname}</code>.
                    Even our forecasts didn't see this one coming.
                </p>
            </div>

            <NotFoundIllustration />

            <Link to="/" className="btn btn-primary">
                Go to Home
            </Link>

            <nav className="not-found-links" aria-label="Other pages">
                <p className="not-found-links-label">Or jump to</p>

                <div className="not-found-links-list">
                    {otherPages.map((item) => (
                        <Link key={item.path} to={item.path} className="btn">
                            <item.icon className="icon" aria-hidden="true" />
                            {item.homeCard.title}
                        </Link>
                    ))}
                </div>
            </nav>
        </section>
    )
}

export default NotFoundPage;