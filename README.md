# BillMatrix

A fintech billing and transaction management system built with ASP.NET Core, designed to handle invoice generation, transaction tracking, and payment management in one platform.

## Features

- **Billing & Invoice Generation** – Create and manage bills/invoices
- **Transaction Tracking** – Maintain a ledger of transactions
- **Payment Management** – Track and manage customer payments
- **Real-time Updates** – Uses SignalR for live data updates across the app

## Tech Stack

- **Backend:** ASP.NET Core (C#)
- **Database:** SQL Server
- **Real-time communication:** SignalR
- **Architecture:** Layered structure (Controllers, Domain, Infrastructure) following separation of concerns

## Project Structure

```
BillMatrix/
├── Application/       # Application logic
├── Controllers/        # API/MVC controllers
├── Domain/              # Core business models
├── Hubs/                  # SignalR hubs for real-time features
├── Infrastructure/    # Data access, external services
├── Properties/          # Project configuration
└── wwwroot/              # Static frontend assets
```

## Status

Currently running locally; not yet deployed. Built as a hands-on project to explore backend architecture patterns (layered/domain-driven design) applicable to fintech systems.

## Why I built this

I'm interested in fintech and backend engineering, and wanted to understand how real-world billing and payment systems are structured under the hood — from database design to real-time transaction updates.

## Author

Vishesh Patel
