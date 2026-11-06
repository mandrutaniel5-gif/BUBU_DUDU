// Unelte de testare (capitolul următor, resurse infinite, modul cu 2 tab-uri): ascunse în jocul normal.
// Apar doar cu ?dev în adresă (testele automate din tools/teste o pun singure).
export const DEV = (() => { try { return new URLSearchParams(location.search).has('dev'); } catch { return false; } })();
