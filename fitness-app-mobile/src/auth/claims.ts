import { jwtDecode } from 'jwt-decode';

interface IdentityClaims {
  sub?: string;
}

export const getUserId = (idToken: string): string => {
  const subject = jwtDecode<IdentityClaims>(idToken).sub;
  if (!subject) {
    throw new Error('The identity token does not contain a subject.');
  }
  return subject;
};
