import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Saisissez votre adresse e-mail.")
  .pipe(z.email("Adresse e-mail invalide."));

/** Règle alignée sur la configuration Supabase (supabase/config.toml). */
export const passwordRule = z
  .string()
  .min(8, "Au moins 8 caractères.")
  .max(72, "72 caractères maximum.")
  .regex(/[A-Za-z]/, "Au moins une lettre.")
  .regex(/\d/, "Au moins un chiffre.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Saisissez votre mot de passe."),
});

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Saisissez votre nom (2 caractères minimum).")
    .max(80, "80 caractères maximum."),
  email,
  password: passwordRule,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password: passwordRule,
    confirmPassword: z.string().min(1, "Confirmez le mot de passe."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas.",
  });

export type SignInInput = z.input<typeof signInSchema>;
export type SignUpInput = z.input<typeof signUpSchema>;
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
