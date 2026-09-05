// État de l'application
const state = {
    currentYear: new Date().getFullYear(),
    currentSemester: new Date().getMonth() < 6 ? 1 : 2, // 1: Jan-Juin, 2: Juil-Déc
    zones: ['A', 'B', 'C', 'Corse', 'Guadeloupe', 'Martinique', 'Guyane', 'Reunion', 'Mayotte', 'NouvelleCaledonie', 'Polynesie', 'WallisEtFutuna', 'SaintPierreEtMiquelon'],
    activeZones: [],
    vacationsData: []
};

const MONTH_NAMES_FR = [
    "JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN",
    "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"
];

const DAY_INITIALS_FR = ["D", "L", "M", "M", "J", "V", "S"];

// --- Gestion des Cookies & Préférences ---


const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'calendrier.dev.fr' ||
    window.location.hostname === '' // si ouvert directement via file://
);

// URL de l'API selon le contexte
const API_URL = isLocalhost
    ? 'http://127.0.0.1:8000/api/vacances'
    : 'https://calendrier-api.atome-dev.fr/api/vacances';

const CACHE_KEY = 'cached_vacances_data';

function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`;
    try {
        localStorage.setItem(name, value);
    } catch (e) {
        // Fallback si localStorage non disponible
    }
}

function getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(cname) === 0) {
            return c.substring(cname.length, c.length);
        }
    }
    try {
        return localStorage.getItem(name);
    } catch (e) {
        return null;
    }
}

function loadSavedZones() {
    const saved = getCookie('calendar_active_zones');
    if (saved) {
        try {
            state.activeZones = JSON.parse(saved);
        } catch (e) {
            state.activeZones = state.zones;
        }
    } else {
        state.activeZones = state.zones;
    }

    // Mise à jour de l'état des checkboxes dans l'IHM
    state.zones.forEach(zone => {
        const checkbox = document.getElementById(`checkZone${zone}`);
        if (checkbox) {
            checkbox.checked = state.activeZones.includes(zone);
        }
    });
}

function saveActiveZones() {
    setCookie('calendar_active_zones', JSON.stringify(state.activeZones));
}

// --- Mode d'affichage (classique / moderne) ---

const THEME_KEY = 'calendar_theme';

function applyTheme(theme) {
    if (theme === 'modern') {
        document.documentElement.dataset.theme = 'modern';
    } else {
        delete document.documentElement.dataset.theme;
    }

    document.querySelectorAll('.mode-btn').forEach(btn => {
        const isOn = btn.dataset.themeValue === theme;
        btn.classList.toggle('is-on', isOn);
        btn.setAttribute('aria-pressed', String(isOn));
    });
}

function setupThemeSwitch() {
    applyTheme(getCookie(THEME_KEY) === 'modern' ? 'modern' : 'classic');

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            applyTheme(btn.dataset.themeValue);
            setCookie(THEME_KEY, btn.dataset.themeValue);
        });
    });
}

// --- Calcul des Jours Fériés Français (Mobiles et Fixes) ---

function getFrenchHolidays(year) {
    const holidays = {};

    // Fêtes fixes
    holidays[`${year}-01-01`] = "JOUR DE L'AN";
    holidays[`${year}-05-01`] = "FÊTE DU TRAVAIL";
    holidays[`${year}-05-08`] = "VICTOIRE 1945";
    holidays[`${year}-07-14`] = "FÊTE NATIONALE";
    holidays[`${year}-08-15`] = "ASSOMPTION";
    holidays[`${year}-11-01`] = "TOUSSAINT";
    holidays[`${year}-11-11`] = "ARMISTICE 1918";
    holidays[`${year}-12-25`] = "NOËL";

    // Calcul de la date de Pâques (Algorithme de Butcher / Meeus)
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31); // 3: Mars, 4: Avril
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    const easter = new Date(year, month - 1, day);

    // Lundi de Pâques (+1 jour)
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    holidays[formatDateKey(easterMonday)] = "L. DE PÂQUES";

    // Ascension (+39 jours)
    const ascension = new Date(easter);
    ascension.setDate(easter.getDate() + 39);
    holidays[formatDateKey(ascension)] = "ASCENSION";

    // Lundi de Pentecôte (+50 jours)
    const pentecostMonday = new Date(easter);
    pentecostMonday.setDate(easter.getDate() + 50);
    holidays[formatDateKey(pentecostMonday)] = "L. PENTECÔTE";

    return holidays;
}

function formatDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// Calcul du numéro de semaine ISO-8601
function getISOWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

// Vérification si un jour est en vacances pour une zone donnée
function isDateInVacation(dateStr, zone) {
    return state.vacationsData.some(period => {
        return period.zone === zone && dateStr >= period.debut && dateStr <= period.fin;
    });
}

// --- Rendu du Calendrier ---
async function chargerVacances() {
}

function afficherMessageErreur(message) {
    let banner = document.getElementById('error-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'error-banner';
        banner.setAttribute('role', 'alert');
        banner.style.cssText = 'background:#fdecea;color:#611a15;border:1px solid #f5c6cb;padding:0.75rem 1rem;margin:0.5rem auto;max-width:1200px;border-radius:4px;text-align:center;';
        const grid = document.getElementById('calendarGrid');
        grid.parentNode.insertBefore(banner, grid);
    }
    banner.textContent = message;
    banner.style.display = 'block';
}

async function loadVacationsData() {
    try {
        // 1. Tentative d'appel à l'API avec un timeout court (ex: 5 secondes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(API_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();

        // 2. Succès : on enregistre les données dans le cache local
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        console.info('Données récupérées en direct depuis l\'API.');
        state.vacationsData = data.periodes || [];

    } catch (error) {
        console.warn(`L'API est indisponible (${error.message}). Tentative de récupération depuis le cache local...`);

        // 4. Échec : on cherche dans le cache local
        const cachedData = localStorage.getItem(CACHE_KEY);

        if (cachedData) {
            const data = JSON.parse(cachedData);
            console.info('Données chargées depuis le cache local.');

            // Affichage du calendrier avec les données en cache
            state.vacationsData = data.periodes || [];

        } else {
            // Aucun cache disponible (première visite ET API en panne)
            console.error('Aucune donnée en cache disponible.');
            afficherMessageErreur('Impossible de charger les données du calendrier.');
        }
    }
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const calendarTitle = document.getElementById('calendarTitle');
    const semesterSubtitle = document.getElementById('semesterSubtitle');
    //const currentYearDisplay = document.getElementById('currentYearDisplay');

    calendarTitle.textContent = `Calendrier ${state.currentYear}`;
    //currentYearDisplay.textContent = `${state.currentYear}`;
    semesterSubtitle.textContent = `Semestre ${state.currentSemester}`;

    grid.innerHTML = '';

    const startMonth = (state.currentSemester - 1) * 6; // 0 (Janvier) ou 6 (Juillet)
    const holidays = getFrenchHolidays(state.currentYear);
    const today = new Date();
    const todayStr = formatDateKey(today);

    // Détermination de l'alignement des sous-colonnes actives de vacances
    // Règle du CDC : chaque zone sélectionnée conserve sa colonne fixe
    const activeSelectedZones = state.zones.filter(z => state.activeZones.includes(z));

    for (let m = startMonth; m < startMonth + 6; m++) {
        const monthCol = document.createElement('div');
        monthCol.className = 'month-column';

        // En-tête du mois
        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-header';
        monthHeader.textContent = MONTH_NAMES_FR[m];
        monthCol.appendChild(monthHeader);

        const daysList = document.createElement('div');
        daysList.className = 'days-list';

        const daysInMonth = new Date(state.currentYear, m + 1, 0).getDate();

        // 31 lignes par colonne pour alignement parfait style mural
        for (let dayNum = 1; dayNum <= 31; dayNum++) {
            const dayRow = document.createElement('div');
            dayRow.className = 'day-row';

            if (dayNum <= daysInMonth) {
                const dateObj = new Date(state.currentYear, m, dayNum);
                const dayOfWeek = dateObj.getDay(); // 0 = Dimanche, 1 = Lundi, ...
                const dateKey = formatDateKey(dateObj);
                const monthDayKey = `${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

                // Classes spéciales de style
                if (dayOfWeek === 6) dayRow.classList.add('saturday');
                if (dayOfWeek === 0) dayRow.classList.add('sunday');
                if (holidays[dateKey]) dayRow.classList.add('holiday');
                if (dateKey === todayStr) dayRow.classList.add('today');

                // --- 1. Sous-colonnes continues pour les vacances scolaires ---
                if (activeSelectedZones.length > 0) {
                    const vacContainer = document.createElement('div');
                    vacContainer.className = 'vacation-slots';

                    activeSelectedZones.forEach(zone => {
                        const slot = document.createElement('div');
                        slot.className = 'vacation-slot';
                        if (isDateInVacation(dateKey, zone)) {
                            slot.classList.add(`vac-${zone}`);
                        }
                        vacContainer.appendChild(slot);
                    });
                    dayRow.appendChild(vacContainer);
                }

                // --- 2. Numéro du jour ---
                const numSpan = document.createElement('span');
                numSpan.className = 'day-num';
                numSpan.textContent = dayNum;
                dayRow.appendChild(numSpan);

                // --- 3. Initiale du jour de la semaine ---
                const letterSpan = document.createElement('span');
                letterSpan.className = 'day-letter';
                letterSpan.textContent = DAY_INITIALS_FR[dayOfWeek];
                dayRow.appendChild(letterSpan);

                // --- 4. Nom de la fête / Saint / Jour férié ---
                const saintSpan = document.createElement('span');
                saintSpan.className = 'day-saint';
                let saintName = holidays[dateKey] || SAINTS_DATA[monthDayKey] || "";
                saintSpan.textContent = saintName;
                saintSpan.title = `${dayNum} ${MONTH_NAMES_FR[m]} - ${saintName}`;
                dayRow.appendChild(saintSpan);

                // --- 5. Numéro de semaine (uniquement le Lundi) ---
                const weekSpan = document.createElement('span');
                weekSpan.className = 'week-num';
                if (dayOfWeek === 1) { // Lundi
                    weekSpan.textContent = getISOWeekNumber(dateObj);
                }
                dayRow.appendChild(weekSpan);

            } else {
                // Ligne vide pour compléter le mois à 31 jours
                dayRow.classList.add('empty');
            }

            daysList.appendChild(dayRow);
        }

        monthCol.appendChild(daysList);
        grid.appendChild(monthCol);
    }
}

// --- Navigation & Événements ---

function changeSemester(delta) {
    state.currentSemester += delta;
    if (state.currentSemester > 2) {
        state.currentSemester = 1;
        state.currentYear += 1;
    } else if (state.currentSemester < 1) {
        state.currentSemester = 2;
        state.currentYear -= 1;
    }
    renderCalendar();
}

function setupEventListeners() {
    document.getElementById('btnPrev').addEventListener('click', () => changeSemester(-1));
    document.getElementById('btnNext').addEventListener('click', () => changeSemester(1));

    // Gestion des cases à cocher des zones
    state.zones.forEach(zone => {
        const checkbox = document.getElementById(`checkZone${zone}`);
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (!state.activeZones.includes(zone)) {
                        state.activeZones.push(zone);
                    }
                } else {
                    state.activeZones = state.activeZones.filter(z => z !== zone);
                }
                saveActiveZones();
                renderCalendar();
            });
        }
    });

    // Raccourcis clavier (Flèches gauche / droite)
    window.addEventListener('keydown', (e) => {
        if (e.key === "ArrowLeft") changeSemester(-1);
        if (e.key === "ArrowRight") changeSemester(1);
    });
}

// ================= Gestion de la Popup d'Informations =================
const modal = document.getElementById('info-modal');
const btnOpen = document.getElementById('btn-open-info');
const btnClose = document.getElementById('btn-close-info');
const btnCloseFooter = document.getElementById('btn-close-info-footer');

const openModal = () => {
    modal.classList.add('is-visible');
    modal.setAttribute('aria-hidden', 'false');
};

const closeModal = () => {
    modal.classList.remove('is-visible');
    modal.setAttribute('aria-hidden', 'true');
};

if (btnOpen) btnOpen.addEventListener('click', openModal);
if (btnClose) btnClose.addEventListener('click', closeModal);
if (btnCloseFooter) btnCloseFooter.addEventListener('click', closeModal);

// Fermeture en cliquant sur l'arrière-plan flouté
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Fermeture avec la touche Échap
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-visible')) {
        closeModal();
    }
});


// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    setupThemeSwitch();
    loadSavedZones();
    await loadVacationsData();
    setupEventListeners();
    renderCalendar();
});