import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreateProfitSharingGroupDto,
  UpdateProfitSharingGroupDto,
  GetProfitSharingGroupsQueryDto,
  CreateProfitSharingMemberDto,
  UpdateProfitSharingMemberDto,
  GetProfitSharingMembersQueryDto,
} from './profit-sharing.dto';
import { AppError } from '../../shared/utils/errors';

const prisma = new PrismaClient();

export class ProfitSharingService {
  // ==================== GRUPOS ====================

  async getProfitSharingGroups(query: GetProfitSharingGroupsQueryDto) {
    const { page = 1, limit = 10, busId, isActive, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProfitSharingGroupWhereInput = {};

    if (busId) {
      where.busId = busId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({
          endDate: {
            gte: new Date(startDate),
          },
        });
      }
      if (endDate) {
        where.AND.push({
          startDate: {
            lte: new Date(endDate),
          },
        });
      }
    }

    const [data, total] = await Promise.all([
      prisma.profitSharingGroup.findMany({
        where,
        skip,
        take: limit,
        include: {
          bus: {
            select: {
              id: true,
              internalCode: true,
              plateNumber: true,
              monthlyTarget: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  nationalId: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.profitSharingGroup.count({ where }),
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

  async getProfitSharingGroupById(id: number) {
    const group = await prisma.profitSharingGroup.findUnique({
      where: { id },
      include: {
        bus: {
          select: {
            id: true,
            internalCode: true,
            plateNumber: true,
            monthlyTarget: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                nationalId: true,
                email: true,
              },
            },
          },
          orderBy: {
            percentage: 'desc',
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!group) {
      throw new AppError('Grupo de reparto no encontrado', 404);
    }

    return group;
  }

  async createProfitSharingGroup(
    data: CreateProfitSharingGroupDto,
    createdBy: number
  ) {
    // Verificar que el bus existe y está activo
    const bus = await prisma.bus.findUnique({
      where: { id: data.busId },
    });

    if (!bus) {
      throw new AppError('Bus no encontrado', 404);
    }

    if (!bus.isActive) {
      throw new AppError('El bus no está activo', 400);
    }

    // Validar fechas
    if (data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (end <= start) {
        throw new AppError('La fecha de fin debe ser posterior a la fecha de inicio', 400);
      }
    }

    // Verificar que no exista un grupo activo para el mismo bus en el mismo período
    const overlappingGroup = await prisma.profitSharingGroup.findFirst({
      where: {
        busId: data.busId,
        isActive: true,
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(data.startDate) } },
              {
                OR: [
                  { endDate: { gte: new Date(data.startDate) } },
                  { endDate: null },
                ],
              },
            ],
          },
          data.endDate
            ? {
                AND: [
                  { startDate: { lte: new Date(data.endDate) } },
                  {
                    OR: [
                      { endDate: { gte: new Date(data.endDate) } },
                      { endDate: null },
                    ],
                  },
                ],
              }
            : {},
        ],
      },
    });

    if (overlappingGroup) {
      throw new AppError(
        'Ya existe un grupo activo para este bus en el período especificado',
        400
      );
    }

    const group = await prisma.profitSharingGroup.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        createdBy,
      },
      include: {
        bus: {
          select: {
            id: true,
            internalCode: true,
            plateNumber: true,
          },
        },
      },
    });

    return group;
  }

  async updateProfitSharingGroup(
    id: string,
    data: UpdateProfitSharingGroupDto
  ) {
    const existing = await prisma.profitSharingGroup.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Grupo de reparto no encontrado', 404);
    }

    // Validar fechas si se están actualizando
    const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
    const endDate = data.endDate !== undefined
      ? (data.endDate ? new Date(data.endDate) : null)
      : existing.endDate;

    if (endDate && endDate <= startDate) {
      throw new AppError('La fecha de fin debe ser posterior a la fecha de inicio', 400);
    }

    const updateData: Prisma.ProfitSharingGroupUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.profitSharingGroup.update({
      where: { id },
      data: updateData,
      include: {
        bus: {
          select: {
            id: true,
            internalCode: true,
            plateNumber: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }

  async deleteProfitSharingGroup(id: number) {
    const existing = await prisma.profitSharingGroup.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!existing) {
      throw new AppError('Grupo de reparto no encontrado', 404);
    }

    // Eliminar en cascada (los miembros se eliminarán automáticamente)
    await prisma.profitSharingGroup.delete({
      where: { id },
    });

    return { success: true };
  }

  // ==================== MIEMBROS ====================

  async getProfitSharingMembers(query: GetProfitSharingMembersQueryDto) {
    const where: Prisma.ProfitSharingMemberWhereInput = {};

    if (query.groupId) where.groupId = query.groupId;
    if (query.userId) where.userId = query.userId;
    if (query.roleInShare) where.roleInShare = query.roleInShare;

    const members = await prisma.profitSharingMember.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            nationalId: true,
            email: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            busId: true,
            startDate: true,
            endDate: true,
            bus: {
              select: {
                internalCode: true,
                plateNumber: true,
              },
            },
          },
        },
      },
      orderBy: {
        percentage: 'desc',
      },
    });

    return members;
  }

