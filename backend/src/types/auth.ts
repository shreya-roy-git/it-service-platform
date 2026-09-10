export interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}
