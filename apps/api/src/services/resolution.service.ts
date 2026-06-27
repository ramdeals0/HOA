import { ResolutionStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/types';

export const VOTING_MEMBER_ROLES = ['SUPER_ADMIN', 'BOARD', 'MANAGER', 'MEMBER', 'RESIDENT'] as const;
export const BOARD_ROLES = ['SUPER_ADMIN', 'BOARD'] as const;

export function canManageResolutions(role?: string) {
  return role != null && BOARD_ROLES.includes(role as (typeof BOARD_ROLES)[number]);
}

export function canVote(role?: string) {
  return role != null && VOTING_MEMBER_ROLES.includes(role as (typeof VOTING_MEMBER_ROLES)[number]);
}

export function isVotingOpen(
  status: ResolutionStatus,
  opensAt: Date | null,
  closesAt: Date | null,
  now = new Date(),
) {
  if (status !== 'OPEN') {
    return false;
  }
  if (opensAt && opensAt > now) {
    return false;
  }
  if (closesAt && closesAt < now) {
    return false;
  }
  return true;
}

export function canViewResults(status: ResolutionStatus, isBoard: boolean) {
  return status === 'CLOSED' || isBoard;
}

export function buildResultTotals(
  options: Array<{ id: string; label: string; sortOrder: number }>,
  votes: Array<{ optionId: string }>,
) {
  const counts = new Map<string, number>();
  for (const option of options) {
    counts.set(option.id, 0);
  }
  for (const vote of votes) {
    counts.set(vote.optionId, (counts.get(vote.optionId) ?? 0) + 1);
  }

  const totalVotes = votes.length;
  return options
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((option) => {
      const count = counts.get(option.id) ?? 0;
      return {
        optionId: option.id,
        label: option.label,
        count,
        percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
      };
    });
}

const resolutionInclude = {
  author: { select: { id: true, firstName: true, lastName: true } },
  options: { orderBy: { sortOrder: 'asc' as const } },
  votes: {
    select: {
      id: true,
      optionId: true,
      userId: true,
      createdAt: true,
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  },
};

export class ResolutionService {
  async listResolutions(
    tenantId: string,
    filters: { status?: ResolutionStatus; type?: 'RESOLUTION' | 'VIEWPOINT' },
    isBoard: boolean,
  ) {
    const where = {
      tenantId,
      ...(filters.status ? { status: filters.status } : isBoard ? {} : { status: { in: ['OPEN', 'CLOSED'] as ResolutionStatus[] } }),
      ...(filters.type ? { type: filters.type } : {}),
    };

    return prisma.resolution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        options: { orderBy: { sortOrder: 'asc' } },
        votes: {
          select: {
            id: true,
            optionId: true,
            userId: true,
            createdAt: true,
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async getResolution(tenantId: string, resolutionId: string) {
    const resolution = await prisma.resolution.findFirst({
      where: { id: resolutionId, tenantId },
      include: resolutionInclude,
    });
    if (!resolution) {
      throw new AppError(404, 'Resolution not found');
    }
    return resolution;
  }

  async createResolution(
    tenantId: string,
    authorId: string,
    data: {
      title: string;
      description?: string;
      type: 'RESOLUTION' | 'VIEWPOINT';
      opensAt?: Date;
      closesAt?: Date;
      options: Array<{ label: string; sortOrder?: number }>;
    },
  ) {
    return prisma.resolution.create({
      data: {
        tenantId,
        authorId,
        title: data.title,
        description: data.description,
        type: data.type,
        opensAt: data.opensAt,
        closesAt: data.closesAt,
        options: {
          create: data.options.map((option, index) => ({
            label: option.label,
            sortOrder: option.sortOrder ?? index,
          })),
        },
      },
      include: resolutionInclude,
    });
  }

  async updateResolution(
    tenantId: string,
    resolutionId: string,
    data: {
      title?: string;
      description?: string;
      type?: 'RESOLUTION' | 'VIEWPOINT';
      opensAt?: Date | null;
      closesAt?: Date | null;
      options?: Array<{ label: string; sortOrder?: number }>;
    },
  ) {
    const resolution = await this.getResolution(tenantId, resolutionId);
    if (resolution.status !== 'DRAFT' && resolution.status !== 'OPEN') {
      throw new AppError(400, 'Only draft or open resolutions can be edited');
    }
    if (resolution.status === 'OPEN' && data.options) {
      throw new AppError(400, 'Cannot change options after voting has opened');
    }

    if (data.options) {
      await prisma.resolutionOption.deleteMany({ where: { resolutionId } });
    }

    return prisma.resolution.update({
      where: { id: resolutionId },
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        opensAt: data.opensAt,
        closesAt: data.closesAt,
        ...(data.options
          ? {
              options: {
                create: data.options.map((option, index) => ({
                  label: option.label,
                  sortOrder: option.sortOrder ?? index,
                })),
              },
            }
          : {}),
      },
      include: resolutionInclude,
    });
  }

  async setStatus(tenantId: string, resolutionId: string, status: ResolutionStatus) {
    const resolution = await this.getResolution(tenantId, resolutionId);

    if (status === 'OPEN') {
      if (resolution.status !== 'DRAFT') {
        throw new AppError(400, 'Only draft resolutions can be opened');
      }
      if (resolution.options.length < 2) {
        throw new AppError(400, 'At least two options are required');
      }
    }

    if (status === 'CLOSED' && resolution.status !== 'OPEN') {
      throw new AppError(400, 'Only open resolutions can be closed');
    }

    return prisma.resolution.update({
      where: { id: resolutionId },
      data: {
        status,
        ...(status === 'OPEN' && !resolution.opensAt ? { opensAt: new Date() } : {}),
        ...(status === 'CLOSED' && !resolution.closesAt ? { closesAt: new Date() } : {}),
      },
      include: resolutionInclude,
    });
  }

  async castVote(tenantId: string, resolutionId: string, userId: string, optionId: string) {
    const resolution = await this.getResolution(tenantId, resolutionId);

    if (!isVotingOpen(resolution.status, resolution.opensAt, resolution.closesAt)) {
      throw new AppError(400, 'Voting is not open for this item');
    }

    const option = resolution.options.find((item) => item.id === optionId);
    if (!option) {
      throw new AppError(400, 'Invalid option selected');
    }

    return prisma.resolutionVote.upsert({
      where: {
        resolutionId_userId: {
          resolutionId,
          userId,
        },
      },
      create: {
        resolutionId,
        optionId,
        userId,
      },
      update: {
        optionId,
      },
      include: {
        option: true,
      },
    });
  }

  formatResolution(
    resolution: Awaited<ReturnType<ResolutionService['getResolution']>>,
    userId?: string,
    isBoard = false,
  ) {
    const userVote = userId ? resolution.votes.find((vote) => vote.userId === userId) ?? null : null;
    const showResults = canViewResults(resolution.status, isBoard);
    const results = showResults ? buildResultTotals(resolution.options, resolution.votes) : null;

    return {
      id: resolution.id,
      title: resolution.title,
      description: resolution.description,
      type: resolution.type,
      status: resolution.status,
      opensAt: resolution.opensAt,
      closesAt: resolution.closesAt,
      createdAt: resolution.createdAt,
      updatedAt: resolution.updatedAt,
      author: resolution.author,
      options: resolution.options.map((option) => ({
        id: option.id,
        label: option.label,
        sortOrder: option.sortOrder,
      })),
      voteCount: resolution.votes.length,
      userVote: userVote
        ? {
            optionId: userVote.optionId,
            createdAt: userVote.createdAt,
          }
        : null,
      votingOpen: isVotingOpen(resolution.status, resolution.opensAt, resolution.closesAt),
      results,
    };
  }
}

export const resolutionService = new ResolutionService();
