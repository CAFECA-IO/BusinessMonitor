import { z } from 'zod';
import { DecimalString, BigIntString, JsonValue, Id } from './common';

export const CompanySchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  registrationNo: z.string().min(1),
  parentRegNo: z.string().optional(),
  representative: z.string().optional(),
  registrationCountry: z.string().optional(),
  establishedDate: z.string().optional(),
  capitalAmount: DecimalString.optional(), // Info: (20250808 - Tzuhan) Decimal(30,8) -> string
  paidInCapital: DecimalString.optional(), // Info: (20250808 - Tzuhan) Decimal(30,8) -> string
  capitalRanking: z.number().int().optional(),
  address: z.string().optional(),
  websiteUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  registrationAgency: z.string().optional(),
  status: z.string().optional(),
  organizationType: z.string().optional(),
  businessItems: JsonValue.optional(),
  contributions: JsonValue.optional(),
  shareholdingStatus: z.string().optional(),
  sharePrice: DecimalString.optional(),
  totalIssuedShares: BigIntString.optional(), // Info: (20250808 - Tzuhan) BigInt -> string
  multipleVotingRights: z.string().optional(),
  specialVotingRights: z.string().optional(),
  lastChangeDate: z.string().optional(),
  lastApprovedChange: z.string().optional(),
  statusDate: z.string().optional(),
  statusDocNo: z.string().optional(),
  foreignCompanyName: z.string().optional(),
  directors: JsonValue.optional(),
  managers: JsonValue.optional(),
  suspensionStartDate: z.string().optional(),
  suspensionEndDate: z.string().optional(),
  suspensionAgency: z.string().optional(),
  oldBusinessItemsUrl: z.string().optional(),

  // Info: (20250808 - Tzuhan) 關聯不放進核心實體（避免循環 & 脫耦 DB 關聯）
});

export type Company = z.infer<typeof CompanySchema>;
