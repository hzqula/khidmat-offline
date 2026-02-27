export type CountdownMinutes = 5 | 10 | 15;

export interface PrayerSettings {
  id: string;
  iqamahCountdownMinutes: CountdownMinutes;
  adhanSoundPath: string;
  iqamahSoundPath: string;
  adhanAlarmEnabled: boolean;
  iqamahAlarmEnabled: boolean;
  salatDurationMinutes: number;
  jumaahKhutbahMinutes: number;
  jumaahSalatDurationMinutes: number;
  createdAt: string;
  updatedAt: string;
}
