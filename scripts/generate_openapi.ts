import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { CompanySchema, PaginationSchema } from '../src/validators';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// Info: (20250808 - Tzuhan) 1) 註冊 Zod schema 到 registry（自動成為 components.schemas.Company, components.schemas.Pagination）
const CompanyRef = registry.register('Company', CompanySchema);
const PaginationRef = registry.register('Pagination', PaginationSchema);

// Info: (20250808 - Tzuhan) 2) 路由宣告直接用 Zod（產生器會自動 $ref）
registry.registerPath({
  method: 'get',
  path: '/api/v1/companies/{registrationNo}',
  summary: 'Get company by registration number',
  request: {
    params: z.object({
      registrationNo: z
        .string()
        .min(1)
        .openapi({
          param: { name: 'registrationNo', in: 'path', required: true },
        }),
    }),
  },
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: CompanyRef } },
    },
    404: { description: 'Not Found' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/companies',
  summary: 'List companies',
  request: { query: PaginationRef },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: z
            .object({
              items: z.array(CompanyRef),
              total: z.number().int(),
            })
            .openapi('ListCompaniesResponse'),
        },
      },
    },
  },
});

const generator = new OpenApiGeneratorV31(registry.definitions);
const doc = generator.generateDocument({
  openapi: '3.1.0',
  info: { title: 'BusinessMonitor API', version: '1.0.0' },
  servers: [{ url: 'https://api.businessmonitor.com' }],
});

process.stdout.write(JSON.stringify(doc, null, 2));
