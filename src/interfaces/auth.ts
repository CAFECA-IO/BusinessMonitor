export interface IAuthenticator {
  id: string;
  credentialID: string;
  credentialPublicKey: string;
  label: string | null;
  createdAt: string;
  counter: string;
  verificationStatus?: 'idle' | 'loading' | 'verified' | 'failed';
}

export interface IExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  photo?: string | null;
  blockchainAddress?: string | null;
  initPublicKey?: unknown;
  deploymentSalt?: string | null;
  authenticators?: IAuthenticator[];
}
