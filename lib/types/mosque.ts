export type Mosque = {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  timezone: string;
  description?: string | null;
  logoUrl?: string | null;

  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
};
