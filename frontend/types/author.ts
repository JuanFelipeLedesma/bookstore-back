export interface Author {
  id: number;           // si tu backend usa UUID: cambia a string
  name: string;
  description: string;
  image: string;        // URL
  birthDate: string;    // 'YYYY-MM-DD'
}
