export type UserMember = {
  id: number;
  userId: string;
  firstName: string;
  lastName: string;
  birthDate: string | Date;
  gender: "male" | "female";
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
  relationshipToUser: "CHILD" | "PARTNER" | "GUARDIAN" | "OTHER";
  createdAt: string | Date;
  updatedAt: string | Date;
};
