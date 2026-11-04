// src/app/navigation.js

import { House, Users, Sprout } from 'lucide-react'

export const navItems = [
    {
        path: "/",
        label: "Home",
        icon: House,
        homeCard: null
    },
    {
        path: "/clients",
        label: "Client Management",
        icon: Users,
        homeCard: {
            title: "Client Management",
            description: "Manage client records"
        }
    },
    {
        path: "/crop-plans",
        label: "Crop Plan Configuration",
        icon: Sprout,
        homeCard: {
            title: "Crop Plans",
            description: "Configure crop inputs"
        }
    }
]