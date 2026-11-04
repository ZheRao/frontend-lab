// pages/HomePage.jsx

import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { navItems } from '../app/navigation';
import './HomePage.css'

function HomePage() {
    const cardItems = navItems.filter((page)=>page.homeCard !== null)
    return (
        <section className="page">
            <header className="home-header">
                <h1 className="home-title">Welcome</h1>
                <p className="home-lead">
                    Manage clients and configure inputs for the forecast system.
                </p>
            </header>

            <div className="home-cards">
                {cardItems.map((page)=>(
                    <Link key={page.path} to={page.path} className="home-card">
                        <span className="home-card-icon">
                            <page.icon className="icon" aria-hidden="true" />
                        </span>

                        <div className="home-card-text">
                            <h2 className="home-card-title">{page.homeCard.title}</h2>
                            <p className="home-card-description">{page.homeCard.description}</p>
                        </div>

                        <ArrowRight className="icon home-card-arrow" aria-hidden="true" />
                    </Link>
                ))}
            </div>
        </section>
    )
}

export default HomePage;