  async getProfitSharingMemberById(id: number) {
    const member = await prisma.profitSharingMember.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            nationalId: true,
            email: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            busId: true,
            startDate: true,
            endDate: true,
            bus: {
              select: {
                internalCode: true,
                plateNumber: true,
              },
            },
          },
        },
      },
    });

    if (!member) {
      throw new AppError('Miembro no encontrado', 404);
    }

    return member;
  }

  async createProfitSharingMember(data: CreateProfitSharingMemberDto) {
    // Verificar que el grupo existe
    const group = await prisma.profitSharingGroup.findUnique({
      where: { id: data.groupId },
      include: {
        members: true,
      },
    });

    if (!group) {
      throw new AppError('Grupo de reparto no encontrado', 404);
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Verificar que el usuario no está ya en el grupo
    const existingMember = group.members.find((m) => m.userId === data.userId);
    if (existingMember) {
      throw new AppError('El usuario ya es miembro de este grupo', 400);
    }

    // Calcular el total de porcentajes incluyendo el nuevo miembro
    const currentTotal = group.members.reduce(
      (sum, member) => sum + parseFloat(member.percentage.toString()),
      0
    );
    const newTotal = currentTotal + data.percentage;

    if (newTotal > 100) {
      throw new AppError(
        `La suma de porcentajes excede el 100%. Actual: ${currentTotal}%, Intentando agregar: ${data.percentage}%`,
        400
      );
    }

    const member = await prisma.profitSharingMember.create({
      data: {
        groupId: data.groupId,
        userId: data.userId,
        roleInShare: data.roleInShare,
        percentage: data.percentage,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            nationalId: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return member;
  }

  async updateProfitSharingMember(
    id: number,
    data: UpdateProfitSharingMemberDto
  ) {
    const existing = await prisma.profitSharingMember.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!existing) {
      throw new AppError('Miembro no encontrado', 404);
    }

    // Validar porcentajes si se está actualizando
    if (data.percentage !== undefined) {
      const otherMembersTotal = existing.group.members
        .filter((m) => m.id !== id)
        .reduce((sum, member) => sum + parseFloat(member.percentage.toString()), 0);
      const newTotal = otherMembersTotal + data.percentage;

      if (newTotal > 100) {
        throw new AppError(
          `La suma de porcentajes excede el 100%. Otros miembros: ${otherMembersTotal}%, Intentando asignar: ${data.percentage}%`,
          400
        );
      }
    }

    const updateData: Prisma.ProfitSharingMemberUpdateInput = {};
    if (data.roleInShare) updateData.roleInShare = data.roleInShare;
    if (data.percentage !== undefined) updateData.percentage = data.percentage;

    const updated = await prisma.profitSharingMember.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            nationalId: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updated;
  }

  async deleteProfitSharingMember(id: number) {
    const existing = await prisma.profitSharingMember.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Miembro no encontrado', 404);
    }

    await prisma.profitSharingMember.delete({
      where: { id },
    });

    return { success: true };
  }

  // ==================== CÁLCULOS Y ANÁLISIS ====================

  async getProfitDistribution(groupId: number, startDate?: string, endDate?: string) {
    const group = await this.getProfitSharingGroupById(groupId);

    // Si no se especifican fechas, usar las del grupo
    const periodStart = startDate
      ? new Date(startDate)
      : group.startDate;
    const periodEnd = endDate
      ? new Date(endDate)
      : (group.endDate || new Date());

    // Obtener todas las rutas del bus en el período
    const routes = await prisma.route.findMany({
      where: {
        busId: group.busId,
        routeDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        id: true,
        routeDate: true,
        totalIncome: true,
        totalExpenses: true,
        netIncome: true,
      },
    });

    // Obtener gastos administrativos del período
    const busExpenses = await prisma.busExpense.findMany({
      where: {
        busId: group.busId,
        expenseDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        amount: true,
      },
    });

    // Calcular totales de rutas
    const routeTotals = routes.reduce(
      (acc, route) => ({
        totalIncome: acc.totalIncome + parseFloat(route.totalIncome.toString()),
        totalExpenses: acc.totalExpenses + parseFloat(route.totalExpenses.toString()),
        netIncome: acc.netIncome + parseFloat(route.netIncome.toString()),
      }),
      { totalIncome: 0, totalExpenses: 0, netIncome: 0 }
    );

    // Calcular gastos administrativos
    const administrativeExpenses = busExpenses.reduce(
      (sum, expense) => sum + parseFloat(expense.amount.toString()),
      0
    );

    // Calcular utilidad operacional y neta
    const operationalProfit = routeTotals.netIncome;
    const netProfit = operationalProfit - administrativeExpenses;

    // Calcular distribución por miembro basada en utilidad NETA
    const distribution = group.members.map((member) => {
      const memberPercentage = parseFloat(member.percentage.toString());
      const amount = (netProfit * memberPercentage) / 100;

      return {
        memberId: member.id,
        userId: member.user.id,
        userName: member.user.fullName,
        roleInShare: member.roleInShare,
        percentage: memberPercentage,
        amount: parseFloat(amount.toFixed(2)),
      };
    });

    // Calcular porcentaje total asignado
    const totalPercentageAssigned = group.members.reduce(
      (sum, member) => sum + parseFloat(member.percentage.toString()),
      0
    );

    // Calcular monto no asignado basado en utilidad NETA
    const unassignedPercentage = 100 - totalPercentageAssigned;
    const unassignedAmount = (netProfit * unassignedPercentage) / 100;

    return {
      groupId: group.id,
      groupName: group.name,
      busInfo: {
        id: group.bus.id,
        internalCode: group.bus.internalCode,
        plateNumber: group.bus.plateNumber,
      },
      period: {
        start: periodStart.toISOString().split('T')[0],
        end: periodEnd.toISOString().split('T')[0],
      },
      totals: {
        totalIncome: routeTotals.totalIncome,
        routeExpenses: routeTotals.totalExpenses,
        operationalProfit: parseFloat(operationalProfit.toFixed(2)),
        administrativeExpenses: parseFloat(administrativeExpenses.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2)),
        routesCount: routes.length,
      },
      distribution,
      summary: {
        totalPercentageAssigned,
        unassignedPercentage: parseFloat(unassignedPercentage.toFixed(2)),
        unassignedAmount: parseFloat(unassignedAmount.toFixed(2)),
        totalDistributed: distribution.reduce((sum, d) => sum + d.amount, 0),
      },
    };
  }
}

export const profitSharingService = new ProfitSharingService();
