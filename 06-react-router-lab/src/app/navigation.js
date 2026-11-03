// src/app/navigation.js

export const navItems = [
    {
        path: "/",
        label: "Home",
        homeCard: null
    },
    {
        path: "/clients",
        label: "Client Management",
        homeCard: {
            title: "Client Management",
            description: "Manage client records"
        }
    },
    {
        path: "/crop-plans",
        label: "Crop Plan Configuration",
        homeCard: {
            title: "Crop Plans",
            description: "Configure crop inputs"
        }
    }
]