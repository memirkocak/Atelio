import { z } from "zod";

import { passwordRule } from "@/features/auth/schemas";

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Saisissez votre nom (2 caractères minimum).")
    .max(80, "80 caractères maximum."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Saisissez votre mot de passe actuel."),
    password: passwordRule,
    confirmPassword: z.string().min(1, "Confirmez le nouveau mot de passe."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas.",
  })
  .refine((v) => v.password !== v.currentPassword, {
    path: ["password"],
    message: "Le nouveau mot de passe doit être différent de l’actuel.",
  });

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Saisissez votre mot de passe pour confirmer."),
});

export type ProfileInput = z.input<typeof profileSchema>;
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
export type DeleteAccountInput = z.input<typeof deleteAccountSchema>;
