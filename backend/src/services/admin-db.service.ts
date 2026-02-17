import prisma from '@/db/client';
import { ApiError } from '@/types';

type PrismaDelegate = {
    findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
    findUnique: (args: Record<string, unknown>) => Promise<unknown>;
    update: (args: Record<string, unknown>) => Promise<unknown>;
    delete: (args: Record<string, unknown>) => Promise<unknown>;
    count: (args?: Record<string, unknown>) => Promise<number>;
};

const MODEL_MAP: Record<string, PrismaDelegate> = {
    user: prisma.user as unknown as PrismaDelegate,
    recipe: prisma.recipe as unknown as PrismaDelegate,
    plan: prisma.plan as unknown as PrismaDelegate,
    condition: prisma.condition as unknown as PrismaDelegate,
    metricLog: prisma.metricLog as unknown as PrismaDelegate,
    groceryItem: prisma.groceryItem as unknown as PrismaDelegate,
    feedback: prisma.feedback as unknown as PrismaDelegate,
    nutrientLimit: prisma.nutrientLimit as unknown as PrismaDelegate,
    ingredientExclusion: prisma.ingredientExclusion as unknown as PrismaDelegate,
    restaurantItem: prisma.restaurantItem as unknown as PrismaDelegate,
    session: prisma.session as unknown as PrismaDelegate,
    account: prisma.account as unknown as PrismaDelegate,
    userRecipe: prisma.userRecipe as unknown as PrismaDelegate,
    verification: prisma.verification as unknown as PrismaDelegate,
};

const SEARCHABLE_FIELDS: Record<string, string[]> = {
    user: ['name', 'email'],
    recipe: ['name', 'category', 'description'],
    plan: ['userId'],
    condition: ['slug', 'label', 'description'],
    metricLog: ['type', 'tag'],
    groceryItem: ['name', 'category'],
    feedback: ['type', 'message', 'userEmail'],
    nutrientLimit: ['nutrient', 'limitType'],
    ingredientExclusion: ['additiveCategory', 'ingredientRegex'],
    restaurantItem: ['chainName', 'itemName'],
    session: ['userId'],
    account: ['userId', 'providerId'],
    userRecipe: ['userId', 'recipeId'],
    verification: ['identifier'],
};

const DANGEROUS_KEYWORDS = [
    'DROP', 'ALTER', 'TRUNCATE', 'CREATE', 'ATTACH', 'DETACH', 'PRAGMA',
];

function getDelegate(model: string): PrismaDelegate {
    const delegate = MODEL_MAP[model];
    if (!delegate) {
        throw new ApiError(400, `Unknown model: ${model}. Valid models: ${Object.keys(MODEL_MAP).join(', ')}`);
    }
    return delegate;
}

export class AdminDbService {
    getAvailableModels(): string[] {
        return Object.keys(MODEL_MAP);
    }

    async list(
        model: string,
        page: number = 1,
        limit: number = 25,
        sort: string = 'id',
        order: 'asc' | 'desc' = 'desc',
        search?: string
    ) {
        const delegate = getDelegate(model);
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (search) {
            const fields = SEARCHABLE_FIELDS[model] || [];
            if (fields.length > 0) {
                where.OR = fields.map(field => ({
                    [field]: { contains: search },
                }));
            }
        }

        const [data, total] = await Promise.all([
            delegate.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sort]: order },
            }),
            delegate.count({ where }),
        ]);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getById(model: string, id: string) {
        const delegate = getDelegate(model);

        const record = await delegate.findUnique({ where: { id } });
        if (!record) {
            throw new ApiError(404, `${model} with id ${id} not found`);
        }

        return record;
    }

    async update(model: string, id: string, data: Record<string, unknown>) {
        getDelegate(model);

        // Remove fields that shouldn't be updated
        const cleanData = { ...data };
        delete cleanData.id;
        delete cleanData.createdAt;

        const delegate = getDelegate(model);
        const record = await delegate.update({
            where: { id },
            data: cleanData,
        });

        return record;
    }

    async deleteRecord(model: string, id: string) {
        const delegate = getDelegate(model);

        await delegate.delete({ where: { id } });
        return { deleted: true };
    }

    async executeQuery(sql: string, allowWrite: boolean = false) {
        const trimmed = sql.trim();
        const upperSQL = trimmed.toUpperCase();

        // Block dangerous keywords
        for (const keyword of DANGEROUS_KEYWORDS) {
            if (upperSQL.includes(keyword)) {
                throw new ApiError(400, `Blocked: SQL contains dangerous keyword '${keyword}'`);
            }
        }

        const isSelect = upperSQL.startsWith('SELECT');
        const isWrite = upperSQL.startsWith('INSERT') ||
            upperSQL.startsWith('UPDATE') ||
            upperSQL.startsWith('DELETE');

        if (!isSelect && !isWrite) {
            throw new ApiError(400, 'Only SELECT, INSERT, UPDATE, and DELETE queries are allowed');
        }

        if (isWrite && !allowWrite) {
            throw new ApiError(400, 'Write queries require allowWrite flag to be enabled');
        }

        if (isSelect) {
            const rows = await prisma.$queryRawUnsafe(trimmed);
            // Convert BigInts to numbers for JSON serialization
            const serialized = JSON.parse(JSON.stringify(rows, (_key, value) =>
                typeof value === 'bigint' ? Number(value) : value
            ));
            return { type: 'select', rows: serialized, rowCount: serialized.length };
        }

        const affected = await prisma.$executeRawUnsafe(trimmed);
        return { type: 'write', affectedRows: affected };
    }
}

export const adminDbService = new AdminDbService();
