// Exportăm lista pentru a o putea citi din pagina de Istoric
export const istoricStudent = [
  {
    id: "3",
    versiune: "Versiunea 2.0 - Cod sursă și Capitolul 3",
    data: "24 Mai 2026",
    status: "În așteptare",
    feedback: null, // Când e în așteptare, profesorul nu a lăsat încă un comentariu
    fisier: "licenta_v2_cod.zip"
  },
  {
    id: "2",
    versiune: "Versiunea 1.1 - Corecturi arhitectură",
    data: "15 Mai 2026",
    status: "Aprobat",
    feedback: "Corecturile au fost aplicate cu succes. Structura este acum clară. Poți trece la implementarea codului.",
    fisier: "licenta_v1_1.pdf"
  },
  {
    id: "1",
    versiune: "Versiunea 1.0 - Capitolele 1 și 2",
    data: "10 Mai 2026",
    status: "Revizuire",
    feedback: "Introducerea este bună, dar te rog să verifici formatarea cerută de UAIC pentru pagina de titlu. De asemenea, la capitolul 2 mai trebuie detaliată arhitectura aplicației.",
    fisier: "licenta_v1.pdf"
  }
];
// Lista studenților alocați unui profesor pentru ecranul StudentiPage
export const listaStudentiProfesor = [
  {
    id: "101",
    nume: "Andrei Ionescu",
    titluLicenta: "Sistem de automatizare Smart Home cu senzori de mediu",
    status: "Așteaptă revizuire",
    ultimaModificare: "26 Mai 2026",
    an: "Anul 3",
    specializare: "Informatică"
  },
  {
    id: "102",
    nume: "Elena Radu",
    titluLicenta: "Analiza vulnerabilităților de tip XSS în platformele web",
    status: "Aprobat",
    ultimaModificare: "20 Mai 2026",
    an: "Anul 3",
    specializare: "Informatică"
  },
  {
    id: "103",
    nume: "Mihai Popa",
    titluLicenta: "Platformă de management digital pentru agenții de turism",
    status: "Necesită modificări",
    ultimaModificare: "18 Mai 2026",
    an: "Anul 3",
    specializare: "Informatică"
  },
  {
    id: "104",
    nume: "Diana Marin",
    titluLicenta: "Optimizarea algoritmilor de randare în OpenGL",
    status: "Lipsă activitate",
    ultimaModificare: "N/A",
    an: "Anul 3",
    specializare: "Informatică"
  }
];
// Lista tuturor utilizatorilor din platformă pentru ecranul Admin (UsersPage)
export const listaUtilizatori = [
  { id: "u1", nume: "Admin Principal", email: "admin@facultate.ro", rol: "admin", statusCont: "Activ", dataInregistrare: "01 Ian 2026" },
  { id: "u2", nume: "Prof. Adrian Popescu", email: "adrian.popescu@facultate.ro", rol: "prof", statusCont: "Activ", dataInregistrare: "15 Feb 2026" },
  { id: "u3", nume: "Andrei Ionescu", email: "andrei.ionescu@student.ro", rol: "student", statusCont: "Activ", dataInregistrare: "10 Mar 2026" },
  { id: "u4", nume: "Tomescu Paula", email: "maria.vasile@student.ro", rol: "pending", statusCont: "În așteptare", dataInregistrare: "25 Mai 2026" },
  { id: "u5", nume: "George Enescu", email: "george.e@profesor.ro", rol: "pending", statusCont: "În așteptare", dataInregistrare: "26 Mai 2026" }
];

// Lista globală a tuturor licențelor pentru ecranul Admin (ToateLicentelePage)
export const listaToateLicentele = [
  { id: "l1", student: "Andrei Ionescu", coordonator: "Prof. Adrian Popescu", titlu: "Sistem de automatizare Smart Home cu senzori de mediu", status: "În progres", an: "3" },
  { id: "l2", student: "Elena Radu", coordonator: "Prof. Adrian Popescu", titlu: "Analiza vulnerabilităților de tip XSS", status: "Aprobat Final", an: "3" },
  { id: "l3", student: "Victor Dumitrescu", coordonator: "Prof. Mihaela Stan", titlu: "Aplicație mobilă pentru monitorizare medicală", status: "În progres", an: "3" },
  { id: "l4", student: "Ioana Marin", coordonator: "Prof. Lucian Radu", titlu: "Integrare LLM în procesul de recrutare", status: "Respins", an: "3" }
];
// Date pentru Dashboard (Avizierul principal)
export const anunturiPlatforma = [
  {
    id: "a1",
    titlu: "Termen limită încărcare licență",
    mesaj: "Vă reamintim că termenul final pentru încărcarea documentației complete (inclusiv codul sursă) este 10 Iunie 2026.",
    tip: "important",
    data: "25 Mai 2026"
  },
  {
    id: "a2",
    titlu: "Actualizare Ghid Redactare",
    mesaj: "A fost actualizat ghidul de redactare pentru anul universitar curent. Vă rugăm să verificați noile reguli de citare.",
    tip: "info",
    data: "20 Mai 2026"
  }
];
// Data limită globală stabilită de Admin
export const termenLimitaGlobal = "2026-06-10T23:59:59";