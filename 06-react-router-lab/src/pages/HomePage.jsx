// pages/HomePage.jsx

import { Link } from 'react-router'
import { navItems } from '../app/navigation';

function HomePage() {
    const cardItems = navItems.filter((page)=>page.homeCard !== null)
    return (
        <section>
            <h1>Welcome</h1>
            <p>Forecast Platform Configuration</p>
            <p>Manage clients and configure inputs for the forecast system.</p>

            <div className="home-cards">
                {cardItems.map((page)=>(
                    <Link key={page.path} to={page.path} className="home-card">
                        <h2>{page.homeCard.title}</h2>
                        <p>{page.homeCard.description}</p>
                    </Link>
                ))}
            </div>
        </section>
    )
}

export default HomePage;