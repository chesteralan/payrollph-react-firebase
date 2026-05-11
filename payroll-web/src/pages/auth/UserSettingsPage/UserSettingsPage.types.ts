export interface UserSettingsForm {
  theme: "light" | "dark";
  itemsPerPage: number;
  defaultCompanyId: string;
  currency: string;
  locale: string;
}

export interface UserSettingsPasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
