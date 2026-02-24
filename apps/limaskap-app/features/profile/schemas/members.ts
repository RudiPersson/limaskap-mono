import { z } from "zod";

export const profileMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  birthDate: z
    .string()
    .min(1, "Birth date is required")
    .refine((date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime()) && parsedDate < new Date();
    }, "Please enter a valid birth date"),
  gender: z.enum(["male", "female"], {
    message: "Please select a gender",
  }),
  addressLine1: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  relationshipToUser: z.enum(["CHILD", "PARTNER", "GUARDIAN", "OTHER"], {
    message: "Please select a relationship",
  }),
});
