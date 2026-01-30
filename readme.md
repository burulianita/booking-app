# Booking App – Nail Studio 💅

Egyszerű időpontfoglaló alkalmazás körömstúdió számára.

## Tech stack
- Frontend: React (Vite)
- Backend: PHP (PDO)
- Database: MySQL
- Styling: custom CSS

## Funkciók
- Szolgáltatások listázása
- Kosár kezelés
- Időpontok automatikus generálása
- Ütközésvizsgálat
- Foglalás mentése adatbázisba
- Visszajelzés a sikeres foglalásról

## Projekt struktúra
booking-app/
├── frontend/
│ ├── src/
│ │ ├── pages/
│ │ ├── components/
│ │ ├── store/
│ │ └── api.js
│ └── index.css
└── backend/
├── index.php
├── db.php
├── config.php


## Indítás
### Backend
- XAMPP / Apache + MySQL
- Importáld az adatbázist
- backend/index.php fut

### Frontend
```bash
cd frontend
npm install
npm run dev"# booking-app" 
