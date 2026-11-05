// Casele de locuit din lume (vecinii de la tara, satenii): datele lor. Le deseneaza country.ts (tipul 'farmhouse').
// Sta in fisierul lui ca sa-l poata folosi si satul, si campia, fara importuri in cerc.
export interface HouseDef { id: string; gx: number; gy: number; w: number; d: number; h: number; front: 'x' | 'y'; wall: string; roof: string; name?: string }
export const HOUSES: HouseDef[] = [];
